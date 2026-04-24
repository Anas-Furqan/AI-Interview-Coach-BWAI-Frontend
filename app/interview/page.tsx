'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import InterviewDashboard from '@/components/interview/InterviewDashboard';
import { useInterviewContext } from '../context/InterviewContext';

export default function InterviewPage() {
  const router = useRouter();
  const { user, authLoading, role, selectedRole, hydrated } = useInterviewContext();

  useEffect(() => {
    if (authLoading || !hydrated) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    // Only CANDIDATE can take interviews
    if (role !== 'CANDIDATE') {
      if (role === 'RECRUITER') {
        router.replace('/recruiter/dashboard');
      } else if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    if (!selectedRole) {
      router.replace('/dashboard');
    }
  }, [authLoading, hydrated, user, role, selectedRole, router]);

  if (authLoading || !hydrated) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress sx={{ color: 'var(--accent)' }} />
      </Box>
    );
  }

  if (!user || !selectedRole || role !== 'CANDIDATE') {
    return null;
  }

  return <InterviewDashboard />;
}
