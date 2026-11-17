import crypto from 'crypto';
// @ts-expect-error midtrans-client lacks TypeScript type declarations
import midtransClient from 'midtrans-client';

export interface CreateSnapTransactionParams {
  orderId: string;
  grossAmount: number;
  customerName: string;
  customerEmail: string;
  packageName: string;
}

export interface SnapTransactionResult {
  token: string;
  redirectUrl: string;
}

/**
 * Mendapatkan instance Midtrans Snap Client
 * Menggunakan Server Key dan parameter isProduction
 */
export function getMidtransSnapClient() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-placeholder';
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-placeholder';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

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
        name: params.packageName,
      },
    ],
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    credit_card: {
      secure: true,
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

/**
 * Verifikasi signature_key webhook Midtrans
 * signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  providedSignature: string
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  if (!serverKey) return false;

  const raw = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const computedSignature = crypto.createHash('sha512').update(raw).digest('hex');

  return computedSignature === providedSignature;
}
