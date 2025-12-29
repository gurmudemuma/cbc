<<<<<<< HEAD
import { createTheme, alpha, ThemeOptions } from '@mui/material/styles';

// Extend the Palette interface if needed for custom colors
declare module '@mui/material/styles' {
  interface Palette {
    neutral: Palette['primary'];
  }
  interface PaletteOptions {
    neutral?: PaletteOptions['primary'];
  }
}

// Brand Colors
const brandColors = {
  primary: {
    main: '#0F172A', // Slate 900 - Deep Navy
    light: '#334155', // Slate 700
    dark: '#020617', // Slate 950
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#2563EB', // Blue 600 - Vibrant Blue
    light: '#60A5FA', // Blue 400
    dark: '#1D4ED8', // Blue 700
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#059669', // Emerald 600
    light: '#34D399',
    dark: '#047857',
  },
  error: {
    main: '#DC2626', // Red 600
    light: '#F87171',
    dark: '#B91C1C',
  },
  warning: {
    main: '#D97706', // Amber 600
    light: '#FBBF24',
    dark: '#B45309',
  },
  info: {
    main: '#0891B2', // Cyan 600
    light: '#22D3EE',
    dark: '#0E7490',
  },
  background: {
    default: '#F8F9FA', // Cool light gray
    paper: '#FFFFFF',
    darkDefault: '#0B1121', // Darker navy for dark mode
    darkPaper: '#151E32',   // Slightly lighter navy for cards
  },
  text: {
    primary: '#1E293B', // Slate 800
    secondary: '#64748B', // Slate 500
    disabled: '#94A3B8', // Slate 400
  }
};

const typography = {
  fontFamily: [
    '"Inter"',
    '"Plus Jakarta Sans"',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.2 },
  h2: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.2 },
  h3: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
  h4: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
  h5: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0em', lineHeight: 1.4 },
  h6: { fontSize: '1rem', fontWeight: 600, letterSpacing: '0em', lineHeight: 1.4 },
  body1: { fontSize: '1rem', lineHeight: 1.5, letterSpacing: '0em' },
  body2: { fontSize: '0.875rem', lineHeight: 1.57, letterSpacing: '0em' },
  button: { textTransform: 'none' as const, fontWeight: 600, letterSpacing: '0.01em' },
};

const components = {
  MuiCssBaseline: {
    styleOverrides: `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
      
      body {
        font-feature-settings: "cv02", "cv03", "cv04", "cv11";
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: #CBD5E1;
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: #94A3B8;
      }
      .dark-mode ::-webkit-scrollbar-thumb {
        background: #334155;
      }
      .dark-mode ::-webkit-scrollbar-thumb:hover {
        background: #475569;
      }
    `,
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 16px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
        },
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '1rem',
        borderRadius: 10,
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      rounded: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        border: '1px solid rgba(0,0,0,0.05)',
      },
      elevation2: {
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        border: '1px solid rgba(0,0,0,0.05)',
      },
      elevation3: {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        border: '1px solid #E2E8F0',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
          borderColor: '#CBD5E1',
        },
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined' as const,
      size: 'medium' as const,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderWidth: 2,
        },
        backgroundColor: '#FFFFFF',
      },
      input: {
        padding: '12px 14px',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 600,
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: '1px solid #F1F5F9',
        fontSize: '0.875rem',
      },
      head: {
        fontWeight: 600,
        backgroundColor: '#F8F9FA',
        color: '#64748B',
        textTransform: 'uppercase' as const,
        fontSize: '0.75rem',
        letterSpacing: '0.05em',
      },
    },
  },
};

export const createEnhancedTheme = (mode: 'light' | 'dark' = 'light'): any => {
  return createTheme({
    palette: {
      mode,
      ...brandColors,
      background: {
        default: mode === 'dark' ? brandColors.background.darkDefault : brandColors.background.default,
        paper: mode === 'dark' ? brandColors.background.darkPaper : brandColors.background.paper,
      },
      text: {
        primary: mode === 'dark' ? '#F1F5F9' : '#1E293B',
        secondary: mode === 'dark' ? '#94A3B8' : '#64748B',
      },
    },
    typography: typography,
    components: components,
    shape: {
      borderRadius: 8,
    },
  });
};

const theme = createEnhancedTheme();
=======
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8e24aa',
      light: '#ab47bc',
      dark: '#6a1b9a',
    },
    secondary: {
      main: '#f1c40f',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #e8eaf6;
        }
        ::-webkit-scrollbar-thumb {
          background: #8e24aa;
          border-radius: 8px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6a1b9a;
        }
        ::selection {
          background-color: #4f46e5;
          color: #ffffff;
          text-shadow: none;
        }
        input::selection,
        select::selection,
        textarea::selection,
        .MuiSelect-select::selection,
        .MuiMenuItem-root::selection,
        .MuiInputBase-input::selection {
          background-color: #4f46e5 !important;
          color: #ffffff !important;
          text-shadow: none !important;
        }
        .MuiSelect-select {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .MuiPaper-root .MuiMenuItem-root {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        ::-moz-selection {
          background-color: #4f46e5;
          color: #ffffff;
        }
        :focus-visible {
          outline: 2px solid #8e24aa;
          outline-offset: 2px;
        }
      `,
    },
  },
});
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

export default theme;
