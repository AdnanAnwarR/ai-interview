'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle } from 'lucide-react';

interface ControlBarProps {
  isRecording: boolean;
  isMuted: boolean;
  isAiSpeaking: boolean;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onEndInterview: () => void;
}

export function ControlBar({
  isRecording,
  isMuted,
  isAiSpeaking,
  onToggleMic,
  onToggleSpeaker,
  onEndInterview,
}: ControlBarProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <>
      <div className="w-full flex items-center justify-center gap-6 sm:gap-8 py-4 sm:py-5 select-none">
        {/* Tombol 1: Speaker (Kiri) */}
        <button
          type="button"
          onClick={onToggleSpeaker}
          title={isMuted ? 'Nyalakan suara pewawancara' : 'Bisukan suara pewawancara'}
          className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#212F45] hover:bg-[#2C3E5A] text-white flex items-center justify-center shadow-xl transition-all active:scale-95 hover:scale-105 focus:outline-hidden"
        >
          {isMuted ? (
            <VolumeX className="w-6 h-6 sm:w-7 sm:h-7 text-rose-400" />
          ) : (
            <Volume2 className="w-6 h-6 sm:w-7 sm:h-7 text-slate-200" />
          )}
        </button>

        {/* Tombol 2: Akhiri Panggilan / End Call (Tengah - Merah Besar) */}
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          title="Akhiri wawancara sekarang"
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#E53935] hover:bg-[#D32F2F] text-white flex items-center justify-center shadow-2xl shadow-red-500/40 transition-all active:scale-95 hover:scale-105 focus:outline-hidden"
        >
          {/* Handset Phone Down SVG Icon */}
          <svg className="w-7 h-7 sm:w-9 sm:h-9 fill-white" viewBox="0 0 24 24">
            <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.58.9A14.48 14.48 0 0 1 2.5 15c-.44.07-.85-.18-1.02-.58L.15 11.2a1.05 1.05 0 0 1 .25-1.12C4.1 6.8 7.85 5 12 5s7.9 1.8 11.6 5.08c.32.28.42.74.25 1.12l-1.33 3.22c-.17.4-.58.65-1.02.58a14.48 14.48 0 0 1-4.32-1.28.99.99 0 0 1-.58-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
          </svg>
        </button>

        {/* Tombol 3: Mikrofon (Kanan) */}
        <button
          type="button"
          onClick={onToggleMic}
          disabled={isAiSpeaking}
          title={isRecording ? 'Hentikan rekaman suara' : 'Mulai bicara dengan mikrofon'}
          className={`w-13 h-13 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 hover:scale-105 focus:outline-hidden ${
            isRecording
              ? 'bg-[#F26A2B] text-white ring-4 ring-[#F26A2B]/40 animate-pulse'
              : isAiSpeaking
              ? 'bg-slate-700/60 text-slate-500 cursor-not-allowed'
              : 'bg-[#212F45] hover:bg-[#2C3E5A] text-white'
          }`}
        >
          {isRecording ? (
            <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white animate-bounce" />
          ) : (
            <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-slate-200" />
          )}
        </button>
      </div>

      {/* Modal Dialog Konfirmasi Penghentian Wawancara */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1B2A41] mb-2">
              Akhiri Sesi Wawancara?
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menyelesaikan wawancara lebih awal? Jawaban yang telah Anda sampaikan akan langsung dievaluasi untuk membentuk laporan hasil Anda.
            </p>
            <div className="flex items-center gap-3 justify-center">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Lanjutkan Wawancara
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  onEndInterview();
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-sm font-semibold text-white shadow-md shadow-rose-600/20 transition-colors"
              >
                Ya, Akhiri & Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
