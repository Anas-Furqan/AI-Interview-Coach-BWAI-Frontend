'use client';

import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useInterviewContext } from '@/app/context/InterviewContext';

interface MatchedCandidate {
  id: string;
  name: string;
  email: string;
  skills: string[];
  profile_score: number;
  match_score: number;
  avatar?: string;
  matched_skills?: string[];
}

interface HiringAnalysisResponse {
  success: boolean;
  jobTitle: string;
  requiredSkills: string[];
  hiringProbability: number;
  totalCandidates: number;
  matchedCandidates: MatchedCandidate[];
  message: string;
}

const BACKEND_BASE_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

export default function SmartHiringHeader() {
  const { language } = useInterviewContext();
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HiringAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isUrdu = language === 'ur';

  const copy = useMemo(
    () =>
      isUrdu
        ? {
            headline: 'ہائرنگ انٹیلی جنس سسٹم',
            subheading: 'جاب ڈسکرپشن ڈالیں اور AI سے بہترین امیدوار میچنگ اسکور حاصل کریں۔',
            titleLabel: 'جاب ٹائٹل',
            descriptionLabel: 'جاب ڈسکرپشن',
            analyzeButton: 'تجزیہ کریں',
            sampleButton: 'نمونہ بھریں',
            successMessage: 'نتائج تیار ہیں۔',
            noResults: 'کوئی میچ نہیں ملا۔',
            backendError: 'تجزیہ کرتے وقت خرابی ہوئی۔ دوبارہ کوشش کریں۔',
            requiredSkills: 'ضروری اسکلز',
            hiringProbability: 'ہائرنگ پروبیبلٹی',
            totalCandidates: 'کل امیدوار',
            matchedCandidates: 'میچڈ امیدوار',
            profileScore: 'پروفائل اسکور',
            matchScore: 'میچ اسکور',
            refresh: 'دوبارہ کریں',
          }
        : {
            headline: 'Hiring Intelligence System',
            subheading: 'Paste a job description and get AI-powered candidate match scoring.',
            titleLabel: 'Job Title',
            descriptionLabel: 'Job Description',
            analyzeButton: 'Analyze Job',
            sampleButton: 'Fill Sample',
            successMessage: 'Results are ready.',
            noResults: 'No candidates matched this job description.',
            backendError: 'Unable to analyze the job. Please try again.',
            requiredSkills: 'Required Skills',
            hiringProbability: 'Hiring Probability',
            totalCandidates: 'Total Candidates',
            matchedCandidates: 'Matched Candidates',
            profileScore: 'Profile Score',
            matchScore: 'Match Score',
            refresh: 'Refresh',
          },
    [isUrdu]
  );

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      setError(isUrdu ? 'براہ کرم جاب ڈسکرپشن درج کریں۔' : 'Please enter a job description');
      setResult(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/api/hiring/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          jobTitle: jobTitle.trim() || 'Untitled Position',
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || copy.backendError);
      }

      const data = (await response.json()) as HiringAnalysisResponse;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.backendError);
    } finally {
      setLoading(false);
    }
  };

  const fillSample = () => {
    setJobTitle('Senior React Developer');
    setJobDescription('We seek a React specialist with 5+ years experience building production-grade applications using React, TypeScript, Node.js, and AWS.');
    setResult(null);
    setError(null);
  };

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 4, md: 6 }}>
      <Box maxWidth="1000px" mx="auto">
        <Card className="pro-panel" sx={{ p: { xs: 2, md: 3 } }}>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography variant="overline" sx={{ color: 'var(--accent)', letterSpacing: 2 }}>
                  {copy.headline}
                </Typography>
                <Typography variant="h3" fontWeight={800} sx={{ mt: 1, mb: 1 }}>
                  {copy.subheading}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={5}>
                  <Stack spacing={3}>
                    <TextField
                      label={copy.titleLabel}
                      value={jobTitle}
                      onChange={(event) => setJobTitle(event.target.value)}
                      fullWidth
                      sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
                    />

                    <TextField
                      label={copy.descriptionLabel}
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      fullWidth
                      multiline
                      minRows={10}
                      sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
                    />

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleAnalyze}
                        disabled={loading}
                        sx={{ background: 'var(--accent)' }}
                      >
                        {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : copy.analyzeButton}
                      </Button>
                      <Button variant="outlined" size="large" onClick={fillSample}>
                        {copy.sampleButton}
                      </Button>
                    </Stack>

                    {error ? <Alert severity="error">{error}</Alert> : null}
                  </Stack>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Card sx={{ background: 'rgba(15, 23, 42, 0.72)', border: '1px solid rgba(148, 163, 184, 0.18)' }}>
                    <CardContent>
                      {loading ? (
                        <Box display="grid" sx={{ placeItems: 'center', minHeight: 300 }}>
                          <CircularProgress sx={{ color: 'var(--accent)' }} />
                        </Box>
                      ) : result ? (
                        <Stack spacing={2}>
                          <Typography variant="subtitle2" color="text.secondary">
                            {copy.successMessage}
                          </Typography>
                          <Typography variant="h5" fontWeight={700}>
                            {result.jobTitle}
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {result.requiredSkills.length === 0 ? (
                              <Chip label={copy.noResults} variant="outlined" />
                            ) : result.requiredSkills.map((skill) => (
                              <Chip key={skill} label={skill} color="primary" />
                            ))}
                          </Stack>

                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {copy.hiringProbability}
                            </Typography>
                            <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5 }}>
                              {result.hiringProbability}%
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={result.hiringProbability}
                              sx={{ height: 10, borderRadius: 5, mt: 1 }}
                            />
                          </Box>

                          <Stack direction="row" spacing={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {copy.totalCandidates}
                              </Typography>
                              <Typography fontWeight={700}>{result.totalCandidates}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {copy.matchedCandidates}
                              </Typography>
                              <Typography fontWeight={700}>{result.matchedCandidates.length}</Typography>
                            </Box>
                          </Stack>

                          <Stack spacing={2}>
                            {result.matchedCandidates.map((candidate) => (
                              <Card key={candidate.id} sx={{ background: 'rgba(30, 41, 59, 0.9)' }}>
                                <CardContent>
                                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                    <Avatar src={candidate.avatar} alt={candidate.name} sx={{ bgcolor: 'var(--accent)' }}>
                                      {candidate.name.charAt(0)}
                                    </Avatar>
                                    <Box>
                                      <Typography fontWeight={700}>{candidate.name}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {candidate.email}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                                    <Chip label={`${copy.profileScore}: ${candidate.profile_score}`} size="small" />
                                    <Chip label={`${copy.matchScore}: ${candidate.match_score}`} size="small" color="success" />
                                  </Stack>
                                  {candidate.matched_skills?.length ? (
                                    <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
                                      {candidate.matched_skills.map((skill) => (
                                        <Chip key={skill} label={skill} size="small" color="info" />
                                      ))}
                                    </Stack>
                                  ) : null}
                                </CardContent>
                              </Card>
                            ))}
                          </Stack>
                        </Stack>
                      ) : (
                        <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}>
                          <Typography color="text.secondary">{isUrdu ? 'تجزیہ شروع کرنے کے لئے جاب ڈسکرپشن درج کریں۔' : 'Enter a job description to analyze candidate fit.'}</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
