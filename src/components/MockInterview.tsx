'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useInterviewContext } from '@/app/context/InterviewContext';

const SAMPLE_QUESTIONS = [
  { id: 'q1', question: 'What is JSX and why do we use it?', difficulty: 'EASY', estimatedTime: 5, category: 'React' },
  { id: 'q2', question: 'Explain closures in JavaScript and provide a practical use case.', difficulty: 'MEDIUM', estimatedTime: 10, category: 'JavaScript' },
  { id: 'q3', question: 'Design a scalable URL shortening service. Cover database schema, API design, and deployment strategy.', difficulty: 'HARD', estimatedTime: 15, category: 'System Design' },
];

interface InterviewSession {
  status: 'idle' | 'active' | 'completed';
  currentQuestionIndex: number;
  answers: string[];
  score: number;
  feedback: string[];
}

function calculateScore(questionDifficulty: string): number {
  const baseScores: Record<string, number> = {
    EASY: 70,
    MEDIUM: 80,
    HARD: 90,
  };
  const variance = Math.random() * 10 - 5;
  return Math.round((baseScores[questionDifficulty] || 75) + variance);
}

export default function MockInterview() {
  const { language } = useInterviewContext();
  const [session, setSession] = useState<InterviewSession>({ status: 'idle', currentQuestionIndex: 0, answers: [], score: 0, feedback: [] });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);

  const isUrdu = language === 'ur';
  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'موک انٹرویو',
            start: 'شروع کریں',
            next: 'اگلا سوال',
            submit: 'جائزہ مکمل کریں',
            complete: 'انٹرویو مکمل ہو گیا',
            answerPlaceholder: 'اپنا جواب یہاں لکھیں...',
            score: 'آپ کا اسکور',
            feedback: 'تجاویز',
          }
        : {
            title: 'Mock Interview',
            start: 'Start Interview',
            next: 'Next Question',
            submit: 'Finish Session',
            complete: 'Interview Complete',
            answerPlaceholder: 'Type your answer here...',
            score: 'Your Score',
            feedback: 'Feedback',
          },
    [isUrdu]
  );

  useEffect(() => {
    if (session.status !== 'active') return;
    if (timeRemaining <= 0) {
      handleNextQuestion();
      return;
    }

    const timer = window.setTimeout(() => setTimeRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [session.status, timeRemaining]);

  const handleStart = () => {
    setSession({ status: 'active', currentQuestionIndex: 0, answers: [], score: 0, feedback: [] });
    setTimeRemaining(60);
    setCurrentAnswer('');
  };

  const handleNextQuestion = () => {
    const difficulty = SAMPLE_QUESTIONS[session.currentQuestionIndex].difficulty;
    const earned = calculateScore(difficulty);
    const nextFeedback = `${difficulty} question scored ${earned}.`;

    const nextIndex = session.currentQuestionIndex + 1;
    const nextState: InterviewSession = {
      status: nextIndex >= SAMPLE_QUESTIONS.length ? 'completed' : 'active',
      currentQuestionIndex: nextIndex,
      answers: [...session.answers, currentAnswer],
      score: session.score + earned,
      feedback: [...session.feedback, nextFeedback],
    };

    setSession(nextState);
    setCurrentAnswer('');
    setTimeRemaining(60);
  };

  const currentQuestion = SAMPLE_QUESTIONS[session.currentQuestionIndex];

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 3, md: 5 }}>
      <Box maxWidth="900px" mx="auto">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              {copy.title}
            </Typography>
          </Box>

          {session.status === 'idle' && (
            <Card className="pro-panel">
              <CardContent>
                <Stack spacing={3} alignItems="center">
                  <Typography>{isUrdu ? 'اپنے موک انٹرویو کو آج ہی شروع کریں۔' : 'Start your mock interview practice now.'}</Typography>
                  <Button variant="contained" size="large" onClick={handleStart}>
                    {copy.start}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {session.status === 'active' && currentQuestion && (
            <Card className="pro-panel">
              <CardContent>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      {`${currentQuestion.category} • ${currentQuestion.difficulty}`}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
                      {currentQuestion.question}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {isUrdu ? 'وقت باقی' : 'Time remaining'}: {timeRemaining}s
                    </Typography>
                  </Box>

                  <TextField
                    multiline
                    minRows={6}
                    value={currentAnswer}
                    onChange={(event) => setCurrentAnswer(event.target.value)}
                    placeholder={copy.answerPlaceholder}
                    fullWidth
                    sx={{ backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
                  />

                  <Box>
                    <LinearProgress variant="determinate" value={(timeRemaining / 60) * 100} sx={{ height: 10, borderRadius: 5 }} />
                  </Box>

                  <Button variant="contained" onClick={handleNextQuestion}>
                    {session.currentQuestionIndex + 1 >= SAMPLE_QUESTIONS.length ? copy.submit : copy.next}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {session.status === 'completed' && (
            <Card className="pro-panel">
              <CardContent>
                <Stack spacing={3} alignItems="center">
                  <Typography variant="h4" fontWeight={800}>{copy.complete}</Typography>
                  <Typography>{copy.score}</Typography>
                  <Typography variant="h2" fontWeight={800}>{Math.round(session.score / SAMPLE_QUESTIONS.length)}</Typography>
                  <Stack spacing={1} sx={{ width: '100%' }}>
                    {session.feedback.map((note, index) => (
                      <Typography key={index} color="text.secondary">
                        {note}
                      </Typography>
                    ))}
                  </Stack>
                  <Button variant="contained" onClick={handleStart}>{copy.start}</Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
