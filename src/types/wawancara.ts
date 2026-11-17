// Definisi Tipe Data Domain Wawancarain

export type CandidateLevel = 'magang' | 'fresh_graduate' | 'junior';

export type InterviewerStyle = 'ramah' | 'tegas' | 'stress';

export type QuestionCount = 5 | 8 | 10;

export type AnswerMode = 'suara' | 'ketik';

export interface InterviewConfig {
  companyName: string;
  targetRole: string;
  level: CandidateLevel;
  interviewerStyle: InterviewerStyle;
  questionCount: QuestionCount;
  answerMode: AnswerMode;
}

export interface InterviewMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: number;
  questionIndex?: number;
}

export interface StarCriteria {
  situation: boolean;
  task: boolean;
  action: boolean;
  result: boolean;
}

export interface AnswerEvaluation {
  questionIndex: number;
  questionText: string;
  userAnswer: string;
  score: number; // 0 - 100
  strengths: string;
  improvements: string;
  starCriteria: StarCriteria;
  betterAnswerExample: string;
}

export interface RadarRubric {
  relevansi: number;        // 0 - 100
  strukturSTAR: number;     // 0 - 100
  kejelasan: number;        // 0 - 100
  kepercayaanDiri: number;  // 0 - 100
  contohNyata: number;      // 0 - 100
}

export interface InterviewResult {
  interviewId: string;
  companyName: string;
  targetRole: string;
  level: CandidateLevel;
  interviewerStyle: InterviewerStyle;
  date: string;
  totalScore: number;       // 0 - 100
  summary: string;
  topStrengths: string[];   // 3 item
  topImprovements: string[];// 3 item
  radarRubric: RadarRubric;
  answers: AnswerEvaluation[];
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  status: 'ready' | 'in_progress' | 'completed' | 'aborted';
  currentQuestionIndex: number; // 1-based (misal: 1 dari 5)
  totalQuestions: number;
  messages: InterviewMessage[];
  createdAt: string;
  updatedAt: string;
  result?: InterviewResult;
}

export interface UserDashboardData {
  sessionsRemaining: number;
  plan: 'free' | 'pro' | 'unlimited';
  history: Array<{
    id: string;
    date: string;
    companyName: string;
    targetRole: string;
    level: string;
    totalScore: number;
    status: 'completed' | 'in_progress';
  }>;
}
