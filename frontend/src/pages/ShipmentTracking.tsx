import { useState, useEffect } from 'react';
import { Ship, MapPin, Calendar, CheckCircle, Clock, Search, Eye, XCircle } from 'lucide-react';
import apiClient from '../services/api';
import { useExports } from '../hooks/useExportManager';
import { Export } from '../types';
import ShipmentScheduleForm from '../components/forms/ShipmentScheduleForm';
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
} from '@mui/material';
import Divider from '@mui/material/Divider';

interface ShipmentTrackingProps {
  user: any;
  org: string | null;
}

const ShipmentTracking = ({ user, org }: ShipmentTrackingProps): JSX.Element => {
  const { exports: allExports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  const exports = allExports.filter((e) => e.status === 'CUSTOMS_CLEARED' || e.status === 'SHIPMENT_PENDING' || e.status === 'SHIPMENT_SCHEDULED' || e.status === 'SHIPPED' || e.status === 'SHIPMENT_REJECTED');
  const [filteredExports, setFilteredExports] = useState<Export[]>([]);
  const [selectedExport, setSelectedExport] = useState<Export | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipmentId: '',
    transportIdentifier: '',
    transportMode: 'SEA',
    departureDate: '',
    arrivalDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const location = window.location;

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/pending')) setStatusFilter('ready'); // Ready to Ship
    else if (path.includes('/scheduled')) setStatusFilter('scheduled');
    else if (path.includes('/transit') || path.includes('/shipped')) setStatusFilter('shipped');
    else if (path.includes('/delivered')) setStatusFilter('all'); // Show all/completed
    else setStatusFilter('all');
  }, [location.pathname]);

  // API base URL is set in App.jsx based on user's organization

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'ready') {
      filtered = filtered.filter((exp) => exp.status === 'QUALITY_CERTIFIED');
    } else if (statusFilter === 'scheduled') {
      filtered = filtered.filter((exp) => exp.status === 'SHIPMENT_SCHEDULED');
    } else if (statusFilter === 'shipped') {
      filtered = filtered.filter((exp) => exp.status === 'SHIPPED');
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (exp.vesselName && exp.vesselName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredExports(filtered);
  };

  const handleSchedule = (exportData) => {
    // Open schedule dialog or navigate to schedule page
    console.log('Schedule shipment for:', exportData);
  };

  const handleConfirm = (exportData) => {
    // Open confirm dialog or navigate to confirm page
    console.log('Confirm shipment for:', exportData);
  };

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      await apiClient.post(`/shipments/schedule`, {
        exportId: selectedExport.exportId,
        transportMode: data.transportMode,
        transportIdentifier: data.transportIdentifier,
        departureDate: data.departureDate,
        arrivalDate: data.estimatedArrivalDate,  // Backend expects 'arrivalDate'
        notes: data.notes
      });
      setIsModalOpen(false);
      setSelectedExport(null);
      refreshExports();
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to schedule: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async ({ category, reason }) => {
    setLoading(true);
    try {
      // Note: Backend endpoint may not exist yet - will need to be created
      await apiClient.post(`/shipments/reject`, {
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
      QUALITY_CERTIFIED: 'warning',
      SHIPMENT_SCHEDULED: 'info',
      SHIPPED: 'primary',
      COMPLETED: 'success',
    };
    return statusMap[status] || 'default';
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return 'N/A';
    const days = Math.ceil((new Date(arrival).getTime() - new Date(departure).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  return (
    <Box className={`organization-${user.organizationId || 'shipping-line'}`} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Shipment Tracking</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Schedule and track coffee export shipments
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'QUALITY_CERTIFIED').length}
                  </Typography>
                  <Typography variant="body2">Ready to Ship</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'SHIPMENT_SCHEDULED').length}
                  </Typography>
                  <Typography variant="body2">Scheduled</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'SHIPPED').length}
                  </Typography>
                  <Typography variant="body2">In Transit</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'COMPLETED').length}
                  </Typography>
                  <Typography variant="body2">Delivered</Typography>
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
                    placeholder="Search shipments..."
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
                    <MenuItem value="ready">Ready to Ship</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="shipped">In Transit</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Shipment Records
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 520, borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead sx={{ '& th': { fontWeight: 700 } }}>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Transport ID</TableCell>
                      <TableCell>Departure</TableCell>
                      <TableCell>Arrival</TableCell>
                      <TableCell>Status</TableCell>
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
                        <TableCell>{exp.transportIdentifier || '-'}</TableCell>
                        <TableCell>
                          {exp.departureDate ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Calendar size={14} />
                              {new Date(exp.departureDate).toLocaleDateString()}
                            </Stack>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {exp.arrivalDate ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Calendar size={14} />
                              {new Date(exp.arrivalDate).toLocaleDateString()}
                            </Stack>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exp.status.replace(/_/g, ' ')}
                            color={getStatusColor(exp.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {exp.status === 'QUALITY_CERTIFIED' && (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Ship size={16} />}
                              onClick={() => handleSchedule(exp)}
                            >
                              Schedule
                            </Button>
                          )}
                          {exp.status === 'SHIPMENT_SCHEDULED' && (
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              startIcon={<CheckCircle size={16} />}
                              onClick={() => handleConfirm(exp)}
                            >
                              Confirm
                            </Button>
                          )}
                          {(exp.status === 'SHIPPED' || exp.status === 'COMPLETED') && (
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
                  <Ship size={48} color="#9E9E9E" />
                  <Typography color="text.secondary">No shipments found</Typography>
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
                <Button variant="contained">Schedule Shipment</Button>
                <Button variant="outlined">Confirm Departure</Button>
                <Button variant="outlined">Generate Report</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Schedule Shipment
          <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <XCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedExport && (
            <ShipmentScheduleForm
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
    </Box>
  );
};

export default ShipmentTracking;
