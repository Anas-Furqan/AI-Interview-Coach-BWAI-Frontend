'use client';

import * as React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { InterviewProvider } from './context/InterviewContext';
import { AuthProvider } from '@/src/context/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0b84ff' },
    secondary: { main: '#0ea5a0' },
    background: {
      default: '#f4f7fb',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, Segoe UI, sans-serif',
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <InterviewProvider>{children}</InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
