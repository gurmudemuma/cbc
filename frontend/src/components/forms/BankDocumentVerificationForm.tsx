import { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, Grid,
  Alert, CircularProgress, Box, Typography, Divider, Checkbox, FormControlLabel, FormGroup,
} from '@mui/material';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react';
import RejectionDialog from '../RejectionDialog';

const BankDocumentVerificationForm = ({ exportData, onApprove, onReject, loading = false }) => {
  const [checkedDocs, setCheckedDocs] = useState({
    ectaLicense: false,
    qualityCert: false,
    originCert: false,
    contract: false,
    invoice: false,
    packingList: false,
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const allDocsChecked = Object.values(checkedDocs).every(v => v);

  const documents = [
    { key: 'ectaLicense', label: 'ECTA Export License', required: true },
    { key: 'qualityCert', label: 'Quality Certificate', required: true },
    { key: 'originCert', label: 'Certificate of Origin', required: true },
    { key: 'contract', label: 'Export Contract', required: true },
    { key: 'invoice', label: 'Commercial Invoice', required: true },
    { key: 'packingList', label: 'Packing List', required: false },
  ];

  const handleApprove = () => {
    if (!allDocsChecked) return;
    onApprove({ verifiedDocuments: checkedDocs });
  };

  return (
    <>
      <Card>
        <CardHeader avatar={<DollarSign size={32} color="#1976d2" />} title="Bank Document Verification" subheader={`Export ID: ${exportData.exportId}`} />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>Verify all required export documents before approval. After approval, FX application will be automatically submitted to NBE.</Alert>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Exporter:</strong> {exportData.exporterName}</Typography>
            <Typography variant="body2"><strong>Value:</strong> ${exportData.estimatedValue}</Typography>
            <Typography variant="body2"><strong>Destination:</strong> {exportData.destinationCountry}</Typography>
          </Box>
          <Typography variant="subtitle2" gutterBottom>Document Verification Checklist:</Typography>
          <FormGroup>
            {documents.map(doc => (
              <FormControlLabel
                key={doc.key}
                control={<Checkbox checked={checkedDocs[doc.key]} onChange={(e) => setCheckedDocs({...checkedDocs, [doc.key]: e.target.checked})} />}
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{doc.label} {doc.required && <Typography variant="caption" color="error">*</Typography>}</Box>}
              />
            ))}
          </FormGroup>
          {!allDocsChecked && (
            <Alert severity="warning" sx={{ mt: 2 }}>All required documents must be verified before approval</Alert>
          )}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />} onClick={() => setShowRejectDialog(true)} disabled={loading}>Reject Documents</Button>
          <Button variant="contained" color="success" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />} onClick={handleApprove} disabled={loading || !allDocsChecked} size="large">{loading ? 'Approving...' : 'Approve Documents & Submit to NBE'}</Button>
        </CardActions>
      </Card>
      <RejectionDialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} onReject={(data) => { setShowRejectDialog(false); onReject(data); }} stageName="BANK" exportId={exportData.exportId} loading={loading} />
    </>
  );
};

export default BankDocumentVerificationForm;
