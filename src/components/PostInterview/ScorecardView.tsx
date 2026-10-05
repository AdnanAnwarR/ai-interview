'use client';

import React, { useEffect } from 'react';
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
  Layers,
  Target
} from 'lucide-react';
import { CandidateProfile, ChatMessage, ScorecardReport } from '@/types/interview';

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
  useEffect(() => {
    if (report.passed) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti optional
      }
    }
  }, [report.passed]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';
    return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner & Overall Score Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3 border border-indigo-500/30">
              <Award className="w-3.5 h-3.5" />
              <span>Laporan Evaluasi & Scorecard Wawancara (F-301)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Evaluasi: {profile.targetRole}
            </h1>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Kandidat: <span className="text-slate-200 font-semibold">{profile.name}</span> • Mode: <span className="text-indigo-400 uppercase font-semibold">{profile.selectedMode}</span>
            </p>
            <div className="mt-3 inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700 text-slate-300">
              Rekomendasi: <span className={report.passed ? 'text-emerald-400' : 'text-amber-400'}>{report.hiringRecommendation}</span>
            </div>
          </div>

          {/* Overall Score Dial */}
          <div className="flex flex-col items-center">
            <div className={`w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center shadow-lg ${getScoreColor(report.overallScore)}`}>
              <span className="text-4xl font-extrabold text-white tracking-tighter">
                {report.overallScore}
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
                dari 100
              </span>
            </div>
            <span className="text-xs mt-2 font-medium text-slate-300">
              {report.passed ? 'Memenuhi Standar Kelulusan' : 'Perlu Sedikit Peningkatan'}
            </span>
          </div>
        </div>

        {/* Summary Feedback */}
        <div className="mt-6 pt-6 border-t border-slate-800/80">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60">
            &ldquo;{report.summaryFeedback}&rdquo;
          </p>
        </div>
      </div>

      {/* 4 Score Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <Layers className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
          <p className="text-[11px] text-slate-400 font-medium">Struktur (STAR)</p>
          <p className="text-xl font-bold text-white mt-1">{report.scoreBreakdown.structure}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <Target className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
          <p className="text-[11px] text-slate-400 font-medium">Relevansi JD</p>
          <p className="text-xl font-bold text-white mt-1">{report.scoreBreakdown.relevance}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <MessageSquare className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
          <p className="text-[11px] text-slate-400 font-medium">Komunikasi</p>
          <p className="text-xl font-bold text-white mt-1">{report.scoreBreakdown.communication}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
          <Award className="w-5 h-5 text-violet-400 mx-auto mb-2" />
          <p className="text-[11px] text-slate-400 font-medium">Domain Skill</p>
          <p className="text-xl font-bold text-white mt-1">{report.scoreBreakdown.domainExpertise}</p>
        </div>
      </div>

      {/* Strengths & Improvements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs mb-3">
            <CheckCircle2 className="w-4 h-4" />
            <span>Kekuatan Utama Anda</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.keyStrengths.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs mb-3">
            <TrendingUp className="w-4 h-4" />
            <span>Saran Peningkatan Jawaban</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            {report.areasForImprovement.map((item, idx) => (
              <li key={idx} className="flex items-start space-x-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* STAR Analysis Detail Cards (PRD F-302) */}
      {report.starAnalysis && report.starAnalysis.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Analisis Mendalam Kerangka STAR (Situation, Task, Action, Result)</span>
          </div>

          <div className="space-y-4">
            {report.starAnalysis.map((star, idx) => (
              <div key={idx} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-white">
                  Q: {star.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-0.5">Situation (Konteks):</span>
                    {star.situation}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-0.5">Task (Tanggung Jawab):</span>
                    {star.task}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-0.5">Action (Tindakan):</span>
                    {star.action}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="font-bold text-indigo-400 block mb-0.5">Result (Dampak Nyata):</span>
                    {star.result}
                  </div>
                </div>
                <div className="text-[11px] bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-lg text-indigo-300">
                  <span className="font-bold">Tips STAR: </span> {star.improvementTip}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Accordion */}
      <details className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-300">
        <summary className="font-semibold cursor-pointer text-slate-200 hover:text-white flex items-center justify-between">
          <span>Lihat Transkrip Lengkap Percakapan ({transcript.length} dialog)</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </summary>
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 max-h-80 overflow-y-auto pr-2">
          {transcript.map((m) => (
            <div key={m.id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <span className="font-bold text-[10px] text-indigo-400 uppercase block mb-1">
                {m.sender === 'ai' ? 'Pewawancara AI' : profile.name}
              </span>
              <p className="text-slate-300">{m.text}</p>
            </div>
          ))}
        </div>
      </details>

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `Hasil AI Interview Simulator:\nSkor: ${report.overallScore}/100\nEvaluasi: ${report.summaryFeedback}`
            );
            alert('Ringkasan evaluasi berhasil disalin ke clipboard!');
          }}
          className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          Salin Hasil Evaluasi
        </button>

        <button
          onClick={onStartNewSession}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Mulai Latihan Baru</span>
        </button>
      </div>
    </div>
  );
};
