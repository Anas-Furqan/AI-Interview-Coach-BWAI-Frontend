export type Sender = 'ai' | 'user';

export interface Message {
  sender: Sender;
  text: string;
  timestamp: string;
}

export interface Analysis {
  score?: number;
  feedback?: string;
  hint?: string;
  exampleAnswer?: string;
}

export interface FinalAnalysis {
  finalScore: number;
  strengths: string;
  areasForImprovement: string;
  analytics?: {
    filler_count: number;
    avg_wpm: number;
    star_compliance: number;
    confidence_scores: Array<{ questionId: string; confidence: number; score: number }>;
  } | null;
}

export interface HudMetrics {
  fillerCount: number;
  wpm: number;
  confidenceScore: number;
  actionVerbDensity: number;
  panicFlag: boolean;
  starStatus: {
    hasSituation: boolean;
    hasTask: boolean;
    hasAction: boolean;
    hasResult: boolean;
    needsNudge: boolean;
  };
}
