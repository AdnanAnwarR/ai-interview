export type InterviewMode = 'hrd' | 'technical';

export type ExperienceLevel = 'fresh_graduate' | 'mid_level' | 'senior';

export type InterviewStatus = 
  | 'idle'               // Pre-interview setup (input profile, company & JD)
  | 'testing_hardware'   // Mic & speaker test modal
  | 'in_progress'        // Live interview ongoing
  | 'low_time_alert'     // Less than 2 minutes remaining
  | 'evaluating'         // AI calculating scorecard
  | 'completed'          // Scorecard and report displayed
  | 'paywall';           // Free session expired, subscription prompt

export interface CandidateProfile {
  name: string;
  targetCompany: string; // Perusahaan yang dilamar (misal: Tokopedia, BCA, GoTo, BUMN, dll)
  targetRole: string;    // Posisi yang dilamar
  jobDescription: string;
  cvFileName?: string;
  cvContent: string;
  experienceLevel: ExperienceLevel;
  selectedMode: InterviewMode;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  durationSec?: number;
}

// Penilaian untuk setiap jawaban pengguna (Per-Answer Scoring)
export interface AnswerScore {
  questionIndex: number;
  questionText: string;
  answerText: string;
  score: number; // 0 - 100
  aspectScores: {
    relevance: number; // 0 - 100
    clarity: number;   // 0 - 100
    depth: number;     // 0 - 100
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
  starAnalysis?: {
    situation?: string;
    task?: string;
    action?: string;
    result?: string;
  };
}

export interface StarAnalysisItem {
  question: string;
  candidateAnswer: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  improvementTip: string;
}

export interface ScorecardReport {
  overallScore: number; // 1-100
  passed: boolean;
  scoreBreakdown: {
    structure: number;      // Structured answers (e.g. STAR)
    relevance: number;      // Alignment with JD and role
    communication: number;  // Tone, confidence, clarity
    domainExpertise: number;// Hard skill / technical accuracy
  };
  keyStrengths: string[];
  areasForImprovement: string[];
  starAnalysis?: StarAnalysisItem[];
  answerScores?: AnswerScore[]; // Nilai terinci untuk setiap jawaban
  summaryFeedback: string;
  hiringRecommendation: 'Strong Hire' | 'Hire' | 'Borderline' | 'Not Ready';
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'unlimited';
  freeSessionUsed: boolean;
  sessionsRemaining: number;
}

export interface CompanyPreset {
  id: string;
  name: string;
  category: 'Tech / Startup' | 'Perbankan & Finance' | 'BUMN' | 'FMCG & Korporat' | 'Agensi & Lainnya';
  defaultRole: string;
  cultureHint: string;
}
