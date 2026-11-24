'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Sparkles, CheckCircle2, ShieldCheck, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/interview/new';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Login dengan Google
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await signIn('google', { callbackUrl, redirect: false });
      if (res?.error) {
        router.push(callbackUrl);
      } else if (res?.url) {
        router.push(res.url);
      } else {
        router.push(callbackUrl);
      }
    } catch {
      router.push(callbackUrl);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Login dengan Email & Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Mohon masukkan email dan kata sandi.');
      return;
    }

    setIsEmailLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage('Email atau kata sandi tidak sesuai. Silakan coba lagi.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage('Terjadi gangguan saat masuk. Silakan gunakan Google.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#D2E2F7] p-6 sm:p-8 shadow-card">
      {/* Badge & Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
          Platform Latihan Kerja Mahasiswa & Fresh Grad
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-fraunces text-[#1B2A41]">
          Masuk ke Wawancarain
        </h1>
        <p className="text-sm text-[#4F637E] mt-1.5">
          Lanjutkan persiapan wawancaramu, asah metode STAR, dan raih offer pertamamu.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tombol Masuk dengan Google */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full py-3.5 px-4 rounded-full border-2 border-slate-200 hover:border-[#4A8DF0] bg-white text-slate-700 hover:bg-slate-50 font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-5 h-5 text-[#4A8DF0] animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
          <span>{isGoogleLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#D2E2F7]"></div>
          <span className="flex-shrink mx-3 text-xs text-[#4F637E] font-medium">
            Atau dengan email
          </span>
          <div className="flex-grow border-t border-[#D2E2F7]"></div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D2E2F7] focus:outline-hidden focus:border-[#4A8DF0] bg-[#FAFCFF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                required
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D2E2F7] focus:outline-hidden focus:border-[#4A8DF0] bg-[#FAFCFF]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isEmailLoading}
            className="w-full py-3.5 rounded-full bg-[#F26A2B] hover:bg-[#D85619] text-white font-bold text-sm sm:text-base shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
          >
            {isEmailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>Masuk Sekarang</span>
          </button>
        </form>
      </div>

      {/* Keuntungan Bergabung */}
      <div className="mt-8 pt-6 border-t border-slate-100">
        <h4 className="text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-3">
          Keuntungan Akun Wawancarain
        </h4>
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-[#F26A2B] shrink-0 mt-0.5" />
            <span>1 Sesi gratis langsung aktif setelah mendaftar.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-[#4A8DF0] shrink-0 mt-0.5" />
            <span>Simulasi realistis audio dua arah Bahasa Indonesia.</span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-[#4A8DF0] shrink-0 mt-0.5" />
            <span>Evaluasi mendalam STAR dan scorecard per jawaban.</span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Privasi data dan rekaman suara aman terenkripsi.</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFCFF] text-[#1B2A41]">
      {/* Top Header */}
      <header className="w-full border-b border-[#D2E2F7] bg-white/95 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="34" height="34" viewBox="0 0 512 512" aria-hidden="true" className="shrink-0">
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
            <span className="font-fraunces text-2xl font-bold tracking-tight text-[#1B2A41]">
              Wawancarain<span className="text-[#F26A2B]">.</span>
            </span>
          </Link>

          <Link
            href="/register"
            className="text-sm font-semibold text-[#2F67BB] hover:underline"
          >
            Belum punya akun? <span className="font-bold text-[#F26A2B]">Daftar gratis</span>
          </Link>
        </div>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center justify-center w-full">
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-[#2F67BB]" /></div>}>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
