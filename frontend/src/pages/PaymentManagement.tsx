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
  LinearProgress,
  Autocomplete
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
import exporterService from '../services/exporterService';
import apiClient from '../services/api';

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

  // Export selection states
  const [availableExports, setAvailableExports] = useState<any[]>([]);
  const [selectedExport, setSelectedExport] = useState<any>(null);
  const [loadingExports, setLoadingExports] = useState(false);
  const [loadingExportDetails, setLoadingExportDetails] = useState(false);

  // Form states for payment initiation
  const [exportId, setExportId] = useState('');
  const [contractId, setContractId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('LC');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [lcNumber, setLcNumber] = useState('');
  const [issuingBank, setIssuingBank] = useState('');
  const [advisingBank, setAdvisingBank] = useState('');
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

  const loadAvailableExports = async () => {
    try {
      setLoadingExports(true);
      // Fetch exports that don't have payments yet or are approved
      // Use /api/network/exports for network members (banks) to see all exports
      const response = await apiClient.get('/api/network/exports', {
        params: { status: 'APPROVED' }
      });
      const exports = response.data?.exports || response.data?.data || [];
      setAvailableExports(exports);
    } catch (err: any) {
      console.error('Failed to load exports:', err);
      setError('Failed to load available exports');
    } finally {
      setLoadingExports(false);
    }
  };

  const handleExportSelection = async (export_: any) => {
    if (!export_) {
      setSelectedExport(null);
      resetInitiateForm();
      return;
    }

    try {
      setLoadingExportDetails(true);
      setSelectedExport(export_);
      
      // Set export ID
      setExportId(export_.export_id);
      
      // Auto-fill LC number if available directly from export
      if (export_.lc_number) {
        setLcNumber(export_.lc_number);
      }
      
      // Auto-fill payment method if available
      if (export_.payment_method) {
        setPaymentMethod(export_.payment_method);
      }
      
      // Auto-fill payment terms if available
      if (export_.payment_terms) {
        setPaymentTerms(export_.payment_terms);
      }
      
      // Auto-fill banks if available
      if (export_.issuing_bank) {
        setIssuingBank(export_.issuing_bank);
      }
      
      if (export_.advising_bank) {
        setAdvisingBank(export_.advising_bank);
      }
      
      // Auto-fill LC expiry date if available
      if (export_.lc_expiry_date) {
        const date = new Date(export_.lc_expiry_date);
        const formattedDate = date.toISOString().split('T')[0];
        setExpiryDate(formattedDate);
      }
      
      // Fetch full export details including contract information
      const detailsResponse = await apiClient.get(`/api/exports/${export_.export_id}`);
      const exportDetails = detailsResponse.data?.export || detailsResponse.data?.data || export_;
      
      // Auto-fill amount from export value or contract
      if (exportDetails.contract_total_value) {
        setAmount(exportDetails.contract_total_value.toString());
      } else if (exportDetails.estimated_value || exportDetails.value || exportDetails.amount) {
        setAmount((exportDetails.estimated_value || exportDetails.value || exportDetails.amount).toString());
      }
      
      // Set currency
      if (exportDetails.contract_currency) {
        setCurrency(exportDetails.contract_currency);
      } else if (exportDetails.currency) {
        setCurrency(exportDetails.currency);
      }
      
      // Set buyer ID if available
      if (exportDetails.buyer_id) {
        setBuyerId(exportDetails.buyer_id);
      }
      
      // Set contract ID if available
      if (exportDetails.contract_id || exportDetails.sales_contract_id) {
        const contractId = exportDetails.contract_id || exportDetails.sales_contract_id;
        setContractId(contractId);
      }
      
      // If contract details are embedded in export response, use them
      if (exportDetails.contract_details) {
        const contract = exportDetails.contract_details;
        
        if (contract.lc_number && !lcNumber) {
          setLcNumber(contract.lc_number);
        }
        
        if (contract.payment_method && !paymentMethod) {
          setPaymentMethod(contract.payment_method);
        }
        
        if (contract.payment_terms && !paymentTerms) {
          setPaymentTerms(contract.payment_terms);
        }
        
        if (contract.issuing_bank && !issuingBank) {
          setIssuingBank(contract.issuing_bank);
        }
        
        if (contract.advising_bank && !advisingBank) {
          setAdvisingBank(contract.advising_bank);
        }
        
        if (contract.lc_expiry_date && !expiryDate) {
          const date = new Date(contract.lc_expiry_date);
          const formattedDate = date.toISOString().split('T')[0];
          setExpiryDate(formattedDate);
        }
        
        if (contract.total_value && !amount) {
          setAmount(contract.total_value.toString());
        }
        
        if (contract.currency && !currency) {
          setCurrency(contract.currency);
        }
      }
      
      setSuccess('Export details loaded successfully. LC Number and payment information auto-filled from registered sales contract.');
    } catch (err: any) {
      console.error('Failed to load export details:', err);
      setError('Failed to load export details');
    } finally {
      setLoadingExportDetails(false);
    }
  };

  const handleOpenInitiateDialog = () => {
    resetInitiateForm();
    loadAvailableExports();
    setOpenInitiateDialog(true);
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
        setError('Please select an export and fill in all required fields');
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

      // Add contract ID if available
      if (contractId) {
        paymentData.contractId = contractId;
      }

      // Add buyer ID if available
      if (buyerId) {
        paymentData.buyerId = buyerId;
      }

      if (paymentMethod === 'LC') {
        paymentData.lcDetails = {
          lcNumber: lcNumber || undefined,
          issuingBank: issuingBank || undefined,
          advisingBank: advisingBank || undefined,
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
    setSelectedExport(null);
    setExportId('');
    setContractId('');
    setBuyerId('');
    setPaymentMethod('LC');
    setAmount('');
    setCurrency('USD');
    setPaymentTerms('');
    setLcNumber('');
    setIssuingBank('');
    setAdvisingBank('');
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
            onClick={handleOpenInitiateDialog}
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
            {/* Export Selection */}
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select an approved export to initiate payment. Payment details will be auto-filled from the export and sales contract.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={availableExports}
                getOptionLabel={(option) => 
                  `${option.coffee_type || 'Export'} - ${option.quantity || 0} kg to ${option.destination_country || 'Unknown'} (${option.export_id?.substring(0, 8)}...)`
                }
                value={selectedExport}
                onChange={(_, newValue) => handleExportSelection(newValue)}
                loading={loadingExports}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Export *"
                    placeholder="Choose an approved export"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingExports ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box>
                      <Typography variant="body2">
                        <strong>{option.coffee_type || 'Export'}</strong> - {option.quantity || 0} kg
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        To: {option.destination_country || 'Unknown'} | ID: {option.export_id?.substring(0, 12)}...
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Grid>

            {loadingExportDetails && (
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={2}>
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="textSecondary">
                    Loading export and contract details...
                  </Typography>
                </Box>
              </Grid>
            )}

            {selectedExport && !loadingExportDetails && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Payment Details
                    </Typography>
                  </Divider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Export ID"
                    value={exportId}
                    disabled
                    helperText="Auto-filled from selected export"
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
                    helperText={contractId ? "From sales contract" : ""}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Amount *"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText={contractId ? "From sales contract" : "From export value"}
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
                        helperText={contractId ? "ECTA Reference Number from registered sales contract" : "Enter LC number"}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Issuing Bank"
                        value={issuingBank}
                        onChange={(e) => setIssuingBank(e.target.value)}
                        helperText={contractId ? "From sales contract" : ""}
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Advising Bank"
                        value={advisingBank}
                        onChange={(e) => setAdvisingBank(e.target.value)}
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
                        helperText={contractId ? "From sales contract" : ""}
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
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInitiateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleInitiatePayment}
            disabled={!selectedExport || !exportId || !amount || !paymentMethod || loadingExportDetails}
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

              {/* Review Status and Reviewer Information */}
              {(selectedPayment.status === 'DOCUMENTS_SUBMITTED' || 
                selectedPayment.status === 'UNDER_REVIEW' || 
                selectedPayment.status === 'APPROVED') && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Review Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined" sx={{ bgcolor: 'background.default', p: 2 }}>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Current Stage
                      </Typography>
                      <Typography variant="h6" gutterBottom>
                        {selectedPayment.status === 'DOCUMENTS_SUBMITTED' ? '📋 Documents Submitted - Awaiting Importer Bank Review' :
                         selectedPayment.status === 'UNDER_REVIEW' ? '🔍 Under Review - Importer Bank Verification' :
                         selectedPayment.status === 'APPROVED' ? '✅ Approved by Importer Bank - Ready for Payment' : 
                         selectedPayment.status}
                      </Typography>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" fontWeight="bold" gutterBottom>
                          Payment Flow:
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label="Initiator" 
                              size="small" 
                              color="success" 
                              sx={{ minWidth: 80 }}
                            />
                            <Typography variant="body2">
                              <strong>CBE (Exporter's Bank)</strong> - Payment initiated and documents submitted
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label="Reviewer" 
                              size="small" 
                              color="primary" 
                              sx={{ minWidth: 80 }}
                            />
                            <Typography variant="body2">
                              <strong>Importer's Bank</strong> - Reviews documents against sales contract requirements
                            </Typography>
                          </Box>

                          {selectedPayment.payment_method === 'LC' && selectedPayment.lc_advising_bank && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label="Advising" 
                                size="small" 
                                color="info" 
                                sx={{ minWidth: 80 }}
                              />
                              <Typography variant="body2">
                                <strong>{selectedPayment.lc_advising_bank}</strong> - LC Terms Verification
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {selectedPayment.status === 'DOCUMENTS_SUBMITTED' && (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                              <strong>Next Step:</strong> Importer's Bank ({selectedPayment.lc_issuing_bank || 'Buyer\'s Bank'}) will review submitted documents to verify they meet the requirements agreed upon in the sales contract. Expected review time: 2-3 business days.
                            </Typography>
                          </Alert>
                        )}

                        {selectedPayment.status === 'UNDER_REVIEW' && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                              <strong>In Progress:</strong> Importer's Bank is verifying that all submitted documents comply with the sales contract terms and conditions. You will be notified once the review is complete.
                            </Typography>
                          </Alert>
                        )}

                        {selectedPayment.status === 'APPROVED' && (
                          <Alert severity="success" sx={{ mt: 2 }}>
                            <Typography variant="caption">
                              <strong>Completed:</strong> Importer's Bank has approved the documents. Payment will be processed according to the agreed terms in the sales contract.
                            </Typography>
                          </Alert>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                </>
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
                      Submitted Documents
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>

                  <Grid item xs={12}>
                    {selectedPayment.status === 'DOCUMENTS_SUBMITTED' && (
                      <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          📋 Documents Submitted - Awaiting Review
                        </Typography>
                        <Typography variant="body2">
                          Submitted by: <strong>CBE (Exporter's Bank)</strong>
                        </Typography>
                        <Typography variant="body2">
                          To be reviewed by: <strong>{selectedPayment.lc_issuing_bank || 'Importer\'s Bank'}</strong>
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Documents are pending review by the importer's bank to verify compliance with sales contract requirements.
                        </Typography>
                      </Alert>
                    )}

                    {selectedPayment.status === 'UNDER_REVIEW' && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          🔍 Currently Under Review
                        </Typography>
                        <Typography variant="body2">
                          Reviewer: <strong>{selectedPayment.lc_issuing_bank || 'Importer\'s Bank'}</strong> (Document Verification Team)
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          The importer's bank is verifying that all submitted documents meet the requirements specified in the sales contract.
                        </Typography>
                      </Alert>
                    )}

                    {selectedPayment.status === 'APPROVED' && (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold">
                          ✅ Documents Approved
                        </Typography>
                        <Typography variant="body2">
                          Approved by: <strong>{selectedPayment.lc_issuing_bank || 'Importer\'s Bank'}</strong>
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          All documents have been verified and approved by the importer's bank. Payment will be processed according to the sales contract terms.
                        </Typography>
                      </Alert>
                    )}

                    <List>
                      {selectedPayment.documents.map((doc: any) => (
                        <ListItem 
                          key={doc.document_id}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: doc.review_status === 'APPROVED' ? 'success.50' : 
                                     doc.review_status === 'REJECTED' ? 'error.50' : 
                                     'background.paper'
                          }}
                        >
                          <DocumentIcon sx={{ mr: 2, color: 'primary.main' }} />
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body1" fontWeight="medium">
                                  {doc.document_name}
                                </Typography>
                                <Chip
                                  label={doc.review_status || 'PENDING REVIEW'}
                                  color={
                                    doc.review_status === 'APPROVED' ? 'success' : 
                                    doc.review_status === 'REJECTED' ? 'error' : 
                                    'warning'
                                  }
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="textSecondary">
                                  Type: <strong>{doc.document_type}</strong>
                                </Typography>
                                {doc.review_status === 'PENDING' || !doc.review_status ? (
                                  <Typography variant="caption" color="warning.main">
                                    ⏳ Awaiting review by {selectedPayment.lc_issuing_bank || 'Importer\'s Bank'}
                                  </Typography>
                                ) : doc.review_status === 'APPROVED' ? (
                                  <Typography variant="caption" color="success.main">
                                    ✓ Approved by {doc.reviewed_by || 'Importer\'s Bank Officer'} on {doc.reviewed_at ? new Date(doc.reviewed_at).toLocaleDateString() : 'N/A'}
                                  </Typography>
                                ) : doc.review_status === 'REJECTED' ? (
                                  <Typography variant="caption" color="error.main">
                                    ✗ Rejected by {doc.reviewed_by || 'Importer\'s Bank Officer'}: {doc.rejection_reason || 'See comments'}
                                  </Typography>
                                ) : null}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>

                    {/* Review Progress Indicator */}
                    {(selectedPayment.status === 'DOCUMENTS_SUBMITTED' || selectedPayment.status === 'UNDER_REVIEW') && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Review Progress
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption">CBE Submitted</Typography>
                              <Typography variant="caption">Importer Bank Review</Typography>
                              <Typography variant="caption">Approved</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={
                                selectedPayment.status === 'DOCUMENTS_SUBMITTED' ? 33 :
                                selectedPayment.status === 'UNDER_REVIEW' ? 66 :
                                selectedPayment.status === 'APPROVED' ? 100 : 0
                              }
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>
                        </Box>
                      </Box>
                    )}
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
        <DialogTitle>Submit Payment Documents to Importer's Bank</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Documents from Export Record
                </Typography>
                <Typography variant="body2">
                  These documents were uploaded by the exporter during export creation and will be submitted to the Importer's Bank for verification against the sales contract requirements.
                </Typography>
              </Alert>
            </Grid>
            
            <Grid item xs={12}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Note:</strong> The Importer's Bank will review these documents to ensure they comply with the terms agreed upon in the sales contract.
                </Typography>
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
