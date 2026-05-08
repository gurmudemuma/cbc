import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  Cancel,
  Download,
  Send,
  Refresh,
  Info,
  Description,
  Business,
  Warning,
  ErrorOutline,
} from '@mui/icons-material';
import documentService from '../services/document.service';

// Document types configuration
const DOCUMENT_TYPES = [
  { value: 'EXPORT_LICENSE', label: 'Export License', issuer: 'ECTA', required: true },
  { value: 'PHYTOSANITARY_CERTIFICATE', label: 'Phytosanitary Certificate', issuer: 'MOA', required: true },
  { value: 'HEALTH_CERTIFICATE', label: 'Health Certificate', issuer: 'MOH', required: true },
  { value: 'QUALITY_CERTIFICATE', label: 'Quality Certificate', issuer: 'ECX', required: true },
  { value: 'CERTIFICATE_OF_ORIGIN', label: 'Certificate of Origin', issuer: 'ECTA', required: true },
  { value: 'BANK_GUARANTEE', label: 'Bank Guarantee', issuer: 'BANK', required: true },
  { value: 'SHIPPING_BOOKING', label: 'Shipping Booking', issuer: 'SHIPPING', required: true },
  { value: 'CUSTOMS_CLEARANCE', label: 'Customs Clearance', issuer: 'ERCA', required: true },
  { value: 'FUMIGATION_CERTIFICATE', label: 'Fumigation Certificate', issuer: 'MOA', required: false },
];

interface DocumentStatus {
  documentType: string;
  issuer: string;
  required: boolean;
  status: 'NOT_REQUESTED' | 'PENDING' | 'ISSUED' | 'REJECTED';
  documentId?: string;
  documentNumber?: string;
  issuedAt?: string;
  expiryDate?: string;
  requestId?: string;
  requestedAt?: string;
  requestStatus?: string;
}

interface CollectionStatusData {
  isComplete: boolean;
  requiredDocuments: number;
  issuedDocuments: number;
  pendingDocuments: number;
  canSubmitToNetwork: boolean;
  documents: DocumentStatus[];
}

interface DocumentCollectionStatusProps {
  onSubmitToNetwork?: () => void;
  onRequestDocument?: (documentType: string, issuer: string) => void;
  refreshTrigger?: number;
}

const DocumentCollectionStatus: React.FC<DocumentCollectionStatusProps> = ({
  onSubmitToNetwork,
  onRequestDocument,
  refreshTrigger,
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatusData | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentStatus | null>(null);

  useEffect(() => {
    fetchCollectionStatus();
  }, [refreshTrigger]);

  const fetchCollectionStatus = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await documentService.getCollectionStatus();
      
      if (response.success) {
        setCollectionStatus(response.data);
      } else {
        setError(response.message || 'Failed to load document collection status');
      }
    } catch (err: any) {
      console.error('Failed to fetch collection status:', err);
      setError(err.response?.data?.message || 'Failed to load document collection status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchCollectionStatus(true);
  };

  const handleDownload = async (documentId: string, documentNumber: string) => {
    try {
      setDownloading(documentId);
      setError(null);
      
      await documentService.downloadDocument(documentId, documentNumber);
      setSuccess(`Document ${documentNumber} downloaded successfully`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to download document:', err);
      setError(err.response?.data?.message || 'Failed to download document');
    } finally {
      setDownloading(null);
    }
  };

  const handleRequestDocument = (documentType: string, issuer: string) => {
    if (onRequestDocument) {
      onRequestDocument(documentType, issuer);
    }
  };

  const handleSubmitToNetwork = () => {
    if (onSubmitToNetwork) {
      onSubmitToNetwork();
    }
  };

  const handleViewDetails = (document: DocumentStatus) => {
    setSelectedDocument(document);
    setDetailsDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ISSUED':
        return <CheckCircle color="success" />;
      case 'PENDING':
        return <HourglassEmpty color="warning" />;
      case 'REJECTED':
        return <Cancel color="error" />;
      case 'NOT_REQUESTED':
        return <ErrorOutline color="disabled" />;
      default:
        return <Info color="info" />;
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'ISSUED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'ISSUED':
        return 'Issued';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      case 'NOT_REQUESTED':
        return 'Not Requested';
      default:
        return status;
    }
  };

  const getDocumentLabel = (documentType: string): string => {
    const doc = DOCUMENT_TYPES.find(d => d.value === documentType);
    return doc?.label || documentType;
  };

  const getIssuerName = (issuerCode: string): string => {
    return documentService.getNetworkMemberName(issuerCode);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !collectionStatus) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!collectionStatus) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No document collection data available
      </Alert>
    );
  }

  const progressPercentage = collectionStatus.requiredDocuments > 0
    ? (collectionStatus.issuedDocuments / collectionStatus.requiredDocuments) * 100
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Description /> Document Collection Status
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh status">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
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

      {/* Progress Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Collection Progress
            </Typography>
            <Typography variant="h6" color={collectionStatus.isComplete ? 'success.main' : 'text.secondary'}>
              {collectionStatus.issuedDocuments} / {collectionStatus.requiredDocuments}
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={progressPercentage}
            sx={{
              height: 10,
              borderRadius: 5,
              mb: 2,
              bgcolor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                bgcolor: collectionStatus.isComplete ? 'success.main' : 'primary.main',
              },
            }}
          />

          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {collectionStatus.issuedDocuments}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Issued
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {collectionStatus.pendingDocuments}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Pending
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={4}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="text.secondary">
                  {collectionStatus.documents.filter(d => d.required && d.status === 'NOT_REQUESTED').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Not Requested
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {collectionStatus.isComplete && (
            <Alert severity="success" sx={{ mt: 2 }}>
              All required documents collected! You can now submit to the network.
            </Alert>
          )}

          {!collectionStatus.isComplete && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {collectionStatus.pendingDocuments > 0 && `${collectionStatus.pendingDocuments} document(s) pending. `}
              {collectionStatus.documents.filter(d => d.required && d.status === 'NOT_REQUESTED').length > 0 && 
                `${collectionStatus.documents.filter(d => d.required && d.status === 'NOT_REQUESTED').length} document(s) not yet requested.`}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Required Documents
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List>
            {collectionStatus.documents
              .filter(doc => doc.required)
              .map((document, index) => (
                <React.Fragment key={`${document.documentType}-${document.issuer}`}>
                  <ListItem
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: document.status === 'ISSUED' ? '#f0f9ff' : 'background.paper',
                    }}
                  >
                    <ListItemIcon>
                      {getStatusIcon(document.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {getDocumentLabel(document.documentType)}
                          </Typography>
                          <Chip
                            label={getStatusLabel(document.status)}
                            size="small"
                            color={getStatusColor(document.status)}
                          />
                          {document.required && (
                            <Chip label="Required" size="small" color="error" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="caption" display="block">
                            <Business sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                            Issuer: {getIssuerName(document.issuer)}
                          </Typography>
                          
                          {document.status === 'ISSUED' && (
                            <>
                              <Typography variant="caption" display="block">
                                Document Number: {document.documentNumber}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Issued: {new Date(document.issuedAt!).toLocaleDateString()}
                              </Typography>
                              {document.expiryDate && (
                                <Typography variant="caption" display="block">
                                  Expires: {new Date(document.expiryDate).toLocaleDateString()}
                                </Typography>
                              )}
                            </>
                          )}

                          {document.status === 'PENDING' && document.requestedAt && (
                            <Typography variant="caption" display="block">
                              Requested: {new Date(document.requestedAt).toLocaleDateString()}
                            </Typography>
                          )}

                          {document.status === 'REJECTED' && (
                            <Typography variant="caption" color="error" display="block">
                              Request was rejected. Please submit a new request.
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                      {document.status === 'ISSUED' && document.documentId && (
                        <Tooltip title="Download document">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleDownload(document.documentId!, document.documentNumber!)}
                            disabled={downloading === document.documentId}
                          >
                            {downloading === document.documentId ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Download />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}

                      {(document.status === 'NOT_REQUESTED' || document.status === 'REJECTED') && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Send />}
                          onClick={() => handleRequestDocument(document.documentType, document.issuer)}
                        >
                          Request
                        </Button>
                      )}

                      <Tooltip title="View details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(document)}
                        >
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItem>
                </React.Fragment>
              ))}
          </List>

          {/* Optional Documents */}
          {collectionStatus.documents.filter(doc => !doc.required).length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>
                Optional Documents
              </Typography>
              <List>
                {collectionStatus.documents
                  .filter(doc => !doc.required)
                  .map((document) => (
                    <ListItem
                      key={`${document.documentType}-${document.issuer}`}
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 1,
                      }}
                    >
                      <ListItemIcon>
                        {getStatusIcon(document.status)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body1">
                              {getDocumentLabel(document.documentType)}
                            </Typography>
                            <Chip
                              label={getStatusLabel(document.status)}
                              size="small"
                              color={getStatusColor(document.status)}
                            />
                            <Chip label="Optional" size="small" variant="outlined" />
                          </Box>
                        }
                        secondary={`Issuer: ${getIssuerName(document.issuer)}`}
                      />
                      {document.status === 'NOT_REQUESTED' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Send />}
                          onClick={() => handleRequestDocument(document.documentType, document.issuer)}
                        >
                          Request
                        </Button>
                      )}
                    </ListItem>
                  ))}
              </List>
            </>
          )}
        </CardContent>
      </Card>

      {/* Submit to Network Button */}
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Send />}
          disabled={!collectionStatus.canSubmitToNetwork}
          onClick={handleSubmitToNetwork}
        >
          Submit to Network
        </Button>
      </Box>

      {!collectionStatus.canSubmitToNetwork && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            You must collect all required documents before submitting to the network.
          </Typography>
        </Alert>
      )}

      {/* Document Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Document Details
        </DialogTitle>
        <DialogContent>
          {selectedDocument && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Document Type
                  </Typography>
                  <Typography variant="body1">
                    {getDocumentLabel(selectedDocument.documentType)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Issuer
                  </Typography>
                  <Typography variant="body1">
                    {getIssuerName(selectedDocument.issuer)}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedDocument.status)}
                    color={getStatusColor(selectedDocument.status)}
                    size="small"
                  />
                </Grid>

                {selectedDocument.status === 'ISSUED' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Document Number
                      </Typography>
                      <Typography variant="body1">
                        {selectedDocument.documentNumber}
                      </Typography>
                    </Grid>

                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Issued Date
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedDocument.issuedAt!).toLocaleString()}
                      </Typography>
                    </Grid>

                    {selectedDocument.expiryDate && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Expiry Date
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedDocument.expiryDate).toLocaleString()}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}

                {selectedDocument.status === 'PENDING' && selectedDocument.requestedAt && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Requested Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedDocument.requestedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Required
                  </Typography>
                  <Typography variant="body1">
                    {selectedDocument.required ? 'Yes' : 'No (Optional)'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          {selectedDocument?.status === 'ISSUED' && selectedDocument.documentId && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                handleDownload(selectedDocument.documentId!, selectedDocument.documentNumber!);
                setDetailsDialogOpen(false);
              }}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentCollectionStatus;
