import { createTheme, alpha, Theme } from '@mui/material/styles';
import { PaletteOptions } from '@mui/material/styles';

// Modern base theme configuration
export const baseTheme = {
  shape: { 
    borderRadius: 16,
  },
  spacing: 8,
  typography: {
    fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { 
      fontWeight: 800, 
      fontSize: '2.5rem',
      lineHeight: 1.1,
      letterSpacing: '-0.8px',
    },
    h2: { 
      fontWeight: 800, 
      fontSize: '2rem',
      lineHeight: 1.15,
      letterSpacing: '-0.5px',
    },
    h3: { 
      fontWeight: 700, 
      fontSize: '1.75rem',
      lineHeight: 1.2,
      letterSpacing: '-0.3px',
    },
    h4: { 
      fontWeight: 700, 
      fontSize: '1.5rem',
      lineHeight: 1.25,
      letterSpacing: '-0.2px',
    },
    h5: { 
      fontWeight: 600, 
      fontSize: '1.25rem',
      lineHeight: 1.3,
      letterSpacing: '-0.1px',
    },
    h6: { 
      fontWeight: 600, 
      fontSize: '1.125rem',
      lineHeight: 1.35,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.65,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02em',
      fontSize: '0.95rem',
    },
    caption: {
      fontSize: '0.8rem',
      lineHeight: 1.5,
      fontWeight: 500,
      color: 'text.secondary',
    },
  },

  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
    '0 35px 60px -15px rgba(0, 0, 0, 0.15)',
    ...Array(17).fill('0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'),
  ] as any,

  transitions: {
    duration: {
      shortest: 100,
      shorter: 150,
      short: 200,
      standard: 250,
      complex: 300,
      enteringScreen: 200,
      leavingScreen: 150,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },
  },

  zIndex: {
    mobileStepper: 1000,
    fab: 1050,
    speedDial: 1050,
    appBar: 1100,
    drawer: 1200,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};

// Neutral default palette
export const defaultPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#424242',
    light: '#616161',
    dark: '#212121',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#757575',
    light: '#9e9e9e',
    dark: '#424242',
    contrastText: '#ffffff',
  },
  error: {
    main: '#D32F2F',
    light: '#EF5350',
    dark: '#C62828',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#F57C00',
    light: '#FF9800',
    dark: '#E65100',
    contrastText: '#ffffff',
  },
  info: {
    main: '#1976D2',
    light: '#2196F3',
    dark: '#0D47A1',
    contrastText: '#ffffff',
  },
  success: {
    main: '#388E3C',
    light: '#4CAF50',
    dark: '#2E7D32',
    contrastText: '#ffffff',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
  },
  text: {
    primary: '#212121',
    secondary: '#616161',
    disabled: '#9e9e9e',
  },
  divider: '#e0e0e0',
};

// Component overrides with modern styling
export const componentOverrides = (palette: any) => ({
  MuiButton: {
    defaultProps: {
      disableElevation: false,
    },
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: 12,
        padding: '10px 20px',
        fontWeight: 600,
        fontSize: '0.95rem',
        transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'rgba(255, 255, 255, 0.1)',
          transition: 'left 200ms ease',
        },
        '&:hover::before': {
          left: '100%',
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },
      contained: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        '&:hover': {
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
        },
      },
      outlined: {
        borderWidth: '1.5px',
        '&:hover': {
          borderWidth: '1.5px',
          backgroundColor: alpha(palette.primary?.main || '#000', 0.04),
        },
      },
      sizeLarge: {
        padding: '14px 28px',
        fontSize: '1rem',
      },
      sizeSmall: {
        padding: '8px 16px',
        fontSize: '0.875rem',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        border: `1px solid ${alpha(palette.divider || '#000', 0.05)}`,
        '&:hover': {
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-4px)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        backgroundImage: 'none',
      },
      elevation0: {
        boxShadow: 'none',
      },
      elevation1: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      elevation2: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      },
      elevation3: {
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      },
      elevation4: {
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        transition: 'all 200ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(palette.divider || '#000', 0.1),
          borderWidth: '1.5px',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(palette.primary?.main || '#000', 0.3),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: palette.primary?.main,
          borderWidth: '2px',
        },
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      size: 'medium' as const,
      variant: 'outlined' as const,
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 12,
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        fontWeight: 600,
        fontSize: '0.85rem',
        transition: 'all 200ms ease',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      },
      filled: {
        backgroundColor: alpha(palette.primary?.main || '#000', 0.1),
        color: palette.primary?.main,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        borderLeft: '4px solid',
        fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      standardSuccess: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderLeftColor: '#10B981',
        color: '#047857',
      },
      standardWarning: {
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        borderLeftColor: '#F59E0B',
        color: '#B45309',
      },
      standardError: {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderLeftColor: '#EF4444',
        color: '#991B1B',
      },
      standardInfo: {
        backgroundColor: 'rgba(59, 130, 246, 0.08)',
        borderLeftColor: '#3B82F6',
        color: '#1E40AF',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundImage: 'none',
        borderRight: `1px solid ${alpha(palette.divider || '#000', 0.08)}`,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        transition: 'all 200ms ease',
        '&:hover': {
          backgroundColor: alpha(palette.primary?.main || '#000', 0.08),
        },
        '&.Mui-selected': {
          backgroundColor: alpha(palette.primary?.main || '#000', 0.12),
          '&:hover': {
            backgroundColor: alpha(palette.primary?.main || '#000', 0.16),
          },
        },
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        height: 6,
        backgroundColor: alpha(palette.primary?.main || '#000', 0.1),
      },
      bar: {
        borderRadius: 8,
        background: `linear-gradient(90deg, ${palette.primary?.main}, ${palette.primary?.light})`,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: alpha(palette.divider || '#000', 0.08),
      },
    },
  },
});

// Organization-specific palettes
export const orgPalettes: Record<string, PaletteOptions> = {
  'commercial-bank': {
    mode: 'light',
    primary: {
      main: '#6A1B9A',
      light: '#8E24AA',
      dark: '#4A148C',
      contrastText: '#FFD700',
    },
    secondary: {
      main: '#D4AF37',
      light: '#FFD700',
      dark: '#B8860B',
      contrastText: '#1A1A1A',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6A1B9A',
      disabled: '#9E9E9E',
    },
    divider: '#E0E0E0',
  },
  'commercialbank': {
    mode: 'light',
    primary: {
      main: '#6A1B9A',
      light: '#8E24AA',
      dark: '#4A148C',
      contrastText: '#FFD700',
    },
    secondary: {
      main: '#D4AF37',
      light: '#FFD700',
      dark: '#B8860B',
      contrastText: '#1A1A1A',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#6A1B9A',
      disabled: '#9E9E9E',
    },
    divider: '#E0E0E0',
  },
  'exporter-portal': {
    mode: 'light',
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F9A825',
      light: '#FBC02D',
      dark: '#F57F17',
      contrastText: '#1A1A1A',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#2E7D32',
      disabled: '#9E9E9E',
    },
    divider: '#E0E0E0',
  },
  'exporterportal': {
    mode: 'light',
    primary: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F9A825',
      light: '#FBC02D',
      dark: '#F57F17',
      contrastText: '#000000',
    },
    background: {
      default: '#F1F8F4',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B3A1F',
      secondary: '#2E5C33',
    },
    divider: '#C8E6C9',
  },
  'national-bank': {
    mode: 'light',
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFA000',
      light: '#FFB300',
      dark: '#FF8F00',
      contrastText: '#000000',
    },
    background: {
      default: '#F5F9FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0D3C61',
      secondary: '#1565C0',
    },
    divider: '#BBDEFB',
  },
  'nationalbank': {
    mode: 'light',
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFA000',
      light: '#FFB300',
      dark: '#FF8F00',
      contrastText: '#000000',
    },
    background: {
      default: '#F5F9FC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0D3C61',
      secondary: '#1565C0',
    },
    divider: '#BBDEFB',
  },
  'ecta': {
    mode: 'light',
    primary: {
      main: '#6D4C41',
      light: '#8D6E63',
      dark: '#4E342E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D84315',
      light: '#FF5722',
      dark: '#BF360C',
      contrastText: '#ffffff',
    },
    background: {
      default: '#FBF8F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3E2723',
      secondary: '#5D4037',
    },
    divider: '#D7CCC8',
  },
  'ecx': {
    mode: 'light',
    primary: {
      main: '#558B2F',
      light: '#689F38',
      dark: '#33691E',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#795548',
      light: '#8D6E63',
      dark: '#5D4037',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F9FBF7',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B5E20',
      secondary: '#33691E',
    },
    divider: '#C5E1A5',
  },
  'shipping-line': {
    mode: 'light',
    primary: {
      main: '#0277BD',
      light: '#0288D1',
      dark: '#01579B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00838F',
      light: '#00ACC1',
      dark: '#006064',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F1F8FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#01579B',
      secondary: '#0277BD',
    },
    divider: '#B3E5FC',
  },
  'shippingline': {
    mode: 'light',
    primary: {
      main: '#0277BD',
      light: '#0288D1',
      dark: '#01579B',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00838F',
      light: '#00ACC1',
      dark: '#006064',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F1F8FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#01579B',
      secondary: '#0277BD',
    },
    divider: '#B3E5FC',
  },
  'custom-authorities': {
    mode: 'light',
    primary: {
      main: '#5E35B1',
      light: '#7E57C2',
      dark: '#4527A0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F57C00',
      light: '#FF9800',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    background: {
      default: '#F7F5FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#311B92',
      secondary: '#4527A0',
    },
    divider: '#D1C4E9',
  },
};

// Main theme creation function
export function createEnhancedTheme(org?: string, mode: 'light' | 'dark' = 'light'): Theme {
  const palette = org && orgPalettes[org] ? orgPalettes[org] : defaultPalette;
  
  return createTheme({
    ...baseTheme,
    palette: {
      ...palette,
      mode,
    } as PaletteOptions,
    components: componentOverrides(palette),
  });
}

// Export default theme
export const defaultTheme = createEnhancedTheme();

export default defaultTheme;
