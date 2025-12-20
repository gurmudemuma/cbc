import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import RejectionDialog from '../RejectionDialog';

/**
 * ECX Lot Verification Approval Form
 * Used by ECX to verify lot numbers and warehouse receipts
 */

import { CommonPageProps, ECXApprovalFormData } from '../../types';

interface ECXApprovalFormProps extends CommonPageProps {
  exportData: any;
  onApprove: (data: ECXApprovalFormData) => void;
  onReject: (data: any) => void;
  loading?: boolean;
}

const ECXApprovalForm = ({ exportData, onApprove, onReject, loading = false }: ECXApprovalFormProps): JSX.Element => {
  const [formData, setFormData] = useState({
    lotNumber: exportData.ecxLotNumber || '',
    warehouseReceiptNumber: exportData.warehouseReceiptNumber || '',
    warehouseLocation: exportData.warehouseLocation || '',
    notes: '',
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string) => (event: any) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.lotNumber || formData.lotNumber.trim().length < 3) {
      newErrors.lotNumber = 'Valid ECX lot number is required';
    }
    if (!formData.warehouseReceiptNumber || formData.warehouseReceiptNumber.trim().length < 3) {
      newErrors.warehouseReceiptNumber = 'Valid warehouse receipt number is required';
    }
    if (!formData.warehouseLocation || formData.warehouseLocation.trim().length < 3) {
      newErrors.warehouseLocation = 'Warehouse location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validate()) {
      return;
    }

    onApprove({
      lotNumber: formData.lotNumber.trim(),
      warehouseReceiptNumber: formData.warehouseReceiptNumber.trim(),
      warehouseLocation: formData.warehouseLocation.trim(),
      notes: formData.notes.trim(),
    } as ECXApprovalFormData);
  };

  const handleReject = (rejectionData) => {
    setShowRejectDialog(false);
    onReject(rejectionData);
  };

  return (
    <>
      <Card>
        <CardHeader
          avatar={<Package size={32} color="#1976d2" />}
          title="ECX Lot Verification"
          subheader={`Export ID: ${exportData.exportId}`}
        />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Verify the ECX lot number and warehouse receipt details for this coffee export.
              Ensure all information matches ECX records before approval.
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Exporter Information
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {exportData.exporterName}
                </Typography>
                <Typography variant="body2">
                  <strong>Coffee Type:</strong> {exportData.coffeeType}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> {exportData.quantity} kg
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="ECX Lot Number *"
                value={formData.lotNumber}
                onChange={handleChange('lotNumber')}
                fullWidth
                required
                error={!!errors.lotNumber}
                helperText={errors.lotNumber || 'Enter the verified ECX lot number'}
                placeholder="e.g., LOT-2024-001234"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Warehouse Receipt Number *"
                value={formData.warehouseReceiptNumber}
                onChange={handleChange('warehouseReceiptNumber')}
                fullWidth
                required
                error={!!errors.warehouseReceiptNumber}
                helperText={errors.warehouseReceiptNumber || 'Enter the warehouse receipt number'}
                placeholder="e.g., WR-2024-567890"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Warehouse Location *"
                value={formData.warehouseLocation}
                onChange={handleChange('warehouseLocation')}
                fullWidth
                required
                error={!!errors.warehouseLocation}
                helperText={errors.warehouseLocation || 'Specify the warehouse location'}
                placeholder="e.g., Addis Ababa Warehouse - Zone A"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Verification Notes"
                value={formData.notes}
                onChange={handleChange('notes')}
                multiline
                rows={3}
                fullWidth
                placeholder="Add any additional notes about the verification..."
                helperText="Optional: Add notes about the lot verification"
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<XCircle size={18} />}
            onClick={() => setShowRejectDialog(true)}
            disabled={loading}
          >
            Reject Lot
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
            onClick={handleApprove}
            disabled={loading}
            size="large"
          >
            {loading ? 'Approving...' : 'Approve Lot Verification'}
          </Button>
        </CardActions>
      </Card>

      <RejectionDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleReject}
        stageName="ECX"
        exportId={exportData.exportId}
        loading={loading}
      />
    </>
  );
};

export default ECXApprovalForm;
