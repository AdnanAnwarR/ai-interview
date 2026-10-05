'use client';

import React from 'react';
import { Sparkles, Mic, Volume2, CreditCard, Settings, Cpu } from 'lucide-react';
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onResetToHome}
          className="flex items-center space-x-3 text-left group transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">InterviewAI</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Real-Time
              </span>
            </div>
            <p className="text-xs text-slate-400">AI Audio Interview Simulator</p>
          </div>
        </button>

        {/* Right side info & actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Active status indicator */}
          {status === 'in_progress' && (
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Sesi Live Berjalan</span>
            </div>
          )}

          {/* LLM Engine Status Button */}
          <button
            onClick={onOpenSettings}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
              hasGroqKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-indigo-500/50'
            }`}
          >
            <Cpu className={`w-3.5 h-3.5 ${hasGroqKey ? 'text-emerald-400' : 'text-indigo-400'}`} />
            <span>{hasGroqKey ? 'LLaMA 3.3 Aktif' : 'Atur Open-Source LLM'}</span>
          </button>

          {/* Settings Icon Button for mobile */}
          <button
            onClick={onOpenSettings}
            className="sm:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Pengaturan LLM"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Quota Badge */}
          <button
            onClick={onOpenPricing}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 text-xs transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {subscription.freeSessionUsed ? (
                <span className="text-amber-400 font-medium">Sesi Gratis Habis</span>
              ) : (
                <span>1 Sesi Gratis (15 Menit)</span>
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
