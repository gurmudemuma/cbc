import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
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
} from 'lucide-react';
import { motion } from 'framer-motion';

const ExportDashboard = ({ user, org }) => {
  const [exportRequests, setExportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newExportData, setNewExportData] = useState({
    coffeeType: '',
    quantity: '',
    destination: '',
    targetPrice: '',
  });

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
    switch (status) {
      case 'DRAFT': return 'default';
      case 'SUBMITTED': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'DRAFT': return <Edit size={16} />;
      case 'SUBMITTED': return <Clock size={16} />;
      case 'IN_PROGRESS': return <TrendingUp size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      case 'REJECTED': return <AlertTriangle size={16} />;
      default: return <Package size={16} />;
    }
  };

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
  );
};

export default ExportDashboard;
