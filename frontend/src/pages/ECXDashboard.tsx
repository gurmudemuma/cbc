import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material';
import { Package, Award, TrendingUp } from 'lucide-react';
import apiClient from '../services/api';
import ECXApprovalForm from '../components/forms/ECXApprovalForm';

const ECXDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    activeLots: 0,
    pendingGrading: 0,
    warehouseCapacity: 75,
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
      
      const needsGrading = exports.filter(e => e.current_step === 8 && !e.step_8_quality_inspection);
      
      setStats({
        activeLots: exports.filter(e => e.current_step >= 7).length,
        pendingGrading: needsGrading.length,
        warehouseCapacity: 75,
      });

      setPendingTasks(needsGrading);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (exportData, formData) => {
    try {
      await apiClient.post('/api/quality/certify', {
        export_id: exportData.export_id,
        ...formData
      });
      await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 8 });
      
      setSelectedExport(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Grading failed:', error);
    }
  };

  const handleReject = async (exportData, reason) => {
    try {
      await apiClient.post(`/api/exports/${exportData.export_id}/reject`, { 
        step: 8,
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
        <ECXApprovalForm 
          exportData={selectedExport} 
          onApprove={(data) => handleApprove(selectedExport, data)}
          onReject={(reason) => handleReject(selectedExport, reason)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Ethiopian Commodity Exchange Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Coffee Auction & Quality Grading
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.activeLots}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Coffee Lots</Typography>
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
                  <Typography variant="h3">{stats.pendingGrading}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Quality Grading</Typography>
                </Box>
                <span><Award size={40} color="#2e7d32" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.warehouseCapacity}%</Typography>
                  <Typography variant="body2" color="text.secondary">Warehouse Capacity</Typography>
                </Box>
                <span><TrendingUp size={40} color="#ed6c02" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Quality Grading Queue" />
            <CardContent>
              {pendingTasks.length === 0 ? (
                <Alert severity="info">No pending quality grading</Alert>
              ) : (
                pendingTasks.map((task) => (
                  <Box key={task.export_id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{task.export_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.coffee_type} - {task.quantity}kg
                        </Typography>
                        <Chip label="Quality Grading Required" size="small" color="success" sx={{ mt: 1 }} />
                      </Box>
                      <Button 
                        variant="contained" 
                        onClick={() => setSelectedExport(task)}
                      >
                        Grade Coffee
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

export default ECXDashboard;
