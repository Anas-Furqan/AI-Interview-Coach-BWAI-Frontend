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
  Stack,
  Typography,
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
import { getSessionReport } from '@/lib/api';

type Point = {
  question: string;
  confidence: number;
  wpm: number;
  fillerCount: number;
  score: number;
};

export default function SessionReportPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = String(params?.sessionId || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const data = await getSessionReport(sessionId);
        setReport(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load report session.');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      void loadReport();
    }
  }, [sessionId]);

  const chartData: Point[] = useMemo(() => {
    const source = report?.session?.metricsTimeline || report?.questionAnalytics || [];
    return source.map((item: any, index: number) => ({
      question: item.questionId || `Q${index + 1}`,
      confidence: Number(item.confidence || 0),
      wpm: Number(item.wpm || 0),
      fillerCount: Number(item.fillerCount || 0),
      score: Number(item.score || 0),
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={2.5}>
        <Typography variant="h4" fontWeight={800}>
          Session Report
        </Typography>

        <Card>
          <CardContent>
            <Typography variant="h6">Confidence Score Over Time</Typography>
            <Box sx={{ mt: 2, width: '100%', height: 360 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="question" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="confidence" stroke="#0b84ff" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
          <Button variant="contained" onClick={downloadPdf}>
            Download PDF
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
