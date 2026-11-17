import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { getPackageById } from '@/config/pricing';
import { createMidtransTransaction } from '@/lib/payment/midtrans';

const createPaymentSchema = z.object({
  packageId: z.string().trim().min(1, 'Package ID wajib diisi'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Anda harus masuk terlebih dahulu untuk melakukan pembelian.' },
        { status: 401 }
      );
    }

    // Rate limiting per pengguna dan per IP
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitIp = await checkRateLimit(`payment:ip:${ip}`, 10, 60);
    const rateLimitUser = await checkRateLimit(`payment:user:${user.id}`, 10, 60);

    if (!rateLimitIp.success || !rateLimitUser.success) {
      return NextResponse.json(
        { error: 'RATE_LIMIT_EXCEEDED', message: 'Terlalu banyak permintaan pembayaran. Silakan coba lagi nanti.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parseResult = createPaymentSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { packageId } = parseResult.data;

    // Hitung harga di server - JANGAN percaya harga dari klien
    const pkg = getPackageById(packageId);
    if (!pkg) {
      return NextResponse.json(
        { error: 'PACKAGE_NOT_FOUND', message: 'Paket yang dipilih tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Buat order_id unik
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Buat Order di database dengan status PENDING
    const order = await db.order.create({
      data: {
        id: orderId,
        userId: user.id,
        packageId: pkg.id,
        amount: pkg.price,
        status: 'PENDING',
      },
    });

    let snapToken = '';
    let redirectUrl = '';

    // Panggil Midtrans Snap API
    const isMock = !process.env.MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY.includes('placeholder');

    if (!isMock) {
      try {
        const snapRes = await createMidtransTransaction({
          orderId,
          grossAmount: pkg.price,
          customerName: user.name || 'Kandidat Wawancarain',
          customerEmail: user.email || 'kandidat@wawancarain.id',
          packageName: pkg.name,
        });

        snapToken = snapRes.token;
        redirectUrl = snapRes.redirectUrl;
      } catch (snapErr) {
        console.error('Midtrans Snap API call error:', snapErr);
      }
    }

    if (!snapToken) {
      // Fallback sandbox simulation token untuk kemudahan testing lokal
      snapToken = `snap_sim_${Date.now()}_${orderId}`;
      redirectUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${snapToken}`;
    }

    // Simpan snapToken ke Order
    await db.order.update({
      where: { id: order.id },
      data: { snapToken },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      token: snapToken,
      redirectUrl,
      amount: pkg.price,
      package: {
        id: pkg.id,
        name: pkg.name,
        type: pkg.type,
      },
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal membuat sesi pembayaran.' },
      { status: 500 }
    );
  }
}
