import { NextRequest, NextResponse } from 'next/server';
import { midtransCreatePaymentSchema } from '@/lib/validations/interview';
import { PRICING_CONFIG } from '@/config/pricing';
import { createMidtransTransaction } from '@/lib/payment/midtrans';
import { checkRateLimit } from '@/lib/ratelimit';
import { interviewStore } from '@/lib/store/interviewStore';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await checkRateLimit(ip, 30, 60).catch(() => ({ success: true }));

    const body = await req.json().catch(() => ({}));
    const parseResult = midtransCreatePaymentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Data pembayaran tidak valid', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { tierId, customerName, customerEmail } = parseResult.data;
    
    // Cari plan dari PRICING_CONFIG (atau alias)
    const plan = PRICING_CONFIG.plans.find(
      (p) => p.id === tierId || (tierId === 'pro_pack' && p.id === 'pack_5_sessions')
    );

    if (!plan) {
      return NextResponse.json({ error: 'Paket langganan tidak ditemukan' }, { status: 404 });
    }

    const orderId = `WAWANCARAIN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Top up saldo sesi ke store:
    // Jika langganan bulanan -> upgrade ke status 'pro'
    // Jika per-sesi -> tambahkan jumlah sesi ke saldo yang sudah ada
    const targetPlan = plan.id === 'unlimited_monthly' ? 'pro' : undefined;
    interviewStore.topUpSession(plan.sessions || 1, targetPlan);

    const rawServerKey = (process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-KBd3GkUKNoS0dk-jsKlO7SCN').replace(/['"]/g, '').trim();

    // Jika Midtrans Server Key asli terisi di environment variable
    if (rawServerKey && !rawServerKey.includes('placeholder')) {
      try {
        const snapResult = await createMidtransTransaction({
          orderId,
          grossAmount: plan.price,
          customerName: customerName || 'Kandidat',
          customerEmail: customerEmail || 'kandidat@wawancarain.id',
          packageName: plan.name,
        });

        return NextResponse.json({
          orderId,
          token: snapResult.token,
          redirectUrl: snapResult.redirectUrl,
          amount: plan.price,
          sessionsAdded: plan.sessions || 1,
        });
      } catch (err: unknown) {
        console.error('Midtrans Snap call error:', err);
        const errMsg = err instanceof Error ? err.message : 'Gagal menghubungi server Midtrans';
        return NextResponse.json(
          { error: `Gagal membuat transaksi Midtrans: ${errMsg}` },
          { status: 502 }
        );
      }
    }

    // Sandbox / Instant Simulation response jika tidak ada key
    return NextResponse.json({
      orderId,
      token: `sim_snap_${Date.now()}`,
      redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/sim_${orderId}`,
      amount: plan.price,
      sessionsAdded: plan.sessions,
      isSimulated: true,
      message: `Simulasi pembayaran berhasil! ${plan.sessions} sesi latihan telah ditambahkan ke akun Anda.`,
    });
  } catch (error: unknown) {
    console.error('Payment create error:', error);
    const msg = error instanceof Error ? error.message : 'Gagal memproses pembayaran';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
