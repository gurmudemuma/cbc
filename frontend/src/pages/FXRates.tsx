import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, TrendingUp, Search, Eye } from 'lucide-react';
import apiClient from '../services/api';
<<<<<<< HEAD
import { useExports } from '../hooks/useExportManager';
=======
import { useExports } from '../hooks/useExports';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
import NBEFXApprovalForm from '../components/forms/NBEFXApprovalForm';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
} from '@mui/material';

interface FXRatesProps {
  user: any;
  org: string | null;
}

const FXRates = ({ user, org }: FXRatesProps): JSX.Element => {
  const { exports: allExports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  const exports = allExports.filter((e) => e.status === 'FX_APPLICATION_PENDING' || e.status === 'FX_PENDING' || e.status === 'FX_APPROVED' || e.status === 'FX_REJECTED');
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fxApprovalId: '',
    approvedBy: user?.username || '',
    rejectionReason: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // API base URL is set in App.jsx based on user's organization

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter((exp) => exp.status === 'PENDING');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter((exp) => exp.status === 'FX_APPROVED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((exp) => exp.status === 'FX_REJECTED');
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      await apiClient.post(`/nbe/fx/${selectedExport.exportId}/approve`, data);
      setIsModalOpen(false);
      setSelectedExport(null);
      refreshExports();
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async ({ category, reason }) => {
    setLoading(true);
    try {
      await apiClient.post(`/nbe/fx/${selectedExport.exportId}/reject`, { category, reason });
      setIsModalOpen(false);
      setSelectedExport(null);
      refreshExports();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      PENDING: 'warning',
      FX_APPROVED: 'success',
      FX_REJECTED: 'error',
    };
    return statusMap[status] || 'default';
  };

  const calculateFXAmount = (usdAmount) => {
    const fxRate = 118.45; // Mock FX rate KES/USD
    return (usdAmount * fxRate).toFixed(2);
  };

  return (
    <Box className={`organization-${user.organizationId || 'nb-regulatory'}`} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Foreign Exchange Approval</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Review and approve FX for export transactions
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <DollarSign size={24} />
                    <Box>
                      <Typography variant="h6">118.45</Typography>
                      <Typography variant="body2">Current FX Rate (KES/USD)</Typography>
                      <Stack direction="row" alignItems="center" color="success.main">
                        <TrendingUp size={14} />
                        <Typography variant="body2">+0.5%</Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'PENDING').length}
                  </Typography>
                  <Typography variant="body2">Pending Approval</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'FX_APPROVED').length}
                  </Typography>
                  <Typography variant="body2">Approved</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'FX_REJECTED').length}
                  </Typography>
                  <Typography variant="body2">Rejected</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    placeholder="Search exports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search size={20} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Select
                    fullWidth
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                FX Approval Requests
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 520, borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead sx={{ '& th': { fontWeight: 700 } }}>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>USD Amount</TableCell>
                      <TableCell>KES Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExports.map((exp) => (
                      <TableRow key={exp.exportId} hover>
                        <TableCell>{exp.exportId}</TableCell>
                        <TableCell>{exp.exporterName}</TableCell>
                        <TableCell>{exp.destinationCountry}</TableCell>
                        <TableCell>${exp.estimatedValue.toLocaleString()}</TableCell>
                        <TableCell>
                          KES {calculateFXAmount(exp.estimatedValue).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exp.status.replace(/_/g, ' ')}
                            color={getStatusColor(exp.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          {exp.status === 'PENDING' ? (
                            <Grid container spacing={1} justifyContent="flex-end">
                              <Grid item>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  startIcon={<CheckCircle />}
                                  onClick={() => handleApprove(exp)}
                                >
                                  Approve
                                </Button>
                              </Grid>
                              <Grid item>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  startIcon={<XCircle />}
                                  onClick={() => handleReject(exp)}
                                >
                                  Reject
                                </Button>
                              </Grid>
                            </Grid>
                          ) : (
                            <Button variant="outlined" size="small">
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredExports.length === 0 && (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <DollarSign size={48} color="#9E9E9E" />
                  <Typography color="text.secondary">No exports found</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actions
              </Typography>
              <Stack spacing={2}>
                <Button variant="contained">Update FX Rate</Button>
                <Button variant="outlined">Approve Request</Button>
                <Button variant="outlined">Generate Report</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          NBE FX Approval
          <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <XCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedExport && (
            <NBEFXApprovalForm
              exportData={selectedExport}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FXRates;
