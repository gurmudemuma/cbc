import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  Typography,
  Box,
  Divider,
  Alert,
} from '@mui/material';
import { CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';

/**
 * Document Checklist Component
 * Displays upload and verification status for all required documents
 */
const DocumentChecklist = ({ exportId, onUpdate }) => {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocumentStatus();
  }, [exportId]);

  const fetchDocumentStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/exports/${exportId}/documents`);
      setChecklist(response.data.data);
      
      if (onUpdate) {
        onUpdate(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document status');
    } finally {
      setLoading(false);
    }
  };

  const formatDocumentName = (docKey) => {
    return docKey
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getDocumentIcon = (status) => {
    if (status.verified) {
      return <CheckCircle size={24} color="#4caf50" />;
    }
    if (status.uploaded) {
      return <Clock size={24} color="#ff9800" />;
    }
    return <XCircle size={24} color="#f44336" />;
  };

  const getDocumentStatus = (status) => {
    if (status.verified) {
      return {
        label: 'Verified',
        color: 'success',
        detail: `by ${status.verifiedBy} on ${new Date(status.verifiedAt).toLocaleDateString()}`,
      };
    }
    if (status.uploaded) {
      return {
        label: 'Uploaded',
        color: 'warning',
        detail: 'Pending verification',
      };
    }
    return {
      label: 'Not Uploaded',
      color: 'error',
      detail: status.required ? 'Required' : 'Optional',
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="Document Checklist" />
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
            Loading document status...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="Document Checklist" />
        <CardContent>
          <Alert severity="error" icon={<AlertCircle />}>
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!checklist) {
    return null;
  }

  const { checklist: documents, completionPercentage, stageRequirements } = checklist;
  const missingRequired = stageRequirements?.missingDocuments || [];

  return (
    <Card>
      <CardHeader 
        title="Document Checklist" 
        subheader={`Current Stage: ${checklist.status}`}
      />
      <CardContent>
        {/* Overall Progress */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Overall Completion
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {completionPercentage}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Missing Documents Alert */}
        {missingRequired.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Missing Required Documents ({missingRequired.length})
            </Typography>
            <Typography variant="caption">
              {missingRequired.map(formatDocumentName).join(', ')}
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Document List */}
        <List>
          {Object.entries(documents).map(([docKey, status]: [string, any], index: number) => {
            const docStatus = getDocumentStatus(status);
            
            return (
              <ListItem 
                key={docKey}
                sx={{ 
                  px: 0,
                  borderBottom: index < Object.entries(documents).length - 1 ? '1px solid #e0e0e0' : 'none',
                }}
              >
                <ListItemIcon>
                  {getDocumentIcon(status)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="medium">
                        {formatDocumentName(docKey)}
                      </Typography>
                      {status?.required && (
                        <Chip 
                          label="Required" 
                          size="small" 
                          color="error" 
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        label={docStatus.label} 
                        size="small" 
                        color={docStatus.color as any}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {docStatus.detail}
                      </Typography>
                      {status?.cid && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                          CID: {status.cid.substring(0, 20)}...
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            );
          })}
        </List>

        {/* Stage Requirements */}
        {stageRequirements && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Current Stage Requirements
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Required: {stageRequirements.requiredDocuments.length} documents
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              Optional: {stageRequirements.optionalDocuments.length} documents
            </Typography>
            <br />
            {stageRequirements.canProceed ? (
              <Chip 
                label="Ready to Proceed" 
                color="success" 
                size="small" 
                icon={<CheckCircle size={16} />}
                sx={{ mt: 1 }}
              />
            ) : (
              <Chip 
                label="Missing Required Documents" 
                color="error" 
                size="small" 
                icon={<AlertCircle size={16} />}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentChecklist;
