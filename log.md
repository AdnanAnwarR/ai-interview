# Development Progress Log

Dokumen ini mencatat seluruh pembaruan, implementasi fitur, dan riwayat commit untuk proyek **Real-Time AI Interview Simulator**.

---

## [2026-10-05 20:54] - Inisialisasi Fondasi Proyek & Arsitektur Utama

### 1. Inisialisasi Fondasi & Framework
- Inisialisasi Git repository pada workspace.
- Setup template **Next.js 16 (App Router)** dengan **React 19**, **TypeScript**, dan **Tailwind CSS**.
- Instalasi dependensi pendukung UI & interaktivitas: `lucide-react`, `clsx`, `tailwind-merge`, `canvas-confetti`, `@types/canvas-confetti`.

### 2. Tipe Data Domain (`src/types/interview.ts`)
- `CandidateProfile`: Data nama, role target, job description, CV content/file, pengalaman, dan mode interview.
- `InterviewMode`: Mode `'hrd'` (Behavioral / STAR) dan `'technical'` (Hard skill / Architecture).
- `InterviewStatus`: Siklus status interview (`idle`, `testing_hardware`, `in_progress`, `low_time_alert`, `evaluating`, `completed`, `paywall`).
- `ChatMessage`: Entri riwayat percakapan suara/teks real-time.
- `ScorecardReport`: Struktur evaluasi otomatis 1–100, rincian skor (*structure*, *relevance*, *communication*, *domainExpertise*), analisis STAR, rekomendasi *hiring*, dan saran perbaikan.
- `UserSubscription`: Manajemen status sesi gratis (15 menit) dan kuota berbayar.

### 3. Modul Suara & Web Audio API (`src/lib/audio/`)
- `src/lib/audio/webAudio.ts`: Implementasi `AudioContext` dan `AnalyserNode` untuk memantau level input mikrofon secara real-time (0–100%) dan sintesis nada uji harmonik speaker/headphone tanpa file aset eksternal.
- `src/lib/audio/speechEngine.ts`: Engine STT (Speech-to-Text) dan TTS (Text-to-Speech) berbasis Web Speech API dengan penanganan suara Bahasa Indonesia (`id-ID`) dan fallback toleran error.

### 4. Sistem Prompting AI Berdasarkan PRD (`src/lib/ai/prompts.ts`)
- **HRD Engine:** Persona Sarah (Senior Recruiter ramah & evaluatif, penggalian kerangka STAR, giliran bicara pendek 2–3 kalimat).
- **Technical Engine:** Persona Alex (Senior Tech Lead berbasis data, arsitektur, trade-off, concurrency, dan edge cases).
- **Scorecard Generator Prompt:** Penilaian terstruktur JSON mencakup STAR framework.

### 5. Backend API Routes (`src/app/api/interview/`)
- `POST /api/interview/chat`: Endpoint percakapan wawancara giliran demi giliran, mendukung Gemini API secara langsung dengan fallback cerdas kontekstual jika API key belum diisi.
- `POST /api/interview/evaluate`: Endpoint kalkulasi Scorecard otomatis dan generasi laporan STAR mendalam.

### 6. Komponen Antarmuka Pengguna (UI)
- `src/components/Navbar.tsx`: Header dengan indikator sesi live, status audio, dan kuota 15 menit gratis.
- `src/components/PreInterview/AudioHardwareModal.tsx`: Pengujian mic visualizer dan pemutar nada speaker sebelum wawancara dimulai (PRD F-103).

---

## [2026-10-05 20:56] - Implementasi Lengkap Phase 1, Phase 2, & Phase 3 (End-to-End Flow)

### 1. Phase 1: Pre-Interview UI (`src/components/PreInterview/`)
- `SetupForm.tsx`:
  - Form input Profil Kandidat, Posisi Target, dan Pengalaman (`fresh_graduate`, `mid_level`, `senior`).
  - Pemilihan Mode Wawancara: **HRD (Behavioral / STAR)** vs **Technical (Lead / Hard skill)**.
  - Form Job Description (wajib) & Input Ringkasan / Unggah File CV (PDF/DOCX/TXT).
  - Quick presets: 1-click template untuk Frontend Developer (Next.js), Backend Engineer (Go/Node.js), dan HR Associate Fresh Graduate.

### 2. Phase 2: Live Interview Session Room (`src/components/LiveSession/`)
- `AudioVisualizer.tsx`:
  - Visualisasi gelombang audio dinamis bereaksi secara real-time saat AI berbicara (ungu/indigo) dan kandidat berbicara (hijau/cyan).
- `LiveCountdownTimer.tsx`:
  - Countdown timer 15:00 menit (PRD F-202).
  - Peringatan audio & visual saat sisa waktu < 2 menit (PRD F-204).
  - Terminasi otomatis sesi tepat di 00:00 (PRD F-205).
- `InterviewRoom.tsx`:
  - Percakapan suara real-time dua arah (STT & TTS dengan bahasa Indonesia).
  - Visualizer live, kontrol mute mikrofon, dan fallback text chat jika kandidat berada di tempat bising.
  - Auto-scroll transkrip percakapan langsung.
  - Tombol penghentian manual sesi kapan saja.

### 3. Phase 3: Post-Interview Scorecard & Monetisasi (`src/components/PostInterview/`, `src/components/Monetization/`)
- `ScorecardView.tsx`:
  - Tampilan Scorecard otomatis (1–100) dilengkapi perayaan konfeti jika lulus.
  - 4 pilar rincian nilai: *Structure (STAR)*, *Relevance*, *Communication*, dan *Domain Expertise*.
  - Evaluasi mendalam kerangka STAR (Situation, Task, Action, Result) per jawaban kandidat.
  - Poin kekuatan utama (*Key Strengths*) dan saran perbaikan konkret (*Improvement Tips*).
  - Accordion riwayat transkrip lengkap percakapan dan tombol salin hasil evaluasi ke clipboard.
- `PaywallModal.tsx`:
  - Mengunci akses latihan baru jika kuota sesi gratis 15 menit telah habis (PRD F-303).
  - Pilihan paket fleksibel (1 Sesi, 5 Sesi Siap Kerja, dan Unlimited 30 Hari).
  - Simulasi pembayaran QRIS (visual barcode NMID), E-Wallet (GoPay/OVO), dan Virtual Account dengan top-up kuota instan (PRD F-304).

### 4. Integrasi Halaman Utama (`src/app/page.tsx`)
- State machine siklus wawancara: `idle` -> `testing_hardware` -> `in_progress` -> `evaluating` -> `completed` -> `paywall`.
- Pengujian build produksi (`npm run build`) berhasil 100% tanpa error via Next.js Turbopack.

---

## [2026-10-05 21:03] - Perbaikan Deteksi Suara Real-Time (STT) & Pengiriman Otomatis Jawaban

### Masalah yang Ditemukan:
- Sesi Web Speech Recognition di browser Chromium/Edge sering mengalami `onend` (timeout senyap) setelah jeda diam beberapa detik, sehingga sistem mengira mikrofon masih aktif padahal proses perekam di browser sudah terhenti.
- Suara yang terucap belum otomatis dikirim ke percakapan karena menunggu event `isFinal` yang kadang terpecah oleh jeda bicara pendek.
- Visualizer belum membaca langsung gelombang fisik dari mikrofon saat sesi interview aktif.

### Solusi & Peningkatan yang Diimplementasikan:
1. **Ketahanan SpeechEngine (`src/lib/audio/speechEngine.ts`):**
   - Menambahkan mekanisme auto-reconnect pada event `onend` saat user masih dalam status giliran bicara.
   - Perbaikan handling state `isListening` agar tidak mengalami dead-lock.
   - Sanitasi teks sebelum dikirim ke TTS (menghapus format markdown karakter yang tidak perlu dibaca).
2. **Buffer Suara & Auto-Send Silence Timer (`src/components/LiveSession/InterviewRoom.tsx`):**
   - Menambahkan buffer akumulasi ucapan secara langsung (`live spoken buffer`), sehingga kata-kata yang diucapkan kandidat langsung tampil di layar secara *real-time*.
   - Deteksi jeda hening: Ketika kandidat selesai berbicara (jeda hening ~2 detik), countdown otomatis muncul di layar dan jawaban langsung terkirim ke AI tanpa harus mengetik manual.
   - Tombol instan **"Selesai Bicara & Kirim Jawaban Sekarang"** agar kandidat dapat mengirimkan jawaban ucapan seketika tanpa harus menunggu hening.
   - Integrasi level input fisik mikrofon (`Web Audio API`) di ruang interview agar gelombang visualizer langsung menari mengikuti suara asli pengguna.
3. **Penyempurnaan Visualizer (`src/components/LiveSession/AudioVisualizer.tsx`):**
   - Indikator bar gelombang suara membesar dan beranimasi sesuai desibel level mic kandidat secara *real-time*.

---

## [2026-10-05 21:06] - Menghubungkan Repository Remote GitHub & Sinkronisasi Branch

- Menambahkan Git Remote Origin: `https://github.com/AdnanAnwarR/ai-interview.git`.
- Mengatur upstream tracking branch ke `origin/main`.
- Berhasil melakukan *initial push* seluruh fondasi proyek, dokumentasi PRD, fitur Pre-Interview, Live Session Audio Visualizer, STAR Scorecard, Paywall, dan riwayat progress ke GitHub.

---

## [2026-10-05 21:17] - Integrasi Open-Source LLM (Groq LLaMA 3.3 70B) & Solusi Bug Pengulangan Pertanyaan

### Masalah yang Ditemukan (User Feedback):
1. **Pengulangan Pertanyaan & Respons Template:** Karena belum ada API key, sistem masuk ke *hardcoded fallback* yang setelah giliran ke-3 terus mengulang pertanyaan: `"Bagus sekali penjelasannya... Adakah pertanyaan yang ingin Anda tanyakan kepada saya...?"`.
2. **AI Tidak Nyambung dengan Respons Pengguna:** Jawaban seperti *"tidak ada"* atau kata kasar tidak direspon secara alami sesuai konteks percakapan manusiawi.

### Solusi & Peningkatan yang Diimplementasikan:
1. **Integrasi Open-Source LLM (Groq Cloud - LLaMA 3.3 70B / LLaMA 3.1 8B):**
   - Menggunakan model open-source dari Meta (**LLaMA 3.3 70B Versatile**) yang di-host gratis dan ultra-cepat (&lt; 0.4 detik) melalui Groq.
   - Membuat komponen antarmuka baru: [`src/components/Settings/LlmSettingsModal.tsx`](file:///C:/projek%20techno/projek/src/components/Settings/LlmSettingsModal.tsx) dengan tombol uji koneksi langsung (*Live Connection Ping*) dan panduan mendapatkan API key gratis dari `console.groq.com/keys`.
   - Menambahkan tombol status LLM pada [`Navbar.tsx`](file:///C:/projek%20techno/projek/src/components/Navbar.tsx) (`LLaMA 3.3 Aktif` / `Atur Open-Source LLM`).
2. **Penyempurnaan Engine Cerdas Bawaan (Saat Tanpa API Key):**
   - **Deteksi Kata Kasar / Profanity:** AI (Sarah / Alex) menegur secara tegas dan profesional jika kandidat menggunakan bahasa kasar/tidak pantas, serta menanyakan keseriusan kandidat untuk melanjutkan secara profesional.
   - **Deteksi Jawaban Singkat / "Tidak Ada":** Jika kandidat menjawab *"tidak ada"* pada pertanyaan penutup, AI menyimpulkan bahwa seluruh pertanyaan sudah selesai dan langsung mengarahkan ke laporan evaluasi akhir (tidak mengulang pertanyaan lagi).
   - **Deteksi Pertanyaan Balik dari Kandidat:** Jika kandidat bertanya seputar budaya kerja, teknologi/tech stack, atau ekspektasi gaji, AI menjawab pertanyaan tersebut secara realistis terlebih dahulu sebelum beralih ke giliran berikutnya.
   - **Multi-Turn Queue Bebas Duplikasi:** Pertanyaan tersusun dalam antrean tematik berjenjang (perkenalan, konflik tim/arsitektur, kegagalan/trade-off, prioritas kerja, visi karier, penutup) sehingga tidak pernah mengulang pertanyaan yang sama.
3. **Peningkatan Evaluasi Scorecard (`/api/interview/evaluate`):**
   - Jika terdeteksi kata-kata kasar dalam transkrip percakapan, sistem secara otomatis memberikan penalti skor komunikasi, saran etika kerja, dan status kelulusan *Not Ready*.

---

## [2026-10-05 21:19] - Perbaikan React SSR Hydration Mismatch

### Masalah yang Ditemukan:
- Muncul peringatan di console browser:
  `A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.`
  Hal ini disebabkan oleh pengecekan nilai state client (`localStorage` untuk Groq API Key dan badge di Navbar) yang berbeda antara saat server me-render HTML awal dan saat client me-mount komponen, serta ekstensi browser yang menyuntikkan atribut ke tag `<html>` / `<body>`.

### Solusi yang Diimplementasikan:
1. Menambahkan atribut `suppressHydrationWarning` pada tag `<html>` dan `<body>` di [`src/app/layout.tsx`](file:///C:/projek%20techno/projek/src/app/layout.tsx).
2. Menambahkan state `mounted` di [`src/app/page.tsx`](file:///C:/projek%20techno/projek/src/app/page.tsx) untuk memastikan badge Navbar dan pembacaan `localStorage` hanya diaktifkan setelah komponen selesai di-mount pada sisi client (`mounted ? !!groqApiKey : false`), sehingga struktur HTML server dan client 100% identik saat hydration.
3. Memperbarui metadata judul aplikasi di `layout.tsx` menjadi *"Real-Time AI Interview Simulator"*.
