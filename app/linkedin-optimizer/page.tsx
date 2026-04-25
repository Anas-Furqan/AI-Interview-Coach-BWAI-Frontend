'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import { useInterviewContext } from '../context/InterviewContext';

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

type LinkedInSection = {
  score: number;
  strengths: string[];
  gaps: string[];
  actionItems: string[];
};

type LinkedInAnalysis = {
  overallScore: number;
  profileLevel: 'Needs Work' | 'Fair' | 'Strong' | 'Outstanding';
  summary: string;
  sectionBreakdown: {
    headline: LinkedInSection;
    about: LinkedInSection;
    experience: LinkedInSection;
    skills: LinkedInSection;
  };
  missingKeywords: string[];
  actionItems: string[];
  quickWins: string[];
  longTermImprovements: string[];
};

function sectionLabel(key: keyof LinkedInAnalysis['sectionBreakdown']): string {
  switch (key) {
    case 'headline':
      return 'Headline';
    case 'about':
      return 'About Section';
    case 'experience':
      return 'Experience';
    case 'skills':
      return 'Skills';
    default:
      return key;
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

export default function LinkedInOptimizerPage() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const [profilePdf, setProfilePdf] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'لنکڈ اِن پروفائل آپٹمائزر',
            subtitle: 'اپنا لنکڈ اِن ایکسپورٹ PDF یا ٹیکسٹ اپلوڈ کریں اور Careerflow معیار کے مطابق تفصیلی تجزیہ حاصل کریں۔',
            upload: 'LinkedIn PDF اپلوڈ کریں',
            rawText: 'یا اپنا LinkedIn پروفائل ٹیکسٹ یہاں پیسٹ کریں',
            analyze: 'پروفائل کا تجزیہ کریں',
            overall: 'مجموعی اسکور',
            sectionBreakdown: 'سیکشن وائز بریک ڈاؤن',
            actionItems: 'ایکشن آئٹمز',
            missingKeywords: 'مسنگ کی ورڈز',
            quickWins: 'فوری بہتری',
            longTerm: 'لانگ ٹرم بہتری',
            download: 'مکمل رپورٹ PDF میں ڈاؤنلوڈ کریں',
            noInput: 'براہ کرم PDF اپلوڈ کریں یا ٹیکسٹ فراہم کریں۔',
          }
        : {
            title: 'LinkedIn Profile Optimizer',
            subtitle: 'Upload your LinkedIn export PDF or paste profile text to get a Careerflow-style deep analysis.',
            upload: 'Upload LinkedIn PDF Export',
            rawText: 'Or paste your LinkedIn profile text',
            analyze: 'Analyze Profile',
            overall: 'Overall Score',
            sectionBreakdown: 'Section-wise Breakdown',
            actionItems: 'Action Items',
            missingKeywords: 'Missing Keywords',
            quickWins: 'Quick Wins',
            longTerm: 'Long-term Improvements',
            download: 'Download Full Report as PDF',
            noInput: 'Please upload a PDF or provide raw profile text.',
          },
    [isUrdu]
  );

  const runAnalysis = async () => {
    if (!profilePdf && !rawText.trim()) {
      setError(copy.noInput);
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      if (profilePdf) {
        formData.append('profilePdf', profilePdf);
      }
      if (rawText.trim()) {
        formData.append('rawText', rawText.trim());
      }

      const response = await axios.post(`${API_BASE_URL}/api/linkedin/optimize`, formData);
      setAnalysis(response.data?.analysis || null);
    } catch (requestError: any) {
      setError(String(requestError?.response?.data?.error || 'Failed to optimize LinkedIn profile.'));
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!analysis) return;

    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let y = 14;

    const writeBlock = (title: string, lines: string[]) => {
      if (y > 270) {
        doc.addPage();
        y = 14;
      }
      doc.setFontSize(12);
      doc.text(title, 14, y);
      y += 6;
      doc.setFontSize(10);
      for (const line of lines) {
        const wrapped = doc.splitTextToSize(line, 180);
        if (y + wrapped.length * 5 > 280) {
          doc.addPage();
          y = 14;
        }
        doc.text(wrapped, 14, y);
        y += wrapped.length * 5 + 1;
      }
      y += 2;
    };

    doc.setFontSize(18);
    doc.text('LinkedIn Profile Optimization Report', 14, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Overall Score: ${analysis.overallScore}/100`, 14, y);
    y += 6;
    doc.text(`Profile Level: ${analysis.profileLevel}`, 14, y);
    y += 8;

    writeBlock('Executive Summary', [analysis.summary]);

    const sections = analysis.sectionBreakdown;
    (Object.keys(sections) as Array<keyof typeof sections>).forEach(sectionKey => {
      const section = sections[sectionKey];
      writeBlock(`${sectionLabel(sectionKey)} (${section.score}/100)`, [
        ...section.strengths.map(item => `Strength: ${item}`),
        ...section.gaps.map(item => `Gap: ${item}`),
        ...section.actionItems.map(item => `Action: ${item}`),
      ]);
    });

    writeBlock('Top Action Items', analysis.actionItems.map(item => `- ${item}`));
    writeBlock('Missing Keywords', analysis.missingKeywords.map(item => `- ${item}`));
    writeBlock('Quick Wins', analysis.quickWins.map(item => `- ${item}`));
    writeBlock('Long-term Improvements', analysis.longTermImprovements.map(item => `- ${item}`));

    doc.save('linkedin-optimizer-report.pdf');
  };

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 2, md: 4 }} sx={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
      <Container maxWidth="lg">
        <Stack spacing={1} mb={3}>
          <Typography variant="h4" fontWeight={800} className="pro-heading">
            {copy.title}
          </Typography>
          <Typography color="text.secondary">{copy.subtitle}</Typography>
        </Stack>

        <Card sx={{ mb: 3, borderRadius: '16px' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={<UploadFileIcon />}
                  sx={{ py: 1.5, textTransform: 'none' }}
                >
                  {profilePdf ? profilePdf.name : copy.upload}
                  <input
                    hidden
                    type="file"
                    accept="application/pdf"
                    onChange={event => setProfilePdf(event.target.files?.[0] || null)}
                  />
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button variant="contained" fullWidth onClick={runAnalysis} disabled={loading} sx={{ py: 1.5, textTransform: 'none' }}>
                  {loading ? <CircularProgress size={20} color="inherit" /> : copy.analyze}
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label={copy.rawText}
                  value={rawText}
                  onChange={event => setRawText(event.target.value)}
                  multiline
                  minRows={8}
                  fullWidth
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

        {analysis ? (
          <Stack spacing={3}>
            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  {copy.overall}: <span style={{ color: scoreColor(analysis.overallScore) }}>{analysis.overallScore}/100</span>
                </Typography>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  {analysis.profileLevel}
                </Typography>
                <Typography color="text.secondary">{analysis.summary}</Typography>
                <Divider sx={{ my: 2 }} />
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadPdf} sx={{ textTransform: 'none' }}>
                  {copy.download}
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: '16px' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  {copy.sectionBreakdown}
                </Typography>
                <Grid container spacing={2}>
                  {(Object.keys(analysis.sectionBreakdown) as Array<keyof LinkedInAnalysis['sectionBreakdown']>).map(sectionKey => {
                    const section = analysis.sectionBreakdown[sectionKey];
                    return (
                      <Grid item xs={12} md={6} key={sectionKey}>
                        <Card variant="outlined" sx={{ height: '100%' }}>
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight={700}>
                              {sectionLabel(sectionKey)}
                            </Typography>
                            <Typography sx={{ color: scoreColor(section.score), fontWeight: 700, mb: 1 }}>
                              {section.score}/100
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>Strengths</Typography>
                            <ul>
                              {section.strengths.map((item, index) => (
                                <li key={`${sectionKey}-s-${index}`}>
                                  <Typography variant="body2">{item}</Typography>
                                </li>
                              ))}
                            </ul>
                            <Typography variant="body2" fontWeight={700}>Gaps</Typography>
                            <ul>
                              {section.gaps.map((item, index) => (
                                <li key={`${sectionKey}-g-${index}`}>
                                  <Typography variant="body2">{item}</Typography>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: '16px', height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{copy.actionItems}</Typography>
                    <ul>
                      {analysis.actionItems.map((item, index) => (
                        <li key={`ai-${index}`}>
                          <Typography variant="body2">{item}</Typography>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Card sx={{ borderRadius: '16px' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{copy.missingKeywords}</Typography>
                      <ul>
                        {analysis.missingKeywords.map((keyword, index) => (
                          <li key={`kw-${index}`}>
                            <Typography variant="body2">{keyword}</Typography>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '16px' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{copy.quickWins}</Typography>
                      <ul>
                        {analysis.quickWins.map((item, index) => (
                          <li key={`qw-${index}`}>
                            <Typography variant="body2">{item}</Typography>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card sx={{ borderRadius: '16px' }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{copy.longTerm}</Typography>
                      <ul>
                        {analysis.longTermImprovements.map((item, index) => (
                          <li key={`lt-${index}`}>
                            <Typography variant="body2">{item}</Typography>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        ) : null}
      </Container>
    </Box>
  );
}
