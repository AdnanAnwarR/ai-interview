import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyMidtransSignature } from '@/lib/payment/midtrans';
import { getPackageById } from '@/config/pricing';
import { Prisma } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        { error: 'PAYLOAD_INCOMPLETE', message: 'Parameter notifikasi Midtrans tidak lengkap.' },
        { status: 400 }
      );
    }

    // Verifikasi signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
    // Lewatkan verifikasi jika ServerKey berupa mock/sandbox testing lokal
    const isMock = !process.env.MIDTRANS_SERVER_KEY || process.env.MIDTRANS_SERVER_KEY.includes('placeholder');
    if (!isMock) {
      const isValid = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
      if (!isValid) {
        return NextResponse.json(
          { error: 'INVALID_SIGNATURE', message: 'Signature key tidak valid.' },
          { status: 400 }
        );
      }
    }

    // Cari Order di database
    const order = await db.order.findUnique({
      where: { id: order_id },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'ORDER_NOT_FOUND', message: `Order ${order_id} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Pemetaan status transaksi Midtrans
    let targetStatus: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' = 'PENDING';

    if (
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept')
    ) {
      targetStatus = 'PAID';
    } else if (transaction_status === 'pending') {
      targetStatus = 'PENDING';
    } else if (transaction_status === 'expire') {
      targetStatus = 'EXPIRED';
    } else if (['deny', 'cancel', 'failure'].includes(transaction_status)) {
      targetStatus = 'FAILED';
    }

    // IDEMPOTEN: Jangan menambahkan saldo dua kali jika order sudah berstatus PAID
    if (order.status === 'PAID') {
      return NextResponse.json({
        status: 'OK',
        message: 'Order sudah diproses sebelumnya (idempoten).',
      });
    }

    const pkg = getPackageById(order.packageId);

    // Proses dalam satu transaksi database atomik
    await db.$transaction(async (tx) => {
      // 1. Perbarui status order
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: targetStatus,
          paidAt: targetStatus === 'PAID' ? new Date() : null,
          midtransPayload: body as Prisma.InputJsonValue,
        },
      });

      // 2. Jika status PAID, tambah saldo atau perpanjang durasi langganan
      if (targetStatus === 'PAID' && pkg) {
        if (pkg.type === 'credits') {
          // Tambah saldo sesi
          await tx.user.update({
            where: { id: order.userId },
            data: {
              credits: {
                increment: pkg.sessions || 1,
              },
            },
          });
        } else if (pkg.type === 'subscription') {
          // Perpanjang langganan
          const currentExpiry = order.user?.subscriptionUntil ? new Date(order.user.subscriptionUntil) : null;
          const baseDate = currentExpiry && currentExpiry > new Date() ? currentExpiry : new Date();
          const daysToAdd = pkg.subscriptionDays || 30;

          const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

          await tx.user.update({
            where: { id: order.userId },
            data: {
              subscriptionUntil: newExpiry,
            },
          });
        }
      }
    });

    return NextResponse.json({
      status: 'OK',
      orderId: order.id,
      paymentStatus: targetStatus,
    });
  } catch (error) {
    console.error('Midtrans notification error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal memproses webhook Midtrans.' },
      { status: 500 }
    );
  }
}
