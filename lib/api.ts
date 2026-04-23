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

export async function startSession(formData: FormData): Promise<NextStepResponse> {
  const response = await axios.post(`${API_URL}/next-step`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
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
