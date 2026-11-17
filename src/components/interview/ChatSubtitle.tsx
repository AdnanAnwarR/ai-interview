'use client';

import React from 'react';

interface ChatSubtitleProps {
  subtitleText: string;
  isStreaming: boolean;
  isAiTyping: boolean;
}

export function ChatSubtitle({
  subtitleText,
  isStreaming,
  isAiTyping,
}: ChatSubtitleProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-3">
      <div className="relative min-h-[90px] flex flex-col justify-center rounded-2xl bg-[#1B2A41]/90 backdrop-blur-md border border-[#4A8DF0]/20 p-4 sm:p-5 shadow-lg text-white">
        {/* Label subtitle kecil */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold tracking-wider uppercase text-[#FFC857] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC857]"></span>
            Subtitle Pewawancara
          </span>
          {isStreaming && (
            <span className="text-[11px] text-[#4A8DF0] font-medium animate-pulse">
              Sedang mentransmisikan audio...
            </span>
          )}
        </div>

        {/* Konten Subtitle atau Status Mengetik */}
        {isAiTyping && !subtitleText ? (
          <div className="flex items-center gap-2 text-slate-300 text-base py-1">
            <span>Pewawancara sedang merumuskan pertanyaan</span>
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC857] animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC857] animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC857] animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        ) : subtitleText ? (
          <p className="text-base sm:text-lg leading-relaxed font-medium text-slate-100 select-text">
            {subtitleText}
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-[#F26A2B] animate-pulse align-middle" />
            )}
          </p>
        ) : (
          <p className="text-sm sm:text-base text-slate-400 italic">
            Menunggu pewawancara memulai sesi...
          </p>
        )}
      </div>
    </div>
  );
}
