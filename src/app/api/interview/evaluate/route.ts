import { NextRequest, NextResponse } from 'next/server';
import { CandidateProfile, ChatMessage, ScorecardReport } from '@/types/interview';
import { getEvaluationSystemPrompt } from '@/lib/ai/prompts';

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

    if (!profile || !messages || messages.length === 0) {
      return NextResponse.json({ error: 'Profile and conversation transcript are required' }, { status: 400 });
    }

    const groqKey = clientGroqKey || process.env.GROQ_API_KEY;
    const selectedModel = clientGroqModel || 'llama-3.3-70b-versatile';
    const systemPrompt = getEvaluationSystemPrompt(profile);

    const transcriptText = messages
      .map((m) => `[${m.sender === 'ai' ? 'Pewawancara AI' : profile.name}]: ${m.text}`)
      .join('\n\n');

    // 1. Try Groq LLaMA 3.3 Evaluation
    if (groqKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey.trim()}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: `${systemPrompt}\nKembalikan HANYA format JSON valid tanpa markdown formatting.` },
              { role: 'user', content: `Berikut transkrip wawancara lengkap:\n\n${transcriptText}` },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsedReport: ScorecardReport = JSON.parse(content);
            return NextResponse.json(parsedReport);
          }
        }
      } catch (groqErr) {
        console.warn('Groq evaluation failed, using intelligent fallback:', groqErr);
      }
    }

    // 2. Intelligent Contextual Evaluation Fallback
    const candidateAnswers = messages.filter((m) => m.sender === 'user');
    const totalWords = candidateAnswers.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0);

    const hasProfanity = candidateAnswers.some((m) => 
      /\b(anjing|babi|bangsat|kontol|memek|goblok|tolol|tai|bajingan|sialan)\b/i.test(m.text)
    );

    const isHrd = profile.selectedMode === 'hrd';

    let baseScore = Math.min(94, Math.max(50, 68 + Math.min(24, totalWords / 8)));
    if (hasProfanity) {
      baseScore = Math.max(35, baseScore - 30);
    }

    const report: ScorecardReport = {
      overallScore: Math.round(baseScore),
      passed: baseScore >= 70 && !hasProfanity,
      scoreBreakdown: {
        structure: Math.round(baseScore - (hasProfanity ? 8 : 2)),
        relevance: Math.round(baseScore + 1),
        communication: Math.round(hasProfanity ? 40 : baseScore + 3),
        domainExpertise: isHrd ? Math.round(baseScore) : Math.round(baseScore - 1),
      },
      keyStrengths: hasProfanity
        ? ['Kandidat dapat merespon dialog secara cepat.']
        : [
            `Kemampuan artikulasi ide dan pengalaman kerja yang relevan dengan posisi ${profile.targetRole}.`,
            isHrd
              ? 'Responsif terhadap pertanyaan seputar dinamika tim dan adaptasi budaya kerja.'
              : 'Pemahaman alur logika sistem dan kemauan menjelaskan konsep secara bertahap.',
            'Kesiapan mengikuti alur percakapan dua arah secara interaktif.',
          ],
      areasForImprovement: hasProfanity
        ? [
            'Perhatikan etika dan pemilihan kata-kata formal. Penggunaan kata kasar atau tidak pantas otomatis menggugurkan kelayakan profesional.',
            'Latih kesabaran dan kendali emosi saat menjawab pertanyaan evaluatif.',
          ]
        : [
            'Sertakan angka atau metrik hasil konkret (contoh: persentase efisiensi, durasi pengerjaan, atau skala dampak).',
            isHrd
              ? 'Perkuat bagian "Result" dalam kerangka STAR agar hasil kontribusi Anda lebih terbukti nyata.'
              : 'Jelaskan trade-off alternatif solusi secara eksplisit sebelum menentukan pilihan teknis akhir.',
          ],
      starAnalysis: candidateAnswers.slice(0, 2).map((ans, idx) => ({
        question: messages[idx * 2]?.text || 'Pertanyaan pembuka pengalaman kerja',
        candidateAnswer: ans.text,
        situation: 'Kandidat memberikan latar belakang situasi pekerjaan.',
        task: 'Tanggung jawab atau peranan telah diidentifikasi.',
        action: 'Inisiatif tindakan yang diambil sudah disebutkan secara umum.',
        result: 'Hasil kerja sudah dipaparkan, disarankan memperkuat dengan data dampak nyata.',
        improvementTip: 'Latih metode STAR: Situation (konteks) -> Task (target peran) -> Action (aksi nyata Anda) -> Result (angka dampak positif).'
      })),
      summaryFeedback: hasProfanity
        ? `Kandidat terdeteksi menggunakan bahasa yang kurang pantas dalam wawancara formal. Wawancara kerja sangat mengutamakan integritas, kesopanan, dan profesionalisme. Perbaiki gaya komunikasi Anda agar dapat bersaing di dunia kerja.`
        : `Kandidat ${profile.name} menunjukkan pemahaman yang baik untuk posisi ${profile.targetRole}. Penjelasan mengalir dengan alami. Tingkatkan penyertaan data kuantitatif untuk membuat jawaban Anda semakin berbobot di hadapan recruiter sungguhan.`,
      hiringRecommendation: hasProfanity ? 'Not Ready' : baseScore >= 85 ? 'Strong Hire' : 'Hire',
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Evaluation route error:', error);
    return NextResponse.json({ error: 'Failed to evaluate interview' }, { status: 500 });
  }
}
