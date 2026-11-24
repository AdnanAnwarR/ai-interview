'use client';

import React from 'react';

interface AiInterviewerAvatarProps {
  isSpeaking: boolean;
  interviewerName?: string;
  style?: 'ramah' | 'tegas' | 'stress' | string;
}

export function AiInterviewerAvatar({
  isSpeaking,
  interviewerName = 'Pewawancara AI',
  style = 'ramah',
}: AiInterviewerAvatarProps) {
  const currentStyle = style === 'stress' ? 'stress' : style === 'tegas' ? 'tegas' : 'ramah';

  return (
    <div className="w-36 sm:w-44 p-3 sm:p-3.5 rounded-2xl bg-[#152033] border border-slate-700/60 shadow-2xl flex flex-col items-center justify-center transition-all select-none">
      {/* Avatar Circle Container */}
      <div
        className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900 flex items-center justify-center overflow-hidden shadow-inner transition-transform ${
          isSpeaking
            ? currentStyle === 'stress'
              ? 'ring-4 ring-rose-500 scale-105'
              : currentStyle === 'tegas'
              ? 'ring-4 ring-blue-500 scale-105'
              : 'ring-4 ring-amber-400 scale-105'
            : 'ring-2 ring-white/20'
        }`}
      >
        {currentStyle === 'ramah' ? (
          // Avatar Sarah (Ramah / Warm HR)
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            {/* Background */}
            <circle cx="50" cy="50" r="50" fill="#FEF3C7" />
            {/* Hair back */}
            <path d="M22 45 C22 20 35 15 50 15 C65 15 78 20 78 45 C78 68 70 78 70 78 L30 78 C30 78 22 68 22 45 Z" fill="#92400E" />
            {/* Face */}
            <circle cx="50" cy="42" r="20" fill="#FDE68A" />
            {/* Hair bangs */}
            <path d="M30 35 C35 25 45 23 50 23 C58 23 68 26 70 35 C65 30 58 28 50 28 C42 28 35 30 30 35 Z" fill="#78350F" />
            {/* Eyes friendly curved */}
            <path d="M41 40 Q45 37 49 40" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M51 40 Q55 37 59 40" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Smiling lips */}
            {isSpeaking ? (
              <ellipse cx="50" cy="51" rx="5" ry="3.5" fill="#EF4444" className="animate-pulse" />
            ) : (
              <path d="M44 49 Q50 56 56 49" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}
            {/* Blushing cheeks */}
            <circle cx="38" cy="46" r="3" fill="#FCA5A5" opacity="0.6" />
            <circle cx="62" cy="46" r="3" fill="#FCA5A5" opacity="0.6" />
            {/* Yellow/Coral Suit */}
            <path d="M22 100 C22 75 35 65 50 65 C65 65 78 75 78 100 Z" fill="#F59E0B" />
            <path d="M43 65 L50 75 L57 65 Z" fill="#FFFFFF" />
          </svg>
        ) : currentStyle === 'tegas' ? (
          // Avatar Alex (Tegas / Professional Lead)
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            {/* Background */}
            <circle cx="50" cy="50" r="50" fill="#E0F2FE" />
            {/* Face */}
            <circle cx="50" cy="40" r="20" fill="#FCD5B8" />
            {/* Sharp Hair */}
            <path d="M30 34 C30 18 42 16 50 16 C60 16 70 18 70 34 C68 25 58 20 50 20 C40 20 32 25 30 34 Z" fill="#0F172A" />
            {/* Focus Eyes */}
            <circle cx="43" cy="38" r="2.5" fill="#0F172A" />
            <circle cx="57" cy="38" r="2.5" fill="#0F172A" />
            {/* Eyebrows firm */}
            <path d="M39 33 L47 34" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <path d="M61 33 L53 34" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            {/* Glasses */}
            <rect x="37" y="34" width="11" height="8" rx="2" stroke="#334155" strokeWidth="1.5" fill="none" />
            <rect x="52" y="34" width="11" height="8" rx="2" stroke="#334155" strokeWidth="1.5" fill="none" />
            <line x1="48" y1="38" x2="52" y2="38" stroke="#334155" strokeWidth="1.5" />
            {/* Mouth */}
            {isSpeaking ? (
              <ellipse cx="50" cy="50" rx="4.5" ry="3" fill="#991B1B" className="animate-pulse" />
            ) : (
              <line x1="45" y1="50" x2="55" y2="50" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
            )}
            {/* Navy Blazer & Tie */}
            <path d="M18 100 C18 72 34 62 50 62 C66 62 82 72 82 100 Z" fill="#1E3A8A" />
            <path d="M43 62 L50 74 L57 62 Z" fill="#FFFFFF" />
            <path d="M48 68 L52 68 L51 84 L49 84 Z" fill="#DC2626" />
          </svg>
        ) : (
          // Avatar Arya (Menantang / Critical Lead)
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
            {/* Background */}
            <circle cx="50" cy="50" r="50" fill="#F1F5F9" />
            {/* Face */}
            <circle cx="50" cy="40" r="20" fill="#FBCFE8" />
            {/* Dark slick hair */}
            <path d="M28 32 C28 16 42 14 50 14 C62 14 72 16 72 32 C68 22 58 17 50 17 C38 17 32 22 28 32 Z" fill="#18181B" />
            {/* Sharp intense eyes */}
            <ellipse cx="42" cy="38" rx="2.5" ry="2" fill="#18181B" />
            <ellipse cx="58" cy="38" rx="2.5" ry="2" fill="#18181B" />
            {/* Piercing eyebrows angled down */}
            <path d="M38 32 L47 36" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M62 32 L53 36" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
            {/* Mouth */}
            {isSpeaking ? (
              <ellipse cx="50" cy="50" rx="4" ry="3" fill="#881337" className="animate-pulse" />
            ) : (
              <path d="M45 50 Q50 48 55 50" stroke="#18181B" strokeWidth="2" strokeLinecap="round" fill="none" />
            )}
            {/* Charcoal Executive Suit */}
            <path d="M16 100 C16 70 32 60 50 60 C68 60 84 70 84 100 Z" fill="#09090B" />
            <path d="M42 60 L50 72 L58 60 Z" fill="#E2E8F0" />
            <path d="M48 66 L52 66 L51 86 L49 86 Z" fill="#7C3AED" />
          </svg>
        )}

        {/* Pulsing audio indicator when speaking */}
        {isSpeaking && (
          <span
            className={`absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 border-white animate-ping ${
              currentStyle === 'stress'
                ? 'bg-rose-500'
                : currentStyle === 'tegas'
                ? 'bg-blue-400'
                : 'bg-emerald-400'
            }`}
          />
        )}
      </div>

      {/* Label Name & Style Badge */}
      <span className="text-xs sm:text-sm font-bold text-slate-100 mt-2.5 text-center tracking-tight truncate max-w-full">
        {interviewerName}
      </span>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 mt-1 rounded-full border ${
          currentStyle === 'stress'
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            : currentStyle === 'tegas'
            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        }`}
      >
        {currentStyle === 'stress' ? 'Menantang' : currentStyle === 'tegas' ? 'Tegas' : 'Ramah'}
      </span>
    </div>
  );
}
