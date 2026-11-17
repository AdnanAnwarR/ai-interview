'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/AppHeader';
import { ScoreCard } from '@/components/result/ScoreCard';
import { RadarChart } from '@/components/result/RadarChart';
import { AnswerFeedbackCard } from '@/components/result/AnswerFeedbackCard';
import { InterviewConfig, AnswerEvaluation } from '@/types/wawancara';
import { 
  Loader2, 
  RefreshCw, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface RawEvaluationResult {
  overall?: {
    score: number;
    level: string;
    summary: string;
    top_strengths: string[];
    top_improvements: string[];
  };
  rubric?: {
    relevansi: number;
    struktur_star: number;
    kejelasan: number;
    kepercayaan_diri: number;
    contoh_nyata: number;
  };
  totalScore?: number;
  summary?: string;
  topStrengths?: string[];
  topImprovements?: string[];
  radarRubric?: {
    relevansi: number;
    strukturSTAR: number;
    kejelasan: number;
    kepercayaanDiri: number;
    contohNyata: number;
  };
  companyName?: string;
  targetRole?: string;
  date?: string;
  answers: Array<{
    question_index?: number;
    questionIndex?: number;
    question?: string;
    questionText?: string;
    answer?: string;
    userAnswer?: string;
    score: number;
    strengths: string[] | string;
    improvements: string[] | string;
    star?: { situation: boolean; task: boolean; action: boolean; result: boolean };
    starCriteria?: { situation: boolean; task: boolean; action: boolean; result: boolean };
    better_answer_example?: string;
    betterAnswerExample?: string;
  }>;
}

export default function InterviewResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [rawResult, setRawResult] = useState<RawEvaluationResult | null>(null);
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/interviews/${id}/result`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Hasil evaluasi wawancara belum tersedia.');
        }
        return res.json();
      })
      .then((data: { result: RawEvaluationResult; config: InterviewConfig }) => {
        setRawResult(data.result);
        setConfig(data.config);
        setLoading(false);
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Gagal memuat hasil evaluasi.';
        setError(msg);
        setLoading(false);
      });
  }, [id]);

  const handleDownloadPdf = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EAF2FE] text-[#1B2A41] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-[#4A8DF0] animate-spin mb-4" />
        <h2 className="text-xl font-bold">Menganalisis & Menilai Jawaban Anda...</h2>
        <p className="text-xs text-slate-500 mt-1.5 max-w-sm text-center">
          AI sedang membedah struktur STAR, relevansi dengan posisi, dan metrik dampak untuk setiap jawaban Anda.
        </p>
      </div>
    );
  }

  if (error || !rawResult) {
    return (
      <div className="min-h-screen bg-[#EAF2FE] text-[#1B2A41] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center shadow-lg">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold mb-2">Laporan Belum Siap</h2>
          <p className="text-sm text-slate-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2F67BB] text-white font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Normalisasi data dari schema baru ({ overall, rubric, answers })
  const totalScore = rawResult.overall?.score ?? rawResult.totalScore ?? 85;
  const summary = rawResult.overall?.summary ?? rawResult.summary ?? 'Evaluasi performa wawancara Anda.';
  const topStrengths = rawResult.overall?.top_strengths ?? rawResult.topStrengths ?? [];
  const topImprovements = rawResult.overall?.top_improvements ?? rawResult.topImprovements ?? [];

  const radarRubric = {
    relevansi: rawResult.rubric?.relevansi ?? rawResult.radarRubric?.relevansi ?? 80,
    strukturSTAR: rawResult.rubric?.struktur_star ?? rawResult.radarRubric?.strukturSTAR ?? 80,
    kejelasan: rawResult.rubric?.kejelasan ?? rawResult.radarRubric?.kejelasan ?? 80,
    kepercayaanDiri: rawResult.rubric?.kepercayaan_diri ?? rawResult.radarRubric?.kepercayaanDiri ?? 80,
    contohNyata: rawResult.rubric?.contoh_nyata ?? rawResult.radarRubric?.contohNyata ?? 80,
  };

  const answers: AnswerEvaluation[] = (rawResult.answers || []).map((ans, idx) => ({
    questionIndex: ans.question_index ?? ans.questionIndex ?? idx + 1,
    questionText: ans.question ?? ans.questionText ?? `Pertanyaan ke-${idx + 1}`,
    userAnswer: ans.answer ?? ans.userAnswer ?? '',
    score: ans.score ?? 80,
    strengths: Array.isArray(ans.strengths) ? ans.strengths.join('. ') : ans.strengths || '',
    improvements: Array.isArray(ans.improvements) ? ans.improvements.join('. ') : ans.improvements || '',
    starCriteria: ans.star ?? ans.starCriteria ?? { situation: true, task: true, action: true, result: true },
    betterAnswerExample: ans.better_answer_example ?? ans.betterAnswerExample ?? '',
  }));

  const companyName = config?.companyName || rawResult.companyName || 'Perusahaan Target';
  const targetRole = config?.targetRole || rawResult.targetRole || 'Posisi Terkait';
  const displayDate = rawResult.date || new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF2FE] text-[#1B2A41]">
      <div className="print:hidden">
        <AppHeader />
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Tombol Aksi Atas */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2F67BB] hover:text-[#4A8DF0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Dashboard
          </Link>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-[#4A8DF0] text-[#1B2A41] text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 text-[#2F67BB]" />
              Unduh Hasil (PDF)
            </button>

            <button
              type="button"
              onClick={() => router.push('/interview/new')}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#F26A2B]/20 transition-all active:scale-98"
            >
              <RefreshCw className="w-4 h-4" />
              Latihan Lagi
            </button>
          </div>
        </div>

        {/* 1. ScoreCard: Nilai Total, Ringkasan, 3 Kekuatan, 3 Saran */}
        <ScoreCard
          totalScore={totalScore}
          summary={summary}
          topStrengths={topStrengths}
          topImprovements={topImprovements}
          companyName={companyName}
          targetRole={targetRole}
          date={displayDate}
        />

        {/* 2. RadarChart: Grafik Radar 5 Rubrik Kompetensi */}
        <RadarChart rubric={radarRubric} />

        {/* 3. Daftar Kartu Nilai Per Jawaban */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#1B2A41] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FFC857]" />
                Rapor & Evaluasi Detail Per Jawaban
              </h2>
              <p className="text-xs text-slate-500">
                Pemeriksaan mendalam framework STAR dan rekomendasi alternatif jawaban ideal
              </p>
            </div>
            <span className="text-xs font-bold text-[#2F67BB] px-3 py-1 rounded-full bg-white border border-[#2F67BB]/20">
              {answers.length} Pertanyaan Dievaluasi
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {answers.map((answer) => (
              <AnswerFeedbackCard key={answer.questionIndex} answer={answer} />
            ))}
          </div>
        </div>

        {/* Bottom CTA Card */}
        <div className="rounded-3xl bg-gradient-to-r from-[#2F67BB] to-[#4A8DF0] p-6 sm:p-8 text-white shadow-lg text-center print:hidden">
          <h3 className="text-xl sm:text-2xl font-bold mb-2">
            Ingin Menguji Diri dengan Gaya Pewawancara Berbeda?
          </h3>
          <p className="text-xs sm:text-sm text-slate-100 max-w-lg mx-auto mb-6">
            Coba mode <strong>Stress Interview</strong> untuk mengasah ketenangan mental, atau latih posisi target di perusahaan lain.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/interview/new')}
              className="px-6 py-3 rounded-2xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-extrabold text-sm shadow-md transition-transform active:scale-98"
            >
              Mulai Sesi Latihan Baru
            </button>
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm transition-colors"
            >
              Simpan Sebagai PDF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
