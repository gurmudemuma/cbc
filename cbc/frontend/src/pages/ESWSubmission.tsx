import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
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
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Snackbar,
} from '@mui/material';
import {
  Send,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Trash2,
  Eye,
  Download,
  Info,
} from 'lucide-react';
import eswService from '../services/esw.service';

const DOCUMENT_TYPES = [
  { value: 'EXPORT_DECLARATION', label: 'Export Declaration', required: true },
  { value: 'COMMERCIAL_INVOICE', label: 'Commercial Invoice', required: true },
  { value: 'PACKING_LIST', label: 'Packing List', required: true },
  { value: 'BILL_OF_LADING', label: 'Bill of Lading', required: true },
  { value: 'CERTIFICATE_OF_ORIGIN', label: 'Certificate of Origin', required: true },
  { value: 'QUALITY_CERTIFICATE', label: 'Quality Certificate', required: true },
  { value: 'EXPORT_LICENSE', label: 'Export License', required: true },
  { value: 'SALES_CONTRACT', label: 'Sales Contract', required: true },
  { value: 'PROFORMA_INVOICE', label: 'Proforma Invoice', required: false },
  { value: 'PHYTOSANITARY_CERTIFICATE', label: 'Phytosanitary Certificate', required: true },
  { value: 'HEALTH_CERTIFICATE', label: 'Health Certificate', required: false },
  { value: 'FUMIGATION_CERTIFICATE', label: 'Fumigation Certificate', required: false },
  { value: 'INSURANCE_CERTIFICATE', label: 'Insurance Certificate', required: false },
  { value: 'WEIGHT_CERTIFICATE', label: 'Weight Certificate', required: false },
];

const CERTIFICATE_TYPES = [
  { value: 'ECTA_LICENSE', label: 'ECTA Export License' },
  { value: 'PHYTOSANITARY', label: 'Phytosanitary Certificate' },
  { value: 'HEALTH', label: 'Health Certificate' },
  { value: 'FUMIGATION', label: 'Fumigation Certificate' },
  { value: 'ORGANIC', label: 'Organic Certification' },
  { value: 'FAIR_TRADE', label: 'Fair Trade Certification' },
  { value: 'RAINFOREST_ALLIANCE', label: 'Rainforest Alliance' },
  { value: 'UTZ', label: 'UTZ Certification' },
];

interface ESWSubmissionProps {
  user: any;
  org: any;
}

const ESWSubmission = ({ user, org }: ESWSubmissionProps): JSX.Element => {
  const location = useLocation();
  
  // Check if we have pre-fill data from navigation
  const [prefillData, setPrefillData] = useState<any>((location.state as any)?.prefillData || null);
  
  // We no longer fetch or display exports for selection
  // The exporter's information comes from prefillData
  const [loading, setLoading] = useState(false);

  const [activeStep, setActiveStep] = useState(0);
  // Remove selectedExport state - we use prefillData instead
  const [documents, setDocuments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch prefill data if not available from navigation
  useEffect(() => {
    const fetchPrefillData = async () => {
      if (!prefillData) {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/exporter/esw-prefill', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch pre-fill data');
          }

          const result = await response.json();

          if (result.success) {
            setPrefillData(result.data);
            if (result.data.isQualified) {
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
            showNotification(result.message || 'Failed to load exporter information', 'error');
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

  // Document upload dialog
  const [documentDialog, setDocumentDialog] = useState(false);
  const [newDocument, setNewDocument] = useState({
    documentType: '',
    fileName: '',
    fileUrl: '',
  });

  // Certificate dialog
  const [certificateDialog, setCertificateDialog] = useState(false);
  const [newCertificate, setNewCertificate] = useState({
    certificateType: '',
    certificateNumber: '',
    documentUrl: '',
  });

  const steps = ['Upload Documents', 'Add Certificates', 'Review & Submit'];

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const requiredDocs = DOCUMENT_TYPES.filter(d => d.required);
      const uploadedTypes = documents.map(d => d.documentType);
      const missingDocs = requiredDocs.filter(d => !uploadedTypes.includes(d.value));

      if (missingDocs.length > 0) {
        showNotification(
          `Missing required documents: ${missingDocs.map(d => d.label).join(', ')}`,
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

  const handleAddDocument = () => {
    if (!newDocument.documentType || !newDocument.fileName) {
      showNotification('Please fill all required document fields', 'warning');
      return;
    }

    setDocuments([...documents, { ...newDocument }]);
    setNewDocument({ documentType: '', fileName: '', fileUrl: '' });
    setDocumentDialog(false);
    showNotification('Document added successfully', 'success');
  };

  const handleRemoveDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
    showNotification('Document removed', 'info');
  };

  const handleAddCertificate = () => {
    if (!newCertificate.certificateType || !newCertificate.certificateNumber) {
      showNotification('Please fill all certificate fields', 'warning');
      return;
    }

    setCertificates([...certificates, { ...newCertificate }]);
    setNewCertificate({ certificateType: '', certificateNumber: '', documentUrl: '' });
    setCertificateDialog(false);
    showNotification('Certificate added successfully', 'success');
  };

  const handleRemoveCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
    showNotification('Certificate removed', 'info');
  };

  const handleSubmitToESW = async () => {
    if (!prefillData || !prefillData.exporterInfo) {
      showNotification('Exporter information is missing. Please try again.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const submissionData = {
        exporterInfo: prefillData.exporterInfo,
        licenseInfo: prefillData.licenseInfo,
        documents: documents,
        certificates: certificates.length > 0 ? certificates : undefined,
      };

      console.log('Submitting to ESW:', submissionData);

      const response = await eswService.submitToESW(submissionData);

      if (response.success) {
        showNotification(
          `Export submitted to ESW successfully! Reference: ${response.data.eswReferenceNumber}`,
          'success'
        );

        // Reset form
        setActiveStep(0);
        setDocuments([]);
        setCertificates([]);
      }
    } catch (error: any) {
      console.error('ESW submission error:', error);
      console.error('Error response:', error.response?.data);
      showNotification(
        `Failed to submit to ESW: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Upload Required Documents</Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setDocumentDialog(true)}
              >
                Add Document
              </Button>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              All documents marked as "Required" must be uploaded before proceeding
            </Alert>

            <Grid container spacing={2}>
              {DOCUMENT_TYPES.map((docType) => {
                const uploaded = documents.find(d => d.documentType === docType.value);
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

            {documents.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Uploaded Documents ({documents.length})
                </Typography>
                <List>
                  {documents.map((doc, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveDocument(index)}>
                          <Trash2 size={20} />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <FileText />
                      </ListItemIcon>
                      <ListItemText
                        primary={DOCUMENT_TYPES.find(d => d.value === doc.documentType)?.label}
                        secondary={doc.fileName}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        );

      case 1:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Add Certificates (Optional)</Typography>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setCertificateDialog(true)}
              >
                Add Certificate
              </Button>
            </Box>

            <Alert severity="info" sx={{ mb: 2 }}>
              Add any additional certificates (Organic, Fair Trade, etc.) if applicable
            </Alert>

            {certificates.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  No certificates added yet. Click "Add Certificate" to include certifications.
                </Typography>
              </Paper>
            ) : (
              <List>
                {certificates.map((cert, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveCertificate(index)}>
                        <Trash2 size={20} />
                      </IconButton>
                    }
                  >
                    <ListItemIcon>
                      <CheckCircle color="green" />
                    </ListItemIcon>
                    <ListItemText
                      primary={CERTIFICATE_TYPES.find(c => c.value === cert.certificateType)?.label}
                      secondary={`Certificate #: ${cert.certificateNumber}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review & Submit to ESW
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Please review all information before submitting to the Electronic Single Window
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
                            Business Type
                          </Typography>
                          <Typography variant="body1">{prefillData.exporterInfo?.businessType}</Typography>
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
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Laboratory
                          </Typography>
                          <Typography variant="body1">{prefillData.laboratoryInfo?.laboratoryName || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Export Information - Removed since we're not selecting exports anymore */}

              {/* Documents Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Documents ({documents.length})
                    </Typography>
                    <List dense>
                      {documents.map((doc, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle size={20} color="green" />
                          </ListItemIcon>
                          <ListItemText
                            primary={DOCUMENT_TYPES.find(d => d.value === doc.documentType)?.label}
                            secondary={doc.fileName}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Certificates Summary */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Certificates ({certificates.length})
                    </Typography>
                    {certificates.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">
                        No additional certificates
                      </Typography>
                    ) : (
                      <List dense>
                        {certificates.map((cert, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircle size={20} color="green" />
                            </ListItemIcon>
                            <ListItemText
                              primary={CERTIFICATE_TYPES.find(c => c.value === cert.certificateType)?.label}
                              secondary={cert.certificateNumber}
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
              Once submitted, your export will be reviewed by 16 Ethiopian government agencies in parallel.
              You will be notified of the approval status.
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
        <Send size={32} /> ESW Submission
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Submit your export to the Ethiopian Electronic Single Window for government agency approvals
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
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            This information has been automatically loaded from your approved pre-registration.
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
                      onClick={handleSubmitToESW}
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                    >
                      {submitting ? 'Submitting...' : 'Submit to ESW'}
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

      {/* Document Upload Dialog */}
      <Dialog open={documentDialog} onClose={() => setDocumentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Document</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={newDocument.documentType}
                onChange={(e) => setNewDocument({ ...newDocument, documentType: e.target.value })}
                label="Document Type"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label} {type.required && '(Required)'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
                      fileUrl: URL.createObjectURL(file) // Create local preview URL
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocumentDialog(false)}>Cancel</Button>
          <Button onClick={handleAddDocument} variant="contained">
            Add Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Certificate Dialog */}
      <Dialog open={certificateDialog} onClose={() => setCertificateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Certificate</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Certificate Type</InputLabel>
              <Select
                value={newCertificate.certificateType}
                onChange={(e) => setNewCertificate({ ...newCertificate, certificateType: e.target.value })}
                label="Certificate Type"
              >
                {CERTIFICATE_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Certificate Number"
              value={newCertificate.certificateNumber}
              onChange={(e) => setNewCertificate({ ...newCertificate, certificateNumber: e.target.value })}
              placeholder="e.g., ORG-2024-001"
            />
            <Button
              variant="outlined"
              component="label"
              startIcon={<Upload />}
              fullWidth
              sx={{ height: 56 }}
            >
              {newCertificate.documentUrl ? 'Change Certificate File' : 'Upload Certificate'}
              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    setNewCertificate({
                      ...newCertificate,
                      documentUrl: URL.createObjectURL(file) // Create local preview URL
                    });
                  }
                }}
              />
            </Button>
            {newCertificate.documentUrl && (
              <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                File Attached
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificateDialog(false)}>Cancel</Button>
          <Button onClick={handleAddCertificate} variant="contained">
            Add Certificate
          </Button>
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

export default ESWSubmission;
