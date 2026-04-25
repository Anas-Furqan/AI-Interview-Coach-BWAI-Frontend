'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Rating,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useInterviewContext } from '@/app/context/InterviewContext';

interface InterviewTask {
  id: number;
  role: string;
  company: string;
  duration: string;
  pay: string;
  difficulty: string;
  candidates: number;
}

const INTERVIEW_TASKS: InterviewTask[] = [
  { id: 1, role: 'React Developer Interview', company: 'TechCorp', duration: '60 mins', pay: '$150', difficulty: 'Medium', candidates: 5 },
  { id: 2, role: 'Python Backend Review', company: 'StartupXYZ', duration: '45 mins', pay: '$120', difficulty: 'Hard', candidates: 3 },
  { id: 3, role: 'Node.js Technical Screen', company: 'CloudSys', duration: '30 mins', pay: '$100', difficulty: 'Easy', candidates: 8 },
];

export default function InterviewerDashboard() {
  const { language } = useInterviewContext();
  const [activeInterview, setActiveInterview] = useState<InterviewTask | null>(null);
  const [showEvaluationDialog, setShowEvaluationDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [evaluation, setEvaluation] = useState({ rating: 0, feedback: '' });
  const [completedInterviews, setCompletedInterviews] = useState<number[]>([]);

  const isUrdu = language === 'ur';
  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'انٹرویور ڈیش بورڈ',
            subtitle: 'انٹرویو مواقع، ادائیگی کا جائزہ اور اپنی کارکردگی دیکھیں۔',
            start: 'انٹرویو شروع کریں',
            evaluate: 'تشخیص کریں',
            payment: 'ادائیگی',
            earnings: 'کمائی',
            completed: 'مکمل شدہ انٹرویوز',
            taskList: 'دستیاب انٹرویو ٹاسک',
            submitFeedback: 'رائے جمع کریں',
            paymentSuccess: 'Payment Credited!',
            feedbackPlaceholder: 'ریویو یا فیڈبیک لکھیں...',
          }
        : {
            title: 'Interviewer Dashboard',
            subtitle: 'Browse opportunities, track earnings, and evaluate interviews.',
            start: 'Start Interview',
            evaluate: 'Evaluate',
            payment: 'Payment',
            earnings: 'Earnings',
            completed: 'Completed Interviews',
            taskList: 'Available Interview Tasks',
            submitFeedback: 'Submit Feedback',
            paymentSuccess: 'Payment Credited!',
            feedbackPlaceholder: 'Leave rating and feedback...',
          },
    [isUrdu]
  );

  const totalEarnings = completedInterviews.length * 133;

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
            <Grid item xs={12} md={4}>
              <Card className="pro-panel">
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    {copy.completed}
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ mt: 1 }}>
                    {completedInterviews.length}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    {copy.earnings}: ${totalEarnings}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card className="pro-panel">
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {copy.taskList}
                  </Typography>
                  <Stack spacing={2}>
                    {INTERVIEW_TASKS.map((task) => (
                      <Card key={task.id} sx={{ p: 2, background: 'rgba(15, 23, 42, 0.85)' }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={8}>
                            <Typography fontWeight={700}>{task.role}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {task.company} • {task.duration} • {task.difficulty}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                              <Chip label={task.pay} size="small" />
                              <Chip label={`${task.candidates} candidates`} size="small" />
                            </Stack>
                          </Grid>
                          <Grid item xs={12}>
                            <Button
                              variant="contained"
                              onClick={() => {
                                setActiveInterview(task);
                                setShowEvaluationDialog(true);
                              }}
                            >
                              {copy.start}
                            </Button>
                          </Grid>
                        </Grid>
                      </Card>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Dialog open={showEvaluationDialog} onClose={() => setShowEvaluationDialog(false)}>
            <DialogTitle>{copy.evaluate}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
                <Typography>{activeInterview?.role}</Typography>
                <Rating
                  name="evaluation-rating"
                  value={evaluation.rating}
                  onChange={(_, value) => setEvaluation((current) => ({ ...current, rating: value || 0 }))}
                />
                <TextField
                  multiline
                  minRows={4}
                  value={evaluation.feedback}
                  onChange={(event) => setEvaluation((current) => ({ ...current, feedback: event.target.value }))}
                  placeholder={copy.feedbackPlaceholder}
                  fullWidth
                  sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowEvaluationDialog(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={() => {
                  if (activeInterview) {
                    setCompletedInterviews((current) => [...current, activeInterview.id]);
                  }
                  setShowEvaluationDialog(false);
                  setShowPaymentDialog(true);
                }}
              >
                {copy.submitFeedback}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={showPaymentDialog} onClose={() => setShowPaymentDialog(false)}>
            <DialogTitle>{copy.payment}</DialogTitle>
            <DialogContent>
              <Typography>{copy.paymentSuccess}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {activeInterview?.pay} has been credited for your completed session.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowPaymentDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Stack>
      </Box>
    </Box>
  );
}
