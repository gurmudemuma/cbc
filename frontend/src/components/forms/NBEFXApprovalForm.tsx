import { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid,
  Alert, CircularProgress, Box, Typography, Divider,
} from '@mui/material';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { CommonPageProps, NBEFXApprovalFormData } from '../../types';
import RejectionDialog from '../RejectionDialog';

interface NBEFXApprovalFormProps extends CommonPageProps {
  exportData: any;
  onApprove: (data: NBEFXApprovalFormData) => void;
  onReject: (data: any) => void;
  loading?: boolean;
}

const NBEFXApprovalForm = ({ exportData, onApprove, onReject, loading = false }: NBEFXApprovalFormProps): JSX.Element => {
  const [formData, setFormData] = useState<NBEFXApprovalFormData>({
    approvedFXAmount: exportData.estimatedValue || '',
    fxRate: '',
    fxAllocationNumber: `FX-${Date.now()}`,
    approvalNotes: '',
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.approvedFXAmount || parseFloat(formData.approvedFXAmount) <= 0) newErrors.approvedFXAmount = 'Valid FX amount required';
    if (!formData.fxRate || parseFloat(formData.fxRate) <= 0) newErrors.fxRate = 'Valid FX rate required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validate()) return;
    onApprove({
      fxApprovalId: formData.fxAllocationNumber.trim(),  // Backend expects 'fxApprovalId'
      notes: formData.approvalNotes.trim(),  // Backend expects 'notes'
      // Backend doesn't use: approvedFXAmount, fxRate, etbEquivalent
    });
  };

  return (
    <>
      <Card>
        <CardHeader avatar={<DollarSign size={32} color="#1976d2" />} title="NBE Foreign Exchange Approval" subheader={`Export ID: ${exportData.exportId}`} />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>Review and approve foreign exchange allocation for this export</Alert>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Exporter:</strong> {exportData.exporterName}</Typography>
            <Typography variant="body2"><strong>Requested Value:</strong> ${exportData.estimatedValue}</Typography>
            <Typography variant="body2"><strong>Destination:</strong> {exportData.destinationCountry}</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Approved FX Amount (USD) *" type="number" value={formData.approvedFXAmount} onChange={(e) => setFormData({...formData, approvedFXAmount: e.target.value})} fullWidth required error={!!errors.approvedFXAmount} helperText={errors.approvedFXAmount} inputProps={{ step: '0.01', min: '0' }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="FX Rate (ETB/USD) *" type="number" value={formData.fxRate} onChange={(e) => setFormData({...formData, fxRate: e.target.value})} fullWidth required error={!!errors.fxRate} helperText={errors.fxRate || 'Current exchange rate'} inputProps={{ step: '0.01', min: '0' }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="FX Allocation Number" value={formData.fxAllocationNumber} onChange={(e) => setFormData({...formData, fxAllocationNumber: e.target.value})} fullWidth />
            </Grid>
            {formData.approvedFXAmount && formData.fxRate && (
              <Grid item xs={12}>
                <Alert severity="success">ETB Equivalent: <strong>{(parseFloat(formData.approvedFXAmount) * parseFloat(formData.fxRate)).toFixed(2)} ETB</strong></Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField label="Approval Notes" value={formData.approvalNotes} onChange={(e) => setFormData({...formData, approvalNotes: e.target.value})} multiline rows={3} fullWidth placeholder="Add any notes about the FX approval..." />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />} onClick={() => setShowRejectDialog(true)} disabled={loading}>Reject FX Application</Button>
          <Button variant="contained" color="success" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />} onClick={handleApprove} disabled={loading} size="large">{loading ? 'Approving...' : 'Approve FX Allocation'}</Button>
        </CardActions>
      </Card>
      <RejectionDialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} onReject={(data) => { setShowRejectDialog(false); onReject(data); }} stageName="NBE" exportId={exportData.exportId} loading={loading} />
    </>
  );
};

export default NBEFXApprovalForm;
