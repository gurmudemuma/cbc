import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
<<<<<<< HEAD
=======
  Grid,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
<<<<<<< HEAD
=======
  Alert,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
<<<<<<< HEAD
  Stack,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Package,
  Plus,
  Eye,
  Edit,
=======
} from '@mui/material';
import {
  Plus,
  Package,
  Eye,
  Edit,
  Download,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
<<<<<<< HEAD
import { CommonPageProps } from '../types';
import { DashboardContainer, PulseChip } from './Dashboard.styles';
import { ModernStatCard, ModernSectionHeader, ModernEmptyState } from '../components/ModernUIKit';
import { useExports, useCreateExport, useExportStats } from '../hooks/useExportManager';

interface ExportDashboardProps extends CommonPageProps { }


const ExportDashboard = ({ user, org }: ExportDashboardProps): JSX.Element => {
  const theme = useTheme();
  // Use Real Data Hook
  const { exports: exportRequests, loading, refreshExports } = useExports();
  const { createExport, loading: createLoading } = useCreateExport();
  // Use real backend stats
  const { stats, loading: statsLoading } = useExportStats();

=======
import { motion } from 'framer-motion';
import { CommonPageProps } from '../types';

interface ExportDashboardProps extends CommonPageProps {}

const ExportDashboard = ({ user, org }: ExportDashboardProps): JSX.Element => {
  const [exportRequests, setExportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newExportData, setNewExportData] = useState({
    coffeeType: '',
    quantity: '',
    destination: '',
    targetPrice: '',
  });

<<<<<<< HEAD
  const getStatusColor = (status: string) => {
=======
  // Mock data - replace with actual API call
  useEffect(() => {
    const mockExports = [
      {
        id: 'EXP-001',
        coffeeType: 'Arabica Grade 1',
        quantity: 1000,
        destination: 'Germany',
        status: 'DRAFT',
        createdDate: '2024-01-15',
        estimatedValue: 5000,
        progress: 10,
      },
      {
        id: 'EXP-002',
        coffeeType: 'Sidamo Organic',
        quantity: 500,
        destination: 'USA',
        status: 'SUBMITTED',
        createdDate: '2024-01-10',
        estimatedValue: 3500,
        progress: 25,
      },
      {
        id: 'EXP-003',
        coffeeType: 'Yirgacheffe',
        quantity: 750,
        destination: 'Japan',
        status: 'IN_PROGRESS',
        createdDate: '2024-01-05',
        estimatedValue: 4200,
        progress: 65,
      },
      {
        id: 'EXP-004',
        coffeeType: 'Harrar',
        quantity: 300,
        destination: 'Italy',
        status: 'COMPLETED',
        createdDate: '2023-12-20',
        estimatedValue: 2100,
        progress: 100,
      },
    ];

    setTimeout(() => {
      setExportRequests(mockExports);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

<<<<<<< HEAD
  const getStatusIcon = (status: string) => {
=======
  const getStatusIcon = (status) => {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    switch (status) {
      case 'DRAFT': return <Edit size={16} />;
      case 'SUBMITTED': return <Clock size={16} />;
      case 'IN_PROGRESS': return <TrendingUp size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      case 'REJECTED': return <AlertTriangle size={16} />;
      default: return <Package size={16} />;
    }
  };

<<<<<<< HEAD
  const handleCreateExport = async () => {
    try {
      if (!newExportData.coffeeType || !newExportData.quantity || !newExportData.destination) return;

      await createExport({
        coffeeType: newExportData.coffeeType,
        quantity: parseInt(newExportData.quantity, 10),
        destinationCountry: newExportData.destination,
        estimatedValue: parseInt(newExportData.targetPrice || '0', 10) * parseInt(newExportData.quantity, 10),
        status: 'DRAFT'
      });

      setCreateDialogOpen(false);
      setNewExportData({
        coffeeType: '',
        quantity: '',
        destination: '',
        targetPrice: '',
      });
      // Refresh the list to show the new item
      refreshExports();
    } catch (error) {
      console.error('Failed to create export', error);
      alert('Failed to create export request. Please try again.');
    }
  };

  // Stats are now fetched from backend via useExportStats hook
  // Removed client-side calculation function getExportStats

  const statCards = [
    { title: 'Total Requests', value: stats.totalExports || 0, icon: <Package size={24} />, color: 'primary' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Active & Historical' },
    { title: 'Total Value', value: `$${(stats.totalValue || 0).toLocaleString()}`, icon: <TrendingUp size={24} />, color: 'success' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Estimated USD' },
    { title: 'Active Shipments', value: stats.activeShipments || 0, icon: <Package size={24} />, color: 'warning' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'In Transit' },
    { title: 'Completed', value: stats.completedExports || 0, icon: <CheckCircle size={24} />, color: 'info' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Successful Shipments' },
  ];

  return (
    <DashboardContainer>
      <ModernSectionHeader
        title="Export Dashboard"
        subtitle="Manage your coffee exports, track shipments, and view market insights."
        action={
          <Button
            variant="contained"
            size="large"
            startIcon={<Plus size={20} />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}
          >
            Create Request
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <ModernStatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: theme.shadows[3] }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight={700}>Active Exports</Typography>
              <PulseChip label="Real-time Sync" size="small" color="success" />
            </Stack>
          </Box>

          {loading ? <LinearProgress /> : (
            <TableContainer>
=======
  const handleCreateExport = () => {
    // TODO: Implement export creation
    console.log('Creating export:', newExportData);
    setCreateDialogOpen(false);
    setNewExportData({
      coffeeType: '',
      quantity: '',
      destination: '',
      targetPrice: '',
    });
  };

  const getExportStats = () => {
    const totalValue = exportRequests.reduce((sum, exp) => sum + exp.estimatedValue, 0);
    const totalQuantity = exportRequests.reduce((sum, exp) => sum + exp.quantity, 0);
    
    return {
      totalRequests: exportRequests.length,
      totalValue,
      totalQuantity,
      avgValue: exportRequests.length > 0 ? totalValue / exportRequests.length : 0,
      completed: exportRequests.filter(exp => exp.status === 'COMPLETED').length,
      inProgress: exportRequests.filter(exp => exp.status === 'IN_PROGRESS').length,
    };
  };

  const stats = getExportStats();

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Export Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<Plus size={20} />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Export Request
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Package size={40} color="#1976d2" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="primary" gutterBottom>
                  {stats.totalRequests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Requests
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  ${stats.totalValue.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Package size={40} color="#ed6c02" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {stats.totalQuantity.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Quantity (kg)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {stats.completed}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Export Requests Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              My Export Requests
            </Typography>
            
            {loading ? (
              <LinearProgress sx={{ mb: 2 }} />
            ) : null}

            <TableContainer component={Paper} variant="outlined">
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Coffee Type</TableCell>
<<<<<<< HEAD
                    <TableCell>Quantity</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Progress</TableCell>
                    <TableCell>Value (USD)</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportRequests.length > 0 ? (
                    exportRequests.map((request) => (
                      <TableRow key={request.exportId || request.id} hover>
                        <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                          {request.exportId || request.id}
                        </TableCell>
                        <TableCell>{request.coffeeType}</TableCell>
                        <TableCell>{(request.quantity || 0).toLocaleString()} kg</TableCell>
                        <TableCell>{request.destinationCountry || request.destination}</TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(request.status)}
                            label={request.status ? request.status.replace(/_/g, ' ') : 'UNKNOWN'}
                            color={getStatusColor(request.status)}
                            size="small"
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              {/* Simple progress mapping based on status could be added here */}
                              <Typography variant="caption" fontWeight={700}>
                                {request.status === 'COMPLETED' ? 100 : request.status === 'DRAFT' ? 10 : 50}%
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={request.status === 'COMPLETED' ? 100 : request.status === 'DRAFT' ? 10 : 50}
                              sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: theme.palette.action.selected,
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 3,
                                  bgcolor: request.status === 'COMPLETED' ? theme.palette.success.main : theme.palette.primary.main
                                }
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          ${(request.estimatedValue || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton size="small" color="primary">
                                <Eye size={18} />
                              </IconButton>
                            </Tooltip>
                            {request.status === 'DRAFT' && (
                              <Tooltip title="Edit">
                                <IconButton size="small">
                                  <Edit size={18} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <ModernEmptyState
                          title="No Exports Found"
                          description="Get started by creating your first export request."
                          icon={<Package />}
                          action={{
                            label: 'Create Now',
                            onClick: () => setCreateDialogOpen(true)
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle variant="h6" fontWeight={700}>Create New Export</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid xs={12}>
              <TextField select fullWidth label="Coffee Type" value={newExportData.coffeeType} onChange={(e) => setNewExportData({ ...newExportData, coffeeType: e.target.value })}>
                {['Arabica Grade 1', 'Sidamo Organic', 'Yirgacheffe', 'Harrar', 'Limu'].map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={6}>
              <TextField fullWidth type="number" label="Quantity (kg)" value={newExportData.quantity} onChange={(e) => setNewExportData({ ...newExportData, quantity: e.target.value })} />
            </Grid>
            <Grid xs={6}>
              <TextField fullWidth select label="Destination" value={newExportData.destination} onChange={(e) => setNewExportData({ ...newExportData, destination: e.target.value })}>
                {['Germany', 'USA', 'Japan', 'Italy', 'Netherlands'].map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={12}>
              <TextField fullWidth type="number" label="Target Price (USD/kg)" value={newExportData.targetPrice} onChange={(e) => setNewExportData({ ...newExportData, targetPrice: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateExport} disabled={createLoading || !newExportData.coffeeType}>
            {createLoading ? 'Creating...' : 'Create Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
=======
                    <TableCell>Quantity (kg)</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Est. Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {request.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{request.coffeeType}</TableCell>
                      <TableCell>{request.quantity.toLocaleString()}</TableCell>
                      <TableCell>{request.destination}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(request.status)}
                          label={request.status.replace('_', ' ')}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={request.progress}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {request.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        ${request.estimatedValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <Eye size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" disabled={request.status !== 'DRAFT'}>
                            <Edit size={18} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <Download size={18} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {exportRequests.length === 0 && !loading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No export requests found. Create your first export request to get started.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Create Export Dialog */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Export Request</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Coffee Type"
                  value={newExportData.coffeeType}
                  onChange={(e) => setNewExportData(prev => ({ ...prev, coffeeType: e.target.value }))}
                >
                  <MenuItem value="Arabica Grade 1">Arabica Grade 1</MenuItem>
                  <MenuItem value="Sidamo Organic">Sidamo Organic</MenuItem>
                  <MenuItem value="Yirgacheffe">Yirgacheffe</MenuItem>
                  <MenuItem value="Harrar">Harrar</MenuItem>
                  <MenuItem value="Limu">Limu</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity (kg)"
                  type="number"
                  value={newExportData.quantity}
                  onChange={(e) => setNewExportData(prev => ({ ...prev, quantity: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Target Price ($/kg)"
                  type="number"
                  value={newExportData.targetPrice}
                  onChange={(e) => setNewExportData(prev => ({ ...prev, targetPrice: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Destination Country"
                  value={newExportData.destination}
                  onChange={(e) => setNewExportData(prev => ({ ...prev, destination: e.target.value }))}
                >
                  <MenuItem value="Germany">Germany</MenuItem>
                  <MenuItem value="USA">USA</MenuItem>
                  <MenuItem value="Japan">Japan</MenuItem>
                  <MenuItem value="Italy">Italy</MenuItem>
                  <MenuItem value="Netherlands">Netherlands</MenuItem>
                  <MenuItem value="Belgium">Belgium</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateExport}
              disabled={!newExportData.coffeeType || !newExportData.quantity || !newExportData.destination}
            >
              Create Request
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  );
};

export default ExportDashboard;
