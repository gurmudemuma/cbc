/**
 * Exporter Application Dashboard
 * Shows exporter's own application statuses and qualification progress
 */

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CommonPageProps } from '../types';
import ExporterDashboard from '../components/ExporterDashboard';
import ectaPreRegistrationService from '../services/ectaPreRegistration';

interface ExporterApplicationDashboardProps extends CommonPageProps {}

const ExporterApplicationDashboard = ({ user, org }: ExporterApplicationDashboardProps): JSX.Element => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch dashboard for exporters - redirect others
        const userRole = user?.role?.toLowerCase();
        const orgLower = org?.toLowerCase();
        
        // If user is not an exporter, redirect to appropriate dashboard
        if (userRole !== 'exporter' && userRole !== 'admin' && orgLower !== 'exporter-portal') {
          console.log('Non-exporter user detected, redirecting to network dashboard');
          navigate('/network/agency-dashboard', { replace: true });
          return;
        }
        
        // Get exporter's own dashboard directly
        const response = await ectaPreRegistrationService.getMyDashboard();
        const dashboard = response?.data || response;
        
        console.log('[ExporterApplicationDashboard] Raw response:', response);
        console.log('[ExporterApplicationDashboard] Dashboard data:', dashboard);
        console.log('[ExporterApplicationDashboard] isFullyQualified:', dashboard?.compliance?.isFullyQualified);
        
        if (dashboard) {
          setDashboardData(dashboard);
        } else {
          setError('Dashboard data not found. Please complete your registration first.');
        }
      } catch (err: any) {
        console.error('Error fetching dashboard:', err);
        
        if (err.response?.status === 403) {
          // Redirect non-exporters instead of showing error
          console.log('403 error - redirecting to network dashboard');
          navigate('/network/agency-dashboard', { replace: true });
          return;
        } else if (err.response?.status === 404) {
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
  }, [user, org, navigate]);

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
