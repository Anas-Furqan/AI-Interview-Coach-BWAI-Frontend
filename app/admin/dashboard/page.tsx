'use client';

import { useEffect, useState, useMemo } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material';
import { getJobsByStatus, type JobRecord, updateJobStatus } from '@/src/services/firebase/firestore';
import { useInterviewContext } from '@/app/context/InterviewContext';
import { useRole } from '@/src/hooks/useRole';

export default function AdminDashboardPage() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const { authLoading, authorized } = useRole({ roles: ['admin'], redirectTo: '/dashboard' });
  const [loading, setLoading] = useState(true);
  const [pendingJobs, setPendingJobs] = useState<JobRecord[]>([]);
  const [error, setError] = useState('');

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'ایڈمن جاب منظوری',
      subtitle: 'زیر التواء ملازمتوں کا جائزہ لیں اور انہیں منظور یا مسترد کریں۔',
      noJobs: 'اس وقت کوئی زیر التواء ملازمت نہیں ہے۔',
      approve: 'منظور کریں',
      reject: 'مسترد کریں',
      salary: 'تنخواہ',
      error: 'ملازمتیں لوڈ کرنے میں ناکامی۔',
    } : {
      title: 'Admin Job Approval',
      subtitle: 'Review pending jobs and approve/reject them.',
      noJobs: 'No pending jobs right now.',
      approve: 'Approve',
      reject: 'Reject',
      salary: 'Salary',
      error: 'Failed to load pending jobs.',
    }
  ), [isUrdu]);

  const loadPendingJobs = async () => {
    try {
      setError('');
      setLoading(true);
      const jobs = await getJobsByStatus('pending');
      setPendingJobs(jobs);
    } catch (fetchError) {
      console.error(fetchError);
      setError('Failed to load pending jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && authorized) {
      void loadPendingJobs();
    }
  }, [authLoading, authorized]);

  if (authLoading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized) {
    return null;
  }

  const handleAction = async (jobId: string, status: 'active' | 'rejected') => {
    try {
      await updateJobStatus(jobId, status);
      setPendingJobs(previous => previous.filter(job => job.id !== jobId));
    } catch (actionError) {
      console.error(actionError);
      setError('Failed to update job status.');
    }
  };

  return (
    <Box
      minHeight="100vh"
      bgcolor="#f4f7fb"
      py={4}
      sx={{
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit'
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={2} mb={3}>
          <Typography variant="h4" fontWeight={700}>{copy.title}</Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>

        {loading ? (
          <Box display="grid" sx={{ placeItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : null}

        {!loading && pendingJobs.length === 0 ? (
          <Card>
            <CardContent>
              <Typography>{copy.noJobs}</Typography>
            </CardContent>
          </Card>
        ) : null}

        <Grid container spacing={2}>
          {pendingJobs.map(job => (
            <Grid item xs={12} md={6} key={job.id}>
              <Card sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography variant="h6" fontWeight={700}>{job.title}</Typography>
                    <Typography color="primary" fontWeight={600}>{job.company}</Typography>
                    <Typography variant="body2">{job.description}</Typography>
                    <Typography variant="subtitle2" sx={{ bgcolor: '#f1f5f9', px: 1, py: 0.5, borderRadius: 1, alignSelf: 'flex-start' }}>
                      {copy.salary}: {job.salary}
                    </Typography>
                    <Stack direction="row" spacing={1} mt={1}>
                      <Button
                        variant="contained"
                        onClick={() => void handleAction(job.id, 'active')}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        {copy.approve}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => void handleAction(job.id, 'rejected')}
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                      >
                        {copy.reject}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
