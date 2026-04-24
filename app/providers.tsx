'use client';

import * as React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { InterviewProvider } from './context/InterviewContext';
import { AuthProvider } from '@/src/context/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0F172A',
      contrastText: '#F8FAFC',
    },
    secondary: {
      main: '#6366F1',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#22D3EE',
    },
    success: {
      main: '#10B981',
    },
    warning: {
      main: '#F59E0B',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    divider: '#E2E8F0',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
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
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 700,
      textTransform: 'none',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F8FAFC',
          backgroundImage: `radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 20%), radial-gradient(circle at bottom right, rgba(34, 211, 238, 0.08), transparent 20%)`,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          color: '#0F172A',
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
            transform: 'translateY(-1px)',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#131E33',
          },
        },
        outlined: {
          borderColor: '#E2E8F0',
          backgroundColor: 'rgba(248, 250, 252, 0.8)',
          color: '#0F172A',
          '&:hover': {
            borderColor: '#6366F1',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          boxShadow: '0 14px 30px rgba(15, 23, 42, 0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 45px rgba(15, 23, 42, 0.09)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            border: '1px solid #D1D5DB',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366F1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366F1',
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.12)',
            },
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#F8FAFC',
          '&:hover': {
            backgroundColor: '#EFF6FF',
          },
          '&.Mui-focused': {
            backgroundColor: '#EFF6FF',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          boxShadow: '0 14px 30px rgba(15, 23, 42, 0.06)',
          border: '1px solid #E2E8F0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          color: '#0F172A',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          fontSize: '1rem',
          transition: 'all 0.25s ease',
          '&.Mui-selected': {
            color: '#6366F1',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#6366F1',
          height: 3,
          borderRadius: 3,
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
          color: '#0F172A',
          backgroundColor: '#EFF6FF',
          border: '1px solid #E2E8F0',
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
