'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/shared/AppHeader';
import { 
  CandidateLevel, 
  InterviewerStyle, 
  QuestionCount, 
  AnswerMode 
} from '@/types/wawancara';
import { 
  Building2, 
  Briefcase, 
  GraduationCap, 
  UserCheck, 
  HelpCircle, 
  Mic, 
  Keyboard, 
  Video, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Lightbulb
} from 'lucide-react';

export default function NewInterviewPage() {
  const router = useRouter();

  // Form State
  const [companyName, setCompanyName] = useState('Bank Central Asia (BCA)');
  const [targetRole, setTargetRole] = useState('Management Trainee (ODP)');
  const [level, setLevel] = useState<CandidateLevel>('fresh_graduate');
  const [interviewerStyle, setInterviewerStyle] = useState<InterviewerStyle>('ramah');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);
  const [answerMode, setAnswerMode] = useState<AnswerMode>('suara');

  // Hardware Check State
  const [micStatus, setMicStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>('idle');
  const [camStatus, setCamStatus] = useState<'idle' | 'checking' | 'granted' | 'denied'>('idle');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Suggestion Chips untuk Perusahaan
  const popularCompanies = [
    'Bank Central Asia (BCA)',
    'GoTo (Gojek & Tokopedia)',
    'Shopee Indonesia',
    'Bank Mandiri',
    'Telkom Indonesia',
    'Astra International',
  ];

  // Test izin mic & kamera di browser
  const handleTestHardware = async () => {
    setMicStatus('checking');
    setCamStatus('checking');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      // Sukses
      setMicStatus('granted');
      setCamStatus('granted');

      // Matikan stream setelah pengujian
      stream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.warn('Izin perangkat diblokir atau tidak tersedia:', err);
      setMicStatus('denied');
      setCamStatus('denied');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!companyName.trim() || !targetRole.trim()) {
      setErrorMessage('Harap isi nama perusahaan dan posisi yang dilamar.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          targetRole: targetRole.trim(),
          level,
          interviewerStyle,
          questionCount,
          answerMode,
        }),
      });

      const data = await res.json();

      if (res.status === 403 || data.error === 'QUOTA_EXCEEDED') {
        // Kuota habis -> arahkan ke halaman pricing
        router.push('/pricing?reason=quota_exceeded');
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Gagal memulai wawancara.');
      }

      // Masuk ke ruang wawancara
      router.push(`/interview/${data.id}`);
    } catch (err: unknown) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EAF2FE] text-[#1B2A41]">
      <AppHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* Title & Introduction */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#2F67BB] text-xs font-bold shadow-xs mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FFC857]" />
            Layar Persiapan Wawancara
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2A41]">
            Kustomisasi Sesi Latihan Anda
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl leading-relaxed">
            Atur parameter wawancara sesuai target impian Anda. AI akan mengadopsi persona pewawancara sungguhan dan menggali pengalaman Anda secara mendalam.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Card 1: Target Perusahaan & Posisi */}
          <div className="rounded-3xl bg-white border border-[#2F67BB]/15 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-[#1B2A41] flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-[#4A8DF0]" />
              1. Target Pekerjaan & Perusahaan
            </h2>

            {/* Nama Perusahaan (Teks Bebas) */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A41] mb-1.5">
                Nama Perusahaan yang Dilamar
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: BCA, GoTo, Shopee, Telkom, Mandiri, dll."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-[#4A8DF0] focus:ring-2 focus:ring-[#4A8DF0]/20 text-sm sm:text-base font-medium transition-all"
                required
              />

              {/* Quick Suggestion Chips */}
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-slate-400 font-medium">Contoh populer:</span>
                {popularCompanies.map((comp) => (
                  <button
                    key={comp}
                    type="button"
                    onClick={() => setCompanyName(comp)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#EAF2FE] hover:text-[#2F67BB] text-slate-700 transition-colors"
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {/* Posisi yang Dilamar */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A41] mb-1.5">
                Posisi / Role yang Dituju
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Contoh: Junior Frontend Developer, ODP, Product Associate"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-[#4A8DF0] focus:ring-2 focus:ring-[#4A8DF0]/20 text-sm sm:text-base font-medium transition-all"
                required
              />
            </div>

            {/* Tingkat Pengalaman / Level */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A41] mb-2 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#2F67BB]" />
                Tingkat Pengalaman (Level)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'magang', label: 'Magang (Internship)', desc: 'Untuk mahasiswa aktif mencari pengalaman awal' },
                  { id: 'fresh_graduate', label: 'Fresh Graduate', desc: 'Lulusan baru (0 - 1 tahun pengalaman)' },
                  { id: 'junior', label: 'Junior Staff', desc: '1 - 2 tahun pengalaman kerja relevan' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLevel(lvl.id as CandidateLevel)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      level === lvl.id
                        ? 'border-[#4A8DF0] bg-[#EAF2FE] ring-2 ring-[#4A8DF0]/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="font-bold text-sm text-[#1B2A41]">{lvl.label}</div>
                    <div className="text-xs text-slate-500 mt-1">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Pengaturan Sesi & Gaya Pewawancara */}
          <div className="rounded-3xl bg-white border border-[#2F67BB]/15 p-6 sm:p-8 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-[#1B2A41] flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-5 h-5 text-[#F26A2B]" />
              2. Karakteristik Pewawancara & Sesi
            </h2>

            {/* Gaya Pewawancara */}
            <div>
              <label className="block text-sm font-bold text-[#1B2A41] mb-2">
                Gaya Pewawancara AI
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'ramah',
                    name: 'Ramah & Mengayomi',
                    tag: 'Cocok untuk Pemula',
                    desc: 'Nada bicara hangat, memotivasi, dan fokus membangun rasa percaya diri.',
                  },
                  {
                    id: 'tegas',
                    name: 'Tegas & Terstruktur',
                    tag: 'Standar Korporat',
                    desc: 'Pertanyaan lugas, efisien waktu, dan langsung menilai substansi STAR.',
                  },
                  {
                    id: 'stress',
                    name: 'Stress Interview',
                    tag: 'Uji Mental & Tekanan',
                    desc: 'Skeptis, menantang asumsi, dan menguji ketenangan Anda di bawah tekanan.',
                  },
                ].map((sty) => (
                  <button
                    key={sty.id}
                    type="button"
                    onClick={() => setInterviewerStyle(sty.id as InterviewerStyle)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      interviewerStyle === sty.id
                        ? 'border-[#F26A2B] bg-orange-50/50 ring-2 ring-[#F26A2B]/30'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#F26A2B] block mb-1">
                      {sty.tag}
                    </span>
                    <div className="font-bold text-sm text-[#1B2A41]">{sty.name}</div>
                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{sty.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Pertanyaan & Mode Jawaban */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* Jumlah Pertanyaan */}
              <div>
                <label className="block text-sm font-bold text-[#1B2A41] mb-2">
                  Jumlah Pertanyaan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num as QuestionCount)}
                      className={`py-3 rounded-xl border text-center font-bold text-sm transition-all ${
                        questionCount === num
                          ? 'border-[#4A8DF0] bg-[#4A8DF0] text-white shadow-xs'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {num} Soal
                    </button>
                  ))}
                </div>
                <span className="text-xs text-slate-400 mt-1.5 block">
                  Estimasi durasi: ~{questionCount * 2} menit latihan.
                </span>
              </div>

              {/* Mode Jawaban */}
              <div>
                <label className="block text-sm font-bold text-[#1B2A41] mb-2">
                  Mode Jawaban Utama
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAnswerMode('suara')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                      answerMode === 'suara'
                        ? 'border-[#2F67BB] bg-[#EAF2FE] text-[#2F67BB]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-[#F26A2B]" />
                    Suara (Speech)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnswerMode('ketik')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${
                      answerMode === 'ketik'
                        ? 'border-[#2F67BB] bg-[#EAF2FE] text-[#2F67BB]'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Keyboard className="w-4 h-4 text-[#4A8DF0]" />
                    Ketik Teks
                  </button>
                </div>
                <span className="text-xs text-slate-400 mt-1.5 block">
                  Anda tetap bisa beralih ketik jika lingkungan bising.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Kartu "Sebelum Mulai" (Cek Perangkat, Tips STAR, Estimasi Waktu) */}
          <div className="rounded-3xl bg-gradient-to-br from-white to-[#EAF2FE]/60 border border-[#4A8DF0]/30 p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#1B2A41] flex items-center gap-2 pb-3 border-b border-[#4A8DF0]/20">
              <Sparkles className="w-5 h-5 text-[#FFC857]" />
              3. Sebelum Mulai: Panduan & Pengujian Perangkat
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Uji Mikrofon & Kamera */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1B2A41] uppercase tracking-wider">
                    Izin Mikrofon & Kamera
                  </span>
                  <button
                    type="button"
                    onClick={handleTestHardware}
                    disabled={micStatus === 'checking'}
                    className="text-xs font-bold text-[#4A8DF0] hover:underline"
                  >
                    {micStatus === 'checking' ? 'Memeriksa...' : 'Uji Sekarang'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                    <span className="flex items-center gap-2 text-slate-700">
                      <Mic className="w-4 h-4 text-[#2F67BB]" />
                      Mikrofon
                    </span>
                    {micStatus === 'granted' ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Siap Digunakan
                      </span>
                    ) : micStatus === 'denied' ? (
                      <span className="text-rose-600 font-medium">Izin Belum Diberikan</span>
                    ) : (
                      <span className="text-slate-400">Belum diuji</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50">
                    <span className="flex items-center gap-2 text-slate-700">
                      <Video className="w-4 h-4 text-[#4A8DF0]" />
                      Kamera (Lokal & Pribadi)
                    </span>
                    {camStatus === 'granted' ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Siap Digunakan
                      </span>
                    ) : camStatus === 'denied' ? (
                      <span className="text-rose-600 font-medium">Izin Belum Diberikan</span>
                    ) : (
                      <span className="text-slate-400">Belum diuji</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kamera hanya ditampilkan di browser Anda, tidak direkam.</span>
                </div>
              </div>

              {/* Tips Singkat Metode STAR & Durasi */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-[#1B2A41] uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-[#FFC857]" />
                  Tips Menjawab Metode STAR
                </div>
                <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
                  <p>
                    <strong className="text-[#1B2A41]">S (Situation):</strong> Jelaskan latar belakang situasi atau proyek.
                  </p>
                  <p>
                    <strong className="text-[#1B2A41]">T (Task):</strong> Sebutkan tugas dan tanggung jawab spesifik Anda.
                  </p>
                  <p>
                    <strong className="text-[#1B2A41]">A (Action):</strong> Paparkan langkah nyata & solusi inisiatif Anda.
                  </p>
                  <p>
                    <strong className="text-[#1B2A41]">R (Result):</strong> Ungkapkan hasil akhir dengan angka terukur.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-[#2F67BB]">
                  <Clock className="w-4 h-4 text-[#F26A2B]" />
                  Perkiraan Durasi Sesi: {questionCount * 2} Menit
                </div>
              </div>
            </div>
          </div>

          {/* Tombol Mulai Wawancara (Submit) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
            <span className="text-xs text-slate-500 text-center sm:text-left">
              Menekan tombol ini akan menggunakan 1 saldo sesi latihan Anda.
            </span>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F26A2B] hover:bg-[#d95316] text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#F26A2B]/30 hover:scale-102 transition-all active:scale-98 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Mempersiapkan Pewawancara AI...</span>
                </>
              ) : (
                <>
                  <span>Mulai Wawancara Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
