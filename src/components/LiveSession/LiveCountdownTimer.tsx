'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { SESSION_DURATION_SECONDS, LOW_TIME_WARNING_SECONDS } from '@/lib/constants';

interface LiveCountdownTimerProps {
  onTimeExpired: () => void;
  onLowTimeAlert?: () => void;
}

export const LiveCountdownTimer: React.FC<LiveCountdownTimerProps> = ({
  onTimeExpired,
  onLowTimeAlert,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(SESSION_DURATION_SECONDS);
  const [lowTimeFired, setLowTimeFired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeExpired();
          return 0;
        }

        // Low-time alert when <= 2 minutes (120 seconds)
        if (prev - 1 <= LOW_TIME_WARNING_SECONDS && !lowTimeFired) {
          setLowTimeFired(true);
          onLowTimeAlert?.();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lowTimeFired, onLowTimeAlert, onTimeExpired]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isLowTime = secondsRemaining <= LOW_TIME_WARNING_SECONDS;

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
        isLowTime
          ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-pulse'
          : 'bg-slate-900 border-slate-800 text-slate-200'
      }`}
    >
      {isLowTime ? (
        <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
      ) : (
        <Clock className="w-4 h-4 text-indigo-400" />
      )}
      <span>{formattedTime}</span>
      {isLowTime && (
        <span className="text-[10px] uppercase font-sans tracking-wide text-rose-300">
          (Sisa &lt; 2 mnt)
        </span>
      )}
    </div>
  );
};
