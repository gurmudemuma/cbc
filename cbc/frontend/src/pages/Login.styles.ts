import { styled, alpha } from '@mui/material/styles';
import { Box, Paper, Typography, Button, Select, TextField } from '@mui/material';

export const LoginPageContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  background: theme.palette.mode === 'dark' ? '#020617' : '#FFFFFF',
}));

export const LoginPaper = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column-reverse',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
  width: '100%',
  height: '100%',
  margin: 0,
  borderRadius: 0,
  boxShadow: 'none',
  overflow: 'hidden',
  backgroundColor: 'transparent',
  position: 'relative',
}));

// Header component for the top left
export const LoginHeader = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  padding: theme.spacing(2, 3),
  zIndex: 10,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
}));

export const InfoContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(12, 8, 6, 8), // Increased top padding for header
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  color: '#FFFFFF',

  // Professional purple gradient with golden accent from logo
  background: 'linear-gradient(135deg, #9333EA 0%, #A855F7 50%, #7E22CE 100%)',
  overflow: 'hidden',
  
  // Smooth overlay with golden accent to complement the logo colors
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 15% 25%, rgba(251, 191, 36, 0.08) 0%, transparent 30%),
      radial-gradient(circle at 85% 75%, rgba(255, 255, 255, 0.08) 0%, transparent 30%),
      radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.04) 0%, transparent 50%)
    `,
    opacity: 1,
    zIndex: 0,
  },
  
  // Bold cryptographic hexagons - white with subtle gold tint
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '10%',
    right: '5%',
    width: '400px',
    height: '400px',
    background: `url("data:image/svg+xml,%3Csvg width='400' height='400' viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='3' opacity='0.5'%3E%3Cpolygon points='200,40 280,90 280,210 200,260 120,210 120,90' /%3E%3Cpolygon points='200,80 260,115 260,185 200,220 140,185 140,115' /%3E%3Cpolygon points='200,120 220,135 220,165 200,180 180,165 180,135' /%3E%3Ccircle cx='200' cy='150' r='12' fill='%23FFFFFF' opacity='0.7'/%3E%3Cpath d='M200,150 L200,40 M200,150 L280,90 M200,150 L280,210 M200,150 L200,260 M200,150 L120,210 M200,150 L120,90' stroke-dasharray='6,6' opacity='0.6'/%3E%3Ccircle cx='200' cy='40' r='6' fill='%23FFFFFF' opacity='0.8'/%3E%3Ccircle cx='280' cy='90' r='6' fill='%23FFFFFF' opacity='0.8'/%3E%3Ccircle cx='280' cy='210' r='6' fill='%23FFFFFF' opacity='0.8'/%3E%3Ccircle cx='200' cy='260' r='6' fill='%23FFFFFF' opacity='0.8'/%3E%3Ccircle cx='120' cy='210' r='6' fill='%23FFFFFF' opacity='0.8'/%3E%3Ccircle cx='120' cy='90' r='6' fill='%23FFFFFF' opacity='0.8'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    animation: 'float 20s ease-in-out infinite',
    zIndex: 0,
  },
  
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translateY(0) rotate(0deg)',
    },
    '50%': {
      transform: 'translateY(-20px) rotate(5deg)',
    },
  },
  
  [theme.breakpoints.down('md')]: {
    display: 'none', // Hide info on mobile to focus on login
  },
}));

export const FormContainer = styled(Box)(({ theme }) => ({
  flex: 0.6,
  minWidth: 480,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: theme.spacing(8),
  backgroundColor: theme.palette.mode === 'dark' ? '#0B1120' : '#FFFFFF',
  position: 'relative',
  zIndex: 1,
  
  // Smooth cryptographic pattern with purple accent - circles only
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%239333EA' stroke-width='0.8' opacity='0.06'%3E%3Ccircle cx='50' cy='50' r='40'/%3E%3Ccircle cx='50' cy='50' r='30'/%3E%3Ccircle cx='50' cy='50' r='20'/%3E%3Ccircle cx='50' cy='50' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: '200px 200px',
    backgroundPosition: 'center',
    backgroundRepeat: 'repeat',
    zIndex: 0,
  },
  
  // Security lock icon with purple accent
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '5%',
    left: '5%',
    width: '150px',
    height: '150px',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='150' height='150' viewBox='0 0 150 150' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%239333EA' stroke-width='2' opacity='0.12'%3E%3Crect x='40' y='60' width='70' height='60' rx='5'/%3E%3Cpath d='M50,60 L50,45 Q50,25 75,25 Q100,25 100,45 L100,60' stroke-width='3'/%3E%3Ccircle cx='75' cy='85' r='8' fill='%239333EA' opacity='0.3'/%3E%3Cpath d='M75,93 L75,105' stroke-width='3' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E")`,
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    zIndex: 0,
  },
  
  [theme.breakpoints.down('md')]: {
    width: '100%',
    minWidth: '100%',
    padding: theme.spacing(4),
  },
}));

export const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: 12,
  backgroundColor: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.05) : '#F8F9FA',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'transparent',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.light,
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
  },
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 12,
    backgroundColor: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.05) : '#F8F9FA',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: theme.palette.primary.light,
    },
    '&.Mui-focused': {
      backgroundColor: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.08) : '#FFFFFF',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    },
    '&.Mui-focused fieldset': {
      borderColor: theme.palette.primary.main,
      borderWidth: 2,
    },
  },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
  height: 56,
  borderRadius: 12,
  textTransform: 'none',
  fontSize: '1.1rem',
  fontWeight: 600,
  boxShadow: '0 4px 12px rgba(147, 51, 234, 0.3)',
  background: `linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 8px 16px rgba(147, 51, 234, 0.4)',
    background: `linear-gradient(135deg, #A855F7 0%, #9333EA 100%)`,
  },
  '&.MuiButton-outlined': {
    background: 'transparent',
    borderColor: '#9333EA',
    color: '#9333EA',
    boxShadow: 'none',
    '&:hover': {
      background: 'rgba(147, 51, 234, 0.05)',
      borderColor: '#7E22CE',
      boxShadow: 'none',
    },
  },
}));
