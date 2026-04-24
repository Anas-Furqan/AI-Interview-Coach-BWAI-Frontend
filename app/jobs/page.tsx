'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, CardMedia, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material';
import { getJobsByStatus, type JobRecord } from '@/src/services/firebase/firestore';
import { useInterviewContext } from '../context/InterviewContext';

export default function JobsPage() {
  const router = useRouter();
  const { user, authLoading, setSelectedRole, language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [error, setError] = useState('');

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'دستیاب ملازمتیں',
      subtitle: 'فعال رولز براؤز کریں اور اپنی پسندیدہ ملازمت کے لیے انٹرویو کی مشق شروع کریں۔',
      noJobs: 'فی حال کوئی فعال ملازمت دستیاب نہیں ہے۔',
      apply: 'اپلائی کریں اور انٹرویو شروع کریں',
      salary: 'تنخواہ',
      error: 'ملازمتیں لوڈ کرنے میں ناکامی۔',
    } : {
      title: 'Open Jobs',
      subtitle: 'Browse active roles and jump into interview practice for your target job.',
      noJobs: 'No active jobs available yet.',
      apply: 'Apply & Start Interview',
      salary: 'Salary',
      error: 'Failed to load active jobs.',
    }
  ), [isUrdu]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }

    const run = async () => {
      try {
        setError('');
        setLoading(true);
        const activeJobs = await getJobsByStatus('active');
        setJobs(activeJobs);
      } catch (fetchError) {
        console.error(fetchError);
        setError(copy.error);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [authLoading, user, router, copy.error]);

  if (authLoading || loading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  const handleApply = (job: JobRecord) => {
    setSelectedRole(`${job.title} @ ${job.company}`);
    router.push('/interview');
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
        <Stack spacing={1} mb={3}>
          <Typography variant="h4" fontWeight={700}>{copy.title}</Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>

        {jobs.length === 0 ? (
          <Card>
            <CardContent>
              <Typography>{copy.noJobs}</Typography>
            </CardContent>
          </Card>
        ) : null}

        <Grid container spacing={3}>
          {jobs.map(job => (
            <Grid item xs={12} md={6} lg={4} key={job.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                {job.logoUrl ? (
                  <CardMedia component="img" height="180" image={job.logoUrl} alt={`${job.company} logo`} sx={{ objectFit: 'contain', p: 2, bgcolor: 'white' }} />
                ) : null}
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" fontWeight={800}>{job.title}</Typography>
                  <Typography color="primary" fontWeight={600}>{job.company}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, lineBreak: 'anywhere' }}>
                    {job.description.length > 150 ? `${job.description.substring(0, 150)}...` : job.description}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ bgcolor: '#eef2ff', px: 1.5, py: 0.5, borderRadius: 1, alignSelf: 'flex-start' }}>
                    {copy.salary}: {job.salary}
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleApply(job)}
                    sx={{ mt: 1, borderRadius: 2, py: 1.25, fontWeight: 700, textTransform: 'none' }}
                  >
                    {copy.apply}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
