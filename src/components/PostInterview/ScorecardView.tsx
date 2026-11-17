'use client';

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  MessageSquare, 
  RefreshCw, 
  Award, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Layers, 
  Target,
  Building2,
  Check,
  Star,
  Copy
} from 'lucide-react';
import { CandidateProfile, ChatMessage, ScorecardReport, AnswerScore } from '@/types/interview';

interface ScorecardViewProps {
  report: ScorecardReport;
  profile: CandidateProfile;
  transcript: ChatMessage[];
  onStartNewSession: () => void;
}

export const ScorecardView: React.FC<ScorecardViewProps> = ({
  report,
  profile,
  transcript,
  onStartNewSession,
}) => {
  const [copied, setCopied] = useState(false);
  const [expandedAnswerIndex, setExpandedAnswerIndex] = useState<number | null>(0);

  useEffect(() => {
    if (report.passed) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti optional
      }
    }
  }, [report.passed]);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    if (score >= 70) return 'bg-[#EAF2FE] text-[#2F67BB] border-[#4A8DF0]/40';
    return 'bg-amber-50 text-amber-700 border-amber-300';
  };

  const handleCopySummary = () => {
    const summary = `Hasil Wawancara "Wawancarain":\nKandidat: ${profile.name}\nPerusahaan: ${profile.targetCompany}\nPosisi: ${profile.targetRole}\nSkor Akhir: ${report.overallScore}/100 (${report.hiringRecommendation})\n\nRingkasan:\n${report.summaryFeedback}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner & Overall Score Card - Wawancarain Theme */}
      <div className="bg-white border border-[#2F67BB]/20 rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#EAF2FE] rounded-full blur-3xl pointer-events-none opacity-80" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] text-xs font-bold mb-3 border border-[#4A8DF0]/30">
              <Award className="w-4 h-4 text-[#4A8DF0]" />
              <span>Scorecard & Evaluasi Wawancarain</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A41] tracking-tight mb-2">
              Laporan Evaluasi Wawancara
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-3">
              <span className="font-bold text-[#1B2A41]">{profile.name}</span>
              <span>•</span>
              <span className="inline-flex items-center space-x-1 text-[#2F67BB] font-semibold bg-[#EAF2FE] px-2 py-0.5 rounded-lg border border-[#4A8DF0]/20">
                <Building2 className="w-3 h-3" />
                <span>{profile.targetCompany}</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{profile.targetRole}</span>
            </div>

            <div className="mt-2 inline-flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Rekomendasi Seleksi:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                report.passed ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-amber-50 text-amber-700 border-amber-300'
              }`}>
                {report.hiringRecommendation}
              </span>
            </div>
          </div>

          {/* Overall Score Dial */}
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-inner ${getScoreBadgeColor(report.overallScore)}`}>
              <span className="text-4xl font-extrabold tracking-tight text-[#1B2A41]">
                {report.overallScore}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                dari 100
              </span>
            </div>
            <span className="text-xs mt-2 font-bold text-[#1B2A41]">
              {report.passed ? '✓ Memenuhi Standar Kelulusan' : 'Perlu Peningkatan Latihan'}
            </span>
          </div>
        </div>

        {/* Summary Feedback */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs sm:text-sm text-[#1B2A41] leading-relaxed italic bg-[#EAF2FE]/60 p-4 rounded-2xl border border-[#4A8DF0]/25">
            &ldquo;{report.summaryFeedback}&rdquo;
          </p>
        </div>
      </div>

      {/* 4 Score Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#2F67BB]/15 rounded-2xl p-4 text-center shadow-sm">
          <Layers className="w-5 h-5 text-[#4A8DF0] mx-auto mb-2" />
          <p className="text-[11px] text-slate-500 font-semibold">Struktur STAR</p>
          <p className="text-xl font-extrabold text-[#1B2A41] mt-1">{report.scoreBreakdown.structure}</p>
        </div>

        <div className="bg-white border border-[#2F67BB]/15 rounded-2xl p-4 text-center shadow-sm">
          <Target className="w-5 h-5 text-[#2F67BB] mx-auto mb-2" />
          <p className="text-[11px] text-slate-500 font-semibold">Relevansi Posisi</p>
          <p className="text-xl font-extrabold text-[#1B2A41] mt-1">{report.scoreBreakdown.relevance}</p>
        </div>

        <div className="bg-white border border-[#2F67BB]/15 rounded-2xl p-4 text-center shadow-sm">
          <MessageSquare className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
          <p className="text-[11px] text-slate-500 font-semibold">Komunikasi & Etika</p>
          <p className="text-xl font-extrabold text-[#1B2A41] mt-1">{report.scoreBreakdown.communication}</p>
        </div>

        <div className="bg-white border border-[#2F67BB]/15 rounded-2xl p-4 text-center shadow-sm">
          <Award className="w-5 h-5 text-[#F26A2B] mx-auto mb-2" />
          <p className="text-[11px] text-slate-500 font-semibold">Kompetensi Domain</p>
          <p className="text-xl font-extrabold text-[#1B2A41] mt-1">{report.scoreBreakdown.domainExpertise}</p>
        </div>
      </div>

      {/* Nilai untuk Setiap Jawaban (Per-Answer Scoring) */}
      <div className="bg-white border border-[#2F67BB]/20 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-orange-100 text-[#F26A2B]">
              <Star className="w-4 h-4 fill-[#F26A2B]" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#1B2A41]">
                Nilai untuk Setiap Jawaban Anda
              </h2>
              <p className="text-[11px] text-slate-500">
                Analisis mendalam performa dan umpan balik spesifik per pertanyaan
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-[#2F67BB] bg-[#EAF2FE] px-2.5 py-1 rounded-full border border-[#4A8DF0]/20">
            {report.answerScores?.length || 0} Jawaban Dinilai
          </span>
        </div>

        {report.answerScores && report.answerScores.length > 0 ? (
          <div className="space-y-3">
            {report.answerScores.map((ans, idx) => {
              const isExpanded = expandedAnswerIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden transition-all"
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => setExpandedAnswerIndex(isExpanded ? null : idx)}
                    className="p-4 cursor-pointer flex items-center justify-between gap-3 hover:bg-[#EAF2FE]/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-full bg-[#EAF2FE] text-[#2F67BB] border border-[#4A8DF0]/30 font-bold text-xs flex items-center justify-center shrink-0">
                        #{ans.questionIndex}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#1B2A41] line-clamp-1">
                          {ans.questionText}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                          Jawaban: &ldquo;{ans.answerText}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <div className={`px-2.5 py-1 rounded-xl border text-xs font-extrabold ${getScoreBadgeColor(ans.score)}`}>
                        {ans.score} / 100
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Detail Body */}
                  {isExpanded && (
                    <div className="p-4 pt-1 border-t border-slate-200/80 bg-white space-y-3 text-xs animate-fade-in">
                      {/* Full Q & A */}
                      <div className="bg-[#EAF2FE]/40 p-3 rounded-xl border border-[#4A8DF0]/20 space-y-1.5">
                        <p className="text-[11px] font-bold text-[#2F67BB]">Pertanyaan Pewawancara:</p>
                        <p className="text-xs text-[#1B2A41]">{ans.questionText}</p>
                        <p className="text-[11px] font-bold text-slate-600 pt-1">Jawaban Anda:</p>
                        <p className="text-xs text-slate-800 italic bg-white p-2.5 rounded-lg border border-slate-200">
                          &ldquo;{ans.answerText}&rdquo;
                        </p>
                      </div>

                      {/* 3 Aspect Scores */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Relevansi</span>
                          <span className="font-bold text-[#1B2A41]">{ans.aspectScores.relevance}%</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Kejelasan</span>
                          <span className="font-bold text-[#1B2A41]">{ans.aspectScores.clarity}%</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-[10px] text-slate-500 block">Kedalaman</span>
                          <span className="font-bold text-[#1B2A41]">{ans.aspectScores.depth}%</span>
                        </div>
                      </div>

                      {/* Feedback */}
                      <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-[#1B2A41]">
                        <p className="text-[11px] font-bold text-[#F26A2B] mb-0.5">Umpan Balik Khusus Jawaban Ini:</p>
                        <p className="text-xs leading-relaxed">{ans.feedback}</p>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {ans.strengths?.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                            <span className="font-bold text-emerald-800 block mb-1">Poin Baik:</span>
                            <ul className="list-disc list-inside text-emerald-900 space-y-0.5 text-[11px]">
                              {ans.strengths.map((str, sIdx) => (
                                <li key={sIdx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {ans.improvements?.length > 0 && (
                          <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                            <span className="font-bold text-amber-800 block mb-1">Area Perbaikan:</span>
                            <ul className="list-disc list-inside text-amber-900 space-y-0.5 text-[11px]">
                              {ans.improvements.map((imp, iIdx) => (
                                <li key={iIdx}>{imp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic text-center py-4">
            Evaluasi per-jawaban sedang dikompilasi...
          </p>
        )}
      </div>

      {/* Strengths & Improvements Overall Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-white border border-[#2F67BB]/15 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Kekuatan Utama Anda</span>
          </div>
          <ul className="space-y-2 text-xs text-[#1B2A41]">
            {report.keyStrengths.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-white border border-[#2F67BB]/15 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center space-x-2 text-[#F26A2B] font-bold text-xs mb-3">
            <TrendingUp className="w-4 h-4 text-[#F26A2B]" />
            <span>Saran Peningkatan Menuju Interview Sungguhan</span>
          </div>
          <ul className="space-y-2 text-xs text-[#1B2A41]">
            {report.areasForImprovement.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F26A2B] mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transcript Accordion */}
      <details className="bg-white border border-[#2F67BB]/15 rounded-2xl p-4 text-xs text-[#1B2A41] shadow-sm">
        <summary className="font-bold cursor-pointer text-[#1B2A41] hover:text-[#4A8DF0] flex items-center justify-between">
          <span>Lihat Transkrip Lengkap Percakapan ({transcript.length} pesan)</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </summary>
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 max-h-80 overflow-y-auto pr-2">
          {transcript.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-[10px] text-[#2F67BB] uppercase block mb-1">
                {m.sender === 'ai' ? 'Pewawancara AI' : profile.name}
              </span>
              <p className="text-slate-800 leading-relaxed">{m.text}</p>
            </div>
          ))}
        </div>
      </details>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={handleCopySummary}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#1B2A41] text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition-all"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
          <span>{copied ? 'Hasil Berhasil Disalin!' : 'Salin Ringkasan Evaluasi'}</span>
        </button>

        <button
          onClick={onStartNewSession}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.99]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Mulai Latihan Wawancara Baru</span>
        </button>
      </div>
    </div>
  );
};
