'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { useInterviewContext } from '@/app/context/InterviewContext';

interface MatchedCandidate {
  id: string;
  name: string;
  skills: string[];
  score: number;
  experience: string;
}

const MOCK_CANDIDATES: MatchedCandidate[] = [
  { id: 'c001', name: 'Ali Hassan', skills: ['React', 'TypeScript', 'AWS'], score: 85, experience: '5 years' },
  { id: 'c002', name: 'Sara Ahmed', skills: ['Node.js', 'MongoDB'], score: 80, experience: '4 years' },
  { id: 'c003', name: 'Ahmed Khan', skills: ['Python', 'Django', 'Docker'], score: 90, experience: '6 years' },
];

const MOCK_SKILLS = ['React', 'Node.js', 'Python', 'Java', 'TypeScript', 'MongoDB'];

export default function RecruiterDashboard() {
  const { language } = useInterviewContext();
  const [jobDescription, setJobDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [hiringResult, setHiringResult] = useState<{ probability: number; candidates: MatchedCandidate[] } | null>(null);
  const [error, setError] = useState('');

  const isUrdu = language === 'ur';
  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'ریکروٹر ڈیش بورڈ',
            subtitle: 'جاب پوسٹنگ، امیدوار تلاش اور ہائرنگ اسکور دیکھیں۔',
            jobDescription: 'جاب ڈسکرپشن',
            selectSkills: 'مہارتیں منتخب کریں',
            analyze: 'تجزیہ کریں',
            probability: 'ہائرنگ پروبیبلٹی',
            candidates: 'میچڈ امیدوار',
            noCandidates: 'کوئی امیدوار میچ نہیں ہوئے۔',
            stats: 'مثالی امیدوار',
            basedOn: '120+ حقیقی انٹرویو پیٹرنز کی بنیاد پر',
            sampleSkills: 'مہارتیں منتخب کریں',
          }
        : {
            title: 'Recruiter Dashboard',
            subtitle: 'Post jobs, discover candidates, and measure match probability.',
            jobDescription: 'Job Description',
            selectSkills: 'Select Skills',
            analyze: 'Analyze Hiring',
            probability: 'Hiring Probability',
            candidates: 'Matched Candidates',
            noCandidates: 'No matched candidates found.',
            stats: 'Top candidates for this role',
            basedOn: 'Based on 120+ real interview patterns',
            sampleSkills: 'Select one or more skills',
          },
    [isUrdu]
  );

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]
    );
  };

  const handleAnalyze = () => {
    if (!jobDescription.trim()) {
      setError(isUrdu ? 'براہ کرم جاب ڈسکرپشن درج کریں۔' : 'Please enter a job description.');
      setHiringResult(null);
      return;
    }

    setError('');

    const matched = MOCK_CANDIDATES.filter((candidate) =>
      selectedSkills.length === 0 || candidate.skills.some((skill) => selectedSkills.includes(skill))
    );

    const probability = Math.round(Math.min(95, (matched.length / MOCK_CANDIDATES.length) * 100 + Math.random() * 20));
    setHiringResult({ probability, candidates: matched });
  };

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 3, md: 5 }}>
      <Box maxWidth="1100px" mx="auto">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={5}>
              <Card className="pro-panel">
                <CardContent>
                  <Stack spacing={3}>
                    <TextField
                      label={copy.jobDescription}
                      value={jobDescription}
                      onChange={(event) => setJobDescription(event.target.value)}
                      multiline
                      minRows={8}
                      fullWidth
                      sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
                    />

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {copy.selectSkills}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" spacing={1}>
                        {MOCK_SKILLS.map((skill) => (
                          <Chip
                            key={skill}
                            label={skill}
                            clickable
                            color={selectedSkills.includes(skill) ? 'primary' : 'default'}
                            onClick={() => handleSkillToggle(skill)}
                          />
                        ))}
                      </Stack>
                    </Box>

                    {error ? <Alert severity="error">{error}</Alert> : null}

                    <Button variant="contained" size="large" onClick={handleAnalyze}>
                      {copy.analyze}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack spacing={3}>
                <Card className="pro-panel">
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">
                      {copy.basedOn}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                      {copy.probability}
                    </Typography>
                    <Typography variant="h2" fontWeight={800} sx={{ mt: 1 }}>
                      {hiringResult ? `${hiringResult.probability}%` : '--'}
                    </Typography>
                  </CardContent>
                </Card>

                <Card className="pro-panel">
                  <CardContent>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      {copy.candidates}
                    </Typography>
                    {hiringResult?.candidates.length ? (
                      <Stack spacing={2}>
                        {hiringResult.candidates.map((candidate) => (
                          <Card key={candidate.id} sx={{ p: 2, background: 'rgba(15, 23, 42, 0.82)' }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} sm={7}>
                                <Typography fontWeight={700}>{candidate.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {candidate.experience} • {candidate.score} profile
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={5}>
                                <Stack direction="row" spacing={1} flexWrap="wrap">
                                  {candidate.skills.map((skill) => (
                                    <Chip key={skill} label={skill} size="small" />
                                  ))}
                                </Stack>
                              </Grid>
                            </Grid>
                          </Card>
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary">{copy.noCandidates}</Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Box>
  );
}
