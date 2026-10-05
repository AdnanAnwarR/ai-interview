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
  RefreshCw
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

  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const audioHardwareRef = useRef<AudioHardwareManager | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isAiSpeakingRef = useRef(false);
  const speechBufferRef = useRef('');

  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  // Scroll transcript down automatically
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimSpeech]);

  // Submit candidate answer to AI
  const handleSendUserMessage = useCallback((userText: string) => {
    if (!userText.trim() || isAiSpeakingRef.current) return;

    // Clear any timers
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
    setAutoSendCountdown(null);
    speechBufferRef.current = '';
    setInterimSpeech('');
    setIsCandidateSpeaking(false);

    const newMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => {
      const updated = [...prev, newMsg];
      requestAiResponse(updated);
      return updated;
    });

    setTextInput('');
  }, []);

  // Start speech recognition listening
  const startSpeechRecognition = useCallback(() => {
    if (micMuted || isAiSpeakingRef.current) return;

    speechEngineRef.current?.startListening(
      (interim) => {
        setIsCandidateSpeaking(true);
        setInterimSpeech(interim);
        setSttError(null);

        // Reset silence detection timer
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (autoSendIntervalRef.current) clearInterval(autoSendIntervalRef.current);
        setAutoSendCountdown(null);
      },
      (final) => {
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
          if (speechBufferRef.current.trim().length > 2) {
            handleSendUserMessage(speechBufferRef.current.trim());
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
  }, [micMuted, handleSendUserMessage]);

  // Request AI response
  const requestAiResponse = useCallback(async (currentHistory: ChatMessage[]) => {
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

      const newAiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: replyText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, newAiMessage]);

      // Speak AI response with voice synthesis
      await speechEngineRef.current?.speak(
        replyText,
        () => setIsAiSpeaking(true),
        () => {
          setIsAiSpeaking(false);
          // Resume speech recognition automatically
          setTimeout(() => {
            startSpeechRecognition();
          }, 400);
        }
      );
    } catch (err) {
      console.error('Failed to get AI response:', err);
      setIsAiSpeaking(false);
      startSpeechRecognition();
    }
  }, [profile, startSpeechRecognition]);

  // Initialize Speech Engine & Hardware volume monitoring on mount
  useEffect(() => {
    const engine = new SpeechEngine();
    speechEngineRef.current = engine;

    const hardware = new AudioHardwareManager();
    audioHardwareRef.current = hardware;

    hardware.requestMicrophone((volume) => {
      setCandidateMicLevel(volume);
    });

    // Start initial turn with greeting
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
    const textToSend = speechBufferRef.current || interimSpeech || textInput;
    if (textToSend.trim()) {
      handleSendUserMessage(textToSend.trim());
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Session Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl px-5 py-3 mb-4 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>{profile.selectedMode === 'hrd' ? 'Sarah (HR Recruiter)' : 'Alex (Senior Tech Lead)'}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                {profile.targetRole}
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              {profile.selectedMode === 'hrd' ? 'Behavioral & STAR Interview' : 'Technical & Architecture Interview'}
            </p>
          </div>
        </div>

        {/* Live Timer */}
        <div className="flex items-center space-x-3">
          <LiveCountdownTimer
            onTimeExpired={() => onFinishInterview(messages)}
            onLowTimeAlert={handleLowTimeAlert}
          />

          <button
            onClick={() => onFinishInterview(messages)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Selesai Sekarang</span>
          </button>
        </div>
      </div>

      {/* STT Error Banner */}
      {sttError && (
        <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 mb-4 flex items-center justify-between text-rose-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{sttError}</span>
          </div>
          <button
            onClick={startSpeechRecognition}
            className="px-2.5 py-1 rounded-lg bg-rose-600/30 text-white font-medium hover:bg-rose-600/50 flex items-center space-x-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Low Time Alert Banner */}
      {lowTimeWarning && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4 flex items-center justify-between text-amber-300 text-xs animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Waktu tersisa kurang dari 2 menit. Sesi akan otomatis berakhir dan dievaluasi tepat di 00:00.</span>
          </div>
          <button onClick={() => setLowTimeWarning(false)} className="text-amber-400 hover:text-white font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Main Grid: Visualizer & Live Conversation */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
        
        {/* Left Column: Audio Waveform Visualizer & Status */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <AudioVisualizer
            isAiSpeaking={isAiSpeaking}
            isCandidateSpeaking={isCandidateSpeaking}
            candidateMicLevel={candidateMicLevel}
            mode={profile.selectedMode}
          />

          {/* Active Speech Buffer / Live Subtitle Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5">
                <Mic className={`w-3.5 h-3.5 ${isCandidateSpeaking || candidateMicLevel > 10 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span>Input Suara Langsung Anda:</span>
              </span>
              {autoSendCountdown !== null && (
                <span className="text-[10px] text-amber-400 font-mono font-bold animate-pulse">
                  Mengirim dalam {autoSendCountdown}s...
                </span>
              )}
            </div>

            <div className="min-h-[48px] bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 text-slate-200 text-xs leading-relaxed">
              {interimSpeech || speechBufferRef.current ? (
                <p className="text-emerald-300 font-medium">
                  {interimSpeech || speechBufferRef.current}
                </p>
              ) : isAiSpeaking ? (
                <p className="text-slate-500 italic">Mendengarkan giliran bicara pewawancara AI...</p>
              ) : (
                <p className="text-slate-500 italic">Silakan mulai berbicara langsung ke mikrofon...</p>
              )}
            </div>

            {/* Instant Send Voice Answer Button */}
            {(interimSpeech || speechBufferRef.current) && (
              <button
                onClick={handleManualSendSpoken}
                disabled={isAiSpeaking}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Selesai Bicara & Kirim Jawaban Sekarang</span>
              </button>
            )}
          </div>

          {/* Quick Mic Control Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  micMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
                }`}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <p className="font-semibold text-white">
                  {micMuted ? 'Mikrofon Dijeda (Muted)' : 'Mikrofon Aktif Mendengarkan'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {micMuted ? 'Klik untuk mengaktifkan kembali' : 'Bicara santai, sistem akan mendeteksi otomatis'}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                speechEngineRef.current?.stopListening();
                setTimeout(() => startSpeechRecognition(), 200);
              }}
              title="Mulai Ulang STT"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Conversation Transcript Feed */}
        <div className="lg:col-span-7 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <span className="text-xs font-semibold text-slate-300 flex items-center space-x-2">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Transkrip Percakapan Real-Time</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {messages.length} pesan bertukar
            </span>
          </div>

          {/* Transcript Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-none'
                  }`}
                >
                  <p className="font-semibold text-[10px] mb-1 opacity-70">
                    {msg.sender === 'user' ? profile.name : profile.selectedMode === 'hrd' ? 'Sarah (HRD)' : 'Alex (Tech Lead)'}
                  </p>
                  <p>{msg.text}</p>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            <div ref={transcriptEndRef} />
          </div>

          {/* Text input fallback / quick submit */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/60">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendUserMessage(textInput);
              }}
              className="flex items-center space-x-2"
            >
              <input
                type="text"
                disabled={isAiSpeaking}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isAiSpeaking ? 'Tunggu AI selesai berbicara...' : 'Ketik jawaban alternatif (opsional jika mic bising)...'}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isAiSpeaking || !textInput.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
