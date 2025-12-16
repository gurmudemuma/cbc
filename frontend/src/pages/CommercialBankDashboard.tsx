import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material';
import { FileCheck, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../services/api';
import BankDocumentVerificationForm from '../components/forms/BankDocumentVerificationForm';

const CommercialBankDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    pendingVerifications: 0,
    lcComplianceChecks: 0,
    awaitingNBE: 0,
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
      
      const needsVerification = exports.filter(e => e.current_step === 11 && !e.step_11_bank_verification);
      
      setStats({
        pendingVerifications: needsVerification.length,
        lcComplianceChecks: 0,
        awaitingNBE: 0,
      });

      setPendingTasks(needsVerification);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (exportData, formData) => {
    try {
      await apiClient.post('/api/documents/verify', {
        export_id: exportData.export_id,
        ...formData
      });
      await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 11 });
      
      setSelectedExport(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Verification failed:', error);
    }
  };

  const handleReject = async (exportData, reason) => {
    try {
      await apiClient.post(`/api/exports/${exportData.export_id}/reject`, { 
        step: 11,
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
        <BankDocumentVerificationForm 
          exportData={selectedExport} 
          onApprove={(data) => handleApprove(selectedExport, data)}
          onReject={(reason) => handleReject(selectedExport, reason)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 0 }}>
      <Typography variant="h4" gutterBottom>Commercial Bank Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Document Verification & L/C Compliance
      </Typography>

      <Grid container spacing={2} sx={{ mt: 0 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingVerifications}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Verifications</Typography>
                </Box>
                <span><FileCheck size={40} color="#1976d2" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.lcComplianceChecks}</Typography>
                  <Typography variant="body2" color="text.secondary">L/C Compliance Checks</Typography>
                </Box>
                <span><CheckCircle size={40} color="#2e7d32" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.awaitingNBE}</Typography>
                  <Typography variant="body2" color="text.secondary">Awaiting NBE Submission</Typography>
                </Box>
                <span><Clock size={40} color="#ed6c02" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Document Verification Queue" />
            <CardContent>
              {pendingTasks.length === 0 ? (
                <Alert severity="info">No pending document verifications</Alert>
              ) : (
                pendingTasks.map((task) => (
                  <Box key={task.export_id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{task.export_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.coffee_type} - {task.quantity}kg → {task.destination}
                        </Typography>
                        <Chip label="Document Verification Required" size="small" color="primary" sx={{ mt: 1 }} />
                      </Box>
                      <Button 
                        variant="contained" 
                        onClick={() => setSelectedExport(task)}
                      >
                        Verify Documents
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

export default CommercialBankDashboard;
