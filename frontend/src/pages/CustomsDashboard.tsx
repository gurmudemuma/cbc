import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material';
import { ShieldCheck, FileSearch, Package } from 'lucide-react';
import apiClient from '../services/api';
import CustomsClearanceForm from '../components/forms/CustomsClearanceForm';

const CustomsDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    pendingDeclarations: 0,
    scheduledInspections: 0,
    awaitingRelease: 0,
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
      
      const needsClearance = exports.filter(e => e.current_step === 14 && !e.step_14_customs_clearance);
      
      setStats({
        pendingDeclarations: needsClearance.length,
        scheduledInspections: 0,
        awaitingRelease: 0,
      });

      setPendingTasks(needsClearance);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (exportData, formData) => {
    try {
      await apiClient.post('/api/clearance', {
        export_id: exportData.export_id,
        ...formData
      });
      await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 14 });
      
      setSelectedExport(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Clearance failed:', error);
    }
  };

  const handleReject = async (exportData, reason) => {
    try {
      await apiClient.post(`/api/exports/${exportData.export_id}/reject`, { 
        step: 14,
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
        <CustomsClearanceForm 
          exportData={selectedExport} 
          onApprove={(data) => handleApprove(selectedExport, data)}
          onReject={(reason) => handleReject(selectedExport, reason)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Customs Commission Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Export Clearance & Compliance
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingDeclarations}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Declarations</Typography>
                </Box>
                <span><FileSearch size={40} color="#1976d2" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.scheduledInspections}</Typography>
                  <Typography variant="body2" color="text.secondary">Scheduled Inspections</Typography>
                </Box>
                <span><ShieldCheck size={40} color="#2e7d32" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.awaitingRelease}</Typography>
                  <Typography variant="body2" color="text.secondary">Awaiting Release</Typography>
                </Box>
                <span><Package size={40} color="#ed6c02" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Clearance Queue" />
            <CardContent>
              {pendingTasks.length === 0 ? (
                <Alert severity="info">No pending clearances</Alert>
              ) : (
                pendingTasks.map((task) => (
                  <Box key={task.export_id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{task.export_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.coffee_type} - {task.quantity}kg → {task.destination}
                        </Typography>
                        <Chip label="Customs Clearance Required" size="small" color="primary" sx={{ mt: 1 }} />
                      </Box>
                      <Button 
                        variant="contained" 
                        onClick={() => setSelectedExport(task)}
                      >
                        Process Clearance
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

export default CustomsDashboard;
