// Konfigurasi Paket & Harga Wawancarain
// Simpan di satu file konfigurasi agar mudah diubah sewaktu-waktu

export interface PricingPlan {
  id: string;
  name: string;
  tagline: string;
  price: number;
  formattedPrice: string;
  periodText?: string;
  sessions: number;
  isPopular?: boolean;
  badge?: string;
  features: string[];
}

export const PRICING_CONFIG: {
  currency: string;
  plans: PricingPlan[];
} = {
  currency: 'IDR',
  plans: [
    {
      id: 'single_session',
      name: '1 Sesi Latihan',
      tagline: 'Cocok untuk persiapan kilat H-1 wawancara',
      price: 5000,
      formattedPrice: 'Rp 5.000',
      periodText: 'sekali bayar',
      sessions: 1,
      isPopular: false,
      badge: 'Starter',
      features: [
        '1 Sesi wawancara interaktif (hingga 10 pertanyaan)',
        'Mode suara realistis (Web Speech id-ID)',
        'Subtitle streaming realtime',
        'Laporan evaluasi STAR lengkap',
        'Nilai & feedback rinci untuk setiap jawaban',
        'Unduh hasil wawancara ke PDF',
      ],
    },
    {
      id: 'pack_5_sessions',
      name: 'Paket 5 Sesi',
      tagline: 'Paling diminati fresh graduate menjelang seleksi kerja',
      price: 20000,
      formattedPrice: 'Rp 20.000',
      periodText: 'sekali bayar (Rp 4.000 / sesi)',
      sessions: 5,
      isPopular: true,
      badge: 'Paling Populer',
      features: [
        '5 Sesi wawancara fleksibel (kapan saja)',
        'Pilihan gaya HRD (Ramah, Tegas, Stress Interview)',
        'Simulasi untuk berbagai posisi & perusahaan target',
        'Grafik radar perkembangan 5 rubrik kompetensi',
        'Contoh jawaban ideal per pertanyaan',
        'Akses unduh ringkasan PDF selamanya',
        'Prioritas pemrosesan AI',
      ],
    },
    {
      id: 'unlimited_monthly',
      name: 'Langganan Bulanan',
      tagline: 'Latihan intensif tanpa batas selama 30 hari penuh',
      price: 25000,
      formattedPrice: 'Rp 25.000',
      periodText: 'per bulan (bebas latihan)',
      sessions: 9999,
      isPopular: false,
      badge: 'Super Hemat',
      features: [
        'Sesi latihan tanpa batas (unlimited) selama 30 hari',
        'Bebas coba seluruh gaya pewawancara',
        'Mode audio & webcam lokal picture-in-picture',
        'Analisis riwayat komprehensif di dashboard',
        'Rekomendasi jawaban terbaik berbasis framework STAR',
        'Dukungan prioritas & pembaruan bank pertanyaan',
      ],
    },
  ],
};
