import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  useTheme,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  Package,
  Plus,
  Eye,
  Edit,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
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

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newExportData, setNewExportData] = useState({
    coffeeType: '',
    quantity: '',
    destination: '',
    targetPrice: '',
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Edit size={16} />;
      case 'SUBMITTED': return <Clock size={16} />;
      case 'IN_PROGRESS': return <TrendingUp size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      case 'REJECTED': return <AlertTriangle size={16} />;
      default: return <Package size={16} />;
    }
  };

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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Coffee Type</TableCell>
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
  );
};

export default ExportDashboard;
