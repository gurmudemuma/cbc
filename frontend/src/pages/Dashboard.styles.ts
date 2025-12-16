import { styled } from '@mui/material/styles';
import { Box, Card, Chip } from '@mui/material';

export const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2), // Reduced from 3
}));

export const StatCard = styled(Card)(({ theme }) => ({
  // Add any specific styles for the stat card here
}));

export const ActivityCard = styled(Card)(({ theme }) => ({
  // Add any specific styles for the activity card here
}));

export const QuickActionsCard = styled(Card)(({ theme }) => ({
  height: '100%',
}));

export const PulseChip = styled(Chip)(({ theme }) => ({
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },
}));
