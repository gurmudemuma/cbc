// @ts-nocheck
import { useState, useEffect } from 'react';
import { useExports } from '../hooks/useExports';
import QualificationStatusCard from '../components/QualificationStatusCard';
import EmptyState from '../components/EmptyState';
import {
  Package,
  Award,
  DollarSign,
  Ship,
  TrendingUp,
  TrendingDown,
  Activity,
  Database,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Upload,
  Search,
  ShieldCheck,
  Users,
  FileCheck,
  Plane,
  PackageCheck,
  Banknote,
  GitBranch,
} from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { getApiUrl } from '../config/api.config';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  LinearProgress,
  Divider,
  useTheme,
  Tooltip,
  Popover,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { DashboardContainer, StatCard, ActivityCard, QuickActionsCard, PulseChip } from './Dashboard.styles';

const iconMap = {
  FileText: <FileText size={24} />,
  PackageCheck: <PackageCheck size={24} />,
  FileCheck: <FileCheck size={24} />,
  Award: <Award size={24} />,
  Banknote: <Banknote size={24} />,
  DollarSign: <DollarSign size={24} />,
  ShieldCheck: <ShieldCheck size={24} />,
  Ship: <Ship size={24} />,
  CheckCircle: <CheckCircle size={24} />,
  Package: <Package size={24} />,
};

const Dashboard = ({ user }) => {
  const theme = useTheme();
  const { exports: allExports, loading: exportsLoading, error: exportsError } = useExports();
  const [stats, setStats] = useState({
    totalExports: 0,
    pendingCertifications: 0,
    activeShipments: 0,
    currentFXRate: 0,
    completedExports: 0,
    totalValue: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [blockchainMetrics, setBlockchainMetrics] = useState({
    totalTransactions: 0,
    blockHeight: 0,
    averageBlockTime: 0,
    networkStatus: 'healthy',
  });
  const [previousStats, setPreviousStats] = useState(null);
  const [workflowData, setWorkflowData] = useState([]);
  const [hoveredStage, setHoveredStage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    // Set API base URL based on user's role/organization
    if (user && user.role) {
      setApiBaseUrl(getApiUrl(user.role));
    }
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      try {
        // Use exports from hook instead of fetching
        // Filter exports by status
        const pendingExports = allExports.filter(e => e.status === 'PENDING');
        const shipmentsExports = allExports.filter(e => e.status === 'SHIPMENT_SCHEDULED');
        const completedExports = allExports.filter(e => e.status === 'COMPLETED');

        // Calculate total value from completed exports
        const totalValue = completedExports.reduce(
          (sum, exp) => sum + (exp.estimatedValue || 0),
          0
        );

        // Calculate trends (compare with previous state)
        const newStats = {
          totalExports: allExports.length,
          pendingCertifications: pendingExports.length,
          activeShipments: shipmentsExports.length,
          currentFXRate: 118.45,
          completedExports: completedExports.length,
          totalValue: totalValue,
        };

        setStats(newStats);

        // Store previous stats for trend calculation
        if (!previousStats) {
          setPreviousStats(newStats);
        }

        // Sort by updatedAt for recent activity
        const sortedExports = [...allExports].sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setRecentActivity(sortedExports.slice(0, 8));

        // Simulate blockchain metrics (in production, get from backend)
        setBlockchainMetrics({
          totalTransactions: allExports.length * 3, // Estimate: create + updates
          blockHeight: 1000 + allExports.length,
          averageBlockTime: 2.5,
          networkStatus: 'healthy',
        });

        // Generate workflow stage data for line chart with actor information
        // CORRECTED Workflow: Created → ECX → ECTA (3 stages) → Bank → NBE → Customs → Shipped → Completed
        const workflowStages = [
          {
            stage: 'Created',
            status: 'DRAFT',
            icon: 'FileText',
            actorField: null,
            org: 'Exporter',
          },
          {
            stage: 'ECX Verified',
            status: 'ECX_VERIFIED',
            icon: 'PackageCheck',
            actorField: 'ecxVerifiedBy',
            org: 'ECX',
          },
          {
            stage: 'ECTA License',
            status: 'ECTA_LICENSE_APPROVED',
            icon: 'FileCheck',
            actorField: 'exportLicenseValidatedBy',
            org: 'ECTA',
          },
          {
            stage: 'ECTA Quality',
            status: 'ECTA_QUALITY_APPROVED',
            icon: 'Award',
            actorField: 'qualityCertifiedBy',
            org: 'ECTA',
          },
          {
            stage: 'ECTA Contract',
            status: 'ECTA_CONTRACT_APPROVED',
            icon: 'FileText',
            actorField: 'contractApprovedBy',
            org: 'ECTA',
          },
          {
            stage: 'Bank Verified',
            status: 'BANK_DOCUMENT_VERIFIED',
            icon: 'Banknote',
            actorField: 'bankDocumentVerifiedBy',
            org: 'Commercial Bank',
          },
          {
            stage: 'NBE FX Approved',
            status: 'FX_APPROVED',
            icon: 'DollarSign',
            actorField: 'fxApprovedBy',
            org: 'NBE',
          },
          {
            stage: 'Customs Cleared',
            status: 'CUSTOMS_CLEARED',
            icon: 'ShieldCheck',
            actorField: 'exportCustomsClearedBy',
            org: 'Customs',
          },
          {
            stage: 'Shipped',
            status: 'SHIPPED',
            icon: 'Ship',
            actorField: 'shippingLineId',
            org: 'Shipping Line',
          },
          {
            stage: 'Completed',
            status: 'COMPLETED',
            icon: 'CheckCircle',
            actorField: null,
            org: 'System',
          },
        ];

        const workflowChartData = workflowStages.map((stage, index) => {
          const exportsAtStage = allExports.filter((exp) => {
            // Count exports that reached this stage or beyond
            // CORRECTED: Proper workflow order
            const statusOrder = {
              DRAFT: 1,
              PENDING: 1,
              ECX_PENDING: 1,
              ECX_VERIFIED: 2,
              ECX_REJECTED: 0,
              ECTA_LICENSE_PENDING: 2,
              ECTA_LICENSE_APPROVED: 3,
              ECTA_LICENSE_REJECTED: 0,
              ECTA_QUALITY_PENDING: 3,
              ECTA_QUALITY_APPROVED: 4,
              ECTA_QUALITY_REJECTED: 0,
              ECTA_CONTRACT_PENDING: 4,
              ECTA_CONTRACT_APPROVED: 5,
              ECTA_CONTRACT_REJECTED: 0,
              BANK_DOCUMENT_PENDING: 5,
              BANK_DOCUMENT_VERIFIED: 6,
              BANK_DOCUMENT_REJECTED: 0,
              FX_APPLICATION_PENDING: 6,
              FX_PENDING: 6,
              FX_APPROVED: 7,
              FX_REJECTED: 0,
              CUSTOMS_PENDING: 7,
              EXPORT_CUSTOMS_PENDING: 7,
              CUSTOMS_CLEARED: 8,
              EXPORT_CUSTOMS_CLEARED: 8,
              CUSTOMS_REJECTED: 0,
              EXPORT_CUSTOMS_REJECTED: 0,
              READY_FOR_SHIPMENT: 8,
              SHIPMENT_PENDING: 8,
              SHIPMENT_SCHEDULED: 8,
              SHIPPED: 9,
              ARRIVED: 9,
              IMPORT_CUSTOMS_PENDING: 9,
              IMPORT_CUSTOMS_CLEARED: 9,
              DELIVERED: 9,
              PAYMENT_PENDING: 9,
              PAYMENT_RECEIVED: 9,
              FX_REPATRIATED: 9,
              COMPLETED: 10,
              CANCELLED: 0,
            };
            return (statusOrder[exp.status] || 0) >= index + 1;
          });

          // Get unique actors for this stage
          const actors = new Set();
          exportsAtStage.forEach((exp) => {
            if (stage.actorField && exp[stage.actorField]) {
              actors.add(exp[stage.actorField]);
            }
          });

          return {
            stage: stage.stage,
            count: exportsAtStage.length,
            percentage:
              allExports.length > 0
                ? Math.round((exportsAtStage.length / allExports.length) * 100)
                : 0,
            organization: stage.org,
            actors: Array.from(actors),
            actorsCount: actors.size,
          };
        });

        setWorkflowData(workflowChartData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();

    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [allExports]); // Re-run when exports change

  // Calculate real trends
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
    };
  };

  const statCards = [
    {
      title: 'Total Exports',
      value: stats.totalExports,
      icon: <span><Package size={24} /></span>,
      color: 'primary',
      trend: calculateTrend(stats.totalExports, previousStats?.totalExports),
      subtitle: 'On-chain records',
    },
    {
      title: 'Completed Exports',
      value: stats.completedExports,
      icon: <span><CheckCircle size={24} /></span>,
      color: 'success',
      trend: calculateTrend(stats.completedExports, previousStats?.completedExports),
      subtitle: 'Successfully delivered',
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingCertifications,
      icon: <span><Clock size={24} /></span>,
      color: 'warning',
      trend: calculateTrend(stats.pendingCertifications, previousStats?.pendingCertifications),
      subtitle: 'Awaiting certification',
    },
    {
      title: 'Total Value (USD)',
      value: `$${(stats.totalValue / 1000).toFixed(1)}K`,
      icon: <span><DollarSign size={24} /></span>,
      color: 'secondary',
      trend: calculateTrend(stats.totalValue, previousStats?.totalValue),
      subtitle: 'Completed exports',
    },
  ];

  return (
    <DashboardContainer className={`organization-${user.organizationId || 'banker'}`}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Typography variant="subtitle1">Welcome back, {user.username}!</Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <span><Activity size={20} /></span>
          <Typography variant="body1">{user.organization}</Typography>
        </Stack>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {statCards.map((stat, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <StatCard>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: stat.color === 'primary' ? 'primary.main' :
                        stat.color === 'secondary' ? 'secondary.main' :
                          `${stat.color}.main`,
                      color: stat.color === 'primary' ? 'primary.contrastText' :
                        stat.color === 'secondary' ? 'secondary.contrastText' :
                          'white',
                    }}
                  >
                    {iconMap[stat.icon] || <Package size={24} />}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ my: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {stat.trend.direction === 'up' && (
                        <>
                          <span><TrendingUp size={14} style={{ color: theme.palette.success.main }} /></span>
                          <Typography variant="caption" color="success.main">
                            +{stat.trend.value}%
                          </Typography>
                        </>
                      )}
                      {stat.trend.direction === 'down' && (
                        <>
                          <span><TrendingDown size={14} style={{ color: theme.palette.error.main }} /></span>
                          <Typography variant="caption" color="error.main">
                            -{stat.trend.value}%
                          </Typography>
                        </>
                      )}
                      {stat.trend.direction === 'neutral' && (
                        <Typography variant="caption" color="text.secondary">
                          No change
                        </Typography>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      {stat.subtitle}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </StatCard>
          </Grid>
        ))}
      </Grid>

      {/* Unified Export Workflow Progress - Crypto Ticker Style */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Export Workflow Progress
              </Typography>
              <Stack direction="row" alignItems="baseline" spacing={1} sx={{ mt: 1 }}>
                <Typography variant="h3" sx={{ fontWeight: 700 }}>
                  {workflowData.reduce((sum, stage) => sum + stage.count, 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Exports
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <span><TrendingUp size={18} style={{ color: theme.palette.success.main }} /></span>
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                  +{workflowData[workflowData.length - 1]?.count || 0} completed (
                  {workflowData.length > 0
                    ? Math.round(
                      (workflowData[workflowData.length - 1]?.count / workflowData[0]?.count) *
                      100
                    )
                    : 0}
                  %)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  today
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                {new Date().toLocaleString()} UTC
              </Typography>
            </Box>
            <PulseChip
              label="🔴 LIVE"
              size="small"
              sx={{
                bgcolor: 'error.main',
                color: 'error.contrastText',
                fontWeight: 700,
              }}
            />
          </Stack>

          {/* Time Period Selector */}
          <Stack direction="row" spacing={1} sx={{ mb: 3, overflowX: 'auto', pb: 1 }}>
            {['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'Max'].map((period) => (
              <Button
                key={period}
                size="small"
                variant={period === '1D' ? 'contained' : 'outlined'}
                sx={{
                  minWidth: 50,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  borderColor: theme.palette.divider,
                  color: period === '1D' ? 'white' : theme.palette.text.primary,
                  backgroundColor: period === '1D' ? theme.palette.primary.main : 'transparent',
                  '&:hover': {
                    backgroundColor:
                      period === '1D' ? theme.palette.primary.dark : theme.palette.action.hover,
                  },
                }}
              >
                {period}
              </Button>
            ))}
          </Stack>

          {/* Chart with Interactive Stage Data */}
          {workflowData.length > 0 ? (
            <Box sx={{ mb: 3 }}>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={workflowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis
                    dataKey="stage"
                    tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: theme.palette.text.secondary, fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 8,
                      padding: '16px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    }}
                    labelStyle={{ color: theme.palette.text.primary, fontWeight: 600 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const index = workflowData.indexOf(data);
                        return (
                          <Box
                            sx={{
                              bgcolor: theme.palette.background.paper,
                              border: `2px solid ${theme.palette.divider}`,
                              borderRadius: 2,
                              p: 2,
                              minWidth: 280,
                            }}
                          >
                            {/* Header */}
                            <Box sx={{ mb: 1.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                                {data.stage}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {data.organization}
                              </Typography>
                            </Box>

                            <Divider sx={{ my: 1 }} />

                            {/* Main Stats */}
                            <Stack spacing={1}>
                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                >
                                  EXPORTS AT THIS STAGE
                                </Typography>
                                <Typography
                                  variant="h5"
                                  sx={{ fontWeight: 700, color: theme.palette.primary.main }}
                                >
                                  {data.count}
                                </Typography>
                              </Box>

                              <Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                >
                                  COMPLETION RATE
                                </Typography>
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={1}
                                  sx={{ mt: 0.5 }}
                                >
                                  <Box sx={{ flex: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={data.percentage}
                                      sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: theme.palette.divider,
                                        '& .MuiLinearProgress-bar': {
                                          borderRadius: 3,
                                          backgroundColor:
                                            data.percentage === 100
                                              ? '#10B981'
                                              : data.percentage >= 50
                                                ? '#F59E0B'
                                                : '#EF4444',
                                        },
                                      }}
                                    />
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontWeight: 700, minWidth: 35 }}
                                  >
                                    {data.percentage}%
                                  </Typography>
                                </Stack>
                              </Box>

                              {index > 0 && (
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                  >
                                    CHANGE FROM PREVIOUS
                                  </Typography>
                                  <Stack
                                    direction="row"
                                    spacing={0.5}
                                    alignItems="center"
                                    sx={{ mt: 0.5 }}
                                  >
                                    {data.count >= (workflowData[index - 1]?.count || 0) ? (
                                      <>
                                        <span><TrendingUp size={14} color="#10B981" /></span>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: '#10B981',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                          }}
                                        >
                                          +
                                          {Math.abs(
                                            data.count - (workflowData[index - 1]?.count || 0)
                                          )}{' '}
                                          exports
                                        </Typography>
                                      </>
                                    ) : (
                                      <>
                                        <span><TrendingDown size={14} color="#EF4444" /></span>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            color: '#EF4444',
                                            fontWeight: 700,
                                            fontSize: '0.75rem',
                                          }}
                                        >
                                          {data.count - (workflowData[index - 1]?.count || 0)}{' '}
                                          exports
                                        </Typography>
                                      </>
                                    )}
                                  </Stack>
                                </Box>
                              )}
                            </Stack>

                            {data.actorsCount > 0 && (
                              <>
                                <Divider sx={{ my: 1 }} />
                                <Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      display: 'block',
                                      mb: 0.5,
                                    }}
                                  >
                                    APPROVED BY ({data.actorsCount})
                                  </Typography>
                                  <Stack spacing={0.3}>
                                    {data.actors.slice(0, 3).map((actor, idx) => (
                                      <Typography
                                        key={idx}
                                        variant="caption"
                                        sx={{ fontSize: '0.7rem' }}
                                      >
                                        • {actor}
                                      </Typography>
                                    ))}
                                    {data.actors.length > 3 && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}
                                      >
                                        +{data.actors.length - 3} more
                                      </Typography>
                                    )}
                                  </Stack>
                                </Box>
                              </>
                            )}

                            {/* Status Badge */}
                            <Box
                              sx={{
                                mt: 1.5,
                                p: 1,
                                borderRadius: 1,
                                bgcolor:
                                  data.percentage === 100
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : data.percentage >= 50
                                      ? 'rgba(245, 158, 11, 0.1)'
                                      : 'rgba(239, 68, 68, 0.1)',
                                textAlign: 'center',
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 700,
                                  color:
                                    data.percentage === 100
                                      ? '#10B981'
                                      : data.percentage >= 50
                                        ? '#F59E0B'
                                        : '#EF4444',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {data.percentage === 100
                                  ? '✓ COMPLETED'
                                  : data.percentage >= 50
                                    ? '⏳ IN PROGRESS'
                                    : '⚠ PENDING'}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      }
                      return null;
                    }}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const percentage = payload.percentage;
                      const color =
                        percentage === 100 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444';
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill={color}
                          stroke="white"
                          strokeWidth={2}
                          style={{ cursor: 'pointer' }}
                        />
                      );
                    }}
                    activeDot={(props) => {
                      const { cx, cy, payload } = props;
                      const percentage = payload.percentage;
                      const color =
                        percentage === 100 ? '#10B981' : percentage >= 50 ? '#F59E0B' : '#EF4444';
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={10}
                          fill={color}
                          stroke="white"
                          strokeWidth={2}
                          style={{ cursor: 'pointer' }}
                        />
                      );
                    }}
                    name="Exports"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <span><GitBranch size={48} color="#9E9E9E" style={{ marginBottom: 16 }} /></span>
              <Typography color="text.secondary">No workflow data available</Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ textAlign: 'center' }}
          >
            💡 Hover over the chart points to see detailed stage information including exports,
            completion rate, approvers, and status
          </Typography>
        </CardContent>
      </Card>

      {/* Hover Detail Popover */}
      <Popover
        open={hoveredStage !== null}
        anchorEl={anchorEl}
        onClose={() => {
          setHoveredStage(null);
          setAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        sx={{
          pointerEvents: 'none',
          '& .MuiPopover-paper': {
            pointerEvents: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            borderRadius: 2,
          },
        }}
      >
        {hoveredStage !== null && workflowData[hoveredStage] && (
          <Box sx={{ p: 3, minWidth: 320, maxWidth: 400 }}>
            <Stack spacing={2}>
              {/* Header */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {workflowData[hoveredStage].stage}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {workflowData[hoveredStage].organization}
                </Typography>
              </Box>

              <Divider />

              {/* Main Stats */}
              <Stack spacing={1.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    EXPORTS AT THIS STAGE
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: theme.palette.primary.main }}
                  >
                    {workflowData[hoveredStage].count}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    COMPLETION RATE
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={workflowData[hoveredStage].percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.divider,
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor:
                              workflowData[hoveredStage].percentage === 100
                                ? '#10B981'
                                : workflowData[hoveredStage].percentage >= 50
                                  ? '#F59E0B'
                                  : '#EF4444',
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, minWidth: 45 }}>
                      {workflowData[hoveredStage].percentage}%
                    </Typography>
                  </Stack>
                </Box>

                {hoveredStage > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      CHANGE FROM PREVIOUS STAGE
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                      {workflowData[hoveredStage].count >=
                        (workflowData[hoveredStage - 1]?.count || 0) ? (
                        <>
                          <span><TrendingUp size={16} color="#10B981" /></span>
                          <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700 }}>
                            +
                            {Math.abs(
                              workflowData[hoveredStage].count -
                              (workflowData[hoveredStage - 1]?.count || 0)
                            )}{' '}
                            exports
                          </Typography>
                        </>
                      ) : (
                        <>
                          <span><TrendingDown size={16} color="#EF4444" /></span>
                          <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 700 }}>
                            {workflowData[hoveredStage].count -
                              (workflowData[hoveredStage - 1]?.count || 0)}{' '}
                            exports
                          </Typography>
                        </>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>

              <Divider />

              {/* Approvers */}
              {workflowData[hoveredStage].actorsCount > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, display: 'block', mb: 1 }}
                  >
                    APPROVED BY ({workflowData[hoveredStage].actorsCount})
                  </Typography>
                  <Stack spacing={0.5}>
                    {workflowData[hoveredStage].actors.slice(0, 5).map((actor, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.02)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                        }}
                      >
                        <span><Users size={14} color={theme.palette.primary.main} /></span>
                        <Typography variant="caption" sx={{ fontWeight: 500 }}>
                          {actor}
                        </Typography>
                      </Box>
                    ))}
                    {workflowData[hoveredStage].actors.length > 5 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic', mt: 0.5 }}
                      >
                        +{workflowData[hoveredStage].actors.length - 5} more approvers
                      </Typography>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Status Badge */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor:
                    workflowData[hoveredStage].percentage === 100
                      ? 'rgba(16, 185, 129, 0.1)'
                      : workflowData[hoveredStage].percentage >= 50
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(239, 68, 68, 0.1)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color:
                      workflowData[hoveredStage].percentage === 100
                        ? '#10B981'
                        : workflowData[hoveredStage].percentage >= 50
                          ? '#F59E0B'
                          : '#EF4444',
                  }}
                >
                  {workflowData[hoveredStage].percentage === 100
                    ? '✓ COMPLETED'
                    : workflowData[hoveredStage].percentage >= 50
                      ? '⏳ IN PROGRESS'
                      : '⚠ PENDING'}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}
      </Popover>

      <Grid container spacing={3}>
        <Grid xs={12} md={9}>
          <ActivityCard>
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6">Recent Blockchain Activity</Typography>
                <Chip label="Live" size="small" color="success" icon={<Activity size={14} />} />
              </Stack>
              <Stack spacing={1.5}>
                {recentActivity.length === 0 ? (
                  <EmptyState
                    icon={<span><AlertCircle size={48} /></span>}
                    title="No recent activity"
                    description="Blockchain transactions will appear here"
                  />
                ) : (
                  recentActivity.map((activity, index) => (
                    <Box key={activity.exportId}>
                      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <span><Database size={16} stroke={theme.palette.primary.main} /></span>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={500}>
                              Export {activity.exportId}
                            </Typography>
                            <Chip
                              label={activity.status?.replace(/_/g, ' ')}
                              size="small"
                              color={
                                activity.status === 'COMPLETED'
                                  ? 'success'
                                  : activity.status === 'PENDING'
                                    ? 'warning'
                                    : 'primary'
                              }
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {activity.coffeeType} • {activity.quantity} kg • $
                            {activity.estimatedValue?.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Updated: {new Date(activity.updatedAt).toLocaleString()}
                          </Typography>
                          {/* Show who took action - v2.0: includes banking approver */}
                          {(activity.fxApprovedBy ||
                            activity.bankingApprovedBy ||
                            activity.qualityCertifiedBy ||
                            activity.exportCustomsClearedBy) && (
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                <span><Users size={12} color="#9E9E9E" /></span>
                                <Typography variant="caption" color="text.secondary">
                                  {activity.fxApprovedBy && `FX: ${activity.fxApprovedBy}`}
                                  {activity.bankingApprovedBy &&
                                    ` • Banking: ${activity.bankingApprovedBy}`}
                                  {activity.qualityCertifiedBy &&
                                    ` • Quality: ${activity.qualityCertifiedBy}`}
                                  {activity.exportCustomsClearedBy &&
                                    ` • Customs: ${activity.exportCustomsClearedBy}`}
                                </Typography>
                              </Stack>
                            )}
                        </Box>
                      </Stack>
                      {index < recentActivity.length - 1 && <Divider sx={{ mt: 1 }} />}
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </ActivityCard>
        </Grid>

        <Grid xs={12} md={3}>
          <Stack spacing={3}>
            {/* Qualification Status Card for Exporters */}
            <QualificationStatusCard user={user} />

            <QuickActionsCard>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={1.5}>
                  {/* Exporter Quick Actions - Off-chain: Submits to NB Regulatory */}
                  {user.organizationId === 'exporter' && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<span><Package size={18} /></span>}
                        fullWidth
                        href="/exports"
                      >
                        Create Export Request
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Search size={18} /></span>}
                        fullWidth
                        href="/exports"
                      >
                        View My Requests
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Upload size={18} /></span>}
                        fullWidth
                        href="/exports"
                      >
                        Upload Documents
                      </Button>
                    </>
                  )}

                  {/* ECTA Quick Actions - THIRD STEP: Quality Certification (after Banking) */}
                  {user.organizationId === 'ecta' && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<span><Award size={18} /></span>}
                        fullWidth
                        href="/quality"
                      >
                        Certify Quality
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><FileCheck size={18} /></span>}
                        fullWidth
                        href="/quality"
                      >
                        Issue Origin Certificate
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Search size={18} /></span>}
                        fullWidth
                        href="/quality"
                      >
                        View Pending Requests
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Upload size={18} /></span>}
                        fullWidth
                        href="/quality"
                      >
                        Upload Documents
                      </Button>
                    </>
                  )}

                  {/* NB Regulatory Quick Actions - FIRST STEP: Creates blockchain record & FX approval */}
                  {user.organizationId === 'nb-regulatory' && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<span><Package size={18} /></span>}
                        fullWidth
                        href="/exports"
                      >
                        Create Export on Blockchain
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><CheckCircle size={18} /></span>}
                        fullWidth
                        href="/fx-approval"
                      >
                        Approve FX Request
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><DollarSign size={18} /></span>}
                        fullWidth
                        href="/fx-rates"
                      >
                        Manage FX Rates
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Users size={18} /></span>}
                        fullWidth
                        href="/users"
                      >
                        Manage Exporter Users
                      </Button>
                    </>
                  )}

                  {/* Banker Quick Actions - SECOND STEP: Financial document validation (after FX) */}
                  {(user.organizationId === 'banker' || user.organizationId === 'banker-001') && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<span><Banknote size={18} /></span>}
                        fullWidth
                        href="/banking"
                      >
                        Approve Banking/Financial Docs
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><FileText size={18} /></span>}
                        fullWidth
                        href="/banking"
                      >
                        Review Commercial Invoice
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Search size={18} /></span>}
                        fullWidth
                        href="/banking"
                      >
                        View Pending Reviews
                      </Button>
                    </>
                  )}

                  {/* Shipping Line Quick Actions - FIFTH STEP: Shipment + Arrival Notification (after Customs) */}
                  {user.organizationId === 'shipping' && (
                    <>
                      <Button
                        variant="contained"
                        startIcon={<span><Ship size={18} /></span>}
                        fullWidth
                        href="/shipments"
                      >
                        Schedule Shipment
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><CheckCircle size={18} /></span>}
                        fullWidth
                        href="/shipments"
                      >
                        Confirm Shipment
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Plane size={18} /></span>}
                        fullWidth
                        href="/shipments"
                      >
                        Notify Arrival
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Search size={18} /></span>}
                        fullWidth
                        href="/shipments"
                      >
                        Track Shipments
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Upload size={18} /></span>}
                        fullWidth
                        href="/shipments"
                      >
                        Upload Documents
                      </Button>
                    </>
                  )}

                  {/* Custom Authorities Quick Actions - FOURTH STEP: Export Customs (after Quality) */}
                  {user.organizationId === 'custom-authorities' && (
                    <>
                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>
                        Export Customs (Before Shipment)
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<span><ShieldCheck size={18} /></span>}
                        fullWidth
                        href="/customs/export"
                      >
                        Clear Export Customs
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Search size={18} /></span>}
                        fullWidth
                        href="/customs/export"
                      >
                        View Export Pending
                      </Button>

                      <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, fontWeight: 600 }}>
                        Import Customs (After Arrival)
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<span><ShieldCheck size={18} /></span>}
                        fullWidth
                        href="/customs/import"
                      >
                        Clear Import Customs
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><PackageCheck size={18} /></span>}
                        fullWidth
                        href="/customs/import"
                      >
                        Confirm Delivery
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<span><Search size={18} /></span>}
                        fullWidth
                        href="/customs/import"
                      >
                        View Import Pending
                      </Button>
                    </>
                  )}
                </Stack>
              </CardContent>
            </QuickActionsCard>
          </Stack>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;
