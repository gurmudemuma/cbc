// @ts-nocheck
import { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid,
  Alert, CircularProgress, Box, Typography, Divider, Checkbox, FormControlLabel,
} from '@mui/material';
import { CheckCircle, XCircle, FileCheck } from 'lucide-react';
import RejectionDialog from '../RejectionDialog';

const ECTAContractForm = ({ exportData, onApprove, onReject, loading = false }) => {
  const [formData, setFormData] = useState({
    contractNumber: '',
    originCertNumber: `COO-${Date.now()}`,
    buyerName: '',
    buyerCountry: exportData.destinationCountry || '',
    paymentTerms: '',
    lcNumber: '',
    lcOpeningDate: '',
    notificationDate: new Date().toISOString().split('T')[0],
    settlementDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    buyerVerified: false,
    notes: '',
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.contractNumber?.trim()) newErrors.contractNumber = 'Contract number required';
    if (!formData.originCertNumber?.trim()) newErrors.originCertNumber = 'Origin certificate number required';
    if (!formData.buyerName?.trim()) newErrors.buyerName = 'Buyer name required';
    if (!formData.buyerVerified) newErrors.buyerVerified = 'Buyer verification required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validate()) return;
    onApprove({
      contractNumber: formData.contractNumber.trim(),
      originCertificateNumber: formData.originCertNumber.trim(),  // Backend expects 'originCertificateNumber'
      notes: formData.notes.trim(),
      // Backend doesn't use: buyerName, buyerCountry, paymentTerms
    });
  };

  return (
    <>
      <Card>
        <CardHeader avatar={<FileCheck size={32} color="#1976d2" />} title="ECTA Contract Approval & Origin Certificate" subheader={`Export ID: ${exportData.exportId}`} />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>Approve export contract and issue Certificate of Origin</Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Contract Number *" value={formData.contractNumber} onChange={(e) => setFormData({...formData, contractNumber: e.target.value})} fullWidth required error={!!errors.contractNumber} helperText={errors.contractNumber} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Certificate of Origin Number *" value={formData.originCertNumber} onChange={(e) => setFormData({...formData, originCertNumber: e.target.value})} fullWidth required error={!!errors.originCertNumber} helperText={errors.originCertNumber} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Buyer Name *" value={formData.buyerName} onChange={(e) => setFormData({...formData, buyerName: e.target.value})} fullWidth required error={!!errors.buyerName} helperText={errors.buyerName} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Buyer Country *" value={formData.buyerCountry} onChange={(e) => setFormData({...formData, buyerCountry: e.target.value})} fullWidth required />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Payment Terms" value={formData.paymentTerms} onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} fullWidth placeholder="e.g., LC at sight, 30 days after shipment" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="L/C Number" value={formData.lcNumber} onChange={(e) => setFormData({...formData, lcNumber: e.target.value})} fullWidth helperText="Letter of Credit number from buyer" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="L/C Opening Date" type="date" value={formData.lcOpeningDate} onChange={(e) => setFormData({...formData, lcOpeningDate: e.target.value})} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Notification Date" type="date" value={formData.notificationDate} onChange={(e) => setFormData({...formData, notificationDate: e.target.value})} fullWidth InputLabelProps={{ shrink: true }} helperText="Contract notification to MOTRI (15-day requirement)" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Settlement Deadline" type="date" value={formData.settlementDeadline} onChange={(e) => setFormData({...formData, settlementDeadline: e.target.value})} fullWidth InputLabelProps={{ shrink: true }} helperText="90-day settlement deadline (NBE requirement)" />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={formData.buyerVerified} onChange={(e) => setFormData({...formData, buyerVerified: e.target.checked})} />} label="Buyer information verified" />
              {errors.buyerVerified && <Typography variant="caption" color="error">{errors.buyerVerified}</Typography>}
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} multiline rows={3} fullWidth />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />} onClick={() => setShowRejectDialog(true)} disabled={loading}>Reject Contract</Button>
          <Button variant="contained" color="success" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />} onClick={handleApprove} disabled={loading} size="large">{loading ? 'Approving...' : 'Approve Contract & Issue Origin Certificate'}</Button>
        </CardActions>
      </Card>
      <RejectionDialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} onReject={(data) => { setShowRejectDialog(false); onReject(data); }} stageName="ECTA_CONTRACT" exportId={exportData.exportId} loading={loading} />
    </>
  );
};

export default ECTAContractForm;
