'use client';

import Link from 'next/link';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { useInterviewContext } from './context/InterviewContext';
import { useMemo } from 'react';

export default function HomePage() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const copy = useMemo(() => (
    isUrdu ? {
      overline: 'بی ڈبلیو اے آئی ہیکاتھون ایڈیشن',
      title: 'اے آئی انٹرویو کوچ پرو میکس',
      subtitle: 'لائیو اے آئی فیڈ بیک، اسپیچ انٹیلیجنس HUD، اور پاکستانی ہائرنگ سیاق و سباق کے ساتھ ملازمت کے انٹرویوز کی مشق کریں۔',
      getStarted: 'شروع کریں',
    } : {
      overline: 'BWAI HACKATHON EDITION',
      title: 'AI Interview Coach Pro Max',
      subtitle: 'Practice job interviews with live AI feedback, speech intelligence HUD, and role-specific Pakistani hiring context.',
      getStarted: 'Get Started',
    }
  ), [isUrdu]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(145deg, #eef8ff 0%, #f9fbff 50%, #edf7f3 100%)',
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit'
      }}
    >
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ textAlign: 'center' }}>
          <Typography variant="overline" sx={{ letterSpacing: 1.5, color: 'primary.main', fontWeight: 700 }}>
            {copy.overline}
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: '2.5rem', md: '3.75rem' } }}>
            {copy.title}
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', opacity: 0.9 }}>
            {copy.subtitle}
          </Typography>
          <Stack direction="row" justifyContent="center">
            <Button
              component={Link}
              href="/auth"
              size="large"
              variant="contained"
              sx={{
                px: 5,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 8px 16px rgba(11, 132, 255, 0.25)'
              }}
            >
              {copy.getStarted}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
