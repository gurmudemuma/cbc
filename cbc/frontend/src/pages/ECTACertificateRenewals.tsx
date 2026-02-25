/**
 * ECTA Certificate Renewals Dashboard
 * Manages all certificate renewal requests across all types
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
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
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  Warning,
} from '@mui/icons-material';
import * as ectaService from '../services/ecta.service';
import { CommonPageProps } from '../types';

interface RenewalRequest {
  request_id: string;
  exporter_id: string;
  certificate_type: string;
  certificate_id: string;
  entity_name: string;
  current_certificate_number: string;
  current_expiry_date: string;
  requested_expiry_date: string;
  new_certificate_number?: string;
  renewal_reason?: string;
  status: string;
  requested_by: string;
  requested_at: string;
  exporter_name: string;
  exporter_email: string;
}

const CERTIFICATE_TYPE_LABELS: Record<string, string> = {
  TASTER_PROFICIENCY: 'Taster Proficiency',
  LABORATORY_CERTIFICATION: 'Laboratory Certification',
  COMPETENCE_CERTIFICATE: 'Competence Certificate',
  EXPORT_LICENSE: 'Export License',
};

interface ECTACertificateRenewalsProps extends CommonPageProps {}

const ECTACertificateRenewals = ({ user, org }: ECTACertificateRenewalsProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<RenewalRequest[]>([]);
  const [historyRequests, setHistoryRequests] = useState<RenewalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RenewalRequest | null>(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [rejectionDialog, setRejectionDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [approvalForm, setApprovalForm] = useState({
    finalCertificateNumber: '',
    finalIssueDate: new Date().toISOString().split('T')[0],
    finalExpiryDate: '',
    approvalNotes: '',
  });

  const [rejectionForm, setRejectionForm] = useState({
    rejectionReason: '',
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (activeTab === 0) {
        // Load pending requests
        const response = await ectaService.getPendingRenewals();
        setPendingRequests(response.data || []);
      } else {
        // Load history
        const response = await ectaService.getRenewalHistory({ limit: 100 });
        setHistoryRequests(response.data || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load renewal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request: RenewalRequest) => {
    setSelectedRequest(request);
    setApprovalForm({
      finalCertificateNumber: request.new_certificate_number || request.current_certificate_number,
      finalIssueDate: new Date().toISOString().split('T')[0],
      finalExpiryDate: request.requested_expiry_date,
      approvalNotes: '',
    });
    setApprovalDialog(true);
  };

  const handleReject = (request: RenewalRequest) => {
    setSelectedRequest(request);
    setRejectionForm({ rejectionReason: '' });
    setRejectionDialog(true);
  };

  const submitApproval = async () => {
    if (!selectedRequest) return;

    setLoading(true);
    setError(null);

    try {
      await ectaService.approveRenewal(selectedRequest.request_id, approvalForm);

      setSuccess('Renewal request approved successfully');
      setApprovalDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve renewal');
    } finally {
      setLoading(false);
    }
  };

  const submitRejection = async () => {
    if (!selectedRequest || !rejectionForm.rejectionReason) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await ectaService.rejectRenewal(selectedRequest.request_id, rejectionForm);

      setSuccess('Renewal request rejected');
      setRejectionDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject renewal');
    } finally {
      setLoading(false);
    }
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusChip = (status: string) => {
    const statusConfig: Record<string, { color: any; icon: any }> = {
      PENDING: { color: 'warning', icon: <Warning /> },
      APPROVED: { color: 'success', icon: <CheckCircle /> },
      REJECTED: { color: 'error', icon: <Cancel /> },
      CANCELLED: { color: 'default', icon: <Cancel /> },
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    return <Chip icon={config.icon} label={status} color={config.color} size="small" />;
  };

  const renderPendingRequests = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Certificate Type</TableCell>
            <TableCell>Entity Name</TableCell>
            <TableCell>Exporter</TableCell>
            <TableCell>Current Number</TableCell>
            <TableCell>Current Expiry</TableCell>
            <TableCell>Requested Expiry</TableCell>
            <TableCell>Requested Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pendingRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body2" color="text.secondary">
                  No pending renewal requests
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            pendingRequests.map((request) => {
              const daysUntilExpiry = calculateDaysUntilExpiry(request.current_expiry_date);
              const isExpired = daysUntilExpiry < 0;

              return (
                <TableRow key={request.request_id}>
                  <TableCell>
                    <Typography variant="body2">
                      {CERTIFICATE_TYPE_LABELS[request.certificate_type]}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {request.entity_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.exporter_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {request.exporter_email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{request.current_certificate_number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {new Date(request.current_expiry_date).toLocaleDateString()}
                      </Typography>
                      {isExpired && (
                        <Chip
                          icon={<Warning />}
                          label={`Expired ${Math.abs(daysUntilExpiry)}d ago`}
                          color="error"
                          size="small"
                        />
                      )}
                      {!isExpired && daysUntilExpiry <= 30 && (
                        <Chip
                          icon={<Warning />}
                          label={`${daysUntilExpiry}d left`}
                          color="warning"
                          size="small"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(request.requested_expiry_date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" gap={1} justifyContent="flex-end">
                      <Tooltip title="Approve">
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(request)}
                        >
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleReject(request)}
                        >
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderHistory = () => (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Certificate Type</TableCell>
            <TableCell>Entity Name</TableCell>
            <TableCell>Exporter</TableCell>
            <TableCell>Certificate Number</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Requested Date</TableCell>
            <TableCell>Processed Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {historyRequests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center">
                <Typography variant="body2" color="text.secondary">
                  No renewal history
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            historyRequests.map((request) => (
              <TableRow key={request.request_id}>
                <TableCell>
                  <Typography variant="body2">
                    {CERTIFICATE_TYPE_LABELS[request.certificate_type]}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {request.entity_name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{request.exporter_name}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{request.current_certificate_number}</Typography>
                </TableCell>
                <TableCell>{getStatusChip(request.status)}</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(request.requested_at).toLocaleDateString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {request.status === 'APPROVED' && (request as any).approved_at
                      ? new Date((request as any).approved_at).toLocaleDateString()
                      : request.status === 'REJECTED' && (request as any).rejected_at
                      ? new Date((request as any).rejected_at).toLocaleDateString()
                      : '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Certificate Renewals</Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
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

        <Paper>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
            <Tab label={`Pending (${pendingRequests.length})`} />
            <Tab label="History" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : activeTab === 0 ? (
              renderPendingRequests()
            ) : (
              renderHistory()
            )}
          </Box>
        </Paper>

        {/* Approval Dialog */}
        <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve Renewal Request</DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{CERTIFICATE_TYPE_LABELS[selectedRequest.certificate_type]}</strong>
                    <br />
                    Entity: {selectedRequest.entity_name}
                    <br />
                    Exporter: {selectedRequest.exporter_name}
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Final Certificate Number"
                      value={approvalForm.finalCertificateNumber}
                      onChange={(e) =>
                        setApprovalForm({ ...approvalForm, finalCertificateNumber: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Issue Date"
                      value={approvalForm.finalIssueDate}
                      onChange={(e) =>
                        setApprovalForm({ ...approvalForm, finalIssueDate: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Expiry Date"
                      value={approvalForm.finalExpiryDate}
                      onChange={(e) =>
                        setApprovalForm({ ...approvalForm, finalExpiryDate: e.target.value })
                      }
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Approval Notes (Optional)"
                      value={approvalForm.approvalNotes}
                      onChange={(e) =>
                        setApprovalForm({ ...approvalForm, approvalNotes: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApprovalDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={submitApproval}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              Approve
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog open={rejectionDialog} onClose={() => setRejectionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject Renewal Request</DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{CERTIFICATE_TYPE_LABELS[selectedRequest.certificate_type]}</strong>
                    <br />
                    Entity: {selectedRequest.entity_name}
                    <br />
                    Exporter: {selectedRequest.exporter_name}
                  </Typography>
                </Alert>

                <TextField
                  fullWidth
                  required
                  multiline
                  rows={4}
                  label="Rejection Reason"
                  value={rejectionForm.rejectionReason}
                  onChange={(e) =>
                    setRejectionForm({ ...rejectionForm, rejectionReason: e.target.value })
                  }
                  placeholder="Please provide a clear reason for rejection..."
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectionDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={submitRejection}
              disabled={loading || !rejectionForm.rejectionReason}
              startIcon={loading ? <CircularProgress size={20} /> : <Cancel />}
            >
              Reject
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  
  );
};

export default ECTACertificateRenewals;
