'use client';

import { useEffect, useState, useMemo } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material';
import { getJobsByStatus, type JobRecord, updateJobStatus } from '@/src/services/firebase/firestore';
import { useInterviewContext } from '@/app/context/InterviewContext';
import { useRole } from '@/src/hooks/useRole';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { logout } from '@/src/services/auth';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const { authLoading, authorized } = useRole({ roles: ['ADMIN'], redirectTo: '/interview' });
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
      logout: 'لاگ آؤٹ',
    } : {
      title: 'Admin Job Approval',
      subtitle: 'Review pending jobs and approve/reject them.',
      noJobs: 'No pending jobs right now.',
      approve: 'Approve',
      reject: 'Reject',
      salary: 'Salary',
      error: 'Failed to load pending jobs.',
      logout: 'Logout',
    }
  ), [isUrdu]);

  const loadPendingJobs = async () => {
    try {
      setError('');
      setLoading(true);
      const jobs = await getJobsByStatus('PENDING');
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
      <Box 
        minHeight="100vh" 
        display="grid" 
        sx={{ placeItems: 'center' }}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <CircularProgress sx={{ color: 'var(--accent)' }} />
        </motion.div>
      </Box>
    );
  }

  if (!authorized) {
    return null;
  }

  const handleAction = async (jobId: string, status: 'APPROVED' | 'REJECTED') => {
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
      py={{ xs: 2, md: 4 }}
      px={{ xs: 1, sm: 0 }}
      sx={{
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #0f172a 50%, #0a0a0f 100%)',
      }}
    >
      {/* Animated background */}
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 6, repeat: Infinity }}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.15, 0.3, 0.15]
        }}
        transition={{ duration: 7, repeat: Infinity, delay: 1 }}
        sx={{
          position: 'absolute',
          bottom: '5%',
          left: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <Container 
        maxWidth="lg"
        sx={{
          py: { xs: 1, md: 4 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Stack spacing={2} mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography 
                variant="h3" 
                fontWeight={800}
                sx={{
                  fontSize: { xs: '1.8rem', md: '3rem' },
                  background: 'var(--accent)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1
                }}
              >
                {copy.title}
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={async () => {
                  await logout();
                  router.replace('/auth');
                }}
              >
                {copy.logout}
              </Button>
            </Box>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, color: 'var(--text-secondary) !important' }}>
              {copy.subtitle}
            </Typography>
            {error ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 2,
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            ) : null}
          </Stack>
        </motion.div>

        {loading ? (
          <Box display="grid" sx={{ placeItems: 'center', py: 8 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <CircularProgress sx={{ color: 'var(--accent)' }} />
            </motion.div>
          </Box>
        ) : null}

        {!loading && pendingJobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card sx={{ 
              borderRadius: 3,
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{copy.noJobs}</Typography>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
          {pendingJobs.map(job => (
            <Grid item xs={12} md={6} key={job.id}
              component={motion.div}
              variants={itemVariants}
            >
              <Card sx={{ 
                borderRadius: 3,
                background: 'rgba(30, 41, 59, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                }
              }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Typography 
                      variant="h6" 
                      fontWeight={700}
                      sx={{ color: '#f8fafc' }}
                    >
                      {job.title}
                    </Typography>
                    <Typography 
                      fontWeight={600}
                      sx={{ 
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.95), #10b981)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {job.company}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#e2e8f0' }}>{job.description}</Typography>
                    <Typography 
                      variant="subtitle2" 
                      sx={{ 
                        bgcolor: 'rgba(0, 212, 255, 0.1)',
                        px: 2,
                        py: 0.75,
                        borderRadius: 2,
                        alignSelf: 'flex-start',
                        color: 'var(--accent)',
                        fontWeight: 600,
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                      }}
                    >
                      {copy.salary}: {job.salary}
                    </Typography>
                    <Stack direction="row" spacing={2} mt={2}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="contained"
                          onClick={() => void handleAction(job.id, 'APPROVED')}
                          sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            '&:hover': {
                              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
                            }
                          }}
                        >
                          {copy.approve}
                        </Button>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => void handleAction(job.id, 'REJECTED')}
                          sx={{ 
                            borderRadius: 2, 
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: 'rgba(239, 68, 68, 0.5)',
                            color: '#ef4444',
                            '&:hover': {
                              borderColor: '#ef4444',
                              bgcolor: 'rgba(239, 68, 68, 0.1)',
                            }
                          }}
                        >
                          {copy.reject}
                        </Button>
                      </motion.div>
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
