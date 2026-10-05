'use client';

import React, { useState } from 'react';
import { 
  Briefcase, 
  FileText, 
  User, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Code2, 
  Users, 
  UploadCloud,
  ArrowRight,
  Flame
} from 'lucide-react';
import { CandidateProfile, InterviewMode, ExperienceLevel } from '@/types/interview';
import { SAMPLE_PROFILES } from '@/lib/constants';

interface SetupFormProps {
  onStartHardwareTest: (profile: CandidateProfile) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStartHardwareTest }) => {
  const [name, setName] = useState('Rian Pratama');
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('mid_level');
  const [selectedMode, setSelectedMode] = useState<InterviewMode>('hrd');
  const [jobDescription, setJobDescription] = useState(
    SAMPLE_PROFILES[0].profile.jobDescription || ''
  );
  const [cvContent, setCvContent] = useState(
    SAMPLE_PROFILES[0].profile.cvContent || ''
  );
  const [cvFileName, setCvFileName] = useState<string | undefined>('CV_Rian_Pratama.pdf');

  const handleApplyPreset = (index: number) => {
    const preset = SAMPLE_PROFILES[index].profile;
    if (preset.name) setName(preset.name);
    if (preset.targetRole) setTargetRole(preset.targetRole);
    if (preset.experienceLevel) setExperienceLevel(preset.experienceLevel);
    if (preset.jobDescription) setJobDescription(preset.jobDescription);
    if (preset.cvContent) setCvContent(preset.cvContent);
    setCvFileName(`${preset.name?.replace(/\s+/g, '_')}_CV.pdf`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFileName(file.name);
      // Read text content if available (for text/markdown/json files) or create placeholder
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && text.trim().length > 0) {
          setCvContent(text);
        } else {
          setCvContent(`[File Diunggah: ${file.name}] Ringkasan profil kandidat untuk posisi ${targetRole}.`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetRole.trim() || !jobDescription.trim()) {
      alert('Mohon lengkapi Nama, Posisi Target, dan Job Description.');
      return;
    }

    onStartHardwareTest({
      name,
      targetRole,
      jobDescription,
      cvContent: cvContent || 'Kandidat belum melampirkan teks CV mendalam.',
      cvFileName,
      experienceLevel,
      selectedMode,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulasi Wawancara Suara Berbasis AI Real-Time</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
          Latihan Wawancara Kerja dengan AI Interaktif
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          AI akan memposisikan diri sebagai HRD atau Tech Lead sungguhan, mengajukan pertanyaan berbasis CV & Job Description Anda, dan memberikan evaluasi STAR seketika.
        </p>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="text-xs text-slate-500 flex items-center mr-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 mr-1" />
            Contoh Cepat:
          </span>
          {SAMPLE_PROFILES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(idx)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/60 text-slate-300 hover:text-white transition-all shadow-sm"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Configuration Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm space-y-6">
        
        {/* Mode Selector (PRD F-102) */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-3">
            Pilih Mode Wawancara (F-102)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* HRD Mode */}
            <div
              onClick={() => setSelectedMode('hrd')}
              className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                selectedMode === 'hrd'
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${selectedMode === 'hrd' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">HRD / Behavioral</h3>
                    <p className="text-[11px] text-indigo-400">Metode STAR & Soft Skills</p>
                  </div>
                </div>
                {selectedMode === 'hrd' && <Check className="w-4 h-4 text-indigo-400" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persona HR Recruiter ramah & evaluatif. Menilai penanganan konflik, motivasi kerja, *culture fit*, dan pencapaian dengan metode STAR.
              </p>
            </div>

            {/* Technical Mode */}
            <div
              onClick={() => setSelectedMode('technical')}
              className={`cursor-pointer rounded-xl p-4 border transition-all relative ${
                selectedMode === 'technical'
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg ${selectedMode === 'technical' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Technical Lead</h3>
                    <p className="text-[11px] text-cyan-400">Hard Skill & Architecture</p>
                  </div>
                </div>
                {selectedMode === 'technical' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Persona Senior Tech Lead. Menguji logika arsitektur, trade-off, problem solving, optimasi performa, dan edge cases.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Rian Pratama"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Posisi Target yang Dilamar
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="cth. Senior Frontend Engineer"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tingkat Pengalaman
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="fresh_graduate">Lulusan Baru / Fresh Graduate</option>
              <option value="mid_level">Mid-Level (1-3 tahun)</option>
              <option value="senior">Senior / Lead (4+ tahun)</option>
            </select>
          </div>
        </div>

        {/* Job Description (PRD F-101) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Deskripsi Pekerjaan / Job Description (Wajib)
          </label>
          <textarea
            rows={4}
            required
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Tempelkan kualifikasi dan tanggung jawab pekerjaan di sini..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* CV Input / Upload (PRD F-101) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Isi CV / Portofolio Ringkas
            </label>
            <label className="cursor-pointer text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{cvFileName ? `Ganti File (${cvFileName})` : 'Unggah File CV (PDF/DOCX/TXT)'}</span>
              <input
                type="file"
                accept=".txt,.pdf,.docx,.doc,.md"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
          <textarea
            rows={4}
            value={cvContent}
            onChange={(e) => setCvContent(e.target.value)}
            placeholder="Ketik atau tempelkan ringkasan pengalaman kerja, tech stack, dan riwayat pendidikan Anda..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sesi latihan gratis 15:00 menit dengan rekaman audio instan.</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
          >
            <span>Uji Audio & Masuk Ruang Wawancara</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};
