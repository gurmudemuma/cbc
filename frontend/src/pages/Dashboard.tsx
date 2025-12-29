
import { useState, useEffect } from 'react';
import { useExports, useExportStats } from '../hooks/useExportManager';
import {
  ModernStatCard,
  ModernSectionHeader,
  ModernEmptyState,
} from '../components/ModernUIKit';
import {
  Package,
  Award,
  DollarSign,
  Ship,
  Activity,
  CheckCircle,
  Clock,
  ShieldCheck,
  Banknote,
  GitBranch,
} from 'lucide-react';
import { getApiUrl } from '../config/api.config';
import { setApiBaseUrl } from '../services/api';
import bankingService from '../services/bankingService';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  LinearProgress,
  Divider,
  useTheme,
  Popover,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardContainer, PulseChip, GlassCard } from './Dashboard.styles';

interface DashboardProps {
  user: any;
  org: string | null;
}

const Dashboard = ({ user, org }: DashboardProps): JSX.Element => {
  const theme = useTheme();
  // ... imports and setup

  // ... (keep state logic same) ...
  const { exports: allExports, loading: exportsLoading, error: exportsError } = useExports();
  const { stats: realStats } = useExportStats();

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [blockchainMetrics, setBlockchainMetrics] = useState({
    totalTransactions: 0,
    blockHeight: 0,
    averageBlockTime: 0,
    networkStatus: 'healthy',
  });
  const [workflowData, setWorkflowData] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role) {
      setApiBaseUrl(getApiUrl(user.role));
    }
  }, [user]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Stats are now handled by useExportStats hook

        const sortedExports = [...allExports].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setRecentActivity(sortedExports.slice(0, 5)); // Top 5 for sidebar

        try {
          // Attempt to fetch real blockchain metrics
          const networkStatus = await bankingService.getNetworkStatus();
          setBlockchainMetrics({
            totalTransactions: networkStatus.transactionCount || allExports.length, // Fallback to export count
            blockHeight: networkStatus.blockHeight || 0,
            averageBlockTime: networkStatus.avgBlockTime || 0,
            networkStatus: 'healthy',
          });
        } catch (e) {
          // If we can't access banking service (e.g. not authorized), show knowns
          setBlockchainMetrics({
            totalTransactions: allExports.length, // Minimum confirmed transactions
            blockHeight: 0, // Unknown
            averageBlockTime: 0,
            networkStatus: 'healthy',
          });
        }

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

          const actors = new Set();
          exportsAtStage.forEach((exp) => {
            if (stage.actorField && exp[stage.actorField]) {
              actors.add(exp[stage.actorField]);
            }
          });

          return {
            stage: stage.stage,
            count: exportsAtStage.length,
            percentage: allExports.length > 0 ? Math.round((exportsAtStage.length / allExports.length) * 100) : 0,
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
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [allExports]);

  // Use reusable calculateTrend function (placeholder for now as backend doesn't support trends yet)
  const calculateTrend = (current: number, previous: number | undefined) => {
    return { value: 0, direction: 'neutral' as const };
  };

  const statCards = [
    { title: 'Total Exports', value: realStats.totalExports, icon: <Package size={24} />, color: 'primary' as const, trend: calculateTrend(realStats.totalExports, 0), subtitle: 'On-chain records' },
    { title: 'Completed', value: realStats.completedExports, icon: <CheckCircle size={24} />, color: 'success' as const, trend: calculateTrend(realStats.completedExports, 0), subtitle: 'Delivered' },
    { title: 'Pending', value: realStats.pendingAction, icon: <Clock size={24} />, color: 'warning' as const, trend: calculateTrend(realStats.pendingAction, 0), subtitle: 'Actions Required' },
    { title: 'Total Value', value: `$${(realStats.totalValue / 1000).toFixed(1)}K`, icon: <DollarSign size={24} />, color: 'secondary' as const, trend: calculateTrend(realStats.totalValue, 0), subtitle: 'USD' },
  ];

  return (
    <DashboardContainer className={`organization-${user.organizationId || 'banker'}`}>
      <ModernSectionHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user.username}!`}
        action={
          <Stack direction="row" alignItems="center" spacing={1}>
            <PulseChip label="SYSTEM ONLINE" size="small" color="success" />
            <Activity size={20} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.organization}</Typography>
          </Stack>
        }
      />

      {/* Hero Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <ModernStatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Main Chart Area - 8 Columns */}
        <Grid xs={12} lg={8}>
          <GlassCard sx={{ height: '100%', minHeight: 450 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>Export Workflow Volume</Typography>
                  <Typography variant="body2" color="text.secondary">Real-time throughput across all agencies</Typography>
                </Box>
                <Button variant="outlined" size="small" startIcon={<GitBranch size={16} />}>View Details</Button>
              </Stack>

              <Box sx={{ height: 350, width: '100%' }}>
                {workflowData.length > 0 ? (
                  <ResponsiveContainer>
                    <AreaChart data={workflowData}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={alpha(theme.palette.divider, 0.1)} />
                      <XAxis
                        dataKey="stage"
                        tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis
                        tick={{ fill: theme.palette.text.secondary, fontSize: 11, fontWeight: 600 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: alpha(theme.palette.background.paper, 0.8),
                          backdropFilter: 'blur(12px)',
                          borderRadius: 16,
                          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          color: theme.palette.text.primary,
                          padding: '12px'
                        }}
                        itemStyle={{ fontWeight: 600, color: theme.palette.primary.main }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={theme.palette.primary.main}
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCount)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <ModernEmptyState title="No Data" description="Start exports to see trends" icon={<Activity />} />
                )
                }
              </Box>
            </CardContent>
          </GlassCard>
        </Grid>

        {/* Sidebar - 4 Columns */}
        <Grid xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Blockchain Health Widget */}
            <GlassCard sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: '#fff',
              border: 'none'
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'inherit', fontWeight: 600 }}>Blockchain Status</Typography>
                  <ShieldCheck size={20} style={{ opacity: 0.8 }} />
                </Stack>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>Block Height</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>#{blockchainMetrics.blockHeight.toLocaleString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}>Transactions</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>{blockchainMetrics.totalTransactions}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </GlassCard>

            {/* Recent Activity Feed */}
            <GlassCard>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Recent Activity</Typography>
                <List disablePadding>
                  {recentActivity.map((activity: any, i) => (
                    <ListItem key={i} disableGutters sx={{ py: 1.5, borderBottom: i < recentActivity.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.1)}` : 'none' }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                          <Clock size={16} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{activity.status.replace(/_/g, ' ')}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary">{new Date(activity.updatedAt).toLocaleTimeString()}</Typography>}
                      />
                      <Chip label={activity.exporterId?.substring(0, 6)} size="small" variant="outlined" sx={{ borderRadius: 1 }} />
                    </ListItem>
                  ))}
                  {recentActivity.length === 0 && <Typography variant="body2" color="text.secondary">No recent updates.</Typography>}
                </List>
              </CardContent>
            </GlassCard>
          </Stack>
        </Grid>
      </Grid>
    </DashboardContainer>
  );
};

export default Dashboard;
