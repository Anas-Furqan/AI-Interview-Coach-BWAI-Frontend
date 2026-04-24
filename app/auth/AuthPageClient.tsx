'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, MenuItem, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import {
  registerWithEmailPassword,
  signInWithEmailPassword,
  signInWithGoogle,
  type UserRole,
} from '@/src/services/auth';
import { useInterviewContext } from '../context/InterviewContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthPageClient() {
  const router = useRouter();
  const { user, authLoading, language, role: currentRole } = useInterviewContext();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CANDIDATE');
  const [safeNext, setSafeNext] = useState('');

  const getRouteForRole = (nextRole: string) => {
    if (nextRole === 'ADMIN') return '/admin/dashboard';
    if (nextRole === 'RECRUITER') return '/recruiter/dashboard';
    return '/interview';
  };
  useEffect(() => {
    const nextParam = new URLSearchParams(window.location.search).get('next') || '';
    setSafeNext(nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '');
  }, []);

  const roleCanOpenPath = (nextRole: string, path: string) => {
    if (path.startsWith('/admin')) return nextRole === 'ADMIN';
    if (path.startsWith('/recruiter')) return nextRole === 'RECRUITER' || nextRole === 'ADMIN';
    if (path.startsWith('/dashboard')) return nextRole === 'CANDIDATE';
    return true;
  };

  const getRedirectTarget = (nextRole: string) => {
    if (safeNext && roleCanOpenPath(nextRole, safeNext)) {
      return safeNext;
    }
    return getRouteForRole(nextRole);
  };

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(getRedirectTarget(currentRole || 'CANDIDATE'));
    }
  }, [authLoading, user, router, currentRole, safeNext]);

  const isUrdu = language === 'ur';
  const copy = {
    title: isUrdu ? 'سائن اِن' : 'Sign In',
    subtitle: isUrdu
      ? 'گوگل یا ای میل/پاس ورڈ کے ذریعے اپنا انٹرویو سیشن شروع کریں۔'
      : 'Continue with Google or email/password to start your AI Interview Coach journey.',
    login: isUrdu ? 'لاگ اِن' : 'Login',
    register: isUrdu ? 'رجسٹر' : 'Register',
    accountRole: isUrdu ? 'اکاؤنٹ رول' : 'Account Role',
    name: isUrdu ? 'نام' : 'Name',
    email: isUrdu ? 'ای میل' : 'Email',
    password: isUrdu ? 'پاس ورڈ' : 'Password',
    signInGoogle: isUrdu ? 'گوگل سے سائن اِن کریں' : 'Sign in with Google',
    signingIn: isUrdu ? 'سائن اِن ہو رہا ہے...' : 'Signing in...',
    loginButton: isUrdu ? 'لاگ اِن' : 'Log In',
    registerButton: isUrdu ? 'اکاؤنٹ بنائیں' : 'Create Account',
    adminRestricted: isUrdu ? 'ایڈمن رسائی صرف منظور شدہ ای میلز کے لیے دستیاب ہے۔' : 'Admin access is restricted to approved emails only.',
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsSigningIn(true);
      const nextRole = await signInWithGoogle(language, role);
      router.replace(getRedirectTarget(nextRole));
    } catch (err) {
      setError(err instanceof Error ? err.message : (isUrdu ? 'گوگل سائن اِن ناکام ہو گیا۔ دوبارہ کوشش کریں۔' : 'Google sign-in failed. Please try again.'));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError(isUrdu ? 'ای میل اور پاس ورڈ لازمی ہیں۔' : 'Email and password are required.');
      return;
    }

    if (tab === 'register' && password.trim().length < 6) {
      setError(isUrdu ? 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے۔' : 'Password must be at least 6 characters long.');
      return;
    }

    try {
      setError('');
      setIsSigningIn(true);

      if (tab === 'register') {
        const nextRole = await registerWithEmailPassword(name, email.trim().toLowerCase(), password, language, role);
        router.replace(getRedirectTarget(nextRole));
      } else {
        const nextRole = await signInWithEmailPassword(email.trim().toLowerCase(), password, language);
        router.replace(getRedirectTarget(nextRole));
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : (isUrdu ? 'ای میل/پاس ورڈ تصدیق ناکام ہو گئی۔' : 'Email/password authentication failed.'));
    } finally {
      setIsSigningIn(false);
    }
  };

  if (authLoading) {
    return (
      <Box 
        minHeight="100vh" 
        display="grid" 
        sx={{ placeItems: 'center' }}
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <CircularProgress sx={{ color: 'var(--accent)' }} />
        </motion.div>
      </Box>
    );
  }

  return (
    <Box 
      minHeight="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      sx={{ 
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 1.5, md: 4 },
        px: { xs: 1, md: 2 },
      }}
    >
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 4, repeat: Infinity }}
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      <Box
        component={motion.div}
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(79, 70, 229, 0.18) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />
      
      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1, maxHeight: '100vh', overflowY: 'auto', py: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Card className="pro-card" sx={{ 
            background: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <Box sx={{
              height: 4,
              background: 'linear-gradient(90deg, rgba(99,102,241,0.95), rgba(79,70,229,0.95))',
              backgroundSize: '200% 100%',
              animation: 'gradientMove 3s ease infinite',
              '@keyframes gradientMove': {
                '0%': { backgroundPosition: '0% 50%' },
                '100%': { backgroundPosition: '200% 50%' }
              }
            }} />
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Typography 
                    variant="h3" 
                    fontWeight={800}
                    sx={{
                      fontSize: { xs: '2rem', md: '3rem' },
                      background: 'var(--accent)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    {copy.title}
                  </Typography>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                    {copy.subtitle}
                  </Typography>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Tabs 
                    value={tab} 
                    onChange={(_e, value) => setTab(value)}
                    sx={{
                      '& .MuiTabs-indicator': {
                        background: 'linear-gradient(90deg, rgba(99,102,241,0.95), rgba(79,70,229,0.95))',
                        height: 3,
                        borderRadius: 2,
                      }
                    }}
                  >
                    <Tab 
                      value="login" 
                      label={copy.login}
                      sx={{ 
                        color: 'text.secondary',
                        '&.Mui-selected': { color: 'var(--accent)' }
                      }} 
                    />
                    <Tab 
                      value="register" 
                      label={copy.register}
                      sx={{ 
                        color: 'text.secondary',
                        '&.Mui-selected': { color: 'var(--accent)' }
                      }} 
                    />
                  </Tabs>
                </motion.div>

                <AnimatePresence mode="wait">
                  {tab === 'register' && (
                    <motion.div
                      key="register-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                        <TextField 
                          label={copy.name} 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          fullWidth 
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(15, 23, 42, 0.8)',
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(99, 102, 241, 0.5)',
                              },
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'var(--accent)',
                              },
                            },
                          }}
                        />
                        <TextField
                          select
                          label={copy.accountRole}
                          value={role}
                          onChange={e => setRole(e.target.value as UserRole)}
                          fullWidth
                          sx={{ mt: 2,
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            },
                          }}
                        >
                          <MenuItem value="CANDIDATE">Candidate</MenuItem>
                          <MenuItem value="RECRUITER">Recruiter</MenuItem>
                        </TextField>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'var(--text-secondary)' }}>
                          {copy.adminRestricted}
                        </Typography>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <TextField 
                    label={copy.email} 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      },
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <TextField 
                    label={copy.password} 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    fullWidth 
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      },
                    }}
                  />
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Alert severity="error" sx={{ 
                        borderRadius: 2,
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {error}
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button 
                    variant="contained" 
                    size="large" 
                    disabled={isSigningIn} 
                    onClick={handleEmailAuth}
                    fullWidth
                    sx={{
                      py: 1.5,
                      background: 'var(--accent)',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      '&:hover': {
                        background: 'var(--accent)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.25)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isSigningIn ? copy.signingIn : tab === 'register' ? copy.registerButton : copy.loginButton}
                  </Button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<GoogleIcon />}
                    disabled={isSigningIn}
                    onClick={handleGoogleSignIn}
                    fullWidth
                    sx={{
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderColor: 'rgba(99, 102, 241, 0.5)',
                      color: 'text.primary',
                      '&:hover': {
                        borderColor: 'var(--accent)',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isSigningIn ? copy.signingIn : copy.signInGoogle}
                  </Button>
                </motion.div>
              </Stack>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}
