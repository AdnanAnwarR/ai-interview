import { NextRequest } from 'next/server';
import { interviewStore } from '@/lib/store/interviewStore';
import { generateScorecardResult } from '@/lib/ai/scorecardGenerator';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = interviewStore.getSession(id);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Sesi tidak ditemukan' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { message: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Format body tidak valid' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const userText = (body.message || '').trim();
  if (!userText) {
    return new Response(JSON.stringify({ error: 'Pesan tidak boleh kosong' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Simpan jawaban pengguna
  const currentIdx = session.currentQuestionIndex;
  const userMsg = {
    id: 'user-' + Date.now(),
    sender: 'user' as const,
    text: userText,
    timestamp: Date.now(),
    questionIndex: currentIdx,
  };
  session.messages.push(userMsg);

  const isFinalQuestion = currentIdx >= session.totalQuestions;
  const nextIdx = isFinalQuestion ? currentIdx : currentIdx + 1;

  // Siapkan respons AI berdasarkan gaya pewawancara dan progres pertanyaan
  let aiResponseText = '';
  const { companyName, targetRole, interviewerStyle } = session.config;

  if (isFinalQuestion) {
    // Penutupan wawancara
    if (interviewerStyle === 'ramah') {
      aiResponseText = `Terima kasih banyak atas waktu dan seluruh jawaban yang Anda sampaikan dengan sangat baik hari ini. Seluruh rangkaian wawancara untuk posisi ${targetRole} di ${companyName} telah selesai. Kami sangat mengapresiasi persiapan dan kejujuran Anda. Silakan klik tombol di bawah untuk melihat hasil evaluasi dan penilaian detail performa Anda.`;
    } else if (interviewerStyle === 'tegas') {
      aiResponseText = `Baik, seluruh daftar pertanyaan seleksi ${companyName} telah terjawab. Kami sudah mencatat seluruh poin kunci dari jawaban Anda. Wawancara resmi ditutup. Silakan akses laporan evaluasi Anda sekarang.`;
    } else {
      aiResponseText = `Cukup. Anda telah menyelesaikan sesi wawancara bertekanan tinggi ini untuk ${companyName}. Kami telah mengumpulkan data performa komunikasi dan ketahanan Anda. Wawancara selesai, silakan periksa skor evaluasi akhir Anda.`;
    }

    session.status = 'completed';
    // Bangkitkan hasil evaluasi mendalam
    const generatedResult = generateScorecardResult(session);
    session.result = generatedResult;
  } else {
    // Pertanyaan berikutnya
    session.currentQuestionIndex = nextIdx;
    
    // Bank pertanyaan berbobot STAR untuk mahasiswa & fresh graduate
    const questionBankByStyle: Record<string, string[]> = {
      ramah: [
        `Menarik sekali. Untuk pertanyaan ke-${nextIdx}: Bisakah Anda menceritakan pengalaman nyata saat Anda menghadapi tantangan atau kesulitan dalam tim, dan bagaimana langkah konkret Anda menyelesaikannya?`,
        `Bagus sekali penjelasannya. Pertanyaan ke-${nextIdx}: Ketika Anda memiliki banyak tugas kuliah atau proyek dengan tenggat waktu yang bersamaan, bagaimana strategi Anda mengatur prioritas?`,
        `Sangat relevan. Pertanyaan ke-${nextIdx}: Ceritakan situasi di mana Anda pernah membuat kesalahan atau menghadapi kegagalan dalam tugas, dan apa pelajaran penting yang Anda ambil?`,
        `Terima kasih. Pertanyaan ke-${nextIdx}: Bagaimana cara Anda beradaptasi ketika harus mempelajari teknologi, alat kerja, atau regulasi baru dalam waktu yang sangat singkat?`,
        `Menarik. Pertanyaan ke-${nextIdx}: Bagaimana visi karier Anda dalam 2 hingga 3 tahun ke depan bersama ${companyName}?`,
      ],
      tegas: [
        `Catatan diterima. Masuk ke pertanyaan ke-${nextIdx}: Berikan contoh spesifik di mana inisiatif pribadi Anda memberikan dampak langsung yang terukur pada keberhasilan proyek.`,
        `Pertanyaan ke-${nextIdx}: Bagaimana Anda meyakinkan rekan kerja atau atasan yang memiliki pandangan berbeda dan menolak ide yang Anda usulkan?`,
        `Pertanyaan ke-${nextIdx}: Sebutkan kelemahan terbesar yang masih Anda miliki terkait posisi ${targetRole} ini dan apa langkah nyata yang sedang Anda lakukan untuk memperbaikinya?`,
        `Pertanyaan ke-${nextIdx}: Jika dalam minggu pertama kerja Anda di ${companyName} terjadi insiden kritis tanpa dokumentasi jelas, apa tiga tindakan pertama yang akan Anda lakukan?`,
        `Pertanyaan ke-${nextIdx}: Mengapa Anda yakin kompetensi Anda saat ini relevan dengan standar tinggi yang kami tetapkan di ${companyName}?`,
      ],
      stress: [
        `Penjelasan Anda terdengar standar. Untuk pertanyaan ke-${nextIdx}: Jika atasan Anda memberikan kritik tajam di depan forum mengenai pekerjaan yang Anda rasa sudah maksimal, bagaimana Anda meresponsnya secara profesional?`,
        `Pertanyaan ke-${nextIdx}: Bagaimana Anda tetap menjaga akurasi pekerjaan saat dituntut menyelesaikan tugas dalam kondisi tekanan waktu yang tidak masuk akal?`,
        `Pertanyaan ke-${nextIdx}: Apakah Anda siap jika beban kerja di posisi ini menuntut Anda keluar dari zona nyaman dan bertanggung jawab penuh atas kegagalan sistem?`,
        `Pertanyaan ke-${nextIdx}: Banyak kandidat lain memiliki portofolio lebih lengkap dari Anda. Berikan satu alasan tanpa basa-basi mengapa kami harus memilih Anda hari ini?`,
        `Pertanyaan ke-${nextIdx}: Apa yang akan Anda lakukan jika proyek yang Anda pimpin selama 3 bulan tiba-tiba dibatalkan oleh manajemen puncak?`,
      ],
    };

    const questions = questionBankByStyle[interviewerStyle] || questionBankByStyle.ramah;
    const qIndex = (nextIdx - 2) % questions.length;
    aiResponseText = questions[qIndex];
  }

  // Simpan respons AI ke riwayat
  const aiMsg = {
    id: 'ai-' + Date.now(),
    sender: 'ai' as const,
    text: aiResponseText,
    timestamp: Date.now(),
    questionIndex: nextIdx,
  };
  session.messages.push(aiMsg);
  interviewStore.updateSession(id, {
    messages: session.messages,
    currentQuestionIndex: session.currentQuestionIndex,
    status: session.status,
    result: session.result,
  });

  // Streaming response menggunakan ReadableStream
  const encoder = new TextEncoder();
  const tokens = aiResponseText.split(/(\s+)/); // Pisahkan kata dan spasi

  const stream = new ReadableStream({
    async start(controller) {
      for (const token of tokens) {
        controller.enqueue(encoder.encode(token));
        // Simulasi streaming latensi natural AI per kata (25ms)
        await new Promise((resolve) => setTimeout(resolve, 25));
      }

      // Metadata penutup dikirim dalam header khusus atau delimiter
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Is-Finished': isFinalQuestion ? 'true' : 'false',
      'X-Question-Index': String(session.currentQuestionIndex),
      'X-Total-Questions': String(session.totalQuestions),
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
