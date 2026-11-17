'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/AppHeader';
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulasi login Google untuk seamless experience
    setTimeout(() => {
      router.push('/dashboard');
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF2FE] text-[#1B2A41]">
      <AppHeader />

      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-16 flex flex-col items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#2F67BB]/15 p-6 sm:p-8 shadow-md">
          {/* Badge & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
              Platform Latihan Kerja Mahasiswa & Fresh Grad
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A41]">
              Masuk ke Wawancara<span className="text-[#F26A2B]">in</span>
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              Simulasikan wawancara impian Anda, asah metode STAR, dan raih tawaran kerja pertama Anda.
            </p>
          </div>

          {/* Tombol Masuk dengan Google */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 hover:border-[#4A8DF0] bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xs transition-all active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-[#4A8DF0] animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isLoading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">
                Atau langsung coba demo
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <Link
              href="/dashboard"
              className="w-full py-3 px-4 rounded-2xl bg-[#EAF2FE] hover:bg-[#d8e8fe] text-[#2F67BB] font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Masuk sebagai Guest (Latihan Langsung)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Keuntungan Bergabung */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-3">
              Mengapa Latihan di Wawancarain?
            </h4>
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-[#F26A2B] flex-shrink-0 mt-0.5" />
                <span>3 Sesi gratis untuk seluruh pengguna baru terdaftar.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-[#4A8DF0] flex-shrink-0 mt-0.5" />
                <span>Simulasi realistis berbahasa Indonesia dengan audio dua arah.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-[#4A8DF0] flex-shrink-0 mt-0.5" />
                <span>Evaluasi mendalam per jawaban menggunakan standar STAR.</span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Privasi terjamin. Video kamera hanya diproses lokal di browser.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
