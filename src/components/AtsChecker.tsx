'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import axios from 'axios';

const API_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

interface AtsResult {
  score: number;
  missingKeywords: string[];
  formattingImprovements: string[];
  summary: string;
}

import { useInterviewContext } from '@/app/context/InterviewContext';

export default function AtsChecker() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [error, setError] = useState('');

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'ATS ریزیومے چیکر',
      subtitle: 'اپنا سی وی اپ لوڈ کریں اور دیکھیں کہ یہ پیشہ ورانہ معیارات کے مطابق کتنا اسکور کرتا ہے۔',
      clickToUpload: 'اپ لوڈ کرنے کے لیے یہاں کلک کریں یا PDF ڈریگ کریں',
      onlyPdf: 'صرف PDF فائلیں سپورٹڈ ہیں',
      checkButton: 'سی وی چیک کریں',
      checking: 'چیک کیا جا رہا ہے...',
      score: 'اسکور',
      missingKeywords: 'لاپتہ کلیدی الفاظ',
      formatting: 'فارمیٹنگ میں بہتری',
      summary: 'خلاصہ',
      selectFileError: 'براہ کرم پہلے ایک PDF فائل منتخب کریں۔',
    } : {
      title: 'ATS Resume Checker',
      subtitle: 'Upload your resume to see how it scores against professional standards.',
      clickToUpload: 'Click or drag PDF here to upload',
      onlyPdf: 'Only PDF files are supported',
      checkButton: 'Check Resume',
      checking: 'Checking...',
      score: 'Score',
      missingKeywords: 'Missing Keywords',
      formatting: 'Formatting Improvements',
      summary: 'Summary',
      selectFileError: 'Please select a PDF file first.',
    }
  ), [isUrdu]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError('');
    }
  };

  const handleCheck = async () => {
    if (!file) {
      setError(copy.selectFileError);
      return;
    }

    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/ats/check`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err: any) {
      console.error('ATS Check Error:', err);
      setError(err.response?.data?.error || 'Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card" sx={{ mb: 4, borderRadius: 4, overflow: 'hidden' }}>
      <Box sx={{ height: 4, background: 'linear-gradient(90deg, rgba(99,102,241,0.95), rgba(79,70,229,0.95))' }} />
      <CardContent sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: '1.25rem', md: '1.6rem' } }}>
              <span className="text-gradient">{copy.title}</span>
            </Typography>
            <Typography className="muted-copy" sx={{ mt: 0.75 }}>
              {copy.subtitle}
            </Typography>
          </Box>

          <Box
            sx={{
              border: '1px dashed rgba(148, 163, 184, 0.35)',
              borderRadius: 3,
              p: { xs: 3, md: 4 },
              textAlign: 'center',
              bgcolor: '#000000',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              '&:hover': {
                bgcolor: 'rgba(10, 19, 39, 0.95)',
                borderColor: 'var(--accent)',
                transform: 'translateY(-2px)',
              },
            }}
            component="label"
          >
            <input type="file" hidden accept=".pdf" onChange={handleFileChange} />
            <CloudUploadIcon sx={{ fontSize: 52, color: 'var(--text-secondary)', mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {file ? file.name : copy.clickToUpload}
            </Typography>
            <Typography variant="body2" className="muted-copy" sx={{ mt: 0.5 }}>
              {copy.onlyPdf}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            className="neon-button"
            size="large"
            disabled={!file || loading}
            onClick={handleCheck}
            sx={{ py: 1.5, borderRadius: 999 }}
          >
            {loading ? copy.checking : copy.checkButton}
          </Button>

          {result && (
            <Box sx={{ mt: 1, p: { xs: 2.5, md: 3.5 }, bgcolor: 'rgba(7, 13, 29, 0.86)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.08)' }}>
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box textAlign="center">
                    <Typography variant="h6" sx={{ color: 'var(--text-secondary)', fontWeight: 700 }}>{copy.score}</Typography>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mt: 1 }}>
                      <CircularProgress variant="determinate" value={result.score} size={96} thickness={5} sx={{ color: 'var(--accent)' }} />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="h6" component="div" fontWeight={800}>
                          {result.score}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" fontWeight={800} gutterBottom>
                    {copy.summary}
                  </Typography>
                  <Typography className="muted-copy" paragraph>
                    {result.summary}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                    <ErrorOutlineIcon color="error" /> {copy.missingKeywords}
                  </Typography>
                  <List dense>
                    {result.missingKeywords.map((kw, i) => (
                      <ListItem key={i}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} /></ListItemIcon>
                        <ListItemText primary={kw} primaryTypographyProps={{ color: 'text.primary' }} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={700} display="flex" alignItems="center" gap={1}>
                    <CheckCircleOutlineIcon color="success" /> {copy.formatting}
                  </Typography>
                  <List dense>
                    {result.formattingImprovements.map((imp, i) => (
                      <ListItem key={i}>
                        <ListItemIcon sx={{ minWidth: 30 }}><Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} /></ListItemIcon>
                        <ListItemText primary={imp} primaryTypographyProps={{ color: 'text.primary' }} />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
