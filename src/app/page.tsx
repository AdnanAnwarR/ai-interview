'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { SetupForm } from '@/components/PreInterview/SetupForm';
import { AudioHardwareModal } from '@/components/PreInterview/AudioHardwareModal';
import { InterviewRoom } from '@/components/LiveSession/InterviewRoom';
import { ScorecardView } from '@/components/PostInterview/ScorecardView';
import { PaywallModal } from '@/components/Monetization/PaywallModal';
import { LlmSettingsModal } from '@/components/Settings/LlmSettingsModal';
import { 
  CandidateProfile, 
  ChatMessage, 
  InterviewStatus, 
  ScorecardReport, 
  UserSubscription 
} from '@/types/interview';
import { Loader2, Sparkles } from 'lucide-react';

export default function Home() {
  const [status, setStatus] = useState<InterviewStatus>('idle');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [scorecardReport, setScorecardReport] = useState<ScorecardReport | null>(null);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [isLlmSettingsOpen, setIsLlmSettingsOpen] = useState(false);

  // Open-Source LLM Settings (Groq / LLaMA 3.3)
  const [groqApiKey, setGroqApiKey] = useState('');
  const [groqModel, setGroqModel] = useState('llama-3.3-70b-versatile');

  const [subscription, setSubscription] = useState<UserSubscription>({
    plan: 'free',
    freeSessionUsed: false,
    sessionsRemaining: 1,
  });

  // Load saved LLM settings from localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('groq_api_key');
      const savedModel = localStorage.getItem('groq_model');
      if (savedKey) setGroqApiKey(savedKey);
      if (savedModel) setGroqModel(savedModel);
    }
  }, []);

  const handleSaveLlmSettings = (key: string, model: string) => {
    setGroqApiKey(key);
    setGroqModel(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem('groq_api_key', key);
      localStorage.setItem('groq_model', model);
    }
  };

  // Step 1: Pre-Interview form submitted -> open Audio Hardware Test
  const handleStartHardwareTest = (candidateData: CandidateProfile) => {
    // If free session already used and no paid sessions left -> show paywall
    if (subscription.freeSessionUsed && subscription.sessionsRemaining <= 0) {
      setIsPaywallOpen(true);
      return;
    }

    setProfile(candidateData);
    setIsAudioModalOpen(true);
  };

  // Step 2: Audio hardware verified -> Start Live Interview
  const handleStartInterview = () => {
    setIsAudioModalOpen(false);
    setStatus('in_progress');
  };

  // Step 3: Interview completed (timer expired or manual end) -> evaluate
  const handleFinishInterview = async (finalMessages: ChatMessage[]) => {
    setTranscript(finalMessages);
    setStatus('evaluating');

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          messages: finalMessages,
          groqApiKey,
          groqModel,
        }),
      });

      const report: ScorecardReport = await res.json();
      setScorecardReport(report);
      setStatus('completed');

      // Deduct quota
      setSubscription((prev) => ({
        ...prev,
        freeSessionUsed: true,
        sessionsRemaining: Math.max(0, prev.sessionsRemaining - 1),
      }));
    } catch (err) {
      console.error('Failed to generate scorecard:', err);
      setStatus('completed');
    }
  };

  // Step 4: Start new session
  const handleStartNewSession = () => {
    if (subscription.freeSessionUsed && subscription.sessionsRemaining <= 0) {
      setIsPaywallOpen(true);
    } else {
      setStatus('idle');
      setScorecardReport(null);
      setTranscript([]);
    }
  };

  // Upgrade handler
  const handleSuccessUpgrade = (plan: 'free' | 'pro' | 'unlimited', sessionsAdded: number) => {
    setSubscription({
      plan,
      freeSessionUsed: false,
      sessionsRemaining: sessionsAdded,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Persistent Navbar */}
      <Navbar
        status={status}
        subscription={subscription}
        hasGroqKey={!!groqApiKey}
        onOpenPricing={() => setIsPaywallOpen(true)}
        onOpenSettings={() => setIsLlmSettingsOpen(true)}
        onResetToHome={() => {
          if (status === 'in_progress') {
            if (confirm('Apakah Anda yakin ingin membatalkan sesi interview yang sedang berjalan?')) {
              setStatus('idle');
            }
          } else {
            setStatus('idle');
          }
        }}
      />

      {/* Main Container */}
      <main className="flex-1">
        {/* State 1: Setup Form (Pre-Interview) */}
        {status === 'idle' && (
          <SetupForm onStartHardwareTest={handleStartHardwareTest} />
        )}

        {/* State 2: Live Interview Room */}
        {status === 'in_progress' && profile && (
          <InterviewRoom
            profile={profile}
            groqApiKey={groqApiKey}
            groqModel={groqModel}
            onFinishInterview={handleFinishInterview}
          />
        )}

        {/* State 3: Evaluating Loader */}
        {status === 'evaluating' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>
              <Sparkles className="w-5 h-5 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Menganalisis Hasil Wawancara Anda...
            </h2>
            <p className="text-xs text-slate-400 max-w-md">
              Sistem AI sedang mengevaluasi struktur jawaban (STAR), relevansi terhadap Job Description, dan menyusun Scorecard komprehensif.
            </p>
          </div>
        )}

        {/* State 4: Scorecard & Report */}
        {status === 'completed' && scorecardReport && profile && (
          <ScorecardView
            report={scorecardReport}
            profile={profile}
            transcript={transcript}
            onStartNewSession={handleStartNewSession}
          />
        )}
      </main>

      {/* Audio Hardware Modal (PRD F-103) */}
      <AudioHardwareModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        onProceed={handleStartInterview}
      />

      {/* Paywall & Subscription Gate Modal (PRD F-303 & F-304) */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        onSuccessUpgrade={handleSuccessUpgrade}
      />

      {/* Open-Source LLM Settings Modal */}
      <LlmSettingsModal
        isOpen={isLlmSettingsOpen}
        onClose={() => setIsLlmSettingsOpen(false)}
        onSave={handleSaveLlmSettings}
        currentApiKey={groqApiKey}
        currentModel={groqModel}
      />
    </div>
  );
}
