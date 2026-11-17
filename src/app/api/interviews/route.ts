import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { buildInterviewerSystemPrompt } from '@/lib/ai/claude';
import Anthropic from '@anthropic-ai/sdk';

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

    // Batasi 1 sesi ACTIVE per pengguna
    const existingActiveSession = await db.interviewSession.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    });

    if (existingActiveSession) {
      const now = Date.now();
      const started = new Date(existingActiveSession.startedAt).getTime();
      const diffMinutes = (now - started) / (1000 * 60);

      // Jika sesi aktif masih berlangsung < 45 menit, tolak pembuatan sesi ganda
      if (diffMinutes < 45) {
        return NextResponse.json(
          {
            error: 'ACTIVE_SESSION_EXISTS',
            message: 'Anda masih memiliki sesi wawancara yang sedang aktif. Silakan selesaikan sesi tersebut terlebih dahulu.',
            activeSessionId: existingActiveSession.id,
          },
          { status: 409 }
        );
      } else {
        // Otomatis tutup sesi usang (> 45 menit)
        await db.interviewSession.update({
          where: { id: existingActiveSession.id },
          data: { status: 'FINISHED', endedAt: new Date() },
        });
      }
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

    // Minta pesan pembuka dari Claude untuk sesi baru
    let openingGreeting = '';
    const systemPrompt = buildInterviewerSystemPrompt({
      company,
      position,
      level,
      style,
      totalQuestions,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model = process.env.ANTHROPIC_MODEL_INTERVIEW || 'claude-haiku-5-5';

    if (apiKey && !apiKey.includes('placeholder')) {
      try {
        const client = new Anthropic({ apiKey: apiKey.trim() });
        const aiRes = await client.messages.create({
          model: model.includes('5-5') ? 'claude-3-5-haiku-20241022' : model,
          max_tokens: 300,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: `Mulai sesi wawancara sekarang. Sapa saya dengan sopan, perkenalkan nama Anda dan peran di ${company}, lalu ajukan pertanyaan pembuka pertama untuk posisi ${position}.`,
            },
          ],
        });

        const firstBlock = aiRes.content[0];
        if (firstBlock && firstBlock.type === 'text') {
          openingGreeting = firstBlock.text.trim();
        }
      } catch (err) {
        console.warn('Claude opening generation failed, using tailored fallback:', err);
      }
    }

    if (!openingGreeting) {
      const interviewerName = style === 'stress' ? 'Budi' : style === 'tegas' ? 'Alex' : 'Sarah';
      openingGreeting = `Halo! Selamat datang di sesi wawancara untuk posisi ${position} di ${company}. Saya ${interviewerName} yang akan memandu sesi Anda hari ini. Untuk memulai, bisakah Anda memperkenalkan diri secara ringkas dan apa yang memotivasi Anda melamar posisi ini?`;
    }

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
