'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import {
  registerWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogle,
} from '@/src/services/firebase/auth';
import { useInterviewContext } from '../context/InterviewContext';

export default function AuthPage() {
  const router = useRouter();
  const { user, authLoading, language } = useInterviewContext();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [authLoading, user, router]);

  const isUrdu = language === 'ur';
  const copy = {
    title: isUrdu ? 'سائن اِن' : 'Sign In',
    subtitle: isUrdu
      ? 'گوگل یا ای میل/پاس ورڈ کے ذریعے اپنا انٹرویو سیشن شروع کریں۔'
      : 'Continue with Google or email/password to start your AI Interview Coach journey.',
    login: isUrdu ? 'لاگ اِن' : 'Login',
    register: isUrdu ? 'رجسٹر' : 'Register',
    name: isUrdu ? 'نام' : 'Name',
    email: isUrdu ? 'ای میل' : 'Email',
    password: isUrdu ? 'پاس ورڈ' : 'Password',
    signInGoogle: isUrdu ? 'گوگل سے سائن اِن کریں' : 'Sign in with Google',
    signingIn: isUrdu ? 'سائن اِن ہو رہا ہے...' : 'Signing in...',
    loginButton: isUrdu ? 'لاگ اِن' : 'Log In',
    registerButton: isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account',
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSigningIn(true);
      await signInWithGoogle(language);
      router.replace('/dashboard');
    } catch (err) {
      console.error(err);
      setError(isUrdu ? 'گوگل سائن اِن ناکام ہو گیا۔ دوبارہ کوشش کریں۔' : 'Google sign-in failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError(isUrdu ? 'ای میل اور پاس ورڈ لازمی ہیں۔' : 'Email and password are required.');
      return;
    }

    try {
      setError('');
      setIsSigningIn(true);

      if (tab === 'register') {
        await registerWithEmailPassword(name, email.trim(), password, language);
      } else {
        await signInWithEmailPassword(email.trim(), password, language);
      }

      router.replace('/dashboard');
    } catch (err) {
      console.error(err);
      setError(isUrdu ? 'ای میل/پاس ورڈ تصدیق ناکام ہو گئی۔' : 'Email/password authentication failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <Box minHeight="100vh" display="grid" sx={{ placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" bgcolor="#f4f7fb">
      <Container maxWidth="sm">
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h4" fontWeight={700}>
                {copy.title}
              </Typography>
              <Typography color="text.secondary">
                {copy.subtitle}
              </Typography>
              <Tabs value={tab} onChange={(_e, value) => setTab(value)}>
                <Tab value="login" label={copy.login} />
                <Tab value="register" label={copy.register} />
              </Tabs>
              {tab === 'register' ? (
                <TextField label={copy.name} value={name} onChange={e => setName(e.target.value)} fullWidth />
              ) : null}
              <TextField label={copy.email} type="email" value={email} onChange={e => setEmail(e.target.value)} fullWidth />
              <TextField label={copy.password} type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth />
              {error ? <Alert severity="error">{error}</Alert> : null}
              <Button variant="contained" size="large" disabled={isSigningIn} onClick={handleEmailAuth}>
                {isSigningIn ? copy.signingIn : tab === 'register' ? copy.registerButton : copy.loginButton}
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<GoogleIcon />}
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
              >
                {isSigningIn ? copy.signingIn : copy.signInGoogle}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
