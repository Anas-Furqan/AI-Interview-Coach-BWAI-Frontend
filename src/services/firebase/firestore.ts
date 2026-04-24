const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
).replace(/\/$/, '');

export type JobStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

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

export interface JobApplicationRecord {
  id: string;
  jobId: string;
  recruiterId: string;
  candidateUid: string;
  candidateEmail: string;
  candidateName: string;
  status: 'APPLIED';
  createdAt?: unknown;
  updatedAt?: unknown;
}

function toSortableMillis(value: unknown): number {
  if (!value) return 0;

  if (typeof value === 'object' && value !== null && 'toMillis' in value && typeof (value as { toMillis: unknown }).toMillis === 'function') {
    try {
      return Number((value as { toMillis: () => number }).toMillis()) || 0;
    } catch {
      return 0;
    }
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return 0;
}

function sortJobsByNewest(jobs: JobRecord[]): JobRecord[] {
  return [...jobs].sort((left, right) => {
    const leftTime = toSortableMillis(left.createdAt);
    const rightTime = toSortableMillis(right.createdAt);
    return rightTime - leftTime;
  });
}

function mapJobSnapshot(snapshot: { id: string; data: () => Record<string, unknown> }): JobRecord {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    title: String(data.title || ''),
    company: String(data.company || ''),
    logoUrl: String(data.logoUrl || ''),
    description: String(data.description || ''),
    salary: String(data.salary || ''),
    status: (['PENDING', 'APPROVED', 'REJECTED'].includes(String(data.status)) ? data.status : 'PENDING') as JobStatus,
    recruiterId: String(data.recruiterId || ''),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createJob(payload: CreateJobPayload): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create job.');
  }

  const data = await response.json() as { id: string };
  return data.id;
}

export async function getJobsByStatus(status: JobStatus): Promise<JobRecord[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/firebase/jobs?status=${encodeURIComponent(status)}`);
  } catch {
    throw new Error('Backend is unavailable. Please ensure server is running on port 8000.');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch jobs by status.');
  }
  const data = await response.json() as { jobs: Array<Record<string, unknown>> };
  return sortJobsByNewest(data.jobs.map(item => mapJobSnapshot({ id: String(item.id || ''), data: () => item })));
}

export async function getRecruiterJobs(recruiterId: string): Promise<JobRecord[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/firebase/jobs?recruiterId=${encodeURIComponent(recruiterId)}`);
  } catch {
    throw new Error('Backend is unavailable. Please ensure server is running on port 8000.');
  }
  if (!response.ok) {
    throw new Error('Failed to fetch recruiter jobs.');
  }
  const data = await response.json() as { jobs: Array<Record<string, unknown>> };
  return sortJobsByNewest(data.jobs.map(item => mapJobSnapshot({ id: String(item.id || ''), data: () => item })));
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/jobs/${encodeURIComponent(jobId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update job status.');
  }
}

export async function applyToJob(
  jobId: string,
  recruiterId: string,
  candidateUid: string,
  candidateEmail: string,
  candidateName: string
): Promise<{ id: string; status: 'APPLIED' }> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/jobs/${encodeURIComponent(jobId)}/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recruiterId, candidateUid, candidateEmail, candidateName }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(String((data as { error?: string })?.error || 'Failed to apply to job.'));
  }

  return data as { id: string; status: 'APPLIED' };
}

export async function getRecruiterApplications(recruiterId: string): Promise<JobApplicationRecord[]> {
  const endpoints = [
    `${API_BASE_URL}/api/firebase/recruiter/${encodeURIComponent(recruiterId)}/applications`,
    `${API_BASE_URL}/api/firebase/recruiters/${encodeURIComponent(recruiterId)}/applications`,
    `${API_BASE_URL}/api/firebase/r/${encodeURIComponent(recruiterId)}/applications`,
  ];

  let data: { applications: Array<Record<string, unknown>> } | null = null;

  for (const endpoint of endpoints) {
    let response: Response;
    try {
      response = await fetch(endpoint);
    } catch {
      throw new Error('Backend is unavailable. Please ensure server is running on port 8000.');
    }
    if (response.ok) {
      data = await response.json() as { applications: Array<Record<string, unknown>> };
      break;
    }

    if (response.status !== 404) {
      throw new Error('Failed to fetch recruiter applications.');
    }
  }

  if (!data) {
    return [];
  }

  return data.applications.map(item => ({
    id: String(item.id || ''),
    jobId: String(item.jobId || ''),
    recruiterId: String(item.recruiterId || ''),
    candidateUid: String(item.candidateUid || ''),
    candidateEmail: String(item.candidateEmail || ''),
    candidateName: String(item.candidateName || ''),
    status: 'APPLIED',
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
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
