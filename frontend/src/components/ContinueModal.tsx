import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  useTheme,
  alpha
} from '@mui/material';
import { AlertCircle } from 'lucide-react';

interface ContinueModalProps {
  open?: boolean; // Make optional for backward compatibility if parent controls exist
  onContinue: () => void;
  onStop: () => void;
}

const ContinueModal: React.FC<ContinueModalProps> = ({ open = true, onContinue, onStop }) => {
  const theme = useTheme();

  return (
    <Dialog
      open={open}
      onClose={onStop}
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          backgroundImage: 'none',
          backgroundColor: theme.palette.background.paper,
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2, pb: 1 }}>
        <AlertCircle color={theme.palette.primary.main} size={28} />
        Implementation Paused
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: theme.palette.text.secondary }}>
          Do you want to continue with the implementation of the remaining pages?
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onStop}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2 }}
        >
          Stop
        </Button>
        <Button
          onClick={onContinue}
          variant="contained"
          autoFocus
          sx={{
            borderRadius: 2,
            boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContinueModal;
