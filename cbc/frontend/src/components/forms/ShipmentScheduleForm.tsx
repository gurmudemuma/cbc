import { useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid,
  Alert, CircularProgress, Box, Typography, Divider, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { CheckCircle, XCircle, Ship } from 'lucide-react';
import { CommonPageProps, ShipmentScheduleFormData } from '../../types';
import RejectionDialog from '../RejectionDialog';

interface ShipmentScheduleFormProps extends CommonPageProps {
  exportData: any;
  onApprove: (data: ShipmentScheduleFormData) => void;
  onReject: (data: any) => void;
  loading?: boolean;
}

const ShipmentScheduleForm = ({ exportData, onApprove, onReject, loading = false }: ShipmentScheduleFormProps): JSX.Element => {
  const [formData, setFormData] = useState<ShipmentScheduleFormData>({
    transportMode: 'SEA',
    transportIdentifier: '',
    departureDate: '',
    estimatedArrivalDate: '',
    portOfLoading: '',
    portOfDischarge: exportData.destinationCountry || '',
    notes: '',
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.transportIdentifier?.trim()) newErrors.transportIdentifier = 'Transport identifier required';
    if (!formData.departureDate) newErrors.departureDate = 'Departure date required';
    if (!formData.estimatedArrivalDate) newErrors.estimatedArrivalDate = 'Arrival date required';
    if (!formData.portOfLoading?.trim()) newErrors.portOfLoading = 'Port of loading required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validate()) return;
    onApprove({
      transportMode: formData.transportMode,
      transportIdentifier: formData.transportIdentifier.trim(),
      departureDate: formData.departureDate,
      estimatedArrivalDate: formData.estimatedArrivalDate,
      portOfLoading: formData.portOfLoading.trim(),
      portOfDischarge: formData.portOfDischarge.trim(),
      notes: formData.notes.trim(),
    });
  };

  return (
    <>
      <Card>
        <CardHeader avatar={<Ship size={32} color="#1976d2" />} title="Schedule Shipment" subheader={`Export ID: ${exportData.exportId}`} />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 2 }}>Schedule shipment for customs-cleared export</Alert>
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Exporter:</strong> {exportData.exporterName}</Typography>
            <Typography variant="body2"><strong>Quantity:</strong> {exportData.quantity} kg</Typography>
            <Typography variant="body2"><strong>Destination:</strong> {exportData.destinationCountry}</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Transport Mode *</InputLabel>
                <Select value={formData.transportMode} onChange={(e) => setFormData({...formData, transportMode: e.target.value})} label="Transport Mode *">
                  <MenuItem value="SEA">Sea Freight</MenuItem>
                  <MenuItem value="AIR">Air Freight</MenuItem>
                  <MenuItem value="RAIL">Rail</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Vessel/Flight Number *" value={formData.transportIdentifier} onChange={(e) => setFormData({...formData, transportIdentifier: e.target.value})} fullWidth required error={!!errors.transportIdentifier} helperText={errors.transportIdentifier} placeholder="e.g., MSC MAYA / ET-702" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Departure Date *" type="date" value={formData.departureDate} onChange={(e) => setFormData({...formData, departureDate: e.target.value})} fullWidth required error={!!errors.departureDate} helperText={errors.departureDate} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Estimated Arrival Date *" type="date" value={formData.estimatedArrivalDate} onChange={(e) => setFormData({...formData, estimatedArrivalDate: e.target.value})} fullWidth required error={!!errors.estimatedArrivalDate} helperText={errors.estimatedArrivalDate} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Port of Loading *" value={formData.portOfLoading} onChange={(e) => setFormData({...formData, portOfLoading: e.target.value})} fullWidth required error={!!errors.portOfLoading} helperText={errors.portOfLoading} placeholder="e.g., Djibouti Port" />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Port of Discharge" value={formData.portOfDischarge} onChange={(e) => setFormData({...formData, portOfDischarge: e.target.value})} fullWidth placeholder="e.g., Hamburg, Germany" />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Shipment Notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} multiline rows={3} fullWidth placeholder="Special handling instructions, container details, etc..." />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />} onClick={() => setShowRejectDialog(true)} disabled={loading}>Reject Shipment</Button>
          <Button variant="contained" color="success" startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />} onClick={handleApprove} disabled={loading} size="large">{loading ? 'Scheduling...' : 'Schedule Shipment'}</Button>
        </CardActions>
      </Card>
      <RejectionDialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} onReject={(data) => { setShowRejectDialog(false); onReject(data); }} stageName="SHIPPING" exportId={exportData.exportId} loading={loading} />
    </>
  );
};

export default ShipmentScheduleForm;
