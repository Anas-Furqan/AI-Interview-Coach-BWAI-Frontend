'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { useInterviewContext } from '@/app/context/InterviewContext';

const ONBOARDING_CHECKLIST = [
  'Read company handbook',
  'Sign code of conduct',
  'Sign NDA',
  'Setup development environment',
  'Clone repository',
  'Install dependencies',
  'Run first test',
  'Schedule 1:1 with mentor',
];

export default function EngineerOnboarding() {
  const { language } = useInterviewContext();

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false]);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(Array(8).fill(false));
  const [formData, setFormData] = useState({ name: '', email: '', startDate: '', mentorName: '' });
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const isUrdu = language === 'ur';
  const copy = useMemo(
    () =>
      isUrdu
        ? {
            title: 'انجینئر آن بورڈنگ',
            steps: ['پروفائل سیٹ اپ', 'دستاویزات', 'تکنیکی سیٹ اپ', 'موک انٹرویو', 'توثیق'],
            next: 'اگلا',
            back: 'واپس',
            finish: 'مکمل کریں',
            name: 'نام',
            email: 'ای میل',
            startDate: 'شروع ہونے کی تاریخ',
            mentorName: 'مینٹور کا نام',
            checklist: 'چیک لسٹ',
            complete: 'آپ ٹیم کا حصہ ہیں!',
            welcome: 'بہت خوب! اب آپ شروع کرنے کے لئے تیار ہیں۔',
          }
        : {
            title: 'Engineer Onboarding',
            steps: ['Profile Setup', 'Documentation Review', 'Technical Setup', 'Mock Interview', 'Confirmation'],
            next: 'Next',
            back: 'Back',
            finish: 'Finish',
            name: 'Name',
            email: 'Email',
            startDate: 'Start Date',
            mentorName: 'Mentor Name',
            checklist: 'Checklist',
            complete: 'Welcome to the team!',
            welcome: 'You are all set and ready to contribute.',
          },
    [isUrdu]
  );

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return Boolean(formData.name && formData.email && formData.startDate);
      case 1:
        return checkedItems.slice(0, 3).every(Boolean);
      case 2:
        return checkedItems.slice(3, 7).every(Boolean);
      case 3:
        return true;
      case 4:
        return checkedItems[7];
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (activeStep === 4) {
      setOnboardingComplete(true);
      return;
    }

    if (validateStep(activeStep)) {
      setCompletedSteps((current) => current.map((value, index) => (index === activeStep ? true : value)));
      setActiveStep((value) => value + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((value) => Math.max(0, value - 1));
  };

  if (onboardingComplete) {
    return (
      <Box className="pro-page" minHeight="100vh" py={{ xs: 4, md: 6 }}>
        <Box maxWidth="700px" mx="auto" textAlign="center">
          <Typography variant="h2" fontWeight={800} gutterBottom>
            🎉
          </Typography>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {copy.complete}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {copy.welcome}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            {copy.finish}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 3, md: 5 }}>
      <Box maxWidth="1000px" mx="auto">
        <Stack spacing={4}>
          <Box>
            <Typography variant="h3" fontWeight={800} gutterBottom>
              {copy.title}
            </Typography>
          </Box>

          <Paper className="pro-panel" sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {copy.steps.map((stepLabel) => (
                <Step key={stepLabel} completed={completedSteps[copy.steps.indexOf(stepLabel)]}>
                  <StepLabel>{stepLabel}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box sx={{ mt: 4 }}>
              {activeStep === 0 && (
                <Stack spacing={3}>
                  <TextField
                    label={copy.name}
                    value={formData.name}
                    onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label={copy.email}
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                    fullWidth
                  />
                  <TextField
                    label={copy.startDate}
                    type="date"
                    value={formData.startDate}
                    onChange={(event) => setFormData((current) => ({ ...current, startDate: event.target.value }))}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label={copy.mentorName}
                    value={formData.mentorName}
                    onChange={(event) => setFormData((current) => ({ ...current, mentorName: event.target.value }))}
                    fullWidth
                  />
                </Stack>
              )}

              {activeStep === 1 && (
                <Stack spacing={2}>
                  <Typography variant="h6">{copy.checklist}</Typography>
                  {ONBOARDING_CHECKLIST.slice(0, 3).map((item, index) => (
                    <FormControlLabel
                      key={item}
                      control={<Checkbox checked={checkedItems[index]} onChange={(event) => setCheckedItems((current) => { const next = [...current]; next[index] = event.target.checked; return next; })} />}
                      label={item}
                    />
                  ))}
                </Stack>
              )}

              {activeStep === 2 && (
                <Stack spacing={2}>
                  <Typography variant="h6">{copy.checklist}</Typography>
                  {ONBOARDING_CHECKLIST.slice(3, 7).map((item, index) => (
                    <FormControlLabel
                      key={item}
                      control={<Checkbox checked={checkedItems[index + 3]} onChange={(event) => setCheckedItems((current) => { const next = [...current]; next[index + 3] = event.target.checked; return next; })} />}
                      label={item}
                    />
                  ))}
                </Stack>
              )}

              {activeStep === 3 && (
                <Stack spacing={2}>
                  <Typography variant="body1">{isUrdu ? 'اب آپ موک انٹرویو کے لئے تیار ہیں۔' : 'You are ready for the mock interview step.'}</Typography>
                  <TextField label="Notes" multiline minRows={4} fullWidth />
                </Stack>
              )}

              {activeStep === 4 && (
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Checkbox checked={checkedItems[7]} onChange={(event) => setCheckedItems((current) => { const next = [...current]; next[7] = event.target.checked; return next; })} />}
                    label={copy.checklist[7]}
                  />
                </Stack>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button disabled={activeStep === 0} onClick={handleBack}>
                {copy.back}
              </Button>
              <Button variant="contained" onClick={handleNext}>
                {activeStep === 4 ? copy.finish : copy.next}
              </Button>
            </Box>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
