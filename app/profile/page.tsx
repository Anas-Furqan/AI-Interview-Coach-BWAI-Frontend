'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, TextField, Typography } from '@mui/material';
import { logout, updateCurrentUserProfile } from '@/src/services/auth';
import { useRole } from '@/src/hooks/useRole';
import { useInterviewContext } from '@/app/context/InterviewContext';
import { useAuthContext } from '@/src/context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { language } = useInterviewContext();
  const { refreshRole } = useAuthContext();
  const { user, role, authLoading, authorized } = useRole();

  const isUrdu = language === 'ur';
  const [name, setName] = useState(String(user?.displayName || ''));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(String(user?.displayName || ''));
  }, [user?.displayName]);

  const copy = useMemo(() => (
    isUrdu ? {
      title: 'میرا پروفائل',
      subtitle: 'اپنی ذاتی معلومات اپڈیٹ کریں اور اکاؤنٹ سے لاگ آؤٹ کریں۔',
      fullName: 'پورا نام',
      email: 'ای میل',
      role: 'رول',
      save: 'تبدیلیاں محفوظ کریں',
      saving: 'محفوظ ہو رہا ہے...',
      logout: 'لاگ آؤٹ',
      saved: 'پروفائل کامیابی سے اپڈیٹ ہو گیا۔',
      saveError: 'پروفائل اپڈیٹ نہیں ہو سکا۔',
      requiredName: 'براہ کرم نام درج کریں۔',
    } : {
      title: 'My Profile',
      subtitle: 'Update your basic information and sign out safely from your account.',
      fullName: 'Full Name',
      email: 'Email',
      role: 'Role',
      save: 'Save Changes',
      saving: 'Saving...',
      logout: 'Logout',
      saved: 'Profile updated successfully.',
      saveError: 'Failed to update profile.',
      requiredName: 'Please enter your name.',
    }
  ), [isUrdu]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      setError(copy.requiredName);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setMessage('');
      await updateCurrentUserProfile(name.trim(), language);
      await refreshRole();
      setMessage(copy.saved);
    } catch (saveError) {
      setError(copy.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (authLoading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress sx={{ color: 'var(--accent)' }} />
      </Box>
    );
  }

  if (!user || !authorized) {
    return null;
  }

  return (
    <Box className="pro-page" minHeight="100vh" py={{ xs: 2, md: 5 }} sx={{ direction: isUrdu ? 'rtl' : 'ltr' }}>
      <Container maxWidth="sm">
        <Card className="pro-panel" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Stack spacing={2} component="form" onSubmit={handleSave}>
              <Typography className="pro-heading" variant="h4" fontWeight={800}>{copy.title}</Typography>
              <Typography className="pro-subheading" color="text.secondary">{copy.subtitle}</Typography>

              {message ? <Alert severity="success">{message}</Alert> : null}
              {error ? <Alert severity="error">{error}</Alert> : null}

              <TextField className="pro-input-field" label={copy.fullName} value={name} onChange={event => setName(event.target.value)} fullWidth />
              <TextField className="pro-input-field" label={copy.email} value={String(user.email || '')} fullWidth disabled />
              <TextField className="pro-input-field" label={copy.role} value={String(role || 'CANDIDATE')} fullWidth disabled />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" type="submit" disabled={saving}>{saving ? copy.saving : copy.save}</Button>
                <Button variant="outlined" color="error" onClick={handleLogout}>{copy.logout}</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
