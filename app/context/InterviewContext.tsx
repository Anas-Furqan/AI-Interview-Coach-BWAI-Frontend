'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { UserRole } from '@/src/services/auth';
import { useAuthContext } from '@/src/context/AuthContext';

interface InterviewContextValue {
  user: ReturnType<typeof useAuthContext>['user'];
  authLoading: boolean;
  role: UserRole | null;
  selectedRole: string;
  language: 'en' | 'ur';
  setSelectedRole: (role: string) => void;
  clearSelectedRole: () => void;
  setLanguage: (language: 'en' | 'ur') => void;
}

const InterviewContext = createContext<InterviewContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = 'ai-interview-selected-role';
const LANGUAGE_STORAGE_KEY = 'ai-interview-coach-lang';

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const { user, authLoading, role } = useAuthContext();
  const [selectedRole, setSelectedRoleState] = useState('');
  const [language, setLanguageState] = useState<'en' | 'ur'>('en');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setSelectedRoleState(localStorage.getItem(ROLE_STORAGE_KEY) || '');
    setLanguageState(localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'ur' ? 'ur' : 'en');
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    document.body.classList.toggle('urdu-mode', language === 'ur');
  }, [language]);

  const setSelectedRole = (role: string) => {
    setSelectedRoleState(role);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    }
  };

  const clearSelectedRole = () => {
    setSelectedRoleState('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  };

  const setLanguage = (nextLanguage: 'en' | 'ur') => {
    setLanguageState(nextLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    }
  };

  const value = useMemo(
    () => ({ user, authLoading, role, selectedRole, language, setSelectedRole, clearSelectedRole, setLanguage }),
    [user, authLoading, role, selectedRole, language]
  );

  return <InterviewContext.Provider value={value}>{children}</InterviewContext.Provider>;
}

export function useInterviewContext() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterviewContext must be used inside InterviewProvider.');
  }
  return context;
}
