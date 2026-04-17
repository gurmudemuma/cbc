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
  FileText,
  Building2,
  RefreshCw,
} from 'lucide-react';
import networkService from '../services/network.service';
import NetworkStatusTracker from '../components/NetworkStatusTracker';
import NetworkMemberDocumentIssuance from '../components/NetworkMemberDocumentIssuance';
import { ModernStatCard } from '../components/ModernUIKit';

interface Agency {
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface AgencyApprovalDashboardProps {
  user: any;
  org: any;
}

const AgencyApprovalDashboard = (): JSX.Element => {
  // Agency state management
  const [userAgencies, setUserAgencies] = useState<Agency[]>([]);
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencyError, setAgencyError] = useState<string | null>(null);
  
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [approvedSubmissions, setApprovedSubmissions] = useState<any[]>([]);
  const [agencyStatistics, setAgencyStatistics] = useState<any>(null);
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

  // Sales contract verification
  const [salesContractRef, setSalesContractRef] = useState('');
  const [contractData, setContractData] = useState<any>(null);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [contractVerified, setContractVerified] = useState(false);

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

  // Fetch user's assigned agencies
  const fetchUserAgencies = async () => {
    setLoadingAgencies(true);
    setAgencyError(null);

    try {
      const response = await networkService.getMyAgencies();

      if (response.success && response.data) {
        setUserAgencies(response.data);

        // Auto-select agency if user has exactly one
        if (response.data.length === 1) {
          setSelectedAgency(response.data[0].code);
        } else if (response.data.length > 1) {
          // Select first agency by default for multi-agency users
          setSelectedAgency(response.data[0].code);
        }
      } else {
        setAgencyError('Failed to load your agencies');
      }
    } catch (error) {
      console.error('Failed to fetch user agencies:', error);
      setAgencyError('Failed to load your agencies. Please refresh the page.');
    } finally {
      setLoadingAgencies(false);
    }
  };

  // Fetch user agencies on component mount
  useEffect(() => {
    fetchUserAgencies();
  }, []); // Run once on mount

  useEffect(() => {
    // Only load data if an agency is selected
    if (selectedAgency) {
      loadPendingApprovals();
      loadApprovedSubmissions();
      loadAgencyStatistics();
    }
  }, [selectedAgency]);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await networkService.getPendingApprovalsForAgency(selectedAgency);
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

  const loadApprovedSubmissions = async () => {
    try {
      // Get all submissions and filter for approved ones where this agency approved
      const response = await networkService.getSubmissions();
      if (response.success) {
        const allSubmissions = response.data || [];
        // Filter for approved submissions
        const approved = allSubmissions.filter((s: any) => s.status === 'APPROVED' || s.status === 'EXPORT_APPROVED');
        setApprovedSubmissions(approved);
      }
    } catch (error) {
      console.error('Failed to load approved submissions:', error);
    }
  };

  const loadStatistics = async () => {
    // Removed - using agency-specific statistics only
  };

  const loadAgencyStatistics = async () => {
    try {
      const response = await networkService.getAgencyStatistics(selectedAgency);
      if (response.success) {
        setAgencyStatistics(response.data);
      }
    } catch (error) {
      console.error('Failed to load agency statistics:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPendingApprovals(), loadApprovedSubmissions(), loadAgencyStatistics()]);
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
    setSalesContractRef(submission.salesContractReference || '');
    setContractData(null);
    setContractError(null);
    setContractVerified(false);
    setApprovalDialog(true);

    // Auto-verify contract if reference exists
    if (submission.salesContractReference) {
      verifySalesContract(submission.salesContractReference);
    }
  };

  const verifySalesContract = async (reference: string) => {
    if (!reference.trim()) {
      setContractError('Sales contract reference is required');
      return;
    }

    try {
      setContractLoading(true);
      setContractError(null);
      const response = await networkService.verifySalesContract(reference.trim());

      if (response.success && response.data) {
        setContractData(response.data);
        setContractVerified(true);
        setContractError(null);
      } else {
        setContractError(response.error || 'Sales contract not found or invalid');
        setContractVerified(false);
      }
    } catch (error: any) {
      console.error('Contract verification error:', error);
      setContractError(error.response?.data?.error || 'Failed to verify sales contract');
      setContractVerified(false);
    } finally {
      setContractLoading(false);
    }
  };

  const handleViewDetails = async (submission: any) => {
    try {
      const response = await networkService.getSubmissionById(submission.submission_id || submission.submissionId);
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

    // Require sales contract verification for ALL network members before approval
    if (approvalData.status === 'APPROVED') {
      if (!salesContractRef) {
        showNotification('Sales contract reference is required for approval', 'error');
        return;
      }
      if (!contractVerified) {
        showNotification('Please verify the sales contract before approving', 'error');
        return;
      }
      if (contractError) {
        showNotification('Cannot approve: Sales contract verification failed', 'error');
        return;
      }
    }

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
        salesContractReference: salesContractRef || undefined,
        contractVerified: contractVerified,
      };

      const response = await networkService.processAgencyApproval(payload);

      if (response.success) {
        showNotification(
          `Submission ${approvalData.status.toLowerCase()} successfully`,
          'success'
        );
        setApprovalDialog(false);
        setSelectedSubmission(null);
        loadPendingApprovals();
        loadAgencyStatistics();
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
      {/* Loading state while fetching agencies */}
      {loadingAgencies && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading your agencies...</Typography>
        </Box>
      )}

      {/* Error state - no agencies assigned */}
      {!loadingAgencies && userAgencies.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {agencyError || 'You are not assigned to any agencies. Please contact your administrator.'}
          </Alert>
        </Box>
      )}

      {/* Error state - API failure */}
      {!loadingAgencies && agencyError && userAgencies.length === 0 && (
        <Box sx={{ p: 3 }}>
          <Alert severity="error">
            {agencyError}
          </Alert>
        </Box>
      )}

      {/* Main dashboard content - only show if agencies loaded successfully */}
      {!loadingAgencies && userAgencies.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Building2 size={32} /> Network Approval
              </Typography>
              {selectedAgency && (
                <Typography variant="subtitle1" color="textSecondary" sx={{ mt: 1 }}>
                  {userAgencies.find(a => a.code === selectedAgency)?.name || selectedAgency}
                </Typography>
              )}
            </Box>
            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
          </Box>

      {/* Agency Selection - Only show for multi-agency users */}
      {userAgencies.length > 1 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>Select Agency</InputLabel>
              <Select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                label="Select Agency"
              >
                {userAgencies.map((agency) => (
                  <MenuItem key={agency.code} value={agency.code}>
                    {agency.name} ({agency.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards - Agency Specific */}
      {agencyStatistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <ModernStatCard
              title="Total Approvals"
              value={agencyStatistics.totalApprovals || 0}
              subtitle={`for ${userAgencies.find((a) => a.code === selectedAgency)?.name}`}
              icon={<FileText />}
              color="primary"
              onClick={() => setTabValue(1)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <ModernStatCard
              title="Pending Review"
              value={agencyStatistics.pending || 0}
              subtitle="Awaiting your approval"
              icon={<Clock />}
              color="warning"
              onClick={() => setTabValue(0)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <ModernStatCard
              title="Approved"
              value={agencyStatistics.approved || 0}
              subtitle="Successfully approved"
              icon={<CheckCircle />}
              color="success"
              onClick={() => setTabValue(1)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <ModernStatCard
              title="Rejected"
              value={agencyStatistics.rejected || 0}
              subtitle="Rejected submissions"
              icon={<XCircle />}
              color="error"
              onClick={() => setTabValue(1)}
            />
          </Grid>
        </Grid>
      )}

      {/* Pending Approvals Table */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label={`Pending Approvals (${pendingApprovals.length})`} />
              <Tab label={`Approved Submissions (${approvedSubmissions.length})`} />
              <Tab label="Document Issuance" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <>
              <Typography variant="h6" gutterBottom>
                Pending Approvals for {userAgencies.find((a) => a.code === selectedAgency)?.name}
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
                        <TableCell>Submission Reference</TableCell>
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
                          <TableCell>{approval.networkReferenceNumber}</TableCell>
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
            </>
          )}

          {tabValue === 1 && (
            <>
              <Typography variant="h6" gutterBottom>
                Approved Submissions
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : approvedSubmissions.length === 0 ? (
                <Alert severity="info">No approved submissions yet</Alert>
              ) : (
                <TableContainer component={Paper} sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Submission Reference</TableCell>
                        <TableCell>Export ID</TableCell>
                        <TableCell>Exporter</TableCell>
                        <TableCell>Submitted Date</TableCell>
                        <TableCell>Approved Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {approvedSubmissions.map((submission) => (
                        <TableRow key={submission.submissionId}>
                          <TableCell>{submission.networkReferenceNumber}</TableCell>
                          <TableCell>{submission.exportId}</TableCell>
                          <TableCell>{submission.exporterName || 'N/A'}</TableCell>
                          <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                          <TableCell>{formatDate(submission.approvedAt)}</TableCell>
                          <TableCell>
                            <Chip
                              label="APPROVED"
                              color="success"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details & Certificates">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => handleViewDetails(submission)}
                              >
                                <Eye size={18} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {tabValue === 2 && (
            <Box sx={{ mt: 2 }}>
              <NetworkMemberDocumentIssuance />
            </Box>
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
                Network Reference: {selectedSubmission.networkReferenceNumber}
                <br />
                Export ID: {selectedSubmission.exportId}
              </Alert>

              {/* Sales Contract Verification - Required for ALL Network Members */}
              <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Sales Contract Verification (Required for All Approvals)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sales Contract Reference"
                    value={salesContractRef}
                    onChange={(e) => setSalesContractRef(e.target.value)}
                    placeholder="Enter ECTA contract reference"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => verifySalesContract(salesContractRef)}
                    disabled={contractLoading || !salesContractRef}
                  >
                    {contractLoading ? <CircularProgress size={20} /> : 'Verify'}
                  </Button>
                </Box>

                {contractLoading && (
                  <Alert severity="info">Verifying sales contract...</Alert>
                )}

                {contractError && (
                  <Alert severity="error">{contractError}</Alert>
                )}

                {contractVerified && contractData && (
                  <Alert severity="success">
                    ✓ Sales contract verified successfully
                    <Box sx={{ mt: 2, fontSize: '0.875rem' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" fontWeight="bold">Contract Information</Typography>
                          <strong>Reference:</strong> {contractData.referenceNumber}<br />
                          <strong>Status:</strong> {contractData.status}<br />
                          <strong>Registered:</strong> {new Date(contractData.registeredAt).toLocaleDateString()}
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Exporter</Typography>
                          <strong>Name:</strong> {contractData.exporter?.name}<br />
                          <strong>TIN:</strong> {contractData.exporter?.tin}<br />
                          <strong>Email:</strong> {contractData.exporter?.email}<br />
                          <strong>Phone:</strong> {contractData.exporter?.phone}
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Buyer/Importer</Typography>
                          <strong>Name:</strong> {contractData.buyer?.name}<br />
                          <strong>Country:</strong> {contractData.buyer?.country}<br />
                          <strong>Email:</strong> {contractData.buyer?.email}<br />
                          <strong>Phone:</strong> {contractData.buyer?.phone}
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Coffee Details</Typography>
                          <strong>Type:</strong> {contractData.coffee?.type}<br />
                          {contractData.coffee?.grade && <><strong>Grade:</strong> {contractData.coffee.grade}<br /></>}
                          <strong>Quantity:</strong> {contractData.coffee?.quantity}<br />
                          <strong>Price/Unit:</strong> {contractData.contract?.currency} {contractData.coffee?.pricePerUnit}<br />
                          {contractData.coffee?.qualityStandard && <><strong>Quality:</strong> {contractData.coffee.qualityStandard}<br /></>}
                          {contractData.coffee?.originRegion && <><strong>Origin:</strong> {contractData.coffee.originRegion}</>}
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Payment Information</Typography>
                          <strong>Method:</strong> {contractData.payment?.method || 'Not specified'}<br />
                          <strong>Terms:</strong> {contractData.payment?.terms || 'Not specified'}<br />
                          {contractData.payment?.dueDays && <><strong>Due Days:</strong> {contractData.payment.dueDays}<br /></>}
                          <strong>Currency:</strong> {contractData.contract?.currency}<br />
                          <strong>Total Value:</strong> {contractData.contract?.currency} {contractData.contract?.totalValue?.toLocaleString()}
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Shipping & Delivery</Typography>
                          <strong>Incoterms:</strong> {contractData.contract?.incoterms}<br />
                          <strong>Loading Port:</strong> {contractData.contract?.portOfLoading}<br />
                          <strong>Discharge Port:</strong> {contractData.contract?.portOfDischarge}<br />
                          <strong>Delivery:</strong> {contractData.contract?.deliveryDeadline ? new Date(contractData.contract.deliveryDeadline).toLocaleDateString() : 'Not specified'}
                        </Grid>
                      </Grid>
                    </Box>
                  </Alert>
                )}
              </Box>

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
            disabled={submitting || (approvalData.status === 'APPROVED' && !contractVerified)}
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
          {viewingSubmission && <NetworkStatusTracker submission={viewingSubmission} />}
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
        </>
      )}
    </Box>
  );
};

export default AgencyApprovalDashboard;
