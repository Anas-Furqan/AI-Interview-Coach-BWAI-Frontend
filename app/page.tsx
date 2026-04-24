'use client';

import Link from 'next/link';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import { useInterviewContext } from './context/InterviewContext';
import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const copy = useMemo(() => (
    isUrdu ? {
      overline: 'اے آئی انٹرویو پلیٹ فارم',
      title: 'اے آئی انٹرویو کوچ',
      titleSuffix: '',
      subtitle: 'لائیو اے آئی فیڈ بیک، اسپیچ انٹیلیجنس HUD، اور پاکستانی ہائرنگ سیاق و سباق کے ساتھ ملازمت کے انٹرویوز کی مشق کریں۔',
      getStarted: 'شروع کریں',
      login: 'لاگ اِن',
    } : {
      overline: 'AI INTERVIEW PLATFORM',
      title: 'AI Interview Coach',
      titleSuffix: '',
      subtitle: 'Practice job interviews with live AI feedback, speech intelligence HUD, and role-specific Pakistani hiring context.',
      getStarted: 'Get Started',
      login: 'Login',
    }
  ), [isUrdu]);

  const stats = useMemo(() => (
    isUrdu ? [
      { label: 'لائیو HUD', value: 'Real-time speech metrics' },
      { label: 'پاکستانی رولز', value: 'Role-specific job prep' },
      { label: 'AI رپورٹیں', value: 'Deep STAR insights' },
    ] : [
      { label: 'Live HUD', value: 'Real-time speech metrics' },
      { label: 'Pakistani Roles', value: 'Role-specific job prep' },
      { label: 'AI Reports', value: 'Deep STAR insights' },
    ]
  ), [isUrdu]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 4, md: 8 } }}>
        <Stack spacing={4} sx={{ textAlign: 'center', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography 
              variant="overline" 
              sx={{ 
                letterSpacing: 3, 
                color: 'var(--accent-blue)', 
                fontWeight: 800,
                background: 'rgba(0, 212, 255, 0.1)',
                px: 2,
                py: 0.5,
                borderRadius: 2,
                border: '1px solid rgba(0, 212, 255, 0.2)'
              }}
            >
              {copy.overline}
            </Typography>
          </motion.div>

          <Box className="hero-banner" sx={{ width: '100%', px: { xs: 3, md: 6 }, py: { xs: 5, md: 7 } }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography
                variant="h1"
                className="page-title"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '3rem', md: '5.5rem' },
                  lineHeight: 1.02,
                  mb: 2,
                }}
              >
                {copy.title}
                <br />
                <span className="text-gradient">{copy.titleSuffix || 'Live'}</span>
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35 }}
            >
              <Typography
                variant="h6"
                className="page-subtitle"
                sx={{
                  maxWidth: '760px',
                  mx: 'auto',
                  fontSize: { xs: '1.05rem', md: '1.2rem' },
                }}
              >
                {copy.subtitle}
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 2, mt: 4 }}>
                {stats.map((item, index) => (
                  <Box key={index} className="hero-pill floating-chip">
                    <Typography variant="subtitle2" sx={{ color: 'var(--accent-blue)', fontWeight: 700 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Button
                  component={Link}
                  href="/auth"
                  className="neon-button"
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.15rem',
                    textTransform: 'none',
                  }}
                >
                  {copy.getStarted}
                </Button>
                <Button
                  component={Link}
                  href="/auth"
                  variant="outlined"
                  sx={{
                    px: 6,
                    py: 2,
                    fontSize: '1.15rem',
                    textTransform: 'none',
                  }}
                >
                  {copy.login}
                </Button>
              </Stack>
            </motion.div>
          </Box>

          <Grid container spacing={3} sx={{ mt: 1 }}>
            {[
              { title: isUrdu ? 'لائیو فیڈ بیک' : 'Live Feedback', desc: isUrdu ? 'آپ کی تقریر کا فوری تجزیہ' : 'Instant analysis of your speech' },
              { title: isUrdu ? 'سمارٹ HUD' : 'Smart HUD', desc: isUrdu ? 'انٹرویو کے دوران لائیو میٹرکس' : 'Live metrics during your interview' },
              { title: isUrdu ? 'تفصیلی رپورٹس' : 'Deep Analytics', desc: isUrdu ? 'STAR کارکردگی کا مکمل جائزہ' : 'Full STAR performance breakdown' },
            ].map((feature, i) => (
              <Grid item xs={12} md={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.1 }}
                >
                  <Box className="glass-card surface-card" sx={{ p: 4, height: '100%' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'var(--accent-blue)' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
                      {feature.desc}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

