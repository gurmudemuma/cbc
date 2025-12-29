<<<<<<< HEAD
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
=======
import { Button } from '@mui/material';

const ContinueModal = ({ onContinue, onStop }) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Continue with other pages?</h2>
        <p>Do you want to continue with the implementation of the other pages?</p>
        <div className="modal-actions">
          <Button variant="outlined" onClick={onStop}>
            Stop
          </Button>
          <Button variant="contained" onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  );
};

export default ContinueModal;
