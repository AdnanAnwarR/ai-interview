'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/shared/AppHeader';
import { UserDashboardData } from '@/types/wawancara';
import { 
  Plus, 
  Sparkles, 
  Clock, 
  Building2, 
  Briefcase, 
  ArrowRight, 
  CreditCard, 
  CheckCircle,
  HelpCircle,
  Award
} from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<UserDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/interviews')
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF2FE] text-[#1B2A41]">
      <AppHeader />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {/* Welcome Banner & Quota Overview */}
        <div className="rounded-3xl bg-gradient-to-r from-[#2F67BB] to-[#4A8DF0] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden mb-8">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[#FFC857] text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Ruang Belajar Wawancara Anda
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Halo, Calon Profesional Muda! 👋
              </h1>
              <p className="text-sm sm:text-base text-slate-100 mt-1 max-w-lg leading-relaxed">
                Asah keterampilan berbicara, kuasai metode STAR, dan hilangkan rasa gugup sebelum menghadapi pewawancara sesungguhnya.
              </p>
            </div>

            {/* Saldo Card & CTA Button */}
            <div className="flex flex-col sm:items-end w-full sm:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 w-full sm:w-60 mb-3 text-center sm:text-right">
                <span className="text-xs text-slate-200 block">Sisa Saldo Sesi Latihan</span>
                <div className="text-3xl font-black text-[#FFC857] my-0.5">
                  {loading ? '...' : `${data?.sessionsRemaining ?? 0} Sesi`}
                </div>
                <Link
                  href="/pricing"
                  className="text-xs font-semibold text-white/90 hover:text-white underline inline-flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3" />
                  Isi ulang atau tambah sesi
                </Link>
              </div>

              <Link
                href="/interview/new"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#F26A2B]/30 hover:scale-102 transition-all active:scale-98"
              >
                <Plus className="w-5 h-5" />
                <span>Mulai Wawancara Baru</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Section: Riwayat Wawancara */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A41]">
                Riwayat Sesi Latihan
              </h2>
              <p className="text-xs text-slate-500">
                Laporan dan evaluasi mendalam dari seluruh sesi yang telah Anda ikuti
              </p>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
          )}

          {/* Riwayat List */}
          {!loading && data && data.history.length > 0 && (
            <div className="grid grid-cols-1 gap-3.5">
              {data.history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-white border border-[#2F67BB]/15 p-4 sm:p-5 shadow-xs hover:border-[#4A8DF0]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#EAF2FE] border border-[#4A8DF0]/20 flex items-center justify-center text-[#2F67BB] flex-shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-[#1B2A41] flex items-center gap-2">
                        <span>{item.companyName}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-medium text-[#2F67BB]">
                          <Briefcase className="w-3.5 h-3.5" />
                          {item.targetRole}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{item.level.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          {item.date}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Skor & Link Hasil */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                        Nilai Total
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-[#1B2A41]">
                          {item.totalScore > 0 ? item.totalScore : '-'}
                        </span>
                        <span className="text-xs text-slate-400 font-bold">/100</span>
                      </div>
                    </div>

                    <Link
                      href={`/interview/${item.id}/result`}
                      className="px-4 py-2.5 rounded-xl bg-[#EAF2FE] hover:bg-[#2F67BB] hover:text-white text-[#2F67BB] text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <span>Lihat Rapor</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && (!data || data.history.length === 0) && (
            <div className="rounded-3xl bg-white border border-[#2F67BB]/15 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EAF2FE] text-[#4A8DF0] mx-auto flex items-center justify-center mb-4">
                <HelpCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1B2A41] mb-1">
                Belum Ada Riwayat Wawancara
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Mulai latihan pertama Anda hari ini. Pilih perusahaan impian dan posisi target Anda, lalu dapatkan evaluasi mendalam per jawaban.
              </p>
              <Link
                href="/interview/new"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-sm shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Mulai Sesi Wawancara Pertama
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
