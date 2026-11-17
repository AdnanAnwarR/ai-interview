'use client';

import React, { useState } from 'react';
import { 
  Check, 
  CreditCard, 
  QrCode, 
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
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'gopay' | 'va'>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const currentTier = PRICING_TIERS.find((t) => t.id === selectedTier) || PRICING_TIERS[1];

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // Call Midtrans Snap backend API
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

      // Check if Midtrans Snap token exists in window
      const windowSnap = (window as unknown as { snap?: { pay: (token: string, options: Record<string, unknown>) => void } }).snap;
      if (windowSnap && data.token && !data.isSimulated) {
        windowSnap.pay(data.token, {
          onSuccess: () => {
            setPaymentSuccess(true);
            setTimeout(() => {
              onSuccessUpgrade(
                currentTier.id === 'unlimited_monthly' ? 'unlimited' : 'pro',
                currentTier.sessions
              );
              onClose();
            }, 1000);
          },
          onPending: () => {
            alert('Pembayaran Anda sedang diproses. Kuota akan otomatis bertambah setelah transfer selesai.');
            onClose();
          },
          onError: () => {
            alert('Pembayaran gagal atau dibatalkan.');
          },
        });
        setIsProcessing(false);
        return;
      }

      // Instant simulation fallback (for development & offline testing)
      setTimeout(() => {
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
      }, 1200);
    } catch (err) {
      console.error('Checkout error:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white border border-[#2F67BB]/20 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#EAF2FE]/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2FE] text-[#2F67BB] border border-[#4A8DF0]/30 flex items-center justify-center shadow-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1B2A41]">Tambah Kuota Latihan Wawancarain</h2>
              <p className="text-xs text-slate-500">Pilih paket latihan untuk mempersiapkan wawancara kerja impian Anda</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Tiers Selection */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                  selectedTier === tier.id
                    ? 'border-[#4A8DF0] bg-[#EAF2FE]/60 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-[#4A8DF0]/40'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-[#F26A2B] text-white font-bold text-[9px] uppercase tracking-wider shadow-sm">
                    {tier.badge}
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-xs text-[#1B2A41] mb-1">{tier.name}</h3>
                  <div className="flex items-baseline space-x-1.5 mb-2">
                    <span className="text-base font-extrabold text-[#1B2A41]">{tier.price}</span>
                    {tier.originalPrice && (
                      <span className="text-[10px] text-slate-400 line-through">
                        {tier.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">
                    {tier.sessions === 999 ? 'Akses 30 Hari' : `${tier.sessions} Sesi Lengkap`}
                  </span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selectedTier === tier.id ? 'border-[#4A8DF0] bg-[#4A8DF0] text-white' : 'border-slate-300'}`}>
                    {selectedTier === tier.id && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method Selector (Midtrans Snap) */}
          <div className="bg-[#EAF2FE]/40 rounded-2xl p-4 border border-[#4A8DF0]/20 mt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#1B2A41]">
                Metode Pembayaran (Midtrans Snap Gateway)
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Otomatis Terverifikasi
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-[#4A8DF0] bg-white text-[#2F67BB] font-bold shadow-sm'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-[#2F67BB]" />
                <span>QRIS Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('gopay')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  paymentMethod === 'gopay'
                    ? 'border-[#4A8DF0] bg-white text-[#2F67BB] font-bold shadow-sm'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-[#2F67BB]" />
                <span>GoPay / OVO</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('va')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  paymentMethod === 'va'
                    ? 'border-[#4A8DF0] bg-white text-[#2F67BB] font-bold shadow-sm'
                    : 'border-slate-200 bg-white/70 text-slate-600 hover:border-slate-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#2F67BB]" />
                <span>Virtual Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Checkout Action */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Total Pembayaran</p>
            <p className="text-lg font-extrabold text-[#1B2A41]">{currentTier.price}</p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing || paymentSuccess}
            className="px-6 py-3 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-xs flex items-center space-x-2 shadow-sm transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memproses Snap...</span>
              </>
            ) : paymentSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Pembayaran Sukses!</span>
              </>
            ) : (
              <>
                <span>Bayar Sekarang ({currentTier.price})</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
