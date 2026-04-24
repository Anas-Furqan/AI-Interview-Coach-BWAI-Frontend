'use client';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase.client';

export type UserRole = 'candidate' | 'recruiter' | 'admin';

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080'
).replace(/\/$/, '');

async function ensureUserRoleDocument(role: UserRole = 'candidate') {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const existing = await getDoc(userRef);

  if (existing.exists()) {
    return;
  }

  await setDoc(userRef, {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function signInWithGoogle(preferredLanguage: 'en' | 'ur' = 'en', role: UserRole = 'candidate') {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserRoleDocument(role);
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
  await ensureUserRoleDocument('candidate');
  return syncAuthenticatedUser(preferredLanguage);
}

export async function registerWithEmailPassword(
  name: string,
  email: string,
  password: string,
  preferredLanguage: 'en' | 'ur' = 'en',
  role: UserRole = 'candidate'
) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  await credential.user.reload();
  await ensureUserRoleDocument(role);
  return syncAuthenticatedUser(preferredLanguage);
}

export async function logout() {
  await signOut(auth);
}
