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
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `
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
}));

export const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
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
  },
}));

export const StyledButton = styled(Button)(({ theme }) => ({
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
  },
}));
