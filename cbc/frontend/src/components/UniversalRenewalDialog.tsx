/**
 * Universal Certificate Renewal Dialog
 * Handles renewal requests for all certificate types
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Chip,
  MenuItem,
} from '@mui/material';
import { Warning, CalendarToday, Badge, Description } from '@mui/icons-material';
import axios from 'axios';

interface UniversalRenewalDialogProps {
  open: boolean;
  onClose: () => void;
  certificate: any;
  certificateType: 'TASTER_PROFICIENCY' | 'LABORATORY_CERTIFICATION' | 'COMPETENCE_CERTIFICATE' | 'EXPORT_LICENSE';
  onSuccess: () => void;
}

const CERTIFICATE_TYPE_LABELS = {
  TASTER_PROFICIENCY: 'Taster Proficiency Certificate',
  LABORATORY_CERTIFICATION: 'Laboratory Certification',
  COMPETENCE_CERTIFICATE: 'Competence Certificate',
  EXPORT_LICENSE: 'Export License',
};

const UniversalRenewalDialog: React.FC<UniversalRenewalDialogProps> = ({
  open,
  onClose,
  certificate,
  certificateType,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    newCertificateNumber: '',
    newExpiryDate: '',
    renewalReason: '',
  });

  // Extract certificate details based on type
  const getCertificateDetails = () => {
    switch (certificateType) {
      case 'TASTER_PROFICIENCY':
        return {
          id: certificate.taster_id,
          name: certificate.full_name,
          number: certificate.proficiency_certificate_number,
          issueDate: certificate.certificate_issue_date,
          expiryDate: certificate.certificate_expiry_date,
        };
      case 'LABORATORY_CERTIFICATION':
        return {
          id: certificate.laboratory_id,
          name: certificate.laboratory_name,
          number: certificate.certification_number,
          issueDate: certificate.certified_date,
          expiryDate: certificate.expiry_date,
        };
      case 'COMPETENCE_CERTIFICATE':
        return {
          id: certificate.certificate_id,
          name: certificate.business_name || 'Competence Certificate',
          number: certificate.certificate_number,
          issueDate: certificate.issued_date,
          expiryDate: certificate.expiry_date,
        };
      case 'EXPORT_LICENSE':
        return {
          id: certificate.license_id,
          name: certificate.business_name || 'Export License',
          number: certificate.license_number,
          issueDate: certificate.issued_date,
          expiryDate: certificate.expiry_date,
        };
      default:
        return null;
    }
  };

  const details = getCertificateDetails();

  const handleSubmit = async () => {
    if (!formData.newExpiryDate) {
      setError('Please provide new expiry date');
      return;
    }

    if (!details) {
      setError('Invalid certificate data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post('/api/exporter/certificate/renewal/request', {
        certificateType,
        certificateId: details.id,
        entityName: details.name,
        currentCertificateNumber: details.number,
        currentIssueDate: details.issueDate,
        currentExpiryDate: details.expiryDate,
        newCertificateNumber: formData.newCertificateNumber || details.number,
        requestedExpiryDate: formData.newExpiryDate,
        renewalReason: formData.renewalReason || 'Certificate renewal request',
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit renewal request');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiry = () => {
    if (!details?.expiryDate) return null;
    const expiry = new Date(details.expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = calculateDaysUntilExpiry();
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  // Calculate default new expiry (1 year from now)
  const defaultNewExpiry = new Date();
  defaultNewExpiry.setFullYear(defaultNewExpiry.getFullYear() + 1);
  const defaultExpiryStr = defaultNewExpiry.toISOString().split('T')[0];

  if (!details) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CalendarToday color="primary" />
          <Typography variant="h6">Renew Certificate</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Current Certificate Info */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Current Certificate Information
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Type: <strong>{CERTIFICATE_TYPE_LABELS[certificateType]}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Name: <strong>{details.name}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Certificate Number: <strong>{details.number}</strong>
              </Typography>
            </Grid>
            {details.issueDate && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Issue Date: <strong>{new Date(details.issueDate).toLocaleDateString()}</strong>
                </Typography>
              </Grid>
            )}
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Current Expiry: <strong>{new Date(details.expiryDate).toLocaleDateString()}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              {isExpired && (
                <Chip 
                  icon={<Warning />}
                  label={`Expired ${Math.abs(daysUntilExpiry!)} days ago`}
                  color="error"
                  size="small"
                />
              )}
              {isExpiringSoon && (
                <Chip 
                  icon={<Warning />}
                  label={`Expires in ${daysUntilExpiry} days`}
                  color="warning"
                  size="small"
                />
              )}
            </Grid>
          </Grid>
        </Box>

        {/* Renewal Form */}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="New Certificate Number (Optional)"
              value={formData.newCertificateNumber}
              onChange={(e) => setFormData({ ...formData, newCertificateNumber: e.target.value })}
              helperText="Leave blank to keep the same certificate number"
              InputProps={{
                startAdornment: <Badge sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              placeholder={details.number}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              type="date"
              label="New Expiry Date"
              value={formData.newExpiryDate || defaultExpiryStr}
              onChange={(e) => setFormData({ ...formData, newExpiryDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              helperText="Certificate will be valid until this date"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Renewal Reason (Optional)"
              value={formData.renewalReason}
              onChange={(e) => setFormData({ ...formData, renewalReason: e.target.value })}
              placeholder="e.g., Certificate expiring soon, completed renewal training..."
              InputProps={{
                startAdornment: <Description sx={{ mr: 1, mt: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ mt: 2 }}>
          Your renewal request will be reviewed by ECTA. You will be notified once approved.
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !formData.newExpiryDate}
          startIcon={loading ? <CircularProgress size={20} /> : <CalendarToday />}
        >
          {loading ? 'Submitting...' : 'Submit Renewal Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UniversalRenewalDialog;
