const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');

export interface SessionCreatePayload {
  uid: string;
  roleId: string;
  companyContext: string;
  languageCode: 'en-US' | 'ur-PK';
}

export interface QuestionAnalyticsPayload {
  questionId: string;
  confidence: number;
  wpm: number;
  fillerCount: number;
  panic: boolean;
  starMissing: boolean;
  score: number;
}

export interface SessionFinalizePayload {
  finalScore: number;
  strengths: string[];
  improvements: string[];
}

export async function createSession(payload: SessionCreatePayload): Promise<{ sessionId: string }> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create session.');
  }

  return response.json();
}

export async function saveQuestionAnalytics(sessionId: string, payload: QuestionAnalyticsPayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/sessions/${sessionId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to save question analytics.');
  }
}

export async function finalizeSession(sessionId: string, payload: SessionFinalizePayload): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/sessions/${sessionId}/finalize`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to finalize session.');
  }
}

export async function getUserSessions(uid: string): Promise<{ sessions: Array<Record<string, unknown>> }> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/sessions/${uid}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user sessions.');
  }
  return response.json();
}
