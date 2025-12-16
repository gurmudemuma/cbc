// @ts-nocheck
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
  Chip,
} from '@mui/material';
import { CheckCircle, XCircle, FileCheck, Calendar } from 'lucide-react';
import RejectionDialog from '../RejectionDialog';

/**
 * ECTA License Approval Form
 * Used by ECTA to validate export licenses
 */
const ECTALicenseForm = ({ exportData, onApprove, onReject, loading = false }) => {
  const [formData, setFormData] = useState({
    validatedLicenseNumber: exportData.exportLicenseNumber || '',
    licenseExpiryDate: '',
    exporterTIN: '',
    validationNotes: '',
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.validatedLicenseNumber || formData.validatedLicenseNumber.trim().length < 5) {
      newErrors.validatedLicenseNumber = 'Valid license number is required';
    }
    if (!formData.licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License expiry date is required';
    } else {
      const expiryDate = new Date(formData.licenseExpiryDate);
      const today = new Date();
      if (expiryDate < today) {
        newErrors.licenseExpiryDate = 'License has expired';
      }
    }
    if (!formData.exporterTIN || formData.exporterTIN.trim().length < 10) {
      newErrors.exporterTIN = 'Valid TIN number is required (minimum 10 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validate()) {
      return;
    }

    onApprove({
      licenseNumber: formData.validatedLicenseNumber.trim(),  // Backend expects 'licenseNumber'
      notes: formData.validationNotes.trim(),  // Backend expects 'notes'
      // Backend doesn't use: licenseExpiryDate, exporterTIN
    });
  };

  const handleReject = (rejectionData) => {
    setShowRejectDialog(false);
    onReject(rejectionData);
  };

  const isLicenseExpiringSoon = () => {
    if (!formData.licenseExpiryDate) return false;
    const expiryDate = new Date(formData.licenseExpiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  return (
    <>
      <Card>
        <CardHeader
          avatar={<FileCheck size={32} color="#1976d2" />}
          title="ECTA Export License Validation"
          subheader={`Export ID: ${exportData.exportId}`}
        />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Validate the exporter's export license. Ensure the license is current, valid, and 
              matches ECTA records before approval.
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
                  <strong>Submitted License:</strong> {exportData.exportLicenseNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Coffee Type:</strong> {exportData.coffeeType}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> {exportData.quantity} kg
                </Typography>
                <Typography variant="body2">
                  <strong>Destination:</strong> {exportData.destinationCountry}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Validated License Number *"
                value={formData.validatedLicenseNumber}
                onChange={handleChange('validatedLicenseNumber')}
                fullWidth
                required
                error={!!errors.validatedLicenseNumber}
                helperText={errors.validatedLicenseNumber || 'Confirm the export license number'}
                placeholder="e.g., ECTA-EXP-2024-001234"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="License Expiry Date *"
                type="date"
                value={formData.licenseExpiryDate}
                onChange={handleChange('licenseExpiryDate')}
                fullWidth
                required
                error={!!errors.licenseExpiryDate}
                helperText={errors.licenseExpiryDate || 'Enter license expiration date'}
                InputLabelProps={{ shrink: true }}
              />
              {isLicenseExpiringSoon() && (
                <Chip
                  label="License expiring soon"
                  color="warning"
                  size="small"
                  icon={<Calendar size={16} />}
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Exporter TIN Number *"
                value={formData.exporterTIN}
                onChange={handleChange('exporterTIN')}
                fullWidth
                required
                error={!!errors.exporterTIN}
                helperText={errors.exporterTIN || 'Enter the exporter\'s Tax Identification Number'}
                placeholder="e.g., 0123456789"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Validation Notes"
                value={formData.validationNotes}
                onChange={handleChange('validationNotes')}
                multiline
                rows={3}
                fullWidth
                placeholder="Add any additional notes about the license validation..."
                helperText="Optional: Add notes about the validation"
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
            Reject License
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
            onClick={handleApprove}
            disabled={loading}
            size="large"
          >
            {loading ? 'Approving...' : 'Approve Export License'}
          </Button>
        </CardActions>
      </Card>

      <RejectionDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleReject}
        stageName="ECTA_LICENSE"
        exportId={exportData.exportId}
        loading={loading}
      />
    </>
  );
};

export default ECTALicenseForm;
