'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import AtsChecker from '@/src/components/AtsChecker';
import { useInterviewContext } from '../context/InterviewContext';
import { getJobsByStatus, type JobRecord } from '@/src/services/firebase/firestore';
import { useRole } from '@/src/hooks/useRole';
import { motion } from 'framer-motion';
import { logout } from '@/src/services/auth';

const PAKISTANI_ROLE_PRESETS = [
  'Senior Software Engineer @ Google (Hard)',
  'Staff Backend Engineer @ Meta (Hard)',
  'Principal SDE @ Microsoft (Hard)',
  'Software Engineer @ Systems Ltd',
  'Backend Developer @ 10Pearls Pakistan',
  'Frontend Engineer @ Arbisoft',
  'Full Stack Developer @ Folio3',
  'Data Analyst @ Jazz',
  'Management Trainee @ Jazz',
  'Associate @ HBL',
  'Relationship Manager @ Meezan Bank',
  'Product Manager @ Careem Pakistan',
  'SQA Engineer @ Contour Software',
  'Cloud Engineer @ PTCL',
  'DevOps Engineer @ VentureDive',
  'Business Analyst @ Telenor Pakistan',
  'HR Executive @ Unilever Pakistan',
  'Digital Marketing Specialist @ Daraz',
  'Finance Analyst @ Engro',
  'UI/UX Designer @ Sastaticket.pk',
  'Cybersecurity Analyst @ NADRA',
  'Operations Executive @ Foodpanda Pakistan',
  'Customer Success Associate @ Bazaar Technologies',
  'Machine Learning Engineer @ Afiniti',
  'Graduate Trainee @ K-Electric',
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
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

export default function DashboardPage() {
  const router = useRouter();
  const { role, selectedRole, setSelectedRole, language, setLanguage } = useInterviewContext();
  const { user, authLoading } = useRole({ roles: ['CANDIDATE'] });
  const [approvedJobs, setApprovedJobs] = useState<JobRecord[]>([]);
  const [jobsError, setJobsError] = useState('');

  // Redirect recruiters and admins away from candidate dashboard
  useEffect(() => {
    if (!authLoading && role && role !== 'CANDIDATE') {
      if (role === 'RECRUITER') {
        router.replace('/recruiter/dashboard');
      } else if (role === 'ADMIN') {
        router.replace('/admin/dashboard');
      }
    }
  }, [authLoading, role, router]);

  const isUrdu = language === 'ur';

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'آپ کا ڈیش بورڈ',
      subtitle: 'اپنی مہارتوں کو بہتر بنانے کے لیے ایک رول منتخب کریں یا اپنا سی وی چیک کریں۔',
      openJobBoard: 'جاب بورڈ کھولیں',
      postJob: 'جاب پوسٹ کریں',
      adminPanel: 'ایڈمن پینل',
      selectRole: 'پاکستان کے مقبول رولز',
      profile: 'پروفائل',
      logout: 'لاگ آؤٹ',
    } : {
      title: 'Your Dashboard',
      subtitle: 'Select a role to practice or check your resume to improve your chances.',
      openJobBoard: 'Open Job Board',
      postJob: 'Post a Job',
      adminPanel: 'Admin Panel',
      selectRole: 'Popular Pakistani Roles',
      profile: 'Profile',
      logout: 'Logout',
    }
  ), [isUrdu]);

  useEffect(() => {
    const loadApprovedJobs = async () => {
      try {
        setJobsError('');
        const jobs = await getJobsByStatus('APPROVED');
        setApprovedJobs(jobs);
      } catch (error) {
        setJobsError(isUrdu ? 'منظور شدہ ملازمتیں لوڈ نہیں ہو سکیں۔' : 'Failed to load approved jobs.');
      }
    };

    void loadApprovedJobs();
  }, []);

  const roleCards = useMemo(
    () =>
      PAKISTANI_ROLE_PRESETS.map((presetRole, index) => {
        const selected = selectedRole === presetRole;
        return (
          <Grid item xs={12} sm={6} md={4} key={presetRole}
            component={motion.div}
            variants={itemVariants}
            custom={index}
          >
            <Card className="pro-card" sx={{ 
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(20px)',
              border: selected ? '1px solid #00d4ff' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: selected ? 'linear-gradient(90deg, #00d4ff, #a855f7)' : 'transparent',
                transition: 'all 0.3s ease',
              },
              '&:hover': {
                transform: 'translateY(-8px) scale(1.02)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 212, 255, 0.15)',
                borderColor: 'rgba(0, 212, 255, 0.3)',
              }
            }}>
              <CardActionArea
                onClick={() => {
                  setSelectedRole(presetRole);
                  router.push('/interview');
                }}
                sx={{ p: 1 }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ 
                    background: selected ? 'linear-gradient(135deg, #00d4ff, #a855f7)' : 'none',
                    WebkitBackgroundClip: selected ? 'text' : 'none',
                    WebkitTextFillColor: selected ? 'transparent' : 'inherit',
                  }}>
                    {presetRole}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        );
      }),
    [router, selectedRole, setSelectedRole]
  );

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
          <CircularProgress sx={{ color: '#00d4ff' }} />
        </motion.div>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      minHeight="100vh"
      py={{ xs: 2, md: 5 }}
      px={{ xs: 1, sm: 0 }}
      sx={{
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated background orbs */}
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 6, repeat: Infinity }}
        sx={{
          position: 'absolute',
          top: '5%',
          right: '5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
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
          bottom: '10%',
          left: '5%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={4}>
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography 
                  variant="h3" 
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: '1.8rem', md: '3rem' },
                    background: 'linear-gradient(135deg, #00d4ff, #a855f7, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 1
                  }}
                >
                  {copy.title}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                  {copy.subtitle}
                </Typography>
                {jobsError ? (
                  <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>
                    {jobsError}
                  </Alert>
                ) : null}
              </Box>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  onClick={() => setLanguage(isUrdu ? 'en' : 'ur')}
                  sx={{ 
                    borderRadius: 2, 
                    background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    '&:hover': {
                      boxShadow: '0 10px 30px rgba(0, 212, 255, 0.4)',
                    }
                  }}
                >
                  {isUrdu ? 'English' : 'اردو'}
                </Button>
              </motion.div>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/profile')} 
                  sx={{ 
                    borderRadius: 2,
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    px: 3,
                    '&:hover': {
                      borderColor: '#10b981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    }
                  }}
                >
                  {copy.profile}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={async () => {
                    await logout();
                    router.replace('/auth');
                  }}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  {copy.logout}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outlined" 
                  onClick={() => router.push('/jobs')} 
                  sx={{ 
                    borderRadius: 2,
                    borderColor: 'rgba(0, 212, 255, 0.5)',
                    px: 3,
                    '&:hover': {
                      borderColor: '#00d4ff',
                      backgroundColor: 'rgba(0, 212, 255, 0.1)',
                      boxShadow: '0 5px 20px rgba(0, 212, 255, 0.2)',
                    }
                  }}
                >
                  {copy.openJobBoard}
                </Button>
              </motion.div>
              {role === 'RECRUITER' && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => router.push('/recruiter/post-job')} 
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'rgba(168, 85, 247, 0.5)',
                      px: 3,
                      '&:hover': {
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        boxShadow: '0 5px 20px rgba(168, 85, 247, 0.2)',
                      }
                    }}
                  >
                    {copy.postJob}
                  </Button>
                </motion.div>
              )}
              {role === 'ADMIN' && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={() => router.push('/admin/dashboard')} 
                    sx={{ 
                      borderRadius: 2,
                      px: 3,
                      '&:hover': {
                        boxShadow: '0 5px 20px rgba(168, 85, 247, 0.3)',
                      }
                    }}
                  >
                    {copy.adminPanel}
                  </Button>
                </motion.div>
              )}
            </Stack>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Box className="glass-card section-shell" sx={{ p: { xs: 2.5, md: 3 }, mb: 4 }}>
              <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={8}>
                  <Typography className="section-kicker" sx={{ mb: 1.5 }}>
                    {isUrdu ? 'ڈیش بورڈ اوورویو' : 'Dashboard Overview'}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
                    {copy.title}
                  </Typography>
                  <Typography className="muted-copy" sx={{ maxWidth: 760 }}>
                    {copy.subtitle}
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5, flexWrap: 'wrap' }}>
                    <Box className="hero-stat">
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        {isUrdu ? 'موجودہ رول' : 'Current lane'}
                      </Typography>
                      <Typography fontWeight={700} sx={{ mt: 0.5 }}>
                        {selectedRole || (isUrdu ? 'کوئی رول منتخب نہیں' : 'No role selected')}
                      </Typography>
                    </Box>
                    <Box className="hero-stat">
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        {isUrdu ? 'منظور شدہ جابز' : 'Approved jobs'}
                      </Typography>
                      <Typography fontWeight={700} sx={{ mt: 0.5 }}>
                        {approvedJobs.length}
                      </Typography>
                    </Box>
                    <Box className="hero-stat">
                      <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block' }}>
                        {isUrdu ? 'اکاؤنٹ رول' : 'Account role'}
                      </Typography>
                      <Typography fontWeight={700} sx={{ mt: 0.5 }}>
                        {String(role || 'CANDIDATE')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box className="hero-stat" sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
                      {isUrdu ? 'فوری ایکشن' : 'Quick Actions'}
                    </Typography>
                    <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                      <Button className="neon-button" onClick={() => router.push('/interview')}>
                        {isUrdu ? 'انٹرویو شروع کریں' : 'Start Interview'}
                      </Button>
                      <Button variant="outlined" onClick={() => router.push('/profile')}>
                        {copy.profile}
                      </Button>
                    </Stack>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <AtsChecker />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Box>
              <Typography 
                variant="h4" 
                fontWeight={700} 
                sx={{ 
                  mb: 3,
                  background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {copy.selectRole}
              </Typography>
              <Grid container spacing={2} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
                {roleCards}
              </Grid>
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                  mb: 3,
                  mt: 2,
                  background: 'linear-gradient(135deg, #10b981, #00d4ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Approved Jobs
              </Typography>
              <Grid container spacing={2}>
                {approvedJobs.map(job => (
                  <Grid item xs={12} md={6} lg={4} key={job.id}>
                    <Card className="glass-card" sx={{ borderRadius: 4, overflow: 'hidden', height: '100%' }}>
                      <Box sx={{ height: 3, background: 'linear-gradient(90deg, #00d4ff, #a855f7)' }} />
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={800}>{job.title}</Typography>
                        <Typography sx={{ color: '#94a3b8', mb: 2 }}>{job.company}</Typography>
                        <Typography variant="body2" className="muted-copy" sx={{ mb: 2 }}>{job.description}</Typography>
                        <Button
                          className="neon-button"
                          onClick={() => {
                            setSelectedRole(`${job.title} @ ${job.company}`);
                            router.push('/interview');
                          }}
                          sx={{ borderRadius: 999, textTransform: 'none' }}
                        >
                          Select Role
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
        </Stack>
      </Container>
    </Box>
  );
}
