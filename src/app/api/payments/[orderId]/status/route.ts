import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Anda harus masuk terlebih dahulu.' },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            credits: true,
            subscriptionUntil: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Order tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Pengecekan kepemilikan data
    if (order.userId !== user.id) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Anda tidak memiliki hak akses ke order ini.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      packageId: order.packageId,
      amount: order.amount,
      status: order.status,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      userCredits: order.user.credits,
      subscriptionUntil: order.user.subscriptionUntil,
    });
  } catch (error) {
    console.error('Error checking payment order status:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Gagal memeriksa status pembayaran.' },
      { status: 500 }
    );
  }
}
