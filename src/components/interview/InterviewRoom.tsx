'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AiInterviewerAvatar } from './AiInterviewerAvatar';
import { ChatSubtitle } from './ChatSubtitle';
import { SelfView } from './SelfView';
import { ControlBar } from './ControlBar';
import { InterviewConfig, InterviewMessage } from '@/types/wawancara';
import { 
  Clock, 
  Send, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  CheckCircle2, 
  ArrowRight,
  Edit3
} from 'lucide-react';

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

  // State percakapan & kontrol
  const [messages, setMessages] = useState<InterviewMessage[]>(initialMessages);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // State teks jawaban & transkrip
  const [textInput, setTextInput] = useState('');
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [isEditingSpoken, setIsEditingSpoken] = useState(false);

  // Timer panggilan (detik berjalan)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Subtitle aktif (pesan AI terakhir yang sedang/telah dibaca)
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');

  // Refs untuk audio speech & recognition
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastFailedAnswerRef = useRef<string>('');

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
  const speakText = useCallback(
    (text: string) => {
      if (isMuted || !synthRef.current) return;

      try {
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsAiSpeaking(true);
        };
        utterance.onend = () => {
          setIsAiSpeaking(false);
        };
        utterance.onerror = () => {
          setIsAiSpeaking(false);
        };

        currentUtteranceRef.current = utterance;
        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn('SpeechSynthesis error:', err);
        setIsAiSpeaking(false);
      }
    },
    [isMuted]
  );

  // Set subtitle awal dari pesan pembuka
  useEffect(() => {
    if (initialMessages.length > 0) {
      const lastAiMsg = [...initialMessages].reverse().find((m) => m.sender === 'ai');
      if (lastAiMsg) {
        setCurrentSubtitle(lastAiMsg.text);
        speakText(lastAiMsg.text);
      }
    }
  }, [initialMessages, speakText]);

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
        setSpokenTranscript(combined);
      };

      rec.onerror = (err) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
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
    }
  };

  const stopListening = () => {
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

  // Kirim jawaban pengguna ke API dengan Streaming
  const handleSendAnswer = async (answerToSend?: string) => {
    const answer = (answerToSend || spokenTranscript || textInput).trim();
    if (!answer || isStreaming || isAiTyping) return;

    lastFailedAnswerRef.current = answer;
    setConnectionError(null);

    // Hentikan perekam jika masih aktif
    if (isRecording) {
      stopListening();
    }

    // Tambahkan jawaban user ke transkrip layar
    const userMsg: InterviewMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: answer,
      timestamp: Date.now(),
      questionIndex: currentQuestionIndex,
    };
    setMessages((prev) => [...prev, userMsg]);
    setTextInput('');
    setSpokenTranscript('');
    setIsEditingSpoken(false);

    // Status pewawancara sedang merumuskan jawaban
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
      const nextQIndex = Number(response.headers.get('X-Question-Index')) || currentQuestionIndex;
      setCurrentQuestionIndex(nextQIndex);
      if (isFin) {
        setIsFinished(true);
      }

      // Baca stream respons teks
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Streaming stream reader tidak tersedia.');
      }

      const decoder = new TextDecoder();
      let accumulatedAiText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedAiText += chunk;
        setCurrentSubtitle(accumulatedAiText);
      }

      setIsStreaming(false);

      // Simpan pesan AI ke list
      const aiMsg: InterviewMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: accumulatedAiText,
        timestamp: Date.now(),
        questionIndex: nextQIndex,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Bacakan pertanyaan dengan audio
      speakText(accumulatedAiText);
    } catch (err: unknown) {
      setIsAiTyping(false);
      setIsStreaming(false);
      const message = err instanceof Error ? err.message : 'Koneksi terputus saat streaming.';
      setConnectionError(message);
    }
  };

  // Akhiri wawancara lebih awal secara manual
  const handleEndInterviewEarly = () => {
    if (synthRef.current) synthRef.current.cancel();
    if (recognitionRef.current) recognitionRef.current.abort();
    router.push(`/interview/${interviewId}/result`);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col justify-between bg-gradient-to-b from-[#1B2A41] to-[#0f172a] text-white">
      {/* Top Bar: Informasi Sesi & Timer */}
      <div className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{config.companyName}</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#2F67BB] text-[#EAF2FE] font-medium hidden sm:inline">
                {config.targetRole}
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              Pewawancara: Sarah (HRD) • Mode {config.interviewerStyle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge Pertanyaan X dari Y */}
          <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs sm:text-sm font-semibold text-[#FFC857]">
            Pertanyaan {Math.min(currentQuestionIndex, totalQuestions)} dari {totalQuestions}
          </div>

          {/* Timer Wawancara */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 text-xs sm:text-sm font-mono text-slate-200">
            <Clock className="w-4 h-4 text-[#4A8DF0]" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Tombol Mute / Suara AI */}
          <button
            type="button"
            onClick={() => {
              if (!isMuted && synthRef.current) synthRef.current.cancel();
              setIsMuted(!isMuted);
            }}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isMuted ? 'Nyalakan suara pewawancara' : 'Bisukan suara pewawancara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Video Call Stage */}
      <div className="relative flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col justify-center items-center">
        {/* Pratinjau Kamera Lokal (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 z-20">
          <SelfView
            isCameraOn={isCameraOn}
            onToggleCamera={() => setIsCameraOn(!isCameraOn)}
          />
        </div>

        {/* Avatar Pewawancara AI di tengah area besar */}
        <div className="w-full flex flex-col items-center justify-center my-auto py-4">
          <AiInterviewerAvatar
            isSpeaking={isAiSpeaking || isStreaming}
            interviewerName="Sarah (HRD Rekruter)"
            style={config.interviewerStyle}
          />
        </div>

        {/* Subtitle Pewawancara Streaming */}
        <div className="w-full z-10">
          <ChatSubtitle
            subtitleText={currentSubtitle}
            isStreaming={isStreaming}
            isAiTyping={isAiTyping}
          />
        </div>

        {/* Penanganan Koneksi Putus / Coba Lagi */}
        {connectionError && (
          <div className="w-full max-w-xl mx-auto mt-2 px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-sm flex items-center justify-between">
            <span>{connectionError}</span>
            <button
              type="button"
              onClick={() => handleSendAnswer(lastFailedAnswerRef.current)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Coba lagi
            </button>
          </div>
        )}

        {/* Box Transkrip Suara (Bisa Diedit Sebelum Dikirim) */}
        {spokenTranscript && (
          <div className="w-full max-w-2xl mx-auto mt-3 px-4 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-[#4A8DF0]/30 text-white">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-[#FFC857] flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5" />
                Transkrip Suara Anda (Dapat diedit sebelum dikirim)
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSpoken(!isEditingSpoken)}
                className="text-xs text-[#4A8DF0] hover:underline"
              >
                {isEditingSpoken ? 'Selesai Edit' : 'Edit Teks'}
              </button>
            </div>

            {isEditingSpoken ? (
              <textarea
                value={spokenTranscript}
                onChange={(e) => setSpokenTranscript(e.target.value)}
                className="w-full bg-black/40 text-white text-sm p-2 rounded-lg border border-white/20 focus:outline-hidden focus:border-[#4A8DF0] resize-none"
                rows={3}
              />
            ) : (
              <p className="text-sm text-slate-100 italic bg-black/20 p-2.5 rounded-lg border border-white/10">
                &ldquo;{spokenTranscript}&rdquo;
              </p>
            )}

            <div className="mt-2.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSpokenTranscript('')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/10"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => handleSendAnswer(spokenTranscript)}
                disabled={isAiTyping || isStreaming}
                className="px-4 py-1.5 rounded-lg bg-[#F26A2B] hover:bg-[#d95316] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F26A2B]/20 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim Jawaban Suara
              </button>
            </div>
          </div>
        )}

        {/* Input Jawaban Mode Ketik (Jika bukan mode suara atau fallback) */}
        {(!speechSupported || config.answerMode === 'ketik' || !spokenTranscript) && !isFinished && (
          <div className="w-full max-w-2xl mx-auto mt-3 px-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAnswer();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isAiTyping || isStreaming}
                placeholder={
                  speechSupported
                    ? 'Ketik jawaban Anda atau tekan tombol mikrofon di bawah...'
                    : 'Ketik jawaban Anda di sini...'
                }
                className="w-full bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm sm:text-base rounded-2xl pl-4 pr-12 py-3.5 focus:outline-hidden focus:border-[#4A8DF0] focus:ring-2 focus:ring-[#4A8DF0]/20 transition-all"
              />
              <button
                type="submit"
                disabled={!textInput.trim() || isAiTyping || isStreaming}
                className="absolute right-2.5 p-2 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Kirim jawaban"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Tombol Lihat Hasil Saat Wawancara Selesai */}
        {isFinished && (
          <div className="w-full max-w-md mx-auto mt-4 px-4 py-4 rounded-2xl bg-[#2F67BB]/30 border border-[#4A8DF0]/40 text-center animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-base mb-1">
              <CheckCircle2 className="w-5 h-5" />
              Wawancara Telah Selesai
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Seluruh jawaban Anda telah direkam dan dianalisis secara objektif.
            </p>
            <button
              type="button"
              onClick={() => router.push(`/interview/${interviewId}/result`)}
              className="w-full py-3 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-[#F26A2B]/30 transition-transform active:scale-98"
            >
              <span>Lihat Hasil & Nilai Evaluasi</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Control Bar: 3 Tombol Bulat di Tengah */}
      <div className="w-full border-t border-white/10 bg-black/40 backdrop-blur-md">
        <ControlBar
          isRecording={isRecording}
          isCameraOn={isCameraOn}
          isAiSpeaking={isAiSpeaking || isStreaming}
          onToggleMic={toggleMic}
          onToggleCamera={() => setIsCameraOn(!isCameraOn)}
          onEndInterview={handleEndInterviewEarly}
        />
      </div>
    </div>
  );
}
