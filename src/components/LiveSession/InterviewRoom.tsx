'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { CandidateProfile, ChatMessage } from '@/types/interview';
import { LiveCountdownTimer } from './LiveCountdownTimer';
import { SpeechEngine } from '@/lib/audio/speechEngine';
import { AudioHardwareManager } from '@/lib/audio/webAudio';
import { AiInterviewerAvatar } from '@/components/interview/AiInterviewerAvatar';
import { SelfView } from '@/components/interview/SelfView';
import { ChatSubtitle } from '@/components/interview/ChatSubtitle';
import { ControlBar } from '@/components/interview/ControlBar';

interface InterviewRoomProps {
  profile: CandidateProfile;
  groqApiKey?: string;
  groqModel?: string;
  onFinishInterview: (messages: ChatMessage[]) => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  profile,
  groqApiKey,
  groqModel,
  onFinishInterview,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [, setIsCandidateSpeaking] = useState(false);
  const [, setCandidateMicLevel] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);
  const [, setLowTimeWarning] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const audioHardwareRef = useRef<AudioHardwareManager | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isAiSpeakingRef = useRef(false);
  const isRequestInProgressRef = useRef(false);
  const isInterviewClosedRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const speechBufferRef = useRef('');
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  // Start speech recognition listening
  const startSpeechRecognition = useCallback(() => {
    if (micMuted || isAiSpeakingRef.current || isInterviewClosedRef.current) return;

    speechEngineRef.current?.startListening(
      (interim) => {
        if (isInterviewClosedRef.current) return;
        setIsCandidateSpeaking(true);
        setInterimSpeech(interim);
        setTextInput(interim);
        setSttError(null);

        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
      },
      (final) => {
        if (isInterviewClosedRef.current) return;
        setSttError(null);
        if (!final || final.trim().length === 0) return;

        const updated = speechBufferRef.current
          ? `${speechBufferRef.current} ${final.trim()}`
          : final.trim();
        speechBufferRef.current = updated;
        setInterimSpeech('');
        setTextInput(updated);
      },
      (err) => {
        console.warn('SpeechRecognition error:', err);
        setIsCandidateSpeaking(false);
        if (err !== 'no-speech' && !isInterviewClosedRef.current) {
          setSttError('Gagal mendeteksi mikrofon. Silakan gunakan keyboard jika mic bising.');
        }
      }
    );
  }, [micMuted]);

  // Request AI Turn response from API
  const requestAiResponse = useCallback(async (currentHistory: ChatMessage[]) => {
    if (isInterviewClosedRef.current) return;

    const previousMsg = currentHistory[currentHistory.length - 1];
    if (currentHistory.length > 0 && previousMsg?.sender === 'ai') {
      return;
    }

    isRequestInProgressRef.current = true;
    setIsAiSpeaking(true);
    speechEngineRef.current?.stopListening();

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profile, 
          messages: currentHistory,
          groqApiKey,
          groqModel: groqModel || 'llama-3.3-70b-versatile'
        }),
      });

      const data = await res.json().catch(() => ({}));
      let replyText = data.reply;
      const isFinished = !!data.isFinished;

      // Smart dynamic fallback jika API mengembalikan respons kosong
      if (!replyText || typeof replyText !== 'string' || replyText.trim().length === 0) {
        const isHrd = profile.selectedMode === 'hrd';
        const userTurn = currentHistory.filter((m) => m.sender === 'user').length;
        if (isHrd) {
          const hrdFallbacks = [
            `Halo ${profile.name}! Senang sekali bisa bertemu dengan Anda untuk posisi ${profile.targetRole} di ${profile.targetCompany || 'perusahaan kami'}. Boleh ceritakan sedikit tentang diri Anda dan apa yang membuat Anda tertarik dengan posisi ini?`,
            `Terima kasih atas ceritanya. Dalam pengalaman perkuliahan atau magang Anda, bisa ceritakan salah satu situasi saat Anda menghadapi perbedaan pendapat dalam tim dan bagaimana Anda menyelesaikannya?`,
            `Pendekatan yang sangat dewasa. Boleh ceritakan tentang tantangan terbesar yang pernah Anda lalui, serta pelajaran apa yang Anda dapatkan?`,
            `Menarik sekali. Jika dihadapkan pada beberapa deadline mendesak sekaligus di ${profile.targetCompany || 'perusahaan'}, bagaimana strategi Anda memprioritaskannya?`,
            `Bagus sekali penjelasannya. Dari sisi visi karier, apa target profesional yang ingin Anda capai dalam 2 hingga 3 tahun ke depan bersama kami?`,
            `Terima kasih atas pemaparan yang komprehensif. Sebelum sesi kita akhiri, adakah pertanyaan yang ingin Anda tanyakan seputar tim atau budaya kerja di sini?`,
          ];
          replyText = hrdFallbacks[Math.min(userTurn, hrdFallbacks.length - 1)];
        } else {
          const techFallbacks = [
            `Halo ${profile.name}, selamat datang di sesi Technical Interview untuk posisi ${profile.targetRole} di ${profile.targetCompany || 'perusahaan kami'}. Untuk pemanasan, bisa ceritakan arsitektur proyek atau aplikasi paling menantang yang pernah Anda kembangkan?`,
            `Terima kasih atas penjelasannya. Ketika sistem tersebut mulai menangani lonjakan traffic dan data yang besar, bagaimana strategi Anda dalam optimasi performa, caching, serta menangani error handling?`,
            `Pendekatan yang solid. Bagaimana Anda mengelola testing, code review, dan automated workflow untuk memastikan fitur yang Anda kembangkan tetap stabil?`,
            `Bisa berikan contoh konkret saat Anda harus memilih trade-off teknis antara kecepatan delivery fitur versus technical debt atau clean architecture? Apa keputusan yang Anda ambil?`,
            `Bagus sekali penjelasannya. Jika terjadi insiden kritis di mana API utama mengalami latency tinggi di server production, langkah debugging sistematis apa yang pertama kali Anda lakukan?`,
            `Terima kasih atas penjelasan teknis yang komprehensif. Apakah ada aspek arsitektur atau teknologi terkini yang ingin Anda tanyakan seputar engineering di ${profile.targetCompany || 'perusahaan'}?`,
          ];
          replyText = techFallbacks[Math.min(userTurn, techFallbacks.length - 1)];
        }
      }

      const newAiMessage: ChatMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: 'ai',
        text: replyText,
        timestamp: Date.now(),
      };

      // DEDUPLIKASI KETAT
      let finalHistory = currentHistory;
      const lastItem = currentHistory[currentHistory.length - 1];
      if (!lastItem || lastItem.sender !== 'ai' || lastItem.text !== replyText) {
        finalHistory = [...currentHistory, newAiMessage];
        setMessages(finalHistory);
        messagesRef.current = finalHistory;
      }

      // JIKA WAWANCARA SELESAI / DITUTUP
      if (isFinished) {
        isInterviewClosedRef.current = true;
        setIsClosed(true);
        setIsEndingCall(true);
        speechEngineRef.current?.stopListening();

        let finishExecuted = false;
        const triggerFinalTransition = () => {
          if (finishExecuted) return;
          finishExecuted = true;
          speechEngineRef.current?.stopSpeaking();
          speechEngineRef.current?.stopListening();
          setIsAiSpeaking(false);
          onFinishInterview(finalHistory);
        };

        const fallbackFinishTimer = setTimeout(() => {
          triggerFinalTransition();
        }, Math.min(5000, Math.max(2500, replyText.length * 70)));

        try {
          await speechEngineRef.current?.speak(
            replyText,
            () => setIsAiSpeaking(true),
            () => {
              clearTimeout(fallbackFinishTimer);
              setTimeout(() => {
                triggerFinalTransition();
              }, 800);
            }
          );
        } catch {
          clearTimeout(fallbackFinishTimer);
          triggerFinalTransition();
        }
        return;
      }

      // Bicara respon AI via speech synthesis jika belum selesai
      await speechEngineRef.current?.speak(
        replyText,
        () => setIsAiSpeaking(true),
        () => {
          setIsAiSpeaking(false);
          if (!isInterviewClosedRef.current) {
            setTimeout(() => {
              startSpeechRecognition();
            }, 400);
          }
        }
      );
    } catch (err) {
      console.error('Failed to get AI response:', err);
      setIsAiSpeaking(false);
      if (!isInterviewClosedRef.current) {
        startSpeechRecognition();
      }
    } finally {
      if (!isInterviewClosedRef.current) {
        isRequestInProgressRef.current = false;
      }
    }
  }, [profile, groqApiKey, groqModel, onFinishInterview, startSpeechRecognition]);

  // Submit candidate answer to AI
  const handleSendUserMessage = useCallback((userText: string) => {
    const trimmed = userText.trim();
    if (
      !trimmed || 
      isAiSpeakingRef.current || 
      isRequestInProgressRef.current || 
      isInterviewClosedRef.current
    ) {
      return;
    }

    isRequestInProgressRef.current = true;
    speechEngineRef.current?.stopListening();

    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
    speechBufferRef.current = '';
    setInterimSpeech('');
    setIsCandidateSpeaking(false);
    setTextInput('');

    const newMsg: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now(),
    };

    const currentList = messagesRef.current;
    const lastMsg = currentList[currentList.length - 1];
    if (lastMsg && lastMsg.sender === 'user' && lastMsg.text === trimmed) {
      isRequestInProgressRef.current = false;
      return;
    }

    const updated = [...currentList, newMsg];
    messagesRef.current = updated;
    setMessages(updated);

    requestAiResponse(updated);
  }, [requestAiResponse]);

  // Initialize Speech Engine & Hardware volume monitoring on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const engine = new SpeechEngine();
    speechEngineRef.current = engine;

    const hardware = new AudioHardwareManager();
    audioHardwareRef.current = hardware;

    hardware.requestMicrophone((volume) => {
      setCandidateMicLevel(volume);
    });

    requestAiResponse([]);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
      engine.stopListening();
      engine.stopSpeaking();
      hardware.stop();
    };
  }, [requestAiResponse]);

  const toggleMic = () => {
    if (isInterviewClosedRef.current) return;
    if (micMuted) {
      setMicMuted(false);
      startSpeechRecognition();
    } else {
      setMicMuted(true);
      speechEngineRef.current?.stopListening();
      setIsCandidateSpeaking(false);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
    }
  };

  const toggleSpeaker = () => {
    if (!isMuted) {
      speechEngineRef.current?.stopSpeaking();
    }
    setIsMuted(!isMuted);
  };

  const handleLowTimeAlert = () => {
    setLowTimeWarning(true);
    speechEngineRef.current?.speak('Perhatian: waktu wawancara tersisa kurang dari 2 menit.');
  };

  const handleForceEndNow = () => {
    isInterviewClosedRef.current = true;
    setIsClosed(true);
    setIsEndingCall(true);
    speechEngineRef.current?.stopListening();
    speechEngineRef.current?.stopSpeaking();
    onFinishInterview(messages);
  };

  const isInputLocked = isAiSpeaking || isEndingCall || isClosed;

  // Pertanyaan AI terbaru
  const lastAiMessage = [...messages].reverse().find((m) => m.sender === 'ai');
  const currentSubtitle = lastAiMessage?.text || 'Halo, terima kasih sudah datang. Boleh perkenalkan dirimu secara singkat?';
  const aiQuestionCount = messages.filter((m) => m.sender === 'ai').length || 1;

  const displayCompany = profile.targetCompany || 'Perusahaan';
  const displayRole = profile.targetRole || 'Posisi';

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] bg-[#0E1624] text-white flex flex-col justify-between overflow-hidden">
      {/* 1. Header Bar: Info Sesi & Timer */}
      <header className="w-full px-6 py-4 sm:px-10 sm:py-5 flex items-start justify-between z-10">
        <div>
          <h1 className="text-white font-bold text-lg sm:text-2xl tracking-tight">
            {displayCompany} · {displayRole}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-normal mt-0.5">
            Pertanyaan {Math.min(aiQuestionCount, 8)} dari 8
          </p>
        </div>

        <div>
          <LiveCountdownTimer
            minimal={true}
            onTimeExpired={handleForceEndNow}
            onLowTimeAlert={handleLowTimeAlert}
          />
        </div>
      </header>

      {/* 2. Floating AI Interviewer Card (Top-Right) */}
      <div className="absolute top-16 right-4 sm:top-20 sm:right-8 z-20">
        <AiInterviewerAvatar
          isSpeaking={isAiSpeaking}
          interviewerName="Pewawancara AI"
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
        {/* Error banner jika ada */}
        {sttError && !isClosed && (
          <div className="w-full max-w-5xl mx-auto px-4 mb-3">
            <div className="px-4 py-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{sttError}</span>
              </div>
              <button
                type="button"
                onClick={startSpeechRecognition}
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
          isStreaming={false}
          isAiTyping={isAiSpeaking && !lastAiMessage}
        />

        {/* Input Bar Jawaban */}
        {!isClosed ? (
          <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-3 sm:mt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!isInputLocked && textInput.trim()) {
                  handleSendUserMessage(textInput);
                }
              }}
              className="flex items-center gap-3 bg-[#152033] border border-slate-800 rounded-2xl p-2 sm:p-2.5 shadow-2xl focus-within:border-slate-600 transition-colors"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={isInputLocked}
                placeholder="Ketik jawabanmu, atau bicara lewat mikrofon"
                className="flex-1 bg-transparent px-4 py-2 sm:py-3 text-base sm:text-lg text-white placeholder:text-slate-500 focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={isInputLocked || !textInput.trim()}
                className="bg-[#F26A2B] hover:bg-[#D9561A] active:scale-95 text-white font-semibold text-base sm:text-lg px-7 py-2.5 sm:py-3 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kirim
              </button>
            </form>
          </div>
        ) : (
          <div className="w-full max-w-md mx-auto mt-3 px-4">
            <div className="py-3 px-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center animate-in zoom-in-95">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4" />
                Wawancara Telah Resmi Ditutup
              </div>
              <button
                type="button"
                onClick={handleForceEndNow}
                className="w-full py-2.5 rounded-xl bg-[#F26A2B] hover:bg-[#D9561A] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
              >
                <span>Buka Scorecard & Nilai</span>
              </button>
            </div>
          </div>
        )}

        {/* 3 Circular Action Buttons (Speaker, End Call, Mic) */}
        <div className="mt-2">
          <ControlBar
            isRecording={!micMuted && !!interimSpeech}
            isMuted={isMuted}
            isAiSpeaking={isAiSpeaking}
            onToggleMic={toggleMic}
            onToggleSpeaker={toggleSpeaker}
            onEndInterview={handleForceEndNow}
          />
        </div>
      </footer>
    </div>
  );
};
