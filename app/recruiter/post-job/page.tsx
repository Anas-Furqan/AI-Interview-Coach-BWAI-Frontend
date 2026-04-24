'use client';

import { FormEvent, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { createJob } from '@/src/services/firebase/firestore';
import { useInterviewContext } from '@/app/context/InterviewContext';
import { useRole } from '@/src/hooks/useRole';
import { motion } from 'framer-motion';

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
};

export default function RecruiterPostJobPage() {
  const router = useRouter();
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const { user, authLoading, authorized } = useRole({ roles: ['RECRUITER'], redirectTo: '/interview' });
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'ملازمت پوسٹ کریں',
      subtitle: 'نئی ملازمتیں ایڈمن کی منظوری تک زیر التواء رہیں گی۔',
      jobTitle: 'ملازمت کا عنوان',
      company: 'کمپنی',
      logoUrl: 'لوگو یو آر ایل (آپشنل)',
      description: 'تفصیل',
      salary: 'تنخواہ',
      submit: 'منظوری کے لیے بھیجیں',
      submitting: 'بھیجا جا رہا ہے...',
      success: 'ملازمت منظوری کے لیے جمع کر دی گئی ہے۔',
      fillError: 'براہ کرم تمام مطلوبہ خانے پُر کریں۔',
      error: 'ملازمت جمع کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
      dashboard: 'ریکروٹر ڈیش بورڈ',
      profile: 'پروفائل',
    } : {
      title: 'Post a Job',
      subtitle: 'New jobs are created with pending status until approved by an admin.',
      jobTitle: 'Job Title',
      company: 'Company',
      logoUrl: 'Logo URL (Optional)',
      description: 'Description',
      salary: 'Salary',
      submit: 'Submit for Approval',
      submitting: 'Submitting...',
      success: 'Job submitted for admin approval.',
      fillError: 'Please fill all required fields.',
      error: 'Failed to submit job. Please try again.',
      dashboard: 'Recruiter Dashboard',
      profile: 'Profile',
    }
  ), [isUrdu]);

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

  if (!authorized || !user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !company.trim() || !description.trim() || !salary.trim()) {
      setError(copy.fillError);
      return;
    }

    try {
      setError('');
      setMessage('');
      setSubmitting(true);

      await createJob({
        title: title.trim(),
        company: company.trim(),
        logoUrl: logoUrl.trim(),
        description: description.trim(),
        salary: salary.trim(),
        recruiterId: user.uid,
      });

      setTitle('');
      setCompany('');
      setLogoUrl('');
      setDescription('');
      setSalary('');
      setMessage(copy.success);
    } catch (submitError) {
      console.error(submitError);
      setError(copy.error);
    } finally {
      setSubmitting(false);
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
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.12) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <Container 
        maxWidth="sm"
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
          <Box sx={{ mb: 4, textAlign: 'center' }}>
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
            <Typography sx={{ color: 'var(--text-secondary)', fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
              {copy.subtitle}
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => router.push('/recruiter/dashboard')}>
                {copy.dashboard}
              </Button>
              <Button variant="outlined" onClick={() => router.push('/profile')}>
                {copy.profile}
              </Button>
            </Stack>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card sx={{ 
            borderRadius: 3, 
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Stack 
                spacing={3} 
                onSubmit={handleSubmit}
                component={motion.form}
                variants={formVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fieldVariants}>
                  <Typography 
                    variant="h5" 
                    fontWeight={800}
                    sx={{
                      background: 'var(--accent)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    {copy.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{ color: 'var(--text-secondary) !important' }}>{copy.subtitle}</Typography>
                </motion.div>

                {message ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Alert 
                      severity="success" 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10b981',
                      }}
                    >
                      {message}
                    </Alert>
                  </motion.div>
                ) : null}
                {error ? (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        borderRadius: 2,
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                      }}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                ) : null}

                <motion.div variants={fieldVariants}>
                  <TextField 
                    label={copy.jobTitle} 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    required 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(15, 23, 42, 0.5)',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputBase-input': { color: '#f8fafc' },
                    }}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <TextField 
                    label={copy.company} 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    required 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(15, 23, 42, 0.5)',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputBase-input': { color: '#f8fafc' },
                    }}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <TextField 
                    label={copy.logoUrl} 
                    value={logoUrl} 
                    onChange={e => setLogoUrl(e.target.value)} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(15, 23, 42, 0.5)',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputBase-input': { color: '#f8fafc' },
                    }}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <TextField
                    label={copy.description}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    multiline
                    rows={5}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(15, 23, 42, 0.5)',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputBase-input': { color: '#f8fafc' },
                    }}
                  />
                </motion.div>
                <motion.div variants={fieldVariants}>
                  <TextField 
                    label={copy.salary} 
                    value={salary} 
                    onChange={e => setSalary(e.target.value)} 
                    required 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(15, 23, 42, 0.5)',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(99, 102, 241, 0.3)' },
                        '&.Mui-focused fieldset': { borderColor: 'var(--accent)' },
                      },
                      '& .MuiInputLabel-root': { color: 'var(--text-secondary)' },
                      '& .MuiInputBase-input': { color: '#f8fafc' },
                    }}
                  />
                </motion.div>

                <motion.div variants={fieldVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={submitting}
                    sx={{ 
                      py: 1.5, 
                      borderRadius: 2, 
                      fontWeight: 700, 
                      textTransform: 'none',
                      background: 'var(--accent)',
                      '&:hover': {
                        boxShadow: '0 10px 30px rgba(168, 85, 247, 0.4)',
                      },
                      '&:disabled': {
                        bgcolor: 'rgba(168, 85, 247, 0.5)',
                      }
                    }}
                  >
                    {submitting ? copy.submitting : copy.submit}
                  </Button>
                </motion.div>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
