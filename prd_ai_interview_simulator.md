# PRODUCT REQUIREMENT DOCUMENT (PRD)

**Nama Produk:** Real-Time AI Interview Simulator  
**Versi:** 1.0  
**Tanggal:** 5 Oktober 2026  
**Status:** Draft / Proposal  

---

## 1. RINGKASAN PRODUK (EXECUTIVE SUMMARY)

### 1.1 Visi Produk
Menyediakan platform simulasi wawancara kerja berbasis AI secara *real-time* (suara) yang dapat membantu pencari kerja berlatih secara interaktif, mendapatkan evaluasi instan, dan meningkatkan kepercayaan diri sebelum wawancara sungguhan.

### 1.2 Masalah yang Dihadapi (Problem Statement)
* Banyak kandidat merasa gugup dan kurang persiapan saat menghadapi interview kerja (baik HRD maupun Technical).
* Sulit mendapatkan simulasi interview yang realistis dengan umpan balik (*feedback*) profesional secara instan.
* Biaya layanan *career coaching* atau simulasi interview manual relatif mahal.

### 1.3 Solusi (Proposed Solution)
Sistem wawancara interaktif interaktif berbasis suara (*real-time audio*) dengan pewawancara AI yang dapat menyesuaikan pertanyaan berdasarkan CV, deskripsi pekerjaan (Job Description), dan jenis interview yang dipilih (HRD vs Technical), serta memberikan laporan evaluasi mendalam setelah sesi selesai.

---

## 2. PENGGUNA & SKENARIO (USER PERSONA & FLOW)

### 2.1 Target Pengguna (User Persona)
* **First-time Job Seekers / Lulusan Baru:** Membutuhkan latihan dasar untuk menghadapi *HRD Interview*.
* **Experienced Professionals / Tech Switchers:** Membutuhkan latihan mendalam untuk *Technical Interview* sesuai domain teknologi spesifik.

### 2.2 Alur Pengguna (User Flow)
```
[Registrasi / Login] 
        │
        ▼
[Input Data: Position + Job Description + CV]
        │
        ▼
[Pilih Mode: HRD / Behavioral vs Technical]
        │
        ▼
[Cek Perangkat Audio (Mic & Speaker)]
        │
        ▼
[Sesi Interview Real-Time (15 Menit Free / Paid Session)]
        │
        ▼
[Sesi Selesai / Waktu Habis (00:00)]
        │
        ▼
[Generasi Laporan & Evaluasi (Scorecard)]
        │
        ▼
[Status Sesi Gratis Habis -> Modal Paywall / Halaman Langganan]
```

---

## 3. SPESIFIKASI FITUR (FEATURE SPECIFICATIONS)

### 3.1 Phase 1: Pre-Interview (Setup & Configurasi)

| ID | Nama Fitur | Deskripsi | Priority |
|---|---|---|---|
| F-101 | Profile & Job Input | Form untuk memasukkan Judul Posisi, Paste Teks Job Description, dan Upload File CV (PDF/DOCX). | High |
| F-102 | Interview Mode Selection | Pilihan mode: **HRD (Behavioral)** atau **Technical (Hard Skill & Logic)**. | High |
| F-103 | Audio Hardware Test | Halaman pengujian mikrofon (input level visualizer) dan pemutar suara otomatis sebelum masuk sesi. | Medium |

### 3.2 Phase 2: Sesi Interview Real-Time

| ID | Nama Fitur | Deskripsi | Priority |
|---|---|---|---|
| F-201 | Real-time Audio Conversation | AI mengajukan pertanyaan berbasis audio, mendengarkan respon pengguna, dan memberikan pertanyaan susulan secara kontekstual. | Critical |
| F-202 | Live Session Timer | Pemutar waktu mundur (*countdown timer*) 15:00 menit yang terlihat jelas di layar. | High |
| F-203 | Voice Visualizer | Indikator animasi gelombang suara saat AI atau pengguna sedang berbicara. | Medium |
| F-204 | Low-Time Alert | AI/Sistem memberikan notifikasi saat waktu tersisa 2 menit. | Low |
| F-205 | Auto End-Session | Sesi otomatis dihentikan tepat pada menit ke-15:00. | High |

### 3.3 Phase 3: Post-Interview & Monetisasi

| ID | Nama Fitur | Deskripsi | Priority |
|---|---|---|---|
| F-301 | Automated Scorecard | Penilaian otomatis (skor 1-100) berbasis kriteria: Struktur Jawaban, Relevansi, & Komunikasi. | High |
| F-302 | Transcript & Feedback Report | Tampilan transkrip lengkap percakapan beserta saran perbaikan jawaban (misal: penyesuaian metode STAR). | High |
| F-303 | Paywall & Subscription Gate | Mengunci tombol latihan baru jika sesi gratis 15 menit telah habis, mengarahkan pengguna ke opsi langganan/kuota. | High |
| F-304 | Payment Gateway Integration | Integrasi pembayaran lokal (QRIS, E-Wallet, Virtual Account) untuk isi ulang kuota / langganan bulanan. | High |

---

## 4. PERBEDAAN DETAIL PERAN AI (HRD VS TECH INTERVIEW)

### 4.1 HRD / Behavioral Interview Engine
* **Prompt Persona:** HR Specialist / Recruiter yang ramah namun evaluatif.
* **Fokus Pertanyaan:** Kepribadian, latar belakang, penanganan konflik, motivasi kerja, *soft skills*, dan ekspektasi gaji.
* **Metode Evaluasi:** Penilaian berbasis struktur jawaban metode **STAR** (*Situation, Task, Action, Result*).

### 4.2 Technical Interview Engine
* **Prompt Persona:** Senior Tech Lead / Engineering Manager yang berpatokan pada logika dan arsitektur.
* **Fokus Pertanyaan:** Pemahaman bahasa pemrogramman, konsep arsitektur sistem, *problem-solving*, pengolahan data, dan *edge cases*.
* **Metode Evaluasi:** Keakuratan konsep teknis, efisiensi solusi, dan kemampuan menjelaskan logika secara sistematis.

---

## 5. PERSYARATAN TEKNIS (TECHNICAL REQUIREMENTS)

* **Real-time Speech-to-Text (STT) & Text-to-Speech (TTS):** Menggunakan API dengan latensi rendah (< 2 detik) agar interaksi percakapan terasa natural.
* **Large Language Model (LLM):** LLM dengan kemampuan *system prompting* dinamis untuk memproses CV dan Job Description pengguna secara kontekstual.
* **Database Management:** Menyimpan data profil pengguna, transkrip percakapan, histori skor, dan status transaksi/kuota.
* **Web Audio API:** Pemrosesan input mic browser secara stabil tanpa terputus.

---

## 6. METRIK KEBERHASILAN (SUCCESS METRICS)

1. **Latensi Suara:** Rata-rata jeda waktu respon AI di bawah 2 detik per giliran bicara.
2. **Session Completion Rate:** > 85% pengguna menyelesaikan sesi 15 menit tanpa kendala teknis disconnection/audio drop.
3. **Conversion Rate:** > 8% pengguna gratis melakukan pembelian sesi/langganan setelah mencoba sesi 15 menit pertama.