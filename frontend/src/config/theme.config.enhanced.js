import { createTheme, alpha } from '@mui/material/styles';

// Base theme configuration that applies to all organizations
export const baseTheme = {
  shape: { 
    borderRadius: 12,
  },
  spacing: 8, // 8px base spacing unit
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { 
      fontWeight: 700, 
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.5px',
    },
    h2: { 
      fontWeight: 700, 
      fontSize: '1.875rem',
      lineHeight: 1.25,
      letterSpacing: '-0.25px',
    },
    h3: { 
      fontWeight: 600, 
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h4: { 
      fontWeight: 600, 
      fontSize: '1.25rem',
      lineHeight: 1.35,
    },
    h5: { 
      fontWeight: 500, 
      fontSize: '1.125rem',
      lineHeight: 1.4,
    },
    h6: { 
      fontWeight: 500, 
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
      color: 'text.secondary',
    },
  },

  // Shadows with depth and organization colors
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
    '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    '0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
    '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
    '0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
    '0 25px 50px -12px rgba(0, 0, 0, 0.08)',
    ...Array(19).fill('0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'),
  ],

  // Transitions
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },

  // Z-index values
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

// Neutral default palette (fallback only - organizations should use their own branding)
export const defaultPalette = {
  mode: 'light',
  primary: {
    main: '#424242', // Neutral gray
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
  grey: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
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
  action: {
    active: '#212121',
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(0, 0, 0, 0.08)',
    disabled: 'rgba(0, 0, 0, 0.26)',
    disabledBackground: 'rgba(0, 0, 0, 0.12)',
  },
};

// Component overrides - All components use organization branding
export const componentOverrides = (palette) => ({
  MuiButton: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        borderRadius: 8,
        padding: '8px 16px',
        fontWeight: 500,
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
        },
        '&:active': {
          transform: 'translateY(0)',
        },
      },
      sizeLarge: {
        padding: '12px 24px',
        fontSize: '1.125rem',
      },
      sizeSmall: {
        padding: '6px 12px',
        fontSize: '0.875rem',
      },
      containedPrimary: {
        backgroundColor: palette.primary.main,
        color: palette.primary.contrastText,
        '&:hover': {
          backgroundColor: palette.primary.dark,
        },
      },
      containedSecondary: {
        backgroundColor: palette.secondary.main,
        color: palette.secondary.contrastText,
        '&:hover': {
          backgroundColor: palette.secondary.dark,
        },
      },
      outlinedPrimary: {
        borderColor: palette.primary.main,
        color: palette.primary.main,
        '&:hover': {
          borderColor: palette.primary.dark,
          backgroundColor: `${palette.primary.main}10`,
        },
      },
      outlinedSecondary: {
        borderColor: palette.secondary.main,
        color: palette.secondary.main,
        '&:hover': {
          borderColor: palette.secondary.dark,
          backgroundColor: `${palette.secondary.main}10`,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
      },
      elevation1: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
      },
      elevation2: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
      },
      elevation3: {
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      size: 'medium',
      variant: 'outlined',
    },
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          // Uses organization's primary color for hover and focus
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 9999,
        fontWeight: 500,
      },
      colorPrimary: {
        backgroundColor: `${palette.primary.main}20`,
        color: palette.primary.dark,
        border: `1px solid ${palette.primary.main}40`,
      },
      colorSecondary: {
        backgroundColor: `${palette.secondary.main}20`,
        color: palette.secondary.dark,
        border: `1px solid ${palette.secondary.main}40`,
      },
      colorSuccess: {
        backgroundColor: '#e8f5e9',
        color: '#388e3c',
      },
      colorWarning: {
        backgroundColor: '#fff3e0',
        color: '#f57c00',
      },
      colorError: {
        backgroundColor: '#ffebee',
        color: '#d32f2f',
      },
      colorInfo: {
        backgroundColor: `${palette.primary.main}15`,
        color: palette.primary.main,
      },
    },
  },
  MuiBadge: {
    styleOverrides: {
      badge: {
        backgroundColor: palette.secondary.main,
        color: palette.secondary.contrastText,
        fontWeight: 600,
      },
      colorPrimary: {
        backgroundColor: palette.primary.main,
        color: palette.primary.contrastText,
      },
      colorSecondary: {
        backgroundColor: palette.secondary.main,
        color: palette.secondary.contrastText,
      },
    },
  },
  MuiFab: {
    styleOverrides: {
      root: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
      },
      primary: {
        backgroundColor: palette.primary.main,
        color: palette.primary.contrastText,
        '&:hover': {
          backgroundColor: palette.primary.dark,
        },
      },
      secondary: {
        backgroundColor: palette.secondary.main,
        color: palette.secondary.contrastText,
        '&:hover': {
          backgroundColor: palette.secondary.dark,
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        '&:hover': {
          backgroundColor: `${palette.primary.main}10`,
        },
      },
      colorPrimary: {
        color: palette.primary.main,
        '&:hover': {
          backgroundColor: `${palette.primary.main}15`,
        },
      },
      colorSecondary: {
        color: palette.secondary.main,
        '&:hover': {
          backgroundColor: `${palette.secondary.main}15`,
        },
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        borderLeft: '4px solid',
      },
      standardSuccess: {
        backgroundColor: '#e8f5e9',
        borderLeftColor: '#4caf50',
        color: '#388e3c',
      },
      standardWarning: {
        backgroundColor: '#fff3e0',
        borderLeftColor: '#ff9800',
        color: '#f57c00',
      },
      standardError: {
        backgroundColor: '#ffebee',
        borderLeftColor: '#f44336',
        color: '#d32f2f',
      },
      standardInfo: {
        backgroundColor: '#e3f2fd',
        borderLeftColor: '#2196f3',
        color: '#1976d2',
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: '1px solid #eeeeee',
      },
      head: {
        backgroundColor: '#fafafa',
        fontWeight: 600,
        textTransform: 'uppercase',
        fontSize: '0.75rem',
        letterSpacing: '0.5px',
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: '#e0e0e0',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        height: 6,
      },
      colorPrimary: {
        backgroundColor: `${palette.primary.main}20`,
      },
      barColorPrimary: {
        backgroundColor: palette.primary.main,
      },
      colorSecondary: {
        backgroundColor: `${palette.secondary.main}20`,
      },
      barColorSecondary: {
        backgroundColor: palette.secondary.main,
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: {
        '&.Mui-checked': {
          color: palette.primary.main,
          '& + .MuiSwitch-track': {
            backgroundColor: palette.primary.main,
          },
        },
      },
    },
  },
  MuiRadio: {
    styleOverrides: {
      root: {
        color: palette.text.secondary,
        '&.Mui-checked': {
          color: palette.primary.main,
        },
      },
    },
  },
  MuiCheckbox: {
    styleOverrides: {
      root: {
        color: palette.text.secondary,
        '&.Mui-checked': {
          color: palette.primary.main,
        },
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      colorPrimary: {
        backgroundColor: palette.primary.main,
        color: palette.primary.contrastText,
      },
    },
  },
  MuiLink: {
    styleOverrides: {
      root: {
        color: palette.text.secondary,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
          color: palette.primary.main,
        },
      },
    },
  },
});

// Organization-specific palettes
export const orgPalettes = {
  // Commercial Bank (formerly commercialbank) - Purple headers, Golden accents, Black text
  'commercial-bank': {
    mode: 'light',
    primary: {
      main: '#6A1B9A', // Deep Purple (for headers, buttons)
      light: '#8E24AA', // Purple
      dark: '#4A148C', // Dark Purple
      contrastText: '#FFD700', // Golden text on purple
    },
    secondary: {
      main: '#D4AF37', // Golden (for accents, highlights)
      light: '#FFD700', // Bright Gold
      dark: '#B8860B', // Dark Goldenrod
      contrastText: '#1A1A1A', // Black text on golden
    },
    background: {
      default: '#FAFAFA', // Light gray
      paper: '#FFFFFF', // White
    },
    text: {
      primary: '#1A1A1A', // Black for main text
      secondary: '#6A1B9A', // Purple for secondary text
      disabled: '#9E9E9E',
    },
    divider: '#E0E0E0',
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
      contrastText: '#ffffff',
    },
    success: {
      main: '#388E3C',
      light: '#4CAF50',
      dark: '#2E7D32',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#F57C00',
      light: '#FF9800',
      dark: '#E65100',
      contrastText: '#ffffff',
    },
    info: {
      main: '#6A1B9A', // Purple for info
      light: '#8E24AA',
      dark: '#4A148C',
      contrastText: '#FFD700',
    },
  },
  // Legacy aliases for Commercial Bank
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
  // Exporter Portal - Green headers, Gold accents (coffee/agriculture theme)
  'exporter-portal': {
    mode: 'light',
    primary: {
      main: '#2E7D32', // Forest Green (headers, buttons)
      light: '#4CAF50', // Green
      dark: '#1B5E20', // Dark Green
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F9A825', // Amber/Gold (accents, highlights)
      light: '#FBC02D', // Light Amber
      dark: '#F57F17', // Dark Amber
      contrastText: '#1A1A1A', // Black text on gold
    },
    background: {
      default: '#FAFAFA', // Clean white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A', // Black for main text
      secondary: '#2E7D32', // Green for secondary text
      disabled: '#9E9E9E',
    },
    divider: '#E0E0E0',
    info: {
      main: '#2E7D32', // Green for info
      light: '#4CAF50',
      dark: '#1B5E20',
      contrastText: '#ffffff',
    },
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
  // National Bank - Navy Blue headers, Gold accents (authority/regulatory)
  'nb-regulatory': {
    mode: 'light',
    primary: {
      main: '#1565C0', // Navy Blue (headers, buttons)
      light: '#1976D2', // Blue
      dark: '#0D47A1', // Dark Blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFA000', // Amber/Gold (accents, highlights)
      light: '#FFB300', // Light Amber
      dark: '#FF8F00', // Dark Amber
      contrastText: '#1A1A1A', // Black text on gold
    },
    background: {
      default: '#FAFAFA', // Clean white
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A', // Black for main text
      secondary: '#1565C0', // Navy blue for secondary text
      disabled: '#9E9E9E',
    },
    divider: '#E0E0E0',
    info: {
      main: '#1565C0', // Navy for info
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#ffffff',
    },
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
  banker: {
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
  // ECTA - Brown and Coffee tones (coffee authority)
  ecta: {
    mode: 'light',
    primary: {
      main: '#6D4C41', // Coffee Brown
      light: '#8D6E63', // Light Brown
      dark: '#4E342E', // Dark Brown
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D84315', // Deep Orange (roasted coffee)
      light: '#FF5722', // Orange
      dark: '#BF360C', // Dark Orange
      contrastText: '#ffffff',
    },
    background: {
      default: '#FBF8F5', // Cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3E2723', // Dark brown
      secondary: '#5D4037', // Medium brown
    },
    divider: '#D7CCC8',
  },
  // ECX - Green and Earth tones (commodity exchange)
  ecx: {
    mode: 'light',
    primary: {
      main: '#558B2F', // Olive Green
      light: '#689F38', // Light Green
      dark: '#33691E', // Dark Green
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#795548', // Brown (earth)
      light: '#8D6E63', // Light Brown
      dark: '#5D4037', // Dark Brown
      contrastText: '#ffffff',
    },
    background: {
      default: '#F9FBF7', // Light green tint
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1B5E20', // Dark green
      secondary: '#33691E', // Forest green
    },
    divider: '#C5E1A5',
  },
  // Shipping Line - Ocean Blue and Teal
  shipping: {
    mode: 'light',
    primary: {
      main: '#0277BD', // Ocean Blue
      light: '#0288D1', // Light Blue
      dark: '#01579B', // Dark Blue
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00838F', // Teal
      light: '#00ACC1', // Light Teal
      dark: '#006064', // Dark Teal
      contrastText: '#ffffff',
    },
    background: {
      default: '#F1F8FB', // Light ocean blue
      paper: '#FFFFFF',
    },
    text: {
      primary: '#01579B', // Deep ocean blue
      secondary: '#0277BD', // Ocean blue
    },
    divider: '#B3E5FC',
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
  // Custom Authorities - Royal Purple and Gold
  customs: {
    mode: 'light',
    primary: {
      main: '#5E35B1', // Deep Purple
      light: '#7E57C2', // Purple
      dark: '#4527A0', // Dark Purple
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F57C00', // Orange/Gold
      light: '#FF9800', // Light Orange
      dark: '#E65100', // Dark Orange
      contrastText: '#ffffff',
    },
    background: {
      default: '#F7F5FB', // Light purple tint
      paper: '#FFFFFF',
    },
    text: {
      primary: '#311B92', // Deep purple
      secondary: '#4527A0', // Dark purple
    },
    divider: '#D1C4E9',
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
export function createEnhancedTheme(org, mode = 'light') {
  console.log('Theme creation - org:', org, 'available palettes:', Object.keys(orgPalettes));
  const palette = org && orgPalettes[org] ? orgPalettes[org] : defaultPalette;
  console.log('Selected palette for', org, ':', palette ? 'FOUND' : 'NOT FOUND, using default');
  
  return createTheme({
    ...baseTheme,
    palette: {
      ...palette,
      mode,
    },
    components: componentOverrides(palette),
  });
}

// Export default theme
export const defaultTheme = createEnhancedTheme();

export default defaultTheme;
