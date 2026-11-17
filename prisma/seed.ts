import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Memulai seeding database Wawancarain...');

  // 1. Seed Demo User (Fresh Graduate Candidate)
  const user = await prisma.user.upsert({
    where: { email: 'kandidat@wawancarain.id' },
    update: {},
    create: {
      email: 'kandidat@wawancarain.id',
      name: 'Rian Pratama',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rian',
      credits: 3, // Saldo awal
      subscriptionUntil: null,
    },
  });

  console.log(`User seeded: ${user.name} (${user.email}) - Sisa Sesi: ${user.credits}`);

  // 2. Seed Example Completed Interview Session
  const session = await prisma.interviewSession.create({
    data: {
      userId: user.id,
      company: 'Bank Central Asia (BCA)',
      position: 'Management Trainee / IT Specialist',
      level: 'fresh_graduate',
      style: 'ramah',
      totalQuestions: 5,
      status: 'FINISHED',
      startedAt: new Date(Date.now() - 3600000),
      endedAt: new Date(Date.now() - 2700000),
      messages: {
        create: [
          {
            role: 'assistant',
            content: 'Halo Rian, selamat datang di sesi seleksi Bank Central Asia. Bisakah Anda memperkenalkan diri secara singkat dan apa motivasi Anda melamar posisi Management Trainee ini?',
            questionIndex: 1,
            createdAt: new Date(Date.now() - 3500000),
          },
          {
            role: 'user',
            content: 'Halo Ibu Sarah, perkenalkan saya Rian Pratama, lulusan S1 Sistem Informasi tahun 2025. Semasa kuliah saya aktif memimpin proyek sistem informasi dan magang 6 bulan sebagai digital analyst. Saya tertarik dengan BCA karena budaya integritas dan percepatan digitalisasinya.',
            questionIndex: 1,
            createdAt: new Date(Date.now() - 3400000),
          },
          {
            role: 'assistant',
            content: 'Bagus sekali penjelasannya. Pertanyaan kedua: Bisakah Anda menceritakan pengalaman saat Anda menghadapi tenggat waktu yang sangat ketat dalam tim, dan bagaimana langkah konkret Anda menyelesaikannya?',
            questionIndex: 2,
            createdAt: new Date(Date.now() - 3300000),
          },
          {
            role: 'user',
            content: 'Saat proyek tugas akhir bersama tim 4 orang, salah satu anggota jatuh sakit seminggu sebelum rilis. Saya mengambil inisiatif membagi ulang sisa modul prioritas, menyelenggarakan daily standup 15 menit, dan mengambil alih integrasi API. Hasilnya proyek selesai 1 hari lebih cepat dengan nilai A.',
            questionIndex: 2,
            createdAt: new Date(Date.now() - 3100000),
          },
        ],
      },
      evaluation: {
        create: {
          overallScore: 88,
          json: {
            overallScore: 88,
            summary: 'Performa sangat solid untuk tingkat fresh graduate. Komunikasi terstruktur dengan penguasaan metode STAR yang baik.',
            topStrengths: [
              'Penyampaian latar belakang relevan dengan target posisi Management Trainee.',
              'Artikulasi tenang dan pemahaman yang baik tentang budaya integritas BCA.',
              'Menggunakan contoh konkret dari proyek akhir dan pengalaman magang.',
            ],
            topImprovements: [
              'Dapat menambahkan metrik kuantitatif pada hasil proyek kuliah untuk memperkuat pilar Result.',
              'Perjelas langkah kepemimpinan pribadi saat menghadapi perbedaan pendapat tim.',
              'Kaitkan lebih spesifik bagaimana inovasi digital Anda dapat membantu efisiensi nasabah ritel.',
            ],
            radarRubric: {
              relevansi: 90,
              strukturSTAR: 85,
              kejelasan: 92,
              kepercayaanDiri: 88,
              contohNyata: 84,
            },
            answers: [
              {
                questionIndex: 1,
                questionText: 'Ceritakan tentang diri Anda dan motivasi Anda melamar posisi Management Trainee di Bank Central Asia?',
                userAnswer: 'Halo Ibu Sarah, perkenalkan saya Rian Pratama, lulusan S1 Sistem Informasi. Semasa kuliah saya aktif memimpin proyek dan magang 6 bulan sebagai digital analyst.',
                score: 88,
                strengths: 'Pengenalan diri ringkas, lugas, dan relevan dengan industri tekno-finansial.',
                improvements: 'Sertakan satu capaian terukur utama selama magang agar pembuka langsung memikat pewawancara.',
                starCriteria: { situation: true, task: true, action: true, result: true },
                betterAnswerExample: 'Selamat pagi Ibu Sarah. Saya Rian, lulusan S1 Sistem Informasi dengan fokus transformasi digital. Selama magang 6 bulan di industri tekno-finansial, saya menganalisis alur transaksi 10.000+ pengguna dan membantu mereduksi latensi sebesar 20%.',
              },
              {
                questionIndex: 2,
                questionText: 'Bisakah Anda menceritakan pengalaman saat menghadapi tenggat waktu yang sangat ketat dalam tim?',
                userAnswer: 'Saat proyek tugas akhir bersama tim 4 orang, salah satu rekan sakit seminggu sebelum rilis. Saya mengambil inisiatif membagi ulang sisa modul prioritas dan memimpin daily standup.',
                score: 88,
                strengths: 'Penyampaian STAR sangat rapi (Situation, Task, Action, dan Result terpenuhi lengkap).',
                improvements: 'Bisa dipaparkan sedikit bagaimana cara menjaga moral tim agar tidak stres.',
                starCriteria: { situation: true, task: true, action: true, result: true },
                betterAnswerExample: 'Pada semester akhir, kami menghadapi deadline sprint prototipe sementara rekan frontend sakit. Saya memetakan fitur non-esensial ke backlog sekunder dan menyelenggarakan daily standup 10 menit. Hasilnya aplikasi selesai 1 hari lebih cepat.',
              },
            ],
          },
        },
      },
    },
  });

  console.log(`Interview session seeded with evaluation: ${session.id}`);

  // 3. Seed Sample Order
  const order = await prisma.order.create({
    data: {
      id: `ORDER-SEED-${Date.now()}`,
      userId: user.id,
      packageId: 'pack_5_sessions',
      amount: 20000,
      status: 'PAID',
      snapToken: 'snap_token_seed_sample',
      paidAt: new Date(),
    },
  });

  console.log(`Order seeded: ${order.id} (Status: ${order.status})`);
  console.log('Seeding selesai 100%!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
