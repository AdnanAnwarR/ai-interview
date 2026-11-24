'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Sparkles, ShieldCheck, Loader2, Mail, Lock, User, AlertCircle } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/interview/new';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Registrasi dengan Form Email & Password
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Mohon lengkapi seluruh formulir registrasi.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Daftarkan akun baru ke API
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
        }),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        setErrorMessage(regData.error || 'Gagal mendaftarkan akun. Silakan coba lagi.');
        setIsSubmitting(false);
        return;
      }

      // 2. Jika akun berhasil dibuat, otomatis login dengan NextAuth
      const res = await signIn('credentials', {
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        // Jika login otomatis gagal, arahkan ke login dengan email terisi
        router.push(`/login?email=${encodeURIComponent(email.trim())}`);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage('Terjadi gangguan jaringan saat mendaftar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-[#D2E2F7] p-6 sm:p-8 shadow-card">
      {/* Badge & Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFEFE6] text-[#F26A2B] text-xs font-bold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#F26A2B]" />
          Gratis 1 Sesi Penuh Langsung Aktif
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-fraunces text-[#1B2A41]">
          Buat Akun Wawancarain
        </h1>
        <p className="text-sm text-[#4F637E] mt-1.5">
          Daftar gratis dalam 30 detik untuk mulai latihan wawancara bersama AI.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1.5">
            Nama Lengkap
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rian Pratama"
              required
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#D2E2F7] focus:outline-hidden focus:border-[#4A8DF0] bg-[#FAFCFF]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1B2A41] uppercase tracking-wider mb-1.5">
            Alamat Email
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

        {/* Satu tombol Buat Akun */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-full bg-[#F26A2B] hover:bg-[#D85619] text-white font-bold text-base shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          <span>Buat Akun</span>
        </button>
      </form>

      {/* Footer note */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-[#4F637E]">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Tanpa kartu kredit • 100% Bahasa Indonesia</span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
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
            href="/login"
            className="text-sm font-semibold text-[#2F67BB] hover:underline"
          >
            Sudah punya akun? <span className="font-bold text-[#F26A2B]">Masuk</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center justify-center w-full">
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-[#2F67BB]" /></div>}>
          <RegisterForm />
        </Suspense>
      </main>
    </div>
  );
}
