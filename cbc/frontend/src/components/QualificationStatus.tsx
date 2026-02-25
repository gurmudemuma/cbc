/**
 * Qualification Status Component
 * Displays exporter's qualification progress and requirements
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Warning,
  Error as ErrorIcon,
  Business,
  Science,
  Person,
  VerifiedUser,
  Description,
  Refresh,
} from '@mui/icons-material';
import ectaPreRegistrationService from '../services/ectaPreRegistration';

const QualificationStatus = ({ onNavigateToRegistration }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await ectaPreRegistrationService.checkQualificationStatus();
      setStatus(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load qualification status');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step) => {
    if (!status) return 'pending';

    switch (step) {
      case 'profile':
        return status.profile?.status === 'ACTIVE' ? 'complete' : 
               status.profile?.status === 'PENDING' ? 'pending' : 'incomplete';
      case 'laboratory':
        return status.laboratory?.certified ? 'complete' : 'incomplete';
      case 'taster':
        return status.taster?.verified ? 'complete' : 'incomplete';
      case 'competence':
        return status.competenceCertificate?.valid ? 'complete' : 'incomplete';
      case 'license':
        return status.exportLicense?.valid ? 'complete' : 'incomplete';
      default:
        return 'incomplete';
    }
  };

  const getStatusIcon = (stepStatus) => {
    switch (stepStatus) {
      case 'complete':
        return <CheckCircle color="success" />;
      case 'pending':
        return <Warning color="warning" />;
      case 'incomplete':
        return <RadioButtonUnchecked color="disabled" />;
      default:
        return <ErrorIcon color="error" />;
    }
  };

  const calculateProgress = () => {
    if (!status) return 0;

    const steps = [
      getStepStatus('profile'),
      getStepStatus('laboratory'),
      getStepStatus('taster'),
      getStepStatus('competence'),
      getStepStatus('license'),
    ];

    const completed = steps.filter(s => s === 'complete').length;
    return (completed / steps.length) * 100;
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress === 100) return 'success';
    if (progress >= 60) return 'primary';
    if (progress >= 20) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Qualification Status
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
          <Button startIcon={<Refresh />} onClick={loadStatus} sx={{ mt: 2 }}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Qualification Status
          </Typography>
          <Button size="small" startIcon={<Refresh />} onClick={loadStatus}>
            Refresh
          </Button>
        </Box>

        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {Math.round(calculateProgress())}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={calculateProgress()}
            color={getProgressColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Qualification Status */}
        {status?.isQualified ? (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ You are fully qualified to create export requests!
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            Complete all requirements below to qualify for export operations
          </Alert>
        )}

        {/* Requirements Checklist */}
        <List>
          {/* Business Profile */}
          <ListItem>
            <ListItemIcon>
              {getStatusIcon(getStepStatus('profile'))}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" />
                  <Typography>Business Profile</Typography>
                </Box>
              }
              secondary={
                status?.profile?.status === 'ACTIVE' ? 'Approved by ECTA' :
                status?.profile?.status === 'PENDING' ? 'Waiting for ECTA approval' :
                'Not registered'
              }
            />
            {status?.profile?.status === 'PENDING' && (
              <Chip label="Pending" color="warning" size="small" />
            )}
          </ListItem>

          {/* Laboratory */}
          <ListItem>
            <ListItemIcon>
              {getStatusIcon(getStepStatus('laboratory'))}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Science fontSize="small" />
                  <Typography>Coffee Laboratory</Typography>
                </Box>
              }
              secondary={
                status?.laboratory?.certified ? 
                  `Certified (Expires: ${new Date(status.laboratory.certificationExpiryDate).toLocaleDateString()})` :
                  'Not certified'
              }
            />
          </ListItem>

          {/* Taster */}
          <ListItem>
            <ListItemIcon>
              {getStatusIcon(getStepStatus('taster'))}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" />
                  <Typography>Qualified Taster</Typography>
                </Box>
              }
              secondary={
                status?.taster?.verified ? 
                  `${status.taster.fullName} (Cert expires: ${new Date(status.taster.proficiencyCertificateExpiryDate).toLocaleDateString()})` :
                  'Not registered'
              }
            />
          </ListItem>

          {/* Competence Certificate */}
          <ListItem>
            <ListItemIcon>
              {getStatusIcon(getStepStatus('competence'))}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VerifiedUser fontSize="small" />
                  <Typography>Competence Certificate</Typography>
                </Box>
              }
              secondary={
                status?.competenceCertificate?.valid ? 
                  `${status.competenceCertificate.certificateNumber} (Expires: ${new Date(status.competenceCertificate.expiryDate).toLocaleDateString()})` :
                  'Not issued'
              }
            />
          </ListItem>

          {/* Export License */}
          <ListItem>
            <ListItemIcon>
              {getStatusIcon(getStepStatus('license'))}
            </ListItemIcon>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description fontSize="small" />
                  <Typography>Export License</Typography>
                </Box>
              }
              secondary={
                status?.exportLicense?.valid ? 
                  `${status.exportLicense.licenseNumber} (Expires: ${new Date(status.exportLicense.expiryDate).toLocaleDateString()})` :
                  'Not issued'
              }
            />
          </ListItem>
        </List>

        {/* Missing Requirements */}
        {status?.validation?.issues && status.validation.issues.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Missing Requirements:
            </Typography>
            <List dense>
              {status.validation.issues.map((issue, index) => (
                <ListItem key={index} sx={{ py: 0 }}>
                  <Typography variant="body2">• {issue}</Typography>
                </ListItem>
              ))}
            </List>
          </Alert>
        )}

        {/* Capital Requirement */}
        {status?.profile && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Minimum Capital Required
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  ETB {status.validation?.minimumCapitalRequired?.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Capital Verified
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {status.profile.capitalVerified ? (
                    <Chip label="Yes" color="success" size="small" />
                  ) : (
                    <Chip label="No" color="warning" size="small" />
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Action Button */}
        {!status?.isQualified && onNavigateToRegistration && (
          <Button
            fullWidth
            variant="contained"
            onClick={onNavigateToRegistration}
            sx={{ mt: 3 }}
          >
            Complete Registration
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default QualificationStatus;
