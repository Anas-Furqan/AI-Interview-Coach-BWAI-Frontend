'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useInterviewContext } from '@/app/context/InterviewContext';

const mockCandidate = {
  name: 'Ahmed Johnson',
  profileScore: 85,
  experience: '3 years',
  interviewsCompleted: 5,
  averageScore: 83,
  interviewTrend: [
    { date: 'Jan', score: 78 },
    { date: 'Feb', score: 80 },
    { date: 'Mar', score: 83 },
    { date: 'Apr', score: 85 },
  ],
  skills: [
    { skill: 'React', stars: 5 },
    { skill: 'TypeScript', stars: 4 },
    { skill: 'Node.js', stars: 4 },
    { skill: 'Docker', stars: 3 },
  ],
  feedback: ['Strong fundamentals', 'Good communication', 'Needs async mastery'],
};

export default function CandidateDashboard() {
  const { language } = useInterviewContext();
  const [activeTab, setActiveTab] = useState<'analytics' | 'skills' | 'feedback'>('analytics');
  const [profileVisible, setProfileVisible] = useState(true);

  const isUrdu = language === 'ur';
  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'کینڈیڈیٹ ڈیش بورڈ',
            subtitle: 'اپنی کارکردگی، پروفائل دکھاؤ اور انٹرویو ریکارڈ دیکھیں۔',
            profileVisibility: 'ریکروٹرز کے لیے دکھائیں/چھپائیں',
            analytics: 'اینالٹکس',
            skills: 'اسکلز',
            feedback: 'فیڈبیک',
            interviews: 'انٹرویوز مکمل',
            avgScore: 'اوسط اسکور',
            experience: 'تجربہ',
            visibilityOn: 'دکھائی دے رہی ہے',
            visibilityOff: 'چھپی ہوئی ہے',
            questions: 'انٹرویو ٹرینڈ',
            noSkills: 'کوئی اسکلز دستیاب نہیں۔',
          }
        : {
            title: 'Candidate Dashboard',
            subtitle: 'Personal analytics, profile visibility, and interview history at a glance.',
            profileVisibility: 'Show / Hide from Recruiters',
            analytics: 'Analytics',
            skills: 'Skills',
            feedback: 'Feedback',
            interviews: 'Interviews Completed',
            avgScore: 'Average Score',
            experience: 'Experience',
            visibilityOn: 'Visible to recruiters',
            visibilityOff: 'Hidden from recruiters',
            questions: 'Interview Trend',
            noSkills: 'No skills added yet.',
          },
    [isUrdu]
  );

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 3, md: 5 }}>
      <Box maxWidth="1200px" mx="auto">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              {copy.title}
            </Typography>
            <Typography color="text.secondary">{copy.subtitle}</Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card className="pro-panel">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {copy.interviews}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mb: 2 }}>
                    {mockCandidate.interviewsCompleted}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {copy.avgScore}: {mockCandidate.averageScore}
                  </Typography>
                  <Typography variant="subtitle2" color="text.secondary">
                    {copy.experience}: {mockCandidate.experience}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card className="pro-panel">
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        {copy.profileVisibility}
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ mt: 1 }}>
                        {profileVisible ? copy.visibilityOn : copy.visibilityOff}
                      </Typography>
                    </Box>
                    <Button variant="contained" onClick={() => setProfileVisible((value) => !value)}>
                      {profileVisible ? isUrdu ? 'Hide Profile' : 'Hide Profile' : isUrdu ? 'Show Profile' : 'Show Profile'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card className="pro-panel">
            <CardContent>
              <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
                <Tab value="analytics" label={copy.analytics} />
                <Tab value="skills" label={copy.skills} />
                <Tab value="feedback" label={copy.feedback} />
              </Tabs>

              {activeTab === 'analytics' && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {copy.questions}
                  </Typography>
                  <Box sx={{ width: '100%', height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={mockCandidate.interviewTrend} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="date" stroke="rgba(148,163,184,0.7)" />
                        <YAxis stroke="rgba(148,163,184,0.7)" domain={[70, 90]} />
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.18)' }} />
                        <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                </Box>
              )}

              {activeTab === 'skills' && (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {mockCandidate.skills.map((skill) => (
                    <Grid key={skill.skill} item xs={12} sm={6} md={3}>
                      <Card sx={{ p: 2, minHeight: 120 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                          {skill.skill}
                        </Typography>
                        <LinearProgress variant="determinate" value={(skill.stars / 5) * 100} sx={{ height: 10, borderRadius: 5 }} />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          {skill.stars} / 5
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                  {mockCandidate.skills.length === 0 && <Typography color="text.secondary">{copy.noSkills}</Typography>}
                </Grid>
              )}

              {activeTab === 'feedback' && (
                <Stack spacing={2} sx={{ mt: 3 }}>
                  {mockCandidate.feedback.map((note) => (
                    <Chip key={note} label={note} variant="outlined" />
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </Box>
  );
}
