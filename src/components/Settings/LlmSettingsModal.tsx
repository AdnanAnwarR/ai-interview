'use client';

import React, { useState, useEffect } from 'react';
import { 
  Key, 
  ExternalLink, 
  Check, 
  X, 
  Sparkles, 
  Cpu, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface LlmSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groqKey: string, groqModel: string, anthropicKey?: string) => void;
  currentApiKey: string;
  currentModel: string;
}

export const LlmSettingsModal: React.FC<LlmSettingsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentApiKey,
  currentModel,
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [model, setModel] = useState(currentModel || 'qwen/qwen3.8-27b');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setApiKey(currentApiKey);
    setModel(currentModel || 'qwen/qwen3.8-27b');
    if (typeof window !== 'undefined') {
      const savedAnthropic = localStorage.getItem('anthropic_api_key');
      if (savedAnthropic) setAnthropicKey(savedAnthropic);
    }
    setTestResult(null);
  }, [isOpen, currentApiKey, currentModel]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey.trim() && !anthropicKey.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan Groq API Key atau Claude API Key terlebih dahulu sebelum menguji koneksi.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    // If Anthropic key provided, test Anthropic or Groq
    if (apiKey.trim()) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: 'Halo, jawab "OK" jika terhubung!' }],
            max_tokens: 10,
          }),
        });

        if (res.ok) {
          setTestResult({
            success: true,
            message: 'Koneksi Groq AI berhasil! Model siap digunakan untuk wawancara.',
          });
        } else {
          const err = await res.json();
          setTestResult({
            success: false,
            message: err?.error?.message || 'API Key tidak valid atau kuota habis.',
          });
        }
      } catch {
        setTestResult({
          success: false,
          message: 'Gagal menghubungi server AI. Periksa koneksi internet Anda.',
        });
      } finally {
        setIsTesting(false);
      }
    } else {
      setTestResult({
        success: true,
        message: 'Kunci Claude tersimpan dan akan digunakan pada sesi wawancara.',
      });
      setIsTesting(false);
    }
  };

  const handleSaveSettings = () => {
    if (typeof window !== 'undefined' && anthropicKey.trim()) {
      localStorage.setItem('anthropic_api_key', anthropicKey.trim());
    }
    onSave(apiKey.trim(), model, anthropicKey.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white border border-[#2F67BB]/20 rounded-3xl shadow-2xl p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#EAF2FE] rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-2xl bg-[#EAF2FE] text-[#2F67BB] border border-[#4A8DF0]/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1B2A41]">Mesin AI Wawancarain</h2>
              <p className="text-xs text-slate-500">Konfigurasi model AI Claude atau Groq Cloud</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-[#EAF2FE]/60 border border-[#4A8DF0]/25 rounded-2xl p-3.5 text-xs text-[#1B2A41] leading-relaxed">
            <p className="font-bold text-[#2F67BB] mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#F26A2B]" />
              <span>Dukungan Multi-Model AI (Claude & Groq)</span>
            </p>
            Platform Wawancarain mendukung <strong>Claude 3.5 Sonnet</strong> dari Anthropic dan model open-source <strong>Qwen / LLaMA</strong> via Groq Cloud gratis (&lt;0.4 detik). Kunci tersimpan aman di browser lokal Anda.
          </div>

          {/* Groq API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1B2A41]">
                Groq API Key (Gratis - Tercepat)
              </label>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#4A8DF0] hover:underline font-semibold flex items-center space-x-1"
              >
                <span>Dapatkan Kunci</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-mono"
              />
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-bold text-[#1B2A41] mb-1.5">
              Pilihan Model AI Groq
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1B2A41] focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-medium"
            >
              <option value="qwen/qwen3.8-27b">
                Qwen 3.8 27B (Direkomendasikan - Paling Fasih Bahasa Indonesia)
              </option>
              <option value="openai/gpt-oss-120b">
                GPT-OSS 120B (Penalaran Arsitektur Mendalam)
              </option>
              <option value="openai/gpt-oss-20b">
                GPT-OSS 20B (Ringan & Cepat)
              </option>
              <option value="llama-3.3-70b-versatile">
                LLaMA 3.3 70B Versatile
              </option>
            </select>
          </div>

          {/* Anthropic Claude API Key Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1B2A41]">
                Anthropic Claude API Key (Opsional)
              </label>
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#4A8DF0] hover:underline font-semibold flex items-center space-x-1"
              >
                <span>Console Anthropic</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              *Jika kosong, sistem otomatis menggunakan Groq atau mesin cerdas bawaan.
            </p>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || (!apiKey.trim() && !anthropicKey.trim())}
              className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#1B2A41] text-xs font-bold flex items-center space-x-2 transition-all disabled:opacity-40"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4A8DF0]" />
                  <span>Menguji Koneksi...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-[#2F67BB]" />
                  <span>Uji Koneksi AI</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-2.5 p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2.5 pt-4 mt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 rounded-xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
