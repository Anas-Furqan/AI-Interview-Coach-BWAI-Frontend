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
}

export interface HudMetrics {
  fillerCount: number;
  wpm: number;
  confidenceScore: number;
  actionVerbDensity: number;
  panicFlag: boolean;
}
