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
