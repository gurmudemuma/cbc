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
  profile_status: string;
  license_status: string;
  competence_status: string;
  laboratory_status: string;
  taster_status: string;
}

interface DocumentRequest {
  request_id: string;
  exporter_id: string;
  exporter_name: string;
  exporter_tin: string;
  exporter_email: string;
  exporter_contact_person?: string;
  exporter_phone?: string;
  laboratory_inspector?: string;
  last_inspection_date?: string;
  laboratory_name?: string;
  taster_name?: string;
  proficiency_certificate_number?: string;
  taster_certificate_date?: string;
  license_number?: string;
  license_issue_date?: string;
  license_expiry_date?: string;
  competence_certificate_number?: string;
  competence_issue_date?: string;
  competence_expiry_date?: string;
  document_type: string;
  priority?: string;
  request_notes?: string;
  requested_at: string;
  request_status: string;
  exporter_qualification: ExporterQualification;
  ecta_reference_number?: string;
  required_data?: Record<string, any>;
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
        setRequests(response.requests || []);
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
    // Auto-generate document number based on document type and agency
    const userRole = 'ECTA'; // TODO: Get from auth context
    const timestamp = Date.now();
    const docNumber = `${userRole}-${request.document_type}-${timestamp}`;
    
    // Pre-fill metadata based on document type and request data
    const metadata: any = {};
    const requiredData = request.required_data || {};
    
    // Add common metadata (using snake_case from API)
    metadata.contractReference = request.ecta_reference_number;
    metadata.exporterTin = request.exporter_tin;
    metadata.exporterName = request.exporter_name;
    metadata.issuedBy = userRole;
    metadata.issuedDate = new Date().toISOString();
    
    // Fetch inspection date from qualification data
    const inspectionDate = request.last_inspection_date 
      ? new Date(request.last_inspection_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    metadata.inspectionDate = inspectionDate;
    
    // Fetch inspector name from qualification data
    // Priority: laboratory_inspector > taster_name > contact_person > default
    let inspectorName = `${userRole} Inspector`; // Default
    if (request.laboratory_inspector) {
      inspectorName = request.laboratory_inspector;
    } else if (request.taster_name) {
      inspectorName = request.taster_name;
    } else if (request.exporter_contact_person) {
      inspectorName = request.exporter_contact_person;
    }
    metadata.inspectorName = inspectorName;
    
    // Add document-specific metadata from required_data
    if (requiredData.coffeeType) metadata.coffeeType = requiredData.coffeeType;
    if (requiredData.quantity) metadata.quantity = requiredData.quantity;
    if (requiredData.destination) metadata.destination = requiredData.destination;
    if (requiredData.originRegion) metadata.originRegion = requiredData.originRegion;
    if (requiredData.productType) metadata.productType = requiredData.productType;
    
    // Set default expiry date based on document type and qualification data
    const issuedDate = new Date();
    let expiryDate = new Date();
    
    // Use qualification expiry dates if available
    if (request.document_type === 'EXPORT_LICENSE' && request.license_expiry_date) {
      expiryDate = new Date(request.license_expiry_date);
    } else if (request.document_type === 'COMPETENCE_CERTIFICATE' && request.competence_expiry_date) {
      expiryDate = new Date(request.competence_expiry_date);
    } else {
      // Default: 1 year from now
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    // Calculate validity period in days
    const validityPeriodDays = Math.ceil((expiryDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
    metadata.validityPeriod = `${validityPeriodDays} days`;
    
    // Add notes template based on document type and qualification data
    let notes = '';
    switch (request.document_type) {
      case 'EXPORT_LICENSE':
        notes = `This export license authorizes ${request.exporter_name} (TIN: ${request.exporter_tin}) to export coffee as specified in the contract. Inspected by ${inspectorName} on ${inspectionDate}.`;
        break;
      case 'PHYTOSANITARY_CERTIFICATE':
        notes = `Product inspected by ${inspectorName} on ${inspectionDate} and found free from pests and diseases. Meets phytosanitary requirements for export.`;
        break;
      case 'HEALTH_CERTIFICATE':
        notes = `Product inspected by ${inspectorName} on ${inspectionDate} and meets health and safety standards for export. Complies with international food safety regulations.`;
        break;
      case 'QUALITY_CERTIFICATE':
        notes = `Coffee quality verified by ${inspectorName} on ${inspectionDate} and meets specified grade standards. Laboratory analysis confirms quality parameters.`;
        break;
      case 'CERTIFICATE_OF_ORIGIN':
        notes = `Certifies that the coffee originates from Ethiopia. Verified by ${inspectorName} on ${inspectionDate}.`;
        break;
      default:
        notes = `Document issued by ${userRole} for ${request.exporter_name}. Verified by ${inspectorName} on ${inspectionDate}.`;
    }
    metadata.notes = notes;
    
    setSelectedRequest(request);
    setIssueForm({
      documentNumber: docNumber,
      expiryDate: expiryDate.toISOString().split('T')[0],
      metadata: metadata,
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
  
  const handleExpiryDateChange = (newExpiryDate: string) => {
    // Recalculate validity period when expiry date changes
    const issuedDate = new Date();
    const expiryDate = new Date(newExpiryDate);
    const validityPeriodDays = Math.ceil((expiryDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    setIssueForm({
      ...issueForm,
      expiryDate: newExpiryDate,
      metadata: {
        ...issueForm.metadata,
        validityPeriod: `${validityPeriodDays} days`
      }
    });
  };

  const handleIssueDocument = async () => {
    if (!selectedRequest) return;

    // Validation
    if (!issueForm.documentNumber.trim()) {
      setError('Document number is required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const issueData = {
        requestId: selectedRequest.request_id,
        exporterId: selectedRequest.exporter_id,
        documentType: selectedRequest.document_type,
        documentNumber: issueForm.documentNumber,
        documentMetadata: issueForm.metadata,
        expiryDate: issueForm.expiryDate || undefined,
      };

      const response = await documentService.issueDocument(issueData);

      if (response.success) {
        setSuccess(`Document ${issueForm.documentNumber} issued and signed with MSP certificate for ${selectedRequest.exporter_name}`);
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
  
  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
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

      const response = await documentService.rejectRequest(selectedRequest.request_id, {
        rejectionReason,
      });

      if (response.success) {
        setSuccess(`Document request rejected for ${selectedRequest.exporter_name}`);
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
    if (status === 'ACTIVE' || status === 'FULLY_QUALIFIED') {
      return <CheckCircle color="success" fontSize="small" />;
    }
    return <Warning color="warning" fontSize="small" />;
  };

  const getQualificationStatusColor = (status: string): "success" | "warning" | "error" => {
    if (status === 'ACTIVE' || status === 'FULLY_QUALIFIED') return 'success';
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
                <TableCell>Reference</TableCell>
                <TableCell>Exporter</TableCell>
                <TableCell>Document Type</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <React.Fragment key={request.request_id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleExpandRequest(request.request_id)}
                      >
                        {expandedRequest === request.request_id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {request.ecta_reference_number || request.request_id.substring(0, 8).toUpperCase()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Business fontSize="small" color="action" />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">{request.exporter_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{request.exporter_email}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {documentService.getDocumentTypeLabel(request.document_type)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority || 'MEDIUM'}
                        size="small"
                        color={
                          request.priority === 'URGENT' ? 'error' :
                          request.priority === 'HIGH' ? 'warning' :
                          'default'
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.request_status ? request.request_status.replace(/_/g, ' ') : 'UNKNOWN'}
                        size="small"
                        color={request.request_status === 'PENDING' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(request.requested_at).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<ExpandMore />}
                          onClick={() => handleExpandRequest(request.request_id)}
                        >
                          {expandedRequest === request.request_id ? 'Hide' : 'View'}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleOpenIssueDialog(request)}
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
                      </Box>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row - Exporter Qualification */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: 'none' }}>
                      <Collapse in={expandedRequest === request.request_id} timeout="auto" unmountOnExit>
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
                                  {getQualificationStatusIcon(request.exporter_qualification?.profile_status || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporter_qualification?.profile_status || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporter_qualification?.profile_status || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporter_qualification?.license_status || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporter_qualification?.license_status || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporter_qualification?.license_status || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporter_qualification?.competence_status || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporter_qualification?.competence_status || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporter_qualification?.competence_status || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporter_qualification?.laboratory_status || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporter_qualification?.laboratory_status || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporter_qualification?.laboratory_status || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporter_qualification?.taster_status || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporter_qualification?.taster_status || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporter_qualification?.taster_status || 'UNKNOWN')}
                                  />
                                </Box>
                              </Paper>
                            </Grid>
                          </Grid>
                          
                          {request.request_notes && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">
                                Request Notes
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 2, mt: 0.5, bgcolor: '#f5f5f5' }}>
                                <Typography variant="body2">{request.request_notes}</Typography>
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
              {documentService.getDocumentTypeLabel(selectedRequest.document_type)} for {selectedRequest.exporter_name}
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
              onChange={(e) => handleExpiryDateChange(e.target.value)}
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

            <Alert severity="info" icon={<Verified />}>
              This document will be automatically signed with your organization's MSP certificate and recorded on the blockchain for tamper-proof verification.
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
            disabled={submitting || !issueForm.documentNumber}
            startIcon={submitting ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {submitting ? 'Issuing & Signing...' : 'Issue & Sign Document'}
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
              {documentService.getDocumentTypeLabel(selectedRequest.document_type)} for {selectedRequest.exporter_name}
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
