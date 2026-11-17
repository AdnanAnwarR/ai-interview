import { NextRequest, NextResponse } from 'next/server';
import { interviewStore } from '@/lib/store/interviewStore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = interviewStore.getSession(id);

  if (!session) {
    return NextResponse.json({ error: 'Sesi wawancara tidak ditemukan' }, { status: 404 });
  }

  // Jika sesi baru dan belum ada pesan pembuka, buat pesan sambutan pertama
  if (session.messages.length === 0) {
    const { companyName, targetRole, level, interviewerStyle } = session.config;
    let greeting = '';

    const levelText = level === 'magang' ? 'posisi Magang' : level === 'fresh_graduate' ? 'posisi Fresh Graduate' : 'posisi Junior';

    if (interviewerStyle === 'ramah') {
      greeting = `Halo! Selamat datang di sesi wawancara untuk ${targetRole} (${levelText}) di ${companyName}. Saya Sarah dari tim rekrutmen. Senang sekali bisa berbincang dengan Anda hari ini. Untuk memulai, bisakah Anda menceritakan sedikit tentang diri Anda dan apa yang membuat Anda tertarik bergabung dengan ${companyName}?`;
    } else if (interviewerStyle === 'tegas') {
      greeting = `Selamat datang di seleksi wawancara ${companyName} untuk ${targetRole}. Saya pewawancara Anda hari ini. Langsung saja ke inti: perkenalkan diri Anda secara ringkas dan sebutkan kontribusi nyata apa yang siap Anda berikan untuk perusahaan ini.`;
    } else {
      // stress interview style
      greeting = `Halo. Di ${companyName}, kami bekerja dengan ritme sangat cepat dan ekspektasi tinggi untuk ${targetRole}. Pelamar untuk posisi ini sangat banyak dan kompetitif. Coba jelaskan dalam waktu singkat, mengapa kami harus mempertimbangkan Anda dibanding kandidat lain yang mungkin punya pengalaman lebih banyak?`;
    }

    const openingMessage = {
      id: 'msg-' + Date.now(),
      sender: 'ai' as const,
      text: greeting,
      timestamp: Date.now(),
      questionIndex: 1,
    };

    session.messages.push(openingMessage);
    session.status = 'in_progress';
    interviewStore.updateSession(id, {
      messages: session.messages,
      status: 'in_progress',
    });
  }

  return NextResponse.json({
    id: session.id,
    config: session.config,
    status: session.status,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: session.totalQuestions,
    messages: session.messages,
    createdAt: session.createdAt,
  });
}
