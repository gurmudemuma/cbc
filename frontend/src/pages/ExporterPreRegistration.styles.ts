import { styled } from '@mui/material/styles';
import { Box, Paper } from '@mui/material';

export const PageContainer = styled(Box)({
  animation: 'fadeIn 0.3s ease-in-out',
});

export const RegistrationPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
}));
