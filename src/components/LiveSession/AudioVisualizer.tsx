'use client';

import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface AudioVisualizerProps {
  isAiSpeaking: boolean;
  isCandidateSpeaking: boolean;
  mode: 'hrd' | 'technical';
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isAiSpeaking,
  isCandidateSpeaking,
  mode,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
          isAiSpeaking
            ? mode === 'hrd'
              ? 'bg-indigo-600/10 opacity-100'
              : 'bg-cyan-600/10 opacity-100'
            : isCandidateSpeaking
            ? 'bg-emerald-600/10 opacity-100'
            : 'opacity-0'
        }`}
      />

      {/* Visualizer Status Header */}
      <div className="flex items-center space-x-2 mb-6 z-10">
        {isAiSpeaking ? (
          <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-semibold animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <span>AI Pewawancara Sedang Berbicara...</span>
          </span>
        ) : isCandidateSpeaking ? (
          <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-pulse">
            <Mic className="w-3.5 h-3.5" />
            <span>Mendengarkan Suara Anda...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-ping" />
            <span>Giliran Bicara Anda (Bicara atau ketik)</span>
          </span>
        )}
      </div>

      {/* Animated Waveform Bars */}
      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2.5 h-24 sm:h-28 z-10 w-full max-w-md">
        {Array.from({ length: 24 }).map((_, i) => {
          let heightClass = 'h-3';
          let bgClass = 'bg-slate-700';

          if (isAiSpeaking) {
            bgClass = mode === 'hrd' ? 'bg-gradient-to-t from-indigo-600 to-violet-400' : 'bg-gradient-to-t from-cyan-600 to-blue-400';
            const heights = ['h-6', 'h-16', 'h-24', 'h-12', 'h-20', 'h-28', 'h-14', 'h-8'];
            heightClass = heights[(i + (i % 3)) % heights.length];
          } else if (isCandidateSpeaking) {
            bgClass = 'bg-gradient-to-t from-emerald-600 to-teal-300';
            const heights = ['h-8', 'h-20', 'h-12', 'h-24', 'h-16', 'h-28', 'h-10'];
            heightClass = heights[(i * 2) % heights.length];
          }

          return (
            <div
              key={i}
              className={`w-1.5 sm:w-2 rounded-full transition-all duration-150 ${heightClass} ${bgClass}`}
              style={{
                transitionDelay: `${(i % 5) * 20}ms`,
                transform: isAiSpeaking || isCandidateSpeaking ? `scaleY(${1 + Math.sin(i) * 0.2})` : 'scaleY(1)',
              }}
            />
          );
        })}
      </div>

      {/* Subtle Hint */}
      <p className="text-[11px] text-slate-500 mt-4 z-10">
        {isAiSpeaking ? 'Dengarkan pertanyaan hingga AI selesai berbicara' : 'Bicaralah dengan intonasi jelas dan alami'}
      </p>
    </div>
  );
};
