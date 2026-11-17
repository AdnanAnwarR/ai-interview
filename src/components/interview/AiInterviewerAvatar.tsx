'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';

interface AiInterviewerAvatarProps {
  isSpeaking: boolean;
  interviewerName: string;
  style: 'ramah' | 'tegas' | 'stress';
}

export function AiInterviewerAvatar({
  isSpeaking,
  interviewerName,
  style,
}: AiInterviewerAvatarProps) {
  // Warna aksen latar sesuai gaya pewawancara
  const accentColor =
    style === 'ramah' ? '#4A8DF0' : style === 'tegas' ? '#2F67BB' : '#F26A2B';

  return (
    <div className="relative flex flex-col items-center justify-center p-6 select-none">
      {/* Soundwave animation rings saat AI berbicara */}
      {isSpeaking && (
        <>
          <div
            className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-[#4A8DF0]/40 animate-ping pointer-events-none"
            style={{ animationDuration: '2s' }}
          />
          <div
            className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-[#4A8DF0]/10 animate-pulse pointer-events-none"
            style={{ animationDuration: '1.2s' }}
          />
        </>
      )}

      {/* Ilustrasi Avatar SVG Ramah dan Membumi */}
      <div
        className={`relative z-10 w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 shadow-xl transition-all duration-300 ${
          isSpeaking ? 'ring-4 ring-[#F26A2B] scale-105 shadow-[#F26A2B]/30' : 'ring-2 ring-white/60 shadow-black/10'
        }`}
        style={{ backgroundColor: accentColor }}
      >
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full rounded-full overflow-hidden"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle */}
          <circle cx="80" cy="80" r="80" fill="#EAF2FE" />

          {/* Shoulders / Blazer */}
          <path
            d="M20 160 C20 120, 50 105, 80 105 C110 105, 140 120, 140 160 Z"
            fill={style === 'stress' ? '#1B2A41' : '#2F67BB'}
          />
          {/* Kemeja dalam */}
          <polygon points="80,105 65,135 95,135" fill="#FFFFFF" />
          {/* Dasi / Syal aksen */}
          <polygon
            points="80,120 74,155 80,160 86,155"
            fill="#F26A2B"
          />

          {/* Leher */}
          <rect x="71" y="80" width="18" height="25" rx="5" fill="#FBD38D" />

          {/* Wajah */}
          <ellipse cx="80" cy="65" rx="30" ry="34" fill="#FEEBC8" />

          {/* Rambut rapi */}
          <path
            d="M48 60 C48 35, 60 25, 80 25 C100 25, 112 35, 112 60 C112 65, 110 50, 80 48 C50 50, 48 65, 48 60 Z"
            fill="#1B2A41"
          />

          {/* Kacamata profesional */}
          <circle cx="68" cy="63" r="10" stroke="#1B2A41" strokeWidth="2.5" fill="none" />
          <circle cx="92" cy="63" r="10" stroke="#1B2A41" strokeWidth="2.5" fill="none" />
          <line x1="78" y1="63" x2="82" y2="63" stroke="#1B2A41" strokeWidth="2.5" />

          {/* Mata berkedip / ramah */}
          <circle cx="68" cy="63" r="3" fill="#1B2A41" />
          <circle cx="92" cy="63" r="3" fill="#1B2A41" />

          {/* Mulut yang bergerak saat berbicara */}
          {isSpeaking ? (
            <ellipse cx="80" cy="83" rx="7" ry="5" fill="#C53030" className="animate-pulse" />
          ) : (
            <path
              d="M74 81 Q80 87 86 81"
              stroke="#C53030"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
          )}

          {/* Pipi merona */}
          <circle cx="58" cy="73" r="4" fill="#FEB2B2" opacity="0.6" />
          <circle cx="102" cy="73" r="4" fill="#FEB2B2" opacity="0.6" />
        </svg>

        {/* Status Badge AI Sedang Berbicara */}
        {isSpeaking && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F26A2B] text-white text-[11px] font-bold shadow-md animate-bounce">
            <Volume2 className="w-3 h-3" />
            Bicara
          </span>
        )}
      </div>

      <div className="mt-3 text-center">
        <h3 className="font-bold text-[#1B2A41] text-base sm:text-lg flex items-center justify-center gap-1.5">
          <span>{interviewerName}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Online"></span>
        </h3>
        <p className="text-xs text-[#2F67BB] font-medium capitalize">
          Pewawancara • Gaya {style}
        </p>
      </div>
    </div>
  );
}
