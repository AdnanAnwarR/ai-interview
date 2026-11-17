import { CandidateProfile, CompanyPreset } from '@/types/interview';

export const SESSION_DURATION_SECONDS = 15 * 60; // 15 menit
export const LOW_TIME_WARNING_SECONDS = 2 * 60;  // 2 menit peringatan

// Identitas Visual Wawancarain:
// Biru Primer: #4A8DF0, Biru Sekunder: #2F67BB
// Oranye (Tombol & Aksen Utama): #F26A2B
// Kuning (Aksen Kecil): #FFC857
// Navy (Teks Utama): #1B2A41
// Biru Muda (Latar Belakang): #EAF2FE
export const BRAND_COLORS = {
  bluePrimary: '#4A8DF0',
  blueDark: '#2F67BB',
  orange: '#F26A2B',
  orangeHover: '#d95316',
  yellow: '#FFC857',
  navy: '#1B2A41',
  bgLight: '#EAF2FE',
} as const;

export const POPULAR_COMPANIES: CompanyPreset[] = [
  {
    id: 'bca',
    name: 'Bank Central Asia (BCA)',
    category: 'Perbankan & Finance',
    defaultRole: 'Management Trainee / IT Trainee',
    cultureHint: 'Fokus pada integritas, pelayanan nasabah prima, ketelitian, dan kepatuhan regulasi finansial.',
  },
  {
    id: 'goto',
    name: 'GoTo (Gojek & Tokopedia)',
    category: 'Tech / Startup',
    defaultRole: 'Software Engineer / Product Associate',
    cultureHint: 'Agile, pemikiran kolaboratif, customer-obsessed, dan inovasi berbasis data.',
  },
  {
    id: 'shopee',
    name: 'Shopee Indonesia (Sea Group)',
    category: 'Tech / Startup',
    defaultRole: 'Business Operations / Frontend Engineer',
    cultureHint: 'Fast-paced, berorientasi hasil, resilience, adaptif pada volume transaksi tinggi.',
  },
  {
    id: 'telkom',
    name: 'Telkom Indonesia',
    category: 'BUMN',
    defaultRole: 'Digital Talent / Junior Cloud Engineer',
    cultureHint: 'AKHLAK (Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif) & transformasi digital nasional.',
  },
  {
    id: 'mandiri',
    name: 'Bank Mandiri',
    category: 'Perbankan & Finance',
    defaultRole: 'Officer Development Program (ODP)',
    cultureHint: 'Kepemimpinan, growth mindset, adaptasi perbankan digital, dan etika profesional.',
  },
  {
    id: 'paragon',
    name: 'Paragon Technology and Innovation',
    category: 'FMCG & Korporat',
    defaultRole: 'Management Trainee Marketing / Supply Chain',
    cultureHint: 'Ketuhanan, keteladanan, kekeluargaan, tanggung jawab, dan inovasi produk kecantikan.',
  },
  {
    id: 'traveloka',
    name: 'Traveloka',
    category: 'Tech / Startup',
    defaultRole: 'Product Manager / Data Analyst',
    cultureHint: 'First-principles thinking, customer empathy, sistem terdistribusi, dan otomasi cerdas.',
  },
  {
    id: 'astra',
    name: 'Astra International',
    category: 'FMCG & Korporat',
    defaultRole: 'Astra Graduate Program / Analyst',
    cultureHint: 'Filosofi Catur Dharma, integritas tinggi, kerja tim solid, dan keunggulan operasional.',
  },
];

export const SAMPLE_PROFILES: { label: string; profile: Partial<CandidateProfile> }[] = [
  {
    label: 'Frontend Developer (GoTo)',
    profile: {
      name: 'Rian Pratama',
      targetCompany: 'GoTo (Tokopedia)',
      targetRole: 'Junior Frontend Developer',
      experienceLevel: 'fresh_graduate',
      jobDescription: `Tanggung Jawab:
- Mengembangkan antarmuka web modern dengan React, Next.js, dan Tailwind CSS.
- Mengoptimalkan performa web (Core Web Vitals) dan aksesibilitas untuk jutaan pengguna.
- Mengintegrasikan REST API dan WebSocket untuk data real-time e-commerce.
- Berkolaborasi dengan tim cross-functional (Product, Backend, UI/UX).

Kualifikasi:
- Lulusan baru atau pengalaman < 1 tahun di React / Next.js dan TypeScript.
- Memahami konsep responsive design, asynchronous JavaScript, dan Git.`,
      cvContent: `Rian Pratama | Lulusan S1 Ilmu Komputer 2025 (IPK 3.82)
Tech Stack: React, Next.js, TypeScript, Tailwind CSS, REST API, Git.
Pengalaman:
- Magang Frontend Developer di PT Inovasi Solusi (6 bulan): Mengembangkan antarmuka katalog produk dan memperbaiki kecepatan load halaman sebesar 28%.
- Finalis Hackathon Nasional 2024 (Aplikasi Edukasi Mahasiswa).`
    }
  },
  {
    label: 'IT Trainee / Backend (Bank BCA)',
    profile: {
      name: 'Dina Safitri',
      targetCompany: 'Bank Central Asia (BCA)',
      targetRole: 'IT Trainee (Backend Track)',
      experienceLevel: 'fresh_graduate',
      jobDescription: `Tanggung Jawab:
- Membangun microservices yang aman, andal, dan berkecepatan tinggi dengan Go/Java.
- Merancang schema PostgreSQL, query optimization, dan caching.
- Menjamin kepatuhan standar keamanan data perbankan dan zero-downtime.

Kualifikasi:
- Lulusan S1 Teknik Informatika, Sistem Informasi, atau bidang terkait.
- Memahami algoritma dasar, struktur data, SQL database, dan RESTful API.`,
      cvContent: `Dina Safitri | Fresh Graduate Teknik Informatika (IPK 3.75)
Keahlian: Golang, Java, PostgreSQL, Docker, Redis, RESTful API.
Pengalaman Proyek:
- Proyek Tugas Akhir: Sistem transfer point reward dengan microservices dan unit testing 85% coverage.
- Asisten Laboratorium Basis Data (1 tahun).`
    }
  },
  {
    label: 'ODP / Management Trainee (Bank Mandiri)',
    profile: {
      name: 'Aulia Rahma',
      targetCompany: 'Bank Mandiri',
      targetRole: 'Officer Development Program (ODP)',
      experienceLevel: 'fresh_graduate',
      jobDescription: `Tanggung Jawab:
- Mengikuti rotasi divisi bisnis perbankan ritel, korporasi, dan digital banking.
- Memimpin inisiatif proyek strategis dan berkolaborasi dengan lintas divisi.
- Memberikan solusi finansial yang tepat guna bagi nasabah.

Kualifikasi:
- Lulusan S1 segala jurusan dengan IPK minimal 3.20.
- Memiliki kemampuan kepemimpinan, komunikasi persuasif, dan analytical thinking yang kuat.`,
      cvContent: `Aulia Rahma | Fresh Graduate Manajemen Bisnis (IPK 3.80)
Pengalaman Organisasi:
- Ketua Badan Eksekutif Mahasiswa (BEM) Fakultas: Memimpin 80 anggota panitia dan mengelola anggaran program kerja tahunan.
- Magang Corporate Planning di BUMN (4 bulan): Menyusun analisis kompetitor industri perbankan.`
    }
  }
];

export const PRICING_TIERS = [
  {
    id: 'single_session',
    name: '1 Sesi Latihan Tambahan',
    price: 'Rp 29.000',
    amount: 29000,
    description: '1 sesi wawancara 15 menit + evaluasi per-jawaban & scorecard STAR.',
    sessions: 1,
    popular: false,
    badge: 'Coba Lagi'
  },
  {
    id: 'pro_pack',
    name: 'Paket Siap Kerja (5 Sesi)',
    price: 'Rp 99.000',
    originalPrice: 'Rp 145.000',
    amount: 99000,
    description: '5 sesi simulasi (HRD & Technical) + umpan balik mendalam setiap jawaban.',
    sessions: 5,
    popular: true,
    badge: 'Paling Populer'
  },
  {
    id: 'unlimited_monthly',
    name: 'Paket Akses 30 Hari',
    price: 'Rp 199.000',
    originalPrice: 'Rp 350.000',
    amount: 199000,
    description: 'Latihan tak terbatas selama 1 bulan penuh menjelang interview impian Anda.',
    sessions: 999,
    popular: false,
    badge: 'Super Hemat'
  }
];
