import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Input,
  FormHelperText,
} from '@mui/material';
import {
  Description,
  CheckCircle,
  Cancel,
  ExpandMore,
  ExpandLess,
  Upload,
  Business,
  Assignment,
  Verified,
  Warning,
} from '@mui/icons-material';
import documentService from '../services/document.service';

interface ExporterQualification {
  profileStatus: string;
  licenseStatus: string;
  competenceStatus: string;
  laboratoryStatus: string;
  tasterStatus: string;
}

interface DocumentRequest {
  requestId: string;
  exporterId: string;
  exporterName: string;
  documentType: string;
  requestNotes?: string;
  requestedAt: string;
  requestStatus: string;
  exporterQualification: ExporterQualification;
}

interface IssueFormData {
  documentNumber: string;
  expiryDate: string;
  metadata: {
    inspectionDate?: string;
    inspectorName?: string;
    validityPeriod?: string;
    notes?: string;
  };
  documentFile: File | null;
}

const NetworkMemberDocumentIssuance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Requests state
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  
  // Dialog states
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  
  // Form states
  const [issueForm, setIssueForm] = useState<IssueFormData>({
    documentNumber: '',
    expiryDate: '',
    metadata: {},
    documentFile: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await documentService.getPendingRequests();
      if (response.success) {
        setRequests(response.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch pending requests:', err);
      setError(err.response?.data?.error || 'Failed to load pending document requests');
    } finally {
      setLoading(false);
    }
  };

  const handleExpandRequest = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const handleOpenIssueDialog = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setIssueForm({
      documentNumber: '',
      expiryDate: '',
      metadata: {},
      documentFile: null,
    });
    setIssueDialogOpen(true);
  };

  const handleOpenRejectDialog = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      setIssueForm({ ...issueForm, documentFile: file });
      setError(null);
    }
  };

  const handleIssueDocument = async () => {
    if (!selectedRequest) return;

    // Validation
    if (!issueForm.documentNumber.trim()) {
      setError('Document number is required');
      return;
    }
    if (!issueForm.documentFile) {
      setError('Please upload a signed PDF document');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Convert file to base64
      const base64File = await fileToBase64(issueForm.documentFile);

      const issueData = {
        requestId: selectedRequest.requestId,
        exporterId: selectedRequest.exporterId,
        documentType: selectedRequest.documentType,
        documentNumber: issueForm.documentNumber,
        documentMetadata: issueForm.metadata,
        expiryDate: issueForm.expiryDate || undefined,
        documentFile: base64File,
      };

      const response = await documentService.issueDocument(issueData);

      if (response.success) {
        setSuccess(`Document ${issueForm.documentNumber} issued successfully to ${selectedRequest.exporterName}`);
        setIssueDialogOpen(false);
        setSelectedRequest(null);
        
        // Refresh requests list
        await fetchPendingRequests();
      }
    } catch (err: any) {
      console.error('Failed to issue document:', err);
      setError(err.response?.data?.error || 'Failed to issue document');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    if (!rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await documentService.rejectRequest(selectedRequest.requestId, {
        rejectionReason,
      });

      if (response.success) {
        setSuccess(`Document request rejected for ${selectedRequest.exporterName}`);
        setRejectDialogOpen(false);
        setSelectedRequest(null);
        
        // Refresh requests list
        await fetchPendingRequests();
      }
    } catch (err: any) {
      console.error('Failed to reject request:', err);
      setError(err.response?.data?.error || 'Failed to reject document request');
    } finally {
      setSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const getQualificationStatusIcon = (status: string) => {
    if (status === 'ACTIVE') {
      return <CheckCircle color="success" fontSize="small" />;
    }
    return <Warning color="warning" fontSize="small" />;
  };

  const getQualificationStatusColor = (status: string): "success" | "warning" | "error" => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'MISSING') return 'error';
    return 'warning';
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment /> Document Issuance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Review document requests from exporters and issue signed documents
        </Typography>
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

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* No Requests */}
      {!loading && requests.length === 0 && (
        <Alert severity="info">
          No pending document requests at this time.
        </Alert>
      )}

      {/* Requests List */}
      {!loading && requests.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="50px"></TableCell>
                <TableCell>Exporter</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Requested Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <React.Fragment key={request.requestId}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleExpandRequest(request.requestId)}
                      >
                        {expandedRequest === request.requestId ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" color="action" />
                        <Typography variant="body2">{request.exporterName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {documentService.getDocumentTypeLabel(request.documentType)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.requestStatus}
                        size="small"
                        color={request.requestStatus === 'PENDING' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<CheckCircle />}
                        onClick={() => handleOpenIssueDialog(request)}
                        sx={{ mr: 1 }}
                      >
                        Issue
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleOpenRejectDialog(request)}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row - Exporter Qualification */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: 'none' }}>
                      <Collapse in={expandedRequest === request.requestId} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Verified /> Exporter Qualification Profile
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Profile Status
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  {getQualificationStatusIcon(request.exporterQualification.profileStatus)}
                                  <Chip
                                    label={request.exporterQualification.profileStatus}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification.profileStatus)}
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Export License
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  {getQualificationStatusIcon(request.exporterQualification.licenseStatus)}
                                  <Chip
                                    label={request.exporterQualification.licenseStatus}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification.licenseStatus)}
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Competence Certificate
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  {getQualificationStatusIcon(request.exporterQualification.competenceStatus)}
                                  <Chip
                                    label={request.exporterQualification.competenceStatus}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification.competenceStatus)}
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Laboratory Status
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  {getQualificationStatusIcon(request.exporterQualification.laboratoryStatus)}
                                  <Chip
                                    label={request.exporterQualification.laboratoryStatus}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification.laboratoryStatus)}
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Taster Status
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  {getQualificationStatusIcon(request.exporterQualification.tasterStatus)}
                                  <Chip
                                    label={request.exporterQualification.tasterStatus}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification.tasterStatus)}
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          {request.requestNotes && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Request Notes
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#f5f5f5' }}>
                                <Typography variant="body2">{request.requestNotes}</Typography>
                              </Paper>
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Issue Document Dialog */}
      <Dialog
        open={issueDialogOpen}
        onClose={() => !submitting && setIssueDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Issue Document
          {selectedRequest && (
            <Typography variant="body2" color="text.secondary">
              {documentService.getDocumentTypeLabel(selectedRequest.documentType)} for {selectedRequest.exporterName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              required
              label="Document Number"
              value={issueForm.documentNumber}
              onChange={(e) => setIssueForm({ ...issueForm, documentNumber: e.target.value })}
              placeholder="e.g., LIC-2026-001"
              helperText="Unique identifier for this document"
            />

            <TextField
              fullWidth
              label="Expiry Date"
              type="date"
              value={issueForm.expiryDate}
              onChange={(e) => setIssueForm({ ...issueForm, expiryDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty if document does not expire"
            />

            <Divider />

            <Typography variant="subtitle2">Additional Metadata (Optional)</Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Inspection Date"
                  type="date"
                  value={issueForm.metadata.inspectionDate || ''}
                  onChange={(e) =>
                    setIssueForm({
                      ...issueForm,
                      metadata: { ...issueForm.metadata, inspectionDate: e.target.value },
                    })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Inspector Name"
                  value={issueForm.metadata.inspectorName || ''}
                  onChange={(e) =>
                    setIssueForm({
                      ...issueForm,
                      metadata: { ...issueForm.metadata, inspectorName: e.target.value },
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Validity Period"
                  value={issueForm.metadata.validityPeriod || ''}
                  onChange={(e) =>
                    setIssueForm({
                      ...issueForm,
                      metadata: { ...issueForm.metadata, validityPeriod: e.target.value },
                    })
                  }
                  placeholder="e.g., 90 days"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={issueForm.metadata.notes || ''}
                  onChange={(e) =>
                    setIssueForm({
                      ...issueForm,
                      metadata: { ...issueForm.metadata, notes: e.target.value },
                    })
                  }
                />
              </Grid>
            </Grid>

            <Divider />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Upload Signed Document (PDF) *
              </Typography>
              <FormControl fullWidth>
                <Input
                  type="file"
                  inputProps={{ accept: 'application/pdf' }}
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                <FormHelperText>
                  {issueForm.documentFile
                    ? `Selected: ${issueForm.documentFile.name} (${(issueForm.documentFile.size / 1024).toFixed(2)} KB)`
                    : 'Upload a signed PDF document (max 10MB)'}
                </FormHelperText>
              </FormControl>
            </Box>

            <Alert severity="info">
              The document will be recorded on blockchain with your digital signature for tamper-proof verification.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssueDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleIssueDocument}
            variant="contained"
            disabled={submitting || !issueForm.documentNumber || !issueForm.documentFile}
            startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {submitting ? 'Issuing...' : 'Issue Document'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Request Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => !submitting && setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Reject Document Request
          {selectedRequest && (
            <Typography variant="body2" color="text.secondary">
              {documentService.getDocumentTypeLabel(selectedRequest.documentType)} for {selectedRequest.exporterName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide a clear reason for rejecting this document request..."
              helperText="The exporter will see this reason"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleRejectRequest}
            variant="contained"
            color="error"
            disabled={submitting || !rejectionReason.trim()}
            startIcon={submitting ? <CircularProgress size={20} /> : <Cancel />}
          >
            {submitting ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NetworkMemberDocumentIssuance;
