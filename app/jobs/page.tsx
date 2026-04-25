'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, CardMedia, Chip, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, Typography } from '@mui/material';
import { applyToJob, createCtsApplication, getJobsByStatus, type JobRecord } from '@/src/services/firebase/firestore';
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
  const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);
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
      modeTitle: 'انٹرویو موڈ منتخب کریں',
      modeSubtitle: 'اس رول کے لیے انٹرویو کا طریقہ منتخب کریں۔',
      mockTitle: 'موک انٹرویو پریکٹس کریں',
      mockBody: 'یہ نتیجہ صرف آپ کے لیے ہوگا، ریکروٹر کے ساتھ شیئر نہیں ہوگا۔',
      actualTitle: 'ایکچوئل انٹرویو دیں',
      actualBody: 'وارننگ: نتائج ریکروٹر کے ساتھ شیئر ہوں گے۔',
      cancel: 'منسوخ کریں',
    } : {
      title: 'Open Jobs',
      subtitle: 'Browse approved roles and jump into interview practice for your target job.',
      noJobs: 'No approved jobs available yet.',
      apply: 'Apply & Start Interview',
      salary: 'Salary',
      error: 'Failed to load approved jobs.',
      applyError: 'Failed to apply for this job.',
      applySuccess: 'Application submitted. You can now start interview practice.',
      modeTitle: 'Choose Interview Mode',
      modeSubtitle: 'Select how you want to proceed with this role.',
      mockTitle: 'Practice Mock Interview',
      mockBody: 'Private practice only. Results stay with you.',
      actualTitle: 'Take Actual Interview',
      actualBody: 'Results will be shared with the recruiter.',
      cancel: 'Cancel',
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

  const handleApplyClick = (job: JobRecord) => {
    setSelectedJob(job);
    setModeDialogOpen(true);
  };

  const handleStartInterviewMode = async (mode: 'mock' | 'actual') => {
    if (!selectedJob) return;

    try {
      const job = selectedJob;
      setApplyingJobId(job.id);
      setError('');
      setSuccessMessage('');

      if (mode === 'actual') {
        await applyToJob(
          job.id,
          job.recruiterId,
          user.uid,
          String(user.email || ''),
          String(user.displayName || ''),
          user.uid
        );
      }

      const cts = await createCtsApplication({
        jobId: job.id,
        recruiterId: job.recruiterId,
        candidateId: user.uid,
        candidateName: String(user.displayName || ''),
        candidateEmail: String(user.email || ''),
        jobTitle: job.title,
        type: mode,
        requesterUid: user.uid,
      });

      setSuccessMessage(copy.applySuccess);
      setSelectedRole(`${job.title} @ ${job.company}`);
      setModeDialogOpen(false);
      setSelectedJob(null);

      router.push(
        `/interview?interviewType=${encodeURIComponent(mode)}&applicationId=${encodeURIComponent(cts.applicationId)}&jobId=${encodeURIComponent(job.id)}`
      );
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
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' }, maxWidth: 760 }}>
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
              borderRadius: '20px',
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
                  <Card sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: '20px', 
                    background: 'linear-gradient(180deg, rgba(33, 39, 73, 0.94) 0%, rgba(24, 31, 62, 0.96) 100%)',
                    border: '1px solid rgba(129, 140, 248, 0.25)',
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 14px 32px rgba(2, 6, 23, 0.45)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 24px 40px rgba(2, 6, 23, 0.52)',
                      borderColor: 'rgba(129, 140, 248, 0.5)',
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
                        height: 4,
                        background: 'linear-gradient(90deg, #818cf8, #22d3ee)',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                      }}
                    />
                    {job.logoUrl ? (
                      <Box sx={{ 
                        p: 2.5, 
                        bgcolor: 'rgba(9, 14, 34, 0.72)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        minHeight: 160,
                        borderBottom: '1px solid rgba(148, 163, 184, 0.14)'
                      }}>
                        <CardMedia 
                          component="img" 
                          image={job.logoUrl} 
                          alt={`${job.company} logo`} 
                          sx={{ 
                            objectFit: 'contain', 
                            maxHeight: 110,
                            maxWidth: '100%'
                          }} 
                        />
                      </Box>
                    ) : null}
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, flexGrow: 1, p: { xs: 2.5, md: 3 } }}>
                      <Stack spacing={1.2}>
                        <Typography 
                          variant="h6" 
                          fontWeight={800}
                          sx={{
                            color: 'var(--text-primary)',
                            fontSize: { xs: '1.1rem', md: '1.25rem' },
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: { xs: '2.9rem', md: '3.2rem' }
                          }}
                        >
                          {job.title}
                        </Typography>
                        <Chip
                          label={job.company}
                          size="small"
                          sx={{
                            width: 'fit-content',
                            color: '#c7d2fe',
                            bgcolor: 'rgba(99, 102, 241, 0.16)',
                            border: '1px solid rgba(129, 140, 248, 0.4)',
                            fontWeight: 700,
                          }}
                        />
                      </Stack>

                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            lineHeight: 1.65,
                            fontSize: '0.92rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 5,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minHeight: '7.6rem'
                          }}
                        >
                          {job.description}
                        </Typography>
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" justifyContent="space-between">
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            bgcolor: 'rgba(99, 102, 241, 0.12)',
                            border: '1px solid rgba(129, 140, 248, 0.38)',
                            px: 2, 
                            py: 0.9, 
                            borderRadius: '999px',
                            color: '#c7d2fe',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            width: { xs: '100%', sm: 'auto' },
                            textAlign: 'center'
                          }}
                        >
                          {copy.salary}: {job.salary}
                        </Typography>
                      </Stack>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          disabled={applyingJobId === job.id}
                          onClick={() => handleApplyClick(job)}
                          sx={{ 
                            mt: 0.5, 
                            borderRadius: '12px', 
                            py: 1.35, 
                            fontWeight: 700, 
                            textTransform: 'none',
                            background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
                            fontSize: '1rem',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #6366f1, #4338ca)',
                              boxShadow: '0 12px 30px rgba(99, 102, 241, 0.3)',
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

      <Dialog open={modeDialogOpen} onClose={() => setModeDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{copy.modeTitle}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary">{copy.modeSubtitle}</Typography>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={700}>{copy.mockTitle}</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>{copy.mockBody}</Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => handleStartInterviewMode('mock')}
                  disabled={Boolean(applyingJobId)}
                >
                  {copy.mockTitle}
                </Button>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={700}>{copy.actualTitle}</Typography>
                <Typography color="warning.main" sx={{ mb: 2 }}>{copy.actualBody}</Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleStartInterviewMode('actual')}
                  disabled={Boolean(applyingJobId)}
                >
                  {copy.actualTitle}
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModeDialogOpen(false)}>{copy.cancel}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
