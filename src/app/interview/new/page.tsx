'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CandidateLevel, InterviewerStyle, QuestionCount } from '@/types/wawancara';
import { AlertCircle, Loader2 } from 'lucide-react';
import { extractCvTextFromFile } from '@/lib/pdfParser';

export default function NewInterviewPage() {
  const router = useRouter();

  // Balance / Sessions
  const [remainingSessions, setRemainingSessions] = useState<number>(1);

  // Step state (0: Target, 1: Lowongan & CV, 2: Suasana, 3: Cek perangkat, 4: Ringkasan)
  const [cur, setCur] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());

  // Step 0: Target
  const [mode, setMode] = useState<'HRD' | 'Teknis'>('HRD');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [level, setLevel] = useState<'Magang' | 'Fresh graduate' | 'Junior'>('Fresh graduate');
  const [coError, setCoError] = useState('');
  const [poError, setPoError] = useState('');

  // Step 1: Lowongan dan CV
  const [jobDescription, setJobDescription] = useState('');
  const [jdError, setJdError] = useState('');
  const [cvText, setCvText] = useState('');
  const [cvFileName, setCvFileName] = useState('');
  const [cvLabel, setCvLabel] = useState('Unggah file CV (PDF atau TXT)');
  const [cvNote, setCvNote] = useState('CV hanya dipakai untuk sesi ini dan tidak disimpan setelah selesai.');

  // Step 2: Suasana
  const [style, setStyle] = useState<'Ramah' | 'Tegas' | 'Menantang'>('Ramah');
  const [questionCount, setQuestionCount] = useState<5 | 8 | 10>(8);

  // Step 3: Cek perangkat
  const [micStatus, setMicStatus] = useState<'idle' | 'checking' | 'ok' | 'no'>('idle');
  const [micMessage, setMicMessage] = useState('Belum dicek');
  const [camStatus, setCamStatus] = useState<'idle' | 'checking' | 'ok' | 'no'>('idle');
  const [camMessage, setCamMessage] = useState('Belum dicek');
  const [ansVoice, setAnsVoice] = useState(true);
  const [ansType, setAnsType] = useState(true);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stepNames = ['Target', 'Lowongan dan CV', 'Suasana', 'Cek perangkat', 'Ringkasan'];

  // Fetch balance
  useEffect(() => {
    fetch('/api/user/balance')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.sessionsRemaining === 'number') {
          setRemainingSessions(data.sessionsRemaining);
        }
      })
      .catch(() => {});
  }, []);

  // Validasi langkah
  const validateStep = (targetStep: number): boolean => {
    let isValid = true;
    const c = company.trim();
    const p = position.trim();

    if (!c) {
      setCoError('Isi nama perusahaan yang kamu lamar.');
      isValid = false;
    } else {
      setCoError('');
    }

    if (!p) {
      setPoError('Isi posisi yang kamu lamar.');
      isValid = false;
    } else {
      setPoError('');
    }

    if (targetStep >= 2) {
      const jd = jobDescription.trim();
      if (!jd) {
        setJdError('Tempel deskripsi lowongan agar pertanyaannya sesuai.');
        isValid = false;
      } else {
        setJdError('');
      }
    }

    return isValid;
  };

  const goToStep = (i: number) => {
    if (i > cur && !validateStep(i)) {
      setCur(company.trim() && position.trim() ? 1 : 0);
      return;
    }

    setCur(i);

    setDone((prev) => {
      const updated = new Set(prev);
      if (i > 0) updated.add(0);
      if (i > 1) updated.add(1);
      if (i > 2) updated.add(2);
      if (i > 3) updated.add(3);
      return updated;
    });

    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Toggle cara menjawab (minimal satu harus aktif)
  const toggleVoice = () => {
    if (ansVoice && !ansType) return;
    setAnsVoice(!ansVoice);
  };

  const toggleType = () => {
    if (ansType && !ansVoice) return;
    setAnsType(!ansType);
  };

  // Quick preset chips
  const applyQuickPreset = (compName: string, posName: string) => {
    setCompany(compName);
    setPosition(posName);
    setCoError('');
    setPoError('');
  };

  // Handle CV File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCvFileName(file.name);
    setCvLabel(`Membaca ${file.name}...`);
    setCvNote('Mengekstrak teks dokumen...');

    try {
      const result = await extractCvTextFromFile(file);
      if (result.isExtracted && result.text) {
        setCvText(result.text);
        setCvLabel(`✓ ${file.name} (klik untuk ganti file)`);
        setCvNote('CV berhasil dibaca. Teks otomatis masuk ke kolom di bawah.');
      } else {
        setCvLabel(`✓ ${file.name} terpilih`);
        setCvNote(result.message || 'Teks CV belum bisa dibaca otomatis. Silakan tempel manual di kolom di bawah.');
      }
    } catch {
      setCvLabel(`${file.name} terpilih`);
      setCvNote('Teks CV belum bisa dibaca otomatis. Silakan tempel manual di kolom di bawah.');
    }
  };

  // Test microphone hardware
  const handleTestMic = async () => {
    setMicStatus('checking');
    setMicMessage('Mengecek...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicStatus('ok');
      setMicMessage('Siap');
    } catch {
      setMicStatus('no');
      setMicMessage('Izin ditolak atau tidak ada perangkat. Kamu tetap bisa menjawab dengan mengetik.');
    }
  };

  // Test camera hardware
  const handleTestCam = async () => {
    setCamStatus('checking');
    setCamMessage('Mengecek...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setCamStatus('ok');
      setCamMessage('Siap');
    } catch {
      setCamStatus('no');
      setCamMessage('Izin ditolak atau tidak ada perangkat. Kamu tetap bisa menjawab dengan mengetik.');
    }
  };

  // Submit form to backend
  const handleStartInterview = async () => {
    if (!validateStep(4)) {
      goToStep(0);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const mappedLevel: CandidateLevel =
      level === 'Magang' ? 'magang' : level === 'Junior' ? 'junior' : 'fresh_graduate';

    const mappedStyle: InterviewerStyle =
      style === 'Tegas' ? 'tegas' : style === 'Menantang' ? 'stress' : 'ramah';

    const mappedCount: QuestionCount = questionCount;

    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: company.trim(),
          targetRole: position.trim(),
          level: mappedLevel,
          interviewerStyle: mappedStyle,
          questionCount: mappedCount,
          answerMode: ansVoice ? 'suara' : 'ketik',
          jobDescription: jobDescription.trim(),
          cvContent: cvText.trim(),
        }),
      });

      const data = await res.json();

      if (res.status === 403 || data.error === 'QUOTA_EXCEEDED') {
        router.push('/pricing?reason=quota_exceeded');
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Gagal memulai wawancara.');
      }

      router.push(`/interview/${data.id}`);
    } catch (err: unknown) {
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMessage(msg);
    }
  };

  const getAnswerModeText = () => {
    if (ansVoice && ansType) return 'Dengan suara dan mengetik';
    if (ansVoice) return 'Dengan suara';
    return 'Dengan mengetik';
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F9FE] text-[#1B2A41]">
      {/* Header */}
      <header className="flex items-center justify-between max-w-[1040px] mx-auto px-5 py-4.5">
        <Link href="/" className="flex items-center gap-2.5 font-fraunces font-bold text-2xl text-[#1B2A41]">
          <svg width="34" height="34" viewBox="0 0 512 512" aria-hidden="true" className="shrink-0">
            <rect width="512" height="512" rx="110" fill="#3C7BDB" />
            <path
              d="M176 140H336a40 40 0 0 1 40 40V290a40 40 0 0 1-40 40H250L190 388V330H176a40 40 0 0 1-40-40V180a40 40 0 0 1 40-40Z"
              fill="#fff"
            />
            <path
              d="M184 196 222 288 256 214 290 288 328 196"
              fill="none"
              stroke="#F26A2B"
              strokeWidth="26"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            Wawancarain<span className="text-[#F26A2B]">.</span>
          </span>
        </Link>
        <span className="bg-[#EAF2FE] text-[#2F67BB] rounded-full px-3.5 py-1.5 font-semibold text-sm">
          {remainingSessions} sesi gratis tersisa
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-[1040px] mx-auto px-5 pt-2 pb-28">
        <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight tracking-tight">
          Siapkan wawancaramu
        </h1>
        <p className="text-[#5F6B7D] mt-2 mb-6 max-w-[56ch] text-base">
          Tiga langkah singkat. Kamu bisa mengubah pilihan kapan saja sebelum wawancara dimulai.
        </p>

        {errorMessage && (
          <div className="max-w-[760px] mx-auto mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Steps navigation bar */}
        <nav className="flex gap-2 mb-5 flex-wrap" aria-label="Langkah persiapan">
          {stepNames.map((name, i) => {
            const isActive = i === cur;
            const isDone = done.has(i);
            return (
              <button
                key={name}
                type="button"
                onClick={() => goToStep(i)}
                className={`flex items-center gap-2 border rounded-full py-2 pr-4 pl-2 font-semibold transition-all cursor-pointer text-sm ${
                  isActive
                    ? 'border-[#4A8DF0] text-[#1B2A41] bg-white shadow-xs'
                    : isDone
                    ? 'border-[#DCE6F5] text-[#1B2A41] bg-white'
                    : 'border-[#DCE6F5] text-[#5F6B7D] bg-white'
                }`}
              >
                <b
                  className={`w-6.5 h-6.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isDone
                      ? 'bg-[#1FA67A] text-white'
                      : isActive
                      ? 'bg-[#2F67BB] text-white'
                      : 'bg-[#EAF2FE] text-[#2F67BB]'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </b>
                <span>{name}</span>
              </button>
            );
          })}
        </nav>

        {/* Form Panel Container */}
        <div className="max-w-[760px] mx-auto">
          <section className="bg-white border border-[#DCE6F5] rounded-[20px] p-6 sm:p-7 shadow-xs">
            {/* Step 0: Target */}
            {cur === 0 && (
              <div className="animate-in fade-in-50 duration-200">
                <h2 className="font-fraunces text-2xl font-bold text-[#1B2A41] mb-1">
                  Kamu melamar ke mana?
                </h2>
                <p className="text-[#5F6B7D] text-sm mb-5.5">
                  Pewawancara akan menyesuaikan pertanyaan dengan posisi ini.
                </p>

                {/* Modes radiogroup */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5.5" role="radiogroup" aria-label="Jenis wawancara">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === 'HRD'}
                    onClick={() => setMode('HRD')}
                    className={`border-2 rounded-2xl p-4 cursor-pointer text-left transition-all ${
                      mode === 'HRD'
                        ? 'border-[#4A8DF0] bg-[#EAF2FE]'
                        : 'border-[#DCE6F5] bg-transparent hover:border-[#4A8DF0]/50'
                    }`}
                  >
                    <strong className="block text-[17px] text-[#1B2A41]">Wawancara HRD</strong>
                    <span className="text-sm text-[#5F6B7D]">Perkenalan, motivasi, dan pengalamanmu</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={mode === 'Teknis'}
                    onClick={() => setMode('Teknis')}
                    className={`border-2 rounded-2xl p-4 cursor-pointer text-left transition-all ${
                      mode === 'Teknis'
                        ? 'border-[#4A8DF0] bg-[#EAF2FE]'
                        : 'border-[#DCE6F5] bg-transparent hover:border-[#4A8DF0]/50'
                    }`}
                  >
                    <strong className="block text-[17px] text-[#1B2A41]">Wawancara teknis</strong>
                    <span className="text-sm text-[#5F6B7D]">Pertanyaan sesuai bidang kerja yang kamu lamar</span>
                  </button>
                </div>

                {/* Company & Role inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5.5">
                  <div>
                    <label className="block font-semibold text-sm mb-1.5 text-[#1B2A41]" htmlFor="co">
                      Nama perusahaan
                    </label>
                    <input
                      id="co"
                      value={company}
                      onChange={(e) => {
                        setCompany(e.target.value);
                        if (e.target.value.trim()) setCoError('');
                      }}
                      placeholder="Contoh: Bank Mandiri"
                      autoComplete="off"
                      className={`w-full border rounded-xl px-3.5 py-3 min-h-[48px] bg-[#F6F9FE] text-base text-[#1B2A41] placeholder-[#5F6B7D]/60 focus:outline-hidden focus:border-[#4A8DF0] transition-colors ${
                        coError ? 'border-[#C73B2B]' : 'border-[#DCE6F5]'
                      }`}
                    />
                    <p className="text-[#C73B2B] text-xs min-h-[20px] mt-1">{coError}</p>
                  </div>

                  <div>
                    <label className="block font-semibold text-sm mb-1.5 text-[#1B2A41]" htmlFor="po">
                      Posisi yang dilamar
                    </label>
                    <input
                      id="po"
                      value={position}
                      onChange={(e) => {
                        setPosition(e.target.value);
                        if (e.target.value.trim()) setPoError('');
                      }}
                      placeholder="Contoh: Junior Web Developer"
                      autoComplete="off"
                      className={`w-full border rounded-xl px-3.5 py-3 min-h-[48px] bg-[#F6F9FE] text-base text-[#1B2A41] placeholder-[#5F6B7D]/60 focus:outline-hidden focus:border-[#4A8DF0] transition-colors ${
                        poError ? 'border-[#C73B2B]' : 'border-[#DCE6F5]'
                      }`}
                    />
                    <p className="text-[#C73B2B] text-xs min-h-[20px] mt-1">{poError}</p>
                  </div>
                </div>

                {/* Level pengalaman */}
                <div className="mb-5.5">
                  <span className="block font-semibold text-sm mb-2 text-[#1B2A41]">
                    Level pengalaman
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(['Magang', 'Fresh graduate', 'Junior'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        aria-pressed={level === lvl}
                        onClick={() => setLevel(lvl)}
                        className={`border rounded-full px-4 py-2 font-semibold text-sm cursor-pointer transition-all ${
                          level === lvl
                            ? 'bg-[#2F67BB] border-[#2F67BB] text-white shadow-xs'
                            : 'border-[#DCE6F5] bg-[#F6F9FE] text-[#1B2A41] hover:border-[#4A8DF0]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick preset chips */}
                <div>
                  <span className="block font-semibold text-sm mb-2 text-[#1B2A41]">
                    Belum tahu mau coba apa?
                  </span>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => applyQuickPreset('GoTo', 'Frontend Developer')}
                      className="border border-dashed border-[#4A8DF0] bg-transparent text-[#2F67BB] hover:bg-[#EAF2FE] rounded-full px-3.5 py-1.5 font-semibold text-sm cursor-pointer transition-colors"
                    >
                      Frontend Developer di GoTo
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickPreset('Bank BCA', 'IT Trainee')}
                      className="border border-dashed border-[#4A8DF0] bg-transparent text-[#2F67BB] hover:bg-[#EAF2FE] rounded-full px-3.5 py-1.5 font-semibold text-sm cursor-pointer transition-colors"
                    >
                      IT Trainee di Bank BCA
                    </button>
                    <button
                      type="button"
                      onClick={() => applyQuickPreset('Bank Mandiri', 'Management Trainee')}
                      className="border border-dashed border-[#4A8DF0] bg-transparent text-[#2F67BB] hover:bg-[#EAF2FE] rounded-full px-3.5 py-1.5 font-semibold text-sm cursor-pointer transition-colors"
                    >
                      Management Trainee di Bank Mandiri
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Lowongan dan CV */}
            {cur === 1 && (
              <div className="animate-in fade-in-50 duration-200">
                <h2 className="font-fraunces text-2xl font-bold text-[#1B2A41] mb-1">
                  Lowongan dan CV
                </h2>
                <p className="text-[#5F6B7D] text-sm mb-5.5">
                  Dengan dua data ini, pewawancara bertanya dari lowongan yang kamu lamar dan pengalaman yang kamu tulis.
                </p>

                <div className="mb-5.5">
                  <label className="block font-semibold text-sm mb-1.5 text-[#1B2A41]" htmlFor="jd">
                    Deskripsi pekerjaan (wajib)
                  </label>
                  <textarea
                    id="jd"
                    rows={6}
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      if (e.target.value.trim()) setJdError('');
                    }}
                    placeholder="Salin tanggung jawab dan kualifikasi dari lowongan"
                    className={`w-full border rounded-xl p-3.5 bg-[#F6F9FE] text-base text-[#1B2A41] placeholder-[#5F6B7D]/60 focus:outline-hidden focus:border-[#4A8DF0] resize-y min-h-[120px] transition-colors ${
                      jdError ? 'border-[#C73B2B]' : 'border-[#DCE6F5]'
                    }`}
                  />
                  <p className="text-[#C73B2B] text-xs min-h-[20px] mt-1">{jdError}</p>
                </div>

                <div className="mb-2">
                  <label className="block font-semibold text-sm mb-1.5 text-[#1B2A41]" htmlFor="cvt">
                    Isi CV: pengalaman kerja dan organisasi
                  </label>

                  <label
                    htmlFor="cv-upload"
                    className="block border-2 border-dashed border-[#4A8DF0] rounded-2xl p-4 text-center cursor-pointer mb-2.5 bg-[#EAF2FE] text-[#2F67BB] font-semibold transition-colors hover:bg-[#dce9fc]"
                  >
                    <span className="block">{cvLabel}</span>
                    <small className="block text-[#5F6B7D] font-normal text-xs mt-0.5">
                      Teksnya otomatis masuk ke kolom di bawah
                    </small>
                  </label>

                  <input
                    id="cv-upload"
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <textarea
                    id="cvt"
                    rows={6}
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    placeholder="Atau tempel teks CV-mu di sini: pendidikan, keahlian, pengalaman, organisasi"
                    className="w-full border border-[#DCE6F5] rounded-xl p-3.5 bg-[#F6F9FE] text-base text-[#1B2A41] placeholder-[#5F6B7D]/60 focus:outline-hidden focus:border-[#4A8DF0] resize-y min-h-[120px] transition-colors"
                  />
                  <p className="text-[#5F6B7D] text-xs min-h-[20px] mt-1">{cvNote}</p>
                </div>
              </div>
            )}

            {/* Step 2: Suasana */}
            {cur === 2 && (
              <div className="animate-in fade-in-50 duration-200">
                <h2 className="font-fraunces text-2xl font-bold text-[#1B2A41] mb-1">
                  Atur suasana wawancara
                </h2>
                <p className="text-[#5F6B7D] text-sm mb-5.5">
                  Semua pilihan ini bisa kamu biarkan seperti semula.
                </p>

                {/* Gaya pewawancara */}
                <div className="mb-5.5">
                  <span className="block font-semibold text-sm mb-2 text-[#1B2A41]">
                    Gaya pewawancara
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(['Ramah', 'Tegas', 'Menantang'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={style === s}
                        onClick={() => setStyle(s)}
                        className={`border rounded-full px-4 py-2 font-semibold text-sm cursor-pointer transition-all ${
                          style === s
                            ? 'bg-[#2F67BB] border-[#2F67BB] text-white shadow-xs'
                            : 'border-[#DCE6F5] bg-[#F6F9FE] text-[#1B2A41] hover:border-[#4A8DF0]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Jumlah pertanyaan */}
                <div className="mb-2">
                  <span className="block font-semibold text-sm mb-2 text-[#1B2A41]">
                    Jumlah pertanyaan
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {([5, 8, 10] as const).map((count) => (
                      <button
                        key={count}
                        type="button"
                        aria-pressed={questionCount === count}
                        onClick={() => setQuestionCount(count)}
                        className={`border rounded-full px-4 py-2 font-semibold text-sm cursor-pointer transition-all ${
                          questionCount === count
                            ? 'bg-[#2F67BB] border-[#2F67BB] text-white shadow-xs'
                            : 'border-[#DCE6F5] bg-[#F6F9FE] text-[#1B2A41] hover:border-[#4A8DF0]'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Cek perangkat */}
            {cur === 3 && (
              <div className="animate-in fade-in-50 duration-200">
                <h2 className="font-fraunces text-2xl font-bold text-[#1B2A41] mb-1">
                  Cek mikrofon dan kamera
                </h2>
                <p className="text-[#5F6B7D] text-sm mb-5.5">
                  Kamera hanya untuk pratinjau dan tidak direkam.
                </p>

                {/* Check Mikrofon */}
                <div className="flex items-center gap-3.5 border border-[#DCE6F5] rounded-2xl p-4 mb-3 bg-white">
                  <div className="flex-1">
                    <strong className="block text-sm font-bold text-[#1B2A41]">Mikrofon</strong>
                    <small className="text-[#5F6B7D] text-xs block">Dipakai untuk menjawab dengan suara</small>
                  </div>
                  <span
                    className={`font-bold text-xs sm:text-sm ${
                      micStatus === 'ok'
                        ? 'text-[#1FA67A]'
                        : micStatus === 'no'
                        ? 'text-[#C73B2B]'
                        : 'text-[#5F6B7D]'
                    }`}
                  >
                    {micMessage}
                  </span>
                  <button
                    type="button"
                    onClick={handleTestMic}
                    className="border border-[#4A8DF0] bg-transparent text-[#2F67BB] rounded-xl px-4 py-2 font-semibold text-sm cursor-pointer transition-colors hover:bg-[#EAF2FE]"
                  >
                    Tes
                  </button>
                </div>

                {/* Check Kamera */}
                <div className="flex items-center gap-3.5 border border-[#DCE6F5] rounded-2xl p-4 mb-5.5 bg-white">
                  <div className="flex-1">
                    <strong className="block text-sm font-bold text-[#1B2A41]">Kamera</strong>
                    <small className="text-[#5F6B7D] text-xs block">Agar terasa seperti wawancara sungguhan</small>
                  </div>
                  <span
                    className={`font-bold text-xs sm:text-sm ${
                      camStatus === 'ok'
                        ? 'text-[#1FA67A]'
                        : camStatus === 'no'
                        ? 'text-[#C73B2B]'
                        : 'text-[#5F6B7D]'
                    }`}
                  >
                    {camMessage}
                  </span>
                  <button
                    type="button"
                    onClick={handleTestCam}
                    className="border border-[#4A8DF0] bg-transparent text-[#2F67BB] rounded-xl px-4 py-2 font-semibold text-sm cursor-pointer transition-colors hover:bg-[#EAF2FE]"
                  >
                    Tes
                  </button>
                </div>

                {/* Cara Menjawab */}
                <div className="mb-3">
                  <span className="block font-semibold text-sm mb-2 text-[#1B2A41]">
                    Cara menjawab
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={ansVoice}
                      onClick={toggleVoice}
                      className={`border rounded-full px-4 py-2 font-semibold text-sm cursor-pointer transition-all ${
                        ansVoice
                          ? 'bg-[#2F67BB] border-[#2F67BB] text-white shadow-xs'
                          : 'border-[#DCE6F5] bg-[#F6F9FE] text-[#1B2A41] hover:border-[#4A8DF0]'
                      }`}
                    >
                      Dengan suara
                    </button>
                    <button
                      type="button"
                      aria-pressed={ansType}
                      onClick={toggleType}
                      className={`border rounded-full px-4 py-2 font-semibold text-sm cursor-pointer transition-all ${
                        ansType
                          ? 'bg-[#2F67BB] border-[#2F67BB] text-white shadow-xs'
                          : 'border-[#DCE6F5] bg-[#F6F9FE] text-[#1B2A41] hover:border-[#4A8DF0]'
                      }`}
                    >
                      Dengan mengetik
                    </button>
                  </div>
                </div>

                <p className="text-[#5F6B7D] text-xs leading-relaxed">
                  Dua-duanya aktif secara bawaan: kamu bisa bicara lalu merapikan jawaban lewat ketikan. Tekan salah satu untuk mematikannya (minimal satu harus aktif). Tidak punya mikrofon? Cukup biarkan mengetik saja yang aktif.
                </p>
              </div>
            )}

            {/* Step 4: Ringkasan sesi */}
            {cur === 4 && (
              <div className="animate-in fade-in-50 duration-200" aria-live="polite">
                <h2 className="font-fraunces text-2xl font-bold text-[#1B2A41] mb-1">
                  Ringkasan sesi
                </h2>
                <p className="text-[#5F6B7D] text-sm mb-5.5">
                  Periksa dulu sebelum mulai. Kalau ada yang ingin diubah, tekan Ubah di barisnya.
                </p>

                {/* Summary Table Card */}
                <div className="bg-[#EAF2FE] rounded-2xl px-5 py-2 mb-2">
                  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] gap-3 items-center py-3 border-b border-[#DCE6F5]">
                    <span className="text-[#5F6B7D] text-sm">Jenis wawancara</span>
                    <b className="font-semibold text-sm text-[#1B2A41]">
                      {mode === 'HRD' ? 'Wawancara HRD' : 'Wawancara teknis'}
                    </b>
                    <button
                      type="button"
                      onClick={() => goToStep(0)}
                      className="text-[#2F67BB] font-semibold text-sm cursor-pointer px-1 hover:underline"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] gap-3 items-center py-3 border-b border-[#DCE6F5]">
                    <span className="text-[#5F6B7D] text-sm">Perusahaan dan posisi</span>
                    <b className="font-semibold text-sm text-[#1B2A41]">
                      {position || company ? `${position || '...'} di ${company || '...'}` : 'Belum diisi'}
                    </b>
                    <button
                      type="button"
                      onClick={() => goToStep(0)}
                      className="text-[#2F67BB] font-semibold text-sm cursor-pointer px-1 hover:underline"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] gap-3 items-center py-3 border-b border-[#DCE6F5]">
                    <span className="text-[#5F6B7D] text-sm">Level</span>
                    <b className="font-semibold text-sm text-[#1B2A41]">{level}</b>
                    <button
                      type="button"
                      onClick={() => goToStep(0)}
                      className="text-[#2F67BB] font-semibold text-sm cursor-pointer px-1 hover:underline"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] gap-3 items-center py-3 border-b border-[#DCE6F5]">
                    <span className="text-[#5F6B7D] text-sm">Lowongan dan CV</span>
                    <b className="font-semibold text-sm text-[#1B2A41]">
                      {[
                        jobDescription.trim() ? 'Lowongan terisi' : 'Lowongan belum diisi',
                        cvText.trim() ? 'CV terisi' : 'CV belum diisi',
                      ].join(', ')}
                    </b>
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="text-[#2F67BB] font-semibold text-sm cursor-pointer px-1 hover:underline"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] gap-3 items-center py-3 border-b border-[#DCE6F5]">
                    <span className="text-[#5F6B7D] text-sm">Suasana</span>
                    <b className="font-semibold text-sm text-[#1B2A41]">
                      {style}, {questionCount} pertanyaan
                    </b>
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="text-[#2F67BB] font-semibold text-sm cursor-pointer px-1 hover:underline"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] gap-3 items-center py-3 border-b border-[#DCE6F5]">
                    <span className="text-[#5F6B7D] text-sm">Cara menjawab</span>
                    <b className="font-semibold text-sm text-[#1B2A41]">{getAnswerModeText()}</b>
                    <button
                      type="button"
                      onClick={() => goToStep(3)}
                      className="text-[#2F67BB] font-semibold text-sm cursor-pointer px-1 hover:underline"
                    >
                      Ubah
                    </button>
                  </div>

                  <div className="grid grid-cols-[minmax(110px,180px)_1fr_auto] gap-3 items-center py-3">
                    <span className="text-[#5F6B7D] text-sm">Perkiraan durasi</span>
                    <b className="font-semibold text-sm text-[#1B2A41]">
                      sekitar {Math.round(questionCount * 1.9)} menit
                    </b>
                    <span />
                  </div>
                </div>

                {/* What candidate gets */}
                <ul className="list-disc pl-5 mt-4 text-[#5F6B7D] text-sm space-y-1">
                  <li>Nilai untuk setiap jawabanmu</li>
                  <li>Penanda metode STAR</li>
                  <li>Contoh jawaban yang lebih baik</li>
                </ul>
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="flex justify-between gap-3 mt-6 pt-4 border-t border-[#DCE6F5]/50">
              <button
                type="button"
                onClick={() => goToStep(cur - 1)}
                className={`border border-[#DCE6F5] bg-transparent text-[#1B2A41] rounded-2xl px-6 py-3 font-bold text-sm min-h-[48px] cursor-pointer transition-colors hover:bg-slate-50 ${
                  cur === 0 ? 'invisible' : 'visible'
                }`}
              >
                Kembali
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  if (cur < 4) {
                    goToStep(cur + 1);
                  } else {
                    handleStartInterview();
                  }
                }}
                className="bg-[#F26A2B] hover:bg-[#D9561A] text-white rounded-2xl px-6 py-3 font-bold text-sm min-h-[48px] cursor-pointer shadow-sm transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mempersiapkan...</span>
                  </>
                ) : cur === 4 ? (
                  'Mulai wawancara'
                ) : (
                  'Lanjut'
                )}
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
