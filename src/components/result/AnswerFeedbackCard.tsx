'use client';

import React, { useState } from 'react';
import { AnswerEvaluation } from '@/types/wawancara';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Lightbulb, 
  MessageSquare, 
  HelpCircle,
  ThumbsUp,
  AlertCircle
} from 'lucide-react';

interface AnswerFeedbackCardProps {
  answer: AnswerEvaluation;
}

export function AnswerFeedbackCard({ answer }: AnswerFeedbackCardProps) {
  const [isOpenExample, setIsOpenExample] = useState(false);

  // Warna skor
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (score >= 70) return 'bg-[#EAF2FE] text-[#2F67BB] border-[#4A8DF0]/40';
    return 'bg-orange-100 text-[#F26A2B] border-orange-300';
  };

  const starElements = [
    { key: 'situation', label: 'Situation (S)', fulfilled: answer.starCriteria.situation, desc: 'Latar situasi jelas' },
    { key: 'task', label: 'Task (T)', fulfilled: answer.starCriteria.task, desc: 'Tugas/tanggung jawab' },
    { key: 'action', label: 'Action (A)', fulfilled: answer.starCriteria.action, desc: 'Langkah nyata diambil' },
    { key: 'result', label: 'Result (R)', fulfilled: answer.starCriteria.result, desc: 'Hasil & dampak terukur' },
  ];

  return (
    <div className="w-full rounded-2xl bg-white border border-[#2F67BB]/15 p-5 sm:p-6 shadow-xs hover:border-[#4A8DF0]/40 transition-colors">
      {/* Header Kartu: Nomor Pertanyaan & Nilai */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#2F67BB] text-white text-xs font-bold flex items-center justify-center">
            Q{answer.questionIndex}
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pertanyaan ke-{answer.questionIndex}
          </span>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-extrabold border ${getScoreColor(answer.score)}`}>
          Nilai: {answer.score} / 100
        </div>
      </div>

      {/* Teks Pertanyaan */}
      <div className="mt-3.5">
        <h4 className="text-base sm:text-lg font-bold text-[#1B2A41] flex items-start gap-2">
          <HelpCircle className="w-5 h-5 text-[#4A8DF0] flex-shrink-0 mt-0.5" />
          <span>{answer.questionText}</span>
        </h4>
      </div>

      {/* Jawaban Pengguna */}
      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          Jawaban Anda:
        </div>
        <p className="text-sm sm:text-base text-[#1B2A41] leading-relaxed italic">
          &ldquo;{answer.userAnswer}&rdquo;
        </p>
      </div>

      {/* Penanda STAR (Situation, Task, Action, Result) */}
      <div className="mt-4">
        <span className="text-xs font-bold text-slate-600 block mb-2 uppercase tracking-wider">
          Pemeriksaan Framework STAR:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {starElements.map((elem) => (
            <div
              key={elem.key}
              className={`p-2 rounded-xl border flex items-center gap-2 text-xs font-medium ${
                elem.fulfilled
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              {elem.fulfilled ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <div className="truncate">
                <span className="font-bold">{elem.label}</span>
                <span className="hidden sm:inline text-[10px] text-slate-500 block truncate">
                  {elem.fulfilled ? 'Terpenuhi' : 'Belum jelas'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kekuatan & Saran Perbaikan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
          <span className="font-bold text-emerald-800 flex items-center gap-1 mb-1">
            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
            Kekuatan Jawaban:
          </span>
          <p className="text-slate-700 leading-relaxed">{answer.strengths}</p>
        </div>

        <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-100 text-xs">
          <span className="font-bold text-[#F26A2B] flex items-center gap-1 mb-1">
            <AlertCircle className="w-3.5 h-3.5 text-[#F26A2B]" />
            Saran Perbaikan:
          </span>
          <p className="text-slate-700 leading-relaxed">{answer.improvements}</p>
        </div>
      </div>

      {/* Accordion: Contoh Jawaban yang Lebih Baik */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setIsOpenExample(!isOpenExample)}
          className="w-full flex items-center justify-between text-xs sm:text-sm font-bold text-[#2F67BB] hover:text-[#4A8DF0] transition-colors py-1 focus:outline-hidden"
        >
          <span className="flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-[#FFC857]" />
            Contoh Jawaban yang Lebih Baik (Framework STAR)
          </span>
          {isOpenExample ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isOpenExample && (
          <div className="mt-2.5 p-3.5 rounded-xl bg-[#EAF2FE]/60 border border-[#4A8DF0]/30 text-xs sm:text-sm text-[#1B2A41] leading-relaxed animate-in fade-in duration-150">
            <p className="whitespace-pre-line font-medium">{answer.betterAnswerExample}</p>
          </div>
        )}
      </div>
    </div>
  );
}
