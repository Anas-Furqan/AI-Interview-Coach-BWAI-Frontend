'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
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

const PAKISTANI_ROLE_PRESETS = [
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

export default function DashboardPage() {
  const router = useRouter();
  const { user, authLoading, role, selectedRole, setSelectedRole, language, setLanguage } = useInterviewContext();

  const isUrdu = language === 'ur';

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'آپ کا ڈیش بورڈ',
      subtitle: 'اپنی مہارتوں کو بہتر بنانے کے لیے ایک رول منتخب کریں یا اپنا سی وی چیک کریں۔',
      openJobBoard: 'جاب بورڈ کھولیں',
      postJob: 'جاب پوسٹ کریں',
      adminPanel: 'ایڈمن پینل',
      selectRole: 'پاکستان کے مقبول رولز',
    } : {
      title: 'Your Dashboard',
      subtitle: 'Select a role to practice or check your resume to improve your chances.',
      openJobBoard: 'Open Job Board',
      postJob: 'Post a Job',
      adminPanel: 'Admin Panel',
      selectRole: 'Popular Pakistani Roles',
    }
  ), [isUrdu]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [authLoading, user, router]);

  const roleCards = useMemo(
    () =>
      PAKISTANI_ROLE_PRESETS.map(presetRole => {
        const selected = selectedRole === presetRole;
        return (
          <Grid item xs={12} sm={6} md={4} key={presetRole}>
            <Card variant={selected ? 'elevation' : 'outlined'} sx={selected ? { border: '1px solid #0b84ff' } : undefined}>
              <CardActionArea
                onClick={() => {
                  setSelectedRole(presetRole);
                  router.push('/interview');
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
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
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box
      minHeight="100vh"
      py={5}
      bgcolor="#f4f7fb"
      sx={{
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit'
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>{copy.title}</Typography>
              <Typography color="text.secondary">{copy.subtitle}</Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => setLanguage(isUrdu ? 'en' : 'ur')}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {isUrdu ? 'English' : 'اردو'}
            </Button>
          </Box>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button variant="outlined" onClick={() => router.push('/jobs')} sx={{ borderRadius: 2 }}>{copy.openJobBoard}</Button>
            {role === 'recruiter' && (
              <Button variant="outlined" onClick={() => router.push('/recruiter/post-job')} sx={{ borderRadius: 2 }}>{copy.postJob}</Button>
            )}
            {role === 'admin' && (
              <Button variant="outlined" color="secondary" onClick={() => router.push('/admin/dashboard')} sx={{ borderRadius: 2 }}>{copy.adminPanel}</Button>
            )}
          </Stack>

          <AtsChecker />

          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>{copy.selectRole}</Typography>
            <Grid container spacing={2}>
              {roleCards}
            </Grid>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
