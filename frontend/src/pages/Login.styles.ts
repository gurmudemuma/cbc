<<<<<<< HEAD
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
=======
import { styled } from '@mui/material/styles';
import { Box, Paper, Typography, Button, Select, TextField } from '@mui/material';

export const LoginPageContainer = styled(Box)({
  display: 'flex',
  height: '100vh',
  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
  position: 'relative',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
<<<<<<< HEAD
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
=======
      repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 40px, rgba(255,255,255,0.03) 41px),
      repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 40px, rgba(255,255,255,0.03) 41px)
    `,
    opacity: 0.5,
  },
});

export const LoginPaper = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
  },
  width: '85vw',
  height: '92vh',
  maxWidth: '1400px',
  margin: '0 auto',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 3,
  backgroundColor: '#FFFFFF',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  position: 'relative',
  zIndex: 1,
}));

export const InfoContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4, 6),
  background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
  border: '1px solid #FFD700',
  borderLeft: 'none',
  color: '#FFFFFF',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  order: 1,
  [theme.breakpoints.up('md')]: {
    order: 0,
  },
  position: 'relative',
  overflow: 'hidden',
}));

export const FormContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4, 6),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: '#FAFAFA',
  position: 'relative',
}));

export const StyledSelect = styled(Select)(({ theme }) => ({
  backgroundColor: '#FFFFFF',
  borderRadius: theme.shape.borderRadius * 2,
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#E2E8F0',
    borderWidth: 2,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#3B82F6',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#1E40AF',
    borderWidth: 2,
  },
  '& .MuiSelect-select': {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    color: '#0F172A',
    fontWeight: 500,
  },
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
<<<<<<< HEAD
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
=======
    backgroundColor: '#FFFFFF',
    borderRadius: theme.shape.borderRadius * 2,
    '& fieldset': {
      borderColor: '#E2E8F0',
      borderWidth: 2,
    },
    '&:hover fieldset': {
      borderColor: '#3B82F6',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1E40AF',
      borderWidth: 2,
    },
  },
  '& .MuiOutlinedInput-input': {
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
    color: '#0F172A',
    fontWeight: 500,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
<<<<<<< HEAD
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
=======
  paddingTop: theme.spacing(1.4),
  paddingBottom: theme.spacing(1.4),
  fontWeight: 600,
  fontSize: '0.95rem',
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  letterSpacing: '0.3px',
  background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
  boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #6A1B9A 0%, #8E24AA 100%)',
    boxShadow: '0 6px 16px rgba(106, 27, 154, 0.4)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  },
}));
