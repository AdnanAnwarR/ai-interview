// Midtrans Snap Client Integration for "Wawancarain"
// @ts-expect-error midtrans-client lacks TypeScript type declarations
import midtransClient from 'midtrans-client';

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  tierName: string;
}

export interface SnapTransactionResult {
  token: string;
  redirectUrl: string;
}

/**
 * Mendapatkan instance Midtrans Snap Client
 * Menggunakan Server Key dari environment variable
 */
export function getMidtransSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-placeholder';
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder';
  const isProduction = process.env.NODE_ENV === 'production' && process.env.MIDTRANS_IS_PRODUCTION === 'true';

  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
}

/**
 * Membuat transaksi Snap baru untuk pembayaran sesi Wawancarain
 */
export async function createMidtransTransaction(
  params: CreateSnapTransactionParams
): Promise<SnapTransactionResult> {
  const snap = getMidtransSnapClient();

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.grossAmount,
    },
    item_details: [
      {
        id: params.orderId,
        price: params.grossAmount,
        quantity: 1,
        name: params.tierName,
      },
    ],
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    credit_card: {
      secure: true,
    },
    callbacks: {
      finish: typeof window !== 'undefined' ? `${window.location.origin}?payment=finish` : undefined,
    },
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return {
      token: transaction.token as string,
      redirectUrl: transaction.redirect_url as string,
    };
  } catch (error) {
    console.error('Gagal membuat transaksi Midtrans Snap:', error);
    throw error;
  }
}
