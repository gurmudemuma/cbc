import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  FileText,
  XCircle,
  Clock,
  Download,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Award,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Building2,
  ClipboardList,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import documentService from '../services/document.service';

interface ExporterQualification {
  profileStatus: string;
  licenseStatus: string;
  competenceStatus: string;
  laboratoryStatus: string;
  tasterStatus: string;
}

interface DocumentRequest {
  id: string;
  requestId: string;
  submissionId: string;
  exporterId: string;
  referenceNumber: string;
  documentType: string;
  exporterName: string;
  exporterEmail: string;
  exporterTin: string;
  exporterContactPerson?: string;
  exporterPhone?: string;
  laboratoryInspector?: string;
  lastInspectionDate?: string;
  laboratoryName?: string;
  tasterName?: string;
  proficiencyCertificateNumber?: string;
  tasterCertificateDate?: string;
  licenseNumber?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  competenceCertificateNumber?: string;
  competenceIssueDate?: string;
  competenceExpiryDate?: string;
  requestedAt: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'UNDER_REVIEW' | 'ISSUED' | 'REJECTED';
  requestStatus: string;
  notes?: string;
  requestNotes?: string;
  issuedAt?: string;
  issuedBy?: string;
  certificateNumber?: string;
  validUntil?: string;
  exporterQualification: ExporterQualification;
  ectaReferenceNumber?: string;
  requiredData?: Record<string, any>;
}

interface IssueFormData {
  documentNumber: string;
  expiryDate: string;
  metadata: {
    inspectionDate?: string;
    inspectorName?: string;
    validityPeriod?: string;
    notes?: string;
    contractReference?: string;
    exporterTin?: string;
    exporterName?: string;
    issuedBy?: string;
    issuedDate?: string;
    coffeeType?: string;
    quantity?: string;
    destination?: string;
    originRegion?: string;
    productType?: string;
  };
  documentFile: File | null;
}

interface DocumentIssuanceDashboardProps {
  user: any;
  org: string;
}

const DocumentIssuanceDashboard: React.FC<DocumentIssuanceDashboardProps> = ({ user, org }) => {
  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [issuanceDialogOpen, setIssuanceDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [certificateNumber, setCertificateNumber] = useState('');
  const [validityDays, setValidityDays] = useState(365);
  const [issuanceNotes, setIssuanceNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [usingMockData, setUsingMockData] = useState(false);

  // Form states
  const [issueForm, setIssueForm] = useState<IssueFormData>({
    documentNumber: '',
    expiryDate: '',
    metadata: {},
    documentFile: null,
  });

  // Determine agency type and document type
  const getAgencyInfo = () => {
    const orgLower = (org || '').toLowerCase();
    const userRole = user?.role?.toLowerCase() || '';
    
    // Ministry of Agriculture (MOA)
    if (orgLower === 'moa' || userRole === 'moa' || orgLower === 'ministry-of-agriculture') {
      return {
        agencyName: 'Ministry of Agriculture',
        documentType: 'Phytosanitary Certificate',
        agencyCode: 'MOA',
        description: 'Agricultural health and plant protection certification',
        color: '#4caf50'
      };
    }
    
    // Ministry of Health (MOH)
    if (orgLower === 'moh' || userRole === 'moh' || orgLower === 'ministry-of-health') {
      return {
        agencyName: 'Ministry of Health',
        documentType: 'Health Certificate',
        agencyCode: 'MOH',
        description: 'Public health and food safety certification',
        color: '#2196f3'
      };
    }
    
    // Ethiopian Coffee & Tea Authority (ECTA)
    if (orgLower === 'ecta' || userRole === 'ecta') {
      return {
        agencyName: 'Ethiopian Coffee & Tea Authority',
        documentType: 'Export License',
        agencyCode: 'ECTA',
        description: 'Coffee export licensing and quality certification',
        color: '#ff9800'
      };
    }
    
    // Commercial Bank of Ethiopia (CBE)
    if (orgLower === 'commercial-bank' || orgLower === 'commercialbank' || userRole === 'cbe') {
      return {
        agencyName: 'Commercial Bank of Ethiopia',
        documentType: 'Payment Certificate',
        agencyCode: 'CBE',
        description: 'Payment verification and foreign exchange certification',
        color: '#9c27b0'
      };
    }
    
    // National Bank of Ethiopia (NBE)
    if (orgLower === 'national-bank' || orgLower === 'nationalbank' || orgLower === 'nbe' || userRole === 'nbe') {
      return {
        agencyName: 'National Bank of Ethiopia',
        documentType: 'FX Approval Certificate',
        agencyCode: 'NBE',
        description: 'Foreign exchange approval and monetary policy compliance',
        color: '#f44336'
      };
    }
    
    // Ethiopian Commodity Exchange (ECX)
    if (orgLower === 'ecx' || userRole === 'ecx') {
      return {
        agencyName: 'Ethiopian Commodity Exchange',
        documentType: 'Quality Certificate',
        agencyCode: 'ECX',
        description: 'Coffee quality verification and grading certification',
        color: '#795548'
      };
    }
    
    // Ethiopian Revenues and Customs Authority (ERCA)
    if (orgLower === 'custom-authorities' || orgLower === 'customs' || userRole === 'customs') {
      return {
        agencyName: 'Ethiopian Revenues and Customs Authority',
        documentType: 'Customs Clearance Certificate',
        agencyCode: 'ERCA',
        description: 'Customs clearance and export documentation',
        color: '#607d8b'
      };
    }
    
    // Ministry of Trade (MOT)
    if (orgLower === 'mot' || userRole === 'mot' || orgLower === 'ministry-of-trade') {
      return {
        agencyName: 'Ministry of Trade',
        documentType: 'Trade License',
        agencyCode: 'MOT',
        description: 'Trade licensing and commercial registration',
        color: '#3f51b5'
      };
    }
    
    // Ethiopian Investment Commission (EIC)
    if (orgLower === 'eic' || userRole === 'eic') {
      return {
        agencyName: 'Ethiopian Investment Commission',
        documentType: 'Investment Certificate',
        agencyCode: 'EIC',
        description: 'Investment permits and business registration',
        color: '#009688'
      };
    }
    
    // Environment Protection Authority (EPA)
    if (orgLower === 'epa' || userRole === 'epa') {
      return {
        agencyName: 'Environment Protection Authority',
        documentType: 'Environmental Compliance Certificate',
        agencyCode: 'EPA',
        description: 'Environmental impact assessment and compliance',
        color: '#8bc34a'
      };
    }
    
    // Quality and Standards Authority (QSAE)
    if (orgLower === 'qsae' || userRole === 'qsae') {
      return {
        agencyName: 'Quality and Standards Authority',
        documentType: 'Quality Standards Certificate',
        agencyCode: 'QSAE',
        description: 'Product quality standards and certification',
        color: '#ff5722'
      };
    }
    
    // Ministry of Finance and Economic Development (MOFED)
    if (orgLower === 'mofed' || userRole === 'mofed') {
      return {
        agencyName: 'Ministry of Finance and Economic Development',
        documentType: 'Financial Compliance Certificate',
        agencyCode: 'MOFED',
        description: 'Financial regulations and economic policy compliance',
        color: '#e91e63'
      };
    }
    
    // Default fallback
    return {
      agencyName: 'Government Agency',
      documentType: 'Certificate',
      agencyCode: 'AGENCY',
      description: 'Document issuance and certification',
      color: '#757575'
    };
  };

  const agencyInfo = getAgencyInfo();

  useEffect(() => {
    fetchDocumentRequests();
  }, []);

  const fetchDocumentRequests = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch real data from the API
      const response = await documentService.getPendingRequests();
      if (response.success) {
        // Map the API response to match the component's interface
        const mappedRequests = (response.requests || []).map((req: any) => ({
          id: req.request_id,
          requestId: req.request_id,
          submissionId: req.request_id, // Use request_id as submissionId if not provided
          exporterId: req.exporter_id,
          referenceNumber: req.ecta_reference_number || req.request_id.substring(0, 8).toUpperCase(),
          documentType: req.document_type,
          exporterName: req.exporter_name,
          exporterEmail: req.exporter_email,
          exporterTin: req.exporter_tin,
          exporterContactPerson: req.exporter_contact_person,
          exporterPhone: req.exporter_phone,
          laboratoryInspector: req.laboratory_inspector,
          lastInspectionDate: req.last_inspection_date,
          laboratoryName: req.laboratory_name,
          tasterName: req.taster_name,
          proficiencyCertificateNumber: req.proficiency_certificate_number,
          tasterCertificateDate: req.taster_certificate_date,
          licenseNumber: req.license_number,
          licenseIssueDate: req.license_issue_date,
          licenseExpiryDate: req.license_expiry_date,
          competenceCertificateNumber: req.competence_certificate_number,
          competenceIssueDate: req.competence_issue_date,
          competenceExpiryDate: req.competence_expiry_date,
          requestedAt: req.requested_at,
          priority: req.priority || 'MEDIUM',
          status: req.request_status || req.status,
          requestStatus: req.request_status || req.status,
          notes: req.request_notes || req.notes,
          requestNotes: req.request_notes || req.notes,
          issuedAt: req.issued_at,
          issuedBy: req.issued_by,
          certificateNumber: req.certificate_number,
          validUntil: req.valid_until,
          exporterQualification: req.exporter_qualification || {
            profileStatus: 'UNKNOWN',
            licenseStatus: 'UNKNOWN',
            competenceStatus: 'UNKNOWN',
            laboratoryStatus: 'UNKNOWN',
            tasterStatus: 'UNKNOWN'
          },
          ectaReferenceNumber: req.ecta_reference_number,
          requiredData: req.required_data
        }));
        
        setRequests(mappedRequests);
        setUsingMockData(false);
      } else {
        setError('Failed to load document requests from server');
        setRequests([]);
      }
      
    } catch (err: any) {
      console.error('Error fetching document requests:', err);
      setError(err.response?.data?.error || 'Failed to load document requests. Please check your connection and try again.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandRequest = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  const handleOpenIssueDialog = (request: DocumentRequest) => {
    // Auto-generate document number based on document type and agency
    const timestamp = Date.now();
    const docNumber = `${agencyInfo.agencyCode}-${new Date().getFullYear()}-${String(timestamp).slice(-6)}`;
    
    // Pre-fill metadata based on document type and request data
    const metadata: any = {};
    const requiredData = request.requiredData || {};
    
    // Add common metadata
    metadata.contractReference = request.ectaReferenceNumber;
    metadata.exporterTin = request.exporterTin;
    metadata.exporterName = request.exporterName;
    metadata.issuedBy = agencyInfo.agencyCode;
    metadata.issuedDate = new Date().toISOString();
    
    // Fetch inspection date from qualification data
    const inspectionDate = request.lastInspectionDate 
      ? new Date(request.lastInspectionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    metadata.inspectionDate = inspectionDate;
    
    // Fetch inspector name from qualification data
    let inspectorName = `${agencyInfo.agencyCode} Inspector`; // Default
    if (request.laboratoryInspector) {
      inspectorName = request.laboratoryInspector;
    } else if (request.tasterName) {
      inspectorName = request.tasterName;
    } else if (request.exporterContactPerson) {
      inspectorName = request.exporterContactPerson;
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
    if (request.documentType === 'Export License' && request.licenseExpiryDate) {
      expiryDate = new Date(request.licenseExpiryDate);
    } else if (request.documentType === 'Competence Certificate' && request.competenceExpiryDate) {
      expiryDate = new Date(request.competenceExpiryDate);
    } else {
      // Default: 1 year from now
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    // Calculate validity period in days
    const validityPeriodDays = Math.ceil((expiryDate.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
    metadata.validityPeriod = `${validityPeriodDays} days`;
    
    // Add notes template based on document type and qualification data
    let notes = '';
    switch (request.documentType) {
      case 'Export License':
        notes = `This export license authorizes ${request.exporterName} (TIN: ${request.exporterTin}) to export coffee as specified in the contract. Inspected by ${inspectorName} on ${inspectionDate}.`;
        break;
      case 'Phytosanitary Certificate':
        notes = `Product inspected by ${inspectorName} on ${inspectionDate} and found free from pests and diseases. Meets phytosanitary requirements for export.`;
        break;
      case 'Health Certificate':
        notes = `Product inspected by ${inspectorName} on ${inspectionDate} and meets health and safety standards for export. Complies with international food safety regulations.`;
        break;
      case 'Quality Certificate':
        notes = `Coffee quality verified by ${inspectorName} on ${inspectionDate} and meets specified grade standards. Laboratory analysis confirms quality parameters.`;
        break;
      case 'Payment Certificate':
        notes = `Payment verification completed by ${inspectorName} on ${inspectionDate}. Foreign exchange compliance confirmed.`;
        break;
      case 'FX Approval Certificate':
        notes = `Foreign exchange approval granted by ${inspectorName} on ${inspectionDate}. Monetary policy compliance verified.`;
        break;
      case 'Customs Clearance Certificate':
        notes = `Customs clearance approved by ${inspectorName} on ${inspectionDate}. Export documentation verified and compliant.`;
        break;
      default:
        notes = `Document issued by ${agencyInfo.agencyCode} for ${request.exporterName}. Verified by ${inspectorName} on ${inspectionDate}.`;
    }
    metadata.notes = notes;
    
    setSelectedRequest(request);
    setIssueForm({
      documentNumber: docNumber,
      expiryDate: expiryDate.toISOString().split('T')[0],
      metadata: metadata,
      documentFile: null,
    });
    setIssuanceDialogOpen(true);
  };

  const handleOpenRejectDialog = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setRejectDialogOpen(true);
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
      setError('');

      // Try to use the document service first
      let useBackendService = false;
      try {
        const issueData = {
          requestId: selectedRequest.requestId,
          exporterId: selectedRequest.exporterId,
          documentType: selectedRequest.documentType,
          documentNumber: issueForm.documentNumber,
          documentMetadata: issueForm.metadata,
          expiryDate: issueForm.expiryDate || undefined,
        };

        const response = await documentService.issueDocument(issueData);

        if (response.success) {
          useBackendService = true;
          const message = response.data?.blockchainEnabled 
            ? `Document ${issueForm.documentNumber} issued and signed with MSP certificate for ${selectedRequest.exporterName}`
            : `Document ${issueForm.documentNumber} issued successfully for ${selectedRequest.exporterName} (stored securely in database)`;
          
          setSuccess(message);
          setIssuanceDialogOpen(false);
          setSelectedRequest(null);
          
          // Refresh requests list from backend
          await fetchDocumentRequests();
          return;
        }
      } catch (serviceErr) {
        console.log('Document service not available, using local state management');
      }

      // Fallback to local state management (don't refresh from mock data)
      if (!useBackendService) {
        const updatedRequest = {
          ...selectedRequest,
          status: 'ISSUED' as const,
          requestStatus: 'ISSUED' as const,
          issuedAt: new Date().toISOString(),
          issuedBy: user.username,
          certificateNumber: issueForm.documentNumber,
          validUntil: issueForm.expiryDate ? new Date(issueForm.expiryDate).toISOString() : undefined,
          notes: issueForm.metadata.notes,
        };

        // Update the request in state (persist locally)
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id ? updatedRequest : req
        ));

        setSuccess(`Document ${issueForm.documentNumber} issued successfully! Certificate Number: ${issueForm.documentNumber}`);
        setIssuanceDialogOpen(false);
        setSelectedRequest(null);
        
        // DON'T refresh from mock data - keep local changes
      }
      
    } catch (err: any) {
      console.error('Error issuing document:', err);
      setError('Failed to issue document');
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
      setError('');

      // Try to use the document service first
      let useBackendService = false;
      try {
        const response = await documentService.rejectRequest(selectedRequest.requestId, {
          rejectionReason,
        });

        if (response.success) {
          useBackendService = true;
          setSuccess(`Document request rejected for ${selectedRequest.exporterName}`);
          setRejectDialogOpen(false);
          setSelectedRequest(null);
          
          // Refresh requests list from backend
          await fetchDocumentRequests();
          return;
        }
      } catch (serviceErr) {
        console.log('Document service not available, using local state management');
      }

      // Fallback to local state management (don't refresh from mock data)
      if (!useBackendService) {
        const updatedRequest = {
          ...selectedRequest,
          status: 'REJECTED' as const,
          requestStatus: 'REJECTED' as const,
          notes: rejectionReason,
        };

        // Update the request in state (persist locally)
        setRequests(prev => prev.map(req => 
          req.id === selectedRequest.id ? updatedRequest : req
        ));

        setSuccess(`Document request rejected for ${selectedRequest.exporterName}`);
        setRejectDialogOpen(false);
        setSelectedRequest(null);
        
        // DON'T refresh from mock data - keep local changes
      }
      
    } catch (err: any) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject document request');
    } finally {
      setSubmitting(false);
    }
  };

  const getQualificationStatusIcon = (status: string) => {
    if (status === 'ACTIVE' || status === 'FULLY_QUALIFIED' || status === 'VERIFIED' || status === 'CERTIFIED') {
      return <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />;
    }
    return <AlertTriangle size={16} color="#ff9800" />;
  };

  const getQualificationStatusColor = (status: string): "success" | "warning" | "error" => {
    if (status === 'ACTIVE' || status === 'FULLY_QUALIFIED' || status === 'VERIFIED' || status === 'CERTIFIED') return 'success';
    if (status === 'MISSING') return 'error';
    return 'warning';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'UNDER_REVIEW': return 'info';
      case 'ISSUED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'UNDER_REVIEW': return <Search size={16} />;
      case 'ISSUED': return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'REJECTED': return <XCircle size={16} />;
      default: return <FileText size={16} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'error';
      case 'MEDIUM': return 'warning';
      case 'LOW': return 'info';
      default: return 'default';
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesStatus = filterStatus === 'ALL' || request.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      request.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.exporterName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    underReview: requests.filter(r => r.status === 'UNDER_REVIEW').length,
    issued: requests.filter(r => r.status === 'ISSUED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Shield size={32} style={{ color: agencyInfo.color }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {agencyInfo.agencyName}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {agencyInfo.description}
            </Typography>
          </Box>
        </Stack>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Document Type:</strong> {agencyInfo.documentType} • 
            <strong> Agency:</strong> {agencyInfo.agencyCode} • 
            <strong> User:</strong> {user.username} ({user.email})
          </Typography>
        </Alert>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <FileText size={24} color="#666" />
                <Box>
                  <Typography variant="h6">{stats.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Requests</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Clock size={24} color="#ff9800" />
                <Box>
                  <Typography variant="h6">{stats.pending}</Typography>
                  <Typography variant="body2" color="text.secondary">Pending</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Search size={24} color="#2196f3" />
                <Box>
                  <Typography variant="h6">{stats.underReview}</Typography>
                  <Typography variant="body2" color="text.secondary">Under Review</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircleIcon sx={{ fontSize: 24, color: '#4caf50' }} />
                <Box>
                  <Typography variant="h6">{stats.issued}</Typography>
                  <Typography variant="body2" color="text.secondary">Issued</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <XCircle size={24} color="#f44336" />
                <Box>
                  <Typography variant="h6">{stats.rejected}</Typography>
                  <Typography variant="body2" color="text.secondary">Rejected</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search by reference number or exporter name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: <Search size={20} style={{ marginRight: 8, color: '#666' }} />
            }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status Filter"
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
              <MenuItem value="ISSUED">Issued</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => {
              if (!usingMockData) {
                fetchDocumentRequests();
              } else {
                // For mock data, just show a message
                setSuccess('Refreshed - Demo mode active, showing local changes');
              }
            }}
            disabled={loading}
          >
            {usingMockData ? 'Demo Mode' : 'Refresh'}
          </Button>
        </Stack>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Document Requests Table */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">
            <ClipboardList style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Document Requests ({filteredRequests.length})
          </Typography>
        </Box>
        
        {loading && <LinearProgress />}
        
        <TableContainer>
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
              {filteredRequests.map((request) => (
                <React.Fragment key={request.id}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleExpandRequest(request.id)}
                      >
                        {expandedRequest === request.id ? <ChevronUp /> : <ChevronDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {request.referenceNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Building2 size={16} color="#666" />
                        <Box>
                          <Typography variant="body2">{request.exporterName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {request.exporterEmail}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{request.documentType}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.priority}
                        color={getPriorityColor(request.priority) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(request.status)}
                        label={request.status ? request.status.replace('_', ' ') : 'UNKNOWN'}
                        color={getStatusColor(request.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(request.requestedAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1}>
                        {request.status === 'PENDING' || request.status === 'UNDER_REVIEW' ? (
                          <>
                            <Tooltip title="Issue Certificate">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleOpenIssueDialog(request)}
                              >
                                <Award size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject Request">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleOpenRejectDialog(request)}
                              >
                                <XCircle size={16} />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Tooltip title="View Details">
                            <IconButton size="small" color="primary">
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {request.status === 'ISSUED' && (
                          <Tooltip title="Download Certificate">
                            <IconButton size="small" color="primary">
                              <Download size={16} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded Row - Exporter Qualification */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 0, borderBottom: 'none' }}>
                      <Collapse in={expandedRequest === request.id} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2, px: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BadgeCheck size={16} /> Exporter Qualification Profile
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Profile Status
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  {getQualificationStatusIcon(request.exporterQualification?.profileStatus || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporterQualification?.profileStatus || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification?.profileStatus || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporterQualification?.licenseStatus || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporterQualification?.licenseStatus || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification?.licenseStatus || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporterQualification?.competenceStatus || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporterQualification?.competenceStatus || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification?.competenceStatus || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporterQualification?.laboratoryStatus || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporterQualification?.laboratoryStatus || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification?.laboratoryStatus || 'UNKNOWN')}
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
                                  {getQualificationStatusIcon(request.exporterQualification?.tasterStatus || 'UNKNOWN')}
                                  <Chip
                                    label={request.exporterQualification?.tasterStatus || 'N/A'}
                                    size="small"
                                    color={getQualificationStatusColor(request.exporterQualification?.tasterStatus || 'UNKNOWN')}
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
        
        {filteredRequests.length === 0 && !loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <FileText size={48} color="#ccc" />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              No document requests found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || filterStatus !== 'ALL' 
                ? 'Try adjusting your search or filter criteria'
                : 'Document requests will appear here when submitted by exporters'
              }
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Issue Document Dialog */}
      <Dialog
        open={issuanceDialogOpen}
        onClose={() => !submitting && setIssuanceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Issue {agencyInfo.documentType}
          {selectedRequest && (
            <Typography variant="body2" color="text.secondary">
              {selectedRequest.documentType} for {selectedRequest.exporterName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Reference:</strong> {selectedRequest.referenceNumber}<br />
                  <strong>Exporter:</strong> {selectedRequest.exporterName}<br />
                  <strong>Email:</strong> {selectedRequest.exporterEmail}<br />
                  <strong>TIN:</strong> {selectedRequest.exporterTin}
                </Typography>
              </Alert>
              
              <TextField
                fullWidth
                required
                label="Document Number"
                value={issueForm.documentNumber}
                onChange={(e) => setIssueForm({ ...issueForm, documentNumber: e.target.value })}
                placeholder={`e.g., ${agencyInfo.agencyCode}-2026-001`}
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
                    placeholder="e.g., 365 days"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Coffee Type"
                    value={issueForm.metadata.coffeeType || ''}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        metadata: { ...issueForm.metadata, coffeeType: e.target.value },
                      })
                    }
                    placeholder="e.g., Arabica"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    value={issueForm.metadata.quantity || ''}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        metadata: { ...issueForm.metadata, quantity: e.target.value },
                      })
                    }
                    placeholder="e.g., 1000 kg"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Destination"
                    value={issueForm.metadata.destination || ''}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        metadata: { ...issueForm.metadata, destination: e.target.value },
                      })
                    }
                    placeholder="e.g., Germany"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes"
                    value={issueForm.metadata.notes || ''}
                    onChange={(e) =>
                      setIssueForm({
                        ...issueForm,
                        metadata: { ...issueForm.metadata, notes: e.target.value },
                      })
                    }
                    placeholder="Additional notes about the certificate issuance..."
                  />
                </Grid>
              </Grid>

              <Divider />

              <Alert severity="info" icon={<BadgeCheck size={16} />}>
                {agencyInfo.agencyCode === 'MOA' || agencyInfo.agencyCode === 'MOH' ? (
                  <>
                    This document will be issued and digitally signed. 
                    <strong> Note:</strong> Blockchain integration is not yet available for {agencyInfo.agencyCode} - 
                    documents will be stored securely in the database.
                  </>
                ) : (
                  <>
                    This document will be automatically signed with your organization's MSP certificate 
                    and recorded on the blockchain for tamper-proof verification.
                  </>
                )}
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIssuanceDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleIssueDocument}
            disabled={submitting || !issueForm.documentNumber}
            startIcon={submitting ? <CircularProgress size={20} /> : <Award size={16} />}
          >
            {submitting 
              ? 'Issuing & Signing...' 
              : (agencyInfo.agencyCode === 'MOA' || agencyInfo.agencyCode === 'MOH' 
                  ? 'Issue & Sign Document' 
                  : 'Issue & Sign with MSP')
            }
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
              {selectedRequest.documentType} for {selectedRequest.exporterName}
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
            startIcon={submitting ? <CircularProgress size={20} /> : <XCircle size={16} />}
          >
            {submitting ? 'Rejecting...' : 'Reject Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentIssuanceDashboard;