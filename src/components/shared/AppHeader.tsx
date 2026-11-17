'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Compass, CreditCard, LayoutDashboard, User } from 'lucide-react';

export function AppHeader() {
  const pathname = usePathname();
  const [sessionsRemaining, setSessionsRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/user/balance')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.sessionsRemaining === 'number') {
          setSessionsRemaining(data.sessionsRemaining);
        }
      })
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#2F67BB]/10 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4A8DF0] to-[#2F67BB] flex items-center justify-center text-white shadow-md shadow-[#4A8DF0]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-[#FFC857]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#1B2A41]">
              Wawancara<span className="text-[#F26A2B]">in</span>
            </span>
            <span className="text-[11px] text-[#2F67BB] font-medium leading-none hidden sm:inline">
              Latihan Wawancara AI Fresh Graduate
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
              pathname === '/dashboard'
                ? 'bg-[#EAF2FE] text-[#2F67BB]'
                : 'text-[#1B2A41]/80 hover:text-[#1B2A41] hover:bg-slate-100'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-[#4A8DF0]" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

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
            <span className="hidden sm:inline">Paket</span>
          </Link>

          {/* Saldo Badge */}
          {sessionsRemaining !== null && (
            <Link
              href="/pricing"
              className="ml-1 sm:ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF2FE] border border-[#4A8DF0]/30 text-xs font-bold text-[#2F67BB] hover:border-[#4A8DF0] transition-colors"
              title="Klik untuk top-up saldo sesi"
            >
              <span className="w-2 h-2 rounded-full bg-[#F26A2B] animate-pulse"></span>
              <span>{sessionsRemaining} Sesi</span>
            </Link>
          )}

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
