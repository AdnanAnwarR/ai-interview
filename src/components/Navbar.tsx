'use client';

import React from 'react';
import { Sparkles, CreditCard, GraduationCap, Plus } from 'lucide-react';
import { InterviewStatus, UserSubscription } from '@/types/interview';

interface NavbarProps {
  status: InterviewStatus;
  subscription: UserSubscription;
  onOpenPricing: () => void;
  onOpenSettings?: () => void;
  onResetToHome: () => void;
  hasGroqKey?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  status,
  subscription,
  onOpenPricing,
  onResetToHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2F67BB]/15 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand: Wawancarain */}
        <button
          onClick={onResetToHome}
          className="flex items-center space-x-3 text-left group transition-all"
        >
          <svg width="34" height="34" viewBox="0 0 512 512" aria-hidden="true" className="shrink-0 transition-transform group-hover:scale-105">
            <rect width="512" height="512" rx="110" fill="#2F67BB" />
            <path
              d="M176 140H336a40 40 0 0 1 40 40V290a40 40 0 0 1-40 40H250L190 388V330H176a40 40 0 0 1-40-40V180a40 40 0 0 1 40-40Z"
              fill="#fff"
            />
            <path
              d="M184 196 222 288 256 214 290 288 328 196"
              fill="none"
              stroke="#F26A2B"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-fraunces font-bold text-xl text-[#1B2A41] tracking-tight">
                Wawancarain<span className="text-[#F26A2B]">.</span>
              </span>
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



          {/* Quota Badge & Top-up */}
          <button
            onClick={onOpenPricing}
            title="Tambah Sesi atau Beli Langganan"
            className="flex items-center space-x-2 pl-3 pr-2 py-1.5 rounded-full bg-[#EAF2FE] border border-[#4A8DF0]/30 hover:border-[#4A8DF0] text-[#1B2A41] text-xs font-semibold transition-all hover:shadow-xs group cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#2F67BB]" />
            <span>
              {subscription.plan === 'pro' || subscription.plan === 'unlimited' ? (
                <span className="inline-flex items-center gap-1 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-[#F26A2B]">
                  <Sparkles className="w-3 h-3" />
                  PRO Aktif
                </span>
              ) : subscription.freeSessionUsed && subscription.sessionsRemaining <= 0 ? (
                <span className="text-[#F26A2B] font-bold">Isi Kuota Sesi</span>
              ) : (
                <span className="text-[#2F67BB]">{subscription.sessionsRemaining} Sesi Tersedia</span>
              )}
            </span>
            <span className="w-5 h-5 rounded-full bg-[#2F67BB] group-hover:bg-[#F26A2B] text-white flex items-center justify-center transition-colors">
              <Plus className="w-3 h-3 stroke-[3]" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
