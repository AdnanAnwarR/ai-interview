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
  const [customerName] = useState('Kandidat Wawancarain');
  const [customerEmail] = useState('kandidat@wawancarain.id');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successModal, setSuccessModal] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Midtrans Snap client script dynamically
  useEffect(() => {
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = (
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-Z6mjzAdeH-swKhl_'
    ).replace(/['"]/g, '').trim();

    const existing = document.querySelector(`script[src="${snapScriptUrl}"]`);
    if (existing && existing.getAttribute('data-client-key') !== clientKey) {
      existing.remove();
    }

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

      // 1. Coba buka via Snap Popup
      if (typeof window !== 'undefined' && window.snap && data.token && !data.isSimulated) {
        window.snap.pay(data.token, {
          onSuccess: () => {
            setSuccessModal(`Pembayaran berhasil! ${plan.name} aktif di akun Anda.`);
            setIsProcessing(false);
          },
          onPending: () => {
            setSuccessModal('Menunggu konfirmasi pembayaran Anda.');
            setIsProcessing(false);
          },
          onError: (result: unknown) => {
            console.error('Snap error:', result);
            setErrorMessage('Pembayaran dibatalkan atau terjadi kendala. Anda dapat mencoba lagi.');
            setIsProcessing(false);
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
      } else if (data.redirectUrl && !data.isSimulated) {
        // 2. Fallback: Langsung arahkan ke halaman pembayaran Midtrans Snap
        window.location.href = data.redirectUrl;
      } else {
        // 3. Fallback simulasi offline
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
          <AlertCircle className="w-5 h-5 shrink-0 text-[#F26A2B]" />
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
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleCheckout(plan)}
                disabled={isProcessing && selectedPlan?.id === plan.id}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer ${
                  isPop
                    ? 'bg-[#F26A2B] hover:bg-[#d95316] text-white shadow-md shadow-[#F26A2B]/20'
                    : 'bg-[#2F67BB] hover:bg-[#1B2A41] text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isProcessing && selectedPlan?.id === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mempersiapkan Midtrans...</span>
                  </>
                ) : (
                  <>
                    <span>Pilih {plan.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Security & Payment Methods Banner */}
      <div className="max-w-3xl mx-auto rounded-3xl bg-[#EAF2FE] p-6 border border-[#4A8DF0]/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white text-[#2F67BB] flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-6 h-6 text-[#2F67BB]" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#1B2A41]">
              Pembayaran Terjamin & Terenkripsi Resmi
            </h4>
            <p className="text-xs text-slate-600 mt-0.5">
              Diproses melalui Midtrans Payment Gateway berlisensi Bank Indonesia.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2F67BB] bg-white px-3.5 py-2 rounded-xl shadow-xs">
          <CreditCard className="w-4 h-4" />
          <span>QRIS • BCA • Mandiri • BNI • GoPay</span>
        </div>
      </div>

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-[#1B2A41] mb-2">
              Transaksi Berhasil!
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              {successModal}
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccessModal(null);
                router.push('/dashboard');
              }}
              className="w-full py-3 rounded-xl bg-[#2F67BB] hover:bg-[#4A8DF0] text-white font-bold text-sm shadow-md transition-colors"
            >
              Mulai Latihan Wawancara
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F6F9FE]">
      <AppHeader />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#4A8DF0] animate-spin" />
        </div>
      }>
        <PricingContent />
      </Suspense>
    </div>
  );
}
