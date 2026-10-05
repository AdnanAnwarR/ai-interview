'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Mic, Volume2, CheckCircle2, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
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
      .catch((err) => {
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

  const isReadyToStart = micGranted && speakerTested;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden relative">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Uji Perangkat Audio</h2>
            <p className="text-xs text-slate-400">Pastikan mikrofon dan speaker Anda berfungsi optimal</p>
          </div>
        </div>

        {/* Step 1: Microphone Test */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Mic className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">1. Uji Mikrofon</span>
            </div>
            {micGranted ? (
              <span className="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terhubung</span>
              </span>
            ) : micError ? (
              <span className="flex items-center space-x-1 text-rose-400 text-xs font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Belum Diizinkan</span>
              </span>
            ) : (
              <span className="flex items-center space-x-1 text-slate-400 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memeriksa...</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Cobalah berbicara ke mikrofon Anda. Bar volume di bawah akan bergerak merespon suara Anda.
          </p>

          {/* Volume Meter Bar */}
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                micVolume > 60
                  ? 'bg-rose-500'
                  : micVolume > 20
                  ? 'bg-emerald-500'
                  : micVolume > 5
                  ? 'bg-indigo-500'
                  : 'bg-slate-600'
              }`}
              style={{ width: `${Math.max(4, micVolume)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
            <span>Senyap</span>
            <span className="text-slate-300 font-mono">{micVolume}%</span>
            <span>Kencang</span>
          </div>

          {micError && (
            <p className="text-xs text-rose-400 mt-2 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
              {micError} Silakan klik tombol gembok di URL browser untuk mengizinkan mikrofon.
            </p>
          )}
        </div>

        {/* Step 2: Speaker Test */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/80 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold text-slate-200">2. Uji Speaker / Headphone</span>
            </div>
            {speakerTested && (
              <span className="flex items-center space-x-1 text-emerald-400 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Terdengar Jelas</span>
              </span>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-3">
            Klik tombol di bawah untuk membunyikan nada uji coba dan memastikan suara AI akan terdengar jelas.
          </p>

          <button
            onClick={handleTestSpeaker}
            disabled={isPlayingTestTone}
            className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center justify-center space-x-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isPlayingTestTone ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Membunyikan Nada Uji...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span>{speakerTested ? 'Uji Suara Lagi' : 'Putar Nada Uji Suara'}</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 text-xs font-medium transition-colors"
          >
            Batal
          </button>

          <button
            onClick={onProceed}
            disabled={!micGranted}
            className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
              micGranted
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
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
