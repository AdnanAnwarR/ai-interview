import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateDynamicOpeningGreeting } from '@/lib/ai/dynamicInterview';

const createInterviewSchema = z
  .object({
    company: z.string().trim().min(1).max(100).optional(),
    companyName: z.string().trim().min(1).max(100).optional(),
    position: z.string().trim().min(1).max(100).optional(),
    targetRole: z.string().trim().min(1).max(100).optional(),
    level: z.enum(['magang', 'fresh_graduate', 'junior']),
    style: z.enum(['ramah', 'tegas', 'stress']).optional(),
    interviewerStyle: z.enum(['ramah', 'tegas', 'stress']).optional(),
    totalQuestions: z.union([z.literal(5), z.literal(8), z.literal(10)]).optional(),
    questionCount: z.union([z.literal(5), z.literal(8), z.literal(10)]).optional(),
  })
  .transform((data) => ({
    company: (data.company || data.companyName || '').trim(),
    position: (data.position || data.targetRole || '').trim(),
    level: data.level,
    style: data.style || data.interviewerStyle || 'ramah',
    totalQuestions: data.totalQuestions || data.questionCount || 5,
  }))
  .refine((d) => d.company.length > 0 && d.position.length > 0, {
    message: 'Nama perusahaan dan posisi wajib diisi',
  });

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Anda harus masuk terlebih dahulu untuk memulai wawancara.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parseResult = createInterviewSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { company, position, level, style, totalQuestions } = parseResult.data;

    // Jika pengguna masih memiliki sesi aktif sebelumnya, otomatis selesaikan sesi lama tersebut
    // agar pengguna (termasuk user PRO) bisa langsung memulai sesi latihan baru tanpa terblokir
    const existingActiveSession = await db.interviewSession.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    if (existingActiveSession) {
      await db.interviewSession.update({
        where: { id: existingActiveSession.id },
        data: { status: 'FINISHED', endedAt: new Date() },
      });
    }

    // Cek saldo kredit atau langganan aktif
    const hasActiveSubscription = user.subscriptionUntil && new Date(user.subscriptionUntil) > new Date();

    if (!hasActiveSubscription && user.credits <= 0) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          message: 'Saldo sesi latihan Anda telah habis. Silakan pilih paket untuk melanjutkan.',
        },
        { status: 403 }
      );
    }

    // Transaksi atomik: kurangi saldo (jika bukan langganan) dan buat sesi
    const session = await db.$transaction(async (tx) => {
      if (!hasActiveSubscription) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            credits: {
              decrement: 1,
            },
          },
        });
      }

      return tx.interviewSession.create({
        data: {
          userId: user.id,
          company,
          position,
          level,
          style,
          totalQuestions,
          status: 'ACTIVE',
        },
      });
    });

    // Buat sapaan pembuka dinamis & natural (Gemini / Human Varied)
    const openingGreeting = await generateDynamicOpeningGreeting({
      company,
      position,
      level,
      style,
      totalQuestions,
      currentQuestionIndex: 1,
    });

    // Simpan pesan pembuka sebagai Message pertama
    const initialMessage = await db.message.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: openingGreeting,
        questionIndex: 1,
      },
    });

    return NextResponse.json({
      success: true,
      id: session.id,
      session: {
        ...session,
        messages: [initialMessage],
      },
    });
  } catch (error) {
    console.error('Error creating interview session:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal membuat sesi wawancara.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Anda harus masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const sessions = await db.interviewSession.findMany({
      where: { userId: user.id },
      include: {
        evaluation: {
          select: {
            overallScore: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isSubscribed = user.subscriptionUntil && new Date(user.subscriptionUntil) > new Date();

    return NextResponse.json({
      credits: user.credits,
      subscriptionUntil: user.subscriptionUntil,
      isSubscribed,
      sessions: sessions.map((s) => ({
        id: s.id,
        company: s.company,
        position: s.position,
        level: s.level,
        style: s.style,
        totalQuestions: s.totalQuestions,
        status: s.status,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        overallScore: s.evaluation?.overallScore ?? null,
      })),
    });
  } catch (error) {
    console.error('Error fetching interview sessions:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal mengambil riwayat wawancara.' },
      { status: 500 }
    );
  }
}
