import { useState, useEffect } from 'react';
import { Package, Award, DollarSign, Ship, TrendingUp, TrendingDown, Activity, Database, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { getApiUrl } from '../config/api.config';
import { Card, CardContent, Typography, Box, Button, Stack, Chip, LinearProgress, Divider } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

const Dashboard = ({ user }) => {
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
    <Box sx={{ p: 3 }}>
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
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #8E24AA 0%, #AB47BC 100%)', color: 'white' }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Database size={24} />
              <Typography variant="h6">Blockchain Network Status</Typography>
            </Stack>
            <Chip 
              label={blockchainMetrics.networkStatus.toUpperCase()} 
              size="small" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
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
                          <Database size={16} color="#8E24AA" />
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
              <Stack spacing={2}>
                {user.organizationId === 'exporter' && (
                  <Button variant="contained" startIcon={<Package size={20} />} fullWidth>
                    Create New Export
                  </Button>
                )}
                {user.organizationId === 'ncat' && (
                  <Button variant="contained" startIcon={<Award size={20} />} fullWidth>
                    Issue Certificate
                  </Button>
                )}
                {user.organizationId === 'shipping' && (
                  <Button variant="contained" startIcon={<Ship size={20} />} fullWidth>
                    Track Shipment
                  </Button>
                )}
                {user.organizationId === 'nationalbank' && (
                  <Button variant="contained" startIcon={<DollarSign size={20} />} fullWidth>
                    Update FX Rate
                  </Button>
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