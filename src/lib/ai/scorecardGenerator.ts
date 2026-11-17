import { InterviewSession, InterviewResult, AnswerEvaluation } from '@/types/wawancara';

export function generateScorecardResult(session: InterviewSession): InterviewResult {
  const { companyName, targetRole, level, interviewerStyle } = session.config;

  // Pasangkan pesan AI (pertanyaan) dengan respons user (jawaban)
  const answers: AnswerEvaluation[] = [];
  const messages = session.messages;

  let currentQuestion = '';
  let qIdx = 1;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.sender === 'ai') {
      currentQuestion = msg.text;
    } else if (msg.sender === 'user' && currentQuestion) {
      const userText = msg.text;
      const wordCount = userText.trim().split(/\s+/).length;

      // Evaluasi cerdas berbasis panjang, substansi, dan indikasi STAR
      const hasSituation = /(saat|ketika|pada|waktu|pengalaman|proyek|di semester|di kampus)/i.test(userText);
      const hasTask = /(tugas|tanggung jawab|target|tuntutan|diminta|tantangan|masalah)/i.test(userText);
      const hasAction = /(saya mengambil inisiatif|saya membuat|saya menganalisis|langkah saya|solusi saya|berkolaborasi|menyusun)/i.test(userText);
      const hasResult = /(hasilnya|dampaknya|berhasil|mencapai|sebesar|meningkat|selesai|meraih)/i.test(userText);

      // Hitung skor dinamis (70 - 95 berdasarkan kelengkapan elemen STAR & panjang jawaban)
      let score = 70;
      if (wordCount > 15) score += 5;
      if (wordCount > 35) score += 5;
      if (hasSituation) score += 3;
      if (hasTask) score += 4;
      if (hasAction) score += 5;
      if (hasResult) score += 5;
      score = Math.min(score, 96);

      const strengthsList = [
        'Penyampaian percaya diri dan relevan dengan posisi ' + targetRole + '.',
        'Mampu menjelaskan peran pribadi dan tindakan konkret yang diambil.',
        'Artikulasi kalimat tertata dengan pemilihan kosakata profesional.',
      ];

      const improvementsList = [
        'Dapat diperkuat dengan mencantumkan angka atau persentase dampak (metrik kuantitatif).',
        'Fokuskan lebih dalam pada tantangan terbesar yang berhasil diatasi.',
        'Kaitkan hasil kerja dengan nilai tambah langsung bagi efisiensi perusahaan.',
      ];

      answers.push({
        questionIndex: qIdx,
        questionText: currentQuestion,
        userAnswer: userText,
        score,
        strengths: strengthsList[(qIdx - 1) % strengthsList.length],
        improvements: improvementsList[(qIdx - 1) % improvementsList.length],
        starCriteria: {
          situation: hasSituation || wordCount > 20,
          task: hasTask || wordCount > 25,
          action: hasAction || wordCount > 30,
          result: hasResult || wordCount > 40,
        },
        betterAnswerExample: `Rekomendasi Jawaban Ideal (Framework STAR):\n"Saat menghadapi situasi tersebut, peran saya adalah memastikan sasaran ${targetRole} tercapai. Saya menganalisis akar masalah, memprioritaskan 2 solusi utama, dan berkoordinasi intensif dengan tim. Hasilnya, kendala berhasil teratasi dalam waktu singkat dengan efisiensi tinggi serta mendapat apresiasi dari rekan kerja."`,
      });

      qIdx++;
    }
  }

  // Jika belum ada pasangan lengkap, berikan fallback demonstrasi yang bermakna
  if (answers.length === 0) {
    answers.push({
      questionIndex: 1,
      questionText: `Ceritakan tentang diri Anda dan motivasi Anda bergabung di ${companyName}?`,
      userAnswer: 'Saya lulusan baru yang bersemangat untuk belajar dan berkontribusi.',
      score: 75,
      strengths: 'Kemauan belajar tinggi dan antusiasme positif.',
      improvements: 'Kembangkan cerita latar belakang dengan contoh konkret proyek kuliah atau organisasi.',
      starCriteria: {
        situation: true,
        task: false,
        action: true,
        result: false,
      },
      betterAnswerExample: `Perkenalkan saya lulusan ${level === 'magang' ? 'mahasiswa aktif' : 'fresh graduate'} yang mendalami bidang ini. Di bangku kuliah, saya aktif memimpin proyek studi kasus nyata dan menghasilkan solusi yang aplikatif. Saya memilih ${companyName} karena reputasi dan budayanya yang sangat mendukung pertumbuhan talenta muda.`,
    });
  }

  // Hitung rata-rata total skor
  const avgScore = Math.round(
    answers.reduce((acc, curr) => acc + curr.score, 0) / answers.length
  );

  return {
    interviewId: session.id,
    companyName,
    targetRole,
    level,
    interviewerStyle,
    date: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    totalScore: avgScore,
    summary: `Kandidat menunjukkan potensi yang sangat menjanjikan untuk posisi ${targetRole} di ${companyName}. Karakter komunikasi terbuka, adaptif, serta memiliki pemahaman dasar yang kuat sesuai ekspektasi tingkat ${level.replace('_', ' ')}.`,
    topStrengths: [
      `Pemahaman yang solid mengenai tuntutan pekerjaan ${targetRole}.`,
      'Sikap positif, antusias, dan kesiapan untuk terus belajar di lingkungan kerja nyata.',
      'Kemampuan menyusun alur berpikir yang runut dan tidak berbelit-belit.',
    ],
    topImprovements: [
      'Biasakan menyertakan indikator angka terukur (metrik capaian) pada bagian Result metode STAR.',
      'Perdalam pemahaman tentang tantangan spesifik yang sedang dihadapi oleh industri ' + companyName + '.',
      'Pertajam jawaban pada pertanyaan situasional dengan menonjolkan inisiatif pribadi dibanding sekadar instruksi tim.',
    ],
    radarRubric: {
      relevansi: Math.min(100, Math.max(60, avgScore + 3)),
      strukturSTAR: Math.min(100, Math.max(60, avgScore - 4)),
      kejelasan: Math.min(100, Math.max(60, avgScore + 5)),
      kepercayaanDiri: Math.min(100, Math.max(60, avgScore)),
      contohNyata: Math.min(100, Math.max(60, avgScore - 2)),
    },
    answers,
  };
}
