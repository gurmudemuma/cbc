import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import {
  Description,
  Send,
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Info,
  Business,
} from '@mui/icons-material';
import documentService from '../services/document.service';

// Document types and their corresponding network members
const DOCUMENT_TYPES = [
  { value: 'EXPORT_LICENSE', label: 'Export License', issuer: 'ECTA', required: true },
  { value: 'PHYTOSANITARY_CERTIFICATE', label: 'Phytosanitary Certificate', issuer: 'MOA', required: true },
  { value: 'HEALTH_CERTIFICATE', label: 'Health Certificate', issuer: 'MOH', required: true },
  { value: 'FUMIGATION_CERTIFICATE', label: 'Fumigation Certificate', issuer: 'MOA', required: false },
  { value: 'QUALITY_CERTIFICATE', label: 'Quality Certificate', issuer: 'ECX', required: true },
  { value: 'CERTIFICATE_OF_ORIGIN', label: 'Certificate of Origin', issuer: 'ECTA', required: true },
  { value: 'BANK_GUARANTEE', label: 'Bank Guarantee', issuer: 'BANK', required: true },
  { value: 'SHIPPING_BOOKING', label: 'Shipping Booking', issuer: 'SHIPPING', required: true },
  { value: 'CUSTOMS_CLEARANCE', label: 'Customs Clearance', issuer: 'ERCA', required: true },
];

// Network member codes and names
const NETWORK_MEMBERS = [
  { code: 'ECTA', name: 'Ethiopian Coffee & Tea Authority' },
  { code: 'MOA', name: 'Ministry of Agriculture' },
  { code: 'MOH', name: 'Ministry of Health' },
  { code: 'ECX', name: 'Ethiopian Commodity Exchange' },
  { code: 'BANK', name: 'Commercial Bank' },
  { code: 'SHIPPING', name: 'Shipping Line' },
  { code: 'ERCA', name: 'Ethiopian Revenue & Customs Authority' },
];

interface DocumentRequest {
  requestId: string;
  networkMemberCode: string;
  documentType: string;
  status: string;
  requestNotes?: string;
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

interface DocumentRequestInterfaceProps {
  exporterId?: string;
  onRequestSubmitted?: () => void;
}

const DocumentRequestInterface: React.FC<DocumentRequestInterfaceProps> = ({
  exporterId,
  onRequestSubmitted,
}) => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [documentType, setDocumentType] = useState('');
  const [networkMemberCode, setNetworkMemberCode] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  
  // Requests state
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch existing requests
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await documentService.getDocumentRequests();
      if (response.success) {
        setRequests(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch requests:', err);
      setError(err.response?.data?.message || 'Failed to load document requests');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    // Auto-select network member based on document type
    const docType = DOCUMENT_TYPES.find(d => d.value === value);
    if (docType) {
      setNetworkMemberCode(docType.issuer);
    }
  };

  const handleSubmitRequest = async () => {
    if (!documentType || !networkMemberCode) {
      setError('Please select a document type');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await documentService.requestDocument({
        networkMemberCode,
        documentType,
        requestNotes,
      });

      if (response.success) {
        setSuccess(`Document request submitted successfully to ${NETWORK_MEMBERS.find(m => m.code === networkMemberCode)?.name}`);
        setDocumentType('');
        setNetworkMemberCode('');
        setRequestNotes('');
        setDialogOpen(false);
        
        // Refresh requests list
        await fetchRequests();
        
        // Notify parent component
        if (onRequestSubmitted) {
          onRequestSubmitted();
        }
      }
    } catch (err: any) {
      console.error('Failed to submit request:', err);
      setError(err.response?.data?.message || 'Failed to submit document request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return <CheckCircle color="success" />;
      case 'PENDING':
      case 'UNDER_REVIEW':
        return <HourglassEmpty color="warning" />;
      case 'REJECTED':
        return <Cancel color="error" />;
      default:
        return <Info color="info" />;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'ISSUED':
        return 'success';
      case 'PENDING':
      case 'UNDER_REVIEW':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'ISSUED':
        return 'Issued';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description /> Document Requests
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Send />}
          onClick={() => setDialogOpen(true)}
        >
          Request Document
        </Button>
      </Box>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Info Banner */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Request required documents from network members. Once issued, you can use them for network submission.
      </Alert>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Requests List */}
      {!loading && (
        <Grid container spacing={3}>
          {/* Required Documents Overview */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Required Documents
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {DOCUMENT_TYPES.map((docType) => {
                    const request = requests.find(r => r.documentType === docType.value);
                    const member = NETWORK_MEMBERS.find(m => m.code === docType.issuer);
                    
                    return (
                      <Grid item xs={12} md={6} key={docType.value}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: request?.status === 'ISSUED' ? '#f0f9ff' : 'background.paper',
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {docType.label}
                              {docType.required && (
                                <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Issuer: {member?.name}
                            </Typography>
                            {request && (
                              <Box sx={{ mt: 1 }}>
                                <Chip
                                  label={getStatusLabel(request.status)}
                                  size="small"
                                  color={getStatusColor(request.status)}
                                  icon={getStatusIcon(request.status)}
                                />
                                {request.status === 'REJECTED' && request.rejectionReason && (
                                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                    Reason: {request.rejectionReason}
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                          {!request && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setDocumentType(docType.value);
                                setNetworkMemberCode(docType.issuer);
                                setDialogOpen(true);
                              }}
                            >
                              Request
                            </Button>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Request History */}
          {requests.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Request History
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <List>
                    {requests.map((request) => {
                      const docType = DOCUMENT_TYPES.find(d => d.value === request.documentType);
                      const member = NETWORK_MEMBERS.find(m => m.code === request.networkMemberCode);
                      
                      return (
                        <ListItem
                          key={request.requestId}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1,
                          }}
                        >
                          <ListItemIcon>
                            {getStatusIcon(request.status)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {docType?.label || request.documentType}
                                </Typography>
                                <Chip
                                  label={getStatusLabel(request.status)}
                                  size="small"
                                  color={getStatusColor(request.status)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                                  {member?.name}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  Requested: {new Date(request.requestedAt).toLocaleString()}
                                </Typography>
                                {request.reviewedAt && (
                                  <Typography variant="caption" display="block">
                                    Reviewed: {new Date(request.reviewedAt).toLocaleString()}
                                  </Typography>
                                )}
                                {request.requestNotes && (
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    Notes: {request.requestNotes}
                                  </Typography>
                                )}
                                {request.rejectionReason && (
                                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                                    Rejection Reason: {request.rejectionReason}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      );
                    })}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Request Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => handleDocumentTypeChange(e.target.value)}
                label="Document Type"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label} {type.required && '(Required)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled>
              <InputLabel>Network Member (Auto-selected)</InputLabel>
              <Select
                value={networkMemberCode}
                label="Network Member (Auto-selected)"
              >
                {NETWORK_MEMBERS.map((member) => (
                  <MenuItem key={member.code} value={member.code}>
                    {member.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Request Notes (Optional)"
              multiline
              rows={3}
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="Add any additional information for the network member..."
            />

            <Alert severity="info">
              The network member will review your qualification profile before issuing the document.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitRequest}
            variant="contained"
            disabled={submitting || !documentType}
            startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentRequestInterface;
