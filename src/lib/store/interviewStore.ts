import { InterviewSession, InterviewConfig, InterviewResult, UserDashboardData } from '@/types/wawancara';

// Server-side in-memory store for sessions and user balances
// Memastikan aplikasi berjalan mulus baik saat database lokal aktif maupun fallback

interface GlobalInterviewState {
  sessions: Map<string, InterviewSession>;
  userBalance: {
    sessionsRemaining: number;
    plan: 'free' | 'pro' | 'unlimited';
  };
}

const globalForStore = globalThis as unknown as {
  __interviewStore?: GlobalInterviewState;
};

if (!globalForStore.__interviewStore) {
  // Initial seed with demo historical session for fresh dashboard view
  const demoSessionId = 'demo-sesi-1';
  const initialMap = new Map<string, InterviewSession>();

  const demoSession: InterviewSession = {
    id: demoSessionId,
    config: {
      companyName: 'Bank Central Asia (BCA)',
      targetRole: 'Management Trainee / IT Specialist',
      level: 'fresh_graduate',
      interviewerStyle: 'ramah',
      questionCount: 5,
      answerMode: 'suara',
    },
    status: 'completed',
    currentQuestionIndex: 5,
    totalQuestions: 5,
    messages: [
      {
        id: 'msg-1',
        sender: 'ai',
        text: 'Halo! Selamat datang di sesi wawancara Bank Central Asia (BCA). Bisakah Anda menceritakan tentang diri Anda dan apa motivasi Anda melamar posisi Management Trainee ini?',
        timestamp: Date.now() - 600000,
        questionIndex: 1,
      },
      {
        id: 'msg-2',
        sender: 'user',
        text: 'Halo Ibu, perkenalkan saya Rian Pratama, lulusan S1 Sistem Informasi tahun 2025. Semasa kuliah saya aktif memimpin proyek sistem perbankan simulasi dan magang 6 bulan sebagai digital analyst. Saya tertarik dengan BCA karena budaya integritas dan percepatan digitalisasi finansial yang sangat berorientasi pada kepuasan nasabah.',
        timestamp: Date.now() - 500000,
        questionIndex: 1,
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    result: {
      interviewId: demoSessionId,
      companyName: 'Bank Central Asia (BCA)',
      targetRole: 'Management Trainee / IT Specialist',
      level: 'fresh_graduate',
      interviewerStyle: 'ramah',
      date: new Date(Date.now() - 86400000).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      totalScore: 88,
      summary: 'Performa sangat solid untuk tingkat fresh graduate. Komunikasi terstruktur, artikulasi tenang, dan motivasi terhadap BCA tersampaikan dengan jelas.',
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
          userAnswer: 'Halo Ibu, perkenalkan saya Rian Pratama, lulusan S1 Sistem Informasi. Semasa kuliah saya aktif memimpin proyek dan magang 6 bulan sebagai digital analyst. Saya tertarik dengan BCA karena budaya integritas dan percepatan digitalisasinya.',
          score: 88,
          strengths: 'Pengenalan diri ringkas, lugas, dan relevan dengan bidang perbankan modern.',
          improvements: 'Sertakan satu capaian terukur utama selama magang agar pembuka langsung memikat pewawancara.',
          starCriteria: {
            situation: true,
            task: true,
            action: true,
            result: true,
          },
          betterAnswerExample: 'Selamat pagi Ibu Sarah. Saya Rian, lulusan S1 Sistem Informasi dengan fokus transformasi digital. Selama magang 6 bulan di industri tekno-finansial, saya menganalisis alur transaksi 10.000+ pengguna dan membantu mereduksi latensi sebesar 20%. Saya memilih BCA karena reputasi kokoh dalam keandalan sistem dan integritas pelayanan nasabah.',
        },
        {
          questionIndex: 2,
          questionText: 'Bisakah Anda menceritakan pengalaman ketika Anda menghadapi tenggat waktu yang sangat ketat dalam tim?',
          userAnswer: 'Saat tugas akhir bersama tim 4 orang, salah satu anggota sakit seminggu sebelum rilis. Saya mengambil inisiatif membagi ulang sisa modul prioritas dan memimpin sinkronisasi harian agar proyek selesai tepat waktu.',
          score: 86,
          strengths: 'Menunjukkan inisiatif kepemimpinan dan adaptabilitas di bawah tekanan.',
          improvements: 'Perjelas tindakan konkret dalam mengelola stres tim agar tidak burnout.',
          starCriteria: {
            situation: true,
            task: true,
            action: true,
            result: true,
          },
          betterAnswerExample: 'Pada semester akhir, kami menghadapi deadline sprint prototipe sementara rekan frontend sakit. Saya memetakan fitur non-esensial ke backlog sekunder, mengambil alih integrasi API utama, dan menyelenggarakan daily standup 10 menit. Hasilnya, aplikasi selesai 1 hari lebih cepat dan meraih predikat nilai A.',
        },
      ],
    },
  };

  initialMap.set(demoSessionId, demoSession);

  globalForStore.__interviewStore = {
    sessions: initialMap,
    userBalance: {
      sessionsRemaining: 1, // 1 sesi gratis awal untuk user baru
      plan: 'free',
    },
  };
}

export const interviewStore = {
  createSession(config: InterviewConfig): InterviewSession {
    const id = 'intv-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const session: InterviewSession = {
      id,
      config,
      status: 'ready',
      currentQuestionIndex: 1,
      totalQuestions: config.questionCount,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalForStore.__interviewStore!.sessions.set(id, session);
    return session;
  },

  getSession(id: string): InterviewSession | undefined {
    return globalForStore.__interviewStore!.sessions.get(id);
  },

  updateSession(id: string, partial: Partial<InterviewSession>): InterviewSession | undefined {
    const existing = globalForStore.__interviewStore!.sessions.get(id);
    if (!existing) return undefined;
    const updated = {
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    globalForStore.__interviewStore!.sessions.set(id, updated);
    return updated;
  },

  getUserDashboardData(): UserDashboardData {
    const sessions = Array.from(globalForStore.__interviewStore!.sessions.values());
    const history = sessions.map((s) => ({
      id: s.id,
      date: new Date(s.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      companyName: s.config.companyName,
      targetRole: s.config.targetRole,
      level: s.config.level,
      totalScore: s.result?.totalScore ?? (s.status === 'completed' ? 82 : 0),
      status: (s.status === 'completed' ? 'completed' : 'in_progress') as 'completed' | 'in_progress',
    })).reverse();

    return {
      sessionsRemaining: globalForStore.__interviewStore!.userBalance.sessionsRemaining,
      plan: globalForStore.__interviewStore!.userBalance.plan,
      history,
    };
  },

  consumeSession(): boolean {
    const balance = globalForStore.__interviewStore!.userBalance;
    if (balance.sessionsRemaining > 0) {
      balance.sessionsRemaining -= 1;
      return true;
    }
    return false;
  },

  topUpSession(count: number, newPlan?: 'free' | 'pro' | 'unlimited') {
    const balance = globalForStore.__interviewStore!.userBalance;
    balance.sessionsRemaining += count;
    if (newPlan) {
      balance.plan = newPlan;
    }
  },
};
