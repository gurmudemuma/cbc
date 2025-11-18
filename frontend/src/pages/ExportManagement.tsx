import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExports } from '../hooks/useExports';
import {
  Package,
  Plus,
  Search,
  Eye,
  Upload,
  FileText,
  Building2,
  DollarSign,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  MapPin,
  Menu,
  Home,
  List as ListIcon,
  BarChart3,
  Settings,
  ShieldCheck,
  Ship,
} from 'lucide-react';
import apiClient from '../services/api';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  isRejectionState,
  canResubmit,
  getStatusLabel,
  getRejectionStageLabel,
  getWorkflowProgress,
} from '../utils/workflowManager';
import ExportDetailDialog from '../components/ExportDetailDialog';

const ExportManagement = ({ user }) => {
  const navigate = useNavigate();
  const { exports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  const [filteredExports, setFilteredExports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeView, setActiveView] = useState(() => {
    // Read filter from sessionStorage (set by Layout sidebar)
    return sessionStorage.getItem('exportFilter') || 'all';
  });
  const tableRef = useRef(null);

  const scrollToTable = () => {
    setTimeout(() => {
      if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  };

  const setView = (viewKey) => {
    setActiveView(viewKey);
    setStatusFilter('all');
    scrollToTable();
  };

  // Persist UI state
  useEffect(() => {
    try {
      const savedView = localStorage.getItem('exportMgmt_activeView');
      const savedFilter = localStorage.getItem('exportMgmt_statusFilter');
      if (savedView) setActiveView(savedView);
      if (savedFilter) setStatusFilter(savedFilter);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('exportMgmt_activeView', activeView);
      localStorage.setItem('exportMgmt_statusFilter', statusFilter);
    } catch {}
  }, [activeView, statusFilter]);

  // Rejection and Resubmission state
  const [rejectionDialog, setRejectionDialog] = useState({
    open: false,
    exportId: null,
    exportData: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [resubmitDialog, setResubmitDialog] = useState({
    open: false,
    exportId: null,
    exportData: null,
  });
  const [workflowHistory, setWorkflowHistory] = useState([]);

  // Detail view dialog state
  const [detailDialog, setDetailDialog] = useState({ open: false, exportId: null });

  // Determine user role and permissions - Use BOTH organizationId AND role
  const orgId = user?.organizationId?.toLowerCase();
  const userRole = user?.role?.toLowerCase();
  
  // Check organization type (no longer includes legacy commercialbank IDs)
  const isCommercialBank = orgId === 'commercial-bank' || orgId === 'commercialbank';
  const isNationalBank = orgId === 'national-bank' || orgId === 'nationalbank';
  const isEcta = orgId === 'ecta';
  const isShippingLine = orgId === 'shipping-line' || orgId === 'shippingline';
  const isCustomAuthorities = orgId === 'custom-authorities';

  // Role-based capabilities - Check BOTH organization AND specific role
  const canCreateExports = isCommercialBank && userRole === 'exporter'; // Only exporters at Commercial Bank
  const canApproveFX = isNationalBank && userRole === 'governor'; // Only governors at National Bank
  const canVerifyDocuments = isCommercialBank && userRole === 'bank'; // Only bankers at Commercial Bank
  const canCertifyQuality = isEcta && (userRole === 'inspector' || userRole === 'user'); // ECTA inspectors
  const canManageShipment = isShippingLine && userRole === 'shipper'; // Shipping Line shippers
  const canClearCustoms = isCustomAuthorities && userRole === 'customs'; // Customs officers

  // Determine display role
  const displayRole = canCreateExports ? 'exporter'
    : canVerifyDocuments ? 'banker'
    : canApproveFX ? 'governor'
    : canCertifyQuality ? 'inspector'
    : canManageShipment ? 'shipper'
    : canClearCustoms ? 'customs'
    : 'viewer';
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState({
    commercialInvoice: null,
    packingList: null,
    certificateOfOrigin: null,
    billOfLading: null,
    phytosanitaryCertificate: null,
    qualityReport: null,
    exportLicense: null,
  });
  const [newExportData, setNewExportData] = useState({
    // Exporter Details
    exporterName: '',
    exporterAddress: '',
    exporterContact: '',
    exporterEmail: '',
    // Trade Details
    coffeeType: '',
    quantity: '',
    unit: 'kg',
    unitPrice: '',
    currency: 'USD',
    destinationCountry: '',
    estimatedValue: '',
    portOfLoading: '',
    portOfDischarge: '',
    incoterms: 'FOB',
  });

  // Coffee types with average market prices (USD per kg)
  const coffeeTypes = [
    { value: 'Arabica Grade 1', label: 'Arabica Grade 1', avgPrice: 8.5 },
    { value: 'Arabica Grade 2', label: 'Arabica Grade 2', avgPrice: 7.2 },
    { value: 'Arabica Grade 3', label: 'Arabica Grade 3', avgPrice: 6.0 },
    { value: 'Robusta Grade 1', label: 'Robusta Grade 1', avgPrice: 4.5 },
    { value: 'Robusta Grade 2', label: 'Robusta Grade 2', avgPrice: 3.8 },
    { value: 'Specialty Coffee', label: 'Specialty Coffee', avgPrice: 12.0 },
    { value: 'Organic Arabica', label: 'Organic Arabica', avgPrice: 10.5 },
  ];

  const incotermsOptions = [
    { value: 'FOB', label: 'FOB - Free On Board' },
    { value: 'CIF', label: 'CIF - Cost, Insurance & Freight' },
    { value: 'CFR', label: 'CFR - Cost and Freight' },
    { value: 'EXW', label: 'EXW - Ex Works' },
  ];

  // Calculate estimated value when quantity or unit price changes
  useEffect(() => {
    if (newExportData.quantity && newExportData.unitPrice) {
      const quantity = parseFloat(newExportData.quantity);
      const unitPrice = parseFloat(newExportData.unitPrice);
      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        const calculatedValue = (quantity * unitPrice).toFixed(2);
        setNewExportData((prev) => ({
          ...prev,
          estimatedValue: calculatedValue,
        }));
      }
    }
  }, [newExportData.quantity, newExportData.unitPrice]);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  // fetchExports is now handled by useExports hook
  // Use refreshExports() to manually refresh
  
  const fetchExports = async () => {
    try {
      await refreshExports();
    } catch (error) {
      console.error('Error fetching exports:', error);
      // Error handling is now in the hook
      if (error.response?.status === 503) {
        console.warn('Blockchain network unavailable:', error.response?.data?.message);
      } else if (error.response?.status === 500) {
        console.error('Server error:', error.response?.data?.message);
        // Don't alert for 500 during development
      } else if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        window.location.href = '/login';
      } else if (error.response?.status === 404) {
        console.warn('Exports endpoint not found. This may be expected if no exports exist yet.');
        // Data is managed by useExports hook
      } else if (error.response) {
        alert('Failed to fetch exports: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((exp) => exp.status === statusFilter);
    }

    // Apply grouped views if selected
    if (activeView !== 'all') {
      const groups = {
        fx: ['PENDING', 'FX_PENDING'],
        fx_approved: ['FX_APPROVED'],
        quality: ['FX_APPROVED', 'QUALITY_PENDING'],
        quality_certified: ['QUALITY_CERTIFIED'],
        customs: ['QUALITY_CERTIFIED', 'EXPORT_CUSTOMS_PENDING'],
        customs_cleared: ['EXPORT_CUSTOMS_CLEARED'],
        shipments: ['EXPORT_CUSTOMS_CLEARED', 'SHIPMENT_PENDING'],
        shipments_scheduled: ['SHIPMENT_SCHEDULED'],
        shipped: ['SHIPPED'],
      };
      const allowed = groups[activeView] || null;
      if (allowed) {
        filtered = filtered.filter((exp) => allowed.includes(exp.status));
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.coffeeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const getGroupCounts = () => {
    const groups = {
      fx: ['PENDING', 'FX_PENDING'],
      fx_approved: ['FX_APPROVED'],
      quality: ['FX_APPROVED', 'QUALITY_PENDING'],
      quality_certified: ['QUALITY_CERTIFIED'],
      customs: ['QUALITY_CERTIFIED', 'EXPORT_CUSTOMS_PENDING'],
      customs_cleared: ['EXPORT_CUSTOMS_CLEARED'],
      shipments: ['EXPORT_CUSTOMS_CLEARED', 'SHIPMENT_PENDING'],
      shipments_scheduled: ['SHIPMENT_SCHEDULED'],
      shipped: ['SHIPPED'],
      all: null,
    };
    const counts = {};
    Object.keys(groups).forEach((key) => {
      const allowed = groups[key];
      counts[key] = allowed
        ? exports.filter((e) => allowed.includes(e.status)).length
        : exports.length;
    });
    return counts;
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleDocumentUpload = (docType, event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedDocuments({
        ...uploadedDocuments,
        [docType]: file,
      });
    }
  };

  const handleRemoveDocument = (docType) => {
    setUploadedDocuments({
      ...uploadedDocuments,
      [docType]: null,
    });
  };

  const documentTypes = [
    {
      key: 'commercialInvoice',
      label: 'Commercial Invoice',
      required: true,
      description: 'Detailed invoice of the coffee shipment',
    },
    {
      key: 'packingList',
      label: 'Packing List',
      required: true,
      description: 'List of packages and their contents',
    },
    {
      key: 'certificateOfOrigin',
      label: 'Certificate of Origin',
      required: true,
      description: 'Proof of coffee origin',
    },
    {
      key: 'billOfLading',
      label: 'Bill of Lading',
      required: false,
      description: 'Shipping document (can be added later)',
    },
    {
      key: 'phytosanitaryCertificate',
      label: 'Phytosanitary Certificate',
      required: true,
      description: 'Plant health certificate',
    },
    {
      key: 'qualityReport',
      label: 'Quality Report',
      required: false,
      description: 'Initial quality assessment',
    },
    {
      key: 'exportLicense',
      label: 'Export License',
      required: true,
      description: 'Government export authorization',
    },
  ];

  const handleCoffeeTypeChange = (coffeeType) => {
    const selectedCoffee = coffeeTypes.find((c) => c.value === coffeeType);
    setNewExportData({
      ...newExportData,
      coffeeType: coffeeType,
      unitPrice: selectedCoffee ? selectedCoffee.avgPrice.toString() : '',
    });
  };

  const handleCreateExport = async () => {
    try {
      // Check qualification status first (for exporters)
      if (user?.role === 'exporter') {
        try {
          const qualificationResponse = await apiClient.get('/api/exporter/qualification-status');
          if (!qualificationResponse.data.data.canCreateExportRequest) {
            // Show qualification requirements dialog
            setError(`Cannot create export: ${qualificationResponse.data.data.reason}`);
            // Optionally redirect to pre-registration
            if (window.confirm('You need to complete pre-registration first. Go to pre-registration page?')) {
              navigate('/pre-registration');
              return;
            }
            return;
          }
        } catch (qualError) {
          console.warn('Could not check qualification status:', qualError);
          // Continue with export creation if qualification check fails
        }
      }

      // Create the export
      const response = await apiClient.post('/api/exports', {
        exporterName: newExportData.exporterName,
        coffeeType: newExportData.coffeeType,
        quantity: parseFloat(newExportData.quantity),
        destinationCountry: newExportData.destinationCountry,
        estimatedValue: parseFloat(newExportData.estimatedValue),
        exporterId: user?.organizationId, // Include exporterId for validation
      });

      const exportId = response.data.data.exportId;

      // Upload documents if any
      const documentsToUpload = Object.entries(uploadedDocuments).filter(
        ([_, file]) => file !== null
      );

      if (documentsToUpload.length > 0) {
        for (const [docType, file] of documentsToUpload) {
          const formData = new FormData();
          formData.append('file', file);
          // Convert camelCase to SCREAMING_SNAKE_CASE
          const formattedDocType = docType
            .replace(/([A-Z])/g, '_$1')
            .toUpperCase()
            .replace(/^_/, ''); // Remove leading underscore
          formData.append('docType', formattedDocType);

          await apiClient.post(`/exports/${exportId}/documents`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      }

      setIsModalOpen(false);
      setActiveStep(0);
      setUploadedDocuments({
        commercialInvoice: null,
        packingList: null,
        certificateOfOrigin: null,
        billOfLading: null,
        phytosanitaryCertificate: null,
        qualityReport: null,
        exportLicense: null,
      });
      setNewExportData({
        exporterName: '',
        exporterAddress: '',
        exporterContact: '',
        exporterEmail: '',
        coffeeType: '',
        quantity: '',
        unit: 'kg',
        unitPrice: '',
        currency: 'USD',
        destinationCountry: '',
        estimatedValue: '',
        portOfLoading: '',
        portOfDischarge: '',
        incoterms: 'FOB',
      });
      fetchExports();
    } catch (error) {
      console.error('Error creating export:', error);
      alert('Failed to create export: ' + (error.response?.data?.message || error.message));
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 0: // Exporter Details
        return (
          newExportData.exporterName &&
          newExportData.exporterAddress &&
          newExportData.exporterContact &&
          newExportData.exporterEmail
        );
      case 1: // Trade Details
        return (
          newExportData.coffeeType &&
          newExportData.quantity &&
          newExportData.unitPrice &&
          newExportData.destinationCountry &&
          newExportData.estimatedValue &&
          newExportData.portOfLoading &&
          newExportData.portOfDischarge
        );
      case 2: // Documents
        // Check if all required documents are uploaded
        const requiredDocs = documentTypes.filter((doc) => doc.required);
        return requiredDocs.every((doc) => uploadedDocuments[doc.key] !== null);
      default:
        return false;
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      PENDING: 'warning',
      FX_PENDING: 'warning',
      FX_APPROVED: 'info',
      BANKING_PENDING: 'warning',
      BANKING_APPROVED: 'info',
      QUALITY_PENDING: 'warning',
      QUALITY_CERTIFIED: 'info',
      EXPORT_CUSTOMS_PENDING: 'warning',
      EXPORT_CUSTOMS_CLEARED: 'info',
      SHIPMENT_SCHEDULED: 'primary',
      SHIPPED: 'primary',
      COMPLETED: 'success',
      CANCELLED: 'error',
      FX_REJECTED: 'error',
      BANKING_REJECTED: 'error',
      QUALITY_REJECTED: 'error',
    };
    return statusMap[status] || 'default';
  };

  // Role-specific action handlers
  const handleApproveFX = async (exportId) => {
    try {
      await apiClient.post(`/api/exports/${exportId}/approve-fx`);
      alert('FX approval successful');
      fetchExports();
    } catch (error) {
      alert('Failed to approve FX: ' + (error.response?.data?.message || error.message));
    }
  };

  const openRejectionDialog = (exportId, exportData, stage) => {
    setRejectionDialog({ open: true, exportId, exportData, stage });
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const { exportId, stage } = rejectionDialog;
      let endpoint = '';

      if (stage === 'fx') endpoint = `/api/exports/${exportId}/reject-fx`;
      else if (stage === 'quality') endpoint = `/api/exports/${exportId}/reject-quality`;
      else if (stage === 'customs') endpoint = `/api/exports/${exportId}/reject-customs`;
      else if (stage === 'shipment') endpoint = `/api/exports/${exportId}/reject-shipment`;

      await apiClient.post(endpoint, {
        reason: rejectionReason,
        rejectedBy: user?.username,
        rejectedAt: new Date().toISOString(),
      });

      alert('Export rejected successfully. Exporter will be notified to resubmit.');
      setRejectionDialog({ open: false, exportId: null, exportData: null, stage: null });
      setRejectionReason('');
      fetchExports();
    } catch (error) {
      alert('Failed to reject: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCertifyQuality = async (exportId, certificationData) => {
    try {
      await apiClient.post(`/api/exports/${exportId}/certify`, certificationData);
      alert('Quality certification successful');
      fetchExports();
    } catch (error) {
      alert('Failed to certify quality: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleScheduleShipment = async (exportId, shipmentData) => {
    try {
      await apiClient.post(`/api/exports/${exportId}/schedule-shipment`, shipmentData);
      alert('Shipment scheduled successfully');
      fetchExports();
    } catch (error) {
      alert('Failed to schedule shipment: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleClearCustoms = async (exportId, clearanceData) => {
    try {
      await apiClient.post(`/api/exports/${exportId}/clear-customs`, clearanceData);
      alert('Customs clearance successful');
      fetchExports();
    } catch (error) {
      alert('Failed to clear customs: ' + (error.response?.data?.message || error.message));
    }
  };

  // Resubmission handler for exporters
  const openResubmitDialog = (exportItem) => {
    setResubmitDialog({ open: true, exportId: exportItem.exportId, exportData: exportItem });
  };

  const handleResubmit = async () => {
    try {
      const { exportId } = resubmitDialog;
      await apiClient.post(`/api/exports/${exportId}/resubmit`, {
        resubmittedBy: user?.username,
        resubmittedAt: new Date().toISOString(),
      });

      alert('Export resubmitted successfully for review');
      setResubmitDialog({ open: false, exportId: null, exportData: null });
      fetchExports();
    } catch (error) {
      alert('Failed to resubmit: ' + (error.response?.data?.message || error.message));
    }
  };

  // Fetch workflow history
  const fetchWorkflowHistory = async (exportId) => {
    try {
      const response = await apiClient.get(`/api/exports/${exportId}/history`);
      setWorkflowHistory(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch workflow history:', error);
      setWorkflowHistory([]);
    }
  };

  // Get available actions for current user and export status
  const getAvailableActions = (exportItem) => {
    const actions = [];
    const status = exportItem.status;

    // View Details - Available to all roles for review before action
    actions.push({
      label: 'View Details',
      action: () => setDetailDialog({ open: true, exportId: exportItem.exportId }),
      color: 'info',
      icon: <Eye size={16} />,
      variant: 'outlined',
    });

    // Commercial Bank Exporter - Resubmit rejected exports
    if (canCreateExports && isRejectionState(status) && canResubmit(status)) {
      actions.push({
        label: 'Resubmit',
        action: () => openResubmitDialog(exportItem),
        color: 'warning',
        icon: <RefreshCw size={16} />,
      });
      actions.push({
        label: 'View Rejection',
        action: () => {
          fetchWorkflowHistory(exportItem.exportId);
          alert(
            `Rejected at ${getRejectionStageLabel(status)}\nReason: ${exportItem.rejectionReason || 'No reason provided'}`
          );
        },
        color: 'error',
        icon: <AlertCircle size={16} />,
      });
    }

    // National Bank Governor - FX Approval
    if (canApproveFX && (status === 'PENDING' || status === 'FX_PENDING')) {
      actions.push({
        label: 'Approve',
        action: () => setDetailDialog({ open: true, exportId: exportItem.exportId }),
        color: 'success',
        icon: <CheckCircle size={16} />,
      });
      actions.push({
        label: 'Reject',
        action: () => openRejectionDialog(exportItem.exportId, exportItem, 'fx'),
        color: 'error',
        icon: <XCircle size={16} />,
      });
    }

    // ECTA Inspector - Quality Certification
    if (canCertifyQuality && (status === 'FX_APPROVED' || status === 'QUALITY_PENDING')) {
      actions.push({
        label: 'Certify',
        action: () => setDetailDialog({ open: true, exportId: exportItem.exportId }),
        color: 'success',
        icon: <CheckCircle size={16} />,
      });
      actions.push({
        label: 'Reject',
        action: () => openRejectionDialog(exportItem.exportId, exportItem, 'quality'),
        color: 'error',
        icon: <XCircle size={16} />,
      });
    }

    // Custom Authorities Officer - Customs Clearance
    if (
      canClearCustoms &&
      (status === 'QUALITY_CERTIFIED' || status === 'EXPORT_CUSTOMS_PENDING')
    ) {
      actions.push({
        label: 'Clear',
        action: () => setDetailDialog({ open: true, exportId: exportItem.exportId }),
        color: 'success',
        icon: <CheckCircle size={16} />,
      });
      actions.push({
        label: 'Reject',
        action: () => openRejectionDialog(exportItem.exportId, exportItem, 'customs'),
        color: 'error',
        icon: <XCircle size={16} />,
      });
    }

    // Shipping Line Shipper - Shipment Management
    if (canManageShipment && (status === 'EXPORT_CUSTOMS_CLEARED' || status === 'SHIPMENT_PENDING')) {
      actions.push({
        label: 'Schedule',
        action: () => setDetailDialog({ open: true, exportId: exportItem.exportId }),
        color: 'primary',
        icon: <CheckCircle size={16} />,
      });
      actions.push({
        label: 'Reject',
        action: () => openRejectionDialog(exportItem.exportId, exportItem, 'shipment'),
        color: 'error',
        icon: <XCircle size={16} />,
      });
    }

    return actions;
  };

  // Get role-specific dashboard title
  const getDashboardTitle = () => {
    if (canCreateExports) return 'Create & Manage Exports';
    if (canVerifyDocuments) return 'Document Verification';
    if (canApproveFX) return 'FX Approval & Compliance';
    if (canCertifyQuality) return 'Quality Certification';
    if (canManageShipment) return 'Shipment Management';
    if (canClearCustoms) return 'Customs Clearance';
    return 'Export Management';
  };

  return (
    <>
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4">{getDashboardTitle()}</Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              {canCreateExports && 'Initiate and manage coffee export transactions'}
              {canVerifyDocuments && 'Verify export documents and banking compliance'}
              {canApproveFX && 'Review and approve foreign exchange and compliance'}
              {canCertifyQuality && 'Certify coffee quality and issue certificates'}
              {canManageShipment && 'Schedule and track shipments'}
              {canClearCustoms && 'Process customs clearance and documentation'}
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={0}>
          <Grid item xs={12} md={9} sx={{ pr: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{exports.length}</Typography>
                    <Typography variant="body2">Total Exports</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {exports.filter((e) => e.status === 'PENDING').length}
                    </Typography>
                    <Typography variant="body2">Pending</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">
                      {exports.filter((e) => e.status === 'COMPLETED').length}
                    </Typography>
                    <Typography variant="body2">Completed</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      placeholder="Search exports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search size={20} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Select
                      fullWidth
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="FX_APPROVED">FX Approved</MenuItem>
                      <MenuItem value="BANKING_PENDING">Banking Pending</MenuItem>
                      <MenuItem value="BANKING_APPROVED">Banking Approved</MenuItem>
                      <MenuItem value="QUALITY_CERTIFIED">Quality Certified</MenuItem>
                      <MenuItem value="SHIPMENT_SCHEDULED">Shipment Scheduled</MenuItem>
                      <MenuItem value="SHIPPED">Shipped</MenuItem>
                      <MenuItem value="COMPLETED">Completed</MenuItem>
                    </Select>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Export Records
                </Typography>
                {filteredExports.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Package size={64} color="#666" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      No exports found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {exports.length === 0
                        ? 'Get started by creating your first export request'
                        : 'No exports match your search criteria'}
                    </Typography>
                    {exports.length === 0 && (
                      <Button
                        variant="contained"
                        startIcon={<Plus />}
                        onClick={() => setIsModalOpen(true)}
                      >
                        Create First Export
                      </Button>
                    )}
                  </Box>
                ) : (
                  <TableContainer
                    component={Paper}
                    sx={{ maxHeight: 520, borderRadius: 2 }}
                    ref={tableRef}
                  >
                    <Table stickyHeader size="small">
                      <TableHead sx={{ '& th': { fontWeight: 700 } }}>
                        <TableRow>
                          <TableCell>Export ID</TableCell>
                          <TableCell>Coffee Type</TableCell>
                          <TableCell>Quantity (kg)</TableCell>
                          <TableCell>Destination</TableCell>
                          <TableCell>Value (USD)</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredExports.map((exp) => {
                          const availableActions = getAvailableActions(exp);
                          return (
                            <TableRow key={exp.exportId} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {exp.exportId}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Package size={16} color="#795548" />
                                  <Typography variant="body2">{exp.coffeeType || 'N/A'}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight="medium">
                                  {exp.quantity?.toLocaleString() || 0} kg
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <MapPin size={14} />
                                  <Typography variant="body2">{exp.destinationCountry}</Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <DollarSign size={14} color="#2e7d32" />
                                  <Typography
                                    variant="body2"
                                    color="success.main"
                                    fontWeight="medium"
                                  >
                                    {exp.estimatedValue?.toLocaleString() || 'N/A'}
                                  </Typography>
                                </Stack>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={exp.status.replace(/_/g, ' ')}
                                  color={getStatusColor(exp.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(exp.createdAt).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  {availableActions.map((action, idx) => (
                                    <Button
                                      key={idx}
                                      size="small"
                                      variant={action.variant || 'contained'}
                                      color={action.color}
                                      onClick={action.action}
                                      startIcon={action.icon}
                                      sx={{ minWidth: 'auto', px: 1.5 }}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </Stack>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ height: '100%', position: 'sticky', top: 24 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {canCreateExports ? 'Create Export' : 'Quick Actions'}
                </Typography>
                <Stack spacing={2}>
                  {/* Commercial Bank Exporter - Create Exports */}
                  {canCreateExports && (
                    <>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="caption">
                          Initiate new coffee export transactions
                        </Typography>
                      </Alert>
                      <Button
                        variant="contained"
                        startIcon={<Plus />}
                        onClick={() => setIsModalOpen(true)}
                        fullWidth
                      >
                        Create Export Request
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => setView('all')}>
                        View My Exports
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => navigate('/reports')}>
                        Generate Report
                      </Button>
                    </>
                  )}

                  {/* Commercial Bank Banker - Document Verification */}
                  {canVerifyDocuments && (
                    <>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="caption">
                          Verify export documents and banking compliance
                        </Typography>
                      </Alert>
                      <Button variant="contained" fullWidth onClick={() => setView('pending')}>
                        Pending Documents
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => setView('approved')}>
                        Approved Documents
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => navigate('/reports')}>
                        Banking Reports
                      </Button>
                    </>
                  )}

                  {/* National Bank Governor - FX Approval */}
                  {canApproveFX && (
                    <>
                      <Alert severity="warning" sx={{ mb: 1 }}>
                        <Typography variant="caption">
                          Review and approve FX requests and compliance
                        </Typography>
                      </Alert>
                      <Button variant="contained" fullWidth onClick={() => setView('fx')}>
                        View Pending FX Approvals
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => setView('fx_approved')}>
                        Approved Exports
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => navigate('/reports')}>
                        Generate Compliance Report
                      </Button>
                    </>
                  )}

                  {/* ECTA Inspector - Quality Certification */}
                  {canCertifyQuality && (
                    <>
                      <Alert severity="success" sx={{ mb: 1 }}>
                        <Typography variant="caption">
                          Certify coffee quality and issue certificates
                        </Typography>
                      </Alert>
                      <Button variant="contained" fullWidth onClick={() => setView('quality')}>
                        Pending Certifications
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setView('quality_certified')}
                      >
                        Certified Exports
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => navigate('/reports')}>
                        Quality Reports
                      </Button>
                    </>
                  )}

                  {/* Shipping Line Shipper - Logistics */}
                  {canManageShipment && (
                    <>
                      <Alert severity="primary" sx={{ mb: 1 }}>
                        <Typography variant="caption">Schedule and manage shipments</Typography>
                      </Alert>
                      <Button variant="contained" fullWidth onClick={() => setView('shipments')}>
                        Schedule New Shipment
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => setView('shipments')}>
                        Active Shipments
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => setView('shipped')}>
                        Shipping History
                      </Button>
                    </>
                  )}

                  {/* Custom Authorities Officer - Clearance */}
                  {canClearCustoms && (
                    <>
                      <Alert severity="error" sx={{ mb: 1 }}>
                        <Typography variant="caption">
                          Process customs clearance and documentation
                        </Typography>
                      </Alert>
                      <Button variant="contained" fullWidth onClick={() => setView('customs')}>
                        Pending Clearances
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setView('customs_cleared')}
                      >
                        Cleared Exports
                      </Button>
                      <Button variant="outlined" fullWidth onClick={() => navigate('/reports')}>
                        Inspection Reports
                      </Button>
                    </>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog
          open={isModalOpen && canCreateExports}
          onClose={() => {
            setIsModalOpen(false);
            setActiveStep(0);
            setUploadedDocuments({
              commercialInvoice: null,
              packingList: null,
              certificateOfOrigin: null,
              billOfLading: null,
              phytosanitaryCertificate: null,
              qualityReport: null,
              exportLicense: null,
            });
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Package size={24} />
              <Typography variant="h6">Create New Export</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 2 }}>
              {/* Step 1: Exporter Details */}
              <Step>
                <StepLabel
                  optional={<Typography variant="caption">Company information</Typography>}
                  icon={<Building2 size={20} />}
                >
                  Exporter Details
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Exporter Name"
                        value={newExportData.exporterName}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, exporterName: e.target.value })
                        }
                        placeholder="e.g., ABC Coffee Exporters Ltd."
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Business Address"
                        value={newExportData.exporterAddress}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, exporterAddress: e.target.value })
                        }
                        placeholder="e.g., 123 Coffee Street, Addis Ababa"
                        required
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Contact Number"
                        value={newExportData.exporterContact}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, exporterContact: e.target.value })
                        }
                        placeholder="e.g., +251-11-123-4567"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="email"
                        label="Email Address"
                        value={newExportData.exporterEmail}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, exporterEmail: e.target.value })
                        }
                        placeholder="e.g., export@abccoffee.com"
                        required
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleNext} disabled={!isStepValid(0)}>
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 2: Trade Details */}
              <Step>
                <StepLabel
                  optional={<Typography variant="caption">Coffee and shipment details</Typography>}
                  icon={<DollarSign size={20} />}
                >
                  Trade Details
                </StepLabel>
                <StepContent>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Select
                        fullWidth
                        value={newExportData.coffeeType}
                        onChange={(e) => handleCoffeeTypeChange(e.target.value)}
                        displayEmpty
                        required
                      >
                        <MenuItem value="" disabled>
                          Select Coffee Type
                        </MenuItem>
                        {coffeeTypes.map((coffee) => (
                          <MenuItem key={coffee.value} value={coffee.value}>
                            {coffee.label} (Avg. ${coffee.avgPrice}/kg)
                          </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={newExportData.quantity}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, quantity: e.target.value })
                        }
                        placeholder="e.g., 5000"
                        required
                        inputProps={{ min: 1, step: 0.01 }}
                        InputProps={{
                          endAdornment: (
                            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                              kg
                            </Typography>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Unit Price"
                        value={newExportData.unitPrice}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, unitPrice: e.target.value })
                        }
                        placeholder="e.g., 8.50"
                        required
                        inputProps={{ min: 0.01, step: 0.01 }}
                        InputProps={{
                          startAdornment: (
                            <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                              $
                            </Typography>
                          ),
                          endAdornment: (
                            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 1 }}>
                              /kg
                            </Typography>
                          ),
                        }}
                        helperText="Price per kilogram in USD"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                          Estimated Total Value
                        </Typography>
                        <Typography variant="h5" color="primary">
                          ${newExportData.estimatedValue || '0.00'} {newExportData.currency}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Calculated: {newExportData.quantity || 0} kg × $
                          {newExportData.unitPrice || 0}/kg
                        </Typography>
                      </Alert>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Destination Country"
                        value={newExportData.destinationCountry}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, destinationCountry: e.target.value })
                        }
                        placeholder="e.g., United States"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Select
                        fullWidth
                        value={newExportData.incoterms}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, incoterms: e.target.value })
                        }
                        required
                      >
                        {incotermsOptions.map((term) => (
                          <MenuItem key={term.value} value={term.value}>
                            {term.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Port of Loading"
                        value={newExportData.portOfLoading}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, portOfLoading: e.target.value })
                        }
                        placeholder="e.g., Djibouti Port"
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Port of Discharge"
                        value={newExportData.portOfDischarge}
                        onChange={(e) =>
                          setNewExportData({ ...newExportData, portOfDischarge: e.target.value })
                        }
                        placeholder="e.g., Port of Los Angeles"
                        required
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button onClick={handleBack}>Back</Button>
                    <Button variant="contained" onClick={handleNext} disabled={!isStepValid(1)}>
                      Continue
                    </Button>
                  </Box>
                </StepContent>
              </Step>

              {/* Step 3: Document Upload */}
              <Step>
                <StepLabel
                  optional={
                    <Typography variant="caption">
                      Upload supporting documents (optional)
                    </Typography>
                  }
                  icon={<FileText size={20} />}
                >
                  Document Upload
                </StepLabel>
                <StepContent>
                  <Box sx={{ mt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Required Documents
                      </Typography>
                      Please upload all required documents. Optional documents can be added later.
                    </Alert>

                    <Stack spacing={2}>
                      {documentTypes.map((docType) => (
                        <Paper
                          key={docType.key}
                          variant="outlined"
                          sx={{
                            p: 2,
                            bgcolor: uploadedDocuments[docType.key]
                              ? 'success.light'
                              : 'background.paper',
                            borderColor: uploadedDocuments[docType.key]
                              ? 'success.main'
                              : docType.required
                                ? 'warning.main'
                                : 'divider',
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6}>
                              <Stack spacing={0.5}>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="subtitle2">{docType.label}</Typography>
                                  {docType.required && (
                                    <Chip label="Required" size="small" color="warning" />
                                  )}
                                </Stack>
                                <Typography variant="caption" color="text.secondary">
                                  {docType.description}
                                </Typography>
                              </Stack>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              {uploadedDocuments[docType.key] ? (
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  alignItems="center"
                                  justifyContent="flex-end"
                                >
                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <FileText size={16} color="green" />
                                    <Typography variant="body2" color="success.main">
                                      {uploadedDocuments[docType.key].name}
                                    </Typography>
                                    <Chip
                                      label={`${(uploadedDocuments[docType.key].size / 1024).toFixed(1)} KB`}
                                      size="small"
                                      color="success"
                                    />
                                  </Stack>
                                  <Button
                                    size="small"
                                    color="error"
                                    onClick={() => handleRemoveDocument(docType.key)}
                                  >
                                    Remove
                                  </Button>
                                </Stack>
                              ) : (
                                <Button
                                  variant="outlined"
                                  component="label"
                                  startIcon={<Upload size={16} />}
                                  size="small"
                                  fullWidth
                                >
                                  Upload
                                  <input
                                    type="file"
                                    hidden
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                    onChange={(e) => handleDocumentUpload(docType.key, e)}
                                  />
                                </Button>
                              )}
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 2, display: 'block' }}
                    >
                      Accepted formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB per file)
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                    <Button onClick={handleBack}>Back</Button>
                    <Button
                      variant="contained"
                      onClick={handleCreateExport}
                      disabled={!isStepValid(2)}
                    >
                      Create Export
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            </Stepper>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setIsModalOpen(false);
                setActiveStep(0);
                setUploadedDocuments({
                  commercialInvoice: null,
                  packingList: null,
                  certificateOfOrigin: null,
                  billOfLading: null,
                  phytosanitaryCertificate: null,
                  qualityReport: null,
                  exportLicense: null,
                });
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Rejection Dialog */}
        <Dialog
          open={rejectionDialog.open}
          onClose={() =>
            setRejectionDialog({ open: false, exportId: null, exportData: null, stage: null })
          }
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <XCircle size={24} color="#d32f2f" />
              <Typography variant="h6">Reject Export</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This export will be returned to the Commercial Bank exporter for corrections and resubmission.
            </Alert>

            {rejectionDialog.exportData && (
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Export Details:
                </Typography>
                <Typography variant="body2">ID: {rejectionDialog.exportData.exportId}</Typography>
                <Typography variant="body2">
                  Coffee Type: {rejectionDialog.exportData.coffeeType}
                </Typography>
                <Typography variant="body2">
                  Quantity: {rejectionDialog.exportData.quantity} kg
                </Typography>
                <Typography variant="body2">
                  Destination: {rejectionDialog.exportData.destinationCountry}
                </Typography>
              </Box>
            )}

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Reason for Rejection *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejection..."
              required
              sx={{ mt: 2 }}
            />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              The exporter will receive this feedback and can make corrections before resubmitting.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() =>
                setRejectionDialog({ open: false, exportId: null, exportData: null, stage: null })
              }
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              variant="contained"
              color="error"
              startIcon={<XCircle size={18} />}
            >
              Confirm Rejection
            </Button>
          </DialogActions>
        </Dialog>

        {/* Resubmission Dialog */}
        <Dialog
          open={resubmitDialog.open}
          onClose={() => setResubmitDialog({ open: false, exportId: null, exportData: null })}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Stack direction="row" spacing={1} alignItems="center">
              <RefreshCw size={24} color="#ed6c02" />
              <Typography variant="h6">Resubmit Export</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {resubmitDialog.exportData && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  This export was rejected at the{' '}
                  <strong>{getRejectionStageLabel(resubmitDialog.exportData.status)}</strong> stage.
                  Review the feedback and make necessary corrections before resubmitting.
                </Alert>

                {resubmitDialog.exportData.rejectionReason && (
                  <Box
                    sx={{
                      mb: 3,
                      p: 2,
                      bgcolor: '#fff3e0',
                      borderRadius: 1,
                      border: '1px solid #ffb74d',
                    }}
                  >
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      Rejection Reason:
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {resubmitDialog.exportData.rejectionReason}
                    </Typography>
                    {resubmitDialog.exportData.rejectedBy && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block' }}
                      >
                        Rejected by: {resubmitDialog.exportData.rejectedBy} on{' '}
                        {new Date(resubmitDialog.exportData.rejectedAt).toLocaleString()}
                      </Typography>
                    )}
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Export Details:
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Export ID:
                    </Typography>
                    <Typography variant="body1">{resubmitDialog.exportData.exportId}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Coffee Type:
                    </Typography>
                    <Typography variant="body1">{resubmitDialog.exportData.coffeeType}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Quantity:
                    </Typography>
                    <Typography variant="body1">{resubmitDialog.exportData.quantity} kg</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Destination:
                    </Typography>
                    <Typography variant="body1">
                      {resubmitDialog.exportData.destinationCountry}
                    </Typography>
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Before resubmitting:</strong>
                  </Typography>
                  <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
                    <li>Review and address all rejection feedback</li>
                    <li>Update any incorrect information</li>
                    <li>Upload corrected documents if required</li>
                    <li>Ensure all requirements are met</li>
                  </Typography>
                </Alert>

                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Note: You can edit the export details by clicking "Edit Export" before
                    resubmitting, or resubmit as-is if you believe the rejection was in error.
                  </Typography>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setResubmitDialog({ open: false, exportId: null, exportData: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setResubmitDialog({ open: false, exportId: null, exportData: null });
                navigate(`/exports/${resubmitDialog.exportId}/edit`);
              }}
              variant="outlined"
            >
              Edit Export First
            </Button>
            <Button
              onClick={handleResubmit}
              variant="contained"
              color="warning"
              startIcon={<RefreshCw size={18} />}
            >
              Resubmit Now
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Detail Dialog - For viewing complete export details before approval/rejection */}
        <ExportDetailDialog
          open={detailDialog.open}
          onClose={() => setDetailDialog({ open: false, exportId: null })}
          exportId={detailDialog.exportId}
          userRole={displayRole}
          onApprove={(exportData) => {
            // Handle approval based on user capabilities
            if (canApproveFX) {
              handleApproveFX(exportData.exportId);
            } else if (canCertifyQuality) {
              handleCertifyQuality(exportData.exportId, {});
            } else if (canClearCustoms) {
              handleClearCustoms(exportData.exportId, {});
            } else if (canManageShipment) {
              handleScheduleShipment(exportData.exportId, {});
            }
          }}
          onReject={(exportData) => {
            // Open rejection dialog with proper stage
            let stage = '';
            if (canApproveFX) stage = 'fx';
            else if (canCertifyQuality) stage = 'quality';
            else if (canClearCustoms) stage = 'customs';
            else if (canManageShipment) stage = 'shipment';

            openRejectionDialog(exportData.exportId, exportData, stage);
          }}
        />
      </Box>
    </>
  );
};

export default ExportManagement;
