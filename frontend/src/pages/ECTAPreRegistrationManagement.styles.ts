import { styled, keyframes } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const PageContainer = styled(Box)(({ theme }) => ({
  animation: `${fadeIn} 0.5s cubic-bezier(0.4, 0, 0.2, 1)`,
  padding: theme.spacing(3),
  maxWidth: 1600,
  margin: '0 auto',
}));

export const ManagementPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  background: theme.palette.mode === 'dark'
    ? 'rgba(30, 30, 30, 0.8)'
    : 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  borderRadius: 24,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));
