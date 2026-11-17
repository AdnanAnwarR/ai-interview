import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { evaluateInterview } from '@/lib/ai/claude';
import { interviewStore } from '@/lib/store/interviewStore';
import { Prisma } from '@prisma/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Cek di PostgreSQL database terlebih dahulu
    try {
      const user = await getCurrentUser();
      const dbSession = await db.interviewSession.findUnique({
        where: { id },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
          evaluation: true,
        },
      });

      if (dbSession) {
        if (user && dbSession.userId !== user.id) {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses ke hasil ini.' },
            { status: 403 }
          );
        }

        let evaluationData = dbSession.evaluation?.json;

        if (!evaluationData) {
          const evalResult = await evaluateInterview(
            {
              company: dbSession.company,
              position: dbSession.position,
              level: dbSession.level,
              style: dbSession.style,
            },
            dbSession.messages.map((m) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              questionIndex: m.questionIndex,
            }))
          );

          const savedEval = await db.evaluation.create({
            data: {
              sessionId: dbSession.id,
              overallScore: evalResult.overallScore,
              json: evalResult as unknown as Prisma.InputJsonValue,
            },
          });

          evaluationData = savedEval.json;
        }

        return NextResponse.json({
          result: evaluationData,
          config: {
            companyName: dbSession.company,
            targetRole: dbSession.position,
            level: dbSession.level,
            interviewerStyle: dbSession.style,
            questionCount: dbSession.totalQuestions,
          },
        });
      }
    } catch (dbErr) {
      console.warn('Database lookup for result failed, checking memory store:', dbErr);
    }

    // 2. Fallback memory store untuk sesi demo
    const memSession = interviewStore.getSession(id);
    if (memSession) {
      if (!memSession.result) {
        const { generateScorecardResult } = await import('@/lib/ai/scorecardGenerator');
        memSession.result = generateScorecardResult(memSession);
        memSession.status = 'completed';
        interviewStore.updateSession(id, {
          result: memSession.result,
          status: 'completed',
        });
      }

      return NextResponse.json({
        result: memSession.result,
        config: memSession.config,
      });
    }

    return NextResponse.json({ error: 'Sesi wawancara tidak ditemukan' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching interview result:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal mengambil hasil evaluasi.' },
      { status: 500 }
    );
  }
}
