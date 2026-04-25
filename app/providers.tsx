'use client';

import * as React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { InterviewProvider } from './context/InterviewContext';
import { AuthProvider } from '@/src/context/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0F172A',
      contrastText: '#F7F8FD',
    },
    secondary: {
      main: '#6366F1',
      contrastText: '#F7F8FD',
    },
    info: {
      main: '#93C5FD',
    },
    success: {
      main: '#34D399',
    },
    warning: {
      main: '#FBBF24',
    },
    background: {
      default: '#0F172A',
      paper: '#172554',
    },
    text: {
      primary: '#F7F8FD',
      secondary: '#D0D5E8',
    },
    divider: '#334155',
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
    h1: {
      fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", sans-serif',
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
          backgroundColor: '#0F172A',
          backgroundImage: `radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 26%), radial-gradient(circle at bottom right, rgba(30, 41, 59, 0.22), transparent 30%)`,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          color: '#F7F8FD',
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
            boxShadow: '0 18px 40px rgba(63, 81, 181, 0.16)',
          },
        },
        containedPrimary: {
          backgroundColor: '#0F172A',
          color: '#F7F8FD',
          '&:hover': {
            backgroundColor: '#1E293B',
          },
        },
        outlined: {
          borderColor: '#334155',
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          color: '#F7F8FD',
          '&:hover': {
            borderColor: '#6366F1',
            backgroundColor: 'rgba(99, 102, 241, 0.16)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#172554',
          border: '1px solid #334155',
          borderRadius: 12,
          boxShadow: '0 14px 30px rgba(0, 0, 0, 0.22)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.3)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#172554',
            border: '1px solid #334155',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366F1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366F1',
              boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
            },
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#172554',
          '&:hover': {
            backgroundColor: '#1E293B',
          },
          '&.Mui-focused': {
            backgroundColor: '#1E293B',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#172554',
          boxShadow: '0 14px 30px rgba(0, 0, 0, 0.22)',
          border: '1px solid #334155',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#172554',
          borderBottom: '1px solid #334155',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
          color: '#F7F8FD',
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
          color: '#F7F8FD',
          backgroundColor: '#1E293B',
          border: '1px solid #334155',
        },
      },
    },
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <InterviewProvider>{children}</InterviewProvider>
        </AuthProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
