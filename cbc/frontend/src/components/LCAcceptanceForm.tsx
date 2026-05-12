/**
 * LC Acceptance Form Component
 * Form for accepting or rejecting Letter of Credit
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import axios from 'axios';

interface LCAcceptanceFormProps {
  open: boolean;
  onClose: () => void;
  lcId: string;
  lcNumber: string;
  action: 'accept' | 'reject';
  onSuccess: () => void;
}

const LCAcceptanceForm: React.FC<LCAcceptanceFormProps> = ({
  open,
  onClose,
  lcId,
  lcNumber,
  action,
  onSuccess,
}) => {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (action === 'reject' && !notes.trim()) {
      setError('Please provide a reason for rejecting the LC');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const endpoint = action === 'accept' 
        ? `/api/lc/${lcId}/accept`
        : `/api/lc/${lcId}/reject`;

      const payload = action === 'accept'
        ? { notes: notes.trim() || undefined }
        : { reason: notes.trim() };

      await axios.put(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(`Error ${action}ing LC:`, err);
      setError(
        err.response?.data?.error?.details ||
        err.response?.data?.message ||
        `Failed to ${action} LC. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          {action === 'accept' ? (
            <CheckCircle color="success" />
          ) : (
            <Cancel color="error" />
          )}
          <Typography variant="h6">
            {action === 'accept' ? 'Accept' : 'Reject'} Letter of Credit
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            LC Number
          </Typography>
          <Typography variant="body1" fontWeight="bold">
            {lcNumber}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {action === 'accept' ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            By accepting this LC, you agree to the terms and conditions specified in the LC document.
            You will be able to present documents against this LC after NBE approval.
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Rejecting this LC will notify the buyer and issuing bank. This action cannot be undone.
            Please provide a clear reason for rejection.
          </Alert>
        )}

        <TextField
          fullWidth
          multiline
          rows={4}
          label={action === 'accept' ? 'Notes (Optional)' : 'Reason for Rejection *'}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            action === 'accept'
              ? 'Add any notes or comments about this LC...'
              : 'Explain why you are rejecting this LC...'
          }
          required={action === 'reject'}
          error={action === 'reject' && !notes.trim() && error !== null}
          helperText={
            action === 'reject' && !notes.trim() && error !== null
              ? 'Reason is required for rejection'
              : ''
          }
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color={action === 'accept' ? 'success' : 'error'}
          disabled={loading || (action === 'reject' && !notes.trim())}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Processing...' : action === 'accept' ? 'Accept LC' : 'Reject LC'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LCAcceptanceForm;
