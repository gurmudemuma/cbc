import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Stack,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  Download,
  Upload,
  Info,
} from 'lucide-react';
import apiClient from '../services/api';

interface DocumentItem {
  name: string;
  uploaded: boolean;
  cid?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  validated?: boolean;
}

interface DocumentChecklistUIProps {
  exportId: string;
  status: string;
  onDocumentUpload?: () => void;
}

/**
 * Document Checklist UI Component
 * Displays document upload status and requirements for each stage
 */
export const DocumentChecklistUI = ({
  exportId,
  status,
  onDocumentUpload,
}: DocumentChecklistUIProps) => {
  const [checklist, setChecklist] = useState<any>(null);
  const [requirements, setRequirements] = useState<any>(null);
  const [instructions, setInstructions] = useState<any>(null);
  const [completionStatus, setCompletionStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentData();
  }, [exportId, status]);

  const fetchDocumentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all document data in parallel
      const [checklistRes, requirementsRes, instructionsRes, completionRes] = await Promise.all([
        apiClient.get(`/api/documents/${exportId}/checklist`),
        apiClient.get(`/api/documents/${exportId}/requirements`),
        apiClient.get(`/api/documents/${exportId}/instructions`),
        apiClient.get(`/api/documents/${exportId}/completion`),
      ]);

      setChecklist(checklistRes.data.data.checklist);
      setRequirements(requirementsRes.data.data.requirements);
      setInstructions(instructionsRes.data.data.instructions);
      setCompletionStatus(completionRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch document data');
      console.error('Error fetching document data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <AlertTitle>Error</AlertTitle>
        {error}
      </Alert>
    );
  }

  const getDocumentIcon = (uploaded: boolean, validated?: boolean) => {
    if (validated) {
      return <span><CheckCircle size={20} color="#4caf50" /></span>;
    }
    if (uploaded) {
      return <span><FileText size={20} color="#2196f3" /></span>;
    }
    return <span><AlertCircle size={20} color="#ff9800" /></span>;
  };

  const getDocumentStatus = (uploaded: boolean, validated?: boolean) => {
    if (validated) {
      return { label: 'Validated', color: 'success' as const };
    }
    if (uploaded) {
      return { label: 'Uploaded', color: 'info' as const };
    }
    return { label: 'Missing', color: 'warning' as const };
  };

  return (
    <Stack spacing={3}>
      {/* Overall Completion Status */}
      <Card>
        <CardHeader
          title="Document Completion Status"
          subheader={`${completionStatus?.uploadedCount || 0} of ${completionStatus?.totalCount || 0} documents uploaded`}
        />
        <CardContent>
          <Stack spacing={2}>
            {/* Progress Bar */}
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Overall Progress
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {completionStatus?.completionPercentage || 0}%
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={completionStatus?.completionPercentage || 0}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Status Message */}
            {completionStatus?.canProceed ? (
              <Alert severity="success" icon={<CheckCircle size={20} />}>
                <AlertTitle>Ready to Proceed</AlertTitle>
                All required documents are uploaded. You can proceed to the next stage.
              </Alert>
            ) : (
              <Alert severity="warning" icon={<AlertCircle size={20} />}>
                <AlertTitle>Missing Documents</AlertTitle>
                {completionStatus?.missingDocuments?.length || 0} required document(s) still need to be uploaded.
              </Alert>
            )}

            {/* Next Action */}
            {completionStatus?.nextAction && (
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  NEXT ACTION
                </Typography>
                <Typography variant="body2" fontWeight="500">
                  {completionStatus.nextAction}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Required Documents */}
      {requirements?.requiredDocuments && requirements.requiredDocuments.length > 0 && (
        <Card>
          <CardHeader
            title="Required Documents"
            subheader={`${requirements.requiredDocuments.length} document(s) required for this stage`}
          />
          <CardContent>
            <List>
              {requirements.requiredDocuments.map((docName: string, index: number) => {
                const doc = checklist?.[docName];
                const status = getDocumentStatus(doc?.uploaded, doc?.validated);

                return (
                  <Box key={docName}>
                    <ListItem
                      sx={{
                        bgcolor: doc?.uploaded ? 'rgba(76, 175, 80, 0.05)' : 'rgba(255, 152, 0, 0.05)',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>{getDocumentIcon(doc?.uploaded, doc?.validated)}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="500">
                            {docName.replace(/([A-Z])/g, ' $1').trim()}
                          </Typography>
                        }
                        secondary={
                          doc?.uploadedAt && (
                            <Typography variant="caption" color="text.secondary">
                              Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                            </Typography>
                          )
                        }
                      />
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                        variant={doc?.uploaded ? 'filled' : 'outlined'}
                      />
                    </ListItem>
                    {index < requirements.requiredDocuments.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Optional Documents */}
      {requirements?.optionalDocuments && requirements.optionalDocuments.length > 0 && (
        <Card>
          <CardHeader
            title="Optional Documents"
            subheader={`${requirements.optionalDocuments.length} document(s) optional for this stage`}
          />
          <CardContent>
            <List>
              {requirements.optionalDocuments.map((docName: string, index: number) => {
                const doc = checklist?.[docName];
                const status = getDocumentStatus(doc?.uploaded, doc?.validated);

                return (
                  <Box key={docName}>
                    <ListItem
                      sx={{
                        bgcolor: doc?.uploaded ? 'rgba(33, 150, 243, 0.05)' : 'rgba(158, 158, 158, 0.05)',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>{getDocumentIcon(doc?.uploaded, doc?.validated)}</ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="500">
                            {docName.replace(/([A-Z])/g, ' $1').trim()}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Optional
                          </Typography>
                        }
                      />
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                        variant={doc?.uploaded ? 'filled' : 'outlined'}
                      />
                    </ListItem>
                    {index < requirements.optionalDocuments.length - 1 && <Divider />}
                  </Box>
                );
              })}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Upload Instructions */}
      {instructions && Object.keys(instructions).length > 0 && (
        <Card>
          <CardHeader
            title="Upload Instructions"
            avatar={<span><Info size={20} /></span>}
          />
          <CardContent>
            <Stack spacing={2}>
              {Object.entries(instructions).map(([docName, instruction]: [string, any]) => (
                <Box key={docName} sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 0.5 }}>
                    {docName.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {instruction}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          startIcon={<Upload size={18} />}
          fullWidth
          onClick={onDocumentUpload}
        >
          Upload Documents
        </Button>
        <Button
          variant="outlined"
          startIcon={<Download size={18} />}
          fullWidth
          onClick={fetchDocumentData}
        >
          Refresh Status
        </Button>
      </Stack>

      {/* Missing Documents Alert */}
      {completionStatus?.missingDocuments && completionStatus.missingDocuments.length > 0 && (
        <Alert severity="error" icon={<AlertCircle size={20} />}>
          <AlertTitle>Missing Required Documents</AlertTitle>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please upload the following documents to proceed:
          </Typography>
          <Box sx={{ mt: 1 }}>
            {completionStatus.missingDocuments.map((doc: string) => (
              <Typography key={doc} variant="body2" sx={{ ml: 2 }}>
                • {doc.replace(/([A-Z])/g, ' $1').trim()}
              </Typography>
            ))}
          </Box>
        </Alert>
      )}
    </Stack>
  );
};

export default DocumentChecklistUI;
