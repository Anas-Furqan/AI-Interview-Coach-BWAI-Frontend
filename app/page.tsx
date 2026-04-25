'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import { useInterviewContext } from './context/InterviewContext';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ShowcaseSliders from '@/components/theme/ShowcaseSliders';

export default function HomePage() {
  const router = useRouter();
  const { language, user, authLoading, role, hydrated } = useInterviewContext();
  const isUrdu = language === 'ur';

  useEffect(() => {
    if (!hydrated || authLoading || !user) return;

    if (role === 'ADMIN') {
      router.replace('/admin/dashboard');
      return;
    }
    if (role === 'RECRUITER') {
      router.replace('/recruiter/dashboard');
      return;
    }
    router.replace('/dashboard');
  }, [hydrated, authLoading, user, role, router]);

  const copy = useMemo(() => (
    isUrdu ? {
      overline: 'اے آئی انٹرویو پلیٹ فارم',
      title: 'Vetto — Your Career Interview Platform',
      subtitle: 'لائیو اے آئی فیڈ بیک، اسپیچ انٹیلیجنس HUD، اور پاکستانی ہائرنگ سیاق و سباق کے ساتھ ملازمت کے انٹرویوز کی مشق کریں۔',
      getStarted: 'شروع کریں',
      login: 'مزید جانیں',
      liveTag: 'Live',
      panelTitle: 'Vetto',
      panelHeading: 'Crack your interview, one rigorous question at a time',
    } : {
      overline: 'AI INTERVIEW PLATFORM',
      title: 'Vetto — Your Career Interview Platform',
      subtitle: 'Practice job interviews with live AI feedback, speech intelligence HUD, and role-specific Pakistani hiring context.',
      getStarted: 'Get Started',
      login: 'How it Works',
      liveTag: 'Live',
      panelTitle: 'vetto',
      panelHeading: 'Crack your interview, one rigorous question at a time',
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
      className="pro-page"
      sx={{
        minHeight: '100vh',
        display: 'block',
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 5, md: 8 } }}>
        <Box className="hero-banner" data-reveal="up" sx={{ width: '100%', px: { xs: 2.5, md: 4.5 }, py: { xs: 4, md: 5 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: 3,
                  color: 'var(--accent)',
                  fontWeight: 800,
                  background: 'rgba(99, 102, 241, 0.1)',
                  px: 2,
                  py: 0.5,
                  borderRadius: 999,
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                {copy.overline}
              </Typography>

              <Typography
                variant="h1"
                className="page-title"
                sx={{
                  fontWeight: 850,
                  fontSize: { xs: '2.35rem', md: '4.4rem' },
                  lineHeight: 1.05,
                  mt: 2,
                }}
              >
                {copy.title}
              </Typography>

              <Typography
                variant="h6"
                className="page-subtitle"
                sx={{
                  maxWidth: '760px',
                  mt: 2,
                  fontSize: { xs: '1rem', md: '1.2rem' },
                }}
              >
                {copy.subtitle}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 4 }}>
                <Button
                  component={Link}
                  href="/auth"
                  className="neon-button"
                  sx={{
                    px: 5,
                    py: 1.75,
                    fontSize: '1.1rem',
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
                    px: 5,
                    py: 1.75,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    borderRadius: 999,
                    borderColor: 'rgba(129, 140, 248, 0.55)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {copy.login}
                </Button>
              </Stack>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.3, mt: 3 }}>
                {stats.map((item, index) => (
                  <Box key={index} className="floating-chip">
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                className="surface-card"
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: 4,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: 'var(--text-muted)' }}>{copy.panelTitle}</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{copy.panelHeading}</Typography>
                  </Box>
                  <Box sx={{
                    px: 1.6,
                    py: 0.45,
                    borderRadius: 999,
                    border: '1px solid rgba(99, 102, 241, 0.35)',
                    color: 'var(--accent)'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{copy.liveTag}</Typography>
                  </Box>
                </Box>

                <Stack spacing={1.2} sx={{ color: 'var(--text-secondary)', mb: 2.2 }}>
                  <Typography variant="body1">- Real-time AI interviewer feedback</Typography>
                  <Typography variant="body1">- Verified role-focused question flow</Typography>
                  <Typography variant="body1">- STAR scoring and selection probability</Typography>
                </Stack>

                <Grid container spacing={1.2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{
                      p: 1.8,
                      borderRadius: 3,
                      border: '1px solid rgba(99, 102, 241, 0.26)',
                      background: 'rgba(79, 70, 229, 0.08)',
                    }}>
                      <Typography variant="overline" sx={{ color: 'var(--accent)' }}>Candidate View</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Instant nudge</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        Get a clear STAR correction right after each answer.
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{
                      p: 1.8,
                      borderRadius: 3,
                      border: '1px solid rgba(148, 163, 184, 0.22)',
                      background: 'rgba(30, 41, 59, 0.36)',
                    }}>
                      <Typography variant="overline" sx={{ color: 'var(--accent)' }}>Recruiter View</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Role lens</Typography>
                      <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                        Assess candidates with structured performance insights.
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 2.2 }}>
                  <div className="parallax-wrap" data-tilt>
                    <Image
                      src="/logo512.png"
                      alt="Vetto"
                      width={1024}
                      height={512}
                      className="parallax-media"
                      data-parallax="true"
                      priority
                    />
                  </div>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mt: 4 }}>
          <ShowcaseSliders />
        </Box>
      </Container>
    </Box>
  );
}

