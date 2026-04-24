'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { getRecruiterApplications, getRecruiterJobs, type JobApplicationRecord, type JobRecord } from '@/src/services/firebase/firestore';
import { useRole } from '@/src/hooks/useRole';
import { useInterviewContext } from '@/app/context/InterviewContext';
import { logout } from '@/src/services/auth';

export default function RecruiterDashboardPage() {
  const router = useRouter();
  const { language } = useInterviewContext();
  const { user, role, authLoading, authorized } = useRole({ roles: ['RECRUITER', 'ADMIN'], redirectTo: '/interview' });

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [applications, setApplications] = useState<JobApplicationRecord[]>([]);
  const [error, setError] = useState('');

  const isUrdu = language === 'ur';

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'ریکروٹر ڈیش بورڈ',
      subtitle: 'اپنی پوسٹ کی گئی جابز، ان کی اسٹیٹس اور امیدواروں کی درخواستیں دیکھیں۔',
      addJob: 'نئی جاب پوسٹ کریں',
      profile: 'پروفائل',
      logout: 'لاگ آؤٹ',
      noJobs: 'ابھی تک کوئی جاب پوسٹ نہیں کی گئی۔',
      noApplications: 'ابھی کوئی درخواست موصول نہیں ہوئی۔',
      applications: 'درخواستیں',
      postedJobs: 'آپ کی جابز',
      status: 'اسٹیٹس',
      by: 'از',
      loadError: 'ریکروٹر ڈیٹا لوڈ کرنے میں ناکامی۔',
    } : {
      title: 'Recruiter Dashboard',
      subtitle: 'Review your posted jobs, approval status, and incoming candidate applications.',
      addJob: 'Post New Job',
      profile: 'Profile',
      logout: 'Logout',
      noJobs: 'No jobs posted yet.',
      noApplications: 'No candidate applications yet.',
      applications: 'Applications',
      postedJobs: 'Your Jobs',
      status: 'Status',
      by: 'by',
      loadError: 'Failed to load recruiter data.',
    }
  ), [isUrdu]);

  useEffect(() => {
    if (authLoading || !user || !authorized) {
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        setError('');

        const [recruiterJobs, recruiterApplications] = await Promise.all([
          getRecruiterJobs(user.uid),
          getRecruiterApplications(user.uid),
        ]);

        setJobs(recruiterJobs);
        setApplications(recruiterApplications);
      } catch (loadError) {
        setError(copy.loadError);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [authLoading, user, authorized, copy.loadError]);

  if (authLoading || loading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  if (!user || !authorized) {
    return null;
  }

  return (
    <Box minHeight="100vh" py={{ xs: 2, md: 5 }} sx={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box display="flex" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h4" fontWeight={800}>{copy.title}</Typography>
              <Typography color="text.secondary">{copy.subtitle}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => router.push('/profile')}>{copy.profile}</Button>
              <Button
                variant="outlined"
                color="error"
                onClick={async () => {
                  await logout();
                  router.replace('/');
                }}
              >
                {copy.logout}
              </Button>
              <Button variant="contained" onClick={() => router.push('/recruiter/post-job')}>{copy.addJob}</Button>
            </Stack>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>{copy.postedJobs}</Typography>
                  <Stack spacing={1.5}>
                    {jobs.length === 0 ? (
                      <Typography color="text.secondary">{copy.noJobs}</Typography>
                    ) : jobs.map(job => (
                      <Box key={job.id} sx={{ p: 1.5, border: '1px solid rgba(148,163,184,0.25)', borderRadius: 2 }}>
                        <Typography fontWeight={700}>{job.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{job.company}</Typography>
                        <Chip size="small" label={`${copy.status}: ${job.status}`} sx={{ mt: 1 }} color={job.status === 'APPROVED' ? 'success' : job.status === 'REJECTED' ? 'error' : 'warning'} />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    {copy.applications}
                    <Chip size="small" color="primary" label={applications.length} sx={{ ml: 1 }} />
                  </Typography>

                  <Stack spacing={1.5}>
                    {applications.length === 0 ? (
                      <Typography color="text.secondary">{copy.noApplications}</Typography>
                    ) : applications.map(application => (
                      <Box key={application.id} sx={{ p: 1.5, border: '1px solid rgba(148,163,184,0.25)', borderRadius: 2 }}>
                        <Typography fontWeight={700}>{application.candidateName || application.candidateEmail}</Typography>
                        <Typography variant="body2" color="text.secondary">{application.candidateEmail}</Typography>
                        <Typography variant="caption" color="text.secondary">{copy.by} {role}</Typography>
                        <Chip size="small" label={application.status} sx={{ mt: 1, ml: isUrdu ? 0 : 1, mr: isUrdu ? 1 : 0 }} color="info" />
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
