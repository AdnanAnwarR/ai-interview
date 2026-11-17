import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { interviewStore } from '@/lib/store/interviewStore';
import { InterviewConfig } from '@/types/wawancara';

const createInterviewSchema = z.object({
  companyName: z.string().min(1, 'Nama perusahaan wajib diisi'),
  targetRole: z.string().min(1, 'Posisi yang dilamar wajib diisi'),
  level: z.enum(['magang', 'fresh_graduate', 'junior']),
  interviewerStyle: z.enum(['ramah', 'tegas', 'stress']),
  questionCount: z.union([z.literal(5), z.literal(8), z.literal(10)]),
  answerMode: z.enum(['suara', 'ketik']),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = createInterviewSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const config: InterviewConfig = validation.data;

    // Cek saldo kuota sesi pengguna
    const hasRemaining = interviewStore.consumeSession();
    if (!hasRemaining) {
      return NextResponse.json(
        { error: 'QUOTA_EXCEEDED', message: 'Saldo sesi latihan Anda sudah habis. Silakan pilih paket untuk melanjutkan.' },
        { status: 403 }
      );
    }

    const session = interviewStore.createSession(config);

    return NextResponse.json({
      success: true,
      id: session.id,
      session,
    });
  } catch (err) {
    console.error('Error creating interview:', err);
    return NextResponse.json({ error: 'Gagal membuat sesi wawancara' }, { status: 500 });
  }
}

export async function GET() {
  const data = interviewStore.getUserDashboardData();
  return NextResponse.json(data);
}
