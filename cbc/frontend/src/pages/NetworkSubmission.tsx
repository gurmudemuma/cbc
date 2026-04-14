import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../services/api';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  Send,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  Trash2,
  Info,
} from 'lucide-react';
import networkService from '../services/network.service';
import DocumentCollectionStatus from '../components/DocumentCollectionStatus';
import DocumentRequestInterface from '../components/DocumentRequestInterface';
import documentService from '../services/document.service';

// Supporting document types (exporter-created documents)
const SUPPORTING_DOCUMENT_TYPES = [
  { value: 'COMMERCIAL_INVOICE', label: 'Commercial Invoice', required: true },
  { value: 'PACKING_LIST', label: 'Packing List', required: true },
  { value: 'BILL_OF_LADING', label: 'Bill of Lading (Draft)', required: false },
  { value: 'INSURANCE_CERTIFICATE', label: 'Insurance Certificate', required: false },
  { value: 'WEIGHT_CERTIFICATE', label: 'Weight Certificate', required: false },
  { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice', required: false },
];

interface NetworkSubmissionProps {
  user?: any;
  org?: any;
}

const NetworkSubmission = ({ user, org }: NetworkSubmissionProps): JSX.Element => {
  const location = useLocation();
  
  // Check if we have pre-fill data from navigation
  const [prefillData, setPrefillData] = useState<any>((location.state as any)?.prefillData || null);
  
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [supportingDocuments, setSupportingDocuments] = useState<any[]>([]);
  const [availableIssuedDocuments, setAvailableIssuedDocuments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [collectionStatus, setCollectionStatus] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Supporting document upload dialog
  const [documentDialog, setDocumentDialog] = useState(false);
  const [newDocument, setNewDocument] = useState({
    documentType: '',
    fileName: '',
    fileUrl: '',
  });

  const steps = ['Document Collection', 'Supporting Documents', 'Review & Submit'];

  // Fetch prefill data if not available from navigation
  useEffect(() => {
    const fetchPrefillData = async () => {
      if (!prefillData) {
        setLoading(true);
        try {
          const response = await apiClient.get('/api/exporter/network-prefill');

          if (response.data.success) {
            setPrefillData(response.data.data);
            if (response.data.data.isQualified) {
              showNotification(
                '✅ Your exporter information has been loaded!',
                'success'
              );
            } else {
              showNotification(
                '⚠️ Please complete all pre-registration requirements first.',
                'warning'
              );
            }
          } else {
            showNotification(response.data.message || 'Failed to load exporter information', 'error');
          }
        } catch (error: any) {
          console.error('Failed to fetch prefill data:', error);
          showNotification('Failed to load your information. Please try again.', 'error');
        } finally {
          setLoading(false);
        }
      } else if (prefillData.isQualified) {
        showNotification(
          '✅ Your exporter information has been pre-filled from your approved profile!',
          'success'
        );
      }
    };

    fetchPrefillData();
  }, []);

  // Fetch collection status
  useEffect(() => {
    const fetchCollectionStatus = async () => {
      try {
        const response = await documentService.getCollectionStatus();
        if (response.success) {
          setCollectionStatus(response.data);
          
          // Extract issued documents that are not required for network submission
          // These can be added as optional supporting documents
          const issuedDocs = response.data.documents
            .filter((doc: any) => doc.status === 'ISSUED')
            .map((doc: any) => ({
              value: doc.documentType,
              label: documentService.getDocumentTypeLabel(doc.documentType),
              documentId: doc.documentId,
              documentNumber: doc.documentNumber,
              issuer: doc.issuer,
              isIssued: true
            }));
          
          setAvailableIssuedDocuments(issuedDocs);
        }
      } catch (error) {
        console.error('Failed to fetch collection status:', error);
      }
    };

    fetchCollectionStatus();
  }, [refreshTrigger]);

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Check if all required documents are collected
      if (!collectionStatus?.canSubmitToNetwork) {
        showNotification(
          'Please collect all required documents before proceeding',
          'warning'
        );
        return;
      }
    }

    if (activeStep === 1) {
      // Check if required supporting documents are uploaded
      const requiredSupportingDocs = SUPPORTING_DOCUMENT_TYPES.filter(d => d.required);
      const uploadedTypes = supportingDocuments.map(d => d.documentType);
      const missingSupportingDocs = requiredSupportingDocs.filter(d => !uploadedTypes.includes(d.value));

      if (missingSupportingDocs.length > 0) {
        showNotification(
          `Missing required supporting documents: ${missingSupportingDocs.map(d => d.label).join(', ')}`,
          'warning'
        );
        return;
      }
    }

    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddSupportingDocument = () => {
    if (!newDocument.documentType || !newDocument.fileName) {
      showNotification('Please fill all required document fields', 'warning');
      return;
    }

    setSupportingDocuments([...supportingDocuments, { ...newDocument }]);
    setNewDocument({ documentType: '', fileName: '', fileUrl: '' });
    setDocumentDialog(false);
    showNotification('Supporting document added successfully', 'success');
  };

  const handleRemoveSupportingDocument = (index: number) => {
    setSupportingDocuments(supportingDocuments.filter((_, i) => i !== index));
    showNotification('Document removed', 'info');
  };

  const handleRequestDocument = (documentType: string, issuer: string) => {
    setRequestDialogOpen(true);
  };

  const handleSubmitToNetwork = async () => {
    if (!prefillData || !prefillData.exporterInfo) {
      showNotification('Exporter information is missing. Please try again.', 'error');
      return;
    }

    if (!collectionStatus?.canSubmitToNetwork) {
      showNotification('Please collect all required documents first.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      // Get issued document IDs
      const issuedDocumentIds = collectionStatus.documents
        .filter((doc: any) => doc.status === 'ISSUED' && doc.documentId)
        .map((doc: any) => doc.documentId);

      const submissionData = {
        exporterInfo: prefillData.exporterInfo,
        licenseInfo: prefillData.licenseInfo,
        issuedDocumentIds: issuedDocumentIds,
        supportingDocuments: supportingDocuments,
      };

      console.log('Submitting to Network:', submissionData);

      const response = await networkService.submitToNetwork(submissionData);

      if (response.success) {
        showNotification(
          `Export submitted to Network successfully! Reference: ${response.data.networkReferenceNumber || response.data.networkReferenceNumber}`,
          'success'
        );

        // Reset form
        setActiveStep(0);
        setSupportingDocuments([]);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('Network submission error:', error);
      console.error('Error response:', error.response?.data);
      showNotification(
        `Failed to submit to Network: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        // Step 1: Document Collection Status
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 1: Document Collection
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              All required documents must be issued by network members before you can submit to the network.
              Request any missing documents below.
            </Alert>

            <DocumentCollectionStatus
              onSubmitToNetwork={() => {
                // Don't submit yet, just move to next step
                if (collectionStatus?.canSubmitToNetwork) {
                  handleNext();
                }
              }}
              onRequestDocument={handleRequestDocument}
              refreshTrigger={refreshTrigger}
            />
          </Box>
        );

      case 1:
        // Step 2: Supporting Documents (Exporter-created)
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Step 2: Upload Supporting Documents</Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setDocumentDialog(true)}
              >
                Add Document
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Upload exporter-created documents such as commercial invoice and packing list.
            </Alert>

            <Grid container spacing={2}>
              {SUPPORTING_DOCUMENT_TYPES.map((docType) => {
                const uploaded = supportingDocuments.find(d => d.documentType === docType.value);
                return (
                  <Grid item xs={12} md={6} key={docType.value}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body1" component="div">
                              {docType.label}
                              {docType.required && <Chip label="Required" size="small" color="error" sx={{ ml: 1 }} />}
                            </Typography>
                            {uploaded && (
                              <Typography variant="caption" color="textSecondary">
                                {uploaded.fileName}
                              </Typography>
                            )}
                          </Box>
                          {uploaded ? (
                            <CheckCircle size={24} color="green" />
                          ) : (
                            <Clock size={24} color={docType.required ? 'red' : 'gray'} />
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {supportingDocuments.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Uploaded Supporting Documents ({supportingDocuments.length})
                </Typography>
                <List>
                  {supportingDocuments.map((doc, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveSupportingDocument(index)}>
                          <Trash2 size={20} />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <FileText />
                      </ListItemIcon>
                      <ListItemText
                        primary={SUPPORTING_DOCUMENT_TYPES.find(d => d.value === doc.documentType)?.label}
                        secondary={doc.fileName}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        );

      case 2:
        // Step 3: Review & Submit
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Step 3: Review & Submit to Network
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Please review all information before submitting to the Network Submission System
            </Alert>

            <Grid container spacing={3}>
              {/* Pre-filled Exporter Information */}
              {prefillData && prefillData.isQualified && (
                <Grid item xs={12}>
                  <Card sx={{ bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ color: '#0369a1' }}>
                        📋 Exporter Information (Pre-filled)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Business Name
                          </Typography>
                          <Typography variant="body1">{prefillData.exporterInfo?.businessName}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            TIN
                          </Typography>
                          <Typography variant="body1">{prefillData.exporterInfo?.tin}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Export License
                          </Typography>
                          <Typography variant="body1">{prefillData.licenseInfo?.licenseNumber || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Competence Certificate
                          </Typography>
                          <Typography variant="body1">{prefillData.competenceInfo?.certificateNumber || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Issued Documents Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Issued Documents ({collectionStatus?.issuedDocuments || 0})
                    </Typography>
                    <List dense>
                      {collectionStatus?.documents
                        .filter((doc: any) => doc.status === 'ISSUED')
                        .map((doc: any, index: number) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircle size={20} color="green" />
                            </ListItemIcon>
                            <ListItemText
                              primary={documentService.getDocumentTypeLabel(doc.documentType)}
                              secondary={`${doc.documentNumber} • ${documentService.getNetworkMemberName(doc.issuer)}`}
                            />
                          </ListItem>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Supporting Documents Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Supporting Documents ({supportingDocuments.length})
                    </Typography>
                    {supportingDocuments.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        No supporting documents uploaded
                      </Typography>
                    ) : (
                      <List dense>
                        {supportingDocuments.map((doc, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircle size={20} color="green" />
                            </ListItemIcon>
                            <ListItemText
                              primary={SUPPORTING_DOCUMENT_TYPES.find(d => d.value === doc.documentType)?.label}
                              secondary={doc.fileName}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="warning" sx={{ mt: 3 }}>
              Once submitted, network members will authenticate the issued documents. You will be notified of the approval status.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Send size={32} /> Network Submission
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Submit your export to the Ethiopian Network Submission System using issued documents
      </Typography>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Loading your information...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Pre-fill Information Banner */}
      {!loading && prefillData && prefillData.isQualified && (
        <Alert 
          severity="success" 
          icon={<Info />}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Your Profile Information is Ready
          </Typography>
          <Typography variant="body2">
            <strong>Business:</strong> {prefillData.exporterInfo?.businessName} • 
            <strong> TIN:</strong> {prefillData.exporterInfo?.tin} • 
            <strong> License:</strong> {prefillData.licenseInfo?.licenseNumber || 'N/A'}
          </Typography>
        </Alert>
      )}

      {!loading && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stepper activeStep={activeStep}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              {renderStepContent()}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  Back
                </Button>
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitToNetwork}
                      disabled={submitting || !collectionStatus?.canSubmitToNetwork}
                      startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                    >
                      {submitting ? 'Submitting...' : 'Submit to Network'}
                    </Button>
                  ) : (
                    <Button variant="contained" onClick={handleNext}>
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </>
      )}

      {/* Supporting Document Upload Dialog */}
      <Dialog open={documentDialog} onClose={() => setDocumentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Supporting Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" sx={{ mb: 1 }}>
              Select from your issued documents or upload exporter-created documents
            </Alert>
            
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={newDocument.documentType}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  const isIssuedDoc = availableIssuedDocuments.find(d => d.value === selectedValue);
                  
                  if (isIssuedDoc) {
                    // Pre-fill with issued document info
                    setNewDocument({
                      documentType: selectedValue,
                      fileName: isIssuedDoc.documentNumber,
                      fileUrl: '',
                      documentId: isIssuedDoc.documentId,
                      isIssued: true
                    });
                  } else {
                    setNewDocument({ ...newDocument, documentType: selectedValue, isIssued: false });
                  }
                }}
                label="Document Type"
              >
                <MenuItem disabled>
                  <em>--- Issued Documents (from Network Members) ---</em>
                </MenuItem>
                {availableIssuedDocuments.map((doc) => (
                  <MenuItem key={doc.documentId} value={doc.value}>
                    ✓ {doc.label} ({doc.documentNumber})
                  </MenuItem>
                ))}
                
                <MenuItem disabled>
                  <em>--- Exporter-Created Documents ---</em>
                </MenuItem>
                {SUPPORTING_DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label} {type.required && '(Required)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {!newDocument.isIssued && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<Upload />}
                  fullWidth
                  sx={{ height: 56 }}
                >
                  {newDocument.fileName ? 'Change File' : 'Upload File'}
                  <input
                    type="file"
                    hidden
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setNewDocument({
                          ...newDocument,
                          fileName: file.name,
                          fileUrl: URL.createObjectURL(file)
                        });
                      }
                    }}
                  />
                </Button>
                {newDocument.fileName && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    Selected: {newDocument.fileName}
                  </Typography>
                )}
              </>
            )}
            
            {newDocument.isIssued && (
              <Alert severity="success">
                This document has been issued by a network member and will be automatically included.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialog(false)}>Cancel</Button>
          <Button onClick={handleAddSupportingDocument} variant="contained">
            Add Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Request Dialog */}
      <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Request Document from Network Member</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <DocumentRequestInterface
              onRequestSubmitted={() => {
                setRequestDialogOpen(false);
                setRefreshTrigger(prev => prev + 1);
                showNotification('Document request submitted successfully', 'success');
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NetworkSubmission;
