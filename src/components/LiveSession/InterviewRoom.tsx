'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  PhoneOff, 
  User, 
  Bot, 
  Sparkles, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Loader2,
  Building2
} from 'lucide-react';
import { CandidateProfile, ChatMessage } from '@/types/interview';
import { AudioVisualizer } from './AudioVisualizer';
import { LiveCountdownTimer } from './LiveCountdownTimer';
import { SpeechEngine } from '@/lib/audio/speechEngine';
import { AudioHardwareManager } from '@/lib/audio/webAudio';

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
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [candidateMicLevel, setCandidateMicLevel] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [sttError, setSttError] = useState<string | null>(null);
  const [lowTimeWarning, setLowTimeWarning] = useState(false);
  const [autoSendCountdown, setAutoSendCountdown] = useState<number | null>(null);
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const audioHardwareRef = useRef<AudioHardwareManager | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const isAiSpeakingRef = useRef(false);
  const isRequestInProgressRef = useRef(false);
  const isInterviewClosedRef = useRef(false);
  const hasInitializedRef = useRef(false);
  const speechBufferRef = useRef('');

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  // Scroll transcript down automatically
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimSpeech]);

  // Start speech recognition listening
  const startSpeechRecognition = useCallback(() => {
    if (micMuted || isAiSpeakingRef.current || isInterviewClosedRef.current) return;

    speechEngineRef.current?.startListening(
      (interim) => {
        if (isInterviewClosedRef.current) return;
        setIsCandidateSpeaking(true);
        setInterimSpeech(interim);
        setSttError(null);

        // Reset silence detection timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
        setAutoSendCountdown(null);
      },
      (final) => {
        if (isInterviewClosedRef.current) return;
        setSttError(null);
        if (!final || final.trim().length === 0) return;

        // Append to current spoken buffer
        const updated = speechBufferRef.current
          ? `${speechBufferRef.current} ${final.trim()}`
          : final.trim();
        speechBufferRef.current = updated;
        setInterimSpeech(updated);
        setIsCandidateSpeaking(true);

        // Setup 2-second silence timer to auto-send
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);

        let countdown = 2;
        setAutoSendCountdown(countdown);

        autoSendIntervalRef.current = setInterval(() => {
          countdown -= 1;
          if (countdown > 0) {
            setAutoSendCountdown(countdown);
          } else {
            if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
          }
        }, 1000);

        silenceTimerRef.current = setTimeout(() => {
          if (isInterviewClosedRef.current) return;
          if (speechBufferRef.current.trim().length > 2) {
            const textToSubmit = speechBufferRef.current.trim();
            speechBufferRef.current = '';
            handleSendUserMessage(textToSubmit);
          }
        }, 2200);
      },
      (error) => {
        if (error === 'not-allowed') {
          setSttError('Izin mikrofon browser ditolak. Mohon aktifkan izin mikrofon.');
        } else if (error !== 'no-speech') {
          console.warn('Speech engine warning:', error);
        }
      }
    );
  }, [micMuted]);

  // Request AI response - Guaranteed SINGLE in-flight call
  const requestAiResponse = useCallback(async (currentHistory: ChatMessage[]) => {
    if (isRequestInProgressRef.current || isInterviewClosedRef.current) {
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
          groqModel
        }),
      });

      const data = await res.json();
      const replyText = data.reply || 'Terima kasih atas jawaban Anda. Mari kita lanjutkan.';
      const isFinished = !!data.isFinished;

      const newAiMessage: ChatMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sender: 'ai',
        text: replyText,
        timestamp: Date.now(),
      };

      const finalHistory = [...currentHistory, newAiMessage];
      setMessages(finalHistory);

      // JIKA WAWANCARA SELESAI / DITUTUP: KUNCI TOTAL DAN TUTUP PANGGILAN
      if (isFinished) {
        isInterviewClosedRef.current = true;
        setIsClosed(true);
        setIsEndingCall(true);
        speechEngineRef.current?.stopListening();

        // Ucapkan salam penutup, lalu transisi langsung ke evaluasi
        try {
          await speechEngineRef.current?.speak(
            replyText,
            () => setIsAiSpeaking(true),
            () => {
              setIsAiSpeaking(false);
              setTimeout(() => {
                onFinishInterview(finalHistory);
              }, 1200);
            }
          );
        } catch {
          setTimeout(() => {
            onFinishInterview(finalHistory);
          }, 1500);
        }
        return;
      }

      // Bicara respon AI via speech synthesis
      await speechEngineRef.current?.speak(
        replyText,
        () => setIsAiSpeaking(true),
        () => {
          setIsAiSpeaking(false);
          // Lanjutkan perekaman mikrofon jika belum ditutup
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
      isRequestInProgressRef.current = false;
    }
  }, [profile, groqApiKey, groqModel, onFinishInterview, startSpeechRecognition]);

  // Submit candidate answer to AI
  const handleSendUserMessage = useCallback((userText: string) => {
    // KUNCI ABSOLUT: Jika wawancara sudah ditutup / sedang diproses / AI berbicara, abaikan!
    if (
      !userText.trim() || 
      isAiSpeakingRef.current || 
      isRequestInProgressRef.current || 
      isInterviewClosedRef.current
    ) {
      return;
    }

    // Bersihkan timer jeda hening
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
    setAutoSendCountdown(null);
    speechBufferRef.current = '';
    setInterimSpeech('');
    setIsCandidateSpeaking(false);
    setTextInput('');

    const newMsg: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMsg];
      setTimeout(() => {
        requestAiResponse(updated);
      }, 0);
      return updated;
    });
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

    // Mulai giliran pertama (sapaan pembuka AI)
    requestAiResponse([]);

    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
      engine.stopListening();
      engine.stopSpeaking();
      hardware.stop();
    };
  }, []);

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
      setAutoSendCountdown(null);
    }
  };

  const handleLowTimeAlert = () => {
    setLowTimeWarning(true);
    speechEngineRef.current?.speak('Perhatian: waktu wawancara tersisa kurang dari 2 menit.');
  };

  const handleManualSendSpoken = () => {
    if (isInterviewClosedRef.current) return;
    const textToSend = speechBufferRef.current || interimSpeech || textInput;
    if (textToSend.trim()) {
      handleSendUserMessage(textToSend.trim());
    }
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Session Header - Warm Navy & Blue Accent */}
      <div className="flex items-center justify-between bg-white border border-[#2F67BB]/20 rounded-2xl px-5 py-3 mb-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-[#EAF2FE] text-[#2F67BB] flex items-center justify-center border border-[#4A8DF0]/30 shadow-sm">
            <Building2 className="w-5 h-5 text-[#2F67BB]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#1B2A41] flex items-center space-x-2">
              <span>{profile.selectedMode === 'hrd' ? 'Sarah (HR Recruiter)' : 'Alex (Senior Tech Lead)'}</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#EAF2FE] text-[#2F67BB] font-semibold border border-[#4A8DF0]/20">
                {profile.targetCompany || 'Perusahaan Target'}
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Posisi: <span className="font-semibold text-[#1B2A41]">{profile.targetRole}</span> • {profile.selectedMode === 'hrd' ? 'Behavioral & STAR' : 'Technical & Architecture'}
            </p>
          </div>
        </div>

        {/* Live Timer & Emergency End Button */}
        <div className="flex items-center space-x-3">
          <LiveCountdownTimer
            onTimeExpired={handleForceEndNow}
            onLowTimeAlert={handleLowTimeAlert}
          />

          <button
            onClick={handleForceEndNow}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold transition-all active:scale-95"
            title="Akhiri wawancara dan lihat hasil"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Selesai Sekarang</span>
          </button>
        </div>
      </div>

      {/* Auto Closing Call Notification Banner */}
      {isClosed && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 mb-4 flex items-center justify-between text-emerald-800 text-xs shadow-md animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-900">Sesi Wawancara Telah Resmi Ditutup</p>
              <p className="text-emerald-700 text-xs">Panggilan dihentikan. Sistem sedang menyiapkan Scorecard dan evaluasi setiap jawaban Anda...</p>
            </div>
          </div>
          <button
            onClick={handleForceEndNow}
            className="px-4 py-2 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5"
          >
            <span>Buka Scorecard</span>
          </button>
        </div>
      )}

      {/* STT Error Banner */}
      {sttError && !isClosed && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 flex items-center justify-between text-rose-700 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{sttError}</span>
          </div>
          <button
            onClick={startSpeechRecognition}
            className="px-2.5 py-1 rounded-lg bg-rose-200 text-rose-800 font-medium hover:bg-rose-300 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Low Time Alert Banner */}
      {lowTimeWarning && !isClosed && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-center justify-between text-amber-800 text-xs animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Waktu tersisa kurang dari 2 menit. Sesi akan otomatis berakhir dan dievaluasi di 00:00.</span>
          </div>
          <button onClick={() => setLowTimeWarning(false)} className="text-amber-700 hover:text-amber-900 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Visualizer & Live Conversation */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Left Column: Audio Waveform Visualizer & Live Voice Subtitle */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <AudioVisualizer
            isAiSpeaking={isAiSpeaking}
            isCandidateSpeaking={isCandidateSpeaking}
            candidateMicLevel={candidateMicLevel}
            mode={profile.selectedMode}
          />

          {/* Active Speech Buffer / Live Subtitle Box */}
          <div className="bg-white border border-[#2F67BB]/15 rounded-2xl p-4 text-xs space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#1B2A41] flex items-center space-x-1.5">
                <Mic className={`w-3.5 h-3.5 ${isCandidateSpeaking || candidateMicLevel > 10 ? 'text-emerald-600 animate-pulse' : 'text-[#4A8DF0]'}`} />
                <span>Input Suara Langsung Anda:</span>
              </span>
              {autoSendCountdown !== null && !isClosed && (
                <span className="text-[10px] text-[#F26A2B] font-mono font-bold animate-pulse">
                  Mengirim dalam {autoSendCountdown}s...
                </span>
              )}
            </div>

            <div className="min-h-[52px] bg-[#EAF2FE]/60 rounded-xl p-3 border border-[#4A8DF0]/20 text-[#1B2A41] text-xs leading-relaxed">
              {isClosed ? (
                <p className="text-slate-500 italic">Sesi telah selesai. Tidak menerima input suara lagi.</p>
              ) : interimSpeech || speechBufferRef.current ? (
                <p className="text-emerald-800 font-medium">
                  {interimSpeech || speechBufferRef.current}
                </p>
              ) : isAiSpeaking ? (
                <p className="text-slate-500 italic">Mendengarkan pewawancara AI berbicara...</p>
              ) : (
                <p className="text-slate-500 italic">Silakan mulai berbicara langsung ke mikrofon Anda...</p>
              )}
            </div>

            {/* Instant Send Voice Answer Button */}
            {(interimSpeech || speechBufferRef.current) && !isClosed && (
              <button
                onClick={handleManualSendSpoken}
                disabled={isInputLocked}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.99] disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai Bicara & Kirim Jawaban Sekarang</span>
              </button>
            )}
          </div>

          {/* Mic Control Bar */}
          <div className="bg-white border border-[#2F67BB]/15 rounded-2xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={toggleMic}
                disabled={isClosed}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  isClosed
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : micMuted
                    ? 'bg-rose-100 text-rose-600 border border-rose-300 hover:bg-rose-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-200'
                }`}
              >
                {micMuted || isClosed ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <p className="font-bold text-[#1B2A41]">
                  {isClosed
                    ? 'Mikrofon Ditutup'
                    : micMuted
                    ? 'Mikrofon Dijeda (Muted)'
                    : 'Mikrofon Aktif Mendengarkan'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isClosed
                    ? 'Wawancara telah berakhir'
                    : micMuted
                    ? 'Klik ikon untuk menyalakan mic'
                    : 'Bicara santai, AI mendeteksi otomatis'}
                </p>
              </div>
            </div>

            {!isClosed && (
              <button
                onClick={() => {
                  speechEngineRef.current?.stopListening();
                  setTimeout(() => startSpeechRecognition(), 200);
                }}
                title="Mulai Ulang STT"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Conversation Transcript Feed */}
        <div className="lg:col-span-7 flex flex-col bg-white border border-[#2F67BB]/20 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-[#2F67BB]/15 flex items-center justify-between bg-[#EAF2FE]/40">
            <span className="text-xs font-bold text-[#1B2A41] flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-[#4A8DF0]" />
              <span>Transkrip Percakapan Real-Time</span>
            </span>
            <span className="text-[10px] font-semibold text-[#2F67BB] bg-white px-2 py-0.5 rounded-full border border-[#4A8DF0]/20">
              {messages.length} pesan bertukar
            </span>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-[#EAF2FE] text-[#2F67BB] border border-[#4A8DF0]/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-[#4A8DF0] text-white rounded-br-none'
                      : 'bg-white text-[#1B2A41] border border-[#2F67BB]/15 rounded-bl-none'
                  }`}
                >
                  <p className="font-bold text-[10px] mb-1 opacity-80 uppercase tracking-wide">
                    {msg.sender === 'user' ? profile.name : profile.selectedMode === 'hrd' ? 'Sarah (HRD)' : 'Alex (Tech Lead)'}
                  </p>
                  <p>{msg.text}</p>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F26A2B] border border-[#F26A2B]/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Interim live speech recognition text */}
            {interimSpeech && !isClosed && (
              <div className="flex justify-end space-x-2.5">
                <div className="max-w-[82%] rounded-2xl rounded-br-none px-4 py-3 text-xs leading-relaxed bg-[#EAF2FE] border border-[#4A8DF0] text-[#1B2A41] italic animate-pulse">
                  <span className="text-[10px] font-bold block text-[#2F67BB]">Merekam ucapan Anda...</span>
                  <p>{interimSpeech}</p>
                </div>
              </div>
            )}

            <div ref={transcriptEndRef} />
          </div>

          {/* Text input / Locked State */}
          <div className="p-3 border-t border-[#2F67BB]/15 bg-white">
            {isClosed ? (
              <div className="w-full py-3 px-4 rounded-xl bg-[#EAF2FE] border border-[#4A8DF0]/40 text-center text-xs font-semibold text-[#1B2A41] flex items-center justify-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sesi wawancara telah ditutup. Silakan klik &quot;Buka Scorecard&quot; untuk melihat nilai evaluasi.</span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isInputLocked) {
                    handleSendUserMessage(textInput);
                  }
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  disabled={isInputLocked}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    isAiSpeaking
                      ? 'Tunggu pewawancara selesai berbicara...'
                      : 'Ketik jawaban alternatif (opsional jika mic bising)...'
                  }
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white disabled:opacity-60 transition-all"
                />
                <button
                  type="submit"
                  disabled={isInputLocked || !textInput.trim()}
                  className="p-2.5 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white disabled:opacity-40 transition-all shadow-sm active:scale-95"
                  title="Kirim jawaban"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
