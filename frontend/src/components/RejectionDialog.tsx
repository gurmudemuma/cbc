import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import { XCircle, AlertTriangle } from 'lucide-react';

/**
 * Reusable Rejection Dialog Component
 * Used by all organizations to reject exports with categorized reasons
 */
const RejectionDialog = ({ 
  open, 
  onClose, 
  onReject, 
  stageName,
  exportId,
  loading = false,
}) => {
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');

  const rejectionCategories = {
    ECX: [
      'Invalid Lot Number',
      'Warehouse Receipt Mismatch',
      'Warehouse Not Verified',
      'Quality Issues at Source',
      'Incomplete Information',
      'Other',
    ],
    ECTA_LICENSE: [
      'Expired License',
      'Invalid Exporter Credentials',
      'Missing TIN Information',
      'License Not Found',
      'Suspended Exporter',
      'Other',
    ],
    ECTA_QUALITY: [
      'Below Standard Quality (Grade 5)',
      'Contamination Detected',
      'Excessive Moisture Content',
      'Defects Above Acceptable Limit',
      'Incorrect Coffee Type',
      'Failed Laboratory Tests',
      'Other',
    ],
    ECTA_CONTRACT: [
      'Invalid Buyer Information',
      'Payment Terms Not Acceptable',
      'Contract Price Discrepancy',
      'Missing Contract Details',
      'Buyer Not Verified',
      'Contract Expired',
      'Other',
    ],
    BANK: [
      'Missing Required Documents',
      'Document Authenticity Issues',
      'Information Mismatch',
      'Invalid Signatures',
      'Expired Certificates',
      'Incomplete Documentation',
      'Other',
    ],
    NBE: [
      'Insufficient FX Allocation',
      'Invalid Export Value',
      'Documentation Issues',
      'Compliance Violation',
      'Exporter Not Eligible',
      'Pending Obligations',
      'Other',
    ],
    CUSTOMS: [
      'Declaration Error',
      'Prohibited Items',
      'Tax/Duty Issues',
      'Missing Permits',
      'Inspection Failed',
      'Documentation Incomplete',
      'Other',
    ],
    SHIPPING: [
      'Capacity Issues',
      'Route Not Available',
      'Documentation Incomplete',
      'Payment Issues',
      'Scheduling Conflict',
      'Other',
    ],
  };

  const handleReject = () => {
    // Validation
    if (!category) {
      setError('Please select a rejection category');
      return;
    }
    if (!reason || reason.trim().length < 10) {
      setError('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    setError('');
    onReject({ category, reason: reason.trim() });
  };

  const handleClose = () => {
    setReason('');
    setCategory('');
    setError('');
    onClose();
  };

  const categories = rejectionCategories[stageName] || ['Other'];

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderTop: '4px solid #f44336' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <XCircle size={24} color="#f44336" />
        <span>Reject Export at {stageName}</span>
      </DialogTitle>

      <DialogContent>
        <Alert severity="warning" icon={<AlertTriangle />} sx={{ mb: 3 }}>
          <Typography variant="body2">
            This action will reject the export and notify the exporter. 
            Please provide a clear and detailed reason to help them address the issues.
          </Typography>
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Export ID: <strong>{exportId}</strong>
          </Typography>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Rejection Category *</InputLabel>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            label="Rejection Category *"
            required
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Detailed Reason for Rejection *"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          multiline
          rows={5}
          fullWidth
          required
          placeholder="Provide specific details about why this export is being rejected. Include what needs to be corrected for resubmission..."
          helperText={`${reason.length} characters (minimum 10 required)`}
          error={reason.length > 0 && reason.length < 10}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleReject}
          disabled={loading || !category || !reason || reason.trim().length < 10}
          startIcon={loading ? null : <XCircle size={18} />}
        >
          {loading ? 'Rejecting...' : 'Confirm Rejection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RejectionDialog;
