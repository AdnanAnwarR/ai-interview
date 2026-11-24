import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Anda harus masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const session = await db.interviewSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        evaluation: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Sesi wawancara tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Pengecekan kepemilikan data yang ketat
    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses ke sesi wawancara ini.' },
        { status: 403 }
      );
    }

    // Hitung index pertanyaan saat ini
    const lastMessage = session.messages[session.messages.length - 1];
    const currentQuestionIndex = lastMessage?.questionIndex || 1;

    const config = {
      companyName: session.company,
      targetRole: session.position,
      level: session.level,
      interviewerStyle: session.style,
      questionCount: session.totalQuestions,
      answerMode: 'suara',
    };

    return NextResponse.json({
      id: session.id,
      config,
      company: session.company,
      position: session.position,
      level: session.level,
      style: session.style,
      totalQuestions: session.totalQuestions,
      status: session.status,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      currentQuestionIndex,
      messages: session.messages.map((m) => ({
        id: m.id,
        sender: (m.role === 'assistant' ? 'ai' : 'user') as 'ai' | 'user',
        role: m.role,
        text: m.content,
        content: m.content,
        timestamp: new Date(m.createdAt).getTime(),
        questionIndex: m.questionIndex,
      })),
      evaluation: session.evaluation
        ? {
            id: session.evaluation.id,
            overallScore: session.evaluation.overallScore,
            json: session.evaluation.json,
            createdAt: session.evaluation.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching interview detail:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal mengambil detail wawancara.' },
      { status: 500 }
    );
  }
}
