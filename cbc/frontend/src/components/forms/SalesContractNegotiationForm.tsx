import { useState } from 'react';
import { Card, CardHeader, CardContent, CardActions, Button, TextField, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Send, Check, X } from 'lucide-react';

interface SalesContractNegotiationFormProps {
  draft: any;
  onAccept?: () => void;
  onReject?: (reason: string) => void;
  onCounter?: (updates: any, notes: string) => void;
  onCounterOffer?: (message: string) => void;
  loading?: boolean;
}

const SalesContractNegotiationForm = ({ draft, onAccept, onReject, onCounter, onCounterOffer, loading: externalLoading }: SalesContractNegotiationFormProps) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const isLoading = loading || externalLoading;

  const handleAccept = async () => {
    if (!onAccept) return;
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = () => {
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!onReject || !rejectReason.trim()) return;
    setLoading(true);
    try {
      await onReject(rejectReason);
      setRejectDialogOpen(false);
      setRejectReason('');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    try {
      // Use onCounter if available (new API), otherwise fall back to onCounterOffer
      if (onCounter) {
        await onCounter({}, message); // Empty updates object, message as notes
      } else if (onCounterOffer) {
        await onCounterOffer(message);
      }
      setMessage('');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Card>
        <CardHeader title="Contract Negotiation" />
        <CardContent>
          {draft && (
            <Box mb={2}>
              <Typography variant="body2" color="textSecondary">
                Contract ID: {draft.id || draft.contractId || 'N/A'}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Message / Counter Offer Details"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message or counter offer details..."
            disabled={loading}
          />
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
          <Button 
            variant="outlined" 
            color="error"
            onClick={handleRejectClick}
            disabled={isLoading}
            startIcon={<X size={18} />}
          >
            Reject
          </Button>
          <Button 
            variant="outlined"
            onClick={handleCounterOffer}
            disabled={isLoading || !message.trim()}
            startIcon={<Send size={18} />}
          >
            Counter Offer
          </Button>
          <Button 
            variant="contained"
            color="success"
            onClick={handleAccept}
            disabled={isLoading}
            startIcon={<Check size={18} />}
          >
            Accept
          </Button>
        </CardActions>
      </Card>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => !isLoading && setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Contract</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a reason for rejecting this contract..."
            required
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleRejectConfirm}
            disabled={isLoading || !rejectReason.trim()}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SalesContractNegotiationForm;
