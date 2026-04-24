// src/ThemeContext.tsx

import React, { createContext, useState, useMemo } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { red } from '@mui/material/colors';

interface ThemeContextType {
  toggleTheme: () => void;
  mode: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType>({
  toggleTheme: () => {},
  mode: 'dark',
});

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: '#0F172A',
        contrastText: '#FFFFFF',
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
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#0F172A',
        paper: mode === 'light' ? '#FFFFFF' : '#111827',
      },
      text: {
        primary: mode === 'light' ? '#0F172A' : '#E5E7EB',
        secondary: mode === 'light' ? '#475569' : '#9CA3AF',
      },
      divider: mode === 'light' ? '#E2E8F0' : '#374151',
      error: {
        main: red.A400,
      },
    },
    typography: {
        fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
        h5: { fontWeight: 700 },
        button: { fontWeight: 700, textTransform: 'none' },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: { textTransform: 'none', fontWeight: 700 },
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    border: '1px solid',
                    borderColor: mode === 'dark' ? '#374151' : '#E5E7EB',
                    boxShadow: '0 12px 36px rgba(15, 23, 42, 0.08)',
                    backgroundColor: mode === 'dark' 
                        ? 'rgba(15, 23, 42, 0.95)'
                        : '#FFFFFF',
                    backdropFilter: 'blur(8px)',
                }
            }
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    border: '1px solid',
                    borderColor: mode === 'dark' ? '#374151' : '#E5E7EB',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                    backgroundColor: mode === 'dark' ? 'rgba(15, 23, 42, 0.9)' : '#FFFFFF',
                    borderRadius: 12,
                }
            }
        },
        MuiFilledInput: {
            styleOverrides: {
                root: {
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    backgroundColor: mode === 'light' ? '#F8FAFC' : '#111827',
                    '&:hover': {
                        backgroundColor: mode === 'light' ? '#EFF6FF' : 'rgba(255, 255, 255, 0.04)',
                    },
                    '&.Mui-focused': {
                        backgroundColor: mode === 'light' ? '#EFF6FF' : 'rgba(255, 255, 255, 0.04)',
                        boxShadow: '0 0 0 4px rgba(99, 102, 241, 0.16)',
                    },
                },
                underline: { '&:before, &:hover:before, &:after': { border: 'none' } }
            }
        },
        MuiSelect: {
            styleOverrides: {
                filled: { backgroundColor: 'transparent' }
            }
        },
        MuiAppBar: { 
            styleOverrides: {
                root: {
                    position: 'sticky',
                    border: 'none',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                    backgroundColor: mode === 'dark' 
                        ? 'rgba(15, 23, 42, 0.95)'
                        : 'rgba(248, 250, 252, 0.95)',
                    backdropFilter: 'blur(12px)',
                    color: mode  === 'dark' ? '#FFFFFF' : '#0F172A',
                }
            }
        },
    },
  }), [mode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};