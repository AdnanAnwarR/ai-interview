import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { evaluateInterview } from '@/lib/ai/claude';
import { Prisma } from '@prisma/client';

export async function POST(
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

    // Pengecekan kepemilikan data
    if (session.userId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses ke sesi ini.' },
        { status: 403 }
      );
    }

    // IDEMPOTEN: Kalau sudah ada Evaluation di database, langsung kembalikan yang ada
    if (session.evaluation) {
      return NextResponse.json({
        success: true,
        isExisting: true,
        overallScore: session.evaluation.overallScore,
        evaluation: session.evaluation.json,
      });
    }

    // Tandai status sesi FINISHED dan catat endedAt
    await db.interviewSession.update({
      where: { id },
      data: {
        status: 'FINISHED',
        endedAt: session.endedAt || new Date(),
      },
    });

    // Kirim seluruh transkrip ke Claude untuk dinilai dengan validasi Zod
    const evaluationData = await evaluateInterview(
      {
        perusahaan: session.company,
        posisi: session.position,
        level: session.level,
      },
      session.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        questionIndex: m.questionIndex,
      }))
    );

    // Simpan ke model Evaluation di database
    const savedEvaluation = await db.evaluation.create({
      data: {
        sessionId: id,
        overallScore: evaluationData.overall.score,
        json: evaluationData as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      isExisting: false,
      overallScore: savedEvaluation.overallScore,
      evaluation: savedEvaluation.json,
    });
  } catch (error) {
    console.error('Error finishing interview session:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal menyelesaikan dan mengevaluasi wawancara.' },
      { status: 500 }
    );
  }
}
