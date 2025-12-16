import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material';
import { DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import apiClient from '../services/api';
import NBEFXApprovalForm from '../components/forms/NBEFXApprovalForm';

const NBEDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    pendingApprovals: 0,
    approachingDeadline: 0,
    totalFXToday: 0,
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
      
      const needsFX = exports.filter(e => e.current_step === 12 && !e.step_12_fx_approval);
      
      setStats({
        pendingApprovals: needsFX.length,
        approachingDeadline: 0,
        totalFXToday: 0,
      });

      setPendingTasks(needsFX);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (exportData, formData) => {
    try {
      await apiClient.post('/api/approvals', {
        export_id: exportData.export_id,
        ...formData
      });
      await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 12 });
      
      setSelectedExport(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleReject = async (exportData, reason) => {
    try {
      await apiClient.post(`/api/exports/${exportData.export_id}/reject`, { 
        step: 12,
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
        <NBEFXApprovalForm 
          exportData={selectedExport} 
          onApprove={(data) => handleApprove(selectedExport, data)}
          onReject={(reason) => handleReject(selectedExport, reason)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>National Bank of Ethiopia Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Foreign Exchange Approval & Monitoring
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingApprovals}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending FX Approvals</Typography>
                </Box>
                <span><DollarSign size={40} color="#1976d2" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.approachingDeadline}</Typography>
                  <Typography variant="body2" color="text.secondary">Approaching 90-Day Deadline</Typography>
                </Box>
                <span><AlertTriangle size={40} color="#ed6c02" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">${stats.totalFXToday.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Total FX Allocated Today</Typography>
                </Box>
                <span><TrendingUp size={40} color="#2e7d32" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="FX Approval Queue" />
            <CardContent>
              {pendingTasks.length === 0 ? (
                <Alert severity="info">No pending FX approvals</Alert>
              ) : (
                pendingTasks.map((task) => (
                  <Box key={task.export_id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{task.export_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.coffee_type} - {task.quantity}kg → {task.destination}
                        </Typography>
                        <Chip label="FX Approval Required" size="small" color="warning" sx={{ mt: 1 }} />
                      </Box>
                      <Button 
                        variant="contained" 
                        onClick={() => setSelectedExport(task)}
                      >
                        Review FX Application
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

export default NBEDashboard;
