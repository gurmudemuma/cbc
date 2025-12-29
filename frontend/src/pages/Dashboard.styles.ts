import { styled, keyframes } from '@mui/material/styles';
import { Box, Card, Chip, alpha } from '@mui/material';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

export const DashboardContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  animation: `${fadeIn} 0.5s ease-out`,
  maxWidth: 1600,
  margin: '0 auto',
}));

// Exporting GlassCard for general use in Dashboard
export const GlassCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  borderRadius: 20,
  overflow: 'hidden',
  background: theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.6)
    : 'rgba(255,255,255,0.8)',
  backdropFilter: 'blur(12px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: theme.shadows[1],

  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
    borderColor: theme.palette.primary.main,
  },
}));

const CardBase = GlassCard; // Alias for internal use if needed, but we can just use GlassCard


export const StatCard = styled(CardBase)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  padding: theme.spacing(3),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '30%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${theme.palette.primary.main}10)`,
    borderRadius: '0 20px 20px 0',
  }
}));

export const ActivityCard = styled(CardBase)(({ theme }) => ({
  padding: 0, // Padding handled by content
  '& .MuiCardHeader-root': {
    padding: theme.spacing(3),
    borderBottom: `1px solid ${theme.palette.divider}`,
    background: theme.palette.action.hover,
    borderRadius: '20px 20px 0 0',
  }
}));

export const QuickActionsCard = styled(CardBase)(({ theme }) => ({
  padding: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
}));

export const PulseChip = styled(Chip)(({ theme }) => ({
  animation: 'pulse 2s infinite',
  fontWeight: 700,
  borderRadius: 8,

  '@keyframes pulse': {
    '0%': { boxShadow: `0 0 0 0 ${theme.palette.primary.main}40` },
    '70%': { boxShadow: `0 0 0 10px transparent` },
    '100%': { boxShadow: `0 0 0 0 transparent` },
  },
}));
