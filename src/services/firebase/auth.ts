'use client';

import { AuthError, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from './firebase.client';

export type UserRole = 'CANDIDATE' | 'RECRUITER' | 'ADMIN';

export interface DemoAuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  getIdToken: () => Promise<string>;
  reload: () => Promise<void>;
}

const DEMO_SESSION_KEY = 'ai-interview-demo-session';
const DEMO_AUTH_EVENT = 'demo_auth_changed';
const AUTH_COOKIE = 'ai_auth';
const ROLE_COOKIE = 'ai_role';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
).replace(/\/$/, '');

function normalizeRole(role: unknown): UserRole {
  const value = String(role || '').toUpperCase();
  if (value === 'RECRUITER' || value === 'ADMIN') return value;
  return 'CANDIDATE';
}

function getRoleFromCookie(): UserRole {
  if (typeof document === 'undefined') return 'CANDIDATE';
  const match = document.cookie.match(/(?:^|;\s*)ai_role=([^;]+)/i);
  return normalizeRole(match?.[1] || 'CANDIDATE');
}

function setAuthCookies(role: UserRole) {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${AUTH_COOKIE}=1; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=${role}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookies() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${ROLE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function normalizeAuthError(error: unknown): Error {
  const authError = error as AuthError;
  const code = String(authError?.code || '');

  if (code.includes('auth/invalid-credential')) {
    return new Error('Invalid email or password. Please check your credentials.');
  }
  if (code.includes('auth/user-not-found')) {
    return new Error('No account found with this email. Please register first.');
  }
  if (code.includes('auth/wrong-password')) {
    return new Error('Incorrect password. Please try again.');
  }
  if (code.includes('auth/weak-password')) {
    return new Error('Password should be at least 6 characters.');
  }
  if (code.includes('auth/email-already-in-use')) {
    return new Error('This email is already in use. Please log in instead.');
  }
  if (code.includes('auth/popup-closed-by-user')) {
    return new Error('Google sign-in popup was closed. Please try again.');
  }
  if (code.includes('auth/popup-blocked')) {
    return new Error('Popup was blocked by your browser. Please allow popups and try again.');
  }
  if (code.includes('auth/unauthorized-domain')) {
    return new Error('This domain is not authorized for Google sign-in. Add it in Firebase Authentication settings.');
  }

  return error instanceof Error ? error : new Error('Authentication failed. Please try again.');
}

export function getDemoAuthSession(): { user: DemoAuthUser; role: UserRole } | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as { user: { uid: string; email: string; displayName: string; photoURL: string | null }; role: UserRole };
    if (!parsed?.user?.uid || !parsed?.user?.email || !parsed?.role) {
      return null;
    }

    return {
      role: parsed.role,
      user: {
        uid: parsed.user.uid,
        email: parsed.user.email,
        displayName: parsed.user.displayName,
        photoURL: parsed.user.photoURL,
        getIdToken: async () => 'demo-token',
        reload: async () => undefined,
      },
    };
  } catch {
    return null;
  }
}

export function setDemoAuthSession(session: { user: DemoAuthUser; role: UserRole }) {
  if (typeof window === 'undefined') return;
  setAuthCookies(session.role);
  window.localStorage.setItem(
    DEMO_SESSION_KEY,
    JSON.stringify({
      role: session.role,
      user: {
        uid: session.user.uid,
        email: session.user.email,
        displayName: session.user.displayName,
        photoURL: session.user.photoURL,
      },
    })
  );
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
}

export function clearDemoAuthSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEMO_SESSION_KEY);
  clearAuthCookies();
  window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
}

export function isDemoPortalCredentials(email: string, password: string) {
  return false;
}

export function buildDemoAuthSession(email: string): { user: DemoAuthUser; role: UserRole } | null {
  return null;
}

async function getSignedInUserRole(uid: string): Promise<UserRole> {
  const response = await fetch(`${API_BASE_URL}/api/firebase/users/${encodeURIComponent(uid)}`);
  if (!response.ok) {
    return 'CANDIDATE';
  }
  const data = await response.json().catch(() => ({}));
  return normalizeRole((data as { user?: { role?: unknown } })?.user?.role);
}

export async function signInWithGoogle(preferredLanguage: 'en' | 'ur' = 'en', role: UserRole = 'CANDIDATE') {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    const response = await fetch(`${API_BASE_URL}/api/firebase/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, preferredLanguage, requestedRole: role }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync signed-in user with backend Firestore.');
    }

    const data = await response.json().catch(() => ({}));
    const resolvedRole = normalizeRole((data as { role?: unknown }).role || role);
    setAuthCookies(resolvedRole);
    return resolvedRole;
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

async function syncAuthenticatedUser(preferredLanguage: 'en' | 'ur' = 'en', requestedRole: UserRole = 'CANDIDATE'): Promise<UserRole> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found to sync.');
  }

  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/firebase/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, preferredLanguage, requestedRole }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync signed-in user with backend Firestore.');
  }

  const data = await response.json().catch(() => ({}));
  return normalizeRole((data as { role?: unknown }).role || requestedRole);
}

export async function signInWithEmailPassword(email: string, password: string, preferredLanguage: 'en' | 'ur' = 'en'): Promise<UserRole> {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    const role = await syncAuthenticatedUser(preferredLanguage, 'CANDIDATE');
    setAuthCookies(role);
    return role;
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function registerWithEmailPassword(
  name: string,
  email: string,
  password: string,
  preferredLanguage: 'en' | 'ur' = 'en',
  role: UserRole = 'CANDIDATE'
) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name.trim()) {
      await updateProfile(credential.user, { displayName: name.trim() });
    }
    await credential.user.reload();
    const resolvedRole = await syncAuthenticatedUser(preferredLanguage, role);
    setAuthCookies(resolvedRole);
    return resolvedRole;
  } catch (error) {
    throw normalizeAuthError(error);
  }
}

export async function logout() {
  clearDemoAuthSession();
  await signOut(auth);
}

export async function updateCurrentUserProfile(
  displayName: string,
  preferredLanguage: 'en' | 'ur' = 'en'
): Promise<UserRole> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found.');
  }

  const sanitizedName = displayName.trim();
  await updateProfile(user, { displayName: sanitizedName });

  try {
    const response = await fetch(`${API_BASE_URL}/api/firebase/users/${encodeURIComponent(user.uid)}/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: sanitizedName }),
    });

    if (!response.ok) {
      throw new Error('Failed to update profile.');
    }

    const role = await syncAuthenticatedUser(preferredLanguage, 'CANDIDATE');
    setAuthCookies(role);
    return role;
  } catch {
    // Keep UX responsive in demo mode if backend is temporarily unavailable.
    const fallbackRole = getRoleFromCookie();
    setAuthCookies(fallbackRole);
    return fallbackRole;
  }
}
