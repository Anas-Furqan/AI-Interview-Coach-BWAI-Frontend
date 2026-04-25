'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, CardMedia, CircularProgress, Container, Grid, Stack, Typography } from '@mui/material';
import { applyToJob, getJobsByStatus, type JobRecord } from '@/src/services/firebase/firestore';
import { useInterviewContext } from '../context/InterviewContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useRole } from '@/src/hooks/useRole';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  }
};

export default function JobsPage() {
  const router = useRouter();
  const { setSelectedRole, language } = useInterviewContext();
  const { user, authLoading, authorized } = useRole({ roles: ['CANDIDATE'], redirectTo: '/interview' });
  const isUrdu = language === 'ur';

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [applyingJobId, setApplyingJobId] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'دستیاب ملازمتیں',
      subtitle: 'فعال رولز براؤز کریں اور اپنی پسندیدہ ملازمت کے لیے انٹرویو کی مشق شروع کریں۔',
      noJobs: 'فی حال کوئی فعال ملازمت دستیاب نہیں ہے۔',
      apply: 'اپلائی کریں اور انٹرویو شروع کریں',
      salary: 'تنخواہ',
      error: 'ملازمتیں لوڈ کرنے میں ناکامی۔',
      applyError: 'ملازمت کے لیے اپلائی کرنے میں ناکامی۔',
      applySuccess: 'آپ کی درخواست جمع ہو گئی ہے۔ اب انٹرویو شروع کریں۔',
    } : {
      title: 'Open Jobs',
      subtitle: 'Browse approved roles and jump into interview practice for your target job.',
      noJobs: 'No approved jobs available yet.',
      apply: 'Apply & Start Interview',
      salary: 'Salary',
      error: 'Failed to load approved jobs.',
      applyError: 'Failed to apply for this job.',
      applySuccess: 'Application submitted. You can now start interview practice.',
    }
  ), [isUrdu]);

  useEffect(() => {
    if (authLoading) return;
    if (!user || !authorized) {
      router.replace('/auth');
      return;
    }

    const run = async () => {
      try {
        setError('');
        setLoading(true);
        const approvedJobs = await getJobsByStatus('APPROVED');
        setJobs(approvedJobs);
      } catch (fetchError) {
        console.error(fetchError);
        setError(copy.error);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [authLoading, user, authorized, router, copy.error]);

  if (authLoading || loading) {
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

  if (!user || !authorized) {
    return null;
  }

  const handleApply = async (job: JobRecord) => {
    try {
      setApplyingJobId(job.id);
      setError('');
      setSuccessMessage('');

      await applyToJob(
        job.id,
        job.recruiterId,
        user.uid,
        String(user.email || ''),
        String(user.displayName || ''),
        user.uid
      );

      setSuccessMessage(copy.applySuccess);
      setSelectedRole(`${job.title} @ ${job.company}`);
      router.push('/dashboard');
    } catch (applyError) {
      console.error(applyError);
      setError(copy.applyError);
    } finally {
      setApplyingJobId('');
    }
  };

  return (
    <Box
      className="pro-page"
      minHeight="100vh"
      py={{ xs: 2, md: 4 }}
      px={{ xs: 1, sm: 0 }}
      sx={{
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background */}
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity }}
        sx={{
          position: 'absolute',
          top: '10%',
          left: '20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Stack spacing={1} mb={4}>
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
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
              {copy.subtitle}
            </Typography>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert severity="error" sx={{ 
                  borderRadius: 2,
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  {error}
                </Alert>
              </motion.div>
            ) : null}
            {successMessage ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {successMessage}
              </Alert>
            ) : null}
          </Stack>
        </motion.div>

        {jobs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card sx={{ 
              background: 'rgba(43, 47, 79, 0.84)',
              border: '1px solid rgba(149, 117, 205, 0.2)',
              borderRadius: 16,
              p: 4,
              textAlign: 'center',
              boxShadow: '0 18px 36px rgba(0, 0, 0, 0.24)',
            }}>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  {copy.noJobs}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Grid container spacing={3} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
            <AnimatePresence>
              {jobs.map(job => (
                <Grid item xs={12} md={6} lg={4} key={job.id}
                  component={motion.div}
                  variants={itemVariants}
                >
                  <Card className="pro-card" sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: 16, 
                    background: 'rgba(43, 47, 79, 0.86)',
                    border: '1px solid rgba(149, 117, 205, 0.2)',
                    overflow: 'hidden',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 14px 30px rgba(0, 0, 0, 0.24)',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 18px 36px rgba(15, 23, 42, 0.12)',
                      borderColor: 'rgba(99, 102, 241, 0.35)',
                      '& .job-card-glow': {
                        opacity: 1,
                      }
                    }
                  }}>
                    {/* Glow effect on hover */}
                    <Box
                      className="job-card-glow"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: 'var(--accent)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      }}
                    />
                    {job.logoUrl ? (
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: 'rgba(15, 23, 42, 0.8)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 180
                      }}>
                        <CardMedia 
                          component="img" 
                          image={job.logoUrl} 
                          alt={`${job.company} logo`} 
                          sx={{ 
                            objectFit: 'contain', 
                            maxHeight: 150,
                            maxWidth: '100%'
                          }} 
                        />
                      </Box>
                    ) : null}
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, p: 3, minHeight: 380 }}>
                      <Box>
                        <Typography 
                          variant="h6" 
                          fontWeight={800}
                          sx={{
                            color: 'var(--text-primary)',
                            fontSize: { xs: '1.1rem', md: '1.25rem' },
                            mb: 0.5,
                            lineHeight: 1.3
                          }}
                        >
                          {job.title}
                        </Typography>
                        <Typography 
                          fontWeight={600}
                          sx={{ 
                            color: 'var(--accent)',
                            fontSize: '0.95rem'
                          }}
                        >
                          {job.company}
                        </Typography>
                      </Box>

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            lineHeight: 1.7,
                            fontSize: '0.9rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: '5rem'
                          }}
                        >
                          {job.description}
                        </Typography>
                      </Box>

                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          bgcolor: 'rgba(99, 102, 241, 0.08)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          px: 2.5, 
                          py: 1.2, 
                          borderRadius: 2,
                          color: 'var(--accent)',
                          fontWeight: 700,
                          fontSize: '1rem',
                          textAlign: 'center'
                        }}
                      >
                        {copy.salary}: {job.salary}
                      </Typography>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          disabled={applyingJobId === job.id}
                          onClick={() => handleApply(job)}
                          sx={{ 
                            mt: 1, 
                            borderRadius: 2, 
                            py: 1.5, 
                            fontWeight: 700, 
                            textTransform: 'none',
                            background: 'var(--accent)',
                            fontSize: '1rem',
                            '&:hover': {
                              background: '#4F46E5',
                              boxShadow: '0 10px 30px rgba(99, 102, 241, 0.25)',
                            }
                          }}
                        >
                          {applyingJobId === job.id ? (isUrdu ? 'درخواست بھیجی جا رہی ہے...' : 'Applying...') : copy.apply}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </AnimatePresence>
          </Grid>
        )}
      </Container>
    </Box>
  );
}
