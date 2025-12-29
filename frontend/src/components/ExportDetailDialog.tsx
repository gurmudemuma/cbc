import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Chip,
  Divider,
  Stack,
  Card,
  CardContent,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Package,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  DollarSign,
  Scale,
  Ship,
  Building2,
  User,
  Calendar,
  Download,
  Eye,
} from 'lucide-react';
import apiClient from '../services/api';
import {
  getStatusLabel,
  getStatusColor,
  getWorkflowProgress,
  getCurrentStage,
  WORKFLOW_STAGES,
} from '../utils/workflowManager';

const ExportDetailDialog = ({ open, onClose, exportId, onApprove, onReject, userRole }) => {
  const [exportData, setExportData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [workflowHistory, setWorkflowHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (open && exportId) {
      fetchExportDetails();
    }
  }, [open, exportId]);

  const fetchExportDetails = async () => {
    setLoading(true);
    try {
      // Fetch export data
      const exportResponse = await apiClient.get(`/api/exports/${exportId}`);
      setExportData(exportResponse.data.data);

      // Fetch documents
      try {
        const docsResponse = await apiClient.get(`/api/exports/${exportId}/documents`);
        setDocuments(docsResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
        setDocuments([]);
      }

      // Fetch workflow history
      try {
        const historyResponse = await apiClient.get(`/api/exports/${exportId}/history`);
        setWorkflowHistory(historyResponse.data.data || []);
      } catch (error) {
        console.error('Error fetching history:', error);
        setWorkflowHistory([]);
      }
    } catch (error) {
      console.error('Error fetching export details:', error);
      alert('Failed to load export details: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (docId, docName) => {
    try {
      const response = await apiClient.get(`/api/exports/${exportId}/documents/${docId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download document: ' + (error.response?.data?.message || error.message));
    }
  };

  const canApprove = () => {
    if (!exportData) return false;
    const status = exportData.status;

    if (userRole === 'banker' && (status === 'PENDING' || status === 'FX_PENDING')) return true;
    if (userRole === 'inspector' && (status === 'FX_APPROVED' || status === 'QUALITY_PENDING'))
      return true;
    if (
      userRole === 'customs' &&
      (status === 'QUALITY_CERTIFIED' || status === 'EXPORT_CUSTOMS_PENDING')
    )
      return true;
    if (
      userRole === 'shipper' &&
      (status === 'EXPORT_CUSTOMS_CLEARED' || status === 'SHIPMENT_PENDING')
    )
      return true;

    return false;
  };

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <LinearProgress sx={{ width: '100%', mb: 2 }} />
            <Typography>Loading export details...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!exportData) return null;

  const currentStage = getCurrentStage(exportData.status);
  const progress = getWorkflowProgress(exportData.status);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={2} alignItems="center">
            <Package size={28} />
            <Box>
              <Typography variant="h6">Export Details</Typography>
              <Typography variant="caption" color="text.secondary">
                ID: {exportData.exportId}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={getStatusLabel(exportData.status)}
            color={getStatusColor(exportData.status)}
            size="medium"
          />
        </Stack>

        {/* Workflow Progress */}
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current Stage: {currentStage?.name || 'Unknown'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {progress}% Complete
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
          <Tab label="Export Information" />
          <Tab label="Documents" />
          <Tab label="Workflow History" />
        </Tabs>

        {/* Tab 1: Export Information */}
        {activeTab === 0 && (
          <Box>
            {/* Exporter Information */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Building2 size={20} />
                  <Typography variant="h6">Exporter Information</Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Exporter Name
                    </Typography>
                    <Typography variant="body1">{exportData.exporterName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Contact
                    </Typography>
                    <Typography variant="body1">{exportData.exporterContact || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Email
                    </Typography>
                    <Typography variant="body1">{exportData.exporterEmail || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Address
                    </Typography>
                    <Typography variant="body1">{exportData.exporterAddress || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Coffee Details */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Package size={20} />
                  <Typography variant="h6">Coffee Details</Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      Coffee Type
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {exportData.coffeeType}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      Quantity
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {exportData.quantity?.toLocaleString()} kg
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="caption" color="text.secondary">
                      Unit Price
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      ${exportData.unitPrice || 'N/A'} / kg
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Estimated Value
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <DollarSign size={18} color="#2e7d32" />
                      <Typography variant="h6" color="success.main">
                        ${exportData.estimatedValue?.toLocaleString() || 'N/A'}
                      </Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Currency
                    </Typography>
                    <Typography variant="body1">{exportData.currency || 'USD'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Shipping Details */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Ship size={20} />
                  <Typography variant="h6">Shipping Details</Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Destination Country
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MapPin size={16} />
                      <Typography variant="body1">{exportData.destinationCountry}</Typography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Incoterms
                    </Typography>
                    <Typography variant="body1">{exportData.incoterms || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Port of Loading
                    </Typography>
                    <Typography variant="body1">{exportData.portOfLoading || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Port of Discharge
                    </Typography>
                    <Typography variant="body1">{exportData.portOfDischarge || 'N/A'}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Calendar size={20} />
                  <Typography variant="h6">Timeline</Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body1">
                      {new Date(exportData.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="caption" color="text.secondary">
                      Last Updated
                    </Typography>
                    <Typography variant="body1">
                      {new Date(exportData.updatedAt || exportData.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Rejection Info if applicable */}
            {exportData.rejectionReason && (
              <Alert severity="error" sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Previous Rejection
                </Typography>
                <Typography variant="body2">
                  <strong>Reason:</strong> {exportData.rejectionReason}
                </Typography>
                {exportData.rejectedBy && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Rejected by: {exportData.rejectedBy} on{' '}
                    {new Date(exportData.rejectedAt).toLocaleString()}
                  </Typography>
                )}
              </Alert>
            )}
          </Box>
        )}

        {/* Tab 2: Documents */}
        {activeTab === 1 && (
          <Box>
            {documents.length === 0 ? (
              <Alert severity="info">No documents uploaded yet</Alert>
            ) : (
              <Table>
                <TableBody>
                  {documents.map((doc, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FileText size={20} />
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {doc.docType?.replace(/_/g, ' ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {doc.fileName || 'Document'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.verified ? 'Verified' : 'Pending'}
                          color={doc.verified ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Document">
                            <IconButton size="small" color="primary">
                              <Eye size={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download">
                            <IconButton
                              size="small"
                              onClick={() => handleDownloadDocument(doc.docId, doc.fileName)}
                            >
                              <Download size={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}

        {/* Tab 3: Workflow History */}
        {activeTab === 2 && (
          <Box>
            {workflowHistory.length === 0 ? (
              <Alert severity="info">No workflow history available</Alert>
            ) : (
              <Stack spacing={2}>
                {workflowHistory.map((event, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="flex-start">
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            bgcolor:
                              event.action === 'APPROVED'
                                ? 'success.light'
                                : event.action === 'REJECTED'
                                  ? 'error.light'
                                  : 'info.light',
                          }}
                        >
                          {event.action === 'APPROVED' ? (
                            <CheckCircle size={20} />
                          ) : event.action === 'REJECTED' ? (
                            <XCircle size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2">
                            {event.action} - {event.status?.replace(/_/g, ' ')}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            By: {event.actor || 'System'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                          {event.reason && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                              <Typography variant="body2">{event.reason}</Typography>
                            </Alert>
                          )}
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        {canApprove() && (
          <>
            <Button
              onClick={() => {
                onReject(exportData);
                onClose();
              }}
              variant="outlined"
              color="error"
              startIcon={<XCircle size={18} />}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                onApprove(exportData);
                onClose();
              }}
              variant="contained"
              color="success"
              startIcon={<CheckCircle size={18} />}
            >
              Approve
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ExportDetailDialog;
