import axios from 'axios';
import { Analysis, FinalAnalysis, Message } from '@/components/interview/types';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const API_URL = `${API_BASE_URL}/api/interview`;
export const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8080').replace(/\/$/, '');

export interface NextStepResponse {
  conversationalResponse: string;
  audioContent: string | null;
  postAnswerAnalysis: Analysis | null;
  preAnswerAnalysis: Analysis | null;
  nextPhase: string;
  cvText: string;
  userName: string;
}

export interface StarNudgeResponse {
  nudge: string;
  starMissing: boolean;
  score: number;
}

export interface SessionQuestionMetric {
  questionId: string;
  confidence: number;
  wpm: number;
  fillerCount: number;
  panic: boolean;
  starMissing: boolean;
  score: number;
  createdAt?: string;
}

export interface SessionMessage {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export interface SessionReportResponse {
  session: {
    id: string;
    finalScore?: number;
    strengths?: string[];
    improvements?: string[];
    transcript?: SessionMessage[];
    metricsTimeline?: SessionQuestionMetric[];
    [key: string]: unknown;
  };
  questionAnalytics: Array<SessionQuestionMetric & { id: string }>;
}

export async function startSession(formData: FormData): Promise<NextStepResponse> {
  const response = await axios.post(`${API_URL}/next-step`, formData);
  return response.data;
}

export async function submitAnswer(formData: FormData): Promise<NextStepResponse> {
  const response = await axios.post(`${API_URL}/next-step`, formData);
  return response.data;
}

export async function getSummary(payload: {
  fullChatHistory: Message[];
  analysisHistory: Analysis[];
  language: string;
}): Promise<FinalAnalysis> {
  const response = await axios.post(`${API_URL}/summarize`, payload);
  return response.data;
}

export async function getStarNudge(payload: { transcript: string; question: string; language: string }): Promise<StarNudgeResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/analytics/star-nudge`, payload);
    return response.data;
  } catch (error) {
    console.warn('STAR nudge request failed. Using fallback nudge.', error);
    return {
      nudge: 'Use STAR: set context, define your task, explain actions, and end with a measurable result.',
      starMissing: true,
      score: 5,
    };
  }
}

export async function createFirestoreSession(payload: {
  uid: string;
  roleId: string;
  companyContext: string;
  languageCode: 'en-US' | 'ur-PK';
}): Promise<{ sessionId: string }> {
  const response = await axios.post(`${API_BASE_URL}/api/firebase/sessions`, payload);
  return response.data;
}

export async function appendSessionQuestionMetric(
  sessionId: string,
  payload: SessionQuestionMetric
): Promise<{ ok: boolean }> {
  const response = await axios.post(`${API_BASE_URL}/api/firebase/sessions/${sessionId}/questions`, payload);
  return response.data;
}

export async function finalizeFirestoreSession(
  sessionId: string,
  payload: {
    finalScore: number;
    strengths: string[];
    improvements: string[];
    transcript: SessionMessage[];
    metricsTimeline: SessionQuestionMetric[];
  }
): Promise<{ ok: boolean }> {
  const response = await axios.patch(`${API_BASE_URL}/api/firebase/sessions/${sessionId}/finalize`, payload);
  return response.data;
}

export async function getSessionReport(sessionId: string): Promise<SessionReportResponse> {
  const response = await axios.get(`${API_BASE_URL}/api/firebase/sessions/report/${sessionId}`);
  return response.data;
}
