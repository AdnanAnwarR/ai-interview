'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AiInterviewerAvatar } from './AiInterviewerAvatar';
import { ChatSubtitle } from './ChatSubtitle';
import { SelfView } from './SelfView';
import { ControlBar } from './ControlBar';
import { InterviewConfig, InterviewMessage } from '@/types/wawancara';
import { RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';

// Polyfill window types untuk Web Speech Recognition
interface SpeechRecognitionResultItem {
  transcript: string;
}
interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: SpeechRecognitionResultItem;
    isFinal: boolean;
  };
  length: number;
}
interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

interface InterviewRoomProps {
  interviewId: string;
  config: InterviewConfig;
  initialMessages: InterviewMessage[];
  initialQuestionIndex: number;
  totalQuestions: number;
}

export function InterviewRoom({
  interviewId,
  config,
  initialMessages,
  initialQuestionIndex,
  totalQuestions,
}: InterviewRoomProps) {
  const router = useRouter();

  // Normalisasi pesan awal dari API (mendukung sender/text maupun role/content)
  const normalizedInitial = (initialMessages || []).map((m: any) => ({
    id: m.id || String(Date.now()),
    sender: (m.sender === 'ai' || m.role === 'assistant' || m.role === 'ai' ? 'ai' : 'user') as 'ai' | 'user',
    text: m.text || m.content || '',
    timestamp: m.timestamp || (m.createdAt ? new Date(m.createdAt).getTime() : Date.now()),
    questionIndex: m.questionIndex || 1,
  }));

  // State percakapan & kontrol
  const [messages, setMessages] = useState<InterviewMessage[]>(normalizedInitial);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex || 1);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [, setSpeechSupported] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // State input teks
  const [textInput, setTextInput] = useState('');

  // Timer panggilan (detik berjalan)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Subtitle aktif (pesan AI terakhir yang sedang/telah dibaca)
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  // Refs untuk audio speech & recognition
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastFailedAnswerRef = useRef<string>('');
  const hasSpokenInitialRef = useRef<boolean>(false);
  const lastSpokenTextRef = useRef<string>('');
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef<string>('');
  const [isWaitingToAutoSend, setIsWaitingToAutoSend] = useState<boolean>(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  const triggerAutoRedirect = useCallback(() => {
    setRedirectCountdown(3);
    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          router.push(`/interview/${interviewId}/result`);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [interviewId, router]);

  // Format timer MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer interval
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Inisialisasi Web Speech Synthesis & Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;

      const SpeechRecognitionConstructor =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionConstructor) {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Fungsi membacakan teks pertanyaan dengan SpeechSynthesis Bahasa Indonesia
  // Membedakan suara (pitch, tempo, voice gender) berdasarkan 3 Gaya Wawancara
  const speakText = useCallback(
    (text: string, force = false, onEndCallback?: () => void) => {
      if (isMuted || !synthRef.current || !text) {
        if (onEndCallback) onEndCallback();
        return;
      }

      // Cegah bug AI mengulang-ulang pertanyaan yang sama
      if (!force && lastSpokenTextRef.current === text) {
        return;
      }
      lastSpokenTextRef.current = text;

      try {
        synthRef.current.cancel();
        if (synthRef.current.paused) {
          synthRef.current.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';

        // 1. Modulasi Suara Berdasarkan 3 Gaya Wawancara
        const styleKey = (config?.interviewerStyle as string) || 'ramah';
        if (styleKey === 'stress') {
          // Menantang / Stress: Suara bariton berat, berbobot, tempo sedikit lambat & penuh tekanan
          utterance.pitch = 0.75;
          utterance.rate = 0.88;
        } else if (styleKey === 'tegas') {
          // Tegas: Suara formal mantap, lugas, tempo tegas & to-the-point
          utterance.pitch = 0.90;
          utterance.rate = 1.05;
        } else {
          // Ramah: Suara hangat, ceria, bersahabat, tempo santai & membimbing
          utterance.pitch = 1.15;
          utterance.rate = 0.95;
        }

        // 2. Pemilihan Karakter Suara Bahasa Indonesia
        const voices = synthRef.current.getVoices();
        const idVoices = voices.filter(
          (v) => v.lang === 'id-ID' || v.lang === 'id_ID' || v.lang.toLowerCase().includes('indonesia')
        );

        if (idVoices.length > 0) {
          if (styleKey === 'ramah') {
            const femaleVoice = idVoices.find(
              (v) =>
                v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('gadis') ||
                v.name.toLowerCase().includes('siti') ||
                v.name.toLowerCase().includes('wanita')
            );
            utterance.voice = femaleVoice || idVoices[0];
          } else {
            const maleVoice = idVoices.find(
              (v) =>
                v.name.toLowerCase().includes('male') ||
                v.name.toLowerCase().includes('andika') ||
                v.name.toLowerCase().includes('pria')
            );
            utterance.voice = maleVoice || (idVoices.length > 1 ? idVoices[1] : idVoices[0]);
          }
        }

        utterance.onstart = () => {
          setIsAiSpeaking(true);
        };
        utterance.onend = () => {
          setIsAiSpeaking(false);
          if (onEndCallback) {
            onEndCallback();
          }
        };
        utterance.onerror = () => {
          setIsAiSpeaking(false);
          if (onEndCallback) {
            onEndCallback();
          }
        };

        currentUtteranceRef.current = utterance;
        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
        setIsAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      }
    },
    [isMuted, config?.interviewerStyle]
  );

  // Set subtitle awal dan bicara otomatis SEKALI saat sesi dimulai
  useEffect(() => {
    const lastAiMsg = [...normalizedInitial].reverse().find((m) => m.sender === 'ai');
    const initialText =
      lastAiMsg?.text ||
      `Halo! Senang sekali bisa bertemu denganmu hari ini. Saya pewawancara di ${config.companyName || 'perusahaan'}. Untuk memulai sesi, boleh perkenalkan dirimu dan apa motivasimu melamar posisi ${config.targetRole || 'ini'}?`;

    setCurrentSubtitle(initialText);

    // Putar suara pembuka sekali saat pertama kali masuk ruang
    if (!hasSpokenInitialRef.current) {
      speakText(initialText);
      hasSpokenInitialRef.current = true;
    }
  }, [initialMessages, speakText, config.companyName, config.targetRole]);

  // Fallback timer: jika wawancara sudah selesai, otomatis redirect ke hasil setelah 5 detik jika suara selesai
  useEffect(() => {
    if (isFinished && redirectCountdown === null) {
      const fallbackTimer = setTimeout(() => {
        triggerAutoRedirect();
      }, 5000);
      return () => clearTimeout(fallbackTimer);
    }
  }, [isFinished, redirectCountdown, triggerAutoRedirect]);
  useEffect(() => {
    const handleFirstGesture = () => {
      if (synthRef.current && synthRef.current.paused) {
        synthRef.current.resume();
      }
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, []);

  // Handle SpeechRecognition (STT Bahasa Indonesia)
  const startListening = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'id-ID';

      rec.onresult = (event: SpeechRecognitionEventLike) => {
        let finalTrans = '';
        let interimTrans = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalTrans += res[0].transcript + ' ';
          } else {
            interimTrans += res[0].transcript;
          }
        }

        const combined = (finalTrans + interimTrans).trim();
        setTextInput(combined);
        latestTranscriptRef.current = combined;

        // Auto-send otomatis jika pelamar berhenti bicara selama 2.2 detik
        if (combined.length >= 3) {
          setIsWaitingToAutoSend(true);
          if (autoSendTimerRef.current) {
            clearTimeout(autoSendTimerRef.current);
          }
          autoSendTimerRef.current = setTimeout(() => {
            const answer = latestTranscriptRef.current.trim();
            if (answer && !isStreaming && !isAiTyping) {
              if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsRecording(false);
              }
              setIsWaitingToAutoSend(false);
              handleSendAnswer(answer);
            }
          }, 2200);
        }
      };

      rec.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
        setIsWaitingToAutoSend(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsRecording(true);
      setConnectionError(null);
    } catch (e) {
      console.warn('Gagal mengaktifkan speech recognition:', e);
      setIsRecording(false);
      setIsWaitingToAutoSend(false);
    }
  };

  const stopListening = () => {
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }
    setIsWaitingToAutoSend(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleMic = () => {
    if (isRecording) {
      stopListening();
    } else {
      startListening();
    }
  };

  const toggleSpeaker = () => {
    if (!isMuted && synthRef.current) {
      synthRef.current.cancel();
    }
    setIsMuted(!isMuted);
  };

  // Kirim jawaban pengguna ke API dengan Streaming
  const handleSendAnswer = async (answerToSend?: string) => {
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
    }
    setIsWaitingToAutoSend(false);

    const answer = (answerToSend || textInput).trim();
    if (!answer || isStreaming || isAiTyping) return;

    lastFailedAnswerRef.current = answer;
    setConnectionError(null);

    if (isRecording) {
      stopListening();
    }

    const userMsg: InterviewMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: answer,
      timestamp: Date.now(),
      questionIndex: currentQuestionIndex,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');

    setIsAiTyping(true);
    setCurrentSubtitle('');

    try {
      const response = await fetch(`/api/interviews/${interviewId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: answer }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi pewawancara AI.');
      }

      setIsAiTyping(false);
      setIsStreaming(true);

      const isFin = response.headers.get('X-Is-Finished') === 'true';
      const nextQIndex = Number(response.headers.get('X-Question-Index')) || (currentQuestionIndex + 1);
      setCurrentQuestionIndex(nextQIndex);
      if (isFin) {
        setIsFinished(true);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming stream reader tidak tersedia.');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedAiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':') || trimmed === 'data: [DONE]') continue;
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.text) {
                accumulatedAiText += data.text;
                setCurrentSubtitle(accumulatedAiText);
              }
            } catch {
              accumulatedAiText += trimmed.slice(6);
              setCurrentSubtitle(accumulatedAiText);
            }
          } else {
            accumulatedAiText += trimmed;
            setCurrentSubtitle(accumulatedAiText);
          }
        }
      }

      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.text) accumulatedAiText += data.text;
          } catch {
            accumulatedAiText += trimmed.slice(6);
          }
          setCurrentSubtitle(accumulatedAiText);
        }
      }

      setIsStreaming(false);

      const aiMsg: InterviewMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: accumulatedAiText,
        timestamp: Date.now(),
        questionIndex: nextQIndex,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Deteksi apakah sesi wawancara telah selesai atau ditutup oleh pewawancara
      const lowerAiText = accumulatedAiText.toLowerCase();
      const isEndingSession =
        isFin ||
        lowerAiText.includes('sesi wawancara ini saya akhiri') ||
        lowerAiText.includes('sesi wawancara kita akhiri') ||
        lowerAiText.includes('silakan meninggalkan ruangan') ||
        lowerAiText.includes('sesi wawancara telah berakhir') ||
        lowerAiText.includes('sesi wawancara kita cukupkan') ||
        lowerAiText.includes('wawancara kita sudahi') ||
        lowerAiText.includes('mari kita lihat evaluasi') ||
        lowerAiText.includes('sesi wawancara selesai');

      if (isEndingSession) {
        setIsFinished(true);
        if (isRecording) {
          stopListening();
        }
        // Laporkan penutupan sesi ke server
        fetch(`/api/interviews/${interviewId}/finish`, {
          method: 'POST',
          keepalive: true,
        }).catch(() => {});
      }

      speakText(accumulatedAiText, false, isEndingSession ? triggerAutoRedirect : undefined);
    } catch (err: unknown) {
      setIsAiTyping(false);
      setIsStreaming(false);
      const message = err instanceof Error ? err.message : 'Koneksi terputus saat streaming.';
      setConnectionError(message);
    }
  };

  const handleEndInterviewEarly = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();

    // Pastikan server menandai sesi ini sebagai FINISHED
    fetch(`/api/interviews/${interviewId}/finish`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {});

    router.push(`/interview/${interviewId}/result`);
  };

  const displayCompany = config?.companyName || 'Perusahaan';
  const displayRole = config?.targetRole || 'Posisi';

  return (
    <div className="relative w-full min-h-screen bg-[#0E1624] text-white flex flex-col justify-between overflow-hidden">
      {/* 1. Header Bar: Info Sesi & Timer */}
      <header className="w-full px-6 py-4 sm:px-10 sm:py-5 flex items-start justify-between z-10">
        <div>
          <h1 className="text-white font-bold text-lg sm:text-2xl tracking-tight">
            {displayCompany} · {displayRole}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
            Pertanyaan {Math.min(currentQuestionIndex, totalQuestions)} dari {totalQuestions}
          </p>
        </div>

        <div className="text-white font-bold text-lg sm:text-2xl font-mono tracking-wider">
          {formatTimer(elapsedSeconds)}
        </div>
      </header>

      {/* 2. Floating AI Interviewer Card (Top-Right) */}
      <div className="absolute top-16 right-4 sm:top-20 sm:right-8 z-20">
        <AiInterviewerAvatar
          isSpeaking={isAiSpeaking || isStreaming}
          interviewerName={
            config?.interviewerStyle === 'stress'
              ? 'Arya'
              : config?.interviewerStyle === 'tegas'
              ? 'Alex'
              : 'Sarah'
          }
          style={config?.interviewerStyle || 'ramah'}
        />
      </div>

      {/* 3. Main Center Stage: Avatar Kamu / Kamera */}
      <main className="flex-1 flex flex-col items-center justify-center my-auto py-6 z-10 w-full max-w-6xl mx-auto">
        <SelfView
          isCameraOn={isCameraOn}
          onToggleCamera={() => setIsCameraOn(!isCameraOn)}
        />
      </main>

      {/* 4. Bottom Section: Subtitle + Input Bar + Control Bar */}
      <footer className="w-full flex flex-col items-center pb-4 sm:pb-6 z-20">
        {/* Error message jika koneksi putus */}
        {connectionError && (
          <div className="w-full max-w-5xl mx-auto px-4 mb-3">
            <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center justify-between">
              <span>{connectionError}</span>
              <button
                type="button"
                onClick={() => handleSendAnswer(lastFailedAnswerRef.current)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {/* Subtitle / Pertanyaan AI */}
        <ChatSubtitle
          subtitleText={currentSubtitle}
          isStreaming={isStreaming}
          isAiTyping={isAiTyping}
          isAiSpeaking={isAiSpeaking}
          isMuted={isMuted}
          onReplaySpeech={() => speakText(currentSubtitle, true)}
        />

        {/* Input Bar Jawaban */}
        {!isFinished ? (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-3 sm:mt-4">
            {/* Status mikrofon & auto-send countdown indicator */}
            {isRecording && (
              <div className="mb-2 flex items-center justify-between text-xs px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-rose-400 font-semibold">Mikrofon Aktif — Mendengarkan...</span>
                </div>
                {isWaitingToAutoSend && (
                  <span className="text-amber-300 font-medium animate-pulse bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                    Selesai bicara? Jawaban otomatis terkirim...
                  </span>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAnswer();
              }}
              className="flex items-center gap-3 bg-[#152033] border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-2xl focus-within:border-slate-600 transition-colors"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isAiTyping || isStreaming}
                placeholder="Ketik jawabanmu, atau bicara lewat mikrofon"
                className="flex-1 bg-transparent px-4 py-2 sm:py-3 text-base sm:text-lg text-white placeholder:text-slate-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isAiTyping || isStreaming}
                className="bg-[#F26A2B] hover:bg-[#D9561A] active:scale-95 text-white font-semibold text-base sm:text-lg px-7 py-2.5 sm:py-3 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kirim
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto mt-3 px-4">
            <div className="py-3.5 px-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-center shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                <CheckCircle2 className="w-4 h-4" />
                Wawancara Telah Berakhir
              </div>
              <p className="text-xs text-slate-300 mb-3">
                Mengarahkan Anda ke laporan hasil dalam{' '}
                <span className="font-bold text-[#F26A2B]">{redirectCountdown !== null ? redirectCountdown : 3} detik</span>...
              </p>
              <button
                type="button"
                onClick={() => router.push(`/interview/${interviewId}/result`)}
                className="w-full py-2.5 rounded-xl bg-[#F26A2B] hover:bg-[#D9561A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
              >
                <span>Lihat Hasil & Nilai Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 3 Circular Action Buttons (Speaker, End Call, Mic) */}
        <div className="mt-2">
          <ControlBar
            isRecording={isRecording}
            isMuted={isMuted}
            isAiSpeaking={isAiSpeaking || isStreaming}
            onToggleMic={toggleMic}
            onToggleSpeaker={toggleSpeaker}
            onEndInterview={handleEndInterviewEarly}
          />
        </div>
      </footer>
    </div>
  );
}
