import { createTheme, Theme } from '@mui/material/styles';

export const createEnhancedTheme = (org?: string | null, mode: 'light' | 'dark' = 'light'): Theme => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#8B4513',
      },
      secondary: {
        main: '#D2691E',
      },
      success: {
        main: '#28a745',
      },
      warning: {
        main: '#ffc107',
      },
      error: {
        main: '#dc3545',
      },
      background: {
        default: mode === 'light' ? '#f8f9fa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
  });
};
