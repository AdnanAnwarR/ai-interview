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
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-slate-950/80 rounded-2xl border border-slate-800 shadow-inner relative overflow-hidden">
      {/* Ambient Radial Glow */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 pointer-events-none ${
          isAiSpeaking
            ? mode === 'hrd'
              ? 'bg-indigo-600/15 opacity-100'
              : 'bg-cyan-600/15 opacity-100'
            : isCandidateActive
            ? 'bg-emerald-600/15 opacity-100'
            : 'opacity-0'
        }`}
      />

      {/* Visualizer Status Header */}
      <div className="flex items-center space-x-2 mb-6 z-10">
        {isAiSpeaking ? (
          <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-xs font-semibold animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <span>AI Sedang Berbicara...</span>
          </span>
        ) : isCandidateActive ? (
          <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold animate-pulse">
            <Mic className="w-3.5 h-3.5" />
            <span>Suara Terdeteksi • Merekam Jawaban...</span>
          </span>
        ) : (
          <span className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Giliran Anda Bicara (Mikrofon Siap)</span>
          </span>
        )}
      </div>

      {/* Animated Waveform Bars */}
      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2.5 h-24 sm:h-28 z-10 w-full max-w-md">
        {Array.from({ length: 24 }).map((_, i) => {
          let heightClass = 'h-3';
          let bgClass = 'bg-slate-700';

          if (isAiSpeaking) {
            bgClass =
              mode === 'hrd'
                ? 'bg-gradient-to-t from-indigo-600 to-violet-400'
                : 'bg-gradient-to-t from-cyan-600 to-blue-400';
            const heights = ['h-6', 'h-16', 'h-24', 'h-12', 'h-20', 'h-28', 'h-14', 'h-8'];
            heightClass = heights[(i + (i % 3)) % heights.length];
          } else if (isCandidateActive) {
            bgClass = 'bg-gradient-to-t from-emerald-600 to-teal-300';
            // Scale dynamically with physical mic volume level
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
      <div className="flex items-center justify-between w-full max-w-md text-[11px] text-slate-400 mt-4 z-10 px-2">
        <span>{isAiSpeaking ? 'Dengarkan pertanyaan...' : 'Bicaralah langsung ke mikrofon'}</span>
        {!isAiSpeaking && candidateMicLevel > 0 && (
          <span className="font-mono text-emerald-400 text-[10px]">
            Input Mic: {candidateMicLevel}%
          </span>
        )}
      </div>
    </div>
  );
};
