'use client';

import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, AlertTriangle } from 'lucide-react';

interface ControlBarProps {
  isRecording: boolean;
  isCameraOn: boolean;
  isAiSpeaking: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onEndInterview: () => void;
}

export function ControlBar({
  isRecording,
  isCameraOn,
  isAiSpeaking,
  onToggleMic,
  onToggleCamera,
  onEndInterview,
}: ControlBarProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return (
    <>
      <div className="w-full flex items-center justify-center gap-4 sm:gap-6 py-4">
        {/* Tombol 1: Mikrofon (Bulat di tengah) */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleMic}
            disabled={isAiSpeaking}
            aria-label={isRecording ? 'Hentikan rekaman suara' : 'Mulai bicara dengan suara'}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 focus:outline-hidden focus:ring-4 ${
              isRecording
                ? 'bg-[#F26A2B] text-white ring-4 ring-[#F26A2B]/40 animate-pulse'
                : isAiSpeaking
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-[#4A8DF0] hover:bg-[#2F67BB] text-white ring-2 ring-[#4A8DF0]/30 hover:scale-105'
            }`}
          >
            {isRecording ? (
              <Mic className="w-7 h-7 animate-bounce" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>
          <span className="text-xs font-semibold text-[#1B2A41]">
            {isRecording ? 'Merekam Suara...' : 'Mikrofon'}
          </span>
        </div>

        {/* Tombol 2: Kamera on/off (Bulat) */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleCamera}
            aria-label={isCameraOn ? 'Matikan pratinjau kamera' : 'Nyalakan pratinjau kamera'}
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 focus:outline-hidden focus:ring-4 ${
              isCameraOn
                ? 'bg-white hover:bg-slate-100 text-[#1B2A41] border border-slate-300 ring-2 ring-[#2F67BB]/20'
                : 'bg-slate-700 hover:bg-slate-800 text-white'
            }`}
          >
            {isCameraOn ? (
              <Video className="w-6 h-6 text-[#2F67BB]" />
            ) : (
              <VideoOff className="w-6 h-6 text-slate-300" />
            )}
          </button>
          <span className="text-xs font-semibold text-[#1B2A41]">
            {isCameraOn ? 'Kamera Nyala' : 'Kamera Mati'}
          </span>
        </div>

        {/* Tombol 3: Akhiri Wawancara (Merah Bulat) */}
        <div className="flex flex-col items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            aria-label="Akhiri sesi wawancara sekarang"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all transform active:scale-95 focus:outline-hidden focus:ring-4 focus:ring-rose-500/30 hover:scale-105"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          <span className="text-xs font-semibold text-rose-700">Akhiri</span>
        </div>
      </div>

      {/* Modal Dialog Konfirmasi Penghentian Wawancara */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
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
