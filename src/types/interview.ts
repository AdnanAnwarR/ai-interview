export type InterviewMode = 'hrd' | 'technical';

export type ExperienceLevel = 'fresh_graduate' | 'mid_level' | 'senior';

export type InterviewStatus = 
  | 'idle'               // Pre-interview setup (input profile & JD)
  | 'testing_hardware'   // Mic & speaker test modal
  | 'in_progress'        // Live interview ongoing
  | 'low_time_alert'     // Less than 2 minutes remaining
  | 'evaluating'         // AI calculating scorecard
  | 'completed'          // Scorecard and report displayed
  | 'paywall';           // Free session expired, subscription prompt

export interface CandidateProfile {
  name: string;
  targetRole: string;
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
  summaryFeedback: string;
  hiringRecommendation: 'Strong Hire' | 'Hire' | 'Borderline' | 'Not Ready';
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'unlimited';
  freeSessionUsed: boolean;
  sessionsRemaining: number;
}
