'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/services/firebase/firebase.client';
import type { UserRole } from '@/src/services/auth';

type ResolvedRole = UserRole | null;

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  role: ResolvedRole;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchRole(uid: string): Promise<ResolvedRole> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) {
    return 'candidate';
  }

  const role = snapshot.data()?.role;
  if (role === 'candidate' || role === 'recruiter' || role === 'admin') {
    return role;
  }

  return 'candidate';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState<ResolvedRole>(null);

  const refreshRole = async () => {
    if (!auth.currentUser) {
      setRole(null);
      return;
    }

    try {
      const nextRole = await fetchRole(auth.currentUser.uid);
      setRole(nextRole);
    } catch {
      setRole('candidate');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async currentUser => {
      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setAuthLoading(false);
        return;
      }

      try {
        const nextRole = await fetchRole(currentUser.uid);
        setRole(nextRole);
      } catch {
        setRole('candidate');
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ user, authLoading, role, refreshRole }), [user, authLoading, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider.');
  }
  return context;
}
