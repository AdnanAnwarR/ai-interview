'use client';

import React from 'react';
import { Sparkles, CreditCard, Settings, Cpu, GraduationCap } from 'lucide-react';
import { InterviewStatus, UserSubscription } from '@/types/interview';

interface NavbarProps {
  status: InterviewStatus;
  subscription: UserSubscription;
  onOpenPricing: () => void;
  onOpenSettings: () => void;
  onResetToHome: () => void;
  hasGroqKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  subscription,
  onOpenPricing,
  onOpenSettings,
  onResetToHome,
  hasGroqKey,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2F67BB]/15 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand: Wawancarain */}
        <button
          onClick={onResetToHome}
          className="flex items-center space-x-3 text-left group transition-all"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2F67BB] via-[#4A8DF0] to-[#FFC857] p-[2px] shadow-sm group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-[#2F67BB]" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg text-[#1B2A41] tracking-tight">Wawancarain</span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#EAF2FE] text-[#2F67BB] border border-[#4A8DF0]/25">
                Real-Time AI
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Latihan Wawancara Kerja Mahasiswa & Fresh Graduate</p>
          </div>
        </button>

        {/* Right side info & actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active status indicator */}
          {status === 'in_progress' && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Sesi Live Berjalan</span>
            </div>
          )}

          {/* LLM Engine Status Button */}
          <button
            onClick={onOpenSettings}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
              hasGroqKey
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-200 text-[#1B2A41] hover:border-[#4A8DF0]'
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${hasGroqKey ? 'text-emerald-600' : 'text-[#4A8DF0]'}`} />
            <span>{hasGroqKey ? 'Model AI Terhubung' : 'Mesin AI & Kunci'}</span>
          </button>

          {/* Settings Icon Button for mobile */}
          <button
            onClick={onOpenSettings}
            className="sm:hidden p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#1B2A41]"
            title="Pengaturan AI"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quota Badge & Top-up */}
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#EAF2FE] border border-[#4A8DF0]/30 hover:border-[#4A8DF0] text-[#1B2A41] text-xs font-semibold transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#2F67BB]" />
            <span>
              {subscription.freeSessionUsed && subscription.sessionsRemaining <= 0 ? (
                <span className="text-[#F26A2B] font-bold">Isi Kuota Sesi</span>
              ) : (
                <span className="text-[#2F67BB]">{subscription.sessionsRemaining} Sesi Tersedia</span>
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
