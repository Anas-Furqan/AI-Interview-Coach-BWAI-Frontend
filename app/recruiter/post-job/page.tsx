'use client';

import { FormEvent, useState, useMemo } from 'react';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { createJob } from '@/src/services/firebase/firestore';
import { useInterviewContext } from '@/app/context/InterviewContext';
import { useRole } from '@/src/hooks/useRole';

export default function RecruiterPostJobPage() {
  const { language } = useInterviewContext();
  const isUrdu = language === 'ur';

  const { user, authLoading, authorized } = useRole({ roles: ['recruiter'], redirectTo: '/dashboard' });
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [salary, setSalary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'ملازمت پوسٹ کریں',
      subtitle: 'نئی ملازمتیں ایڈمن کی منظوری تک زیر التواء رہیں گی۔',
      jobTitle: 'ملازمت کا عنوان',
      company: 'کمپنی',
      logoUrl: 'لوگو یو آر ایل (آپشنل)',
      description: 'تفصیل',
      salary: 'تنخواہ',
      submit: 'منظوری کے لیے بھیجیں',
      submitting: 'بھیجا جا رہا ہے...',
      success: 'ملازمت منظوری کے لیے جمع کر دی گئی ہے۔',
      fillError: 'براہ کرم تمام مطلوبہ خانے پُر کریں۔',
      error: 'ملازمت جمع کرنے میں ناکامی۔ دوبارہ کوشش کریں۔',
    } : {
      title: 'Post a Job',
      subtitle: 'New jobs are created with pending status until approved by an admin.',
      jobTitle: 'Job Title',
      company: 'Company',
      logoUrl: 'Logo URL (Optional)',
      description: 'Description',
      salary: 'Salary',
      submit: 'Submit for Approval',
      submitting: 'Submitting...',
      success: 'Job submitted for admin approval.',
      fillError: 'Please fill all required fields.',
      error: 'Failed to submit job. Please try again.',
    }
  ), [isUrdu]);

  if (authLoading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!authorized || !user) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!title.trim() || !company.trim() || !description.trim() || !salary.trim()) {
      setError(copy.fillError);
      return;
    }

    try {
      setError('');
      setMessage('');
      setSubmitting(true);

      await createJob({
        title: title.trim(),
        company: company.trim(),
        logoUrl: logoUrl.trim(),
        description: description.trim(),
        salary: salary.trim(),
        recruiterId: user.uid,
      });

      setTitle('');
      setCompany('');
      setLogoUrl('');
      setDescription('');
      setSalary('');
      setMessage(copy.success);
    } catch (submitError) {
      console.error(submitError);
      setError(copy.error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      minHeight="100vh"
      bgcolor="#f4f7fb"
      py={4}
      sx={{
        direction: isUrdu ? 'rtl' : 'ltr',
        fontFamily: isUrdu ? '"Noto Nastaliq Urdu", serif' : 'inherit'
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.05)' }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={3} component="form" onSubmit={handleSubmit}>
              <Box>
                <Typography variant="h5" fontWeight={800}>{copy.title}</Typography>
                <Typography color="text.secondary">{copy.subtitle}</Typography>
              </Box>

              {message ? <Alert severity="success" sx={{ borderRadius: 2 }}>{message}</Alert> : null}
              {error ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert> : null}

              <TextField label={copy.jobTitle} value={title} onChange={e => setTitle(e.target.value)} required fullWidth />
              <TextField label={copy.company} value={company} onChange={e => setCompany(e.target.value)} required fullWidth />
              <TextField label={copy.logoUrl} value={logoUrl} onChange={e => setLogoUrl(e.target.value)} fullWidth />
              <TextField
                label={copy.description}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                multiline
                rows={5}
                fullWidth
              />
              <TextField label={copy.salary} value={salary} onChange={e => setSalary(e.target.value)} required fullWidth />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
              >
                {submitting ? copy.submitting : copy.submit}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
