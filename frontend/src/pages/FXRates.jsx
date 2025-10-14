import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, TrendingUp, Search } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Divider
} from '@mui/material';

const FXRates = ({ user }) => {
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('approve'); // 'approve' or 'reject'
  const [formData, setFormData] = useState({
    fxApprovalId: '',
    approvedBy: user?.username || '',
    rejectionReason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setApiBaseUrl(API_ENDPOINTS.nationalbank);
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/fx/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter(exp => exp.status === 'PENDING');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(exp => exp.status === 'FX_APPROVED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter(exp => exp.status === 'FX_REJECTED');
    }

    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleApprove = (exportData) => {
    setSelectedExport(exportData);
    setModalType('approve');
    setFormData({
      fxApprovalId: `FX-${Date.now()}`,
      approvedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleReject = (exportData) => {
    setSelectedExport(exportData);
    setModalType('reject');
    setFormData({
      fxApprovalId: '',
      approvedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'approve') {
        await apiClient.post('/fx/approve', {
          exportId: selectedExport.exportId,
          fxApprovalId: formData.fxApprovalId,
          approvedBy: formData.approvedBy
        });
      } else {
        await apiClient.post('/fx/reject', {
          exportId: selectedExport.exportId,
          rejectionReason: formData.rejectionReason,
          rejectedBy: formData.approvedBy
        });
      }
      
      setIsModalOpen(false);
      fetchExports();
    } catch (error) {
      console.error('Error processing FX approval:', error);
      alert('Failed to process FX approval');
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
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Foreign Exchange Approval</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>Review and approve FX for export transactions</Typography>

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
                  <Typography variant="h6">{exports.filter(e => e.status === 'PENDING').length}</Typography>
                  <Typography variant="body2">Pending Approval</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'FX_APPROVED').length}</Typography>
                  <Typography variant="body2">Approved</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'FX_REJECTED').length}</Typography>
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
              <Typography variant="h6" sx={{ mb: 2 }}>FX Approval Requests</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>USD Amount</TableCell>
                      <TableCell>KES Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExports.map(exp => (
                      <TableRow key={exp.exportId}>
                        <TableCell>{exp.exportId}</TableCell>
                        <TableCell>{exp.exporterName}</TableCell>
                        <TableCell>{exp.destinationCountry}</TableCell>
                        <TableCell>${exp.estimatedValue.toLocaleString()}</TableCell>
                        <TableCell>KES {calculateFXAmount(exp.estimatedValue).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={exp.status.replace(/_/g, ' ')} 
                            color={getStatusColor(exp.status)}
                          />
                        </TableCell>
                        <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {exp.status === 'PENDING' ? (
                            <Grid container spacing={1}>
                              <Grid item>
                                <Button variant="contained" color="success" size="small" startIcon={<CheckCircle />} onClick={() => handleApprove(exp)}>
                                  Approve
                                </Button>
                              </Grid>
                              <Grid item>
                                <Button variant="contained" color="error" size="small" startIcon={<XCircle />} onClick={() => handleReject(exp)}>
                                  Reject
                                </Button>
                              </Grid>
                            </Grid>
                          ) : (
                            <Button variant="outlined" size="small">View</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredExports.length === 0 && (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <DollarSign size={48} color="action.disabled" />
                  <Typography>No exports found</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
              <Stack spacing={2}>
                <Button variant="contained">Update FX Rate</Button>
                <Button variant="outlined">Approve Request</Button>
                <Button variant="outlined">Generate Report</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{modalType === 'approve' ? 'Approve Foreign Exchange' : 'Reject FX Request'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Export ID:</strong> {selectedExport?.exportId}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Exporter:</strong> {selectedExport?.exporterName}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Destination:</strong> {selectedExport?.destinationCountry}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>USD Amount:</strong> ${selectedExport?.estimatedValue.toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>KES Amount (@ 118.45):</strong> KES {calculateFXAmount(selectedExport?.estimatedValue || 0).toLocaleString()}</Typography>
            </Grid>
            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
            {modalType === 'approve' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="FX Approval ID"
                    value={formData.fxApprovalId}
                    onChange={(e) => setFormData({ ...formData, fxApprovalId: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Approved By"
                    value={formData.approvedBy}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                    required
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Rejection Reason"
                    value={formData.rejectionReason}
                    onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                    placeholder="Provide detailed reason for rejection..."
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Rejected By"
                    value={formData.approvedBy}
                    onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                    required
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color={modalType === 'approve' ? 'success' : 'error'}
            disabled={
              modalType === 'approve' 
                ? !formData.fxApprovalId || !formData.approvedBy
                : !formData.rejectionReason || !formData.approvedBy
            }
          >
            {modalType === 'approve' ? 'Approve FX' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FXRates;
