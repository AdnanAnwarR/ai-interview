'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Mic, Volume2, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles, X } from 'lucide-react';
import { AudioHardwareManager } from '@/lib/audio/webAudio';

interface AudioHardwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
}

export const AudioHardwareModal: React.FC<AudioHardwareModalProps> = ({
  isOpen,
  onClose,
  onProceed,
}) => {
  const [micGranted, setMicGranted] = useState<boolean | null>(null);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [speakerTested, setSpeakerTested] = useState<boolean>(false);
  const [isPlayingTestTone, setIsPlayingTestTone] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  const audioManagerRef = useRef<AudioHardwareManager | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (audioManagerRef.current) {
        audioManagerRef.current.stop();
        audioManagerRef.current = null;
      }
      return;
    }

    const manager = new AudioHardwareManager();
    audioManagerRef.current = manager;

    // Start mic test
    manager
      .requestMicrophone((vol) => {
        setMicVolume(vol);
      })
      .then((granted) => {
        setMicGranted(granted);
        if (!granted) {
          setMicError('Izin mikrofon ditolak atau perangkat tidak terdeteksi.');
        }
      })
      .catch(() => {
        setMicGranted(false);
        setMicError('Gagal mengakses mikrofon.');
      });

    return () => {
      manager.stop();
    };
  }, [isOpen]);

  const handleTestSpeaker = async () => {
    if (!audioManagerRef.current) return;
    setIsPlayingTestTone(true);
    await audioManagerRef.current.playTestSound();
    setIsPlayingTestTone(false);
    setSpeakerTested(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#2F67BB]/20 rounded-3xl shadow-xl p-6 sm:p-8 overflow-hidden relative">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-[#EAF2FE] rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF2FE] text-[#2F67BB] flex items-center justify-center border border-[#4A8DF0]/30 shadow-sm">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1B2A41]">Uji Perangkat Audio</h2>
              <p className="text-xs text-slate-500">Pastikan mikrofon & speaker Anda siap sebelum sesi dimulai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Microphone Test */}
        <div className="bg-[#EAF2FE]/40 rounded-2xl p-4 border border-[#4A8DF0]/20 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-[#4A8DF0]" />
              <span className="text-xs font-bold text-[#1B2A41]">1. Uji Input Mikrofon</span>
            </div>
            {micGranted ? (
              <span className="flex items-center space-x-1 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mikrofon Aktif</span>
              </span>
            ) : micError ? (
              <span className="flex items-center space-x-1 text-rose-600 text-xs font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Belum Diizinkan</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-slate-500 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A8DF0]" />
                <span>Memeriksa mic...</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-600 mb-3">
            Bicaralah sejenak. Indikator level volume di bawah akan bergerak merespon suara Anda.
          </p>

          {/* Volume Meter Bar */}
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5 border border-slate-300">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                micVolume > 60
                  ? 'bg-rose-500'
                  : micVolume > 15
                  ? 'bg-emerald-500'
                  : micVolume > 4
                  ? 'bg-[#4A8DF0]'
                  : 'bg-slate-400'
              }`}
              style={{ width: `${Math.max(4, micVolume)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-medium">
            <span>Senyap</span>
            <span className="text-[#1B2A41] font-mono font-bold">{micVolume}%</span>
            <span>Kencang</span>
          </div>

          {micError && (
            <p className="text-xs text-rose-700 mt-2 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              {micError} Silakan klik ikon gembok di bilah URL browser Anda untuk mengizinkan akses mikrofon.
            </p>
          )}
        </div>

        {/* Step 2: Speaker Test */}
        <div className="bg-[#EAF2FE]/40 rounded-2xl p-4 border border-[#4A8DF0]/20 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-[#2F67BB]" />
              <span className="text-xs font-bold text-[#1B2A41]">2. Uji Speaker / Headphone</span>
            </div>
            {speakerTested && (
              <span className="flex items-center space-x-1 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Terdengar Jelas</span>
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-600 mb-3">
            Klik tombol di bawah untuk membunyikan nada uji agar suara pewawancara AI terdengar jelas.
          </p>

          <button
            onClick={handleTestSpeaker}
            disabled={isPlayingTestTone}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#1B2A41] text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isPlayingTestTone ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#4A8DF0]" />
                <span>Membunyikan Nada Uji...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#2F67BB]" />
                <span>{speakerTested ? 'Putar Ulang Nada Uji' : 'Putar Nada Uji Suara'}</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors"
          >
            Batal
          </button>

          <button
            onClick={onProceed}
            disabled={!micGranted}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              micGranted
                ? 'bg-[#F26A2B] hover:bg-[#d95316] text-white shadow-sm'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <span>Mulai Sesi Wawancara</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
