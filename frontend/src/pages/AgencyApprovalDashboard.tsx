import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertCircle,
  FileText,
  Building2,
  RefreshCw,
} from 'lucide-react';
import eswService from '../services/esw.service';
import ESWStatusTracker from '../components/ESWStatusTracker';

interface AgencyApprovalDashboardProps {
  user: any;
  org: any;
}

const AGENCIES = [
  { code: 'MOT', name: 'Ministry of Trade' },
  { code: 'ERCA', name: 'Ethiopian Revenues and Customs Authority' },
  { code: 'NBE', name: 'National Bank of Ethiopia' },
  { code: 'MOA', name: 'Ministry of Agriculture' },
  { code: 'MOH', name: 'Ministry of Health' },
  { code: 'EIC', name: 'Ethiopian Investment Commission' },
  { code: 'ESLSE', name: 'Ethiopian Shipping & Logistics Services' },
  { code: 'EPA', name: 'Environmental Protection Authority' },
  { code: 'ECTA', name: 'Ethiopian Coffee and Tea Authority' },
  { code: 'ECX', name: 'Ethiopian Commodity Exchange' },
  { code: 'MOFED', name: 'Ministry of Finance' },
  { code: 'MOTI', name: 'Ministry of Transport' },
  { code: 'MIDROC', name: 'Ministry of Industry' },
  { code: 'QSAE', name: 'Quality and Standards Authority' },
  { code: 'FDRE_CUSTOMS', name: 'Federal Customs' },
  { code: 'TRADE_REMEDY', name: 'Trade Remedy Directorate' },
];

const AgencyApprovalDashboard = ({ user, org }: AgencyApprovalDashboardProps): JSX.Element => {
  const [selectedAgency, setSelectedAgency] = useState('MOT');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  // Approval dialog
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [approvalData, setApprovalData] = useState({
    status: 'APPROVED',
    notes: '',
    rejectionReason: '',
    additionalInfoRequest: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Detail view dialog
  const [detailDialog, setDetailDialog] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<any>(null);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadPendingApprovals();
    loadStatistics();
  }, [selectedAgency]);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await eswService.getPendingApprovalsForAgency(selectedAgency);
      if (response.success) {
        setPendingApprovals(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      showNotification('Failed to load pending approvals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await eswService.getStatistics();
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPendingApprovals(), loadStatistics()]);
    setRefreshing(false);
    showNotification('Data refreshed', 'success');
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenApprovalDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setApprovalData({
      status: 'APPROVED',
      notes: '',
      rejectionReason: '',
      additionalInfoRequest: '',
    });
    setApprovalDialog(true);
  };

  const handleViewDetails = async (submission: any) => {
    try {
      const response = await eswService.getSubmissionById(submission.submissionId);
      if (response.success) {
        setViewingSubmission(response.data);
        setDetailDialog(true);
      }
    } catch (error) {
      console.error('Failed to load submission details:', error);
      showNotification('Failed to load submission details', 'error');
    }
  };

  const handleProcessApproval = async () => {
    if (!selectedSubmission) return;

    setSubmitting(true);
    try {
      const payload = {
        submissionId: selectedSubmission.submissionId,
        agencyCode: selectedAgency,
        status: approvalData.status,
        notes: approvalData.notes,
        rejectionReason: approvalData.status === 'REJECTED' ? approvalData.rejectionReason : undefined,
        additionalInfoRequest:
          approvalData.status === 'INFO_REQUIRED' ? approvalData.additionalInfoRequest : undefined,
      };

      const response = await eswService.processAgencyApproval(payload);

      if (response.success) {
        showNotification(
          `Submission ${approvalData.status.toLowerCase()} successfully`,
          'success'
        );
        setApprovalDialog(false);
        setSelectedSubmission(null);
        loadPendingApprovals();
        loadStatistics();
      }
    } catch (error: any) {
      console.error('Approval processing error:', error);
      showNotification(
        `Failed to process approval: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
      case 'UNDER_REVIEW':
        return 'warning';
      case 'INFO_REQUIRED':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Building2 size={32} /> Agency Approval Dashboard
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Agency Selection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Select Agency</InputLabel>
            <Select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              label="Select Agency"
            >
              {AGENCIES.map((agency) => (
                <MenuItem key={agency.code} value={agency.code}>
                  {agency.name} ({agency.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">{statistics.totalSubmissions || 0}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Total Submissions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {statistics.pending || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Pending Review
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {statistics.approved || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Approved
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {statistics.rejected || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Rejected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Pending Approvals Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Pending Approvals for {AGENCIES.find((a) => a.code === selectedAgency)?.name}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : pendingApprovals.length === 0 ? (
            <Alert severity="info">No pending approvals for this agency</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ESW Reference</TableCell>
                    <TableCell>Export ID</TableCell>
                    <TableCell>Exporter</TableCell>
                    <TableCell>Submitted Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingApprovals.map((approval) => (
                    <TableRow key={approval.submissionId}>
                      <TableCell>{approval.eswReferenceNumber}</TableCell>
                      <TableCell>{approval.exportId}</TableCell>
                      <TableCell>{approval.exporterName || 'N/A'}</TableCell>
                      <TableCell>{formatDate(approval.submittedAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={approval.status?.replace(/_/g, ' ')}
                          color={getStatusColor(approval.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetails(approval)}>
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenApprovalDialog(approval)}
                          >
                            Review
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Process Approval</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                ESW Reference: {selectedSubmission.eswReferenceNumber}
                <br />
                Export ID: {selectedSubmission.exportId}
              </Alert>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Decision</InputLabel>
                <Select
                  value={approvalData.status}
                  onChange={(e) => setApprovalData({ ...approvalData, status: e.target.value })}
                  label="Decision"
                >
                  <MenuItem value="APPROVED">Approve</MenuItem>
                  <MenuItem value="REJECTED">Reject</MenuItem>
                  <MenuItem value="INFO_REQUIRED">Request Additional Information</MenuItem>
                </Select>
              </FormControl>

              {approvalData.status === 'REJECTED' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Rejection Reason"
                  value={approvalData.rejectionReason}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, rejectionReason: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  required
                />
              )}

              {approvalData.status === 'INFO_REQUIRED' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Information Request"
                  value={approvalData.additionalInfoRequest}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, additionalInfoRequest: e.target.value })
                  }
                  sx={{ mb: 2 }}
                  required
                />
              )}

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={approvalData.notes}
                onChange={(e) => setApprovalData({ ...approvalData, notes: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            onClick={handleProcessApproval}
            variant="contained"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? 'Processing...' : 'Submit Decision'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail View Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Submission Details</DialogTitle>
        <DialogContent>
          {viewingSubmission && <ESWStatusTracker submission={viewingSubmission} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AgencyApprovalDashboard;
