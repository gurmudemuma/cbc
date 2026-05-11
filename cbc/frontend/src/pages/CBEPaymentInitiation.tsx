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
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import {
  getBatchesReadyForPayment,
  initiatePayment,
  BatchReadyForPayment,
} from '../services/documentVerification.service';

const CBEPaymentInitiation: React.FC = () => {
  const [batches, setBatches] = useState<BatchReadyForPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchReadyForPayment | null>(null);
  const [importerBankName, setImporterBankName] = useState('');
  const [importerBankCountry, setImporterBankCountry] = useState('');
  const [importerBankSwift, setImporterBankSwift] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const response = await getBatchesReadyForPayment();
      if (response.success) {
        setBatches(response.batches || []);
      } else {
        setError(response.error || 'Failed to load batches');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentDialog = (batch: BatchReadyForPayment) => {
    setSelectedBatch(batch);
    setImporterBankName('');
    setImporterBankCountry(batch.buyer.country || '');
    setImporterBankSwift('');
    setPaymentAmount(batch.contract.value?.toString() || '');
    setPaymentCurrency(batch.contract.currency || 'USD');
    setPaymentMethod(batch.contract.paymentMethod || '');
    setPaymentTerms(batch.contract.paymentTerms || '');
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedBatch(null);
  };

  const handleInitiatePayment = async () => {
    if (!selectedBatch) return;

    if (!importerBankName.trim() || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await initiatePayment(
        selectedBatch.batchId,
        importerBankName,
        importerBankCountry,
        importerBankSwift,
        parseFloat(paymentAmount),
        paymentCurrency,
        paymentMethod,
        paymentTerms
      );

      if (response.success && response.data) {
        setSuccess(
          `Payment initiated successfully! Payment Reference: ${response.data.paymentReference}`
        );
        handleClosePaymentDialog();
        await loadBatches();
      } else {
        setError(response.error || 'Failed to initiate payment');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          CBE Payment Initiation
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadBatches}
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
                Ready for Payment
              </Typography>
              <Typography variant="h3">{batches.length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Verified document batches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Documents
              </Typography>
              <Typography variant="h3">
                {batches.reduce((sum, batch) => sum + batch.totalDocuments, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verified and ready
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h3">
                {batches
                  .reduce((sum, batch) => sum + (batch.contract.value || 0), 0)
                  .toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {batches[0]?.contract.currency || 'USD'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Batches Ready for Payment */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Document Batches Ready for Payment Initiation
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            All documents have been verified by network members. Initiate payment by sending
            documents to importer/buyer bank.
          </Typography>

          {loading && <CircularProgress />}

          {!loading && batches.length === 0 && (
            <Alert severity="info">No batches ready for payment initiation</Alert>
          )}

          {!loading && batches.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Submission Reference</TableCell>
                    <TableCell>Contract Reference</TableCell>
                    <TableCell>Exporter</TableCell>
                    <TableCell>Buyer</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Contract Value</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Verified Date</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.batchId}>
                      <TableCell>{batch.submissionReference}</TableCell>
                      <TableCell>{batch.contractReference}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{batch.exporterName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          TIN: {batch.exporterTin}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{batch.buyer.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {batch.buyer.country}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${batch.verifiedDocuments} / ${batch.totalDocuments}`}
                          color="success"
                          size="small"
                          icon={<CheckCircleIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        {batch.contract.value?.toLocaleString()} {batch.contract.currency}
                      </TableCell>
                      <TableCell>{batch.contract.paymentMethod}</TableCell>
                      <TableCell>
                        {new Date(batch.verificationCompletedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleOpenPaymentDialog(batch)}
                        >
                          Initiate Payment
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

      {/* Payment Initiation Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={handleClosePaymentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Initiate Payment to Importer Bank</DialogTitle>
        <DialogContent>
          {selectedBatch && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="body2" fontWeight="bold">
                      Submission: {selectedBatch.submissionReference}
                    </Typography>
                    <Typography variant="body2">
                      Contract: {selectedBatch.contractReference}
                    </Typography>
                    <Typography variant="body2">
                      Exporter: {selectedBatch.exporterName}
                    </Typography>
                    <Typography variant="body2">
                      Buyer: {selectedBatch.buyer.name} ({selectedBatch.buyer.country})
                    </Typography>
                    <Typography variant="body2">
                      Verified Documents: {selectedBatch.verifiedDocuments} /{' '}
                      {selectedBatch.totalDocuments}
                    </Typography>
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Importer/Buyer Bank Details
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    required
                    label="Importer Bank Name"
                    value={importerBankName}
                    onChange={(e) => setImporterBankName(e.target.value)}
                    placeholder="Enter importer/buyer bank name"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Bank Country"
                    value={importerBankCountry}
                    onChange={(e) => setImporterBankCountry(e.target.value)}
                    placeholder="Enter bank country"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="SWIFT Code"
                    value={importerBankSwift}
                    onChange={(e) => setImporterBankSwift(e.target.value)}
                    placeholder="Enter SWIFT/BIC code"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Payment Details
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    type="number"
                    label="Payment Amount"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Currency"
                    value={paymentCurrency}
                    onChange={(e) => setPaymentCurrency(e.target.value)}
                    placeholder="USD, EUR, etc."
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Method"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="LC, TT, DP, DA"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Terms"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="Payment terms"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="warning">
                    <Typography variant="body2">
                      <strong>Important:</strong> Initiating payment will send all verified
                      documents to the importer/buyer bank for payment processing. This action
                      cannot be undone.
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInitiatePayment}
            disabled={loading}
            color="primary"
            startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            Initiate Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CBEPaymentInitiation;
