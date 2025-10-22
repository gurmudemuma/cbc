import { useState, useEffect } from 'react';
import { ShieldCheck, XCircle, Search, FileText, Calendar, MapPin } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Divider
} from '@mui/material';

const CustomsClearance = ({ user }) => {
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('clear'); // 'clear' or 'reject'
  const [formData, setFormData] = useState({
    clearanceId: '',
    clearedBy: user?.username || '',
    rejectionReason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setApiBaseUrl(API_ENDPOINTS.customauthorities);
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      // Backend should return exports relevant for customs processing
      const response = await apiClient.get('/customs/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching customs exports:', error);
      setExports([]);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter(exp => ['QUALITY_CERTIFIED','SHIPMENT_SCHEDULED'].includes(exp.status));
    } else if (statusFilter === 'cleared') {
      filtered = filtered.filter(exp => exp.status === 'CUSTOMS_CLEARED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter(exp => exp.status === 'CUSTOMS_REJECTED');
    }

    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.destinationCountry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleClear = (exportData) => {
    setSelectedExport(exportData);
    setModalType('clear');
    setFormData({
      clearanceId: `CUST-${Date.now()}`,
      clearedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleReject = (exportData) => {
    setSelectedExport(exportData);
    setModalType('reject');
    setFormData({
      clearanceId: '',
      clearedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'clear') {
        await apiClient.post('/customs/clear', {
          exportId: selectedExport.exportId,
          clearanceId: formData.clearanceId,
          clearedBy: formData.clearedBy
        });
      } else {
        await apiClient.post('/customs/reject', {
          exportId: selectedExport.exportId,
          rejectionReason: formData.rejectionReason,
          rejectedBy: formData.clearedBy
        });
      }
      setIsModalOpen(false);
      fetchExports();
    } catch (error) {
      console.error('Error processing customs action:', error);
      alert('Failed to process customs action');
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      CUSTOMS_CLEARED: 'success',
      CUSTOMS_REJECTED: 'error',
      SHIPMENT_SCHEDULED: 'info',
      SHIPPED: 'primary',
      QUALITY_CERTIFIED: 'warning',
    };
    return statusMap[status] || 'default';
  };

  return (
    <Box className={`organization-${user.organizationId || 'custom-authorities'}`} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Customs Clearance</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>Review export records and issue customs clearance</Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => ['QUALITY_CERTIFIED','SHIPMENT_SCHEDULED','SHIPPED'].includes(e.status)).length}</Typography>
                  <Typography variant="body2">Pending Clearance</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'CUSTOMS_CLEARED').length}</Typography>
                  <Typography variant="body2">Cleared</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'CUSTOMS_REJECTED').length}</Typography>
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
                    <MenuItem value="cleared">Cleared</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Customs Queue</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 520, borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead sx={{ '& th': { fontWeight: 700 } }}>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Quantity (kg)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExports.map(exp => (
                      <TableRow key={exp.exportId} hover>
                        <TableCell>{exp.exportId}</TableCell>
                        <TableCell>{exp.exporterName}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <MapPin size={14} />
                            {exp.destinationCountry}
                          </Stack>
                        </TableCell>
                        <TableCell>{exp.quantity?.toLocaleString?.() || '-'}</TableCell>
                        <TableCell>
                          <Chip 
                            label={exp.status?.replace(/_/g, ' ')} 
                            color={getStatusColor(exp.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell align="right">
                          {['QUALITY_CERTIFIED','SHIPMENT_SCHEDULED'].includes(exp.status) ? (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button variant="contained" size="small" startIcon={<ShieldCheck size={16} />} onClick={() => handleClear(exp)}>
                                Clear
                              </Button>
                              <Button variant="contained" color="error" size="small" startIcon={<XCircle size={16} />} onClick={() => handleReject(exp)}>
                                Reject
                              </Button>
                            </Stack>
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
                  <FileText size={48} color="#9E9E9E" />
                  <Typography color="text.secondary">No exports awaiting customs</Typography>
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
                <Button variant="contained">Issue Clearance</Button>
                <Button variant="outlined">Generate Report</Button>
                <Button variant="outlined">View Cleared</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{modalType === 'clear' ? 'Issue Customs Clearance' : 'Reject at Customs'}</DialogTitle>
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
            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
            {modalType === 'clear' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Clearance ID"
                    value={formData.clearanceId}
                    onChange={(e) => setFormData({ ...formData, clearanceId: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cleared By"
                    value={formData.clearedBy}
                    onChange={(e) => setFormData({ ...formData, clearedBy: e.target.value })}
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
                    value={formData.clearedBy}
                    onChange={(e) => setFormData({ ...formData, clearedBy: e.target.value })}
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
            color={modalType === 'clear' ? 'success' : 'error'}
            disabled={
              modalType === 'clear' 
                ? !formData.clearanceId || !formData.clearedBy
                : !formData.rejectionReason || !formData.clearedBy
            }
          >
            {modalType === 'clear' ? 'Issue Clearance' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomsClearance;
