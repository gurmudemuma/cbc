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
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import paymentService from '../services/paymentService';

interface NBEFXApprovalProps {
  user: any;
  org: string | null;
}

const NBEFXApproval: React.FC<NBEFXApprovalProps> = ({ user, org }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);

  // Form states
  const [exchangeRate, setExchangeRate] = useState('');
  const [nbeReference, setNbeReference] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingPayments();
    loadStatistics();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPendingFXApprovals();
      setPayments(response.payments || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load pending FX approvals');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await paymentService.getFXStatistics();
      setStatistics(response.statistics);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleViewDetails = async (payment: any) => {
    try {
      const response = await paymentService.getNBEPaymentDetails(payment.payment_id);
      setSelectedPayment(response.payment);
      setOpenDetailsDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment details');
    }
  };

  const handleApproveFX = async () => {
    try {
      if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
        setError('Please enter a valid exchange rate');
        return;
      }

      await paymentService.approveFX(selectedPayment.payment_id, {
        exchangeRate: parseFloat(exchangeRate),
        nbeReference: nbeReference || undefined,
        notes: approvalNotes || undefined
      });

      setSuccess('Foreign exchange approved successfully');
      setOpenApproveDialog(false);
      setOpenDetailsDialog(false);
      resetApprovalForm();
      loadPendingPayments();
      loadStatistics();
    } catch (err: any) {
      setError(err.message || 'Failed to approve FX');
    }
  };

  const handleRejectFX = async () => {
    try {
      if (!rejectionReason.trim()) {
        setError('Please provide a rejection reason');
        return;
      }

      await paymentService.rejectFX(selectedPayment.payment_id, rejectionReason);

      setSuccess('Foreign exchange request rejected');
      setOpenRejectDialog(false);
      setOpenDetailsDialog(false);
      setRejectionReason('');
      loadPendingPayments();
      loadStatistics();
    } catch (err: any) {
      setError(err.message || 'Failed to reject FX');
    }
  };

  const resetApprovalForm = () => {
    setExchangeRate('');
    setNbeReference('');
    setApprovalNotes('');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, any> = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'error',
      'UNDER_REVIEW': 'info'
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const calculateETBAmount = (amount: number, rate: number) => {
    return (amount * rate).toFixed(2);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4">Foreign Exchange Approval</Typography>
          <Typography variant="body2" color="textSecondary">
            National Bank of Ethiopia - FX Management
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPendingPayments}
        >
          Refresh
        </Button>
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
                      Pending Approvals
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {statistics.pending_approvals || 0}
                    </Typography>
                  </Box>
                  <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />
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
                      Approved Today
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {statistics.approved_today || 0}
                    </Typography>
                  </Box>
                  <ApproveIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                      Total FX Approved
                    </Typography>
                    <Typography variant="h4">
                      {formatCurrency(statistics.total_fx_approved || 0)}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: 'success.main' }} />
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
                      Avg. Exchange Rate
                    </Typography>
                    <Typography variant="h4">
                      {statistics.avg_exchange_rate
                        ? statistics.avg_exchange_rate.toFixed(2)
                        : 'N/A'}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Payments Table */}
      <Card>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Pending Approval" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>

        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending FX Approvals ({payments.length})
          </Typography>

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
                    <TableCell>Exporter</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Amount (USD)</TableCell>
                    <TableCell>Proposed Rate</TableCell>
                    <TableCell>ETB Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center">
                        No pending FX approvals
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
                        <TableCell>{payment.exporter_name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={payment.payment_method} size="small" />
                        </TableCell>
                        <TableCell>
                          {formatCurrency(payment.amount, payment.currency)}
                        </TableCell>
                        <TableCell>
                          {payment.exchange_rate
                            ? payment.exchange_rate.toFixed(2)
                            : 'Not Set'}
                        </TableCell>
                        <TableCell>
                          {payment.amount_etb
                            ? formatCurrency(payment.amount_etb, 'ETB')
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.nbe_approval_status || 'PENDING'}
                            color={getStatusColor(payment.nbe_approval_status || 'PENDING')}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {payment.created_at
                            ? new Date(payment.created_at).toLocaleDateString()
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

      {/* Payment Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>FX Approval Details</DialogTitle>
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
                  NBE Status
                </Typography>
                <Chip
                  label={selectedPayment.nbe_approval_status || 'PENDING'}
                  color={getStatusColor(selectedPayment.nbe_approval_status || 'PENDING')}
                  size="small"
                />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Exporter
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.exporter_name || 'N/A'}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Payment Method
                </Typography>
                <Typography variant="body1">
                  {paymentService.getPaymentMethodName(selectedPayment.payment_method)}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Foreign Exchange Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Amount (Foreign Currency)
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Current Exchange Rate
                </Typography>
                <Typography variant="h6">
                  {selectedPayment.exchange_rate
                    ? `${selectedPayment.exchange_rate.toFixed(4)} ETB/${selectedPayment.currency}`
                    : 'Not Set'}
                </Typography>
              </Grid>

              {selectedPayment.exchange_rate && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Estimated ETB Amount
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {formatCurrency(
                      selectedPayment.amount * selectedPayment.exchange_rate,
                      'ETB'
                    )}
                  </Typography>
                </Grid>
              )}

              {selectedPayment.export_details && (
                <>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      Export Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Coffee Type
                    </Typography>
                    <Typography variant="body1">
                      {selectedPayment.export_details.coffee_type || 'N/A'}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Destination
                    </Typography>
                    <Typography variant="body1">
                      {selectedPayment.export_details.destination_country || 'N/A'}
                    </Typography>
                  </Grid>
                </>
              )}

              {selectedPayment.notes && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">{selectedPayment.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<RejectIcon />}
            onClick={() => {
              setOpenRejectDialog(true);
              setOpenDetailsDialog(false);
            }}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<ApproveIcon />}
            onClick={() => {
              setOpenApproveDialog(true);
              setOpenDetailsDialog(false);
            }}
          >
            Approve FX
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve FX Dialog */}
      <Dialog
        open={openApproveDialog}
        onClose={() => setOpenApproveDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Approve Foreign Exchange</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="info">
                Set the official exchange rate for this transaction. The rate will be used to
                calculate the ETB equivalent amount.
              </Alert>
            </Grid>

            {selectedPayment && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Payment Amount
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="number"
                    label={`Exchange Rate (ETB/${selectedPayment.currency})`}
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    required
                    inputProps={{ min: 0, step: 0.0001 }}
                    helperText="Enter the official NBE exchange rate"
                  />
                </Grid>

                {exchangeRate && parseFloat(exchangeRate) > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="textSecondary">
                        ETB Equivalent
                      </Typography>
                      <Typography variant="h5" color="success.dark">
                        {formatCurrency(
                          parseFloat(calculateETBAmount(selectedPayment.amount, parseFloat(exchangeRate))),
                          'ETB'
                        )}
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </>
            )}

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="NBE Reference Number"
                value={nbeReference}
                onChange={(e) => setNbeReference(e.target.value)}
                placeholder="e.g., NBE-FX-2024-001"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Approval Notes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Additional notes or conditions"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveFX}
            disabled={!exchangeRate || parseFloat(exchangeRate) <= 0}
          >
            Approve FX
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject FX Dialog */}
      <Dialog
        open={openRejectDialog}
        onClose={() => setOpenRejectDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Foreign Exchange Request</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity="warning">
                Please provide a clear reason for rejecting this FX request. The exporter will
                be notified of the rejection.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                placeholder="Explain why this FX request is being rejected"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectFX}
            disabled={!rejectionReason.trim()}
          >
            Reject FX Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NBEFXApproval;
