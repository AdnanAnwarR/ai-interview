'use client';

import React from 'react';
import { Award, CheckCircle, TrendingUp, Sparkles, Building2, Briefcase } from 'lucide-react';

interface ScoreCardProps {
  totalScore: number;
  summary: string;
  topStrengths: string[];
  topImprovements: string[];
  companyName: string;
  targetRole: string;
  date: string;
}

export function ScoreCard({
  totalScore,
  summary,
  topStrengths,
  topImprovements,
  companyName,
  targetRole,
  date,
}: ScoreCardProps) {
  // Warna badge skor total
  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-emerald-500', text: 'text-emerald-700', bgLight: 'bg-emerald-50 border-emerald-200', label: 'Sangat Siap Kerja (Lulus)' };
    if (score >= 75) return { bg: 'bg-[#4A8DF0]', text: 'text-[#2F67BB]', bgLight: 'bg-[#EAF2FE] border-[#4A8DF0]/40', label: 'Siap dengan Catatan' };
    return { bg: 'bg-[#F26A2B]', text: 'text-[#F26A2B]', bgLight: 'bg-orange-50 border-orange-200', label: 'Perlu Latihan Tambahan' };
  };

  const badge = getScoreBadgeColor(totalScore);

  return (
    <div className="w-full rounded-3xl bg-white border border-[#2F67BB]/15 p-6 sm:p-8 shadow-sm">
      {/* Header Info Sesi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2F67BB] mb-1">
            <Award className="w-4 h-4 text-[#F26A2B]" />
            Laporan Evaluasi Wawancara AI
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A41]">
            Hasil Latihan Wawancara
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-600">
            <span className="flex items-center gap-1.5 font-medium text-[#1B2A41]">
              <Building2 className="w-4 h-4 text-[#4A8DF0]" />
              {companyName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-medium text-[#1B2A41]">
              <Briefcase className="w-4 h-4 text-[#2F67BB]" />
              {targetRole}
            </span>
            <span>•</span>
            <span className="text-xs text-slate-500">{date}</span>
          </div>
        </div>

        {/* Skor Utama (Angka Besar) */}
        <div className="flex sm:flex-col items-center justify-between sm:justify-center p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#EAF2FE] to-white border border-[#4A8DF0]/20 min-w-[150px] shadow-xs">
          <span className="text-xs font-bold text-[#2F67BB] uppercase tracking-wider">
            Nilai Total
          </span>
          <div className="flex items-baseline gap-1 my-1">
            <span className="text-4xl sm:text-5xl font-black text-[#1B2A41] tracking-tight">
              {totalScore}
            </span>
            <span className="text-sm font-bold text-slate-400">/100</span>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bgLight} ${badge.text}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Ringkasan Performa */}
      <div className="mt-6">
        <h3 className="text-sm font-bold text-[#1B2A41] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#FFC857]" />
          Ringkasan Eksekutif
        </h3>
        <p className="text-base sm:text-lg text-[#1B2A41]/90 leading-relaxed font-normal bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          {summary}
        </p>
      </div>

      {/* Grid: 3 Kekuatan Utama & 3 Saran Perbaikan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        {/* 3 Kekuatan Utama */}
        <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/80 p-5">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base mb-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            3 Kekuatan Utama Anda
          </div>
          <ul className="space-y-2.5">
            {topStrengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-emerald-950 leading-snug">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3 Saran Perbaikan */}
        <div className="rounded-2xl bg-orange-50/60 border border-orange-200/80 p-5">
          <div className="flex items-center gap-2 text-orange-800 font-bold text-base mb-3">
            <TrendingUp className="w-5 h-5 text-[#F26A2B]" />
            3 Hal yang Perlu Ditingkatkan
          </div>
          <ul className="space-y-2.5">
            {topImprovements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-orange-950 leading-snug">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-200/80 text-orange-800 text-xs font-bold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
