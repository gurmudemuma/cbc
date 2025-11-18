import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Search, FileCheck, FileText, MapPin, Eye } from 'lucide-react';
import apiClient from '../services/api';
import { useExports } from '../hooks/useExports';
import CustomsClearanceForm from '../components/forms/CustomsClearanceForm';
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
} from '@mui/material';

const CustomsClearance = ({ user }) => {
  const { exports: allExports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  const exports = allExports.filter((e) => e.status === 'CUSTOMS_PENDING' || e.status === 'CUSTOMS_CLEARED' || e.status === 'CUSTOMS_REJECTED');
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // API base URL is set in App.jsx based on user's organization

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter((exp) =>
        ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED'].includes(exp.status)
      );
    } else if (statusFilter === 'cleared') {
      filtered = filtered.filter((exp) => exp.status === 'CUSTOMS_CLEARED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((exp) => exp.status === 'CUSTOMS_REJECTED');
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.exportId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.exporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.destinationCountry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      await apiClient.post(`/customs/clear`, {
        exportId: selectedExport.exportId,
        clearanceId: data.declarationNumber,
        clearedBy: data.clearedBy || user?.username
      });
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
      await apiClient.post(`/customs/reject`, {
        exportId: selectedExport.exportId,
        reason: reason,
        rejectedBy: user?.username
      });
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
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Review export records and issue customs clearance
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {
                      exports.filter((e) =>
                        ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'SHIPPED'].includes(e.status)
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2">Pending Clearance</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'CUSTOMS_CLEARED').length}
                  </Typography>
                  <Typography variant="body2">Cleared</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'CUSTOMS_REJECTED').length}
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
                    <MenuItem value="cleared">Cleared</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Customs Queue
              </Typography>
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
                    {filteredExports.map((exp) => (
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
                        <TableCell>
                          {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {exp.status === 'CUSTOMS_PENDING' ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Eye />}
                              onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}
                            >
                              Review Clearance
                            </Button>
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
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actions
              </Typography>
              <Stack spacing={2}>
                <Button variant="contained">Issue Clearance</Button>
                <Button variant="outlined">Generate Report</Button>
                <Button variant="outlined">View Cleared</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Customs Clearance
          <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <XCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedExport && (
            <CustomsClearanceForm
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

export default CustomsClearance;
