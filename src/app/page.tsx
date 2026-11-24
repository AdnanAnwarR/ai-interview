'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  ChevronDown, 
  HelpCircle,
  GraduationCap
} from 'lucide-react';

interface RoleDemoData {
  question: string;
  userAnswer: string;
  score: string;
  verdictTitle: string;
  verdictSummary: string;
  weakness: string;
  suggestion: string;
}

const DEMO_ROLES: Record<string, RoleDemoData> = {
  admin: {
    question:
      '"Kalau ada 3 atasan dari divisi berbeda memberikan tugas mendesak di waktu bersamaan sebelum jam pulang kantor, apa yang akan kamu lakukan?"',
    userAnswer:
      '"Saya kerjakan semuanya secepat mungkin biar selesai dan kalau perlu lembur sendiri di kantor sampai malam."',
    score: '65',
    verdictTitle: 'Niat kerja bagus, tapi manajemen prioritas lemah',
    verdictSummary:
      'Jawaban ini menunjukkan dedikasi, namun berisiko burnout dan rawan salah input data tanpa komunikasi yang jelas.',
    weakness:
      'Kamu tidak melakukan klarifikasi batas waktu (deadline) ke masing-masing atasan dan memilih memikul beban sendirian tanpa koordinasi.',
    suggestion:
      '"Saya akan cek tenggat waktu masing-masing tugas, lalu mengomunikasikan daftar prioritas ke ketiga atasan tersebut secara transparan agar mereka sepakat tugas mana yang paling krusial diselesaikan lebih dulu."',
  },
  webdev: {
    question:
      '"Pernahkah kamu menemukan bug kritis di production saat deadline rilis sudah sangat mepet? Bagaimana alur berpikirmu menghadapinya?"',
    userAnswer:
      '"Waktu tugas kuliah kemarin ada bug codingan. Saya langsung panik dan coba ubah kodenya berkali-kali sampai akhirnya bisa jalan lagi."',
    score: '58',
    verdictTitle: 'Kurang metodis dalam pemecahan masalah (troubleshooting)',
    verdictSummary:
      'Dalam tim developer, aksi coba-coba tanpa isolasi masalah berpotensi merusak codebase lain yang sudah stabil.',
    weakness:
      'Mengakui panik tanpa menjelaskan langkah sistematis (cek error logs, rollback ke branch stabil, isolasi commit terakhir).',
    suggestion:
      '"Pertama saya pastikan service tetap aman dengan rollback versi stabil bila perlu. Lalu saya cek log error untuk mengisolasi akar masalah (root cause), buat hotfix di branch terpisah, uji lokal, baru deploy ulang."',
  },
  cs: {
    question:
      '"Bagaimana caramu menangani pelanggan yang marah-marah dan menuntut refund karena barangnya terlambat sampai 4 hari?"',
    userAnswer:
      '"Saya bilang ke pelanggan kalau itu kesalahan dari pihak kurir ekspedisi, bukan salah toko kami, tapi saya janji bantu follow-up."',
    score: '60',
    verdictTitle: 'Melempar kesalahan ke pihak ketiga (defensif)',
    verdictSummary:
      'Pelanggan membeli dari toko Anda, sehingga melempar kesalahan secara langsung membuat pelanggan merasa diabaikan.',
    weakness:
      'Kurang menunjukkan empati di kalimat pembuka dan terkesan defensif membela diri.',
    suggestion:
      '"Saya akan dengarkan keluhannya sampai tuntas dengan empati, minta maaf dengan tulus atas kendala pengiriman tersebut, lalu segera lacak resi dan tawarkan opsi solusi nyata (kompensasi voucher/ekspedisi ulang kilat)."',
  },
};

const FAQ_LIST = [
  {
    q: 'Apakah jawaban wawancara saya aman dan terjaga privasinya?',
    a: 'Sangat aman. Rekaman suara dan teks jawabanmu hanya digunakan secara instan untuk memproses evaluasi sesi tersebut. Kami tidak menjual datamu ke pihak ketiga dan tidak membagikan rekamanmu ke calon tempat kerjamu.',
  },
  {
    q: 'Apa bedanya latihan di sini dibanding tanya ke ChatGPT biasa?',
    a: 'ChatGPT biasa cenderung bersikap netral dan sering memuji semua kalimat yang kamu masukkan. Di Wawancarain, AI kami diprogram khusus dengan standar penilaian rekruter lokal: menantang jawaban yang terlalu bertele-tele, mendeteksi struktur STAR yang kurang lengkap, dan memberikan contoh kalimat perbaikan yang lugas.',
  },
  {
    q: 'Saya sama sekali belum pernah ikut interview kerja, apakah cocok untuk pemula?',
    a: 'Justru paling pas untukmu. Kamu bisa mulai dari level paling dasar tanpa perlu takut malu atau dihakimi. Jika bingung harus menjawab apa, ada opsi contek kerangka berpikir sebelum kamu mulai merekam jawaban.',
  },
  {
    q: 'Apakah saya harus menyalakan kamera laptop/HP?',
    a: 'Tidak wajib. Kamu bisa fokus ke substansi bicara lewat suara mikrofon atau mengetik teks jawaban. Fitur analisa gestur kamera saat ini tidak diwajibkan agar kuotamu tetap hemat dan kamu tidak tertekan di awal.',
  },
];

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState<'admin' | 'webdev' | 'cs'>('admin');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const demoData = DEMO_ROLES[activeRole];

  return (
    <div className="min-h-screen bg-[#FAFCFF] text-[#1B2A41] font-sans antialiased selection:bg-[#4A8DF0] selection:text-white">
      {/* ==================== NAVBAR ==================== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#D2E2F7]">
        <div className="max-w-[1140px] mx-auto px-5 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <svg width="36" height="36" viewBox="0 0 512 512" aria-hidden="true" className="shrink-0 transition-transform group-hover:scale-105">
              <rect width="512" height="512" rx="110" fill="#2F67BB" />
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
            <span className="font-fraunces text-2xl font-bold tracking-tight text-[#1B2A41]">
              Wawancarain<span className="text-[#F26A2B]">.</span>
            </span>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#4F637E]">
            <a href="#cara-kerja" className="hover:text-[#2F67BB] transition-colors">
              Cara Kerja
            </a>
            <a href="#demo" className="hover:text-[#2F67BB] transition-colors">
              Coba Demo
            </a>
            <a href="#kenapa" className="hover:text-[#2F67BB] transition-colors">
              Keunggulan
            </a>
            <a href="#harga" className="hover:text-[#2F67BB] transition-colors">
              Biaya
            </a>
            <a href="#faq" className="hover:text-[#2F67BB] transition-colors">
              FAQ
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-[#2F67BB] hover:bg-[#EAF2FE] rounded-full transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/interview/new"
              className="px-5 py-2.5 rounded-full bg-[#F26A2B] hover:bg-[#D85619] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              Mulai Gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <header className="pt-12 pb-16 sm:pt-16 sm:pb-24 bg-gradient-to-b from-[#F5F9FF] to-[#FAFCFF] border-b border-[#D2E2F7]/50 relative overflow-hidden">
        <div className="max-w-[1140px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headline */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D2E2F7] shadow-xs text-xs sm:text-sm font-semibold text-[#2F67BB] mb-5">
                <span className="text-[#FFC857]">✨</span>
                <span>Dibangun khusus fresh graduate & mahasiswa</span>
              </div>

              <h1 className="font-fraunces text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.2] text-[#1B2A41] tracking-tight mb-5">
                Tiba-tiba ditanya{' '}
                <em className="italic font-normal text-[#2F67BB] bg-gradient-to-r from-[#FFC857]/40 to-[#FFC857]/10 px-1.5 rounded-md">
                  &ldquo;ceritakan tentang dirimu&rdquo;
                </em>{' '}
                langsung blank?
              </h1>

              <p className="text-base sm:text-lg text-[#4F637E] leading-relaxed mb-7 max-w-xl">
                Wajar banget grogi kalau belum pernah latihan. Di <strong>Wawancarain</strong>, kamu bisa
                simulasi tanya-jawab dengan AI selayaknya HRD beneran—kapan saja lewat HP, dapat kritik
                membangun tanpa dihakimi, dan harganya ramah kantong kos.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 mb-5 w-full sm:w-auto">
                <Link
                  href="/interview/new"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#F26A2B] hover:bg-[#D85619] text-white font-bold text-base shadow-lg shadow-[#F26A2B]/25 hover:shadow-xl transition-all active:scale-98 flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>Coba Sesi Gratis Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <a
                  href="#cara-kerja"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white border border-[#D2E2F7] hover:border-[#2F67BB] text-[#1B2A41] hover:text-[#2F67BB] font-semibold text-base transition-all hover:bg-[#EAF2FE] text-center"
                >
                  Lihat Cara Kerjanya
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#4F637E]">
                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span>Tanpa perlu kartu kredit • 100% Bahasa Indonesia santai</span>
              </div>
            </div>

            {/* Right Column: Interactive Mockup Card */}
            <div className="lg:col-span-5 relative">
              <div className="bg-white border-2 border-[#D2E2F7] rounded-3xl p-5 sm:p-6 shadow-xl relative">
                <div className="flex items-center justify-between pb-3.5 border-b border-dashed border-[#D2E2F7] mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB]">
                    Simulasi: Junior Web Developer
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Sesi Sedang Berjalan
                  </span>
                </div>

                <div className="space-y-3.5">
                  {/* Bubble AI */}
                  <div className="p-3.5 rounded-2xl rounded-bl-xs bg-[#EAF2FE] border border-[#D2E2F7] text-sm text-[#1B2A41]">
                    <div className="text-[11px] font-bold text-[#2F67BB] uppercase mb-1">
                      AI Pewawancara
                    </div>
                    <p className="leading-snug">
                      &ldquo;Bisa jelaskan proyek web paling menantang yang pernah kamu buat saat kuliah
                      atau magang, dan bagaimana kamu mengatasi kendalanya?&rdquo;
                    </p>
                  </div>

                  {/* Bubble Pengguna */}
                  <div className="p-3.5 rounded-2xl rounded-br-xs bg-[#F8FAFC] border border-slate-200 text-sm text-slate-700 ml-5">
                    <div className="text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Jawabanmu (Suara / Teks)
                    </div>
                    <p className="leading-snug">
                      &ldquo;Waktu tugas akhir, saya buat web katalog. Waktu itu sempat error database
                      MySQL pas diuji dosen, terus saya cari solusinya di Google dan selesai...&rdquo;
                    </p>
                  </div>

                  {/* Feedback Highlight Card */}
                  <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#FFE49E] shadow-sm">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="px-2.5 py-1 rounded-lg bg-[#FFC857] text-[#724700] font-fraunces font-extrabold text-base shadow-xs">
                        72<span className="text-xs font-bold">/100</span>
                      </div>
                      <div className="text-xs">
                        <strong className="block text-[#1B2A41]">Evaluasi Metode STAR</strong>
                        <span className="text-[#4F637E]">Situation & Action ada, Result belum jelas.</span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#F1E5C6] text-xs text-[#42351A]">
                      <strong className="text-[#925300] block mb-0.5">💡 Saran Perbaikan:</strong>
                      Sebutkan metrik hasil nyata (misal:{' '}
                      <em>&ldquo;waktu query database turun dari 3 detik menjadi 0,4 detik&rdquo;</em>).
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#F26A2B]"></span>
                    Pertanyaan 2 dari 5 siap dilanjutkan
                  </span>
                  <Link href="/interview/new" className="text-[#2F67BB] font-bold hover:underline">
                    Coba Langsung →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== MASALAH ==================== */}
      <section className="py-16 sm:py-20 bg-white border-b border-[#D2E2F7]">
        <div className="max-w-[1140px] mx-auto px-5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            {/* Stat Box */}
            <div className="md:col-span-5 bg-[#1B2A41] text-white p-8 rounded-3xl shadow-xl">
              <span className="inline-block px-3 py-1 rounded-full bg-[#F26A2B] text-white font-bold text-xs uppercase tracking-wide mb-4">
                Data BPS Nasional (2026)
              </span>
              <div className="font-fraunces text-5xl font-bold text-[#FFC857] mb-3">
                1,03 Juta
              </div>
              <p className="text-sm text-[#D2E2F7] leading-relaxed mb-4">
                Lulusan diploma dan sarjana (D4 / S1 / S2 / S3) tercatat masih menganggur dan mencari
                pekerjaan.
              </p>
              <div className="text-xs text-[#9BB8DE] pt-3.5 border-t border-white/15">
                Banyak yang gugur bukan karena tidak pintar, tapi karena gelagapan saat diuji tatap muka.
              </div>
            </div>

            {/* Narrative */}
            <div className="md:col-span-7">
              <h2 className="font-fraunces text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1B2A41] mb-4">
                Kirim puluhan CV sudah lolos screen, tapi mental pas sesi <em>interview user</em>?
              </h2>

              <div className="p-4 sm:p-5 bg-[#EAF2FE] border-l-4 border-[#2F67BB] rounded-r-2xl my-5 text-sm sm:text-base italic text-[#1B2A41] leading-relaxed">
                &ldquo;Mau minta latihan sama mentor karier, sekali sesi biayanya Rp200.000–Rp500.000. Mau
                ajak latihan temen seangkatan, malah canggung dan berujung bercanda.&rdquo;
              </div>

              <p className="text-[#4F637E] text-base leading-relaxed mb-3">
                Kebanyakan kita baru tahu letak salahnya setelah dapat email penolakan standar:{' '}
                <em>&ldquo;Saat ini kualifikasi Anda belum sesuai...&rdquo;</em> tanpa pernah tahu kalimat apa
                yang bikin HRD ragu.
              </p>

              <p className="text-[#4F637E] text-base leading-relaxed">
                <strong>Wawancarain</strong> ada buat jadi tempat aman kamu bikin salah ribuan kali, belajar
                menyusun argumen meyakinkan, sampai jawabanmu terdengar alami dan percaya diri.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CARA KERJA ==================== */}
      <section id="cara-kerja" className="py-20 bg-[#F8FBFF] border-b border-[#D2E2F7]">
        <div className="max-w-[1140px] mx-auto px-5">
          <div className="text-left mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] font-bold text-xs uppercase tracking-wide mb-3">
              Langkah Latihan
            </span>
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1B2A41]">
              3 langkah simpel, dari cemas jadi siap tempur.
            </h2>
            <p className="text-[#4F637E] text-base mt-2 max-w-xl">
              Nggak ribet instal aplikasi. Cukup buka browser di HP sambil rebahan di kos pun bisa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white border-2 border-[#D2E2F7] hover:border-[#2F67BB] rounded-3xl p-7 transition-all hover:-translate-y-1 shadow-sm hover:shadow-card flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[#EAF2FE] text-[#2F67BB] font-fraunces font-bold text-xl flex items-center justify-center mb-5">
                1
              </div>
              <span className="text-xs font-bold text-[#8C9BAE] uppercase tracking-wide mb-1.5">
                Tahap Penentuan
              </span>
              <h3 className="font-fraunces text-xl font-bold text-[#1B2A41] mb-2.5">
                Pilih Posisi Impianmu
              </h3>
              <p className="text-sm text-[#4F637E] leading-relaxed">
                Mulai dari Staff Administrasi, Customer Service, Content Writer, sampai Junior Web Developer
                dan Management Trainee. Pertanyaan disesuaikan dengan posisi riil industri.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white border-2 border-[#D2E2F7] hover:border-[#2F67BB] rounded-3xl p-7 transition-all hover:-translate-y-1 shadow-sm hover:shadow-card flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[#FEF7DE] text-[#925300] font-fraunces font-bold text-xl flex items-center justify-center mb-5">
                2
              </div>
              <span className="text-xs font-bold text-[#8C9BAE] uppercase tracking-wide mb-1.5">
                Tahap Praktik
              </span>
              <h3 className="font-fraunces text-xl font-bold text-[#1B2A41] mb-2.5">
                Jawab Pertanyaan AI
              </h3>
              <p className="text-sm text-[#4F637E] leading-relaxed">
                Pewawancara AI bakal mengajukan pertanyaan lazim (perilaku, teknis dasar, studi kasus). Kamu
                bisa menjawab via suara mikrofon HP atau ketik teks santai.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white border-2 border-[#D2E2F7] hover:border-[#2F67BB] rounded-3xl p-7 transition-all hover:-translate-y-1 shadow-sm hover:shadow-card flex flex-col">
              <div className="w-12 h-12 rounded-full bg-[#FFEFE6] text-[#F26A2B] font-fraunces font-bold text-xl flex items-center justify-center mb-5">
                3
              </div>
              <span className="text-xs font-bold text-[#8C9BAE] uppercase tracking-wide mb-1.5">
                Tahap Evaluasi
              </span>
              <h3 className="font-fraunces text-xl font-bold text-[#1B2A41] mb-2.5">
                Terima Skor & Kalimat Jawaban
              </h3>
              <p className="text-sm text-[#4F637E] leading-relaxed">
                Dalam hitungan detik, dapatkan breakdown: apa yang sudah bagus, kalimat apa yang bikin
                blunder, plus contekan cara jawab yang lebih persuasif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DEMO INTERAKTIF ==================== */}
      <section id="demo" className="py-20 bg-white border-b border-[#D2E2F7]">
        <div className="max-w-[960px] mx-auto px-5">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#FEF7DE] text-[#9A6900] font-bold text-xs uppercase tracking-wide mb-3">
              Coba Langsung di Sini
            </span>
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1B2A41]">
              Intip cara AI kami menilai jawabanmu
            </h2>
            <p className="text-[#4F637E] text-base mt-2 max-w-lg mx-auto">
              Pilih salah satu posisi di bawah ini dan lihat pertanyaan serta contoh koreksi nyatanya.
            </p>
          </div>

          <div className="bg-[#FAFCFE] border-2 border-[#D2E2F7] rounded-3xl p-6 sm:p-8 shadow-card">
            {/* Tab selector */}
            <div className="flex gap-2.5 border-b border-[#D2E2F7] pb-4 mb-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveRole('admin')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeRole === 'admin'
                    ? 'bg-[#2F67BB] text-white shadow-md'
                    : 'bg-white border border-[#D2E2F7] text-[#4F637E] hover:border-[#2F67BB]'
                }`}
              >
                Staff Administrasi
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('webdev')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeRole === 'webdev'
                    ? 'bg-[#2F67BB] text-white shadow-md'
                    : 'bg-white border border-[#D2E2F7] text-[#4F637E] hover:border-[#2F67BB]'
                }`}
              >
                Junior Web Developer
              </button>
              <button
                type="button"
                onClick={() => setActiveRole('cs')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  activeRole === 'cs'
                    ? 'bg-[#2F67BB] text-white shadow-md'
                    : 'bg-white border border-[#D2E2F7] text-[#4F637E] hover:border-[#2F67BB]'
                }`}
              >
                Customer Service / CRM
              </button>
            </div>

            {/* Chat Stream */}
            <div className="space-y-4 mb-6">
              {/* Question */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#EAF2FE] border border-[#D2E2F7] text-[#1B2A41]">
                <span className="block text-xs font-bold uppercase text-[#2F67BB] mb-1">
                  Tanya: HRD Recruiter
                </span>
                <p className="text-base font-medium leading-relaxed">{demoData.question}</p>
              </div>

              {/* Sample Answer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 text-slate-700 ml-4 sm:ml-8">
                <span className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Contoh Jawaban Pelamar:
                </span>
                <p className="text-base leading-relaxed">{demoData.userAnswer}</p>
              </div>
            </div>

            {/* AI Assessment Card */}
            <div className="bg-white border-2 border-[#FFE49E] rounded-2xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-4 pb-4 border-b border-[#F6E7BF] mb-5">
                <div className="px-3.5 py-1.5 rounded-xl bg-[#FFC857] text-[#724700] font-fraunces font-extrabold text-2xl shadow-xs">
                  {demoData.score}
                  <span className="text-sm font-bold">/100</span>
                </div>
                <div>
                  <h4 className="font-bold text-base sm:text-lg text-[#1B2A41]">
                    {demoData.verdictTitle}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4F637E]">{demoData.verdictSummary}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FFF5F2] border border-[#FFD9CE] text-sm">
                  <div className="font-bold text-xs text-[#C03704] mb-1.5 uppercase">
                    ⚠️ Poin yang Bikin Ragu:
                  </div>
                  <p className="text-slate-700 leading-relaxed">{demoData.weakness}</p>
                </div>

                <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-sm">
                  <div className="font-bold text-xs text-[#15803D] mb-1.5 uppercase">
                    ✅ Rekomendasi Jawaban Alternatif:
                  </div>
                  <p className="text-slate-700 leading-relaxed italic">{demoData.suggestion}</p>
                </div>
              </div>
            </div>

            {/* Callout */}
            <div className="mt-6 pt-5 border-t border-dashed border-[#D2E2F7] flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#4F637E]">
              <span>Ingin latihan pakai suaramu sendiri untuk pertanyaan lengkap?</span>
              <Link
                href="/interview/new"
                className="px-5 py-2.5 rounded-full bg-[#F26A2B] hover:bg-[#D85619] text-white font-bold text-sm shadow-md transition-all active:scale-98"
              >
                Mulai Sesi Gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== KENAPA WAWANCARAIN ==================== */}
      <section id="kenapa" className="py-20 bg-[#F8FBFF] border-b border-[#D2E2F7]">
        <div className="max-w-[1140px] mx-auto px-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Sidebar */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <span className="inline-block px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] font-bold text-xs uppercase tracking-wide mb-3">
                Pembeda Jujur
              </span>
              <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1B2A41] mb-4">
                Bukan sekadar ChatGPT yang disuruh jadi HRD.
              </h2>
              <p className="text-[#4F637E] text-base leading-relaxed mb-6">
                Prompting ChatGPT sendiri seringkali menghasilkan pujian palsu (<em>&ldquo;Bagus sekali jawabanmu!&rdquo;</em>) yang tidak mencerminkan ekspektasi rekruter Indonesia yang sesungguhnya.
              </p>
              <div className="inline-block bg-white border border-[#D2E2F7] px-4 py-3 rounded-2xl text-sm font-semibold text-[#2F67BB] shadow-xs">
                📍 Dirancang khusus untuk karakter & standar dunia kerja Indonesia.
              </div>
            </div>

            {/* 4 Cards */}
            <div className="lg:col-span-7 space-y-4.5">
              <div className="bg-white border-2 border-[#D2E2F7] hover:border-[#2F67BB] rounded-2xl p-6 transition-all hover:translate-x-1 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2FE] flex items-center justify-center text-2xl shrink-0">
                  🇮🇩
                </div>
                <div>
                  <h3 className="font-fraunces text-lg font-bold text-[#1B2A41] mb-1">
                    Bahasa Indonesia Kontekstual & Realistis
                  </h3>
                  <p className="text-sm text-[#4F637E] leading-relaxed">
                    Mendeteksi gaya bicara kita sehari-hari, termasuk penggunaan kata pengisi berlebihan (
                    <em>&ldquo;anu...&rdquo;, &ldquo;kayak...&rdquo;, &ldquo;gimana ya&rdquo;</em>) yang sering bikin nilai interview turun.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-[#D2E2F7] hover:border-[#2F67BB] rounded-2xl p-6 transition-all hover:translate-x-1 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2FE] flex items-center justify-center text-2xl shrink-0">
                  🎯
                </div>
                <div>
                  <h3 className="font-fraunces text-lg font-bold text-[#1B2A41] mb-1">
                    Bank Soal Sesuai Loker yang Dituju
                  </h3>
                  <p className="text-sm text-[#4F637E] leading-relaxed">
                    Pertanyaan untuk Staff Administrasi beda total dengan Management Trainee atau Junior Programmer. Kamu dilatih menghadapi pertanyaan teknis maupun studi kasus nyata.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-[#D2E2F7] hover:border-[#2F67BB] rounded-2xl p-6 transition-all hover:translate-x-1 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2FE] flex items-center justify-center text-2xl shrink-0">
                  📊
                </div>
                <div>
                  <h3 className="font-fraunces text-lg font-bold text-[#1B2A41] mb-1">
                    Skor Metrik & Histori Perkembangan
                  </h3>
                  <p className="text-sm text-[#4F637E] leading-relaxed">
                    Tiap sesi tersimpan rapi. Kamu bisa melihat skor struktur jawaban, kejelasan kalimat, dan keyakinan diri yang terus naik dari sesi ke sesi.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-[#D2E2F7] hover:border-[#2F67BB] rounded-2xl p-6 transition-all hover:translate-x-1 flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EAF2FE] flex items-center justify-center text-2xl shrink-0">
                  ☕
                </div>
                <div>
                  <h3 className="font-fraunces text-lg font-bold text-[#1B2A41] mb-1">
                    Harga Masuk Akal Buat Mahasiswa
                  </h3>
                  <p className="text-sm text-[#4F637E] leading-relaxed">
                    Bisa beli per sesi hanya Rp10.000 (seharga es teh kampus). Nggak perlu komitmen jutaan rupiah cuma buat mengasah mental bicara.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== HARGA / BIAYA ==================== */}
      <section id="harga" className="py-20 bg-white border-b border-[#D2E2F7]">
        <div className="max-w-[1140px] mx-auto px-5">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] font-bold text-xs uppercase tracking-wide mb-3">
              Pilihan Paket
            </span>
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1B2A41]">
              Investasi kecil buat jemput kerja pertama
            </h2>
            <p className="text-[#4F637E] text-base mt-2 max-w-lg mx-auto">
              Pilih fleksibel sesuai kebutuhan jadwal wawancaramu.
            </p>
          </div>

          {/* Banner Coba Gratis 1 Sesi */}
          <div className="max-w-3xl mx-auto mb-10 p-4 rounded-2xl bg-[#EAF2FE] border border-[#CBDFF9] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#2F67BB] text-white flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1B2A41]">
                  Baru pertama kali mencoba Wawancarain?
                </p>
                <p className="text-xs text-[#4F637E]">
                  Dapatkan <span className="font-bold text-[#F26A2B]">1 Sesi Gratis Penuh</span> otomatis saat mendaftar akun baru, tanpa kartu kredit.
                </p>
              </div>
            </div>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-full bg-[#2F67BB] hover:bg-[#1B2A41] text-white text-xs sm:text-sm font-bold transition-all whitespace-nowrap shadow-xs"
            >
              Daftar & Coba Gratis →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 items-stretch">
            {/* Paket 1: 1 Sesi Latihan (Rp 10.000) */}
            <div className="bg-white border-2 border-[#D2E2F7] rounded-3xl p-7 flex flex-col transition-all hover:-translate-y-1 hover:shadow-card">
              <div className="mb-2">
                <span className="px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] text-xs font-bold tracking-wide uppercase">
                  Starter
                </span>
              </div>
              <h3 className="font-fraunces text-xl font-bold text-[#1B2A41] mb-2 mt-1">1 Sesi Latihan</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-lg font-bold text-[#1B2A41]">Rp</span>
                <span className="font-fraunces text-4xl font-bold text-[#1B2A41]">10.000</span>
                <span className="text-xs text-[#4F637E]">/ sekali bayar (+1 sesi)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4F637E] mb-5 min-h-[40px]">
                Cocok untuk persiapan kilat H-1 wawancara. Bayar pas butuh tanpa komitmen terikat.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#1B2A41] mb-6 flex-grow">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>1 Sesi wawancara lengkap (5-10 pertanyaan)</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mode suara realistis & subtitle realtime</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Laporan evaluasi STAR lengkap</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Nilai & feedback rinci untuk setiap jawaban</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Unduh hasil wawancara ke PDF Scorecard</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="w-full py-3 rounded-full border-2 border-[#D2E2F7] hover:border-[#2F67BB] hover:bg-[#EAF2FE] text-[#1B2A41] font-bold text-sm text-center transition-colors"
              >
                Beli 1 Sesi Sekarang
              </Link>
            </div>

            {/* Paket 2: Paket 5 Sesi (Highlight Rp 40.000 - Paling Populer) */}
            <div className="bg-[#FFFDFB] border-2 border-[#F26A2B] rounded-3xl p-7 flex flex-col relative transition-all hover:-translate-y-1 shadow-lg shadow-[#F26A2B]/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F26A2B] text-white text-xs font-bold tracking-wide shadow-sm whitespace-nowrap">
                Paling Populer Buat Fresh Grad
              </div>
              <h3 className="font-fraunces text-xl font-bold text-[#1B2A41] mb-2 mt-1">Paket 5 Sesi (Siap Kerja)</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-lg font-bold text-[#F26A2B]">Rp</span>
                <span className="font-fraunces text-4xl font-extrabold text-[#F26A2B]">40.000</span>
                <span className="text-xs text-[#4F637E]">/ hemat Rp 8.000/sesi</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4F637E] mb-5 min-h-[40px]">
                Paling diminati fresh graduate menjelang seleksi kerja untuk asah kepercayaan diri berulang.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#1B2A41] mb-6 flex-grow">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>5 Sesi simulasi fleksibel kapan saja</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Pilihan gaya HRD (Ramah, Tegas, Stress Interview)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Simulasi untuk berbagai posisi & perusahaan</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Grafik radar perkembangan 5 rubrik kompetensi</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Contoh kalimat jawaban alternatif yang lebih kuat</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prioritas pemrosesan AI & simpan PDF</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="w-full py-3 rounded-full bg-[#F26A2B] hover:bg-[#D85619] text-white font-bold text-sm text-center shadow-md transition-all active:scale-98"
              >
                Pilih Paket 5 Sesi Sekarang
              </Link>
            </div>

            {/* Paket 3: Langganan 1 Bulan (PRO Rp 99.000) */}
            <div className="bg-white border-2 border-[#D2E2F7] rounded-3xl p-7 flex flex-col transition-all hover:-translate-y-1 hover:shadow-card">
              <div className="mb-2">
                <span className="px-3 py-1 rounded-full bg-[#2F67BB] text-white text-xs font-bold tracking-wide uppercase">
                  Akses PRO
                </span>
              </div>
              <h3 className="font-fraunces text-xl font-bold text-[#1B2A41] mb-2 mt-1">Langganan 1 Bulan (PRO)</h3>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-lg font-bold text-[#1B2A41]">Rp</span>
                <span className="font-fraunces text-4xl font-bold text-[#1B2A41]">99.000</span>
                <span className="text-xs text-[#4F637E]">/ 30 hari penuh</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4F637E] mb-5 min-h-[40px]">
                Khusus kamu yang lagi gencar kirim puluhan lamaran dan terjadwal wawancara berulang.
              </p>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#1B2A41] mb-6 flex-grow">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span><strong>Latihan sepuasnya tanpa batas sesi selama 30 hari</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Status akun resmi berubah menjadi <strong>PRO Aktif</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Akses ke seluruh database posisi & gaya HRD</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Simulasi pertanyaan jebakan HRD & Technical User</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Grafik riwayat progres peningkatan skor</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Prioritas akses model AI terbaru</span>
                </li>
              </ul>
              <Link
                href="/pricing"
                className="w-full py-3 rounded-full border-2 border-[#D2E2F7] hover:border-[#2F67BB] hover:bg-[#EAF2FE] text-[#1B2A41] font-bold text-sm text-center transition-colors"
              >
                Pilih Paket Bulanan (PRO)
              </Link>
            </div>
          </div>

          {/* B2B Banner */}
          <div className="bg-[#EAF2FE] border border-[#CBDFF9] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase text-[#2F67BB] block mb-1">
                Untuk Mitra Kampus & Bootcamp
              </span>
              <p className="text-sm text-[#1B2A41]">
                Mau sediakan akun latihan massal untuk mahasiswa tingkat akhir atau peserta bootcamp Anda
                dengan dashboard kelulusan karier?
              </p>
            </div>
            <a
              href="mailto:halo@wawancarain.id?subject=Kerjasama%20Kampus%20Bootcamp"
              className="text-sm font-bold text-[#2F67BB] hover:text-[#F26A2B] hover:underline whitespace-nowrap"
            >
              Hubungi Tim Kemitraan Kami →
            </a>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="py-20 bg-[#F8FBFF] border-b border-[#D2E2F7]">
        <div className="max-w-[760px] mx-auto px-5">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-[#EAF2FE] text-[#2F67BB] font-bold text-xs uppercase tracking-wide mb-3">
              Pertanyaan Sering Ditanyakan
            </span>
            <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-[#1B2A41]">
              Jawaban jujur atas pertanyaanmu
            </h2>
          </div>

          <div className="space-y-3.5">
            {FAQ_LIST.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all ${
                    isOpen ? 'border-[#2F67BB] shadow-sm' : 'border-[#D2E2F7]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left font-bold text-base text-[#1B2A41] flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#2F67BB] shrink-0 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-[#4F637E] leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== FINAL CTA ==================== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-[1140px] mx-auto px-5">
          <div className="bg-gradient-to-br from-[#1B2A41] to-[#243B5C] text-white rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="font-fraunces text-3xl sm:text-4xl font-bold text-white mb-4">
                Jadikan wawancara pertamamu bukan tempat uji coba.
              </h2>
              <p className="text-base text-[#D2E2F7] mb-8 leading-relaxed">
                Bikin kesalahanmu di sini sekarang, supaya pas hari H di hadapan rekruter impianmu, kamu
                tinggal tampil tenang dan meyakinkan.
              </p>
              <div className="flex flex-col items-center gap-3">
                <Link
                  href="/interview/new"
                  className="px-8 py-4 rounded-full bg-[#F26A2B] hover:bg-[#D85619] text-white font-bold text-base shadow-lg shadow-[#F26A2B]/30 hover:shadow-xl transition-all active:scale-98"
                >
                  Mulai Latihan Wawancara Gratis
                </Link>
                <span className="text-xs text-[#9BB8DE]">
                  Butuh waktu kurang dari 2 menit untuk sesi pertamamu.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-[#F1F6FD] border-t border-[#D2E2F7] pt-14 pb-8 text-[#4F637E]">
        <div className="max-w-[1140px] mx-auto px-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-10">
            {/* Brand Col */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5 mb-3">
                <svg width="28" height="28" viewBox="0 0 512 512" aria-hidden="true" className="shrink-0">
                  <rect width="512" height="512" rx="110" fill="#2F67BB" />
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
                <span className="font-fraunces text-2xl font-bold text-[#1B2A41]">
                  Wawancarain<span className="text-[#F26A2B]">.</span>
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-4 max-w-sm">
                Teman latihan wawancara berbasis AI untuk mahasiswa & lulusan baru di Indonesia. Bangun
                kepercayaan diri, raih kesempatan kariermu.
              </p>
              <div className="text-xs font-semibold text-[#2F67BB]">
                📍 Indonesia • Dirancang untuk Mahasiswa & Fresh Graduate
              </div>
            </div>

            {/* Nav Links */}
            <div className="lg:col-span-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B2A41] mb-3">
                Navigasi
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#cara-kerja" className="hover:text-[#2F67BB]">Cara Kerja</a></li>
                <li><a href="#demo" className="hover:text-[#2F67BB]">Simulasi Demo</a></li>
                <li><a href="#kenapa" className="hover:text-[#2F67BB]">Pembeda Kami</a></li>
                <li><a href="#harga" className="hover:text-[#2F67BB]">Daftar Biaya</a></li>
                <li><a href="#faq" className="hover:text-[#2F67BB]">Tanya Jawab</a></li>
              </ul>
            </div>

            {/* Legal & Auth */}
            <div className="lg:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1B2A41] mb-3">
                Akun & Akses
              </h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-[#2F67BB]">Masuk ke Akun</Link></li>
                <li><Link href="/register" className="hover:text-[#2F67BB]">Daftar Akun Baru (Gratis 1 Sesi)</Link></li>
                <li><Link href="/interview/new" className="hover:text-[#2F67BB]">Latihan Langsung sebagai Tamu</Link></li>
                <li><a href="mailto:halo@wawancarain.id" className="hover:text-[#2F67BB]">Hubungi Kami (halo@wawancarain.id)</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#D2E2F7] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <p>© 2026 Wawancarain. Hak cipta dilindungi undang-undang.</p>
            <p className="text-[#2F67BB] font-medium">
              Dibuat santai dan hangat untuk para pejuang pencari kerja.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
