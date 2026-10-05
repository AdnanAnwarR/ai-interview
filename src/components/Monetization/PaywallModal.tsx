'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  Lock, 
  CreditCard, 
  QrCode, 
  ShieldCheck, 
  X, 
  ArrowRight,
  Loader2
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

  const handleSimulatePayment = () => {
    setIsProcessing(true);
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
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Buka Akses Latihan Tak Terbatas</h2>
              <p className="text-xs text-slate-400">Kuota gratis 15 menit Anda telah selesai. Pilih paket latihan Anda.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pricing Tiers Selection (PRD F-303) */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                  selectedTier === tier.id
                    ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/15'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-[9px] uppercase tracking-wider shadow">
                    {tier.badge}
                  </span>
                )}

                <div>
                  <h3 className="font-bold text-xs text-white mb-1">{tier.name}</h3>
                  <div className="flex items-baseline space-x-1.5 mb-2">
                    <span className="text-base font-extrabold text-white">{tier.price}</span>
                    {tier.originalPrice && (
                      <span className="text-[10px] text-slate-500 line-through">
                        {tier.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{tier.sessions === 999 ? 'Unlimited' : `${tier.sessions} Sesi`}</span>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selectedTier === tier.id ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-700'}`}>
                    {selectedTier === tier.id && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Method Selector (PRD F-304) */}
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80 mt-4">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Metode Pembayaran Instan (F-304)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-indigo-500 bg-indigo-500/15 text-white'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>QRIS Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('gopay')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  paymentMethod === 'gopay'
                    ? 'border-cyan-500 bg-cyan-500/15 text-white'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>E-Wallet (GoPay/OVO)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('va')}
                className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
                  paymentMethod === 'va'
                    ? 'border-violet-500 bg-violet-500/15 text-white'
                    : 'border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                <span>Virtual Account</span>
              </button>
            </div>

            {/* Mock QRIS code visualizer if QRIS selected */}
            {paymentMethod === 'qris' && (
              <div className="mt-4 p-3 bg-white rounded-xl max-w-[140px] mx-auto flex flex-col items-center">
                <div className="w-24 h-24 bg-slate-900 rounded-lg flex items-center justify-center p-2">
                  <QrCode className="w-full h-full text-white" />
                </div>
                <span className="text-[10px] text-slate-800 font-bold mt-1 uppercase tracking-wider">
                  NMID: ID102938
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Checkout Action */}
        <div className="p-6 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-slate-400">Total Pembayaran</p>
            <p className="text-lg font-bold text-white">{currentTier.price}</p>
          </div>

          <button
            onClick={handleSimulatePayment}
            disabled={isProcessing || paymentSuccess}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memproses Transaksi...</span>
              </>
            ) : paymentSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
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
