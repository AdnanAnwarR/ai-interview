import { NextRequest, NextResponse } from 'next/server';
import { chatRequestSchema } from '@/lib/validations/interview';
import { generateClaudeInterviewReply } from '@/lib/ai/anthropic';
import { getSystemPromptForInterview } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/ratelimit';

const PROFANITY_WORDS = [
  'anjing', 'babi', 'bangsat', 'kontol', 'memek', 'goblok', 'tolol', 
  'tai', 'bajingan', 'kampret', 'brengsek', 'perek', 'sialan', 'bodoh', 
  'idiot', 'fak', 'fuck', 'shit', 'bitch', 'asshole', 'pantek', 'asu', 'bego'
];

const DISMISSIVE_PHRASES = [
  'tidak ada', 'gak ada', 'ga ada', 'nggak ada', 'tidak', 'gak', 'ga', 
  'skip', 'pass', 'males', 'gatau', 'gak tau', 'nggak tau', 'entah', 'no', 'nope',
  'sudah cukup', 'cukup', 'selesai'
];

// Helper to determine if an AI reply signifies closing the interview
function checkIsClosingStatement(text: string): boolean {
  const lower = text.toLowerCase();
  const closingKeywords = [
    'telah berakhir',
    'saya akhiri',
    'resmi ditutup',
    'tidak akan dilanjutkan',
    'telah selesai',
    'mari kita lihat evaluasi',
    'hasil evaluasi wawancara',
    'cukupkan sampai di sini',
    'seluruh rangkaian sesi wawancara telah selesai',
  ];
  return closingKeywords.some((keyword) => lower.includes(keyword));
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkRateLimit(ip, 60, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan percakapan. Mohon tunggu sejenak.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = chatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Format data wawancara tidak valid', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { profile, messages, groqApiKey: clientGroqKey, groqModel: clientGroqModel, anthropicApiKey: clientAnthropicKey } = parseResult.data;

    // Check if the previous conversation already had an ending statement
    const previousAiMessages = messages.filter((m) => m.sender === 'ai');
    const lastAiMsg = previousAiMessages[previousAiMessages.length - 1]?.text || '';
    if (checkIsClosingStatement(lastAiMsg)) {
      return NextResponse.json({
        reply: 'Sesi wawancara telah resmi ditutup dan tidak dapat dilanjutkan. Silakan menuju ke halaman Scorecard.',
        isFinished: true,
      });
    }

    const userMessages = messages.filter((m) => m.sender === 'user');
    const lastUserText = (userMessages[userMessages.length - 1]?.text || '').trim().toLowerCase();
    const isHrd = profile.selectedMode === 'hrd';
    const interviewerName = isHrd ? 'Sarah (HRD)' : 'Alex (Tech Lead)';
    const company = profile.targetCompany || 'perusahaan';

    // 1. Detect Profanity / Rude Behavior
    const containsProfanity = PROFANITY_WORDS.some((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(lastUserText)
    );

    // If user repeatedly abuses or uses rude language
    const profanityCount = userMessages.filter((m) =>
      PROFANITY_WORDS.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(m.text.toLowerCase()))
    ).length;

    if (containsProfanity) {
      if (profanityCount >= 2) {
        // Immediate termination due to persistent violation
        return NextResponse.json({
          reply: `Penggunaan bahasa kasar yang berulang tidak dapat ditoleransi dalam standar profesionalisme ${company}. Sesi wawancara ini resmi saya akhiri di sini. Terima kasih atas waktunya.`,
          isFinished: true,
        });
      }

      return NextResponse.json({
        reply: `Mohon maaf ${profile.name}, pemilihan kata seperti itu sangat tidak pantas dan tidak profesional dalam sesi wawancara ${company}. Kami mengutamakan respek dan integritas. Jika sikap ini berlanjut, sesi wawancara akan kami hentikan seketika.`,
        isFinished: false,
      });
    }

    // 2. Detect User explicitly asking to end or "akhiri"
    if (/\b(akhiri|keluar|stop|selesai|tutup panggilan|sudahi)\b/i.test(lastUserText)) {
      return NextResponse.json({
        reply: `Baik ${profile.name}, sesuai permintaan Anda, sesi wawancara ini kami akhiri sekarang. Terima kasih atas partisipasi Anda, mari kita langsung lihat hasil evaluasinya.`,
        isFinished: true,
      });
    }

    // 3. Priority 1 AI Provider: Anthropic Claude (Claude 3.5 Sonnet)
    const claudeReply = await generateClaudeInterviewReply(profile, messages, clientAnthropicKey);
    if (claudeReply) {
      const isFinished = checkIsClosingStatement(claudeReply);
      return NextResponse.json({ reply: claudeReply, isFinished });
    }

    // 4. Priority 2 AI Provider: Groq Cloud (Qwen 3.8 27B / GPT-OSS 120B / LLaMA 3.3)
    const groqKey = clientGroqKey || process.env.GROQ_API_KEY;
    const selectedModel = clientGroqModel || 'qwen/qwen3.8-27b';

    if (groqKey) {
      try {
        const systemPrompt = getSystemPromptForInterview(profile);
        const groqMessages = [
          { role: 'system', content: systemPrompt },
          ...messages.map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        ];

        if (messages.length === 0) {
          groqMessages.push({
            role: 'user',
            content: `Sesi wawancara kerja di ${company} baru saja dimulai. Sapa kandidat ${profile.name} dengan hangat dan ramah, perkenalkan diri Anda singkat sebagai ${interviewerName}, dan berikan 1 pertanyaan pembuka yang sesuai untuk posisi ${profile.targetRole}.`,
          });
        }

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey.trim()}`,
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
          if (reply && reply.trim().length > 0) {
            const cleanReply = reply.trim();
            const isFinished = checkIsClosingStatement(cleanReply);
            return NextResponse.json({ reply: cleanReply, isFinished });
          }
        }
      } catch (groqErr) {
        console.warn('Groq Cloud error, moving to smart contextual engine:', groqErr);
      }
    }

    // 5. Smart Human-Like Contextual Engine (When AI providers are offline or not configured)
    const isDismissive = DISMISSIVE_PHRASES.some(
      (phrase) => lastUserText === phrase || lastUserText.startsWith(`${phrase} `) || lastUserText.endsWith(` ${phrase}`)
    );

    if (isDismissive) {
      if (lastAiMsg.toLowerCase().includes('pertanyaan') || userMessages.length >= 4) {
        return NextResponse.json({
          reply: `Baik ${profile.name}, jika memang tidak ada pertanyaan lagi mengenai tim atau budaya di ${company}, berarti seluruh rangkaian sesi wawancara telah selesai. Terima kasih banyak atas kehadiran dan waktu Anda hari ini. Mari kita langsung melihat hasil evaluasi wawancara Anda.`,
          isFinished: true,
        });
      }

      if (isHrd) {
        return NextResponse.json({
          reply: `Saya perhatikan Anda menjawab dengan sangat singkat. Dalam wawancara kerja, elaborasi pengalaman adalah kunci kami memahami potensi Anda. Apakah ada contoh konkret lain di perkuliahan atau magang yang ingin Anda ceritakan?`,
          isFinished: false,
        });
      } else {
        return NextResponse.json({
          reply: `Jawaban tersebut belum memperlihatkan alur logika teknis Anda. Bisakah Anda jelaskan pendekatan sistematis yang Anda ambil saat menyelesaikan masalah teknis terkait topik ini?`,
          isFinished: false,
        });
      }
    }

    // Detect candidate asking questions
    const isAskingQuestion =
      lastUserText.includes('?') ||
      /\b(apakah|bagaimana|berapa|kenapa|apa saja|gaji|budaya|tech stack|teknologi|kultur)\b/i.test(lastUserText);

    if (isAskingQuestion && userMessages.length > 0) {
      if (lastUserText.includes('budaya') || lastUserText.includes('kultur') || lastUserText.includes('tim')) {
        return NextResponse.json({
          reply: `Pertanyaan yang bagus sekali! Di ${company}, kami menjunjung tinggi kolaborasi yang suportif, keterbukaan ide, dan continuous learning bagi lulusan baru. Dari yang Anda dengar, bagaimana gaya belajar Anda dalam beradaptasi di lingkungan seperti itu?`,
          isFinished: false,
        });
      }
      if (lastUserText.includes('gaji') || lastUserText.includes('benefit') || lastUserText.includes('kompensasi')) {
        return NextResponse.json({
          reply: `Terkait kompensasi di ${company}, kami menawarkan paket standar industri yang sangat kompetitif untuk fresh graduate berdasarkan evaluasi kompetensi. Boleh tahu berapa ekspektasi rentang gaji yang Anda harapkan untuk posisi ${profile.targetRole} ini?`,
          isFinished: false,
        });
      }
      return NextResponse.json({
        reply: `Terima kasih atas pertanyaannya. Di ${company}, kami sangat mengapresiasi kandidat yang proaktif mencari tahu. Untuk aspek tersebut, tim kami selalu mengedepankan transparansi. Sebelum kita melangkah ke penutup, ada hal lain yang ingin Anda ketahui?`,
        isFinished: false,
      });
    }

    // Structured progression
    const userTurnCount = userMessages.length;

    if (isHrd) {
      const hrdTurns = [
        `Halo ${profile.name}! Senang sekali bisa bertemu dengan Anda untuk posisi ${profile.targetRole} di ${company}. Boleh ceritakan sedikit tentang diri Anda, latar belakang studi atau organisasi, dan apa yang membuat Anda tertarik bergabung bersama kami?`,
        `Terima kasih atas ceritanya. Dalam pengalaman kuliah, kepanitiaan, atau magang Anda, bisa ceritakan salah satu situasi saat Anda menghadapi perbedaan pendapat sengit dalam tim? Bagaimana Anda menanganinya hingga tuntas?`,
        `Pendekatan yang dewasa. Sekarang, boleh ceritakan tentang sebuah kegagalan atau target yang meleset saat Anda memegang tanggung jawab, serta pelajaran berharga apa yang Anda petik dari situ?`,
        `Menarik sekali refleksinya. Jika Anda dihadapkan pada situasi di mana Anda harus menyelesaikan beberapa tugas mendesak sekaligus dengan tenggat waktu ketat di ${company}, bagaimana strategi Anda memprioritaskannya?`,
        `Bagus sekali penjelasannya. Dari sisi visi karier, apa target profesional yang ingin Anda capai dalam 2 hingga 3 tahun ke depan bersama ${company}?`,
        `Terima kasih atas pemaparan yang sangat komprehensif hari ini. Sebelum sesi ini kita akhiri, adakah pertanyaan yang ingin Anda tanyakan kepada saya mengenai tim, budaya kerja di ${company}, atau tahapan selanjutnya?`,
      ];

      if (userTurnCount >= hrdTurns.length) {
        return NextResponse.json({
          reply: `Baik ${profile.name}, seluruh tahapan wawancara telah berhasil Anda lalui dengan baik. Terima kasih banyak atas waktu dan antusiasmenya hari ini. Sesi wawancara telah selesai dan mari kita langsung lihat laporan Scorecard evaluasi Anda.`,
          isFinished: true,
        });
      }

      const reply = hrdTurns[userTurnCount];
      return NextResponse.json({ reply, isFinished: false });
    } else {
      // Technical Mode Progression
      const techTurns = [
        `Halo ${profile.name}, selamat datang di sesi Technical Interview untuk posisi ${profile.targetRole} di ${company}. Untuk pemanasan, bisa ceritakan arsitektur proyek atau aplikasi paling menantang yang pernah Anda kembangkan sesuai CV Anda?`,
        `Menarik. Ketika sistem tersebut mulai menangani lonjakan traffic atau data yang besar, bagaimana strategi Anda dalam optimasi performa, database indexing, caching, serta menangani concurrency?`,
        `Pendekatan yang solid. Bagaimana Anda mengelola error handling, monitoring log, dan automated testing untuk memastikan aplikasi Anda stabil saat diakses pengguna?`,
        `Bisa berikan contoh konkret saat Anda harus memilih trade-off teknis antara kecepatan delivery fitur versus technical debt atau clean architecture? Apa keputusan yang Anda ambil?`,
        `Bagus sekali penjelasannya. Jika terjadi insiden kritis di mana API utama mengalami latency tinggi di server production, langkah debugging sistematis apa yang pertama kali Anda lakukan?`,
        `Terima kasih atas penjelasan teknis yang komprehensif dan sistematis. Apakah ada aspek arsitektur, tools, atau teknologi terkini yang ingin Anda tanyakan seputar engineering di ${company}?`,
      ];

      if (userTurnCount >= techTurns.length) {
        return NextResponse.json({
          reply: `Terima kasih ${profile.name}, sesi technical interview telah lengkap. Anda telah memaparkan wawasan teknis yang baik. Sesi wawancara telah selesai dan mari kita langsung menuju ke laporan hasil evaluasi teknis Anda.`,
          isFinished: true,
        });
      }

      const reply = techTurns[userTurnCount];
      return NextResponse.json({ reply, isFinished: false });
    }
  } catch (error) {
    console.error('Interview chat error:', error);
    return NextResponse.json({ error: 'Gagal memproses respon wawancara' }, { status: 500 });
  }
}
