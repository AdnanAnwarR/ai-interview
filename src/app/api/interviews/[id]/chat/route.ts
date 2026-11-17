import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { buildInterviewerSystemPrompt, streamInterviewerReply } from '@/lib/ai/claude';

const chatInputSchema = z
  .object({
    content: z.string().trim().max(2000).optional(),
    message: z.string().trim().max(2000).optional(),
  })
  .transform((d) => ({
    content: (d.content || d.message || '').trim(),
  }))
  .refine((d) => d.content.length > 0, {
    message: 'Jawaban tidak boleh kosong dan maksimal 2.000 karakter',
  });

export async function POST(
  req: NextRequest,
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

    // Rate limit per pengguna & per IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitIp = await checkRateLimit(`chat:ip:${ip}`, 30, 60);
    const rateLimitUser = await checkRateLimit(`chat:user:${user.id}`, 30, 60);

    if (!rateLimitIp.success || !rateLimitUser.success) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Terlalu banyak permintaan percakapan. Mohon tunggu beberapa saat.' },
        { status: 429 }
      );
    }

    const { id } = await params;

    // Ambil data sesi dari database
    const session = await db.interviewSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
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

    // Validasi status sesi
    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'SESSION_NOT_ACTIVE', message: 'Sesi wawancara ini sudah selesai atau telah ditutup.' },
        { status: 400 }
      );
    }

    // Batasi durasi maksimum sesi (45 menit)
    const now = Date.now();
    const startedAt = new Date(session.startedAt).getTime();
    if (now - startedAt > 45 * 60 * 1000) {
      await db.interviewSession.update({
        where: { id },
        data: { status: 'FINISHED', endedAt: new Date() },
      });
      return NextResponse.json(
        { error: 'SESSION_TIMEOUT', message: 'Batas durasi waktu wawancara (45 menit) telah tercapai.' },
        { status: 400 }
      );
    }

    // Hitung jumlah jawaban user yang sudah ada
    const userAnswersCount = session.messages.filter((m) => m.role === 'user').length;
    if (userAnswersCount >= session.totalQuestions) {
      return NextResponse.json(
        { error: 'MAX_QUESTIONS_REACHED', message: 'Seluruh pertanyaan dalam sesi ini sudah dijawab.' },
        { status: 400 }
      );
    }

    // Validasi input jawaban pengguna
    const body = await req.json();
    const parseResult = chatInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const userAnswerText = parseResult.data.content;
    const currentQuestionIndex = userAnswersCount + 1;
    const isLastQuestion = currentQuestionIndex >= session.totalQuestions;

    // Simpan jawaban pengguna ke database
    await db.message.create({
      data: {
        sessionId: id,
        role: 'user',
        content: userAnswerText,
        questionIndex: currentQuestionIndex,
      },
    });

    // Susun riwayat percakapan murni dari database
    const conversationHistory = session.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    conversationHistory.push({
      role: 'user',
      content: userAnswerText,
    });

    const systemPrompt = buildInterviewerSystemPrompt({
      perusahaan: session.company,
      posisi: session.position,
      level: session.level,
      gaya: session.style,
      total_pertanyaan: session.totalQuestions,
      nomor_sekarang: currentQuestionIndex,
    });

    // Panggil Claude dengan streaming
    const claudeStream = await streamInterviewerReply(conversationHistory, systemPrompt);

    // Siapkan transform stream untuk menangkap teks lengkap dan menyimpannya ke database
    let accumulatedAiResponse = '';
    const nextQuestionIndex = isLastQuestion ? currentQuestionIndex : currentQuestionIndex + 1;

    const transformStream = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        // Dekode data SSE untuk mengumpulkan balasan AI
        const text = new TextDecoder().decode(chunk);
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) accumulatedAiResponse += data.text;
            } catch {
              // ignore json parse error
            }
          }
        }
        controller.enqueue(chunk);
      },
      async flush() {
        // Simpan balasan AI ke database setelah stream selesai
        if (accumulatedAiResponse.trim()) {
          try {
            await db.message.create({
              data: {
                sessionId: id,
                role: 'assistant',
                content: accumulatedAiResponse.trim(),
                questionIndex: nextQuestionIndex,
              },
            });

            // Jika pertanyaan terakhir, tandai sesi selesai
            if (isLastQuestion) {
              await db.interviewSession.update({
                where: { id },
                data: {
                  status: 'FINISHED',
                  endedAt: new Date(),
                },
              });
            }
          } catch (dbErr) {
            console.error('Error saving AI assistant reply to database:', dbErr);
          }
        }
      },
    });

    const streamResponse = claudeStream.pipeThrough(transformStream);

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Question-Index': String(nextQuestionIndex),
        'X-Is-Finished': isLastQuestion ? 'true' : 'false',
      },
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal memproses percakapan.' },
      { status: 500 }
    );
  }
}
