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
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Description as DocumentIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import paymentService from '../services/paymentService';

interface PaymentManagementProps {
  user: any;
  org: string | null;
}

const PaymentManagement: React.FC<PaymentManagementProps> = ({ user, org }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [openInitiateDialog, setOpenInitiateDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openDocumentsDialog, setOpenDocumentsDialog] = useState(false);

  // Form states for payment initiation
  const [exportId, setExportId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('LC');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [lcNumber, setLcNumber] = useState('');
  const [issuingBank, setIssuingBank] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Document upload states
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentType, setDocumentType] = useState('');
  const [documentName, setDocumentName] = useState('');

  // Helper function for payment method names
  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      'LC': 'Letter of Credit',
      'TT': 'Telegraphic Transfer',
      'CAD': 'Cash Against Documents',
      'DP': 'Documents Against Payment',
      'DA': 'Documents Against Acceptance',
      'OA': 'Open Account'
    };
    return methods[method] || method;
  };

  useEffect(() => {
    loadPayments();
    loadStatistics();
  }, [activeTab]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const statusFilter = getStatusFilter(activeTab);
      const response = await paymentService.getPayments(statusFilter);
      setPayments(response.payments || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await paymentService.getPaymentStatistics();
      setStatistics(response.statistics);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  };

  const getStatusFilter = (tab: number) => {
    switch (tab) {
      case 0: return {}; // All
      case 1: return { status: 'INITIATED' };
      case 2: return { status: 'DOCUMENTS_SUBMITTED' };
      case 3: return { status: 'UNDER_REVIEW' };
      case 4: return { status: 'APPROVED' };
      case 5: return { status: 'COMPLETED' };
      default: return {};
    }
  };

  const handleInitiatePayment = async () => {
    try {
      if (!exportId || !amount || !paymentMethod) {
        setError('Please fill in all required fields');
        return;
      }

      const paymentData: any = {
        exportId,
        paymentMethod,
        amount: parseFloat(amount),
        currency,
        paymentTerms: paymentTerms || undefined,
        notes: notes || undefined
      };

      if (paymentMethod === 'LC' && lcNumber) {
        paymentData.lcDetails = {
          lcNumber,
          issuingBank,
          expiryDate: expiryDate || undefined
        };
      }

      await paymentService.initiatePayment(paymentData);
      setSuccess('Payment initiated successfully');
      setOpenInitiateDialog(false);
      resetInitiateForm();
      loadPayments();
      loadStatistics();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment');
    }
  };

  const resetInitiateForm = () => {
    setExportId('');
    setPaymentMethod('LC');
    setAmount('');
    setCurrency('USD');
    setPaymentTerms('');
    setLcNumber('');
    setIssuingBank('');
    setExpiryDate('');
    setNotes('');
  };

  const handleViewDetails = async (payment: any) => {
    try {
      const response = await paymentService.getPaymentDetails(payment.payment_id);
      setSelectedPayment(response.payment);
      setOpenDetailsDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment details');
    }
  };

  const handleSubmitDocuments = async () => {
    try {
      if (!selectedPayment || documents.length === 0) {
        setError('Please add at least one document');
        return;
      }

      await paymentService.submitPaymentDocuments(selectedPayment.payment_id, documents);
      setSuccess('Documents submitted successfully');
      setOpenDocumentsDialog(false);
      setDocuments([]);
      loadPayments();
    } catch (err: any) {
      setError(err.message || 'Failed to submit documents');
    }
  };

  const addDocument = () => {
    if (!documentType || !documentName) {
      setError('Please fill in document type and name');
      return;
    }

    setDocuments([
      ...documents,
      {
        documentType,
        documentName,
        documentUrl: '', // In production, this would be uploaded to storage
        documentHash: '' // In production, this would be calculated
      }
    ]);

    setDocumentType('');
    setDocumentName('');
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'INITIATED': 'info',
      'LC_OPENED': 'primary',
      'DOCUMENTS_SUBMITTED': 'warning',
      'UNDER_REVIEW': 'warning',
      'APPROVED': 'success',
      'PROCESSING': 'info',
      'COMPLETED': 'success',
      'FAILED': 'error',
      'DISPUTED': 'error'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount: number, curr: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payment Management</Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPayments}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenInitiateDialog(true)}
          >
            Initiate Payment
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Payments
                    </Typography>
                    <Typography variant="h4">
                      {statistics.total_payments || 0}
                    </Typography>
                  </Box>
                  <PaymentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Completed
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {statistics.completed_payments || 0}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Total Received
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(statistics.total_received || 0)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" variant="body2">
                      Pending Amount
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(statistics.pending_amount || 0)}
                    </Typography>
                  </Box>
                  <PaymentIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Payments" />
          <Tab label="Initiated" />
          <Tab label="Documents Submitted" />
          <Tab label="Under Review" />
          <Tab label="Approved" />
          <Tab label="Completed" />
        </Tabs>

        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Payment ID</TableCell>
                    <TableCell>Export</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Initiated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.payment_id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {payment.payment_id.substring(0, 8)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {payment.coffee_type || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {payment.destination_country || ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={payment.payment_method} size="small" />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(payment.amount, payment.currency)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            color={getStatusColor(payment.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<DocumentIcon />}
                            label={`${payment.approved_documents || 0}/${payment.documents_count || 0}`}
                            size="small"
                            color={
                              payment.approved_documents === payment.documents_count
                                ? 'success'
                                : 'default'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {payment.initiated_at
                            ? new Date(payment.initiated_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(payment)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          {payment.status === 'INITIATED' && (
                            <Tooltip title="Submit Documents">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setOpenDocumentsDialog(true);
                                }}
                              >
                                <UploadIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Initiate Payment Dialog */}
      <Dialog
        open={openInitiateDialog}
        onClose={() => setOpenInitiateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Initiate New Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Export ID"
                value={exportId}
                onChange={(e) => setExportId(e.target.value)}
                required
                helperText="Enter the export ID for this payment"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  label="Payment Method"
                >
                  <MenuItem value="LC">Letter of Credit (LC)</MenuItem>
                  <MenuItem value="TT">Telegraphic Transfer (TT)</MenuItem>
                  <MenuItem value="CAD">Cash Against Documents (CAD)</MenuItem>
                  <MenuItem value="DP">Documents Against Payment (DP)</MenuItem>
                  <MenuItem value="DA">Documents Against Acceptance (DA)</MenuItem>
                  <MenuItem value="OA">Open Account (OA)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="e.g., Net 30, Net 60"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="ETB">ETB</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {paymentMethod === 'LC' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Letter of Credit Details
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="LC Number"
                    value={lcNumber}
                    onChange={(e) => setLcNumber(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Issuing Bank"
                    value={issuingBank}
                    onChange={(e) => setIssuingBank(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Expiry Date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or instructions"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInitiateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInitiatePayment}
            disabled={!exportId || !amount || !paymentMethod}
          >
            Initiate Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Payment Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Payment ID
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedPayment.payment_id}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedPayment.status}
                  color={getStatusColor(selectedPayment.status)}
                  size="small"
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Payment Method
                </Typography>
                <Typography variant="body1">
                  {getPaymentMethodName(selectedPayment.payment_method)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Amount
                </Typography>
                <Typography variant="body1">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </Typography>
              </Grid>

              {selectedPayment.payment_terms && (
                <Grid item xs={6}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Terms
                  </Typography>
                  <Typography variant="body1">{selectedPayment.payment_terms}</Typography>
                </Grid>
              )}

              {selectedPayment.lc_number && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Letter of Credit Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      LC Number
                    </Typography>
                    <Typography variant="body1">{selectedPayment.lc_number}</Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Issuing Bank
                    </Typography>
                    <Typography variant="body1">
                      {selectedPayment.lc_issuing_bank || 'N/A'}
                    </Typography>
                  </Grid>
                </>
              )}

              {selectedPayment.documents && selectedPayment.documents.length > 0 && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Documents
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>

                  <Grid item xs={12}>
                    <List>
                      {selectedPayment.documents.map((doc: any) => (
                        <ListItem key={doc.document_id}>
                          <ListItemText
                            primary={doc.document_name}
                            secondary={`Type: ${doc.document_type} | Status: ${
                              doc.review_status || 'PENDING'
                            }`}
                          />
                          <Chip
                            label={doc.review_status || 'PENDING'}
                            color={doc.review_status === 'APPROVED' ? 'success' : 'default'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Submit Documents Dialog */}
      <Dialog
        open={openDocumentsDialog}
        onClose={() => setOpenDocumentsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Submit Payment Documents</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Submit required documents for payment processing. Common documents include:
                Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin, etc.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  label="Document Type"
                >
                  <MenuItem value="COMMERCIAL_INVOICE">Commercial Invoice</MenuItem>
                  <MenuItem value="PACKING_LIST">Packing List</MenuItem>
                  <MenuItem value="BILL_OF_LADING">Bill of Lading</MenuItem>
                  <MenuItem value="CERTIFICATE_OF_ORIGIN">Certificate of Origin</MenuItem>
                  <MenuItem value="INSURANCE_CERTIFICATE">Insurance Certificate</MenuItem>
                  <MenuItem value="QUALITY_CERTIFICATE">Quality Certificate</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Document Name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Invoice-2024-001.pdf"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={addDocument}
                disabled={!documentType || !documentName}
              >
                Add Document
              </Button>
            </Grid>

            {documents.length > 0 && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Documents to Submit ({documents.length})
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12}>
                  <List>
                    {documents.map((doc, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" onClick={() => removeDocument(index)}>
                            <DocumentIcon />
                          </IconButton>
                        }
                      >
                        <ListItemText
                          primary={doc.documentName}
                          secondary={doc.documentType}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDocumentsDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitDocuments}
            disabled={documents.length === 0}
          >
            Submit Documents
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentManagement;
