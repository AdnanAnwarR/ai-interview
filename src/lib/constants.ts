import { CandidateProfile } from '@/types/interview';

export const SESSION_DURATION_SECONDS = 15 * 60; // 15 minutes as per PRD
export const LOW_TIME_WARNING_SECONDS = 2 * 60;  // 2 minutes warning as per PRD F-204

export const SAMPLE_PROFILES: { label: string; profile: Partial<CandidateProfile> }[] = [
  {
    label: 'Frontend Developer (React/Next.js)',
    profile: {
      name: 'Rian Pratama',
      targetRole: 'Frontend Developer',
      experienceLevel: 'mid_level',
      jobDescription: `Tanggung Jawab:
- Mengembangkan antarmuka web modern dengan React, Next.js, dan Tailwind CSS.
- Mengoptimalkan performa web (Core Web Vitals) dan aksesibilitas.
- Mengintegrasikan REST API dan WebSocket untuk data real-time.
- Berkolaborasi dengan tim backend dan UI/UX Designer.

Kualifikasi:
- Pengalaman minimal 2 tahun dengan React / Next.js dan TypeScript.
- Memahami state management (Zustand/Redux), Git workflow, dan responsive design.`,
      cvContent: `Rian Pratama | Frontend Developer (2+ tahun pengalaman)
Tech Stack: React, Next.js, TypeScript, Tailwind CSS, REST API, Git.
Pengalaman:
- Frontend Engineer di PT Digital Nusa (2024 - Sekarang): Mengoptimalkan dashboard analytics sehingga LCP turun sebesar 35%. Mengembangkan 10+ fitur interaktif.
- Junior Web Dev di Freelance (2023 - 2024): Membuat responsive landing page dan e-commerce toko lokal.
Pendidikan: S1 Teknik Informatika (IPK 3.72).`
    }
  },
  {
    label: 'Backend Engineer (Go / Node.js)',
    profile: {
      name: 'Dina Safitri',
      targetRole: 'Backend Engineer',
      experienceLevel: 'mid_level',
      jobDescription: `Tanggung Jawab:
- Membangun microservices berkecepatan tinggi dengan Go/Node.js.
- Merancang schema PostgreSQL dan caching Redis.
- Menjamin security, unit testing, dan throughput API.

Kualifikasi:
- Menguasai Go atau Node.js / Express.
- Berpengalaman dengan database SQL, message broker (RabbitMQ/Kafka), dan Docker.`,
      cvContent: `Dina Safitri | Backend Engineer
Keahlian: Golang, Node.js, PostgreSQL, Docker, Redis, RESTful API.
Pengalaman:
- Software Engineer di FinTech Startup (2024 - Sekarang): Membangun modul pembayaran instan dengan traffic 50k req/menit.
- Mahasiswa Lulusan Ilmu Komputer 2023.`
    }
  },
  {
    label: 'HR / Business Analyst (Fresh Graduate)',
    profile: {
      name: 'Aulia Rahma',
      targetRole: 'People Operations / HR Associate',
      experienceLevel: 'fresh_graduate',
      jobDescription: `Tanggung Jawab:
- Mendukung proses talent acquisition dan screening kandidat.
- Mengatur jadwal wawancara dan komunikasi onboarding karyawan baru.
- Menangani administrasi HR dan employee engagement.

Kualifikasi:
- Lulusan S1 Psikologi, Manajemen, atau jurusan terkait.
- Kemampuan komunikasi interpersonal yang tinggi, empati, dan teliti.`,
      cvContent: `Aulia Rahma | Fresh Graduate Psikologi (IPK 3.80)
Pengalaman Organisasi:
- Kepala Divisi HR BEM Fakultas: Memimpin rekrutmen 60 panitia dan mengelola team building.
- Magang HR Intern di PT Sumber Makmur (3 bulan): Membantu proses seleksi awal 200+ pelamar kerja.`
    }
  }
];

export const PRICING_TIERS = [
  {
    id: 'single_session',
    name: '1 Sesi Tambahan',
    price: 'Rp 29.000',
    description: '1 sesi interview 15 menit + evaluasi Scorecard STAR lengkap.',
    sessions: 1,
    popular: false,
    badge: 'Coba Lagi'
  },
  {
    id: 'pro_pack',
    name: 'Paket Siap Kerja (5 Sesi)',
    price: 'Rp 99.000',
    originalPrice: 'Rp 145.000',
    description: '5 sesi simulasi (HRD & Technical) + prioritas latensi AI tercepat.',
    sessions: 5,
    popular: true,
    badge: 'Paling Populer'
  },
  {
    id: 'unlimited_monthly',
    name: 'Unlimited 30 Hari',
    price: 'Rp 199.000',
    originalPrice: 'Rp 350.000',
    description: 'Latihan sepuasnya tanpa batas waktu selama 1 bulan penuh.',
    sessions: 999,
    popular: false,
    badge: 'Super Hemat'
  }
];
