'use client';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { auth, googleProvider } from './firebase.client';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');

export async function signInWithGoogle(preferredLanguage: 'en' | 'ur' = 'en') {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  const response = await fetch(`${API_BASE_URL}/api/firebase/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, preferredLanguage }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync signed-in user with backend Firestore.');
  }

  return result.user;
}

async function syncAuthenticatedUser(preferredLanguage: 'en' | 'ur' = 'en') {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user found to sync.');
  }

  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}/api/firebase/auth/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken, preferredLanguage }),
  });

  if (!response.ok) {
    throw new Error('Failed to sync signed-in user with backend Firestore.');
  }

  return user;
}

export async function signInWithEmailPassword(email: string, password: string, preferredLanguage: 'en' | 'ur' = 'en') {
  await signInWithEmailAndPassword(auth, email, password);
  return syncAuthenticatedUser(preferredLanguage);
}

export async function registerWithEmailPassword(name: string, email: string, password: string, preferredLanguage: 'en' | 'ur' = 'en') {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  await credential.user.reload();
  return syncAuthenticatedUser(preferredLanguage);
}

export async function logout() {
  await signOut(auth);
}
