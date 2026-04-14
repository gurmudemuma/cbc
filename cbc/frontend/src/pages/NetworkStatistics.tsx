import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
  PieChart,
} from 'lucide-react';
import networkService from '../services/network.service';

interface NetworkStatisticsProps {
  user: any;
  org: any;
}

const NetworkStatistics = ({ user, org }: NetworkStatisticsProps): JSX.Element => {
  const [statistics, setStatistics] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [userAgencies, setUserAgencies] = useState<any[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [loadingAgencies, setLoadingAgencies] = useState(true);

  // Get organization-specific colors for stat cards
  const getOrgColors = () => {
    const orgLower = org?.toLowerCase() || '';
    
    // Commercial Bank - Black, Purple, Golden, White
    if (orgLower === 'commercial-bank' || orgLower === 'commercialbank') {
      return {
        total: { bg: '#000000', text: '#FFFFFF' },      // Black with white text
        pending: { bg: '#9C27B0', text: '#FFFFFF' },    // Purple
        approved: { bg: '#FFD700', text: '#000000' },   // Golden with black text
        rejected: { bg: '#FFFFFF', text: '#000000', border: '2px solid #000000' }, // White with black text and border
      };
    }
    
    // ECTA - Purple/Indigo theme
    if (orgLower === 'ecta') {
      return {
        total: { bg: '#5E35B1', text: '#FFFFFF' },      // Deep Purple
        pending: { bg: '#7E57C2', text: '#FFFFFF' },    // Medium Purple
        approved: { bg: '#4CAF50', text: '#FFFFFF' },   // Green
        rejected: { bg: '#F44336', text: '#FFFFFF' },   // Red
      };
    }
    
    // ECX - Orange/Amber theme
    if (orgLower === 'ecx') {
      return {
        total: { bg: '#FF6F00', text: '#FFFFFF' },      // Deep Orange
        pending: { bg: '#FFA726', text: '#000000' },    // Orange
        approved: { bg: '#66BB6A', text: '#FFFFFF' },   // Green
        rejected: { bg: '#EF5350', text: '#FFFFFF' },   // Red
      };
    }
    
    // Shipping Line - Blue/Cyan theme
    if (orgLower === 'shipping' || orgLower === 'shipping-line' || orgLower === 'shippingline') {
      return {
        total: { bg: '#0277BD', text: '#FFFFFF' },      // Deep Blue
        pending: { bg: '#29B6F6', text: '#000000' },    // Light Blue
        approved: { bg: '#26A69A', text: '#FFFFFF' },   // Teal
        rejected: { bg: '#EF5350', text: '#FFFFFF' },   // Red
      };
    }
    
    // Customs - Green/Teal theme
    if (orgLower === 'custom-authorities' || orgLower === 'customs') {
      return {
        total: { bg: '#00695C', text: '#FFFFFF' },      // Dark Teal
        pending: { bg: '#26A69A', text: '#FFFFFF' },    // Teal
        approved: { bg: '#66BB6A', text: '#FFFFFF' },   // Green
        rejected: { bg: '#EF5350', text: '#FFFFFF' },   // Red
      };
    }
    
    // National Bank - Blue theme
    if (orgLower === 'nb-regulatory' || orgLower === 'national-bank' || orgLower === 'nationalbank') {
      return {
        total: { bg: '#1565C0', text: '#FFFFFF' },      // Blue
        pending: { bg: '#42A5F5', text: '#FFFFFF' },    // Light Blue
        approved: { bg: '#66BB6A', text: '#FFFFFF' },   // Green
        rejected: { bg: '#EF5350', text: '#FFFFFF' },   // Red
      };
    }
    
    // Default theme
    return {
      total: { bg: '#1976d2', text: '#FFFFFF' },        // Blue
      pending: { bg: '#9c27b0', text: '#FFFFFF' },      // Purple
      approved: { bg: '#4caf50', text: '#FFFFFF' },     // Green
      rejected: { bg: '#f44336', text: '#FFFFFF' },     // Red
    };
  };

  const orgColors = getOrgColors();

  // Fetch user's assigned agencies
  useEffect(() => {
    const fetchUserAgencies = async () => {
      setLoadingAgencies(true);
      try {
        const response = await networkService.getMyAgencies();
        if (response.success && response.data) {
          setUserAgencies(response.data);
          // Auto-select first agency
          if (response.data.length > 0) {
            setSelectedAgency(response.data[0].code);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user agencies:', error);
      } finally {
        setLoadingAgencies(false);
      }
    };

    fetchUserAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgency) {
      loadData();
    }
  }, [selectedAgency]);

  const loadData = async () => {
    if (!selectedAgency) return;
    
    setLoading(true);
    try {
      // Fetch agency-specific statistics and all submissions
      const [statsResponse, allSubmissionsResponse] = await Promise.all([
        networkService.getAgencyStatistics(selectedAgency),
        networkService.getSubmissions(), // Get all submissions to show recent ones
      ]);

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }

      if (allSubmissionsResponse.success) {
        // Show all submissions, not just pending ones
        setSubmissions(allSubmissionsResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to load Network statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'NETWORK_APPROVED':
        return 'success';
      case 'REJECTED':
      case 'NETWORK_REJECTED':
        return 'error';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'NETWORK_SUBMITTED':
      case 'NETWORK_UNDER_REVIEW':
        return 'warning';
      case 'INFO_REQUIRED':
      case 'NETWORK_ADDITIONAL_INFO_REQUIRED':
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

  const calculateSuccessRate = () => {
    if (!statistics) return 0;
    const total = statistics.totalApprovals || statistics.totalSubmissions || 0;
    if (total === 0) return 0;
    return ((statistics.approved / total) * 100).toFixed(1);
  };

  const calculateRejectionRate = () => {
    if (!statistics) return 0;
    const total = statistics.totalApprovals || statistics.totalSubmissions || 0;
    if (total === 0) return 0;
    return ((statistics.rejected / total) * 100).toFixed(1);
  };

  if (loadingAgencies) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading your agencies...</Typography>
      </Box>
    );
  }

  if (userAgencies.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You are not assigned to any agencies. Please contact your administrator.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart3 size={32} /> Network Statistics & Analytics
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="subtitle2">Select Agency:</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {userAgencies.map((agency) => (
                  <Chip
                    key={agency.code}
                    label={agency.name}
                    onClick={() => setSelectedAgency(agency.code)}
                    color={selectedAgency === agency.code ? 'primary' : 'default'}
                    variant={selectedAgency === agency.code ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: orgColors.total.bg, 
            color: orgColors.total.text,
            border: orgColors.total.border || 'none'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4">{statistics?.totalApprovals || 0}</Typography>
                  <Typography variant="body2">Total Submissions</Typography>
                </Box>
                <TrendingUp size={40} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: orgColors.pending.bg, 
            color: orgColors.pending.text,
            border: orgColors.pending.border || 'none'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4">{statistics?.pending || 0}</Typography>
                  <Typography variant="body2">Pending Review</Typography>
                </Box>
                <Clock size={40} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: orgColors.approved.bg, 
            color: orgColors.approved.text,
            border: orgColors.approved.border || 'none'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4">{statistics?.approved || 0}</Typography>
                  <Typography variant="body2">Approved</Typography>
                </Box>
                <CheckCircle size={40} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ 
            bgcolor: orgColors.rejected.bg, 
            color: orgColors.rejected.text,
            border: orgColors.rejected.border || 'none'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4">{statistics?.rejected || 0}</Typography>
                  <Typography variant="body2">Rejected</Typography>
                </Box>
                <XCircle size={40} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Success Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h3" color="success.main">
                  {calculateSuccessRate()}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  of submissions approved
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rejection Rate
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h3" color="error.main">
                  {calculateRejectionRate()}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  of submissions rejected
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Avg Processing Time
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h3" color="primary.main">
                  {statistics?.avgProcessingTime || 0}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  hours
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Status Breakdown */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Breakdown
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <Chip label="Pending" color="warning" size="small" />
                      </TableCell>
                      <TableCell align="right">{statistics?.pending || 0}</TableCell>
                      <TableCell align="right">
                        {(statistics?.totalApprovals || 0) > 0
                          ? (((statistics.pending || 0) / statistics.totalApprovals) * 100).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Chip label="Under Review" color="info" size="small" />
                      </TableCell>
                      <TableCell align="right">{statistics?.underReview || 0}</TableCell>
                      <TableCell align="right">
                        {(statistics?.totalApprovals || 0) > 0
                          ? (((statistics.underReview || 0) / statistics.totalApprovals) * 100).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Chip label="Approved" color="success" size="small" />
                      </TableCell>
                      <TableCell align="right">{statistics?.approved || 0}</TableCell>
                      <TableCell align="right">{calculateSuccessRate()}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Chip label="Rejected" color="error" size="small" />
                      </TableCell>
                      <TableCell align="right">{statistics?.rejected || 0}</TableCell>
                      <TableCell align="right">{calculateRejectionRate()}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <Chip label="Info Required" color="default" size="small" />
                      </TableCell>
                      <TableCell align="right">{statistics?.infoRequired || 0}</TableCell>
                      <TableCell align="right">
                        {(statistics?.totalApprovals || 0) > 0
                          ? (((statistics.infoRequired || 0) / statistics.totalApprovals) * 100).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Processing Insights
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Alert severity="info" icon={<AlertCircle />}>
                  <Typography variant="body2">
                    <strong>Average Processing Time:</strong> {statistics?.avgProcessingTime || 0} hours
                  </Typography>
                </Alert>
                <Alert severity="success" icon={<CheckCircle />}>
                  <Typography variant="body2">
                    <strong>Fastest Approval:</strong> {statistics?.fastestApproval || 'N/A'} hours
                  </Typography>
                </Alert>
                <Alert severity="warning" icon={<Clock />}>
                  <Typography variant="body2">
                    <strong>Slowest Approval:</strong> {statistics?.slowestApproval || 'N/A'} hours
                  </Typography>
                </Alert>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Agency:</strong> {userAgencies.find(a => a.code === selectedAgency)?.name || selectedAgency}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    Showing statistics for your agency's approvals
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Submissions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Submissions
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Network Reference</TableCell>
                  <TableCell>Export ID</TableCell>
                  <TableCell>Submitted Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Approved Agencies</TableCell>
                  <TableCell>Processing Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No submissions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  submissions.slice(0, 10).map((submission) => {
                    const processingTime = submission.approvedAt
                      ? Math.round(
                          (new Date(submission.approvedAt).getTime() -
                            new Date(submission.submittedAt).getTime()) /
                            (1000 * 60 * 60)
                        )
                      : null;

                    return (
                      <TableRow key={submission.submissionId}>
                        <TableCell>{submission.networkReferenceNumber || submission.networkReferenceNumber}</TableCell>
                        <TableCell>{submission.exportId}</TableCell>
                        <TableCell>{formatDate(submission.submittedAt)}</TableCell>
                        <TableCell>
                          <Chip
                            label={submission.status?.replace(/_/g, ' ')}
                            color={getStatusColor(submission.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {submission.approvedAgencies?.length || 0} / 5
                        </TableCell>
                        <TableCell>
                          {processingTime ? `${processingTime} hours` : 'In Progress'}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default NetworkStatistics;
