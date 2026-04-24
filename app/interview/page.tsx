'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';
import InterviewDashboard from '@/components/interview/InterviewDashboard';
import { useInterviewContext } from '../context/InterviewContext';

export default function InterviewPage() {
  const router = useRouter();
  const { user, authLoading, selectedRole } = useInterviewContext();

  useEffect(() => {
    if (authLoading) return;

    if (!user || !selectedRole) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, selectedRole, router]);

  if (authLoading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !selectedRole) {
    return null;
  }

  return <InterviewDashboard />;
}
