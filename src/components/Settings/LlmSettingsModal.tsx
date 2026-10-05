'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
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
  onSave: (apiKey: string, model: string) => void;
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
  const [model, setModel] = useState(currentModel || 'llama-3.3-70b-versatile');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setApiKey(currentApiKey);
    setModel(currentModel || 'llama-3.3-70b-versatile');
    setTestResult(null);
  }, [isOpen, currentApiKey, currentModel]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan Groq API Key terlebih dahulu sebelum menguji koneksi.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
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
          message: 'Koneksi berhasil! Model open-source siap digunakan.',
        });
      } else {
        const err = await res.json();
        setTestResult({
          success: false,
          message: err?.error?.message || 'API Key tidak valid atau kuota habis.',
        });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Gagal menghubungi server Groq. Periksa koneksi internet Anda.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveSettings = () => {
    onSave(apiKey.trim(), model);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Pengaturan Open-Source LLM</h2>
              <p className="text-xs text-slate-400">Pilih mesin AI untuk simulasi percakapan interaktif</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Info Banner */}
          <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3 text-xs text-indigo-300 leading-relaxed">
            <p className="font-semibold text-white mb-1 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Groq Cloud (LLaMA 3.3 70B Open-Source)</span>
            </p>
            Groq menyediakan akses API gratis dengan kecepatan komputasi super cepat (&lt;0.4 detik). Anda bisa mendapatkan API Key gratis tanpa kartu kredit di:
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-1 text-cyan-400 hover:underline font-bold mt-1.5 ml-1"
            >
              <span>console.groq.com/keys</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pilih Model Open-Source
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="llama-3.3-70b-versatile">
                LLaMA 3.3 70B Versatile (Direkomendasikan - Paling Pintar & Manusiawi)
              </option>
              <option value="llama-3.1-8b-instant">
                LLaMA 3.1 8B Instant (Ultra Cepat & Ringan)
              </option>
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Groq API Key (Gratis)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gsk_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              *Tersimpan aman di browser lokal Anda. Jika kosong, sistem menggunakan engine cerdas bawaan.
            </p>
          </div>

          {/* Test Connection Button & Result */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || !apiKey.trim()}
              className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-2 transition-all disabled:opacity-40"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span>Menguji Koneksi...</span>
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Uji Koneksi API Key</span>
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-2.5 p-2.5 rounded-xl border text-xs flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-2.5 pt-5 mt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Simpan Pengaturan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
