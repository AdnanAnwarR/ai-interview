import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export const evaluationSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  summary: z.string(),
  topStrengths: z.array(z.string()).min(1),
  topImprovements: z.array(z.string()).min(1),
  radarRubric: z.object({
    relevansi: z.number().int().min(0).max(100),
    strukturSTAR: z.number().int().min(0).max(100),
    kejelasan: z.number().int().min(0).max(100),
    kepercayaanDiri: z.number().int().min(0).max(100),
    contohNyata: z.number().int().min(0).max(100),
  }),
  answers: z.array(
    z.object({
      questionIndex: z.number().int(),
      questionText: z.string(),
      userAnswer: z.string(),
      score: z.number().int().min(0).max(100),
      strengths: z.string(),
      improvements: z.string(),
      starCriteria: z.object({
        situation: z.boolean(),
        task: z.boolean(),
        action: z.boolean(),
        result: z.boolean(),
      }),
      betterAnswerExample: z.string(),
    })
  ),
});

export type EvaluationData = z.infer<typeof evaluationSchema>;

interface InterviewSessionContext {
  company: string;
  position: string;
  level: string;
  style: string;
  totalQuestions?: number;
}

/**
 * Membangun system prompt untuk pewawancara AI berdasarkan konteks sesi
 */
export function buildInterviewerSystemPrompt(ctx: InterviewSessionContext): string {
  const { company, position, level, style, totalQuestions = 5 } = ctx;

  const styleDescriptions: Record<string, string> = {
    ramah: 'Hangat, suportif, mengayomi, dan memberikan rasa aman bagi fresh graduate.',
    tegas: 'Profesional, to-the-point, berorientasi standar korporat tinggi dan ketepatan kompetensi.',
    stress: 'Skeptis, menantang asumsi, menguji ketenangan mental dan ketahanan di bawah tekanan.',
  };

  const interviewerName = style === 'stress' ? 'Budi (Senior Assessor)' : style === 'tegas' ? 'Alex (Head of Department)' : 'Sarah (HR Recruiter)';

  return `
Anda adalah ${interviewerName} di ${company}.
Anda sedang mewawancarai seorang pelamar untuk posisi "${position}" tingkat ${level.replace('_', ' ')}.
Gaya wawancara Anda: ${styleDescriptions[style] || styleDescriptions.ramah}
Total pertanyaan yang direncanakan: ${totalQuestions} pertanyaan.

Panduan Penting untuk Pewawancara:
1. Respon Alami & Nyambung: Responlah jawaban kandidat terlebih dahulu secara singkat dan natural (misalnya apresiasi poin yang bagus atau tanggapi jawaban mereka) sebelum melontarkan pertanyaan berikutnya.
2. Satu Pertanyaan Per Giliran: Jangan pernah mengajukan lebih dari satu pertanyaan sekaligus.
3. Metode STAR: Arahkan pertanyaan behavioral menggali Situation, Task, Action, dan Result.
4. Ringkas: Batasi respon Anda maksimal 2-3 kalimat agar nyaman didengarkan dan dibaca sebagai subtitle.
5. Bahasa: Gunakan Bahasa Indonesia profesional, wajar, dan membumi (bukan gaya robotik atau korporat kaku).
6. Di giliran pembuka: Sapa kandidat dengan hangat, perkenalkan diri Anda singkat di ${company}, dan ajukan pertanyaan perkenalan pertama yang relevan dengan posisi ${position}.
`.trim();
}

/**
 * Membangun prompt evaluasi akhir komprehensif
 */
export function buildEvaluatorPrompt(ctx: InterviewSessionContext, transcriptText: string): string {
  return `
Anda adalah Chief Evaluator di platform Wawancarain.
Tugas Anda adalah menilai seluruh sesi wawancara untuk posisi ${ctx.position} di ${ctx.company} (${ctx.level}).
Evaluasi harus adil, mendalam, dan memberikan nilai konkret (0-100) serta umpan balik STAR untuk SETIAP jawaban kandidat.

Transkrip Percakapan:
${transcriptText}

Gunakan alat 'submit_evaluation' untuk menyerahkan hasil evaluasi secara terstruktur.
`.trim();
}

/**
 * Menghasilkan streaming balasan pewawancara dari Claude (@anthropic-ai/sdk)
 */
export async function streamInterviewerReply(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL_INTERVIEW || 'claude-haiku-5-5';

  if (!apiKey || apiKey.includes('placeholder')) {
    // Fallback streaming cerdas jika API key belum diisi
    return createSimulatedStream(messages, systemPrompt);
  }

  try {
    const client = new Anthropic({ apiKey: apiKey.trim() });
    const encoder = new TextEncoder();

    // Stream text via Anthropic SDK
    const stream = await client.messages.create({
      model: model.includes('5-5') ? 'claude-3-5-haiku-20241022' : model,
      max_tokens: 300,
      system: systemPrompt,
      stream: true,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === 'content_block_delta' &&
              chunk.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (streamErr) {
          controller.error(streamErr);
        }
      },
    });
  } catch (error) {
    console.error('Claude streaming error, falling back to simulated stream:', error);
    return createSimulatedStream(messages, systemPrompt);
  }
}

/**
 * Menjalankan evaluasi akhir wawancara dengan validasi Zod dan tool use Claude
 */
export async function evaluateInterview(
  ctx: InterviewSessionContext,
  transcript: Array<{ role: 'user' | 'assistant'; content: string; questionIndex: number }>
): Promise<EvaluationData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.ANTHROPIC_MODEL_EVALUATION || 'claude-sonnet-5-5';

  // Format transkrip percakapan
  const formattedTranscript = transcript
    .map((m) => `[Pertanyaan #${m.questionIndex}] ${m.role === 'assistant' ? 'Pewawancara' : 'Kandidat'}: ${m.content}`)
    .join('\n\n');

  if (!apiKey || apiKey.includes('placeholder')) {
    return generateFallbackEvaluation(ctx, transcript);
  }

  const client = new Anthropic({ apiKey: apiKey.trim() });
  const prompt = buildEvaluatorPrompt(ctx, formattedTranscript);

  // Percobaan penilaian dengan validasi Zod (ulang sekali jika invalid)
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await client.messages.create({
        model: model.includes('5-5') ? 'claude-3-5-sonnet-20241022' : model,
        max_tokens: 3000,
        system: 'Anda adalah evaluator wawancara kerja profesional berbahasa Indonesia. Wajib gunakan tool submit_evaluation.',
        messages: [{ role: 'user', content: prompt }],
        tools: [
          {
            name: 'submit_evaluation',
            description: 'Menyerahkan hasil evaluasi wawancara lengkap dan penilaian per jawaban.',
            input_schema: {
              type: 'object',
              properties: {
                overallScore: { type: 'integer', minimum: 0, maximum: 100 },
                summary: { type: 'string' },
                topStrengths: { type: 'array', items: { type: 'string' } },
                topImprovements: { type: 'array', items: { type: 'string' } },
                radarRubric: {
                  type: 'object',
                  properties: {
                    relevansi: { type: 'integer', minimum: 0, maximum: 100 },
                    strukturSTAR: { type: 'integer', minimum: 0, maximum: 100 },
                    kejelasan: { type: 'integer', minimum: 0, maximum: 100 },
                    kepercayaanDiri: { type: 'integer', minimum: 0, maximum: 100 },
                    contohNyata: { type: 'integer', minimum: 0, maximum: 100 },
                  },
                  required: ['relevansi', 'strukturSTAR', 'kejelasan', 'kepercayaanDiri', 'contohNyata'],
                },
                answers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      questionIndex: { type: 'integer' },
                      questionText: { type: 'string' },
                      userAnswer: { type: 'string' },
                      score: { type: 'integer', minimum: 0, maximum: 100 },
                      strengths: { type: 'string' },
                      improvements: { type: 'string' },
                      starCriteria: {
                        type: 'object',
                        properties: {
                          situation: { type: 'boolean' },
                          task: { type: 'boolean' },
                          action: { type: 'boolean' },
                          result: { type: 'boolean' },
                        },
                        required: ['situation', 'task', 'action', 'result'],
                      },
                      betterAnswerExample: { type: 'string' },
                    },
                    required: [
                      'questionIndex',
                      'questionText',
                      'userAnswer',
                      'score',
                      'strengths',
                      'improvements',
                      'starCriteria',
                      'betterAnswerExample',
                    ],
                  },
                },
              },
              required: ['overallScore', 'summary', 'topStrengths', 'topImprovements', 'radarRubric', 'answers'],
            },
          },
        ],
        tool_choice: { type: 'tool', name: 'submit_evaluation' },
      });

      const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
      if (toolUseBlock && toolUseBlock.type === 'tool_use') {
        const parsed = evaluationSchema.safeParse(toolUseBlock.input);
        if (parsed.success) {
          return parsed.data;
        }
      }
    } catch (err) {
      console.warn(`Evaluation attempt ${attempt} failed:`, err);
    }
  }

  return generateFallbackEvaluation(ctx, transcript);
}

// Fallback generator lokal jika Claude API offline atau belum dikonfigurasi
function generateFallbackEvaluation(
  ctx: InterviewSessionContext,
  transcript: Array<{ role: 'user' | 'assistant'; content: string; questionIndex: number }>
): EvaluationData {
  const userAnswers = transcript.filter((t) => t.role === 'user');
  const assistantQuestions = transcript.filter((t) => t.role === 'assistant');

  const answers = userAnswers.map((ua, idx) => {
    const qText = assistantQuestions[idx]?.content || `Pertanyaan seleksi #${ua.questionIndex}`;
    const wordCount = ua.content.trim().split(/\s+/).length;

    const hasSituation = /(saat|ketika|pada|waktu|pengalaman|proyek)/i.test(ua.content);
    const hasTask = /(tugas|tanggung jawab|target|tuntutan)/i.test(ua.content);
    const hasAction = /(saya|langkah|solusi|inisiatif|mengembangkan)/i.test(ua.content);
    const hasResult = /(hasil|dampak|berhasil|mencapai|sebesar)/i.test(ua.content);

    let score = 72;
    if (wordCount > 20) score += 5;
    if (wordCount > 40) score += 5;
    if (hasSituation) score += 3;
    if (hasTask) score += 3;
    if (hasAction) score += 4;
    if (hasResult) score += 5;
    score = Math.min(score, 95);

    return {
      questionIndex: ua.questionIndex,
      questionText: qText,
      userAnswer: ua.content,
      score,
      strengths: 'Komunikasi jelas dan relevan dengan posisi ' + ctx.position + '.',
      improvements: 'Perkuat dengan metrik hasil terukur (misal: persentase efisiensi atau nominal dampak).',
      starCriteria: {
        situation: hasSituation || wordCount > 25,
        task: hasTask || wordCount > 30,
        action: hasAction || wordCount > 35,
        result: hasResult || wordCount > 45,
      },
      betterAnswerExample: `Contoh Jawaban Ideal STAR:\n"Dalam pengalaman tersebut, peran saya adalah memastikan sasaran tercapai. Saya mengambil inisiatif berkoordinasi dan mengeksekusi rencana terstruktur. Hasilnya, tantangan berhasil diatasi dengan peningkatan kepuasan tim sebesar 25%."`,
    };
  });

  const avg = answers.length > 0 ? Math.round(answers.reduce((acc, a) => acc + a.score, 0) / answers.length) : 85;

  return {
    overallScore: avg,
    summary: `Kandidat menunjukkan penguasaan yang sangat baik untuk posisi ${ctx.position} di ${ctx.company}. Struktur penyampaian rapi dengan potensi adaptasi tinggi.`,
    topStrengths: [
      `Pemahaman yang solid mengenai tuntutan pekerjaan ${ctx.position}.`,
      'Kemampuan mengartikulasikan alur berpikir secara runtut dan teratur.',
      'Antusiasme dan motivasi yang tinggi terhadap budaya kerja perusahaan.',
    ],
    topImprovements: [
      'Biasakan menyertakan angka atau indikator terukur pada pilar Result metode STAR.',
      'Perdalam pemahaman tentang tantangan spesifik di industri ' + ctx.company + '.',
      'Tonjolkan inisiatif pribadi saat bekerja dalam kelompok.',
    ],
    radarRubric: {
      relevansi: Math.min(100, avg + 2),
      strukturSTAR: Math.max(60, avg - 3),
      kejelasan: Math.min(100, avg + 4),
      kepercayaanDiri: Math.min(100, avg),
      contohNyata: Math.max(60, avg - 2),
    },
    answers: answers.length > 0 ? answers : [
      {
        questionIndex: 1,
        questionText: `Ceritakan tentang diri Anda dan motivasi bergabung di ${ctx.company}?`,
        userAnswer: 'Saya lulusan baru yang bersemangat untuk belajar dan berkontribusi.',
        score: 80,
        strengths: 'Sikap positif dan motivasi jelas.',
        improvements: 'Jelaskan contoh pengalaman konkret dari kampus.',
        starCriteria: { situation: true, task: false, action: true, result: false },
        betterAnswerExample: 'Saya memiliki latar belakang relevan dengan proyek tugas akhir yang terbukti mengoptimalkan proses kerja.',
      },
    ],
  };
}

function createSimulatedStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  _systemPrompt: string
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

  const sampleReply = `Terima kasih atas penjelasan Anda. Saya mencatat poin penting tersebut. Selanjutnya, bisakah Anda ceritakan situasi di mana Anda pernah menghadapi perbedaan pendapat dalam tim dan bagaimana langkah konkret Anda menyelesaikannya?`;

  const tokens = sampleReply.split(/(\s+)/);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: token })}\n\n`));
        await new Promise((r) => setTimeout(r, 20));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}
