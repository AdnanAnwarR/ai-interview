'use client';

import React, { useState } from 'react';
import { 
  Check, 
  CreditCard, 
  ShieldCheck, 
  X, 
  ArrowRight,
  Loader2,
  GraduationCap
} from 'lucide-react';
import { PRICING_TIERS } from '@/lib/constants';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUpgrade: (plan: 'free' | 'pro' | 'unlimited', sessionsAdded: number) => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onSuccessUpgrade,
}) => {
  const [selectedTier, setSelectedTier] = useState<string>('pro_pack');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Midtrans Snap client script dynamically
  React.useEffect(() => {
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

  if (!isOpen) return null;

  const currentTier = PRICING_TIERS.find((t) => t.id === selectedTier) || PRICING_TIERS[1];

  const handleCheckout = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: currentTier.id,
          customerName: 'Kandidat Wawancarain',
          customerEmail: 'kandidat@wawancarain.id',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses transaksi.');
      }

      const windowSnap = (window as unknown as { snap?: { pay: (token: string, options: Record<string, unknown>) => void } }).snap;
      
      // 1. Coba via Snap Popup
      if (windowSnap && data.token && !data.isSimulated) {
        windowSnap.pay(data.token, {
          onSuccess: () => {
            setPaymentSuccess(true);
            setTimeout(() => {
              onSuccessUpgrade(
                currentTier.id === 'unlimited_monthly' ? 'pro' : 'free',
                currentTier.sessions
              );
              onClose();
            }, 1000);
          },
          onPending: () => {
            alert('Menunggu konfirmasi pembayaran Anda.');
            onClose();
          },
          onError: () => {
            setErrorMessage('Pembayaran dibatalkan atau terjadi kendala.');
            setIsProcessing(false);
          },
          onClose: () => {
            setIsProcessing(false);
          },
        });
        setIsProcessing(false);
        return;
      }

      // 2. Fallback: Direct Redirection ke Midtrans
      if (data.redirectUrl && !data.isSimulated) {
        window.location.href = data.redirectUrl;
        return;
      }

      // 3. Fallback Simulasi
      setIsProcessing(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentSuccess(false);
        onSuccessUpgrade(
          currentTier.id === 'unlimited_monthly' ? 'unlimited' : 'pro',
          currentTier.sessions
        );
        onClose();
      }, 1200);
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
      const msg = err instanceof Error ? err.message : 'Terjadi gangguan saat memproses pembayaran.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white border border-[#2F67BB]/20 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Tombol Tutup */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-[#EAF2FE] p-6 sm:p-8 border-b border-[#4A8DF0]/20 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#2F67BB] text-xs font-bold shadow-xs mb-3">
            <GraduationCap className="w-4 h-4 text-[#F26A2B]" />
            <span>Spesial Mahasiswa & Fresh Graduate</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A41] tracking-tight">
            Tingkatkan Persiapan Wawancara Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto">
            Dapatkan evaluasi kerangka STAR mendalam, simulasi pertanyaan sulit, dan feedback instan dari AI rekruter.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center">
              {errorMessage}
            </div>
          )}

          {/* Pilihan Paket */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {PRICING_TIERS.map((tier) => {
              const isSelected = selectedTier === tier.id;
              return (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#F26A2B] bg-orange-50/20 shadow-md ring-2 ring-[#F26A2B]/10'
                      : 'border-slate-200 hover:border-[#4A8DF0]/40 bg-white'
                  }`}
                >
                  {tier.badge && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#F26A2B] text-white text-[9px] font-extrabold uppercase tracking-wider">
                      {tier.badge}
                    </span>
                  )}
                  <p className="text-xs font-bold text-[#1B2A41] mb-1">{tier.name}</p>
                  <p className="text-base font-extrabold text-[#2F67BB] mb-1">{tier.price}</p>
                  <p className="text-[11px] text-slate-500 leading-snug">{tier.description}</p>
                </div>
              );
            })}
          </div>

          {/* Keamanan & Pembayaran */}
          <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-semibold text-[#1B2A41]">Pembayaran Aman via Midtrans Snap</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2F67BB]">
              <CreditCard className="w-3.5 h-3.5" />
              <span>QRIS • BCA • Mandiri • GoPay</span>
            </div>
          </div>

          {/* Tombol Eksekusi Checkout */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing || paymentSuccess}
            className="w-full py-4 rounded-2xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#F26A2B]/20 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Mempersiapkan Pembayaran Midtrans...</span>
              </>
            ) : paymentSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>Pembayaran Berhasil! Memperbarui Akun...</span>
              </>
            ) : (
              <>
                <span>Bayar {currentTier.price} Sekarang</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
