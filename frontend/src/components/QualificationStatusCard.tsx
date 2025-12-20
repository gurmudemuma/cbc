/**
 * Qualification Status Card Component
 * Shows exporter's pre-registration and licensing status
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Button,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  Award,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api';

const QualificationStatusCard = ({ user }) => {
  const [qualificationStatus, setQualificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'exporter') {
      fetchQualificationStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchQualificationStatus = async () => {
    try {
      const response = await apiClient.get('/api/exporter/qualification-status');
      setQualificationStatus(response.data.data);
    } catch (err) {
      setError('Could not load qualification status');
      console.error('Qualification status error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (hasRequirement) => {
    if (hasRequirement) {
      return <CheckCircle size={16} color="#4caf50" />;
    }
    return <AlertCircle size={16} color="#ff9800" />;
  };

  const getStatusColor = (hasRequirement) => {
    return hasRequirement ? 'success' : 'warning';
  };

  const calculateProgress = (validation) => {
    if (!validation) return 0;
    
    const requirements = [
      validation.hasValidProfile,
      validation.hasMinimumCapital,
      validation.hasCertifiedLaboratory,
      validation.hasQualifiedTaster,
      validation.hasCompetenceCertificate,
      validation.hasExportLicense,
    ];
    
    const completed = requirements.filter(Boolean).length;
    return (completed / requirements.length) * 100;
  };

  if (user?.role !== 'exporter') {
    return null; // Don't show for non-exporters
  }

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
        </CardContent>
      </Card>
    );
  }

  const { validation, canCreateExportRequest, reason, requiredActions } = qualificationStatus || {};
  const progress = calculateProgress(validation);

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Qualification Status
          </Typography>
          <Chip
            label={canCreateExportRequest ? 'Qualified' : 'Incomplete'}
            color={canCreateExportRequest ? 'success' : 'warning'}
            size="small"
          />
        </Box>

        {/* Progress Bar */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2" color="textSecondary">
              Completion Progress
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            color={canCreateExportRequest ? 'success' : 'primary'}
          />
        </Box>

        {validation && (
          <Stack spacing={1} mb={2}>
            {/* Business Profile */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(validation.hasValidProfile)}
              <Typography variant="body2">
                Business Profile
              </Typography>
              <Chip
                label={validation.hasValidProfile ? 'Approved' : 'Pending'}
                size="small"
                color={getStatusColor(validation.hasValidProfile)}
                variant="outlined"
              />
            </Box>

            {/* Capital Verification */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(validation.hasMinimumCapital)}
              <Typography variant="body2">
                Capital Verification
              </Typography>
              <Chip
                label={validation.hasMinimumCapital ? 'Verified' : 'Required'}
                size="small"
                color={getStatusColor(validation.hasMinimumCapital)}
                variant="outlined"
              />
            </Box>

            {/* Laboratory Certification */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(validation.hasCertifiedLaboratory)}
              <Typography variant="body2">
                Laboratory Certification
              </Typography>
              <Chip
                label={validation.hasCertifiedLaboratory ? 'Certified' : 'Required'}
                size="small"
                color={getStatusColor(validation.hasCertifiedLaboratory)}
                variant="outlined"
              />
            </Box>

            {/* Qualified Taster */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(validation.hasQualifiedTaster)}
              <Typography variant="body2">
                Qualified Taster
              </Typography>
              <Chip
                label={validation.hasQualifiedTaster ? 'Verified' : 'Required'}
                size="small"
                color={getStatusColor(validation.hasQualifiedTaster)}
                variant="outlined"
              />
            </Box>

            {/* Competence Certificate */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(validation.hasCompetenceCertificate)}
              <Typography variant="body2">
                Competence Certificate
              </Typography>
              <Chip
                label={validation.hasCompetenceCertificate ? 'Valid' : 'Required'}
                size="small"
                color={getStatusColor(validation.hasCompetenceCertificate)}
                variant="outlined"
              />
            </Box>

            {/* Export License */}
            <Box display="flex" alignItems="center" gap={1}>
              {getStatusIcon(validation.hasExportLicense)}
              <Typography variant="body2">
                Export License
              </Typography>
              <Chip
                label={validation.hasExportLicense ? 'Valid' : 'Required'}
                size="small"
                color={getStatusColor(validation.hasExportLicense)}
                variant="outlined"
              />
            </Box>
          </Stack>
        )}

        {!canCreateExportRequest && (
          <>
            <Divider sx={{ my: 2 }} />
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {reason}
              </Typography>
            </Alert>
            
            {requiredActions && requiredActions.length > 0 && (
              <Box mb={2}>
                <Typography variant="body2" fontWeight="bold" mb={1}>
                  Required Actions:
                </Typography>
                <Stack spacing={0.5}>
                  {requiredActions.map((action, index) => (
                    <Typography key={index} variant="body2" color="textSecondary">
                      • {action}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => navigate('/pre-registration')}
              startIcon={<UserCheck size={16} />}
            >
              Complete Pre-Registration
            </Button>
          </>
        )}

        {canCreateExportRequest && (
          <Alert severity="success">
            <Typography variant="body2">
              ✅ You are qualified to create export requests!
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default QualificationStatusCard;
