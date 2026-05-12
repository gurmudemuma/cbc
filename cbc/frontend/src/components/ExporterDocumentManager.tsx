import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip,
    Paper,
    Tabs,
    Tab,
} from '@mui/material';
import {
    CheckCircle,
    HourglassEmpty,
    Cancel,
    Download,
    Description,
    Send,
    Refresh,
    Warning,
    Info,
} from '@mui/icons-material';
import documentService from '../services/document.service';

interface DocumentStatus {
    networkMemberCode: string;
    documentType: string;
    description: string;
    category: string;
    status: string;
    details: any;
    canRequest: boolean;
}

interface DocumentSummary {
    total: number;
    issued: number;
    pending: number;
    underReview: number;
    rejected: number;
    notRequested: number;
}

interface ExporterDocumentManagerProps {
    contractId?: string;
}

const ExporterDocumentManager: React.FC<ExporterDocumentManagerProps> = ({ contractId }) => {
    const [documents, setDocuments] = useState<DocumentStatus[]>([]);
    const [summary, setSummary] = useState<DocumentSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [requesting, setRequesting] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    
    // Read tab from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const [selectedTab, setSelectedTab] = useState(tabParam ? parseInt(tabParam) : 0);
    
    // NEW: Contract-based document requests
    const [registeredContracts, setRegisteredContracts] = useState<any[]>([]);
    const [selectedContract, setSelectedContract] = useState<any | null>(null);
    const [documentRequests, setDocumentRequests] = useState<any[]>([]);
    const [requestBatches, setRequestBatches] = useState<any[]>([]);
    
    // Request dialog state
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<DocumentStatus | null>(null);
    const [requestNotes, setRequestNotes] = useState('');

    useEffect(() => {
        // Don't call loadDocuments() - it uses the old failing endpoint
        // We calculate summary from document requests instead
        loadRegisteredContracts();
        loadDocumentRequests();
    }, []);

    const loadRegisteredContracts = async () => {
        try {
            // Load registered contracts from document request service
            const response = await documentService.getRegisteredContracts();
            console.log('Registered contracts response:', response);
            if (response.success) {
                setRegisteredContracts(response.registeredContracts || []);
                console.log('Loaded contracts:', response.registeredContracts);
            }
        } catch (err) {
            console.error('Failed to load registered contracts:', err);
            setError('Failed to load registered contracts: ' + (err.response?.data?.error || err.message));
        }
    };

    const loadDocumentRequests = async () => {
        try {
            setLoading(true);
            const response = await documentService.getMyDocumentRequests();
            if (response.success) {
                const requests = response.requests || [];
                setDocumentRequests(requests);
                
                // Calculate summary from document requests
                const summary = {
                    total: requests.length,
                    issued: requests.filter(r => r.status === 'COMPLETED').length,
                    pending: requests.filter(r => r.status === 'PENDING').length,
                    underReview: requests.filter(r => r.status === 'IN_PROGRESS').length,
                    rejected: requests.filter(r => r.status === 'REJECTED').length,
                    notRequested: 0
                };
                setSummary(summary);
            }
            
            const batchesResponse = await documentService.getDocumentRequestBatches();
            if (batchesResponse.success) {
                setRequestBatches(batchesResponse.batches || []);
            }
        } catch (err) {
            console.error('Failed to load document requests:', err);
            setError('Failed to load document requests');
        } finally {
            setLoading(false);
        }
    };

    const loadDocuments = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await documentService.getRequiredDocuments();
            setDocuments(response.data.all);
            setSummary(response.data.summary);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestAll = async () => {
        if (!selectedContract) {
            setError('Please select a registered contract first');
            return;
        }

        try {
            setRequesting(true);
            setError(null);
            const response = await documentService.createDocumentRequestsFromContract(
                selectedContract.draft_id,
                selectedContract.ecta_reference_number
            );
            setSuccess(`Successfully created ${response.data.totalRequests} document requests`);
            await loadDocumentRequests();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create document requests');
        } finally {
            setRequesting(false);
        }
    };

    const handleRequestSingle = async () => {
        if (!selectedDocument) return;

        try {
            setRequesting(true);
            setError(null);
            await documentService.requestDocument(
                selectedDocument.networkMemberCode,
                selectedDocument.documentType,
                requestNotes
            );
            setSuccess(`Document request submitted successfully`);
            setRequestDialogOpen(false);
            setRequestNotes('');
            await loadDocuments();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to request document');
        } finally {
            setRequesting(false);
        }
    };

    const handleDownload = async (documentId: string) => {
        try {
            setDownloading(documentId);
            setError(null);
            await documentService.downloadDocument(documentId);
            setSuccess('Document downloaded successfully');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to download document');
        } finally {
            setDownloading(null);
        }
    };

    const openRequestDialog = (doc: DocumentStatus) => {
        setSelectedDocument(doc);
        setRequestDialogOpen(true);
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
            case 'NOT_REQUESTED':
                return <Info color="disabled" />;
            default:
                return <Info color="disabled" />;
        }
    };

    const getStatusColor = (status: string): "success" | "warning" | "error" | "default" | "info" => {
        switch (status) {
            case 'ISSUED':
                return 'success';
            case 'PENDING':
            case 'UNDER_REVIEW':
                return 'warning';
            case 'REJECTED':
                return 'error';
            case 'NOT_REQUESTED':
                return 'default';
            default:
                return 'info';
        }
    };

    const getCategoryDocuments = (category: string) => {
        return documents.filter(doc => doc.category === category);
    };

    const renderDocumentCard = (doc: DocumentStatus) => (
        <Card key={doc.documentType} elevation={2} sx={{ mb: 2 }}>
            <CardContent>
                <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2} flex={1}>
                        {getStatusIcon(doc.status)}
                        <Box flex={1}>
                            <Typography variant="h6" gutterBottom>
                                {doc.description}
                            </Typography>
                            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                <Chip
                                    label={doc.status ? doc.status.replace('_', ' ') : 'UNKNOWN'}
                                    size="small"
                                    color={getStatusColor(doc.status)}
                                />
                                <Chip
                                    label={doc.networkMemberCode}
                                    size="small"
                                    variant="outlined"
                                />
                            </Box>
                            {doc.details && doc.status === 'ISSUED' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Document #: {doc.details.documentNumber} • 
                                    Issued: {new Date(doc.details.issuedAt).toLocaleDateString()}
                                </Typography>
                            )}
                            {doc.details && doc.status === 'PENDING' && (
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Requested: {new Date(doc.details.requestedAt).toLocaleDateString()}
                                </Typography>
                            )}
                            {doc.details && doc.status === 'REJECTED' && (
                                <Alert severity="error" sx={{ mt: 1 }}>
                                    <Typography variant="caption">
                                        Reason: {doc.details.rejectionReason}
                                    </Typography>
                                </Alert>
                            )}
                        </Box>
                    </Box>
                    <Box display="flex" gap={1}>
                        {doc.status === 'ISSUED' && doc.details?.documentId && (
                            <Tooltip title="Download Document">
                                <IconButton
                                    color="primary"
                                    onClick={() => handleDownload(doc.details.documentId)}
                                    disabled={downloading === doc.details.documentId}
                                >
                                    {downloading === doc.details.documentId ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        <Download />
                                    )}
                                </IconButton>
                            </Tooltip>
                        )}
                        {doc.canRequest && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<Send />}
                                onClick={() => openRequestDialog(doc)}
                                disabled={requesting}
                            >
                                Request
                            </Button>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" gutterBottom>
                            <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Export Documents
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage all required documents for your export operations
                        </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                        <Button
                            variant="outlined"
                            startIcon={<Refresh />}
                            onClick={() => {
                                loadDocuments();
                                loadDocumentRequests();
                                loadRegisteredContracts();
                            }}
                            disabled={loading}
                        >
                            Refresh
                        </Button>
                        {selectedContract && selectedTab === 3 && (
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Send />}
                                onClick={handleRequestAll}
                                disabled={requesting}
                            >
                                {requesting ? 'Requesting...' : 'Request All Documents'}
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>

            {/* Messages */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Summary Cards */}
            {summary && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={4} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="primary">{summary.total}</Typography>
                                <Typography variant="caption">Total</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="success.main">{summary.issued}</Typography>
                                <Typography variant="caption">Issued</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="warning.main">{summary.pending}</Typography>
                                <Typography variant="caption">Pending</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="info.main">{summary.underReview}</Typography>
                                <Typography variant="caption">Under Review</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="error.main">{summary.rejected}</Typography>
                                <Typography variant="caption">Rejected</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                        <Card>
                            <CardContent sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" color="text.secondary">{summary.notRequested}</Typography>
                                <Typography variant="caption">Not Requested</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Tabs */}
            <Paper sx={{ mb: 2 }}>
                <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
                    <Tab label="All Documents" />
                    <Tab label="Pre-Qualification" />
                    <Tab label="Sales Contract" />
                    <Tab label="Export Execution" />
                </Tabs>
            </Paper>

            {/* Document Lists */}
            <Box>
                {selectedTab === 0 && (
                    <Box>
                        {documents.map(doc => renderDocumentCard(doc))}
                    </Box>
                )}
                {selectedTab === 1 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Pre-Qualification Documents</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            These documents are automatically issued by ECTA during the pre-registration process.
                        </Typography>
                        {getCategoryDocuments('PRE_QUALIFICATION').map(doc => renderDocumentCard(doc))}
                    </Box>
                )}
                {selectedTab === 2 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Sales Contract Documents</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            This document is automatically generated when your sales contract is finalized.
                        </Typography>
                        {getCategoryDocuments('SALES_CONTRACT').map(doc => renderDocumentCard(doc))}
                    </Box>
                )}
                {selectedTab === 3 && (
                    <Box>
                        <Typography variant="h6" gutterBottom>Request Export Documents</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            Select a registered sales contract and request all required documents from network agencies.
                        </Typography>

                        {/* Contract Selection */}
                        {registeredContracts.length > 0 ? (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Step 1: Select Registered Contract
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {registeredContracts.map((contract) => (
                                            <Grid item xs={12} md={6} key={contract.draft_id}>
                                                <Card 
                                                    variant="outlined" 
                                                    sx={{ 
                                                        cursor: 'pointer',
                                                        border: selectedContract?.draft_id === contract.draft_id ? 2 : 1,
                                                        borderColor: selectedContract?.draft_id === contract.draft_id ? 'primary.main' : 'divider'
                                                    }}
                                                    onClick={() => setSelectedContract(contract)}
                                                >
                                                    <CardContent>
                                                        <Typography variant="h6" gutterBottom>
                                                            {contract.ecta_reference_number}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Buyer: {contract.buyer_name} ({contract.buyer_country})
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Coffee: {contract.coffee_type} - {contract.quantity} kg
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Value: {contract.currency} {contract.total_value}
                                                        </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Delivery: {new Date(contract.delivery_date).toLocaleDateString()}
                                                        </Typography>
                                                        <Chip 
                                                            label={contract.submission_status} 
                                                            color="success" 
                                                            size="small" 
                                                            sx={{ mt: 1 }}
                                                        />
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </CardContent>
                            </Card>
                        ) : (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                No registered contracts found. Please register a sales contract with ECTA first.
                            </Alert>
                        )}

                        {/* Request Button */}
                        {selectedContract && (
                            <Card sx={{ mb: 3 }}>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Step 2: Request All Required Documents
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        This will create document requests for all 8 required documents:
                                    </Typography>
                                    <List dense>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Export License (ECTA)" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Phytosanitary Certificate (MOA)" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Health Certificate (MOH)" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Quality Certificate (ECX)" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Certificate of Origin (ECTA)" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Bank Guarantee (BANK)" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Shipping Booking (SHIPPING)" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon><CheckCircle fontSize="small" /></ListItemIcon>
                                            <ListItemText primary="Customs Clearance (CUSTOMS)" />
                                        </ListItem>
                                    </List>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        fullWidth
                                        startIcon={<Send />}
                                        onClick={handleRequestAll}
                                        disabled={requesting}
                                        sx={{ mt: 2 }}
                                    >
                                        {requesting ? 'Creating Requests...' : 'Request All Documents'}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Document Requests Status */}
                        {documentRequests.length > 0 && (
                            <Card>
                                <CardContent>
                                    <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                                        Step 3: Track Document Requests
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        Monitor the status of your document requests. Agencies will review and issue documents.
                                    </Typography>
                                    {documentRequests.map((request) => (
                                        <Card key={request.request_id} variant="outlined" sx={{ mb: 2 }}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Box>
                                                        <Typography variant="subtitle2">
                                                            {request.description}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Agency: {request.issuer_agency} • Priority: {request.priority}
                                                        </Typography>
                                                    </Box>
                                                    <Chip 
                                                        label={request.status ? request.status.replace('_', ' ') : 'UNKNOWN'} 
                                                        color={
                                                            request.status === 'COMPLETED' ? 'success' :
                                                            request.status === 'REJECTED' ? 'error' :
                                                            request.status === 'IN_PROGRESS' ? 'info' :
                                                            'warning'
                                                        }
                                                        size="small"
                                                    />
                                                </Box>
                                                {request.document_id && (
                                                    <Box mt={1}>
                                                        <Typography variant="caption" color="success.main">
                                                            ✓ Document Issued: {request.document_number}
                                                        </Typography>
                                                        <Button
                                                            size="small"
                                                            startIcon={<Download />}
                                                            onClick={() => handleDownload(request.document_id)}
                                                            sx={{ ml: 2 }}
                                                        >
                                                            Download
                                                        </Button>
                                                    </Box>
                                                )}
                                                {request.rejection_reason && (
                                                    <Alert severity="error" sx={{ mt: 1 }}>
                                                        {request.rejection_reason}
                                                    </Alert>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                )}
            </Box>

            {/* Request Dialog */}
            <Dialog open={requestDialogOpen} onClose={() => setRequestDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    Request Document
                </DialogTitle>
                <DialogContent>
                    {selectedDocument && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body1" gutterBottom>
                                <strong>Document:</strong> {selectedDocument.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Issuer:</strong> {selectedDocument.networkMemberCode}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <TextField
                                fullWidth
                                multiline
                                rows={4}
                                label="Request Notes (Optional)"
                                placeholder="Add any special instructions or notes for the issuer..."
                                value={requestNotes}
                                onChange={(e) => setRequestNotes(e.target.value)}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRequestDialogOpen(false)} disabled={requesting}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleRequestSingle}
                        disabled={requesting}
                        startIcon={requesting ? <CircularProgress size={20} /> : <Send />}
                    >
                        {requesting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ExporterDocumentManager;
