'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface ChatSubtitleProps {
  subtitleText: string;
  isStreaming: boolean;
  isAiTyping: boolean;
  isAiSpeaking?: boolean;
  isMuted?: boolean;
  onReplaySpeech?: () => void;
}

export function ChatSubtitle({
  subtitleText,
  isStreaming,
  isAiTyping,
  isAiSpeaking,
  isMuted,
  onReplaySpeech,
}: ChatSubtitleProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
      <div className="w-full min-h-[64px] sm:min-h-[72px] bg-[#0E1624] border border-slate-800/90 rounded-2xl px-6 py-4 sm:px-8 sm:py-5 text-white shadow-2xl flex items-center justify-between gap-4">
        <div className="flex-1">
          {isAiTyping && !subtitleText ? (
            <div className="flex items-center gap-2.5 text-slate-300 text-sm sm:text-base md:text-lg">
              <span>Pewawancara sedang merumuskan pertanyaan</span>
              <span className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-[#F26A2B] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#F26A2B] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-[#F26A2B] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          ) : subtitleText ? (
            <p className="text-base sm:text-lg md:text-xl leading-relaxed font-normal text-slate-100 select-text">
              {subtitleText}
              {isStreaming && (
                <span className="inline-block w-2 h-5 ml-1.5 bg-[#F26A2B] animate-pulse align-middle" />
              )}
            </p>
          ) : (
            <p className="text-sm sm:text-base text-slate-400 italic">
              Menunggu pewawancara memulai sesi...
            </p>
          )}
        </div>

        {/* Tombol Dengarkan / Putar Ulang Suara */}
        {subtitleText && onReplaySpeech && !isStreaming && (
          <button
            type="button"
            onClick={onReplaySpeech}
            title={isMuted ? 'Suara dinonaktifkan' : isAiSpeaking ? 'Sedang bersuara' : 'Putar ulang suara pertanyaan'}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isAiSpeaking
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700'
            }`}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Mute</span>
              </>
            ) : isAiSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                <span className="hidden sm:inline">Bicara...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Ulang Suara</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
