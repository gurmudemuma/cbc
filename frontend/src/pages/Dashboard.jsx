import { useState, useEffect } from 'react';
import { Package, Award, DollarSign, Ship, TrendingUp, TrendingDown, Activity, Database, CheckCircle, Clock, AlertCircle, FileText, Upload, Search, ShieldCheck, Users, FileCheck, Plane, PackageCheck, Banknote, GitBranch } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { getApiUrl } from '../config/api.config';
import { Card, CardContent, Typography, Box, Button, Stack, Chip, LinearProgress, Divider, useTheme } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const Dashboard = ({ user }) => {
  const theme = useTheme();
  const [stats, setStats] = useState({
    totalExports: 0,
    pendingCertifications: 0,
    activeShipments: 0,
    currentFXRate: 0,
    completedExports: 0,
    totalValue: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [blockchainMetrics, setBlockchainMetrics] = useState({
    totalTransactions: 0,
    blockHeight: 0,
    averageBlockTime: 0,
    networkStatus: 'healthy'
  });
  const [previousStats, setPreviousStats] = useState(null);
  const [workflowData, setWorkflowData] = useState([]);

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
        const [exportsRes, pendingRes, shipmentsRes, completedRes] = await Promise.all([
          apiClient.get('/exports').catch((err) => {
            if (err.response?.status === 401) {
              console.warn('Authentication expired, please login again');
            }
            return { data: { data: [] } };
          }),
          apiClient.get('/exports/status/PENDING').catch(() => ({ data: { data: [] } })),
          apiClient.get('/exports/status/SHIPMENT_SCHEDULED').catch(() => ({ data: { data: [] } })),
          apiClient.get('/exports/status/COMPLETED').catch(() => ({ data: { data: [] } })),
        ]);

        const allExports = exportsRes.data?.data || [];
        const completedExports = completedRes.data?.data || [];
        
        // Calculate total value from completed exports
        const totalValue = completedExports.reduce((sum, exp) => sum + (exp.estimatedValue || 0), 0);
        
        // Calculate trends (compare with previous state)
        const newStats = {
          totalExports: allExports.length,
          pendingCertifications: pendingRes.data?.data?.length || 0,
          activeShipments: shipmentsRes.data?.data?.length || 0,
          currentFXRate: 118.45,
          completedExports: completedExports.length,
          totalValue: totalValue
        };
        
        setStats(newStats);
        
        // Store previous stats for trend calculation
        if (!previousStats) {
          setPreviousStats(newStats);
        }

        // Sort by updatedAt for recent activity
        const sortedExports = [...allExports].sort((a, b) => 
          new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        setRecentActivity(sortedExports.slice(0, 8));
        
        // Simulate blockchain metrics (in production, get from backend)
        setBlockchainMetrics({
          totalTransactions: allExports.length * 3, // Estimate: create + updates
          blockHeight: 1000 + allExports.length,
          averageBlockTime: 2.5,
          networkStatus: 'healthy'
        });

        // Generate workflow stage data for line chart with actor information
        // v2.0 Workflow: Created → FX → Banking → Quality → Customs → Shipped → Completed
        const workflowStages = [
          { stage: 'Created', status: 'FX_PENDING', icon: 'FileText', actorField: null, org: 'National Bank' },
          { stage: 'FX Approved', status: 'FX_APPROVED', icon: 'DollarSign', actorField: 'fxApprovedBy', org: 'National Bank' },
          { stage: 'Banking', status: 'BANKING_APPROVED', icon: 'Banknote', actorField: 'bankingApprovedBy', org: 'Exporter Bank' },
          { stage: 'Quality', status: 'QUALITY_CERTIFIED', icon: 'Award', actorField: 'qualityCertifiedBy', org: 'NCAT' },
          { stage: 'Customs', status: 'EXPORT_CUSTOMS_CLEARED', icon: 'ShieldCheck', actorField: 'exportCustomsClearedBy', org: 'Customs' },
          { stage: 'Shipped', status: 'SHIPPED', icon: 'Ship', actorField: 'shippingLineId', org: 'Shipping Line' },
          { stage: 'Completed', status: 'COMPLETED', icon: 'CheckCircle', actorField: null, org: 'System' }
        ];

        const workflowChartData = workflowStages.map((stage, index) => {
          const exportsAtStage = allExports.filter(exp => {
            // Count exports that reached this stage or beyond
            const statusOrder = {
              'FX_PENDING': 1,
              'FX_APPROVED': 2,
              'BANKING_PENDING': 2,
              'BANKING_APPROVED': 3,
              'QUALITY_PENDING': 3,
              'QUALITY_CERTIFIED': 4,
              'EXPORT_CUSTOMS_PENDING': 4,
              'EXPORT_CUSTOMS_CLEARED': 5,
              'SHIPMENT_SCHEDULED': 5,
              'SHIPPED': 6,
              'ARRIVED': 6,
              'COMPLETED': 7
            };
            return (statusOrder[exp.status] || 0) >= (index + 1);
          });

          // Get unique actors for this stage
          const actors = new Set();
          exportsAtStage.forEach(exp => {
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
            actorsCount: actors.size
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
  }, []); // Remove previousStats dependency to prevent infinite loop

  // Calculate real trends
  const calculateTrend = (current, previous) => {
    if (!previous || previous === 0) return { value: 0, direction: 'neutral' };
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
    };
  };

  const statCards = [
    {
      title: 'Total Exports',
      value: stats.totalExports,
      icon: <Package size={24} />,
      color: 'primary',
      trend: calculateTrend(stats.totalExports, previousStats?.totalExports),
      subtitle: 'On-chain records'
    },
    {
      title: 'Completed Exports',
      value: stats.completedExports,
      icon: <CheckCircle size={24} />,
      color: 'success',
      trend: calculateTrend(stats.completedExports, previousStats?.completedExports),
      subtitle: 'Successfully delivered'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingCertifications,
      icon: <Clock size={24} />,
      color: 'warning',
      trend: calculateTrend(stats.pendingCertifications, previousStats?.pendingCertifications),
      subtitle: 'Awaiting certification'
    },
    {
      title: 'Total Value (USD)',
      value: `$${(stats.totalValue / 1000).toFixed(1)}K`,
      icon: <DollarSign size={24} />,
      color: 'secondary',
      trend: calculateTrend(stats.totalValue, previousStats?.totalValue),
      subtitle: 'Completed exports'
    }
  ];

  return (
    <Box className={`organization-${user.organizationId || 'exporter-bank'}`} sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1">Dashboard</Typography>
          <Typography variant="subtitle1">Welcome back, {user.username}!</Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Activity size={20} />
          <Typography variant="body1">{user.organization}</Typography>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statCards.map((stat, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box sx={{ color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">{stat.title}</Typography>
                    <Typography variant="h4" sx={{ my: 0.5 }}>{stat.value}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {stat.trend.direction === 'up' && (
                        <>
                          <TrendingUp size={14} color="#4CAF50" />
                          <Typography variant="caption" color="success.main">+{stat.trend.value}%</Typography>
                        </>
                      )}
                      {stat.trend.direction === 'down' && (
                        <>
                          <TrendingDown size={14} color="#F44336" />
                          <Typography variant="caption" color="error.main">-{stat.trend.value}%</Typography>
                        </>
                      )}
                      {stat.trend.direction === 'neutral' && (
                        <Typography variant="caption" color="text.secondary">No change</Typography>
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{stat.subtitle}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Blockchain Metrics */}
      <Card sx={{ 
        mb: 3, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: theme.palette.primary.contrastText 
      }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Database size={24} stroke={theme.palette.primary.contrastText} />
              <Typography variant="h6">Blockchain Network Status</Typography>
            </Stack>
            <Chip 
              label={blockchainMetrics.networkStatus.toUpperCase()} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: theme.palette.primary.contrastText, 
                fontWeight: 600 
              }}
            />
          </Stack>
          <Grid container spacing={3}>
            <Grid xs={12} sm={3}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Total Transactions</Typography>
              <Typography variant="h5">{blockchainMetrics.totalTransactions}</Typography>
            </Grid>
            <Grid xs={12} sm={3}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Block Height</Typography>
              <Typography variant="h5">{blockchainMetrics.blockHeight}</Typography>
            </Grid>
            <Grid xs={12} sm={3}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Avg Block Time</Typography>
              <Typography variant="h5">{blockchainMetrics.averageBlockTime}s</Typography>
            </Grid>
            <Grid xs={12} sm={3}>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>Network Peers</Typography>
              <Typography variant="h5">4 Orgs</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Blockchain Workflow Funnel Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <GitBranch size={24} />
              <Typography variant="h6">Export Workflow Progress (Blockchain Stages)</Typography>
            </Stack>
            <Chip label="All Exports" size="small" variant="outlined" />
          </Stack>
          
          {workflowData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart
                data={workflowData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                <XAxis 
                  dataKey="stage" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  label={{ value: 'Number of Exports', angle: -90, position: 'insideLeft', style: { fill: theme.palette.text.secondary } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 4,
                    padding: '12px'
                  }}
                  labelStyle={{ color: theme.palette.text.primary, fontWeight: 600, marginBottom: 8 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <Box sx={{ 
                          bgcolor: theme.palette.background.paper, 
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 1,
                          p: 1.5,
                          minWidth: 200
                        }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                            {data.stage}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Stack spacing={0.5}>
                            <Typography variant="body2">
                              <strong>Organization:</strong> {data.organization}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Exports:</strong> {data.count}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Completion:</strong> {data.percentage}%
                            </Typography>
                            {data.actorsCount > 0 && (
                              <>
                                <Divider sx={{ my: 0.5 }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Approved by ({data.actorsCount}):
                                </Typography>
                                <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.875rem' }}>
                                  {data.actors.slice(0, 5).map((actor, idx) => (
                                    <li key={idx}>
                                      <Typography variant="caption">{actor}</Typography>
                                    </li>
                                  ))}
                                  {data.actors.length > 5 && (
                                    <li>
                                      <Typography variant="caption" color="text.secondary">
                                        +{data.actors.length - 5} more
                                      </Typography>
                                    </li>
                                  )}
                                </Box>
                              </>
                            )}
                          </Stack>
                        </Box>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  name="Exports"
                />
                <Line 
                  type="monotone" 
                  dataKey="percentage" 
                  stroke={theme.palette.success.main} 
                  strokeWidth={2}
                  dot={{ fill: theme.palette.success.main, r: 4 }}
                  name="Completion %"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <GitBranch size={48} color="#9E9E9E" style={{ marginBottom: 16 }} />
              <Typography color="text.secondary">No workflow data available</Typography>
            </Box>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="caption" color="text.secondary" display="block" sx={{ textAlign: 'center' }}>
            📊 This chart shows how many exports reach each stage of the blockchain workflow.
            The area represents total exports at each stage, showing the funnel effect as some exports drop off or get rejected.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        <Grid xs={12} md={9}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Recent Blockchain Activity</Typography>
                <Chip label="Live" size="small" color="success" icon={<Activity size={14} />} />
              </Stack>
              <Stack spacing={1.5}>
                {recentActivity.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AlertCircle size={48} color="#9E9E9E" style={{ marginBottom: 16 }} />
                    <Typography color="text.secondary">No recent activity</Typography>
                  </Box>
                ) : (
                  recentActivity.map((activity, index) => (
                    <Box key={activity.exportId}>
                      <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ py: 1 }}>
                        <Box sx={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          bgcolor: 'primary.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Database size={16} stroke={theme.palette.primary.main} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" fontWeight={500}>
                              Export {activity.exportId}
                            </Typography>
                            <Chip 
                              label={activity.status?.replace(/_/g, ' ')} 
                              size="small" 
                              color={activity.status === 'COMPLETED' ? 'success' : activity.status === 'PENDING' ? 'warning' : 'primary'}
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Stack>
                          <Typography variant="caption" color="text.secondary">
                            {activity.coffeeType} • {activity.quantity} kg • ${activity.estimatedValue?.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            Updated: {new Date(activity.updatedAt).toLocaleString()}
                          </Typography>
                          {/* Show who took action - v2.0: includes banking approver */}
                          {(activity.fxApprovedBy || activity.bankingApprovedBy || activity.qualityCertifiedBy || activity.exportCustomsClearedBy) && (
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                              <Users size={12} color="#9E9E9E" />
                              <Typography variant="caption" color="text.secondary">
                                {activity.fxApprovedBy && `FX: ${activity.fxApprovedBy}`}
                                {activity.bankingApprovedBy && ` • Banking: ${activity.bankingApprovedBy}`}
                                {activity.qualityCertifiedBy && ` • Quality: ${activity.qualityCertifiedBy}`}
                                {activity.exportCustomsClearedBy && ` • Customs: ${activity.exportCustomsClearedBy}`}
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
          </Card>
        </Grid>

        <Grid xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
              <Stack spacing={1.5}>
                {/* Exporter Portal Quick Actions - Off-chain: Submits to National Bank */}
                {(user.organizationId === 'exporter' || user.organizationId === 'exporter-portal') && (
                  <>
                    <Button variant="contained" startIcon={<Package size={18} />} fullWidth href="/exports">
                      Create Export Request
                    </Button>
                    <Button variant="outlined" startIcon={<Search size={18} />} fullWidth href="/exports">
                      View My Requests
                    </Button>
                    <Button variant="outlined" startIcon={<Upload size={18} />} fullWidth href="/exports">
                      Upload Documents
                    </Button>
                  </>
                )}
                
                {/* NCAT Quick Actions - THIRD STEP: Quality Certification (after Banking) */}
                {user.organizationId === 'ncat' && (
                  <>
                    <Button variant="contained" startIcon={<Award size={18} />} fullWidth href="/quality">
                      Certify Quality
                    </Button>
                    <Button variant="outlined" startIcon={<FileCheck size={18} />} fullWidth href="/quality">
                      Issue Origin Certificate
                    </Button>
                    <Button variant="outlined" startIcon={<Search size={18} />} fullWidth href="/quality">
                      View Pending Requests
                    </Button>
                    <Button variant="outlined" startIcon={<Upload size={18} />} fullWidth href="/quality">
                      Upload Documents
                    </Button>
                  </>
                )}
                
                {/* National Bank Quick Actions - FIRST STEP: Creates blockchain record & FX approval */}
                {user.organizationId === 'nationalbank' && (
                  <>
                    <Button variant="contained" startIcon={<Package size={18} />} fullWidth href="/exports">
                      Create Export on Blockchain
                    </Button>
                    <Button variant="outlined" startIcon={<CheckCircle size={18} />} fullWidth href="/fx-approval">
                      Approve FX Request
                    </Button>
                    <Button variant="outlined" startIcon={<DollarSign size={18} />} fullWidth href="/fx-rates">
                      Manage FX Rates
                    </Button>
                    <Button variant="outlined" startIcon={<Users size={18} />} fullWidth href="/users">
                      Manage Exporter Users
                    </Button>
                  </>
                )}
                
                {/* Exporter Bank Quick Actions - SECOND STEP: Financial document validation (after FX) */}
                {(user.organizationId === 'exporter' || user.organizationId === 'exporterbank') && (
                  <>
                    <Button variant="contained" startIcon={<Banknote size={18} />} fullWidth href="/banking">
                      Approve Banking/Financial Docs
                    </Button>
                    <Button variant="outlined" startIcon={<FileText size={18} />} fullWidth href="/banking">
                      Review Commercial Invoice
                    </Button>
                    <Button variant="outlined" startIcon={<Search size={18} />} fullWidth href="/banking">
                      View Pending Reviews
                    </Button>
                  </>
                )}
                
                {/* Shipping Line Quick Actions - FIFTH STEP: Shipment + Arrival Notification (after Customs) */}
                {user.organizationId === 'shipping' && (
                  <>
                    <Button variant="contained" startIcon={<Ship size={18} />} fullWidth href="/shipments">
                      Schedule Shipment
                    </Button>
                    <Button variant="outlined" startIcon={<CheckCircle size={18} />} fullWidth href="/shipments">
                      Confirm Shipment
                    </Button>
                    <Button variant="outlined" startIcon={<Plane size={18} />} fullWidth href="/shipments">
                      Notify Arrival
                    </Button>
                    <Button variant="outlined" startIcon={<Search size={18} />} fullWidth href="/shipments">
                      Track Shipments
                    </Button>
                    <Button variant="outlined" startIcon={<Upload size={18} />} fullWidth href="/shipments">
                      Upload Documents
                    </Button>
                  </>
                )}
                
                {/* Custom Authorities Quick Actions - FOURTH STEP: Export Customs (after Quality) */}
                {user.organizationId === 'customauthorities' && (
                  <>
                    <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>Export Customs (Before Shipment)</Typography>
                    <Button variant="contained" startIcon={<ShieldCheck size={18} />} fullWidth href="/customs/export">
                      Clear Export Customs
                    </Button>
                    <Button variant="outlined" startIcon={<Search size={18} />} fullWidth href="/customs/export">
                      View Export Pending
                    </Button>
                    
                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 0.5, fontWeight: 600 }}>Import Customs (After Arrival)</Typography>
                    <Button variant="contained" startIcon={<ShieldCheck size={18} />} fullWidth href="/customs/import">
                      Clear Import Customs
                    </Button>
                    <Button variant="outlined" startIcon={<PackageCheck size={18} />} fullWidth href="/customs/import">
                      Confirm Delivery
                    </Button>
                    <Button variant="outlined" startIcon={<Search size={18} />} fullWidth href="/customs/import">
                      View Import Pending
                    </Button>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
