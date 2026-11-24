import { GoogleGenAI } from '@google/genai';
import { streamGeminiInterviewerReply } from './gemini';
import { streamInterviewerReply } from './claude';

export interface DynamicInterviewContext {
  company: string;
  position: string;
  level: string;
  style: 'ramah' | 'tegas' | 'stress' | string;
  totalQuestions: number;
  currentQuestionIndex?: number;
}

export const STYLE_DEFINITIONS = {
  ramah: {
    personaName: 'Sarah',
    roleTitle: 'Talent Acquisition & HR Specialist',
    toneDescription: 'Hangat, suportif, menenangkan, tersenyum, dan mengapresiasi kandidat agar tidak gugup.',
    promptInstruction: 'Gunakan nada bicara yang sangat ramah, hangat, santai, dan penuh empati. Apresiasi jawaban kandidat sebelum lanjut ke pertanyaan berikutnya. Tanyakan hal yang berfokus pada motivasi, dinamika tim, dan perkembangan diri.',
  },
  tegas: {
    personaName: 'Alex',
    roleTitle: 'Senior Tech Lead & Hiring Manager',
    toneDescription: 'Profesional, lugas, to the point, terstruktur, tanpa basa-basi, fokus pada kompetensi riil.',
    promptInstruction: 'Gunakan nada bicara yang profesional, tegas, lugas, dan efisien. Jangan bertele-tele. Tanyakan hal yang berfokus pada hasil terukur, metodologi kerja, efisiensi eksekusi, dan akurasi teknis.',
  },
  stress: {
    personaName: 'Arya',
    roleTitle: 'Executive Reviewer & Challenging Lead',
    toneDescription: 'Kritis, analitis, menantang asumsi, menyelidik lebih dalam untuk menguji ketahanan mental di bawah tekanan.',
    promptInstruction: 'Gunakan nada bicara yang menantang, analitis, tajam, dan sedikit skeptis namun tetap beretika profesional. Uji logika pelamar, minta bukti konkret, dan tanyakan skenario krisis atau kegagalan ekstrem.',
  },
};

/**
 * Menghasilkan kalimat pembuka wawancara yang disesuaikan secara unik dengan gaya wawancara
 */
export async function generateDynamicOpeningGreeting(ctx: DynamicInterviewContext): Promise<string> {
  const { company, position, level, style } = ctx;
  const currentStyle = (style === 'stress' ? 'stress' : style === 'tegas' ? 'tegas' : 'ramah') as 'ramah' | 'tegas' | 'stress';
  const meta = STYLE_DEFINITIONS[currentStyle];
  const levelText = level === 'magang' ? 'Magang' : level === 'junior' ? 'Junior' : 'Fresh Graduate';

  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Coba panggil Gemini jika key terpasang
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      const prompt = `Kamu adalah ${meta.personaName}, seorang ${meta.roleTitle} di ${company}. Kamu sedang memulai sesi wawancara langsung untuk posisi ${position} (level: ${levelText}).
GAYA KAMU: ${meta.toneDescription}
INSTRUKSI:
${meta.promptInstruction}
TUGAS: Berikan sapaan pembuka wawancara sepanjang 2-3 kalimat santai tapi berkarakter kuat sesuai gayamu.
1. Sapa kandidat dengan gayamu (${meta.personaName}).
2. Jelaskan sekilas suasana sesi wawancara ini.
3. Ajukan 1 pertanyaan pembuka (perkenalan diri dan motivasi) yang gayanya mencerminkan kepribadianmu.
JANGAN gunakan kalimat template seperti "Selamat datang di sesi wawancara untuk posisi...".`;

      for (const model of ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash']) {
        try {
          const res = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
              temperature: 0.9,
              maxOutputTokens: 250,
            },
          });

          if (res.text && res.text.trim().length > 20) {
            return res.text.trim();
          }
        } catch {
          // coba model berikutnya
        }
      }
    } catch (err) {
      console.warn('Gemini dynamic opening generation failed, using tailored style library:', err);
    }
  }

  // 2. Fallback Beragam sesuai Gaya yang Dipilih
  if (currentStyle === 'ramah') {
    const ramahOpenings = [
      `Halo! Senang sekali bisa tatap muka langsung hari ini. Saya Sarah dari tim HR di ${company}. Santai saja ya, anggap ini obrolan dua arah yang menyenangkan. Boleh ceritakan sedikit tentang dirimu dan apa yang membuatmu tertarik melamar posisi ${position} di sini?`,
      `Hai, salam kenal! Gimana kabarnya hari ini? Semoga dalam keadaan fit ya. Saya Sarah yang akan menemani sesi ngobrol kita hari ini untuk role ${position} di ${company}. Yuk, boleh perkenalkan dirimu secara singkat?`,
      `Halo, selamat datang! Terima kasih banyak sudah meluangkan waktu buat hadir. Saya Sarah di ${company}. Hari ini kita bakal ngobrol santai seputar minat dan potensimu di bidang ${position}. Boleh mulai dengan ceritakan tentang dirimu?`,
    ];
    return ramahOpenings[Math.floor(Math.random() * ramahOpenings.length)];
  }

  if (currentStyle === 'tegas') {
    const tegasOpenings = [
      `Halo, salam kenal. Saya Alex, lead interviewer di ${company}. Hari ini kita akan fokus meninjau kesiapan dan kualifikasi profesionalmu untuk posisi ${position}. Agar sesi kita efektif, silakan mulai dengan ringkasan profilmu dan alasan memilih posisi ini.`,
      `Selamat siang. Saya Alex dari tim ${company}. Pada sesi ini saya ingin memahami secara lugas kesiapan kompetensi kamu untuk role ${position}. Bisakah kamu perkenalkan dirimu secara ringkas dan to the point?`,
      `Halo, terima kasih atas kehadirannya. Saya Alex dari ${company}. Kita langsung mulai saja ya. Jelaskan gambaran singkat keahlian teknismu dan apa kontribusi nyata yang bisa kamu bawa untuk posisi ${position}.`,
    ];
    return tegasOpenings[Math.floor(Math.random() * tegasOpenings.length)];
  }

  // Menantang / Stress
  const stressOpenings = [
    `Halo. Saya Arya dari ${company}. Di divisi kami, dinamika kerja untuk posisi ${position} sangat menuntut ketahanan mental dan problem solving cepat. Untuk mengawali, coba jelaskan mengapa kamu merasa siap mengisi posisi ini dibanding puluhan kandidat lain?`,
    `Salam kenal, saya Arya dari ${company}. Wawancara ini akan menguji kedalaman cara berpikirmu dalam situasi sulit. Sebelum kita masuk ke studi kasus teknis, coba perkenalkan dirimu dan buktikan bahwa kamu bukan tipikal pelamar biasa.`,
    `Halo. Saya Arya, reviewer teknis di ${company}. Posisi ${position} ini butuh orang yang tahan banting dan punya solusi konkret di bawah tekanan. Coba perkenalkan latar belakangmu secara kritis dan mengapa kami harus mempertimbangkanmu.`,
  ];
  return stressOpenings[Math.floor(Math.random() * stressOpenings.length)];
}

/**
 * Stream balasan AI pewawancara:
 * Mengalirkan pertanyaan lanjutan yang gayanya sangat berbeda antara Ramah, Tegas, dan Menantang
 */
export async function streamDynamicInterviewerReply(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt: string,
  ctx: DynamicInterviewContext
): Promise<ReadableStream<Uint8Array>> {
  const currentStyle = (ctx.style === 'stress' ? 'stress' : ctx.style === 'tegas' ? 'tegas' : 'ramah') as 'ramah' | 'tegas' | 'stress';
  const meta = STYLE_DEFINITIONS[currentStyle];

  // Sesuaikan system prompt agar Gemini/Claude mengadopsi persona gaya secara penuh
  const tailoredSystemPrompt = `${systemPrompt}

PERHATIAN GAYA WAWANCARA WAJIB:
- Kamu adalah ${meta.personaName} (${meta.roleTitle}).
- GAYA UTAMA: ${meta.toneDescription}
- INSTRUKSI: ${meta.promptInstruction}
- Pertahankan nada bicara ini secara konsisten di setiap giliran pertanyaan.`;

  // 1. Coba Gemini Streaming
  try {
    const geminiStream = await streamGeminiInterviewerReply(messages, tailoredSystemPrompt);
    if (geminiStream) {
      return geminiStream;
    }
  } catch (err) {
    console.warn('Gemini stream error, trying fallback:', err);
  }

  // 2. Coba Claude Streaming
  try {
    const claudeStream = await streamInterviewerReply(messages, tailoredSystemPrompt);
    if (claudeStream) {
      return claudeStream;
    }
  } catch (err) {
    console.warn('Claude stream error, using intelligent stylized simulator:', err);
  }

  // 3. Fallback Contextual Simulator Berdasarkan Gaya yang Dipilih
  return createStylizedContextualStream(messages, ctx);
}

/**
 * Generator Respon Alami Berdasarkan 3 Gaya Wawancara (Ramah / Tegas / Menantang)
 */
function createStylizedContextualStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ctx: DynamicInterviewContext
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
  const currentQ = ctx.currentQuestionIndex || 2;
  const currentStyle = (ctx.style === 'stress' ? 'stress' : ctx.style === 'tegas' ? 'tegas' : 'ramah') as 'ramah' | 'tegas' | 'stress';

  let reaction = '';
  let nextQuestion = '';

  if (currentStyle === 'ramah') {
    // GAYA RAMAH (Sarah) - Hangat, apresiatif, membimbing
    const friendlyReactions = [
      'Wah menarik sekali ceritamu, terima kasih sudah berbagi ya.',
      'Keren, saya sangat mengapresiasi antusiasme dan cara kamu menyampaikannya.',
      'Bagus sekali, saya bisa melihat semangat belajarmu yang sangat positif.',
      'Senang mendengarnya, itu modal awal yang berharga sekali untuk fresh graduate.',
    ];
    reaction = friendlyReactions[Math.floor(Math.random() * friendlyReactions.length)];

    if (currentQ <= 2) {
      nextQuestion = `Boleh ceritakan salah satu proyek atau pengalaman paling berkesan yang pernah kamu kerjakan, dan apa bagian yang paling bikin kamu bangga?`;
    } else if (currentQ === 3) {
      nextQuestion = `Dalam bekerja, tentu kita sering berkolaborasi dengan banyak orang. Pernahkah kamu ada di situasi di mana tim saling berbeda pendapat, dan bagaimana caramu menjaga suasana tetap positif sambil mencari solusi bersama?`;
    } else if (currentQ < ctx.totalQuestions) {
      nextQuestion = `Menurut pandangan pribadimu, lingkungan kerja dan dukungan seperti apa yang paling bisa membantumu bertumbuh maksimal di ${ctx.company}?`;
    } else {
      nextQuestion = `Kita sudah sampai di akhir sesi wawancara santai kita. Ada hal yang ingin kamu tanyakan ke saya seputar tim atau budaya kerja di ${ctx.company}?`;
    }
  } else if (currentStyle === 'tegas') {
    // GAYA TEGAS (Alex) - Profesional, to the point, metrik & kompetensi
    const firmReactions = [
      'Baik, saya catat poin penting tersebut.',
      'Penjelasan cukup jelas dan terstruktur. Mari kita lihat aspek teknisnya.',
      'Cukup padat. Sekarang kita fokus ke efisiensi eksekusinya.',
      'Saya paham pendekatannya. Mari kita bedah lebih spesifik.',
    ];
    reaction = firmReactions[Math.floor(Math.random() * firmReactions.length)];

    if (currentQ <= 2) {
      nextQuestion = `Sebutkan metodologi kerja atau alur spesifik yang kamu gunakan saat menyelesaikan tugas dengan deadline ketat, dan bagaimana kamu mengukur hasilnya?`;
    } else if (currentQ === 3) {
      nextQuestion = `Ketika kamu menghadapi dua prioritas pekerjaan yang sama-sama mendesak dari atasan dan rekan tim, kriteria objektif apa yang kamu pakai untuk menentukan prioritas pertama?`;
    } else if (currentQ < ctx.totalQuestions) {
      nextQuestion = `Untuk posisi ${ctx.position} ini, apa keahlian teknis terkuatmu yang siap langsung kamu terapkan di minggu pertama bekerja di ${ctx.company}?`;
    } else {
      nextQuestion = `Wawancara telah selesai dari sisi saya. Apakah ada pertanyaan profesional spesifik mengenai target kerja dan ekspektasi posisi ${ctx.position}?`;
    }
  } else {
    // GAYA MENANTANG / STRESS (Arya) - Kritis, menguji asumsi, logika di bawah tekanan
    const challengingReactions = [
      'Itu pendekatan standar yang sering saya dengar. Namun di kondisi riil, sering kali banyak kendala yang tak terduga.',
      'Menarik, tapi saya melihat ada celah risiko cukup besar dalam strategi yang kamu jelaskan tadi.',
      'Jawaban kamu terdengar teoritis. Saya ingin melihat pembuktian konkretnya.',
      'Cukup percaya diri, tapi mari kita uji seberapa kokoh argumenmu jika situasinya berbalik.',
    ];
    reaction = challengingReactions[Math.floor(Math.random() * challengingReactions.length)];

    if (currentQ <= 2) {
      nextQuestion = `Ceritakan kegagalan atau kesalahan terbesar yang pernah kamu perbuat dalam proyek, dan apa tindakan konkret yang kamu lakukan saat semua orang menyalahkan hasil kerjamu?`;
    } else if (currentQ === 3) {
      nextQuestion = `Bagaimana jika atasanmu meminta solusi yang kamu tahu secara teknis keliru dan berbahaya, sementara tenggat waktu tinggal beberapa jam? Apa tindakan tegasmu?`;
    } else if (currentQ < ctx.totalQuestions) {
      nextQuestion = `Banyak pelamar untuk posisi ${ctx.position} di ${ctx.company} memiliki pengalaman lebih banyak darimu. Beri saya 1 alasan paling kritis mengapa kami tidak boleh menolakmu hari ini?`;
    } else {
      nextQuestion = `Sesi evaluasi kritis telah usai. Jika kamu punya pertanyaan yang berbobot seputar tantangan terberat di ${ctx.company}, silakan ajukan sekarang.`;
    }
  }

  const fullReply = `${reaction} ${nextQuestion}`.trim();
  const tokens = fullReply.split(/(\s+)/);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: token })}\n\n`));
        await new Promise((r) => setTimeout(r, 22));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}
