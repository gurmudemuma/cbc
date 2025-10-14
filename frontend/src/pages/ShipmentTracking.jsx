import { useState, useEffect } from 'react';
import { Ship, MapPin, Calendar, CheckCircle, Clock, Search } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import {
  Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography
} from '@mui/material';

const ShipmentTracking = ({ user }) => {
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('schedule'); // 'schedule' or 'confirm'
  const [formData, setFormData] = useState({
    shipmentId: '',
    vesselName: '',
    departureDate: '',
    arrivalDate: '',
    shippingLineId: 'SHIP-001'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setApiBaseUrl(API_ENDPOINTS.shipping);
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/shipments/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'ready') {
      filtered = filtered.filter(exp => exp.status === 'QUALITY_CERTIFIED');
    } else if (statusFilter === 'scheduled') {
      filtered = filtered.filter(exp => exp.status === 'SHIPMENT_SCHEDULED');
    } else if (statusFilter === 'shipped') {
      filtered = filtered.filter(exp => exp.status === 'SHIPPED');
    }

    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.vesselName && exp.vesselName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredExports(filtered);
  };

  const handleSchedule = (exportData) => {
    setSelectedExport(exportData);
    setModalType('schedule');
    setFormData({
      shipmentId: `SHIP-${Date.now()}`,
      vesselName: '',
      departureDate: '',
      arrivalDate: '',
      shippingLineId: 'SHIP-001'
    });
    setIsModalOpen(true);
  };

  const handleConfirm = (exportData) => {
    setSelectedExport(exportData);
    setModalType('confirm');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'schedule') {
        await apiClient.post('/shipments/schedule', {
          exportId: selectedExport.exportId,
          shipmentId: formData.shipmentId,
          vesselName: formData.vesselName,
          departureDate: formData.departureDate,
          arrivalDate: formData.arrivalDate,
          shippingLineId: formData.shippingLineId
        });
      } else {
        await apiClient.post('/shipments/confirm', {
          exportId: selectedExport.exportId
        });
      }
      
      setIsModalOpen(false);
      fetchExports();
    } catch (error) {
      console.error('Error processing shipment:', error);
      alert('Failed to process shipment');
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
    const days = Math.ceil((new Date(arrival) - new Date(departure)) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Shipment Tracking</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>Schedule and track coffee export shipments</Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'QUALITY_CERTIFIED').length}</Typography>
                  <Typography variant="body2">Ready to Ship</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'SHIPMENT_SCHEDULED').length}</Typography>
                  <Typography variant="body2">Scheduled</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'SHIPPED').length}</Typography>
                  <Typography variant="body2">In Transit</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{exports.filter(e => e.status === 'COMPLETED').length}</Typography>
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
              <Typography variant="h6" sx={{ mb: 2 }}>Shipment Records</Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Vessel</TableCell>
                      <TableCell>Departure</TableCell>
                      <TableCell>Arrival</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExports.map(exp => (
                      <TableRow key={exp.exportId}>
                        <TableCell>{exp.exportId}</TableCell>
                        <TableCell>{exp.exporterName}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <MapPin size={14} />
                            {exp.destinationCountry}
                          </Stack>
                        </TableCell>
                        <TableCell>{exp.vesselName || '-'}</TableCell>
                        <TableCell>
                          {exp.departureDate ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Calendar size={14} />
                              {new Date(exp.departureDate).toLocaleDateString()}
                            </Stack>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {exp.arrivalDate ? (
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Calendar size={14} />
                              {new Date(exp.arrivalDate).toLocaleDateString()}
                            </Stack>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={exp.status.replace(/_/g, ' ')} 
                            color={getStatusColor(exp.status)}
                          />
                        </TableCell>
                        <TableCell>
                          {exp.status === 'QUALITY_CERTIFIED' && (
                            <Button variant="contained" size="small" startIcon={<Ship size={16} />} onClick={() => handleSchedule(exp)}>
                              Schedule
                            </Button>
                          )}
                          {exp.status === 'SHIPMENT_SCHEDULED' && (
                            <Button variant="contained" color="success" size="small" startIcon={<CheckCircle size={16} />} onClick={() => handleConfirm(exp)}>
                              Confirm
                            </Button>
                          )}
                          {(exp.status === 'SHIPPED' || exp.status === 'COMPLETED') && (
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
                  <Ship size={48} color="action.disabled" />
                  <Typography>No shipments found</Typography>
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
                <Button variant="contained">Schedule Shipment</Button>
                <Button variant="outlined">Confirm Departure</Button>
                <Button variant="outlined">Generate Report</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{modalType === 'schedule' ? 'Schedule Shipment' : 'Confirm Shipment'}</DialogTitle>
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
            <Grid item xs={12}>
              <Typography variant="body1"><strong>Destination:</strong> {selectedExport?.destinationCountry}</Typography>
            </Grid>
            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
            {modalType === 'schedule' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Shipment ID"
                    value={formData.shipmentId}
                    onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Vessel Name"
                    value={formData.vesselName}
                    onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                    placeholder="e.g., MV Coffee Carrier"
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Departure Date"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Estimated Arrival Date"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                {formData.departureDate && formData.arrivalDate && (
                  <Grid item xs={12}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Clock size={16} />
                      <Typography variant="body2">Transit Duration: {calculateDuration(formData.departureDate, formData.arrivalDate)}</Typography>
                    </Stack>
                  </Grid>
                )}
              </>
            ) : (
              <Grid item xs={12} sx={{ textAlign: 'center' }}>
                <Ship size={48} color="primary.main" sx={{ mb: 2 }} />
                <Typography variant="h6">Confirm Shipment Departure</Typography>
                <Typography variant="body1" sx={{ my: 2 }}>Are you sure you want to confirm that this shipment has departed?</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body1"><strong>Vessel:</strong> {selectedExport?.vesselName}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1"><strong>Departure Date:</strong> {selectedExport?.departureDate && new Date(selectedExport.departureDate).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body1"><strong>Expected Arrival:</strong> {selectedExport?.arrivalDate && new Date(selectedExport.arrivalDate).toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color={modalType === 'schedule' ? 'primary' : 'success'}
            disabled={
              modalType === 'schedule' && (
                !formData.shipmentId || 
                !formData.vesselName || 
                !formData.departureDate || 
                !formData.arrivalDate
              )
            }
          >
            {modalType === 'schedule' ? 'Schedule Shipment' : 'Confirm Departure'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShipmentTracking;