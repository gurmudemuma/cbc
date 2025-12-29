import { styled, keyframes } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const PageContainer = styled(Box)(({ theme }) => ({
  animation: `${slideUp} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)`,
  padding: theme.spacing(3),
  maxWidth: 1000, // Constrain width for better form readability
  margin: '0 auto',
}));

export const RegistrationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(5),
  background: theme.palette.mode === 'dark'
    ? 'rgba(30,30,30, 0.95)'
    : '#ffffff',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  borderRadius: 24,
  border: `1px solid ${theme.palette.divider}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));
