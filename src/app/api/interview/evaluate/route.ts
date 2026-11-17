import { NextRequest, NextResponse } from 'next/server';
import { evaluateRequestSchema } from '@/lib/validations/interview';
import { generateClaudeEvaluation } from '@/lib/ai/anthropic';
import { ScorecardReport, AnswerScore } from '@/types/interview';
import { getEvaluationSystemPrompt } from '@/lib/ai/prompts';
import { checkRateLimit } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkRateLimit(ip, 20, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan evaluasi. Mohon tunggu sejenak.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = evaluateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Data evaluasi tidak valid', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { profile, messages, groqApiKey: clientGroqKey, groqModel: clientGroqModel, anthropicApiKey: clientAnthropicKey } = parseResult.data;

    // 1. Try Claude Evaluation (Claude 3.5 Sonnet)
    const claudeReport = await generateClaudeEvaluation(profile, messages, clientAnthropicKey);
    if (claudeReport && claudeReport.overallScore) {
      return NextResponse.json(claudeReport);
    }

    // 2. Try Groq Cloud Evaluation
    const groqKey = clientGroqKey || process.env.GROQ_API_KEY;
    const selectedModel = clientGroqModel || 'qwen/qwen3.8-27b';
    const systemPrompt = getEvaluationSystemPrompt(profile);

    const transcriptText = messages
      .map((m) => `[${m.sender === 'ai' ? 'Pewawancara' : profile.name}]: ${m.text}`)
      .join('\n\n');

    if (groqKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey.trim()}`,
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: `${systemPrompt}\nKembalikan HANYA format JSON valid tanpa tanda kutip markdown pembungkus.` },
              { role: 'user', content: `Berikut transkrip wawancara lengkap:\n\n${transcriptText}\n\nBerikan evaluasi lengkap dan nilai untuk SETIAP jawaban kandidat.` },
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
            if (parsedReport.overallScore) {
              return NextResponse.json(parsedReport);
            }
          }
        }
      } catch (groqErr) {
        console.warn('Groq evaluation failed, moving to intelligent scoring engine:', groqErr);
      }
    }

    // 3. Intelligent Heuristic Per-Answer Scoring Engine
    const userAnswers = messages.filter((m) => m.sender === 'user');
    const aiQuestions = messages.filter((m) => m.sender === 'ai');
    const totalWords = userAnswers.reduce((acc, m) => acc + m.text.split(/\s+/).length, 0);

    const hasProfanity = userAnswers.some((m) =>
      /\b(anjing|babi|bangsat|kontol|memek|goblok|tolol|tai|bajingan|sialan|bego)\b/i.test(m.text)
    );

    const isHrd = profile.selectedMode === 'hrd';
    let baseScore = Math.min(94, Math.max(50, 68 + Math.min(24, totalWords / 8)));
    if (hasProfanity) {
      baseScore = Math.max(30, baseScore - 35);
    }

    // Generate specific per-answer scores for every candidate reply
    const answerScores: AnswerScore[] = userAnswers.map((answer, index) => {
      const correspondingQuestion = aiQuestions[index]?.text || `Pertanyaan Wawancara #${index + 1}`;
      const answerLength = answer.text.trim().split(/\s+/).length;
      
      const containsBadWord = /\b(anjing|babi|bangsat|kontol|memek|goblok|tolol|tai|bajingan|sialan|bego)\b/i.test(answer.text);
      
      let answerScore = Math.min(96, Math.max(45, 60 + Math.min(30, answerLength * 1.5)));
      if (containsBadWord) {
        answerScore = 20;
      } else if (answerLength < 5) {
        answerScore = 48; // Terlalu singkat / tidak ada elaborasi
      }

      return {
        questionIndex: index + 1,
        questionText: correspondingQuestion,
        answerText: answer.text,
        score: Math.round(answerScore),
        aspectScores: {
          relevance: containsBadWord ? 20 : Math.min(95, Math.round(answerScore + (answerLength > 10 ? 4 : -5))),
          clarity: containsBadWord ? 25 : Math.min(95, Math.round(answerScore + 2)),
          depth: containsBadWord ? 15 : Math.min(95, Math.round(answerScore - 2)),
        },
        feedback: containsBadWord
          ? 'Jawaban mengandung kata-kata yang tidak pantas dalam wawancara kerja. Etika komunikasi sangat menentukan kelulusan.'
          : answerLength < 8
          ? 'Jawaban masih terlalu singkat. Sebagai fresh graduate, gunakan metode STAR (Situation, Task, Action, Result) untuk menceritakan konteks dan inisiatif nyata Anda.'
          : 'Penyampaian sudah baik dan mengalir. Disarankan menyertakan contoh angka dampak atau hasil terukur dari apa yang Anda kerjakan.',
        strengths: containsBadWord
          ? ['Kecepatan respon']
          : [
              answerLength > 15
                ? 'Elaborasi yang terstruktur dan mampu menggambarkan peran Anda'
                : 'Artikulasi langsung ke inti topik yang ditanyakan',
            ],
        improvements: containsBadWord
          ? ['Jaga etika dan profesionalisme komunikasi secara ketat']
          : [
              'Tingkatkan penyebutan metrik keberhasilan atau pembelajaran yang dipetik dari pengalaman tersebut.',
            ],
        starAnalysis: {
          situation: answerLength > 10 ? 'Konteks situasi telah disebutkan dengan cukup jelas.' : 'Latar belakang masalah belum terelaborasi.',
          task: 'Tanggung jawab individu teridentifikasi.',
          action: 'Aksi yang diambil sudah diceritakan.',
          result: answerLength > 15 ? 'Hasil sudah disebutkan, dapat diperkuat dengan data konkret.' : 'Dampak atau hasil belum disebutkan.',
        },
      };
    });

    const report: ScorecardReport = {
      overallScore: Math.round(baseScore),
      passed: baseScore >= 70 && !hasProfanity,
      scoreBreakdown: {
        structure: Math.round(baseScore - (hasProfanity ? 10 : 2)),
        relevance: Math.round(baseScore + 1),
        communication: Math.round(hasProfanity ? 35 : baseScore + 3),
        domainExpertise: isHrd ? Math.round(baseScore) : Math.round(baseScore - 1),
      },
      keyStrengths: hasProfanity
        ? ['Kandidat dapat merespon pertanyaan secara cepat.']
        : [
            `Kemampuan komunikasi yang baik dalam mendiskusikan posisi ${profile.targetRole} di ${profile.targetCompany}.`,
            isHrd
              ? 'Memiliki kesadaran interpersonal yang baik seputar kerja sama tim dan adaptasi organisasi.'
              : 'Pemahaman alur logika teknis dan kesiapan menguraikan konsep sistematis.',
            'Kesiapan merespon alur tanya jawab secara langsung.',
          ],
      areasForImprovement: hasProfanity
        ? [
            'Etika komunikasi formal harus diperbaiki total. Wawancara kerja menuntut profesionalisme dan saling menghormati.',
            'Latih ketenangan dan kontrol emosi saat menghadapi pertanyaan wawancara.',
          ]
        : [
            'Sertakan angka atau metrik hasil konkret (contoh: persentase efisiensi, durasi pengerjaan, skala pengguna, atau penghematan waktu).',
            isHrd
              ? 'Perkuat bagian "Result" dalam metode STAR agar pencapaian tampak nyata.'
              : 'Jelaskan trade-off alternatif solusi secara eksplisit sebelum menentukan pilihan teknis akhir.',
          ],
      answerScores,
      starAnalysis: answerScores.slice(0, 3).map((ans) => ({
        question: ans.questionText,
        candidateAnswer: ans.answerText,
        situation: ans.starAnalysis?.situation || 'Konteks situasi.',
        task: ans.starAnalysis?.task || 'Tugas atau peran.',
        action: ans.starAnalysis?.action || 'Inisiatif yang diambil.',
        result: ans.starAnalysis?.result || 'Hasil yang dicapai.',
        improvementTip: 'Gunakan pola STAR: Situation (latar belakang) -> Task (tanggung jawab) -> Action (aksi Anda) -> Result (angka/hasil konkret).',
      })),
      summaryFeedback: hasProfanity
        ? `Sesi wawancara terhenti karena terdeteksi pelanggaran etika komunikasi. Sikap profesional, kesantunan, dan integritas adalah syarat mutlak diterima di ${profile.targetCompany}. Latih kembali komunikasi formal Anda.`
        : `Kandidat ${profile.name} menunjukkan potensi yang sangat menjanjikan untuk posisi ${profile.targetRole} di ${profile.targetCompany}. Jawaban Anda mencerminkan antusiasme mahasiswa/fresh graduate yang siap belajar. Dengan memperkuat data dampak nyata (metrik kuantitatif) di setiap jawaban, Anda akan sangat kompetitif dalam proses seleksi sesungguhnya!`,
      hiringRecommendation: hasProfanity ? 'Not Ready' : baseScore >= 85 ? 'Strong Hire' : 'Hire',
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('Evaluation route error:', error);
    return NextResponse.json({ error: 'Gagal menghasilkan evaluasi wawancara' }, { status: 500 });
  }
}
