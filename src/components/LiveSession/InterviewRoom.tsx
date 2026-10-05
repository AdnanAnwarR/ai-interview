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
  AlertCircle
} from 'lucide-react';
import { CandidateProfile, ChatMessage } from '@/types/interview';
import { AudioVisualizer } from './AudioVisualizer';
import { LiveCountdownTimer } from './LiveCountdownTimer';
import { SpeechEngine } from '@/lib/audio/speechEngine';

interface InterviewRoomProps {
  profile: CandidateProfile;
  onFinishInterview: (messages: ChatMessage[]) => void;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  profile,
  onFinishInterview,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [lowTimeWarning, setLowTimeWarning] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const isAiSpeakingRef = useRef(false);

  // Keep ref synchronized
  useEffect(() => {
    isAiSpeakingRef.current = isAiSpeaking;
  }, [isAiSpeaking]);

  // Scroll transcript down automatically
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimSpeech]);

  // Handle AI turn
  const requestAiResponse = useCallback(async (currentHistory: ChatMessage[]) => {
    setIsAiSpeaking(true);
    speechEngineRef.current?.stopListening();

    try {
      const res = await fetch('/api/interview/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, messages: currentHistory }),
      });

      const data = await res.json();
      const replyText = data.reply || 'Terima kasih atas jawaban Anda. Mari kita lanjutkan ke topik selanjutnya.';

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
          // Resume listening after AI finishes speaking
          startSpeechRecognition();
        }
      );
    } catch (err) {
      console.error('Failed to get AI response:', err);
      setIsAiSpeaking(false);
    }
  }, [profile]);

  // Helper to start speech recognition
  const startSpeechRecognition = useCallback(() => {
    if (micMuted || isAiSpeakingRef.current) return;

    speechEngineRef.current?.startListening(
      (interim) => {
        setIsCandidateSpeaking(true);
        setInterimSpeech(interim);
      },
      (final) => {
        setIsCandidateSpeaking(false);
        setInterimSpeech('');
        if (final.trim().length > 3) {
          handleSendUserMessage(final.trim());
        }
      },
      (error) => {
        setIsCandidateSpeaking(false);
      }
    );
  }, [micMuted]);

  // Initialize Speech Engine & Opening Turn
  useEffect(() => {
    const engine = new SpeechEngine();
    speechEngineRef.current = engine;

    // Start initial turn with greeting
    requestAiResponse([]);

    return () => {
      engine.stopListening();
      engine.stopSpeaking();
    };
  }, []);

  const handleSendUserMessage = (userText: string) => {
    if (!userText.trim() || isAiSpeaking) return;

    const newMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText.trim(),
      timestamp: Date.now(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setTextInput('');
    setInterimSpeech('');
    requestAiResponse(updated);
  };

  const toggleMic = () => {
    if (micMuted) {
      setMicMuted(false);
      startSpeechRecognition();
    } else {
      setMicMuted(true);
      speechEngineRef.current?.stopListening();
      setIsCandidateSpeaking(false);
    }
  };

  const handleLowTimeAlert = () => {
    setLowTimeWarning(true);
    // Optional brief audio reminder
    speechEngineRef.current?.speak('Perhatian: waktu wawancara tersisa kurang dari 2 menit.');
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
              {profile.selectedMode === 'hrd' ? 'Behavioral & Culture Fit Interview' : 'System Design & Logic Interview'}
            </p>
          </div>
        </div>

        {/* Live Timer (PRD F-202 & F-204 & F-205) */}
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

      {/* Low Time Alert Banner (PRD F-204) */}
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
            mode={profile.selectedMode}
          />

          {/* Candidate Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
              <span className="flex items-center space-x-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Kandidat: {profile.name}</span>
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {profile.experienceLevel.replace('_', ' ')}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] line-clamp-3">
              {profile.jobDescription}
            </p>
          </div>

          {/* Quick Mic Control Bar */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-xl flex items-center justify-center transition-all ${
                  micMuted
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <div>
                <p className="font-semibold text-white">
                  {micMuted ? 'Mikrofon Dimatikan' : 'Mikrofon Aktif'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {micMuted ? 'Klik untuk mulai bicara' : 'Langsung bicara secara alami'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center space-x-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>{showTranscript ? 'Sembunyikan Teks' : 'Lihat Teks'}</span>
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

            {/* Interim live speech recognition text */}
            {interimSpeech && (
              <div className="flex justify-end space-x-2.5">
                <div className="max-w-[82%] rounded-2xl rounded-br-none px-4 py-3 text-xs leading-relaxed bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 italic animate-pulse">
                  <span className="text-[10px] font-semibold block text-indigo-400">Sedang merekam ucapan Anda...</span>
                  <p>{interimSpeech}</p>
                </div>
              </div>
            )}

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
                placeholder={isAiSpeaking ? 'Tunggu AI selesai berbicara...' : 'Ketik jawaban Anda di sini jika tidak ingin bersuara...'}
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
