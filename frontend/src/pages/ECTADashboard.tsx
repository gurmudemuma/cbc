import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Chip, Grid, Alert, CircularProgress } from '@mui/material';
import { FileCheck, Award, FileText, Package, CheckCircle, Clock } from 'lucide-react';
import apiClient from '../services/api';
import ECTALicenseForm from '../components/forms/ECTALicenseForm';
import ECTAQualityForm from '../components/forms/ECTAQualityForm';
import ECTAContractForm from '../components/forms/ECTAContractForm';

const ECTADashboard = ({ user }) => {
  const [stats, setStats] = useState({
    pendingLicenses: 0,
    pendingQuality: 0,
    pendingContracts: 0,
    pendingPermits: 0,
  });
  const [pendingTasks, setPendingTasks] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [exportsRes] = await Promise.all([
        apiClient.get('/api/exports')
      ]);

      const exports = exportsRes.data.data || [];
      
      // Filter exports needing ECTA action (steps 5,6,8,9,10,13)
      const needsLicense = exports.filter(e => e.current_step === 6 && !e.step_6_export_license);
      const needsQuality = exports.filter(e => e.current_step === 8 && !e.step_8_quality_inspection);
      const needsContract = exports.filter(e => e.current_step === 9 && !e.step_9_sales_contract);
      const needsPermit = exports.filter(e => e.current_step === 13 && !e.step_13_export_permit);

      setStats({
        pendingLicenses: needsLicense.length,
        pendingQuality: needsQuality.length,
        pendingContracts: needsContract.length,
        pendingPermits: needsPermit.length,
      });

      setPendingTasks([
        ...needsLicense.map(e => ({ ...e, type: 'license', step: 6 })),
        ...needsQuality.map(e => ({ ...e, type: 'quality', step: 8 })),
        ...needsContract.map(e => ({ ...e, type: 'contract', step: 9 })),
        ...needsPermit.map(e => ({ ...e, type: 'permit', step: 13 })),
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const handleApprove = async (exportData, formData) => {
    try {
      if (activeForm === 'license') {
        await apiClient.post('/api/exporter/license/approve', formData);
        await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 6 });
      } else if (activeForm === 'quality') {
        await apiClient.post('/api/quality/inspect', formData);
        await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 8 });
      } else if (activeForm === 'contract') {
        await apiClient.post('/api/contracts', formData);
        await apiClient.post(`/api/exports/${exportData.export_id}/progress`, { step: 9 });
      }
      
      setSelectedExport(null);
      setActiveForm(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleReject = async (exportData, reason) => {
    try {
      await apiClient.post(`/api/exports/${exportData.export_id}/reject`, { 
        step: exportData.step,
        reason 
      });
      setSelectedExport(null);
      setActiveForm(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  if (selectedExport && activeForm) {
    const FormComponent = activeForm === 'license' ? ECTALicenseForm : 
                         activeForm === 'quality' ? ECTAQualityForm : ECTAContractForm;
    
    return (
      <Box sx={{ p: 3 }}>
        <Button onClick={() => { setSelectedExport(null); setActiveForm(null); }} sx={{ mb: 2 }}>
          ← Back to Dashboard
        </Button>
        <FormComponent 
          exportData={selectedExport} 
          onApprove={(data) => handleApprove(selectedExport, data)}
          onReject={(reason) => handleReject(selectedExport, reason)}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>ECTA Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Ethiopian Coffee & Tea Authority - Regulatory Oversight
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingLicenses}</Typography>
                  <Typography variant="body2" color="text.secondary">Export Licenses</Typography>
                </Box>
                <span><Award size={40} color="#1976d2" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingQuality}</Typography>
                  <Typography variant="body2" color="text.secondary">Quality Inspections</Typography>
                </Box>
                <span><CheckCircle size={40} color="#2e7d32" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingContracts}</Typography>
                  <Typography variant="body2" color="text.secondary">Sales Contracts</Typography>
                </Box>
                <span><FileText size={40} color="#ed6c02" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingPermits}</Typography>
                  <Typography variant="body2" color="text.secondary">Export Permits</Typography>
                </Box>
                <span><FileCheck size={40} color="#9c27b0" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader title="Pending Approvals" />
            <CardContent>
              {pendingTasks.length === 0 ? (
                <Alert severity="info">No pending tasks</Alert>
              ) : (
                pendingTasks.map((task) => (
                  <Box key={task.export_id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h6">{task.export_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {task.coffee_type} - {task.quantity}kg → {task.destination}
                        </Typography>
                        <Chip 
                          label={task.type === 'license' ? 'Export License' : 
                                 task.type === 'quality' ? 'Quality Inspection' :
                                 task.type === 'contract' ? 'Sales Contract' : 'Export Permit'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Button 
                        variant="contained" 
                        onClick={() => { setSelectedExport(task); setActiveForm(task.type); }}
                      >
                        Review
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

export default ECTADashboard;
