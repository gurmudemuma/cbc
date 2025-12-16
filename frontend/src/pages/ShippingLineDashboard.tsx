import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material';
import { Ship, Anchor, Package } from 'lucide-react';
import apiClient from '../services/api';
import ShipmentScheduleForm from '../components/forms/ShipmentScheduleForm';

const ShippingLineDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    pendingBookings: 0,
    scheduledDepartures: 0,
    containerAvailability: 85,
  });
  const [pendingTasks, setPendingTasks] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const exportsRes = await apiClient.get('/api/exports');
      const exports = exportsRes.data.data || [];
      
      const needsShipping = exports.filter(e => e.current_step === 15 && !e.step_15_shipment);
      
      setStats({
        pendingBookings: needsShipping.length,
        scheduledDepartures: 0,
        containerAvailability: 85,
      });

      setPendingTasks(needsShipping);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (exportData, formData) => {
    try {
      await apiClient.post('/api/bookings', {
        export_id: exportData.export_id,
        ...formData
      });
      await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 15 });
      
      setSelectedExport(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  const handleReject = async (exportData, reason) => {
    try {
      await apiClient.post(`/api/exports/${exportData.export_id}/reject`, { 
        step: 15,
        reason 
      });
      setSelectedExport(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  if (selectedExport) {
    return (
      <Box sx={{ p: 3 }}>
        <Button onClick={() => setSelectedExport(null)} sx={{ mb: 2 }}>← Back to Dashboard</Button>
        <ShipmentScheduleForm 
          exportData={selectedExport} 
          onApprove={(data) => handleApprove(selectedExport, data)}
          onReject={(reason) => handleReject(selectedExport, reason)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Shipping Line Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Booking Management & Logistics
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingBookings}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Bookings</Typography>
                </Box>
                <span><Package size={40} color="#1976d2" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.scheduledDepartures}</Typography>
                  <Typography variant="body2" color="text.secondary">Scheduled Departures</Typography>
                </Box>
                <span><Ship size={40} color="#2e7d32" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.containerAvailability}%</Typography>
                  <Typography variant="body2" color="text.secondary">Container Availability</Typography>
                </Box>
                <span><Anchor size={40} color="#ed6c02" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Booking Queue" />
            <CardContent>
              {pendingTasks.length === 0 ? (
                <Alert severity="info">No pending bookings</Alert>
              ) : (
                pendingTasks.map((task) => (
                  <Box key={task.export_id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{task.export_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.coffee_type} - {task.quantity}kg → {task.destination}
                        </Typography>
                        <Chip label="Booking Required" size="small" color="primary" sx={{ mt: 1 }} />
                      </Box>
                      <Button 
                        variant="contained" 
                        onClick={() => setSelectedExport(task)}
                      >
                        Process Booking
                      </Button>
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ShippingLineDashboard;
