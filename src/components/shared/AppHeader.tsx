'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Compass, CreditCard, User } from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();
  const [sessionsRemaining, setSessionsRemaining] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'unlimited'>('free');

  useEffect(() => {
    fetch('/api/user/balance')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.sessionsRemaining === 'number') {
          setSessionsRemaining(data.sessionsRemaining);
          if (data.plan) {
            setUserPlan(data.plan);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2F67BB]/10 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
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
          <div className="flex flex-col">
            <span className="font-fraunces text-xl font-bold tracking-tight text-[#1B2A41]">
              Wawancarain<span className="text-[#F26A2B]">.</span>
            </span>
            <span className="text-[11px] text-[#2F67BB] font-medium leading-none hidden sm:inline">
              Latihan Wawancara AI Fresh Graduate
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/interview/new"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === '/interview/new'
                ? 'bg-[#EAF2FE] text-[#2F67BB]'
                : 'text-[#1B2A41]/80 hover:text-[#1B2A41] hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4 text-[#F26A2B]" />
            <span>Mulai</span>
          </Link>

          <Link
            href="/pricing"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === '/pricing'
                ? 'bg-[#EAF2FE] text-[#2F67BB]'
                : 'text-[#1B2A41]/80 hover:text-[#1B2A41] hover:bg-slate-100'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#4A8DF0]" />
            <span>Paket</span>
          </Link>

          {/* Saldo / Subscription Badge */}
          {userPlan === 'pro' || userPlan === 'unlimited' ? (
            <Link
              href="/pricing"
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-[#F26A2B] text-white text-xs font-extrabold shadow-xs hover:opacity-95 transition-all"
              title="Akses Langganan PRO Aktif"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-100" />
              <span>PRO Aktif</span>
            </Link>
          ) : sessionsRemaining !== null ? (
            <Link
              href="/pricing"
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF2FE] border border-[#4A8DF0]/30 text-xs font-bold text-[#2F67BB] hover:border-[#4A8DF0] transition-colors"
              title="Klik untuk top-up saldo sesi"
            >
              <span className="w-2 h-2 rounded-full bg-[#F26A2B] animate-pulse"></span>
              <span>{sessionsRemaining} Sesi</span>
            </Link>
          ) : null}

          <Link
            href="/login"
            className="ml-1 p-2 rounded-lg text-[#1B2A41]/70 hover:text-[#1B2A41] hover:bg-slate-100 transition-colors"
            title="Akun Saya"
          >
            <User className="w-5 h-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
