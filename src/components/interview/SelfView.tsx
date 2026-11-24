'use client';

import React, { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

interface SelfViewProps {
  isCameraOn: boolean;
  onToggleCamera: () => void;
}

export function SelfView({ isCameraOn, onToggleCamera }: SelfViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    async function setupCamera() {
      if (isCameraOn) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            },
            audio: false,
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
    <div className="w-full flex flex-col items-center justify-center select-none px-4">
      {isCameraOn ? (
        <div className="relative group w-full max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl aspect-video max-h-[58vh] rounded-3xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shadow-2xl transition-all">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <button
            type="button"
            onClick={onToggleCamera}
            className="absolute bottom-3 right-3 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-xs sm:text-sm text-white transition-all backdrop-blur-xs flex items-center gap-2 shadow-lg"
          >
            <Camera className="w-4 h-4 text-[#F26A2B]" />
            <span>Matikan kamera</span>
          </button>
        </div>
      ) : (
        <div
          onClick={onToggleCamera}
          title="Klik untuk menyalakan kamera"
          className="flex flex-col items-center justify-center cursor-pointer group my-auto py-6"
        >
          {/* Big Blue Circle Avatar "Kamu" */}
          <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-bold text-4xl sm:text-5xl shadow-2xl transition-transform group-hover:scale-105 active:scale-95 select-none ring-4 ring-[#2563EB]/20">
            Kamu
          </div>

          {/* Subtext */}
          <span className="text-sm sm:text-base text-slate-300 mt-4 font-medium select-none group-hover:text-white transition-colors">
            Kamera tidak aktif
          </span>
        </div>
      )}
    </div>
  );
}
