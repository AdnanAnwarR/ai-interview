'use client';

import React, { useEffect, useRef } from 'react';
import { VideoOff, User } from 'lucide-react';

interface SelfViewProps {
  isCameraOn: boolean;
  onToggleCamera: () => void;
}

export function SelfView({ isCameraOn }: SelfViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      if (isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user',
            },
            audio: false, // audio dikelola terpisah via SpeechRecognition
          });

          if (!active) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.warn('Izin kamera tidak diberikan atau perangkat tidak ditemukan:', err);
        }
      } else {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }

    setupCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraOn]);

  return (
    <div className="relative group overflow-hidden rounded-2xl bg-[#1B2A41] border-2 border-white/80 shadow-xl w-32 h-44 sm:w-44 sm:h-32 transition-all">
      {isCameraOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover transform scale-x-[-1]" // Cermin (mirror mode)
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
          <div className="w-10 h-10 rounded-full bg-slate-700/80 flex items-center justify-center mb-1 text-slate-300">
            <User className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium flex items-center gap-1 text-slate-400">
            <VideoOff className="w-3 h-3" />
            Kamera Nonaktif
          </span>
        </div>
      )}

      {/* Label Pratinjau Lokal */}
      <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
        <span className="px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] text-white font-medium">
          Anda (Lokal)
        </span>
        <span
          className="text-[9px] text-[#FFC857] bg-black/60 px-1 py-0.5 rounded font-mono"
          title="Pratinjau hanya di perangkat Anda, tidak direkam atau diunggah"
        >
          Pribadi
        </span>
      </div>
    </div>
  );
}
