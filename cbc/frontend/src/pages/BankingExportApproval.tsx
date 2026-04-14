import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  MenuItem,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle,
  XCircle,
  FileText,
  DollarSign,
  Building,
  User,
  Package,
  AlertCircle,
  Eye,
  RefreshCw,
  Search,
  Shield,
} from 'lucide-react';
import bankingService from '../services/bankingService';
import documentService from '../services/document.service';

interface Export {
  exportId: string;
  exporterId: string;
  exporterName?: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  buyerName?: string;
  buyerCountry?: string;
  status: string;
  salesContractReference?: string;
  createdAt: string;
}

interface ContractData {
  referenceNumber: string;
  status: string;
  registeredAt: string;
  exporter: {
    id: string;
    name: string;
    registration: string;
    tin: string;
  };
  buyer: {
    id: string;
    name: string;
    country: string;
    registration?: string;
  };
  contract: {
    coffeeType: string;
    originRegion: string;
    quantity: number;
    unitPrice: number;
    totalValue: number;
    currency: string;
    qualityGrade: string;
    paymentMethod: string;
    paymentTerms: string;
    incoterms: string;
    portOfLoading: string;
    portOfDischarge: string;
    deliveryDate: string;
  };
  blockchainVerification?: any;
}

interface DocumentRequest {
  requestId: string;
  documentType: string;
  status: string;
  requestedAt: string;
}

const BankingExportApproval: React.FC = () => {
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExport, setSelectedExport] = useState<Export | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Sales contract verification
  const [contractReference, setContractReference] = useState('');
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  // Document requests
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);

  // Approval form data
  const [lcNumber, setLcNumber] = useState('');
  const [importerBank, setImporterBank] = useState('');
  const [importerBankSwift, setImporterBankSwift] = useState('');
  const [lcAmount, setLcAmount] = useState('');
  const [lcCurrency, setLcCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState('LC');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Rejection form data
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingExports();
  }, []);

  const fetchPendingExports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bankingService.getPendingDocuments('BANKING_PENDING');
      setExports(response.data || response || []);
    } catch (err: any) {
      console.error('Error fetching exports:', err);
      setError(err.response?.data?.error || 'Failed to fetch pending exports');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproval = async (exportItem: Export) => {
    setSelectedExport(exportItem);
    setContractReference(exportItem.salesContractReference || '');
    setContractData(null);
    setContractError(null);
    setDocumentRequests([]);
    setLcNumber('');
    setImporterBank('');
    setImporterBankSwift('');
    setLcAmount(exportItem.estimatedValue?.toString() || '');
    setLcCurrency('USD');
    setPaymentMethod('LC');
    setApprovalNotes('');
    setActiveTab(0);
    setApprovalDialog(true);

    // Auto-verify contract if reference is available
    if (exportItem.salesContractReference) {
      await verifyContract(exportItem.salesContractReference);
    }

    // Fetch document requests for this exporter
    await fetchDocumentRequests(exportItem.exporterId);
  };

  const verifyContract = async (reference: string) => {
    if (!reference.trim()) return;

    try {
      setContractLoading(true);
      setContractError(null);
      const response = await bankingService.verifySalesContract(reference.trim());

      if (response.success) {
        setContractData(response.data);
        // Pre-fill LC details from contract
        setImporterBank(response.data.buyer.name || '');
        setLcAmount(response.data.contract.totalValue?.toString() || '');
        setLcCurrency(response.data.contract.currency || 'USD');
        setPaymentMethod(response.data.contract.paymentMethod || 'LC');
      } else {
        setContractError(response.error || 'Contract not found');
      }
    } catch (err: any) {
      console.error('Contract verification error:', err);
      setContractError(err.response?.data?.error || 'Failed to verify sales contract');
    } finally {
      setContractLoading(false);
    }
  };

  const fetchDocumentRequests = async (exporterId: string) => {
    try {
      setDocumentsLoading(true);
      // Get pending document requests for this exporter
      const response = await documentService.getDocumentRequests('PENDING');
      // Filter by exporter ID if needed
      const filtered = response.data?.filter((req: any) => req.exporterId === exporterId) || [];
      setDocumentRequests(filtered);
    } catch (err: any) {
      console.error('Error fetching document requests:', err);
      setDocumentRequests([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleOpenRejection = (exportItem: Export) => {
    setSelectedExport(exportItem);
    setRejectionReason('');
    setRejectionDialog(true);
  };

  const handleApprove = async () => {
    if (!selectedExport) return;

    try {
      setProcessing(true);
      await bankingService.approveExportRequest(selectedExport.exportId, {
        lcNumber,
        importerBank,
        importerBankSwift,
        lcAmount: parseFloat(lcAmount) || 0,
        lcCurrency,
        paymentMethod,
        notes: approvalNotes,
      });

      setApprovalDialog(false);
      setSelectedExport(null);
      fetchPendingExports();
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(err.response?.data?.error || 'Failed to approve export');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedExport || !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setProcessing(true);
      await bankingService.rejectExportRequest(selectedExport.exportId, rejectionReason);

      setRejectionDialog(false);
      setSelectedExport(null);
      fetchPendingExports();
    } catch (err: any) {
      console.error('Rejection error:', err);
      setError(err.response?.data?.error || 'Failed to reject export');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    if (status.includes('APPROVED')) return 'success';
    if (status.includes('REJECTED')) return 'error';
    if (status.includes('PENDING')) return 'warning';
    return 'default';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Building size={24} /> Banking Export Approval
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review and approve/reject export requests - Permit exports to proceed to other network members
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={18} />}
          onClick={fetchPendingExports}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty State */}
      {!loading && exports.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: 16 }} />
            <Typography variant="h6" gutterBottom>
              No Pending Exports
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All export requests have been processed
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Exports Table */}
      {!loading && exports.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Export ID</TableCell>
                <TableCell>Exporter</TableCell>
                <TableCell>Coffee Type</TableCell>
                <TableCell>Quantity (kg)</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Value (USD)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exports.map((exportItem) => (
                <TableRow key={exportItem.exportId} hover>
                  <TableCell>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {exportItem.exportId.substring(0, 12)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{exportItem.exporterName || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {exportItem.exporterId.substring(0, 8)}...
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{exportItem.coffeeType}</TableCell>
                  <TableCell>{exportItem.quantity?.toLocaleString()}</TableCell>
                  <TableCell>{exportItem.destinationCountry}</TableCell>
                  <TableCell>${exportItem.estimatedValue?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={exportItem.status}
                      color={getStatusColor(exportItem.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Approve & Permit">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleOpenApproval(exportItem)}
                        >
                          <CheckCircle size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenRejection(exportItem)}
                        >
                          <XCircle size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => !processing && setApprovalDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle size={24} color="#22c55e" />
            Export Approval - Verify Contract & Arrange LC/CAD
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedExport && (
            <Box sx={{ pt: 2 }}>
              {/* Export Summary */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Export ID:</strong> {selectedExport.exportId.substring(0, 20)}...
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Exporter:</strong> {selectedExport.exporterName || 'N/A'}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Coffee:</strong> {selectedExport.coffeeType} - {selectedExport.quantity} kg
                </Typography>
                <Typography variant="body2">
                  <strong>Destination:</strong> {selectedExport.destinationCountry}
                </Typography>
              </Alert>

              {/* Tabs */}
              <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
                <Tab label="Sales Contract Verification" icon={<Shield size={18} />} iconPosition="start" />
                <Tab label="LC/CAD Details" icon={<DollarSign size={18} />} iconPosition="start" />
                <Tab label="Document Requests" icon={<FileText size={18} />} iconPosition="start" />
              </Tabs>

              {/* Tab 1: Sales Contract Verification */}
              {activeTab === 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    Verify Sales Contract by ECTA Reference Number
                  </Typography>

                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="ECTA Reference Number"
                      value={contractReference}
                      onChange={(e) => setContractReference(e.target.value)}
                      placeholder="ECTA-SC-2026-00001"
                      disabled={contractLoading}
                    />
                    <Button
                      variant="contained"
                      startIcon={contractLoading ? <CircularProgress size={16} /> : <Search />}
                      onClick={() => verifyContract(contractReference)}
                      disabled={contractLoading || !contractReference.trim()}
                      sx={{ minWidth: 120 }}
                    >
                      Verify
                    </Button>
                  </Stack>

                  {contractError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {contractError}
                    </Alert>
                  )}

                  {contractData && (
                    <Box>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                          ✓ Contract Verified - Reference: {contractData.referenceNumber}
                        </Typography>
                      </Alert>

                      <Grid container spacing={2}>
                        {/* Exporter Info */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#f0f9ff' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <User size={16} /> Exporter
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2"><strong>Name:</strong> {contractData.exporter.name}</Typography>
                            <Typography variant="body2"><strong>Registration:</strong> {contractData.exporter.registration}</Typography>
                            <Typography variant="body2"><strong>TIN:</strong> {contractData.exporter.tin}</Typography>
                          </Paper>
                        </Grid>

                        {/* Buyer Info */}
                        <Grid item xs={12} md={6}>
                          <Paper sx={{ p: 2, bgcolor: '#fef3c7' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Building size={16} /> Buyer/Importer
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2"><strong>Name:</strong> {contractData.buyer.name}</Typography>
                            <Typography variant="body2"><strong>Country:</strong> {contractData.buyer.country}</Typography>
                            <Typography variant="body2"><strong>Registration:</strong> {contractData.buyer.registration || 'N/A'}</Typography>
                          </Paper>
                        </Grid>

                        {/* Contract Details */}
                        <Grid item xs={12}>
                          <Paper sx={{ p: 2, bgcolor: '#f0fdf4' }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Package size={16} /> Contract Details
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Grid container spacing={2}>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Coffee Type</Typography>
                                <Typography variant="body2" fontWeight={600}>{contractData.contract.coffeeType}</Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Quantity</Typography>
                                <Typography variant="body2" fontWeight={600}>{contractData.contract.quantity} kg</Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Total Value</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">
                                  {contractData.contract.currency} {contractData.contract.totalValue?.toLocaleString()}
                                </Typography>
                              </Grid>
                              <Grid item xs={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                                <Chip label={contractData.contract.paymentMethod} size="small" color="primary" />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                                <Typography variant="body2">{contractData.contract.paymentTerms}</Typography>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Typography variant="caption" color="text.secondary">Incoterms</Typography>
                                <Typography variant="body2">{contractData.contract.incoterms}</Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </Box>
              )}

              {/* Tab 2: LC/CAD Details */}
              {activeTab === 1 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    LC/CAD Details (for importer bank coordination)
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Payment Method"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        helperText="Select payment method"
                      >
                        <MenuItem value="LC">Letter of Credit (LC)</MenuItem>
                        <MenuItem value="CAD">Cash Against Documents (CAD)</MenuItem>
                        <MenuItem value="TT">Telegraphic Transfer (TT)</MenuItem>
                        <MenuItem value="DP">Documents Against Payment (DP)</MenuItem>
                        <MenuItem value="DA">Documents Against Acceptance (DA)</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="LC Number (if available)"
                        value={lcNumber}
                        onChange={(e) => setLcNumber(e.target.value)}
                        placeholder="LC-2026-00001"
                        helperText="Leave empty if not yet issued"
                      />
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        label="Importer Bank Name"
                        value={importerBank}
                        onChange={(e) => setImporterBank(e.target.value)}
                        placeholder="e.g., Deutsche Bank AG"
                        helperText="Buyer's bank for LC coordination"
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="SWIFT Code"
                        value={importerBankSwift}
                        onChange={(e) => setImporterBankSwift(e.target.value)}
                        placeholder="DEUTDEFF"
                        helperText="Bank SWIFT code"
                      />
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <TextField
                        fullWidth
                        type="number"
                        label="LC Amount"
                        value={lcAmount}
                        onChange={(e) => setLcAmount(e.target.value)}
                        helperText="Total LC amount"
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        fullWidth
                        label="Currency"
                        value={lcCurrency}
                        onChange={(e) => setLcCurrency(e.target.value)}
                      >
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="GBP">GBP</MenuItem>
                        <MenuItem value="ETB">ETB</MenuItem>
                      </TextField>
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Approval Notes"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="Add any notes about the approval or LC arrangement..."
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Tab 3: Document Requests */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                    Document Requests from Exporter
                  </Typography>

                  {documentsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : documentRequests.length === 0 ? (
                    <Alert severity="info">
                      No document requests from this exporter
                    </Alert>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Document Type</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Requested At</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {documentRequests.map((req) => (
                            <TableRow key={req.requestId}>
                              <TableCell>{req.documentType}</TableCell>
                              <TableCell>
                                <Chip label={req.status} size="small" />
                              </TableCell>
                              <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                              <TableCell align="right">
                                {req.status === 'PENDING' && (
                                  <Button size="small" variant="outlined">
                                    Issue Document
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      Bank guarantees and other required documents can be issued through the Network Management → Network Approval page (Tab 2: Document Issuance).
                    </Typography>
                  </Alert>
                </Box>
              )}

              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Approving this export will PERMIT it to proceed to other network members (NBE, ECX, Customs, Shipping).
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={processing}
            startIcon={processing ? <CircularProgress size={16} /> : <CheckCircle size={18} />}
          >
            {processing ? 'Approving...' : 'Approve & Permit Export'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialog} onClose={() => !processing && setRejectionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <XCircle size={24} color="#ef4444" />
            Reject Export
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedExport && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Export ID:</strong> {selectedExport.exportId}
                </Typography>
                <Typography variant="body2">
                  <strong>Exporter:</strong> {selectedExport.exporterName || 'N/A'}
                </Typography>
              </Alert>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this export is being rejected..."
                required
                error={!rejectionReason.trim()}
                helperText="Required - This will be sent to the exporter"
              />

              <Alert severity="error" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Rejecting this export will NOT allow it to proceed to other network members. The exporter must resolve issues and resubmit.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionDialog(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={processing || !rejectionReason.trim()}
            startIcon={processing ? <CircularProgress size={16} /> : <XCircle size={18} />}
          >
            {processing ? 'Rejecting...' : 'Reject Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankingExportApproval;
