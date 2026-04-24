import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase.client';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');

export type JobStatus = 'pending' | 'active' | 'rejected';

export interface JobRecord {
  id: string;
  title: string;
  company: string;
  logoUrl: string;
  description: string;
  salary: string;
  status: JobStatus;
  recruiterId: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CreateJobPayload {
  title: string;
  company: string;
  logoUrl: string;
  description: string;
  salary: string;
  recruiterId: string;
}

const jobsCollection = collection(db, 'jobs');

function mapJobSnapshot(snapshot: { id: string; data: () => Record<string, unknown> }): JobRecord {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: String(data.title || ''),
    company: String(data.company || ''),
    logoUrl: String(data.logoUrl || ''),
    description: String(data.description || ''),
    salary: String(data.salary || ''),
    status: (['pending', 'active', 'rejected'].includes(String(data.status)) ? data.status : 'pending') as JobStatus,
    recruiterId: String(data.recruiterId || ''),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createJob(payload: CreateJobPayload): Promise<string> {
  const created = await addDoc(jobsCollection, {
    ...payload,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return created.id;
}

export async function getJobsByStatus(status: JobStatus): Promise<JobRecord[]> {
  const jobsQuery = query(jobsCollection, where('status', '==', status), orderBy('createdAt', 'desc'));
  const snapshots = await getDocs(jobsQuery);
  return snapshots.docs.map(mapJobSnapshot);
}

export async function getRecruiterJobs(recruiterId: string): Promise<JobRecord[]> {
  const jobsQuery = query(jobsCollection, where('recruiterId', '==', recruiterId), orderBy('createdAt', 'desc'));
  const snapshots = await getDocs(jobsQuery);
  return snapshots.docs.map(mapJobSnapshot);
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
  const jobRef = doc(db, 'jobs', jobId);
  await updateDoc(jobRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}

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
