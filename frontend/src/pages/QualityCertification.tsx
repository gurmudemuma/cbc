import { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, Search, Eye, Info } from 'lucide-react';
import apiClient from '../services/api';
import { useExports } from '../hooks/useExportManager';
import ECTAQualityForm from '../components/forms/ECTAQualityForm';
import ExportDetailView from '../components/ExportDetailView';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
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
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';

interface QualityCertificationProps {
  user: any;
  org: string | null;
}

const QualityCertification = ({ user, org }: QualityCertificationProps): JSX.Element => {
  const { exports: allExports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  // Show exports ready for quality inspection (ECTA_LICENSE_APPROVED) or already processed
  const exports = allExports.filter((e) => 
    e.status === 'ECTA_QUALITY_PENDING' || 
    e.status === 'ECTA_LICENSE_APPROVED' || 
    e.status === 'ECTA_QUALITY_APPROVED' || 
    e.status === 'ECTA_QUALITY_REJECTED'
  );
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [viewingExport, setViewingExport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // API base URL is set in App.jsx based on user's organization
  // No need to set it here

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter((exp) => exp.status === 'FX_APPROVED');
    } else if (statusFilter === 'certified') {
      filtered = filtered.filter((exp) => exp.status === 'QUALITY_CERTIFIED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((exp) => exp.status === 'QUALITY_REJECTED');
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.coffeeType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/ecta/quality/${selectedExport.exportId}/approve`, data);
      setIsModalOpen(false);
      setSelectedExport(null);
      showNotification(
        `Quality certificate issued successfully for Export ${selectedExport.exportId}. Grade: ${data.qualityGrade}`,
        'success'
      );
      refreshExports();
    } catch (error) {
      console.error('Approval error:', error);
      showNotification(
        `Failed to approve quality: ${error.response?.data?.message || error.response?.data?.error?.message || error.message}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async ({ category, reason }) => {
    setLoading(true);
    try {
      const response = await apiClient.post(`/ecta/quality/${selectedExport.exportId}/reject`, { category, reason });
      setIsModalOpen(false);
      setSelectedExport(null);
      showNotification(
        `Quality rejected for Export ${selectedExport.exportId}. Reason: ${category}`,
        'warning'
      );
      refreshExports();
    } catch (error) {
      console.error('Rejection error:', error);
      showNotification(
        `Failed to reject quality: ${error.response?.data?.message || error.response?.data?.error?.message || error.message}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (exp) => {
    setViewingExport(exp);
    setIsDetailViewOpen(true);
  };

  const getStatusColor = (status) => {
    const statusMap = {
      FX_APPROVED: 'warning',
      QUALITY_CERTIFIED: 'success',
      QUALITY_REJECTED: 'error',
    };
    return statusMap[status] || 'default';
  };

  const qualityGrades = ['Grade AA', 'Grade A', 'Grade B', 'Grade C', 'Premium', 'Standard'];

  return (
    <Box className={`organization-${user.organizationId || 'ecta'}`} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Quality Certification</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Review and certify coffee quality for exports
          </Typography>

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
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'FX_APPROVED').length}
                  </Typography>
                  <Typography variant="body2">Pending Review</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'QUALITY_CERTIFIED').length}
                  </Typography>
                  <Typography variant="body2">Certified</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'QUALITY_REJECTED').length}
                  </Typography>
                  <Typography variant="body2">Rejected</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Export Records
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 520, borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead sx={{ '& th': { fontWeight: 700 } }}>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Coffee Type</TableCell>
                      <TableCell>Quantity (kg)</TableCell>
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
                        <TableCell>{exp.coffeeType}</TableCell>
                        <TableCell>{exp.quantity.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={exp.status.replace(/_/g, ' ')}
                            color={getStatusColor(exp.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{new Date(exp.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          {exp.status === 'ECTA_QUALITY_PENDING' ? (
                            <>
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<Info />}
                                onClick={() => handleViewDetails(exp)}
                                sx={{ mr: 1 }}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Eye />}
                                onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}
                              >
                                Review Quality
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="outlined" 
                              size="small"
                              startIcon={<Info />}
                              onClick={() => handleViewDetails(exp)}
                            >
                              View Details
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
                  <Award size={48} color="#9E9E9E" />
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
                <Button variant="contained">Issue Certificate</Button>
                <Button variant="outlined">Generate Report</Button>
                <Button variant="outlined">View Pending Reviews</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          ECTA Quality Certification
          <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <XCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedExport && (
            <ECTAQualityForm
              exportData={selectedExport}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={loading}
              user={user}
              org={org}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ExportDetailView
        open={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
        exportData={viewingExport}
      />
    </Box>
  );
};

export default QualityCertification;
