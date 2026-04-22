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
  ListItemText
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import paymentService from '../services/paymentService';

const BankPaymentReview = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openApproveDialog, setOpenApproveDialog] = useState(false);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  
  const [bankReference, setBankReference] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPendingReview();
      setPayments(response.payments || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (payment) => {
    try {
      const response = await paymentService.getPaymentDetails(payment.payment_id);
      setSelectedPayment(response.payment);
      setOpenDetailsDialog(true);
    } catch (err) {
      setError(err.message || 'Failed to load payment details');
    }
  };

  const handleApprove = async () => {
    try {
      await paymentService.approvePayment(selectedPayment.payment_id, {
        bankReference,
        notes: approvalNotes
      });
      
      setSuccess('Payment approved successfully');
      setOpenApproveDialog(false);
      setOpenDetailsDialog(false);
      setBankReference('');
      setApprovalNotes('');
      loadPendingPayments();
    } catch (err) {
      setError(err.message || 'Failed to approve payment');
    }
  };

  const handleReject = async () => {
    try {
      await paymentService.rejectPayment(selectedPayment.payment_id, rejectionReason);
      
      setSuccess('Payment rejected');
      setOpenRejectDialog(false);
      setOpenDetailsDialog(false);
      setRejectionReason('');
      loadPendingPayments();
    } catch (err) {
      setError(err.message || 'Failed to reject payment');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'DOCUMENTS_SUBMITTED': 'warning',
      'UNDER_REVIEW': 'info',
      'APPROVED': 'success',
      'FAILED': 'error'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Payment Review</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPendingPayments}
        >
          Refresh
        </Button>
      </Box>

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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Review ({payments.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Payment ID</TableCell>
                  <TableCell>Exporter</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Documents</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No payments pending review
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
                        {payment.amount?.toLocaleString()} {payment.currency}
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
                          color={payment.approved_documents === payment.documents_count ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {payment.documents_submitted_at
                          ? new Date(payment.documents_submitted_at).toLocaleDateString()
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
        </CardContent>
      </Card>

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
                  {paymentService.getPaymentMethodName(selectedPayment.payment_method)}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Amount
                </Typography>
                <Typography variant="body1">
                  {selectedPayment.amount?.toLocaleString()} {selectedPayment.currency}
                </Typography>
              </Grid>

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
                    <Typography variant="body1">{selectedPayment.lc_issuing_bank}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Advising Bank
                    </Typography>
                    <Typography variant="body1">{selectedPayment.lc_advising_bank || 'N/A'}</Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">
                      Expiry Date
                    </Typography>
                    <Typography variant="body1">
                      {selectedPayment.lc_expiry_date
                        ? new Date(selectedPayment.lc_expiry_date).toLocaleDateString()
                        : 'N/A'}
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
                    <List>
                      {selectedPayment.documents.map((doc) => (
                        <ListItem key={doc.document_id}>
                          <ListItemText
                            primary={doc.document_name}
                            secondary={`Type: ${doc.document_type} | Status: ${doc.review_status || 'PENDING'}`}
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
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={openApproveDialog} onClose={() => setOpenApproveDialog(false)}>
        <DialogTitle>Approve Payment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Bank Reference"
            value={bankReference}
            onChange={(e) => setBankReference(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Approval Notes"
            multiline
            rows={3}
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenApproveDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={!bankReference}
          >
            Approve Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)}>
        <DialogTitle>Reject Payment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Rejection Reason"
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectionReason}
          >
            Reject Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BankPaymentReview;
