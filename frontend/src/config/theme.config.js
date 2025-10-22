import { createTheme } from '@mui/material/styles';

export const baseThemeOptions = {
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2.25rem' },
    h2: { fontWeight: 700, fontSize: '1.875rem' },
    h3: { fontWeight: 700, fontSize: '1.5rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
          paddingInline: 16,
          paddingBlock: 10,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiTextField: {
      defaultProps: { size: 'medium' },
    },
  },
};

export const orgPalettes = {
  'exporter-portal': {
    mode: 'light',
    primary: {
      main: '#228B22', // Forest Green
      light: '#32CD32', // Lime Green
      dark: '#006400', // Dark Green
    },
    secondary: {
      main: '#FFD700', // Gold
      light: '#FFE34D', // Light Gold
      dark: '#DAA520', // Goldenrod
    },
    background: {
      default: '#F0FFF0', // Honeydew
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2F4F4F', // Dark Slate Gray
      secondary: '#556B2F', // Dark Olive Green
    },
    divider: '#98FB98', // Pale Green
  },
  'exporter': {
    mode: 'light',
    primary: {
      main: '#228B22', // Forest Green
      light: '#32CD32', // Lime Green
      dark: '#006400', // Dark Green
    },
    secondary: {
      main: '#FFD700', // Gold
      light: '#FFE34D', // Light Gold
      dark: '#DAA520', // Goldenrod
    },
    background: {
      default: '#F0FFF0', // Honeydew
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2F4F4F', // Dark Slate Gray
      secondary: '#556B2F', // Dark Olive Green
    },
    divider: '#98FB98', // Pale Green
  },
  'nationalbank': {
    mode: 'light',
    primary: {
      main: '#B8860B', // Dark Goldenrod
      light: '#DAA520', // Goldenrod
      dark: '#8B6508', // Darker Golden
    },
    secondary: {
      main: '#333333', // Dark Gray (softer than pure black)
      light: '#4D4D4D',
      dark: '#1A1A1A',
    },
    background: {
      default: '#FFF8E7', // Cosmetic Cream
      paper: '#FFFFFF',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
    divider: '#DAA520', // Goldenrod
  },
  'ncat': {
    mode: 'light',
    primary: {
      main: '#8B4513', // Saddle Brown
      light: '#A0522D', // Sienna
      dark: '#5C3317', // Darker Brown
    },
    secondary: {
      main: '#D2691E', // Chocolate
      light: '#CD853F', // Peru
      dark: '#A0522D', // Sienna
    },
    background: {
      default: '#FFF5EE', // Seashell
      paper: '#FFFFFF',
    },
    text: {
      primary: '#3E2723', // Dark Brown
      secondary: '#5D4037', // Medium Brown
    },
    divider: '#DEB887', // Burlywood
  },
  'shipping': {
    mode: 'light',
    primary: {
      main: '#20B2AA', // Light Sea Green
      light: '#48D1CC', // Medium Turquoise
      dark: '#008B8B', // Dark Cyan
    },
    secondary: {
      main: '#4682B4', // Steel Blue
      light: '#5F9EA0', // Cadet Blue
      dark: '#4169E1', // Royal Blue
    },
    background: {
      default: '#F0F8FF', // Alice Blue
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2F4F4F', // Dark Slate Gray
      secondary: '#4B0082', // Indigo
    },
    divider: '#B0E0E6', // Powder Blue
  },
  'customauthorities': {
    mode: 'light',
    primary: {
      main: '#6A5ACD', // Slate Blue
      light: '#7B68EE', // Medium Slate Blue
      dark: '#483D8B', // Dark Slate Blue
    },
    secondary: {
      main: '#4B0082', // Indigo
      light: '#9370DB', // Medium Purple
      dark: '#301934', // Dark Purple
    },
    background: {
      default: '#F8F8FF', // Ghost White
      paper: '#FFFFFF',
    },
    text: {
      primary: '#191970', // Midnight Blue
      secondary: '#4B0082', // Indigo
    },
    divider: '#E6E6FA', // Lavender
  },
};

export function getThemeConfig(org) {
  const palette = orgPalettes[org] || orgPalettes['customauthorities'];
  return {
    ...baseThemeOptions,
    palette,
  };
}
