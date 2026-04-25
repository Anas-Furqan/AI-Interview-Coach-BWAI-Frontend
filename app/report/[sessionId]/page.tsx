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
import { motion } from 'framer-motion';

const DEMO_REPORT = {
  session: {
    id: 'demo',
    finalScore: 8,
    strengths: ['Clear communication', 'Strong structure', 'Good technical ownership'],
    improvements: ['Use more STAR detail', 'Add measurable outcomes'],
    transcript: [],
    metricsTimeline: [
      { questionId: 'Q1', confidence: 78, wpm: 132, fillerCount: 2, score: 8, starStatus: { hasSituation: true, hasTask: true, hasAction: true, hasResult: false } },
      { questionId: 'Q2', confidence: 84, wpm: 140, fillerCount: 1, score: 9, starStatus: { hasSituation: true, hasTask: true, hasAction: true, hasResult: true } },
    ],
    analytics: {
      filler_count: 3,
      avg_wpm: 136,
      star_compliance: 50,
      confidence_scores: [
        { questionId: 'Q1', confidence: 78, score: 8 },
        { questionId: 'Q2', confidence: 84, score: 9 },
      ],
    },
  },
  questionAnalytics: [],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
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
        setError('');

        if (sessionId === 'demo') {
          setReport(DEMO_REPORT);
          return;
        }

        const data = await getSessionReport(sessionId);
        setReport(data);
      } catch (err) {
        setReport(DEMO_REPORT);
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

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  const StarIndicator = ({ active, label }: { active: boolean; label: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: active ? '#10b981' : 'rgba(255,255,255,0.2)' }}>
      {active ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
      <Typography variant="caption" fontWeight={active ? 700 : 400}>{label}</Typography>
    </Box>
  );

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
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <Container
        maxWidth="lg"
        sx={{
          py: { xs: 1, md: 4 },
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Stack spacing={4}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography 
                  variant="h3" 
                  fontWeight={800}
                  sx={{
                    fontSize: { xs: '1.7rem', md: '3rem' },
                    background: 'var(--accent)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}
                >
                  {copy.title}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: { xs: '0.95rem', md: '1.1rem' } }}>
                  {copy.subtitle}
                </Typography>
              </Box>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="contained" 
                  onClick={downloadPdf} 
                  size="large" 
                  sx={{ 
                    borderRadius: 2, 
                    textTransform: 'none', 
                    fontWeight: 700,
                    background: 'var(--accent)',
                    '&:hover': {
                      boxShadow: '0 10px 30px rgba(99, 102, 241, 0.18)',
                    }
                  }}
                >
                  {copy.download}
                </Button>
              </motion.div>
            </Stack>
          </motion.div>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="pro-card" sx={{ 
                  height: '100%', 
                  borderRadius: 3,
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      fontWeight={700}
                      sx={{
                        background: 'var(--accent)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {copy.timeline}
                    </Typography>
                    <Box sx={{ mt: 2, width: '100%', minWidth: 0, height: { xs: 300, sm: 340, md: 360 } }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="question" stroke="#94a3b8" />
                          <YAxis domain={[0, 100]} stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                              border: '1px solid rgba(255,255,255,0.1)',
                              borderRadius: 8,
                              color: '#f8fafc'
                            }} 
                          />
                          <Line type="monotone" dataKey="confidence" name={copy.confidence} stroke="var(--accent)" strokeWidth={3} dot={{ r: 6, fill: 'var(--accent)' }} />
                          <Line type="monotone" dataKey="score" name={copy.aiScore} stroke="#10b981" strokeWidth={3} dot={{ r: 6, fill: '#10b981' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={4}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="pro-card" sx={{ 
                  height: '100%', 
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                  color: 'white', 
                  borderRadius: 3,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: 'linear-gradient(90deg, rgba(99,102,241,0.95), rgba(79,70,229,0.95))',
                  }
                }}>
                  <CardContent>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      fontWeight={700}
                      sx={{
                        background: 'var(--accent)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {copy.summary}
                    </Typography>
                    <Stack spacing={3} sx={{ mt: 2 }}>
                      <Box>
                        <Typography 
                          variant="h3" 
                          fontWeight={800} 
                          sx={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.95), #10b981)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {report.session?.finalScore || 0}/10
                        </Typography>
                        <Typography variant="overline" sx={{ opacity: 0.8, color: 'var(--text-secondary)' }}>{copy.overallScore}</Typography>
                      </Box>
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#10b981' }}>{copy.strengths}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, color: '#e2e8f0' }}>
                          {Array.isArray(report.session?.strengths) ? report.session.strengths[0] : report.session?.strengths}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f59e0b' }}>{copy.improvement}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, color: '#e2e8f0' }}>
                          {Array.isArray(report.session?.improvements) ? report.session.improvements[0] : report.session?.improvements}
                        </Typography>
                      </Box>
                      {report.session?.analytics && (
                        <>
                          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'var(--accent)', mb: 1 }}>
                              Structured Analytics
                            </Typography>
                            <Stack spacing={1}>
                              <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                                Filler count: {report.session.analytics.filler_count}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                                Average WPM: {report.session.analytics.avg_wpm}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#e2e8f0' }}>
                                STAR compliance: {report.session.analytics.star_compliance}%
                              </Typography>
                            </Stack>
                          </Box>
                        </>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          </Grid>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Typography 
              variant="h5" 
              fontWeight={700} 
              sx={{ 
                mb: 3,
                background: 'var(--accent)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {copy.questionDetails}
            </Typography>
          </motion.div>
          
          <Grid container spacing={2} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
            {chartData.map((point, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}
                component={motion.div}
                variants={itemVariants}
              >
                <Card sx={{
                  borderRadius: 3,
                  background: 'rgba(30, 41, 59, 0.7)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 15px 30px rgba(0, 0, 0, 0.3)',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                  }
                }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ color: 'var(--accent)', mb: 1 }}>Question {idx + 1}</Typography>
                    <Typography variant="body2" noWrap sx={{ mb: 1.5, color: '#e2e8f0' }}>{point.question}</Typography>
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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Typography 
                  variant="h5" 
                  fontWeight={700}
                  sx={{ 
                    mb: 3,
                    background: 'var(--accent)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Visual Moments
                </Typography>
              </motion.div>
              <Grid container spacing={2}>
                {report.session.videoSnapshots.map((url: string, idx: number) => (
                  <Grid item xs={6} sm={4} md={2.4} key={idx}
                    component={motion.div}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * idx }}
                  >
                    <Box
                      component="img"
                      src={url}
                      sx={{
                        width: '100%',
                        aspectRatio: '16/9',
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 10px 30px rgba(0, 212, 255, 0.2)',
                        }
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Typography 
              variant="h5" 
              fontWeight={700}
              sx={{ 
                mb: 3,
                background: 'linear-gradient(135deg, rgba(79,70,229,0.95), rgba(99,102,241,0.95))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Full Transcript
            </Typography>
          </motion.div>
          <Card className="pro-card" sx={{
            borderRadius: 3,
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <CardContent>
              <Stack spacing={2}>
                {report.session?.transcript?.map((msg: any, idx: number) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * idx }}
                  >
                    <Box sx={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                      <Typography variant="caption" sx={{ color: msg.sender === 'user' ? '#00d4ff' : '#a855f7' }}>
                        {msg.sender === 'user' ? 'You' : 'AI Coach'}
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          background: msg.sender === 'user' 
                            ? 'linear-gradient(135deg, #00d4ff, #a855f7)' 
                            : 'rgba(15, 23, 42, 0.8)',
                          color: msg.sender === 'user' ? 'white' : '#e2e8f0',
                          borderRadius: 3,
                          border: msg.sender === 'ai' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                        }}
                      >
                        <Typography variant="body2">{msg.text}</Typography>
                      </Paper>
                    </Box>
                  </motion.div>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </Container>
    </Box>
  );
}
