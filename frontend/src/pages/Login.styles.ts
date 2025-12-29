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
}));

export const InfoContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(6, 8),
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  color: '#FFFFFF',

  // Premium animated background
  background: 'linear-gradient(135deg, #0F172A 0%, #020617 100%)',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
      radial-gradient(circle at 10% 20%, rgba(37, 99, 235, 0.1) 0%, transparent 20%),
      radial-gradient(circle at 90% 80%, rgba(5, 150, 105, 0.1) 0%, transparent 20%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
    `,
    zIndex: 0,
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
  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 8px 16px rgba(37, 99, 235, 0.3)',
  },
}));
