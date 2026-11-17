import { NextRequest, NextResponse } from 'next/server';
import { midtransCreatePaymentSchema } from '@/lib/validations/interview';
import { PRICING_CONFIG } from '@/config/pricing';
import { createMidtransTransaction } from '@/lib/payment/midtrans';
import { checkRateLimit } from '@/lib/ratelimit';
import { interviewStore } from '@/lib/store/interviewStore';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimit = await checkRateLimit(ip, 10, 60);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan pembayaran. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }

    const body = await req.json();
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

    // Top up saldo sesi ke store secara otomatis
    interviewStore.topUpSession(plan.sessions || 1, plan.id === 'unlimited_monthly' ? 'unlimited' : 'pro');

    // Jika Midtrans Server Key asli terisi di environment variable
    if (process.env.MIDTRANS_SERVER_KEY && !process.env.MIDTRANS_SERVER_KEY.includes('placeholder')) {
      try {
        const snapResult = await createMidtransTransaction({
          orderId,
          grossAmount: plan.price,
          customerName,
          customerEmail,
          packageName: plan.name,
        });

        return NextResponse.json({
          orderId,
          token: snapResult.token,
          redirectUrl: snapResult.redirectUrl,
          amount: plan.price,
          sessionsAdded: plan.sessions || 1,
        });
      } catch (err) {
        console.warn('Midtrans Snap call failed, falling back to simulated checkout:', err);
      }
    }

    // Sandbox / Instant Simulation response untuk pengujian lokal
    return NextResponse.json({
      orderId,
      token: `sim_snap_${Date.now()}`,
      redirectUrl: `https://app.sandbox.midtrans.com/snap/v2/vtweb/sim_${orderId}`,
      amount: plan.price,
      sessionsAdded: plan.sessions,
      isSimulated: true,
      message: `Simulasi pembayaran berhasil! ${plan.sessions} sesi latihan telah ditambahkan ke akun Anda.`,
    });
  } catch (error) {
    console.error('Payment create error:', error);
    return NextResponse.json({ error: 'Gagal memproses pembayaran' }, { status: 500 });
  }
}
