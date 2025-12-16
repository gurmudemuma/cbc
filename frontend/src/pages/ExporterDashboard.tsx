import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Typography, Box, Button, Chip, Grid, Alert, CircularProgress, LinearProgress, Stepper, Step, StepLabel } from '@mui/material';
import { Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../services/api';

const STEPS = [
  'Business Registration',
  'Capital Verification',
  'Laboratory Setup',
  'Taster Registration',
  'Competence Certificate',
  'Export License',
  'Coffee Purchase',
  'Quality Inspection',
  'Sales Contract',
  'Certificate of Origin',
  'Bank Verification',
  'FX Approval',
  'Export Permit',
  'Customs Clearance',
  'Shipment',
  'Payment Settlement'
];

const ExporterDashboard = ({ user }) => {
  const [stats, setStats] = useState({
    activeExports: 0,
    pendingActions: 0,
    completedExports: 0,
    complianceAlerts: 0,
  });
  const [exports, setExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const exportsRes = await apiClient.get('/api/exports');
      const allExports = exportsRes.data.data || [];
      
      const active = allExports.filter(e => e.overall_status === 'in_progress');
      const completed = allExports.filter(e => e.overall_status === 'completed');
      
      setStats({
        activeExports: active.length,
        pendingActions: active.filter(e => e.current_step <= 16).length,
        completedExports: completed.length,
        complianceAlerts: 0,
      });

      setExports(allExports);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setLoading(false);
    }
  };

  const getProgressPercentage = (exp) => {
    let completed = 0;
    for (let i = 1; i <= 16; i++) {
      if (exp[`step_${i}_completed`]) completed++;
    }
    return (completed / 16) * 100;
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  if (selectedExport) {
    return (
      <Box sx={{ p: 3 }}>
        <Button onClick={() => setSelectedExport(null)} sx={{ mb: 2 }}>← Back to Dashboard</Button>
        <Card>
          <CardHeader title={`Export Progress: ${selectedExport.export_id}`} />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedExport.coffee_type} - {selectedExport.quantity}kg → {selectedExport.destination}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={getProgressPercentage(selectedExport)} 
                sx={{ height: 10, borderRadius: 5, mt: 2 }}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {getProgressPercentage(selectedExport).toFixed(0)}% Complete - Step {selectedExport.current_step} of 16
              </Typography>
            </Box>

            <Stepper activeStep={selectedExport.current_step - 1} orientation="vertical">
              {STEPS.map((label, index) => {
                const stepNum = index + 1;
                const isCompleted = selectedExport[`step_${stepNum}_completed`];
                const completedAt = selectedExport[`step_${stepNum}_completed_at`];
                
                return (
                  <Step key={label} completed={isCompleted}>
                    <StepLabel>
                      <Box>
                        <Typography variant="body1">{label}</Typography>
                        {completedAt && (
                          <Typography variant="caption" color="text.secondary">
                            Completed: {new Date(completedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Next Action:</strong> {selectedExport.next_action || 'Waiting for approval'}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Exporter Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Track Your Coffee Exports
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.activeExports}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Exports</Typography>
                </Box>
                <span><Package size={40} color="#1976d2" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.pendingActions}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending Actions</Typography>
                </Box>
                <span><AlertCircle size={40} color="#ed6c02" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h3">{stats.completedExports}</Typography>
                  <Typography variant="body2" color="text.secondary">Completed Exports</Typography>
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
                  <Typography variant="h3">{stats.complianceAlerts}</Typography>
                  <Typography variant="body2" color="text.secondary">Compliance Alerts</Typography>
                </Box>
                <span><TrendingUp size={40} color="#9c27b0" /></span>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="My Exports" 
              action={
                <Button variant="contained" onClick={() => window.location.href = '/exports'}>
                  Create New Export
                </Button>
              }
            />
            <CardContent>
              {exports.length === 0 ? (
                <Alert severity="info">No exports yet. Create your first export to get started!</Alert>
              ) : (
                exports.map((exp) => (
                  <Box key={exp.export_id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="h6">{exp.export_id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exp.coffee_type} - {exp.quantity}kg → {exp.destination}
                        </Typography>
                      </Box>
                      <Chip 
                        label={exp.overall_status === 'completed' ? 'Completed' : `Step ${exp.current_step}/16`}
                        color={exp.overall_status === 'completed' ? 'success' : 'primary'}
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={getProgressPercentage(exp)} 
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {getProgressPercentage(exp).toFixed(0)}% Complete
                      </Typography>
                      <Button 
                        size="small" 
                        onClick={() => setSelectedExport(exp)}
                      >
                        View Details
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

export default ExporterDashboard;
