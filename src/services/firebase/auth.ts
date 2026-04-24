'use client';

import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase.client';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');

export async function signInWithGoogle(preferredLanguage: 'en' | 'ur' = 'en') {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  await fetch(`${API_BASE_URL}/api/firebase/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, preferredLanguage }),
  });

  return result.user;
}

export async function logout() {
  await signOut(auth);
}
