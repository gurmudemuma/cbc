import { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid,
  Alert, CircularProgress, Box, Typography, Divider, Chip,
} from '@mui/material';
import { CheckCircle, XCircle, ShieldCheck, Upload } from 'lucide-react';
import RejectionDialog from '../RejectionDialog';

const CustomsClearanceForm = ({ exportData, onApprove, onReject, loading = false }) => {
  const [formData, setFormData] = useState({
    declarationNumber: `CUST-${Date.now()}`,
    inspectionNotes: '',
    dutyPaid: '',
    taxPaid: '',
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.declarationNumber?.trim()) newErrors.declarationNumber = 'Declaration number required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validate()) return;
    onApprove({
      declarationNumber: formData.declarationNumber.trim(),
      inspectionNotes: formData.inspectionNotes.trim(),
      dutyPaid: formData.dutyPaid,
      taxPaid: formData.taxPaid,
      documents: uploadedDocs,
    });
  };

  return (
    <>
      <Card>
        <CardHeader avatar={<ShieldCheck size={32} color="#1976d2" />} title="Customs Clearance" subheader={`Export ID: ${exportData.exportId}`} />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>Review customs declaration and issue clearance for export</Alert>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Exporter:</strong> {exportData.exporterName}</Typography>
            <Typography variant="body2"><strong>Coffee Type:</strong> {exportData.coffeeType}</Typography>
            <Typography variant="body2"><strong>Quantity:</strong> {exportData.quantity} kg</Typography>
            <Typography variant="body2"><strong>Destination:</strong> {exportData.destinationCountry}</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Customs Declaration Number *" value={formData.declarationNumber} onChange={(e) => setFormData({...formData, declarationNumber: e.target.value})} fullWidth required error={!!errors.declarationNumber} helperText={errors.declarationNumber} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Duty Paid (ETB)" type="number" value={formData.dutyPaid} onChange={(e) => setFormData({...formData, dutyPaid: e.target.value})} fullWidth inputProps={{ step: '0.01', min: '0' }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Tax Paid (ETB)" type="number" value={formData.taxPaid} onChange={(e) => setFormData({...formData, taxPaid: e.target.value})} fullWidth inputProps={{ step: '0.01', min: '0' }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Inspection Notes" value={formData.inspectionNotes} onChange={(e) => setFormData({...formData, inspectionNotes: e.target.value})} multiline rows={4} fullWidth placeholder="Customs inspection findings, compliance status, etc..." />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" startIcon={<Upload size={18} />} fullWidth>
                Upload Clearance Documents
                <input type="file" hidden multiple accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadedDocs([...uploadedDocs, ...Array.from(e.target.files)])} />
              </Button>
              {uploadedDocs.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {uploadedDocs.map((file, i) => (
                    <Chip key={i} label={file.name} size="small" sx={{ mr: 1, mt: 0.5 }} onDelete={() => setUploadedDocs(uploadedDocs.filter((_, idx) => idx !== i))} />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />} onClick={() => setShowRejectDialog(true)} disabled={loading}>Reject at Customs</Button>
          <Button variant="contained" color="success" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />} onClick={handleApprove} disabled={loading} size="large">{loading ? 'Issuing...' : 'Issue Customs Clearance'}</Button>
        </CardActions>
      </Card>
      <RejectionDialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} onReject={(data) => { setShowRejectDialog(false); onReject(data); }} stageName="CUSTOMS" exportId={exportData.exportId} loading={loading} />
    </>
  );
};

export default CustomsClearanceForm;
