import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  getPendingVerifications,
  verifyDocument,
  DocumentVerification,
} from '../services/documentVerification.service';

const DocumentVerificationDashboard: React.FC = () => {
  const [verifications, setVerifications] = useState<DocumentVerification[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<DocumentVerification | null>(
    null
  );
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'REJECTED'>(
    'VERIFIED'
  );
  const [verificationMethod, setVerificationMethod] = useState('MSP_SIGNATURE');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    setLoading(true);
    try {
      const response = await getPendingVerifications();
      if (response.success) {
        setVerifications(response.verifications || []);
      } else {
        setError(response.error || 'Failed to load verifications');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerifyDialog = (verification: DocumentVerification) => {
    setSelectedVerification(verification);
    setVerificationStatus('VERIFIED');
    setVerificationMethod('MSP_SIGNATURE');
    setVerificationNotes('');
    setRejectionReason('');
    setVerifyDialogOpen(true);
  };

  const handleCloseVerifyDialog = () => {
    setVerifyDialogOpen(false);
    setSelectedVerification(null);
  };

  const handleVerify = async () => {
    if (!selectedVerification) return;

    if (verificationStatus === 'REJECTED' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await verifyDocument(
        selectedVerification.verificationId,
        verificationStatus,
        verificationMethod,
        verificationNotes,
        rejectionReason
      );

      if (response.success) {
        setSuccess(
          `Document ${verificationStatus === 'VERIFIED' ? 'verified' : 'rejected'} successfully!`
        );
        handleCloseVerifyDialog();
        await loadVerifications();
      } else {
        setError(response.error || 'Failed to verify document');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to verify document');
    } finally {
      setLoading(false);
    }
  };

  const groupedVerifications = verifications.reduce((acc, verification) => {
    const key = verification.submissionReference;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(verification);
    return acc;
  }, {} as Record<string, DocumentVerification[]>);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Document Verification Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadVerifications}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Verifications
              </Typography>
              <Typography variant="h3">{verifications.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Submission Batches
              </Typography>
              <Typography variant="h3">{Object.keys(groupedVerifications).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Your Role
              </Typography>
              <Typography variant="h6">
                {verifications[0]?.verifierMemberCode || 'Network Member'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Verifications */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Document Verifications
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review and verify documents submitted by exporters. Check document authenticity,
            signatures, and MSP verification.
          </Typography>

          {loading && <CircularProgress />}

          {!loading && verifications.length === 0 && (
            <Alert severity="info">No pending verifications</Alert>
          )}

          {!loading && verifications.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Submission Reference</TableCell>
                    <TableCell>Contract Reference</TableCell>
                    <TableCell>Exporter</TableCell>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Document Number</TableCell>
                    <TableCell>Issued By</TableCell>
                    <TableCell>Submitted Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verifications.map((verification) => (
                    <TableRow key={verification.verificationId}>
                      <TableCell>{verification.submissionReference}</TableCell>
                      <TableCell>{verification.contractReference}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{verification.exporter.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          TIN: {verification.exporter.tin}
                        </Typography>
                      </TableCell>
                      <TableCell>{verification.document.documentType}</TableCell>
                      <TableCell>{verification.document.documentNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={verification.document.issuerMemberCode}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(verification.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleOpenVerifyDialog(verification)}
                        >
                          Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Verify Document Dialog */}
      <Dialog
        open={verifyDialogOpen}
        onClose={handleCloseVerifyDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Verify Document</DialogTitle>
        <DialogContent>
          {selectedVerification && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2" fontWeight="bold">
                      Submission: {selectedVerification.submissionReference}
                    </Typography>
                    <Typography variant="body2">
                      Contract: {selectedVerification.contractReference}
                    </Typography>
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Document Details
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {selectedVerification.document.documentType}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Number:</strong> {selectedVerification.document.documentNumber}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Issued By:</strong>{' '}
                        {selectedVerification.document.issuerMemberCode}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Issued Date:</strong>{' '}
                        {new Date(selectedVerification.document.issuedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Document Hash:</strong>
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          display: 'block',
                        }}
                      >
                        {selectedVerification.document.documentHash}
                      </Typography>
                      {selectedVerification.document.blockchainTxId && (
                        <>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Blockchain TX:</strong>
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: 'monospace',
                              wordBreak: 'break-all',
                              display: 'block',
                            }}
                          >
                            {selectedVerification.document.blockchainTxId}
                          </Typography>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Verification Decision</InputLabel>
                    <Select
                      value={verificationStatus}
                      label="Verification Decision"
                      onChange={(e) =>
                        setVerificationStatus(e.target.value as 'VERIFIED' | 'REJECTED')
                      }
                    >
                      <MenuItem value="VERIFIED">Verify - Document is Authentic</MenuItem>
                      <MenuItem value="REJECTED">Reject - Document has Issues</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Verification Method</InputLabel>
                    <Select
                      value={verificationMethod}
                      label="Verification Method"
                      onChange={(e) => setVerificationMethod(e.target.value)}
                    >
                      <MenuItem value="MSP_SIGNATURE">MSP Signature Verification</MenuItem>
                      <MenuItem value="HASH_VERIFICATION">Document Hash Verification</MenuItem>
                      <MenuItem value="BLOCKCHAIN_VERIFICATION">
                        Blockchain Verification
                      </MenuItem>
                      <MenuItem value="SIGNATURE_CHECK">Digital Signature Check</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Verification Notes (Optional)"
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add any notes about the verification process..."
                  />
                </Grid>

                {verificationStatus === 'REJECTED' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      required
                      multiline
                      rows={3}
                      label="Rejection Reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why this document is being rejected..."
                      error={verificationStatus === 'REJECTED' && !rejectionReason.trim()}
                      helperText={
                        verificationStatus === 'REJECTED' && !rejectionReason.trim()
                          ? 'Rejection reason is required'
                          : ''
                      }
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseVerifyDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleVerify}
            disabled={loading}
            color={verificationStatus === 'VERIFIED' ? 'success' : 'error'}
            startIcon={
              loading ? (
                <CircularProgress size={20} />
              ) : verificationStatus === 'VERIFIED' ? (
                <CheckCircleIcon />
              ) : (
                <CancelIcon />
              )
            }
          >
            {verificationStatus === 'VERIFIED' ? 'Verify Document' : 'Reject Document'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentVerificationDashboard;
