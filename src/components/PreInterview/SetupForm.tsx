'use client';

import React, { useState } from 'react';
import { 
  Briefcase, 
  User, 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Code2, 
  Users, 
  UploadCloud,
  ArrowRight,
  Flame,
  Building2,
  GraduationCap
} from 'lucide-react';
import { CandidateProfile, InterviewMode, ExperienceLevel } from '@/types/interview';
import { SAMPLE_PROFILES, POPULAR_COMPANIES } from '@/lib/constants';
import { candidateProfileSchema } from '@/lib/validations/interview';

interface SetupFormProps {
  onStartHardwareTest: (profile: CandidateProfile) => void;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStartHardwareTest }) => {
  const [name, setName] = useState('Rian Pratama');
  const [targetCompany, setTargetCompany] = useState('GoTo (Tokopedia)');
  const [targetRole, setTargetRole] = useState('Junior Frontend Developer');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('fresh_graduate');
  const [selectedMode, setSelectedMode] = useState<InterviewMode>('hrd');
  const [jobDescription, setJobDescription] = useState(
    SAMPLE_PROFILES[0].profile.jobDescription || ''
  );
  const [cvContent, setCvContent] = useState(
    SAMPLE_PROFILES[0].profile.cvContent || ''
  );
  const [cvFileName, setCvFileName] = useState<string | undefined>('CV_Rian_Pratama.pdf');
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  const handleApplyPreset = (index: number) => {
    const preset = SAMPLE_PROFILES[index].profile;
    if (preset.name) setName(preset.name);
    if (preset.targetCompany) setTargetCompany(preset.targetCompany);
    if (preset.targetRole) setTargetRole(preset.targetRole);
    if (preset.experienceLevel) setExperienceLevel(preset.experienceLevel);
    if (preset.jobDescription) setJobDescription(preset.jobDescription);
    if (preset.cvContent) setCvContent(preset.cvContent);
    setCvFileName(`${preset.name?.replace(/\s+/g, '_')}_CV.pdf`);
    setValidationErrors({});
  };

  const handleSelectCompanyPreset = (companyName: string, defaultRole: string) => {
    setTargetCompany(companyName);
    if (!targetRole || targetRole === 'Frontend Developer') {
      setTargetRole(defaultRole);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text && text.trim().length > 0) {
          setCvContent(text);
        } else {
          setCvContent(`[File Diunggah: ${file.name}] Ringkasan profil kandidat untuk posisi ${targetRole} di ${targetCompany}.`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    const profileData: CandidateProfile = {
      name,
      targetCompany,
      targetRole,
      jobDescription,
      cvContent: cvContent || 'Kandidat belum melampirkan teks CV mendalam.',
      cvFileName,
      experienceLevel,
      selectedMode,
    };

    // Validasi Zod
    const result = candidateProfileSchema.safeParse(profileData);
    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      });
      setValidationErrors(fieldErrors);
      alert('Mohon periksa kembali form: ' + (result.error.issues[0]?.message || 'Data belum lengkap'));
      return;
    }

    onStartHardwareTest(profileData);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero Header - Wawancarain Branding */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF2FE] border border-[#4A8DF0]/30 text-[#2F67BB] text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#F26A2B]" />
          <span>Wawancarain: Latihan Wawancara Kerja Real-Time AI</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1B2A41] tracking-tight mb-3">
          Siap Hadapi Wawancara Kerja Impian Anda
        </h1>
        
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          Pilih perusahaan dan posisi yang dilamar. AI kami akan mewawancarai Anda secara interaktif berbasis suara dan memberikan <span className="font-bold text-[#F26A2B]">nilai untuk setiap jawaban</span> di akhir sesi.
        </p>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="text-xs text-slate-500 font-semibold flex items-center mr-1">
            <Flame className="w-3.5 h-3.5 text-[#F26A2B] mr-1" />
            Contoh Cepat:
          </span>
          {SAMPLE_PROFILES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(idx)}
              className="text-xs px-3.5 py-1.5 rounded-xl bg-white border border-[#2F67BB]/20 hover:border-[#4A8DF0] text-[#1B2A41] hover:text-[#2F67BB] font-medium transition-all shadow-sm"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Configuration Card - Warm, Friendly, Grounded */}
      <form onSubmit={handleSubmit} className="bg-white border border-[#2F67BB]/20 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Mode Selector (HRD vs Technical) */}
        <div>
          <label className="block text-sm font-bold text-[#1B2A41] mb-3">
            Pilih Mode Wawancara
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* HRD Mode */}
            <div
              onClick={() => setSelectedMode('hrd')}
              className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                selectedMode === 'hrd'
                  ? 'border-[#4A8DF0] bg-[#EAF2FE]/70 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:border-[#4A8DF0]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl ${selectedMode === 'hrd' ? 'bg-[#4A8DF0] text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1B2A41]">HRD / Behavioral</h3>
                    <p className="text-[11px] font-semibold text-[#2F67BB]">Metode STAR & Culture Fit</p>
                  </div>
                </div>
                {selectedMode === 'hrd' && (
                  <span className="w-5 h-5 rounded-full bg-[#4A8DF0] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Persona Recruiter ramah & evaluatif. Menilai penanganan konflik, inisiatif, motivasi kerja, dan pencapaian dengan metode STAR.
              </p>
            </div>

            {/* Technical Mode */}
            <div
              onClick={() => setSelectedMode('technical')}
              className={`cursor-pointer rounded-2xl p-4 border transition-all relative ${
                selectedMode === 'technical'
                  ? 'border-[#2F67BB] bg-[#EAF2FE]/70 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 hover:border-[#2F67BB]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-xl ${selectedMode === 'technical' ? 'bg-[#2F67BB] text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1B2A41]">Technical Lead</h3>
                    <p className="text-[11px] font-semibold text-[#2F67BB]">Logika, Arsitektur & Problem Solving</p>
                  </div>
                </div>
                {selectedMode === 'technical' && (
                  <span className="w-5 h-5 rounded-full bg-[#2F67BB] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Persona Senior Tech Lead. Menguji logika arsitektur, trade-off, problem solving, optimasi performa, dan edge cases.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information: Nama, Perusahaan, Posisi Target, Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#1B2A41] mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Rian Pratama"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white"
              />
            </div>
            {validationErrors.name && (
              <p className="text-[11px] text-rose-500 mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A41] mb-1.5">
              Perusahaan yang Dilamar
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="cth. GoTo, BCA, Shopee, Telkom"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-medium"
              />
            </div>
            {validationErrors.targetCompany && (
              <p className="text-[11px] text-rose-500 mt-1">{validationErrors.targetCompany}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A41] mb-1.5">
              Posisi / Role yang Dilamar
            </label>
            <div className="relative">
              <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="cth. Frontend Developer, ODP"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-medium"
              />
            </div>
            {validationErrors.targetRole && (
              <p className="text-[11px] text-rose-500 mt-1">{validationErrors.targetRole}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#1B2A41] mb-1.5">
              Tingkat Pengalaman
            </label>
            <div className="relative">
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-[#1B2A41] focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-medium"
              >
                <option value="fresh_graduate">Fresh Graduate / Mahasiswa</option>
                <option value="mid_level">Mid-Level (1-3 tahun)</option>
                <option value="senior">Senior / Lead (4+ tahun)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Company Quick Suggestions */}
        <div className="bg-[#EAF2FE]/50 rounded-2xl p-3.5 border border-[#4A8DF0]/20">
          <p className="text-[11px] font-bold text-[#2F67BB] mb-2 flex items-center space-x-1.5">
            <GraduationCap className="w-4 h-4 text-[#F26A2B]" />
            <span>Pilihan Populer Perusahaan untuk Mahasiswa & Fresh Graduate:</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_COMPANIES.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => handleSelectCompanyPreset(company.name, company.defaultRole)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                  targetCompany === company.name
                    ? 'bg-[#4A8DF0] text-white border-[#4A8DF0] font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-[#4A8DF0] hover:text-[#2F67BB]'
                }`}
              >
                {company.name}
              </button>
            ))}
          </div>
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-xs font-bold text-[#1B2A41] mb-1.5">
            Deskripsi Pekerjaan / Job Description (Wajib)
          </label>
          <textarea
            rows={4}
            required
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Tempelkan kualifikasi dan tanggung jawab pekerjaan di sini..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-mono"
          />
          {validationErrors.jobDescription && (
            <p className="text-[11px] text-rose-500 mt-1">{validationErrors.jobDescription}</p>
          )}
        </div>

        {/* CV Input / Upload */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[#1B2A41]">
              Isi CV / Pengalaman Kerja & Organisasi
            </label>
            <label className="cursor-pointer text-xs text-[#2F67BB] hover:text-[#4A8DF0] font-semibold flex items-center space-x-1">
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
            placeholder="Ketik atau tempelkan ringkasan pengalaman kerja, organisasi kemahasiswaan, proyek, dan skill Anda..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-[#1B2A41] placeholder-slate-400 focus:outline-none focus:border-[#4A8DF0] focus:bg-white font-mono"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>1 sesi latihan gratis 15 menit dengan evaluasi nilai untuk setiap jawaban.</span>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-[0.99]"
          >
            <span>Uji Perangkat & Mulai Wawancara</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};
