/**
 * Exporter Application Dashboard
 * Shows exporter's own application statuses and qualification progress
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { CommonPageProps } from '../types';
import ExporterDashboard from '../components/ExporterDashboard';
import ectaPreRegistrationService from '../services/ectaPreRegistration';

interface ExporterApplicationDashboardProps extends CommonPageProps {}

const ExporterApplicationDashboard = ({ user, org }: ExporterApplicationDashboardProps): JSX.Element => {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get exporter's own dashboard directly
        const response = await ectaPreRegistrationService.getMyDashboard();
        const dashboard = response?.data || response;
        
        if (dashboard) {
          setDashboardData(dashboard);
        } else {
          setError('Dashboard data not found. Please complete your registration first.');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);
        console.error('Error response:', err.response);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
        
        if (err.response?.status === 404) {
          setError('You have not registered yet. Please complete the pre-registration process first.');
        } else if (err.response?.status === 401) {
          setError('Authentication failed. Please logout and login again.');
        } else {
          setError(err.response?.data?.message || 'Failed to load your dashboard');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" href="/pre-registration">
          Start Pre-Registration
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 3, pt: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          My Application Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
        >
          Refresh
        </Button>
      </Box>
      
      {dashboardData && <ExporterDashboard dashboardData={dashboardData} />}
    </Box>
  );
};

export default ExporterApplicationDashboard;
