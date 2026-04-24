'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
  Paper,
} from '@mui/material';
import jsPDF from 'jspdf';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { getSessionReport } from '@/lib/api';
import { useInterviewContext } from '../../context/InterviewContext';

type Point = {
  question: string;
  confidence: number;
  wpm: number;
  fillerCount: number;
  score: number;
  starStatus?: {
    hasSituation: boolean;
    hasTask: boolean;
    hasAction: boolean;
    hasResult: boolean;
  };
};

export default function SessionReportPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = String(params?.sessionId || '');
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'انٹرویو انٹیلیجنس رپورٹ',
      subtitle: 'آپ کی کارکردگی کا تفصیلی تجزیہ',
      download: 'پی ڈی ایف رپورٹ ڈاؤن لوڈ کریں',
      timeline: 'اعتماد اور کارکردگی کا ٹائم لائن',
      summary: 'ایگزیکٹو خلاصہ',
      overallScore: 'مجموعی انٹرویو اسکور',
      strengths: 'خوبیاں',
      improvement: 'بنیادی بہتری',
      questionDetails: 'سوالات کی تفصیلات',
      noData: 'کوئی ڈیٹا دستیاب نہیں',
      error: 'رپورٹ سیشن لوڈ کرنے میں ناکامی۔',
      confidence: 'اعتماد %',
      aiScore: 'AI اسکور (x10)',
    } : {
      title: 'Interview Intelligence Report',
      subtitle: 'Detailed analysis of your performance',
      download: 'Download PDF Report',
      timeline: 'Confidence & Performance Timeline',
      summary: 'Executive Summary',
      overallScore: 'Overall Interview Score',
      strengths: 'Strengths',
      improvement: 'Primary Improvement',
      questionDetails: 'Question Details',
      noData: 'No data available',
      error: 'Failed to load report session.',
      confidence: 'Confidence %',
      aiScore: 'AI Score (x10)',
    }
  ), [isUrdu]);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const data = await getSessionReport(sessionId);
        setReport(data);
      } catch (err) {
        console.error(err);
        setError(copy.error);
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      void loadReport();
    }
  }, [sessionId, copy.error]);

  const chartData: Point[] = useMemo(() => {
    const source = report?.session?.metricsTimeline || report?.questionAnalytics || [];
    return source.map((item: any, index: number) => ({
      question: item.questionId || `Q${index + 1}`,
      confidence: Number(item.confidence || 0),
      wpm: Number(item.wpm || 0),
      fillerCount: Number(item.fillerCount || 0),
      score: Number(item.score || 0),
      starStatus: item.starStatus,
    }));
  }, [report]);

  const downloadPdf = () => {
    if (!report) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('AI Interview Coach - Session Report', 14, 18);
    doc.setFontSize(11);
    doc.text(`Session ID: ${sessionId}`, 14, 28);
    doc.text(`Final Score: ${report.session?.finalScore || 0}/10`, 14, 36);

    doc.setFontSize(12);
    doc.text('Strengths', 14, 48);
    doc.setFontSize(10);
    const strengths = Array.isArray(report.session?.strengths)
      ? report.session.strengths.join(' | ')
      : String(report.session?.strengths || 'N/A');
    doc.text(doc.splitTextToSize(strengths, 180), 14, 55);

    doc.setFontSize(12);
    doc.text('Areas For Improvement', 14, 78);
    doc.setFontSize(10);
    const improvements = Array.isArray(report.session?.improvements)
      ? report.session.improvements.join(' | ')
      : String(report.session?.improvements || 'N/A');
    doc.text(doc.splitTextToSize(improvements, 180), 14, 85);

    doc.setFontSize(12);
    doc.text('Question Metrics', 14, 110);
    doc.setFontSize(10);
    let y = 118;
    chartData.forEach(point => {
      doc.text(
        `${point.question}: confidence ${point.confidence}% | WPM ${point.wpm} | fillers ${point.fillerCount} | score ${point.score}/10`,
        14,
        y
      );
      y += 7;
    });

    doc.save(`interview-report-${sessionId}.pdf`);
  };

  if (loading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  const StarIndicator = ({ active, label }: { active: boolean; label: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: active ? 'success.main' : 'text.disabled' }}>
      {active ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
      <Typography variant="caption" fontWeight={active ? 700 : 400}>{label}</Typography>
    </Box>
  );

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: 4,
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit'
      }}
    >
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={800}>{copy.title}</Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Box>
          <Button variant="contained" onClick={downloadPdf} size="large" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
            {copy.download}
          </Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={700}>{copy.timeline}</Typography>
                <Box sx={{ mt: 2, width: '100%', height: 360 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="question" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="confidence" name={copy.confidence} stroke="#0b84ff" strokeWidth={3} dot={{ r: 6 }} />
                      <Line type="monotone" dataKey="score" name={copy.aiScore} stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight={700}>{copy.summary}</Typography>
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <Box>
                    <Typography variant="h3" fontWeight={800} color="#0b84ff">{report.session?.finalScore || 0}/10</Typography>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>{copy.overallScore}</Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{copy.strengths}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {Array.isArray(report.session?.strengths) ? report.session.strengths[0] : report.session?.strengths}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{copy.improvement}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      {Array.isArray(report.session?.improvements) ? report.session.improvements[0] : report.session?.improvements}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>{copy.questionDetails}</Typography>
        <Grid container spacing={2}>
          {chartData.map((point, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle2" color="primary" gutterBottom>Question {idx + 1}</Typography>
                  <Typography variant="body2" noWrap sx={{ mb: 1.5 }}>{point.question}</Typography>
                  <Stack direction="row" spacing={2}>
                    <StarIndicator active={!!point.starStatus?.hasSituation} label="S" />
                    <StarIndicator active={!!point.starStatus?.hasTask} label="T" />
                    <StarIndicator active={!!point.starStatus?.hasAction} label="A" />
                    <StarIndicator active={!!point.starStatus?.hasResult} label="R" />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {report.session?.videoSnapshots?.length > 0 && (
          <>
            <Typography variant="h5" fontWeight={700}>Visual Moments</Typography>
            <Grid container spacing={2}>
              {report.session.videoSnapshots.map((url: string, idx: number) => (
                <Grid item xs={6} sm={4} md={2.4} key={idx}>
                  <Box
                    component="img"
                    src={url}
                    sx={{
                      width: '100%',
                      aspectRatio: '16/9',
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </>
        )}

        <Typography variant="h5" fontWeight={700}>Full Transcript</Typography>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              {report.session?.transcript?.map((msg: any, idx: number) => (
                <Box key={idx} sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <Typography variant="caption" color="text.secondary">{msg.sender === 'user' ? 'You' : 'AI Coach'}</Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: msg.sender === 'user' ? '#0b84ff' : '#f1f5f9',
                      color: msg.sender === 'user' ? 'white' : 'inherit',
                      borderRadius: 3
                    }}
                  >
                    <Typography variant="body2">{msg.text}</Typography>
                  </Paper>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
