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
  const { user, authLoading, selectedRole, setSelectedRole, clearSelectedRole } = useInterviewContext();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [authLoading, user, router]);

  const roleCards = useMemo(
    () =>
      PAKISTANI_ROLE_PRESETS.map(role => {
        const selected = selectedRole === role;
        return (
          <Grid item xs={12} sm={6} md={4} key={role}>
            <Card variant={selected ? 'elevation' : 'outlined'} sx={selected ? { border: '1px solid #0b84ff' } : undefined}>
              <CardActionArea
                onClick={() => {
                  setSelectedRole(role);
                  router.push('/interview');
                }}
              >
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {role}
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
    <Box minHeight="100vh" py={5} bgcolor="#f4f7fb">
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} alignItems={{ sm: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Dashboard
              </Typography>
              <Typography color="text.secondary">Welcome, {user.displayName || 'Candidate'}</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  clearSelectedRole();
                }}
              >
                Start New Interview
              </Button>
              <Button
                variant="contained"
                disabled={!selectedRole}
                onClick={() => {
                  router.push('/interview');
                }}
              >
                Continue
              </Button>
            </Stack>
          </Stack>

          <Typography variant="h6" fontWeight={700}>
            Pakistani Job Presets
          </Typography>
          <Grid container spacing={2}>
            {roleCards}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}
