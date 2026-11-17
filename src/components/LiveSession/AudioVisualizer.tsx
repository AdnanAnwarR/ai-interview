'use client';

import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface AudioVisualizerProps {
  isAiSpeaking: boolean;
  isCandidateSpeaking: boolean;
  candidateMicLevel?: number;
  mode: 'hrd' | 'technical';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isAiSpeaking,
  isCandidateSpeaking,
  candidateMicLevel = 0,
  mode,
}) => {
  const isCandidateActive = isCandidateSpeaking || candidateMicLevel > 8;

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-white rounded-3xl border border-[#2F67BB]/15 shadow-sm relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isAiSpeaking
            ? 'bg-[#EAF2FE] opacity-90'
            : isCandidateActive
            ? 'bg-emerald-50 opacity-90'
            : 'opacity-0'
        }`}
      />

      {/* Visualizer Status Header */}
      <div className="flex items-center space-x-2 mb-6 z-10">
        {isAiSpeaking ? (
          <span className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF2FE] border border-[#4A8DF0]/40 text-[#2F67BB] text-xs font-bold animate-pulse shadow-sm">
            <Volume2 className="w-3.5 h-3.5 text-[#2F67BB]" />
            <span>Pewawancara AI Sedang Berbicara...</span>
          </span>
        ) : isCandidateActive ? (
          <span className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold animate-pulse shadow-sm">
            <Mic className="w-3.5 h-3.5 text-emerald-600" />
            <span>Suara Terdeteksi • Merekam Jawaban...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-[#1B2A41] text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Giliran Anda Bicara (Mikrofon Siap)</span>
          </span>
        )}
      </div>

      {/* Animated Waveform Bars */}
      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2.5 h-24 sm:h-28 z-10 w-full max-w-md">
        {Array.from({ length: 24 }).map((_, i) => {
          let heightClass = 'h-3';
          let bgClass = 'bg-slate-300';

          if (isAiSpeaking) {
            bgClass =
              mode === 'hrd'
                ? 'bg-gradient-to-t from-[#2F67BB] to-[#4A8DF0]'
                : 'bg-gradient-to-t from-[#1B2A41] to-[#4A8DF0]';
            const heights = ['h-6', 'h-16', 'h-24', 'h-12', 'h-20', 'h-28', 'h-14', 'h-8'];
            heightClass = heights[(i + (i % 3)) % heights.length];
          } else if (isCandidateActive) {
            bgClass = 'bg-gradient-to-t from-emerald-600 to-teal-400';
            const dynamicScale = Math.max(0.4, candidateMicLevel / 50);
            const heights = ['h-8', 'h-20', 'h-12', 'h-24', 'h-16', 'h-28', 'h-10'];
            heightClass = heights[(i * 2) % heights.length];
          }

          const scaleMultiplier = isCandidateActive
            ? Math.max(0.8, (candidateMicLevel / 40) + Math.sin(i) * 0.3)
            : 1;

          return (
            <div
              key={i}
              className={`w-1.5 sm:w-2 rounded-full transition-all duration-100 ${heightClass} ${bgClass}`}
              style={{
                transform:
                  isAiSpeaking || isCandidateActive
                    ? `scaleY(${scaleMultiplier})`
                    : 'scaleY(1)',
              }}
            />
          );
        })}
      </div>

      {/* Subtle Hint */}
      <div className="flex items-center justify-between w-full max-w-md text-[11px] text-slate-500 mt-4 z-10 px-2 font-medium">
        <span>{isAiSpeaking ? 'Dengarkan pertanyaan hingga selesai...' : 'Bicaralah langsung ke mikrofon Anda'}</span>
        {!isAiSpeaking && candidateMicLevel > 0 && (
          <span className="font-mono text-emerald-700 font-bold text-[10px]">
            Input Mic: {candidateMicLevel}%
          </span>
        )}
      </div>
    </div>
  );
};
