'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/AppHeader';
import { PRICING_CONFIG, PricingPlan } from '@/config/pricing';
import { 
  Check, 
  Sparkles, 
  CreditCard, 
  ShieldCheck, 
  HelpCircle, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Zap
} from 'lucide-react';

// Declaration for Midtrans Snap popup
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isQuotaExceeded = searchParams.get('reason') === 'quota_exceeded';

  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [customerName, setCustomerName] = useState('Kandidat Wawancarain');
  const [customerEmail, setCustomerEmail] = useState('kandidat@wawancarain.id');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Midtrans Snap client script dynamically if client key is set
  useEffect(() => {
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-simulation';

    if (!document.querySelector(`script[src="${snapScriptUrl}"]`)) {
      const script = document.createElement('script');
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleCheckout = async (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: plan.id,
          customerName,
          customerEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses pembuatan transaksi.');
      }

      // Jika Midtrans Snap script tersedia di window
      if (window.snap && data.token && !data.isSimulated) {
        window.snap.pay(data.token, {
          onSuccess: () => {
            setSuccessModal(`Pembayaran berhasil! ${plan.name} aktif di akun Anda.`);
            setIsProcessing(false);
          },
          onPending: () => {
            setSuccessModal('Menunggu konfirmasi pembayaran Anda.');
            setIsProcessing(false);
          },
          onError: () => {
            setErrorMessage('Pembayaran gagal atau dibatalkan.');
            setIsProcessing(false);
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
      } else {
        // Simulasi checkout instan untuk kemudahan testing lokal
        setSuccessModal(
          data.message || `Simulasi Berhasil! ${plan.sessions} sesi latihan telah ditambahkan ke akun Anda.`
        );
        setIsProcessing(false);
      }
    } catch (err: unknown) {
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Terjadi gangguan saat memproses pembayaran.';
      setErrorMessage(msg);
    }
  };

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12">
      {/* Alert Jika Dialihkan Karena Kuota Habis */}
      {isQuotaExceeded && (
        <div className="mb-8 p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#F26A2B]" />
          <div>
            <strong>Saldo Sesi Latihan Habis:</strong> Sesi gratis Anda telah digunakan. Pilih salah satu paket hemat di bawah untuk langsung melanjutkan latihan tanpa hambatan.
          </div>
        </div>
      )}

      {/* Header Pricing */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2F67BB] text-xs font-bold shadow-xs mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
          Harga Ramah Mahasiswa & Fresh Graduate
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B2A41]">
          Pilih Paket Latihan Sesuai Kebutuhan
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          Investasi terjangkau untuk persiapan karier impian Anda. Terintegrasi resmi dengan Midtrans Snap (QRIS, GoPay, ShopeePay, Virtual Account).
        </p>
      </div>

      {errorMessage && (
        <div className="max-w-md mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-12">
        {PRICING_CONFIG.plans.map((plan) => {
          const isPop = plan.isPopular;

          return (
            <div
              key={plan.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all ${
                isPop
                  ? 'bg-white border-2 border-[#F26A2B] shadow-xl scale-102 z-10'
                  : 'bg-white border border-[#2F67BB]/15 shadow-sm hover:border-[#4A8DF0]/40'
              }`}
            >
              {/* Badge Populer */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase shadow-sm ${
                      isPop
                        ? 'bg-[#F26A2B] text-white'
                        : 'bg-[#2F67BB] text-white'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-[#1B2A41] mb-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 min-h-[32px]">
                  {plan.tagline}
                </p>

                {/* Harga */}
                <div className="my-5 pb-5 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-[#1B2A41] tracking-tight">
                      {plan.formattedPrice}
                    </span>
                  </div>
                  {plan.periodText && (
                    <span className="text-xs text-slate-400 font-medium">
                      {plan.periodText}
                    </span>
                  )}
                </div>

                {/* Fitur List */}
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tombol Bayar / Beli */}
              <button
                type="button"
                onClick={() => handleCheckout(plan)}
                disabled={isProcessing}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 ${
                  isPop
                    ? 'bg-[#F26A2B] hover:bg-[#d95316] text-white shadow-[#F26A2B]/30'
                    : 'bg-[#EAF2FE] hover:bg-[#2F67BB] hover:text-white text-[#2F67BB]'
                }`}
              >
                {isProcessing && selectedPlan?.id === plan.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Pilih {plan.name}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security & Payment Methods Banner */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 text-center max-w-3xl mx-auto">
        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Pembayaran Aman & Instan via Midtrans Snap
        </div>
        <p className="text-xs text-slate-500 max-w-lg mx-auto">
          Mendukung QRIS (GoPay, OVO, DANA, ShopeePay, BCA Mobile), Virtual Account Bank (BCA, Mandiri, BNI, BRI), dan Transfer Bank.
        </p>
      </div>

      {/* Modal Dialog Sukses Pembayaran */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#1B2A41] mb-2">
              Transaksi Berhasil!
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {successModal}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuccessModal(null);
                  router.push('/interview/new');
                }}
                className="w-full py-3 rounded-2xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-sm shadow-md transition-colors"
              >
                Mulai Latihan Sekarang
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuccessModal(null);
                  router.push('/dashboard');
                }}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
              >
                Ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#EAF2FE] text-[#1B2A41]">
      <AppHeader />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#4A8DF0] animate-spin" />
        </div>
      }>
        <PricingContent />
      </Suspense>
    </div>
  );
}
