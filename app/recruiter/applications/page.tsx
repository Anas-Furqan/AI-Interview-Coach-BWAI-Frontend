'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import { useRole } from '@/src/hooks/useRole';
import {
  CtsApplicationRecord,
  InterviewDataRecord,
  getApplicationPerformanceReport,
  getRecruiterActualInterviews,
} from '@/src/services/firebase/firestore';
import { useInterviewContext } from '@/app/context/InterviewContext';

function toDisplayDate(value: unknown): string {
  if (!value) return '-';

  const maybeMillis = (value as { toMillis?: () => number }).toMillis;
  if (typeof maybeMillis === 'function') {
    return new Date(maybeMillis()).toLocaleString();
  }

  const timestamp = Number(value);
  if (Number.isFinite(timestamp) && timestamp > 0) {
    return new Date(timestamp).toLocaleString();
  }

  return '-';
}

export default function RecruiterApplicationsPage() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';
  const { user, authLoading, role, authorized } = useRole({ roles: ['RECRUITER', 'ADMIN'], redirectTo: '/dashboard' });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applications, setApplications] = useState<CtsApplicationRecord[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<CtsApplicationRecord | null>(null);
  const [selectedInterviewData, setSelectedInterviewData] = useState<InterviewDataRecord[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'ریکروٹر پرفارمنس ڈیش بورڈ',
            subtitle: 'ایکچوئل انٹرویو دینے والے امیدواروں کی کارکردگی دیکھیں۔',
            candidate: 'امیدوار',
            jobTitle: 'جاب ٹائٹل',
            score: 'مجموعی اسکور',
            date: 'تاریخ',
            view: 'تفصیلی رپورٹ',
            noData: 'ابھی تک کوئی ایکچوئل انٹرویو ریکارڈ موجود نہیں۔',
            detailTitle: 'امیدوار کی مکمل کارکردگی رپورٹ',
            recruiterSummary: 'ریکروٹر سمری',
            avgWpm: 'اوسط WPM',
            avgConfidence: 'اوسط Confidence',
            question: 'سوال',
            answer: 'جواب',
            rating: 'ریٹنگ',
            feedback: 'فیڈبیک',
          }
        : {
            title: 'Recruiter Performance Dashboard',
            subtitle: 'Review candidates who completed Actual interviews for your jobs.',
            candidate: 'Candidate',
            jobTitle: 'Job Title',
            score: 'Overall Score',
            date: 'Date',
            view: 'View Full Report',
            noData: 'No actual interview data available yet.',
            detailTitle: 'Candidate Full Performance Report',
            recruiterSummary: 'Recruiter Summary',
            avgWpm: 'Average WPM',
            avgConfidence: 'Average Confidence',
            question: 'Question',
            answer: 'Candidate Transcript',
            rating: 'AI Rating',
            feedback: 'Gemini Feedback',
          },
    [isUrdu]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user || !authorized || !role) return;

    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const recruiterId = role === 'ADMIN' ? String(user.uid) : String(user.uid);
        const result = await getRecruiterActualInterviews(recruiterId, String(user.uid));
        setApplications(result);
      } catch (fetchError: any) {
        setError(String(fetchError?.message || 'Failed to load recruiter data.'));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [authLoading, user, authorized, role]);

  const openDetails = async (application: CtsApplicationRecord) => {
    if (!user) return;

    try {
      setDetailLoading(true);
      const detail = await getApplicationPerformanceReport(application.id, String(user.uid));
      setSelectedApplication(detail.application);
      setSelectedInterviewData(detail.interviewData);
    } catch (detailError: any) {
      setError(String(detailError?.message || 'Failed to fetch report details.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const aggregates = useMemo(() => {
    if (selectedInterviewData.length === 0) {
      return { avgWpm: 0, avgConfidence: 0 };
    }

    const totalWpm = selectedInterviewData.reduce((sum, item) => sum + Number(item.hudMetrics?.wpm || 0), 0);
    const totalConfidence = selectedInterviewData.reduce((sum, item) => sum + Number(item.hudMetrics?.confidence || 0), 0);

    return {
      avgWpm: Math.round(totalWpm / selectedInterviewData.length),
      avgConfidence: Math.round(totalConfidence / selectedInterviewData.length),
    };
  }, [selectedInterviewData]);

  if (authLoading || loading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress sx={{ color: 'var(--accent)' }} />
      </Box>
    );
  }

  if (!user || !authorized) {
    return null;
  }

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 2, md: 4 }} sx={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
      <Container maxWidth="lg" sx={{ fontFamily: 'var(--font-plus-jakarta)' }}>
        <Stack spacing={1} mb={3}>
          <Typography variant="h4" fontWeight={800}>
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Card>
          <CardContent>
            {applications.length === 0 ? (
              <Typography color="text.secondary">{copy.noData}</Typography>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{copy.candidate}</TableCell>
                      <TableCell>{copy.jobTitle}</TableCell>
                      <TableCell>{copy.score}</TableCell>
                      <TableCell>{copy.date}</TableCell>
                      <TableCell align="right">{copy.view}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {applications.map(item => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.candidateName || item.candidateEmail || item.candidateId}</TableCell>
                        <TableCell>{item.jobTitle || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${item.overallScore || 0}/10`}
                            color={(item.overallScore || 0) >= 7 ? 'success' : (item.overallScore || 0) >= 5 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{toDisplayDate(item.timestamp)}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" onClick={() => openDetails(item)}>
                            {copy.view}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(selectedApplication)}
          onClose={() => {
            setSelectedApplication(null);
            setSelectedInterviewData([]);
          }}
          fullWidth
          maxWidth="lg"
        >
          <DialogTitle>{copy.detailTitle}</DialogTitle>
          <DialogContent>
            {detailLoading ? (
              <Box py={3} display="grid" sx={{ placeItems: 'center' }}>
                <CircularProgress size={24} />
              </Box>
            ) : selectedApplication ? (
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">{copy.score}</Typography>
                        <Typography variant="h5" fontWeight={800}>{selectedApplication.overallScore || 0}/10</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">{copy.avgWpm}</Typography>
                        <Typography variant="h5" fontWeight={800}>{aggregates.avgWpm}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle2" color="text.secondary">{copy.avgConfidence}</Typography>
                        <Typography variant="h5" fontWeight={800}>{aggregates.avgConfidence}%</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{copy.recruiterSummary}</Typography>
                    <Typography color="text.secondary">
                      {selectedApplication.recruiterSummary || 'No recruiter summary available yet.'}
                    </Typography>
                  </CardContent>
                </Card>

                <TableContainer component={Card} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{copy.question}</TableCell>
                        <TableCell>{copy.answer}</TableCell>
                        <TableCell>{copy.rating}</TableCell>
                        <TableCell>{copy.feedback}</TableCell>
                        <TableCell>{copy.avgWpm}</TableCell>
                        <TableCell>{copy.avgConfidence}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedInterviewData.map(row => (
                        <TableRow key={row.id}>
                          <TableCell sx={{ maxWidth: 240 }}>{row.question}</TableCell>
                          <TableCell sx={{ maxWidth: 280 }}>{row.answer}</TableCell>
                          <TableCell>{row.rating || 0}/10</TableCell>
                          <TableCell sx={{ maxWidth: 320 }}>{row.feedback || '-'}</TableCell>
                          <TableCell>{row.hudMetrics?.wpm || 0}</TableCell>
                          <TableCell>{row.hudMetrics?.confidence || 0}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Stack>
            ) : null}
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}
