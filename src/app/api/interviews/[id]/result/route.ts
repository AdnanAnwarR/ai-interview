import { NextRequest, NextResponse } from 'next/server';
import { interviewStore } from '@/lib/store/interviewStore';
import { generateScorecardResult } from '@/lib/ai/scorecardGenerator';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = interviewStore.getSession(id);

  if (!session) {
    return NextResponse.json({ error: 'Sesi wawancara tidak ditemukan' }, { status: 404 });
  }

  // Jika result belum dihasilkan, bangkitkan sekarang
  if (!session.result) {
    session.result = generateScorecardResult(session);
    session.status = 'completed';
    interviewStore.updateSession(id, {
      result: session.result,
      status: 'completed',
    });
  }

  return NextResponse.json({
    result: session.result,
    config: session.config,
  });
}
