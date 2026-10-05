import { NextRequest, NextResponse } from 'next/server';
import { CandidateProfile, ChatMessage } from '@/types/interview';
import { getSystemPromptForInterview } from '@/lib/ai/prompts';

const PROFANITY_WORDS = [
  'anjing', 'babi', 'bangsat', 'kontol', 'memek', 'goblok', 'tolol', 
  'tai', 'bajingan', 'kampret', 'brengsek', 'perek', 'sialan', 'bodoh', 
  'idiot', 'fak', 'fuck', 'shit', 'bitch', 'asshole', 'pantek', 'asu'
];

const DISMISSIVE_PHRASES = [
  'tidak ada', 'gak ada', 'ga ada', 'nggak ada', 'tidak', 'gak', 'ga', 
  'skip', 'pass', 'males', 'gatau', 'gak tau', 'nggak tau', 'entah', 'no', 'nope'
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      profile, 
      messages, 
      groqApiKey: clientGroqKey, 
      groqModel: clientGroqModel 
    }: { 
      profile: CandidateProfile; 
      messages: ChatMessage[]; 
      groqApiKey?: string; 
      groqModel?: string; 
    } = body;

    if (!profile) {
      return NextResponse.json({ error: 'Profile is required' }, { status: 400 });
    }

    const groqKey = clientGroqKey || process.env.GROQ_API_KEY;
    const selectedModel = clientGroqModel || 'llama-3.3-70b-versatile';
    const systemPrompt = getSystemPromptForInterview(profile);

    // 1. If Groq API Key is provided, use Open-Source LLaMA 3.3 / LLaMA 3.1
    if (groqKey) {
      try {
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        ];

        // If no user messages yet (initial greeting), prompt the model to speak first
        if (messages.length === 0) {
          groqMessages.push({
            role: 'user',
            content: `Sesi wawancara baru dimulai. Silakan perkenalkan diri Anda secara singkat sebagai pewawancara (${profile.selectedMode === 'hrd' ? 'Sarah - HR Recruiter' : 'Alex - Senior Tech Lead'}), sapa kandidat ${profile.name}, dan ajukan 1 pertanyaan pembuka yang relevan dengan CV/posisi ${profile.targetRole}.`,
          });
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey.trim()}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 300,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ reply: reply.trim() });
          }
        } else {
          const errData = await res.text();
          console.warn('Groq API error response:', errData);
        }
      } catch (groqErr) {
        console.warn('Failed calling Groq Cloud LLM:', groqErr);
      }
    }

    // 2. Try Local Ollama if available
    try {
      const ollamaRes = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map((m) => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text,
            })),
          ],
          stream: false,
        }),
      });

      if (ollamaRes.ok) {
        const oData = await ollamaRes.json();
        if (oData.message?.content) {
          return NextResponse.json({ reply: oData.message.content.trim() });
        }
      }
    } catch {
      // Local Ollama not running, proceed to Smart Contextual Heuristic Engine
    }

    // 3. Smart Human-Like Contextual Engine (When LLM API is not configured)
    const userMessages = messages.filter((m) => m.sender === 'user');
    const aiMessages = messages.filter((m) => m.sender === 'ai');
    const lastUserText = (userMessages[userMessages.length - 1]?.text || '').trim().toLowerCase();
    const lastAiText = (aiMessages[aiMessages.length - 1]?.text || '').toLowerCase();
    const isHrd = profile.selectedMode === 'hrd';

    // A. Detect Profanity / Rude / Inappropriate words
    const containsProfanity = PROFANITY_WORDS.some((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(lastUserText)
    );

    if (containsProfanity) {
      if (isHrd) {
        return NextResponse.json({
          reply: `Mohon maaf ${profile.name}, pemilihan kata seperti itu sangat tidak etis dan tidak profesional dalam suasana wawancara kerja. Kami di perusahaan mengutamakan budaya saling menghargai dan integritas. Apakah Anda ingin mengulangi jawaban Anda dengan bahasa yang lebih profesional?`,
        });
      } else {
        return NextResponse.json({
          reply: `Sebagai tim engineering, kami sangat mengedepankan komunikasi profesional dan respek antarrekan kerja. Bahasa tersebut tidak dapat kami toleransi dalam diskusi teknis. Mohon jaga profesionalisme jika ingin melanjutkan sesi ini.`,
        });
      }
    }

    // B. Detect Dismissive / Refusal / "Tidak ada" / "Gak tau"
    const isDismissive = DISMISSIVE_PHRASES.some(
      (phrase) => lastUserText === phrase || lastUserText.startsWith(`${phrase} `) || lastUserText.endsWith(` ${phrase}`)
    );

    if (isDismissive) {
      if (lastAiText.includes('pertanyaan') || lastAiText.includes('tanyakan')) {
        return NextResponse.json({
          reply: `Baik ${profile.name}, jika memang tidak ada pertanyaan lagi mengenai tim atau budaya perusahaan kami, berarti seluruh rangkaian sesi wawancara telah selesai. Terima kasih banyak atas kehadiran dan waktu Anda hari ini. Kita bisa langsung melihat hasil evaluasi wawancara Anda.`,
        });
      }

      if (isHrd) {
        return NextResponse.json({
          reply: `Saya perhatikan Anda tidak memberikan penjelasan lebih lanjut atau menjawab dengan sangat singkat. Dalam wawancara HR, kemampuan Anda mengelaborasi pengalaman sangat menentukan penilaian kompetensi. Apakah ada pengalaman atau contoh lain yang ingin Anda bagikan?`,
        });
      } else {
        return NextResponse.json({
          reply: `Jawaban tersebut belum memberikan gambaran mengenai pemahaman teknis atau logika problem solving Anda. Bisa coba jelaskan secara konkret pendekatan atau konsep teknis yang Anda pahami seputar topik ini?`,
        });
      }
    }

    // C. Detect Candidate Asking a Question (contains '?', 'kenapa', 'apakah', 'bagaimana', 'gaji', 'budaya', 'tech stack')
    const isAskingQuestion =
      lastUserText.includes('?') ||
      /\b(apakah|bagaimana|berapa|kenapa|apa saja|gaji|budaya|tech stack|teknologi|kultur)\b/i.test(lastUserText);

    if (isAskingQuestion && userMessages.length > 0) {
      if (lastUserText.includes('budaya') || lastUserText.includes('kultur') || lastUserText.includes('tim')) {
        return NextResponse.json({
          reply: `Pertanyaan yang bagus sekali! Budaya tim kami sangat kolaboratif, terbuka terhadap ide baru, dan mendukung continuous learning melalui sharing session mingguan. Nah, dari apa yang Anda dengar, bagaimana Anda melihat diri Anda beradaptasi di lingkungan seperti itu?`,
        });
      }
      if (lastUserText.includes('tech stack') || lastUserText.includes('teknologi') || lastUserText.includes('alat')) {
        return NextResponse.json({
          reply: `Di tim kami, kami menggunakan arsitektur modern berbasis microservices, cloud native (Kubernetes/Docker), serta frontend React/Next.js dan backend Go/Node.js yang teruji. Bagaimana kesiapan Anda jika diminta mempelajari teknologi baru dalam waktu singkat?`,
        });
      }
      if (lastUserText.includes('gaji') || lastUserText.includes('benefit') || lastUserText.includes('kompensasi')) {
        return NextResponse.json({
          reply: `Terkait paket kompensasi dan benefit, perusahaan kami menawarkan standar industri yang kompetitif berdasarkan hasil evaluasi teknis dan pengalaman Anda. Boleh tahu berapa ekspektasi rentang gaji yang Anda harapkan untuk posisi ${profile.targetRole} ini?`,
        });
      }
      // General question response
      return NextResponse.json({
        reply: `Terima kasih atas pertanyaannya. Di perusahaan kami, kami sangat mengapresiasi kandidat yang proaktif dan memiliki rasa ingin tahu yang tinggi. Untuk topik tersebut, tim manajemen selalu memastikan transparansi dan fleksibilitas kerja. Selain itu, ada hal lain yang ingin Anda diskusikan?`,
      });
    }

    // D. Multi-Turn Progression that NEVER Repeats Questions
    const userTurnCount = userMessages.length;

    if (isHrd) {
      const hrdTurns = [
        `Halo ${profile.name || 'Kandidat'}! Senang sekali bertemu dengan Anda hari ini untuk posisi ${profile.targetRole}. Boleh ceritakan sedikit tentang latar belakang Anda dan apa motivasi terbesar Anda melamar di posisi ini?`,
        `Terima kasih atas ceritanya yang menarik. Bisa ceritakan salah satu situasi tersulit saat Anda menghadapi konflik perbedaan pendapat dengan rekan kerja atau atasan? Bagaimana Anda menyelesaikannya secara profesional?`,
        `Pendekatan yang bijak. Sekarang, boleh ceritakan tentang sebuah kegagalan atau kesalahan yang pernah Anda lakukan dalam pekerjaan atau proyek sebelumnya, serta pelajaran berharga apa yang Anda dapatkan dari situ?`,
        `Menarik sekali refleksinya. Jika Anda dihadapkan pada situasi di mana Anda harus menyelesaikan 3 tugas penting dengan tenggat waktu yang sama di akhir hari kerja, bagaimana strategi Anda mengatur prioritas?`,
        `Bagus sekali penjelasannya. Dari sisi visi karier, apa target profesional yang ingin Anda capai dalam 2 hingga 3 tahun ke depan bersama perusahaan ini?`,
        `Terima kasih atas pemaparan yang sangat komprehensif hari ini. Sebelum kita akhiri, adakah pertanyaan yang ingin Anda tanyakan kepada saya mengenai tim, budaya kerja, atau tahapan berikutnya?`,
      ];

      const reply = hrdTurns[Math.min(userTurnCount, hrdTurns.length - 1)];
      return NextResponse.json({ reply });
    } else {
      // Technical Mode Progression
      const techTurns = [
        `Halo ${profile.name || 'Kandidat'}, selamat datang di sesi Technical Interview untuk posisi ${profile.targetRole}. Untuk pemanasan, bisa ceritakan arsitektur atau proyek teknis paling menantang yang pernah Anda kembangkan sesuai CV Anda?`,
        `Menarik. Ketika sistem tersebut mulai menangani lonjakan traffic atau data yang besar, bagaimana strategi Anda dalam optimasi performa, database indexing, caching, serta menangani concurrency atau race condition?`,
        `Pendekatan yang solid. Bagaimana Anda mengelola error handling, monitoring log, dan automated testing untuk memastikan deployment ke production tidak mengalami downtime?`,
        `Bisa berikan contoh konkret ketika Anda harus memilih trade-off teknis antara kecepatan delivery fitur versus technical debt atau clean architecture? Apa keputusan yang Anda ambil saat itu?`,
        `Bagus sekali penjelasannya. Jika terjadi insiden kritis di mana API utama mengalami latency tinggi (slow response) di server production, langkah debugging sistematis apa yang pertama kali Anda lakukan?`,
        `Terima kasih atas penjelasan teknis yang komprehensif dan sistematis. Apakah ada aspek arsitektur, tools, atau teknologi terkini yang ingin Anda tanyakan seputar engineering di tim kami?`,
      ];

      const reply = techTurns[Math.min(userTurnCount, techTurns.length - 1)];
      return NextResponse.json({ reply });
    }
  } catch (error) {
    console.error('Interview chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat response' }, { status: 500 });
  }
}
