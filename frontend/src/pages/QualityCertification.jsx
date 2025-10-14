import { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, Search } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography
} from '@mui/material';

const QualityCertification = ({ user }) => {
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('certify'); // 'certify' or 'reject'
  const [formData, setFormData] = useState({
    qualityGrade: '',
    certifiedBy: user?.username || '',
    rejectionReason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setApiBaseUrl(API_ENDPOINTS.ncat);
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/quality/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter(exp => exp.status === 'FX_APPROVED');
    } else if (statusFilter === 'certified') {
      filtered = filtered.filter(exp => exp.status === 'QUALITY_CERTIFIED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter(exp => exp.status === 'QUALITY_REJECTED');
    }

    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.coffeeType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleCertify = (exportData) => {
    setSelectedExport(exportData);
    setModalType('certify');
    setFormData({
      qualityGrade: '',
      certifiedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleReject = (exportData) => {
    setSelectedExport(exportData);
    setModalType('reject');
    setFormData({
      qualityGrade: '',
      certifiedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'certify') {
        await apiClient.post('/quality/certify', {
          exportId: selectedExport.exportId,
          qualityCertId: `QC-${Date.now()}`,
          qualityGrade: formData.qualityGrade,
          certifiedBy: formData.certifiedBy
        });
      } else {
        await apiClient.post('/quality/reject', {
          exportId: selectedExport.exportId,
          rejectionReason: formData.rejectionReason,
          rejectedBy: formData.certifiedBy
        });
      }
      
      setIsModalOpen(false);
      fetchExports();
    } catch (error) {
      console.error('Error processing quality certification:', error);
      alert('Failed to process quality certification');
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      FX_APPROVED: 'warning',
      QUALITY_CERTIFIED: 'success',
      QUALITY_REJECTED: 'error',
    };
    return statusMap[status] || 'default';
  };

  const qualityGrades = [
    'Grade AA',
    'Grade A',
    'Grade B',
    'Grade C',
    'Premium',
    'Standard'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Quality Certification</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>Review and certify coffee quality for exports</Typography>

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
                    <MenuItem value="pending">Pending Review</MenuItem>
                    <MenuItem value="certified">Certified</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'FX_APPROVED').length}</Typography>
                  <Typography variant="body2">Pending Review</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'QUALITY_CERTIFIED').length}</Typography>
                  <Typography variant="body2">Certified</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'QUALITY_REJECTED').length}</Typography>
                  <Typography variant="body2">Rejected</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Export Records</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Coffee Type</TableCell>
                      <TableCell>Quantity (kg)</TableCell>
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
                        <TableCell>{exp.coffeeType}</TableCell>
                        <TableCell>{exp.quantity.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip 
                            label={exp.status.replace(/_/g, ' ')} 
                            color={getStatusColor(exp.status)}
                          />
                        </TableCell>
                        <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {exp.status === 'FX_APPROVED' ? (
                            <Grid container spacing={1}>
                              <Grid item>
                                <Button variant="contained" color="success" size="small" startIcon={<CheckCircle />} onClick={() => handleCertify(exp)}>
                                  Certify
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
                  <Award size={48} color="action.disabled" />
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
                <Button variant="contained">Issue Certificate</Button>
                <Button variant="outlined">Generate Report</Button>
                <Button variant="outlined">View Pending Reviews</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{modalType === 'certify' ? 'Issue Quality Certificate' : 'Reject Quality'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Export ID:</strong> {selectedExport?.exportId}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Exporter:</strong> {selectedExport?.exporterName}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Coffee Type:</strong> {selectedExport?.coffeeType}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Quantity:</strong> {selectedExport?.quantity.toLocaleString()} kg</Typography>
            </Grid>
            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
            {modalType === 'certify' ? (
              <>
                <Grid item xs={12}>
                  <Select
                    fullWidth
                    label="Quality Grade"
                    value={formData.qualityGrade}
                    onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                    required
                  >
                    <MenuItem value="">Select Grade</MenuItem>
                    {qualityGrades.map(grade => (
                      <MenuItem key={grade} value={grade}>{grade}</MenuItem>
                    ))}
                  </Select>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Certified By"
                    value={formData.certifiedBy}
                    onChange={(e) => setFormData({ ...formData, certifiedBy: e.target.value })}
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
                    value={formData.certifiedBy}
                    onChange={(e) => setFormData({ ...formData, certifiedBy: e.target.value })}
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
            color={modalType === 'certify' ? 'success' : 'error'}
            disabled={
              modalType === 'certify' 
                ? !formData.qualityGrade || !formData.certifiedBy
                : !formData.rejectionReason || !formData.certifiedBy
            }
          >
            {modalType === 'certify' ? 'Issue Certificate' : 'Reject Quality'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityCertification;