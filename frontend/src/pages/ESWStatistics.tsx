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
import eswService from '../services/esw.service';

interface ESWStatisticsProps {
  user: any;
  org: any;
}

const ESWStatistics = ({ user, org }: ESWStatisticsProps): JSX.Element => {
  const [statistics, setStatistics] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResponse, submissionsResponse] = await Promise.all([
        eswService.getStatistics(),
        eswService.getSubmissions(),
      ]);

      if (statsResponse.success) {
        setStatistics(statsResponse.data);
      }

      if (submissionsResponse.success) {
        setSubmissions(submissionsResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to load ESW statistics:', error);
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
      case 'ESW_APPROVED':
        return 'success';
      case 'REJECTED':
      case 'ESW_REJECTED':
        return 'error';
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'ESW_SUBMITTED':
      case 'ESW_UNDER_REVIEW':
        return 'warning';
      case 'INFO_REQUIRED':
      case 'ESW_ADDITIONAL_INFO_REQUIRED':
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
    const total = statistics.totalSubmissions;
    if (total === 0) return 0;
    return ((statistics.approved / total) * 100).toFixed(1);
  };

  const calculateRejectionRate = () => {
    if (!statistics) return 0;
    const total = statistics.totalSubmissions;
    if (total === 0) return 0;
    return ((statistics.rejected / total) * 100).toFixed(1);
  };

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
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BarChart3 size={32} /> ESW Statistics & Analytics
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4">{statistics?.totalSubmissions || 0}</Typography>
                  <Typography variant="body2">Total Submissions</Typography>
                </Box>
                <TrendingUp size={40} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: 'warning.main', color: 'warning.contrastText' }}>
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
          <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}>
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
          <Card sx={{ bgcolor: 'error.main', color: 'error.contrastText' }}>
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
                        {statistics?.totalSubmissions > 0
                          ? ((statistics.pending / statistics.totalSubmissions) * 100).toFixed(1)
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
                        {statistics?.totalSubmissions > 0
                          ? ((statistics.underReview / statistics.totalSubmissions) * 100).toFixed(1)
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
                        {statistics?.totalSubmissions > 0
                          ? ((statistics.infoRequired / statistics.totalSubmissions) * 100).toFixed(1)
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
                    <strong>Total Agencies:</strong> 16 Ethiopian government agencies review each submission
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
                  <TableCell>ESW Reference</TableCell>
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
                        <TableCell>{submission.eswReferenceNumber}</TableCell>
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
                          {submission.approvedAgencies?.length || 0} / 16
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

export default ESWStatistics;
