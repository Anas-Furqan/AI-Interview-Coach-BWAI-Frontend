'use client';

import * as React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { InterviewProvider } from './context/InterviewContext';
import { AuthProvider } from '@/src/context/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { 
      main: '#00d4ff',
      light: '#5ce1ff',
      dark: '#00a3cc',
    },
    secondary: { 
      main: '#a855f7',
      light: '#c084fc',
      dark: '#7c3aed',
    },
    background: {
      default: '#010614',
      paper: '#1e293b',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
    },
    error: {
      main: '#ef4444',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    info: {
      main: '#3b82f6',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, Segoe UI, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: `
            radial-gradient(ellipse at 20% 20%, rgba(0, 212, 255, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(236, 72, 153, 0.05) 0%, transparent 70%),
            linear-gradient(180deg, #010614 0%, #0f172a 50%, #020617 100%)
          `,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          color: '#f8fafc',
        },
        a: {
          color: 'inherit',
          textDecoration: 'none',
        },
        '.MuiContainer-root': {
          position: 'relative',
          zIndex: 1,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 10px 30px rgba(0, 212, 255, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5ce1ff, #c084fc)',
          },
        },
        outlined: {
          borderColor: 'rgba(0, 212, 255, 0.5)',
          '&:hover': {
            borderColor: '#00d4ff',
            backgroundColor: 'rgba(0, 212, 255, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.82) 0%, rgba(15, 23, 42, 0.76) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 22,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-5px) scale(1.02)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 212, 255, 0.1)',
            borderColor: 'rgba(0, 212, 255, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 14,
            backgroundColor: 'rgba(7, 13, 29, 0.9)',
            transition: 'all 0.3s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'rgba(0, 212, 255, 0.5)',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00d4ff',
              boxShadow: '0 0 0 3px rgba(0, 212, 255, 0.1)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'linear-gradient(180deg, rgba(5, 13, 28, 0.96), rgba(5, 13, 28, 0.82))',
          backdropFilter: 'blur(18px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '1rem',
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            color: '#00d4ff',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          background: 'linear-gradient(90deg, #00d4ff, #a855f7)',
          height: 3,
          borderRadius: 2,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
          color: '#e2e8f0',
          backgroundColor: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        },
      },
    },
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
