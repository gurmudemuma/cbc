// @ts-nocheck
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Plus,
  Package,
  Eye,
  Edit,
  Download,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useExports } from '../hooks/useExports';
import { getWorkflowProgress } from '../utils/workflowManager';
import { User, Organization, ExportData } from '../types/shared-types';

interface ExportDashboardProps {
  user?: User;
  org?: Organization;
}

const ExportDashboard: React.FC<ExportDashboardProps> = ({ user: _user, org: _org }) => {
  const navigate = useNavigate();
  const { exports, loading, error } = useExports();

  // Map exports to dashboard format with proper typing
  const exportRequests: ExportData[] = exports as ExportData[];

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'warning' | 'success' => {
    if (status === 'COMPLETED') return 'success';
    if (status.includes('REJECTED') || status === 'CANCELLED') return 'error';
    if (status.includes('PENDING')) return 'warning';
    if (status.includes('APPROVED') || status.includes('VERIFIED') || status.includes('CLEARED')) return 'info';
    return 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DRAFT' || status === 'PENDING') return <Edit size={16} />;
    if (status.includes('PENDING')) return <Clock size={16} />;
    if (status.includes('APPROVED') || status.includes('VERIFIED')) return <TrendingUp size={16} />;
    if (status === 'COMPLETED') return <CheckCircle size={16} />;
    if (status.includes('REJECTED')) return <AlertTriangle size={16} />;
    return <Package size={16} />;
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
      inProgress: exportRequests.filter(exp =>
        !exp.status.includes('REJECTED') &&
        exp.status !== 'COMPLETED' &&
        exp.status !== 'CANCELLED'
      ).length,
    };
  };

  const stats = getExportStats();

  return (
    <Box sx={{ p: 2 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load exports: {error}
        </Alert>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Export Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<span><Plus size={20} /></span>}
            onClick={() => navigate('/exports')}
          >
            Create Export Request
          </Button>
        </Box>

        {/* Quick Action Banner */}
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              endIcon={<span><ArrowRight size={16} /></span>}
              onClick={() => navigate('/exports')}
            >
              Get Started
            </Button>
          }
        >
          <Typography variant="body2" fontWeight="medium">
            Ready to create a new export request? Use our comprehensive 3-step wizard to submit all required details and documents.
          </Typography>
        </Alert>

        {/* Statistics Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <span><Package size={40} color="#1976d2" style={{ marginBottom: 8 }} /></span>
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
                <span><TrendingUp size={40} color="#2e7d32" style={{ marginBottom: 8 }} /></span>
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
                <span><Package size={40} color="#ed6c02" style={{ marginBottom: 8 }} /></span>
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
                <span><CheckCircle size={40} color="#2e7d32" style={{ marginBottom: 8 }} /></span>
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Coffee Type</TableCell>
                    <TableCell>Quantity (kg)</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Est. Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exportRequests.map((request: ExportData) => (
                    <TableRow key={request.exportId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {request.exportId}
                        </Typography>
                      </TableCell>
                      <TableCell>{request.coffeeType}</TableCell>
                      <TableCell>{request.quantity.toLocaleString()}</TableCell>
                      <TableCell>{request.destinationCountry}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(request.status)}
                          label={request.status.replace(/_/g, ' ')}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={getWorkflowProgress(request.status)}
                            sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {getWorkflowProgress(request.status)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        ${request.estimatedValue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => navigate(`/exports/${request.exportId}`)}>
                            <span><Eye size={18} /></span>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" disabled={request.status !== 'DRAFT' && request.status !== 'PENDING'}>
                            <span><Edit size={18} /></span>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <span><Download size={18} /></span>
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
                No export requests found. Click "Create Export Request" above to get started with our comprehensive export wizard.
              </Alert>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default ExportDashboard;
