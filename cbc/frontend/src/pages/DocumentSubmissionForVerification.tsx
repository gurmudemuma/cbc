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
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import documentService from '../services/document.service';
import { submitDocumentBatch, getExporterBatches, DocumentSubmissionBatch } from '../services/documentVerification.service';

const DocumentSubmissionForVerification: React.FC = () => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [batches, setBatches] = useState<DocumentSubmissionBatch[]>([]);
  const [issuedDocuments, setIssuedDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadContracts(), loadBatches(), loadIssuedDocuments()]);
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      const response = await documentService.getRegisteredContracts();
      if (response.success) {
        setContracts(response.registeredContracts || []);
      }
    } catch (error) {
      console.error('Failed to load contracts:', error);
    }
  };

  const loadBatches = async () => {
    try {
      const response = await getExporterBatches();
      if (response.success) {
        setBatches(response.batches || []);
      }
    } catch (error) {
      console.error('Failed to load batches:', error);
    }
  };

  const loadIssuedDocuments = async () => {
    try {
      const response = await documentService.getIssuedDocuments();
      if (response.success) {
        setIssuedDocuments(response.documents || []);
      }
    } catch (error) {
      console.error('Failed to load issued documents:', error);
    }
  };

  const handleOpenSubmitDialog = (contract: any) => {
    setSelectedContract(contract);
    setSelectedDocuments([]);
    setSubmitDialogOpen(true);
  };

  const handleCloseSubmitDialog = () => {
    setSubmitDialogOpen(false);
    setSelectedContract(null);
    setSelectedDocuments([]);
  };

  const handleToggleDocument = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSubmitBatch = async () => {
    if (!selectedContract || selectedDocuments.length === 0) {
      setError('Please select at least one document');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await submitDocumentBatch(
        selectedContract.ectaReferenceNumber,
        selectedDocuments
      );

      if (response.success) {
        setSuccess(
          `Document batch submitted successfully! Reference: ${response.data.submissionReference}`
        );
        handleCloseSubmitDialog();
        await loadBatches();
      } else {
        setError(response.error || 'Failed to submit document batch');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to submit document batch');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'info';
      case 'UNDER_VERIFICATION':
        return 'warning';
      case 'VERIFIED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PAYMENT_INITIATED':
        return 'success';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VERIFIED':
      case 'PAYMENT_INITIATED':
        return <CheckCircleIcon />;
      case 'REJECTED':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getVerificationProgress = (batch: DocumentSubmissionBatch) => {
    const { total, verified } = batch.verificationProgress;
    return total > 0 ? (verified / total) * 100 : 0;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Document Verification Submission
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
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

      {/* Registered Contracts */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Registered Contracts - Submit Documents for Verification
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select a contract to submit collected documents for network member verification
          </Typography>

          {loading && <CircularProgress />}

          {!loading && contracts.length === 0 && (
            <Alert severity="info">No registered contracts found</Alert>
          )}

          {!loading && contracts.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ECTA Reference</TableCell>
                    <TableCell>Coffee Type</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Registered Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.submissionId}>
                      <TableCell>{contract.ectaReferenceNumber}</TableCell>
                      <TableCell>{contract.coffeeType}</TableCell>
                      <TableCell>{contract.quantity} kg</TableCell>
                      <TableCell>{contract.buyerName}</TableCell>
                      <TableCell>
                        {new Date(contract.registeredAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<SendIcon />}
                          onClick={() => handleOpenSubmitDialog(contract)}
                        >
                          Submit Documents
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

      {/* Submitted Batches */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Submitted Document Batches
          </Typography>

          {batches.length === 0 && (
            <Alert severity="info">No document batches submitted yet</Alert>
          )}

          {batches.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Submission Reference</TableCell>
                    <TableCell>Contract Reference</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Verification Progress</TableCell>
                    <TableCell>Submitted Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.batchId}>
                      <TableCell>{batch.submissionReference}</TableCell>
                      <TableCell>{batch.contractReference}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(batch.submissionStatus)}
                          label={batch.submissionStatus}
                          color={getStatusColor(batch.submissionStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{batch.totalDocuments}</TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">
                              {batch.verificationProgress.verified} /{' '}
                              {batch.verificationProgress.total} verified
                            </Typography>
                            <Typography variant="caption">
                              {Math.round(getVerificationProgress(batch))}%
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={getVerificationProgress(batch)}
                            color={
                              batch.submissionStatus === 'VERIFIED' ? 'success' : 'primary'
                            }
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(batch.submittedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Submit Documents Dialog */}
      <Dialog
        open={submitDialogOpen}
        onClose={handleCloseSubmitDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submit Documents for Verification
          {selectedContract && (
            <Typography variant="body2" color="text.secondary">
              Contract: {selectedContract.ectaReferenceNumber}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Select the documents you have collected (signed by MSP/network identity) to submit
            for network member verification:
          </Typography>

          {issuedDocuments.length === 0 && (
            <Alert severity="warning">
              No issued documents found. Please request and collect documents first.
            </Alert>
          )}

          {issuedDocuments.length > 0 && (
            <Box>
              {issuedDocuments.map((doc) => (
                <FormControlLabel
                  key={doc.documentId}
                  control={
                    <Checkbox
                      checked={selectedDocuments.includes(doc.documentId)}
                      onChange={() => handleToggleDocument(doc.documentId)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">
                        {doc.documentType} - {doc.documentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Issued by: {doc.issuerMemberCode} | Status: {doc.status}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubmitDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitBatch}
            disabled={loading || selectedDocuments.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Submit for Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentSubmissionForVerification;
