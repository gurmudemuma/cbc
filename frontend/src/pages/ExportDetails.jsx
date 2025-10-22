import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, Calendar, MapPin, DollarSign, Award, Ship, 
  CheckCircle, XCircle, Clock, ArrowLeft, History, FileText 
} from 'lucide-react';
import apiClient from '../services/api';
import {
  Box, Button, Card, CardContent, Chip, Divider, Grid, List, ListItem, ListItemIcon, ListItemText, Paper, Stack, Tab, Tabs, Typography
} from '@mui/material';

const ExportDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exportData, setExportData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchExportDetails = async () => {
      try {
        const [detailsRes, historyRes] = await Promise.all([
          apiClient.get(`/exports/${id}`),
          apiClient.get(`/exports/${id}/history`)
        ]);
        
        setExportData(detailsRes.data.data);
        setHistory(historyRes.data.data || []);
      } catch (error) {
        console.error('Error fetching export details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExportDetails();
  }, [id]);

  const handleCompleteExport = async () => {
    try {
      await apiClient.put(`/exports/${id}/complete`);
      const response = await apiClient.get(`/exports/${id}`);
      setExportData(response.data.data);
    } catch (error) {
      console.error('Error completing export:', error);
      alert('Failed to complete export');
    }
  };

  const handleCancelExport = async () => {
    if (window.confirm('Are you sure you want to cancel this export?')) {
      try {
        await apiClient.put(`/exports/${id}/cancel`);
        const response = await apiClient.get(`/exports/${id}`);
        setExportData(response.data.data);
      } catch (error) {
        console.error('Error cancelling export:', error);
        alert('Failed to cancel export');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'warning',
      FX_PENDING: 'warning',
      FX_APPROVED: 'info',
      FX_REJECTED: 'error',
      BANKING_PENDING: 'warning',
      BANKING_APPROVED: 'info',
      BANKING_REJECTED: 'error',
      QUALITY_PENDING: 'warning',
      QUALITY_CERTIFIED: 'success',
      QUALITY_REJECTED: 'error',
      EXPORT_CUSTOMS_PENDING: 'warning',
      EXPORT_CUSTOMS_CLEARED: 'info',
      SHIPMENT_SCHEDULED: 'primary',
      SHIPPED: 'info',
      COMPLETED: 'success',
      CANCELLED: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status) => {
    if (status.includes('REJECTED') || status === 'CANCELLED') {
      return <XCircle />;
    }
    if (status === 'COMPLETED') {
      return <CheckCircle />;
    }
    return <Clock />;
  };

  if (loading) {
    return <Box sx={{ p: 3, textAlign: 'center' }}><Typography>Loading...</Typography></Box>;
  }

  if (!exportData) {
    return (
      <Box sx={{ p: 3 }}>
        <Card>
          <CardContent>
            <Typography>Export not found</Typography>
            <Button onClick={() => navigate('/exports')}>Back to Exports</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Button startIcon={<ArrowLeft />} onClick={() => navigate('/exports')}>
                Back
              </Button>
              <Typography variant="h4">Export Details</Typography>
              <Typography variant="subtitle1" color="text.secondary">{exportData.exportId}</Typography>
            </Stack>
          </Grid>

          <Paper sx={{ p: 2, mb: 3, bgcolor: `${getStatusColor(exportData.status)}.light`, border: 1, borderColor: `${getStatusColor(exportData.status)}.main` }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              {getStatusIcon(exportData.status)}
              <Box>
                <Typography variant="subtitle1" color={`${getStatusColor(exportData.status)}.main`}>Status: {exportData.status.replace(/_/g, ' ')}</Typography>
                <Typography variant="body2" color="text.secondary">Last updated: {new Date(exportData.updatedAt).toLocaleString()}</Typography>
              </Box>
            </Stack>
          </Paper>

          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Details" icon={<FileText />} iconPosition="start" />
            <Tab label="History" icon={<History />} iconPosition="start" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Basic Information</Typography>
                    <List>
                      <ListItem>
                        <ListItemText primary="Exporter Name" secondary={exportData.exporterName} />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText primary="Coffee Type" secondary={exportData.coffeeType} />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemText primary="Quantity" secondary={`${exportData.quantity.toLocaleString()} kg`} />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon><MapPin /></ListItemIcon>
                        <ListItemText primary="Destination Country" secondary={exportData.destinationCountry} />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon><DollarSign /></ListItemIcon>
                        <ListItemText primary="Estimated Value" secondary={`${exportData.estimatedValue.toLocaleString()}`} />
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon><Calendar /></ListItemIcon>
                        <ListItemText primary="Created At" secondary={new Date(exportData.createdAt).toLocaleString()} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {exportData.fxApprovalId && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>FX Approval</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Approval ID" secondary={exportData.fxApprovalId} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Approved By" secondary={exportData.fxApprovedBy} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Approved At" secondary={new Date(exportData.fxApprovedAt).toLocaleString()} />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {exportData.bankingApprovedBy && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Banking Approval</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Approved By" secondary={exportData.bankingApprovedBy} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Approved At" secondary={exportData.bankingApprovedAt ? new Date(exportData.bankingApprovedAt).toLocaleString() : '-'} />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {exportData.bankingRejectionReason && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Banking Rejection</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Rejection Reason" secondary={exportData.bankingRejectionReason} />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {exportData.fxRejectionReason && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>FX Rejection</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Rejection Reason" secondary={exportData.fxRejectionReason} />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {exportData.qualityCertId && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Quality Certification</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Certificate ID" secondary={exportData.qualityCertId} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Quality Grade" secondary={exportData.qualityGrade} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Certified By" secondary={exportData.qualityCertifiedBy} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Certified At" secondary={new Date(exportData.qualityCertifiedAt).toLocaleString()} />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {exportData.qualityRejectionReason && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Quality Rejection</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Rejection Reason" secondary={exportData.qualityRejectionReason} />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}

{(exportData.transportIdentifier || exportData.departureDate || exportData.arrivalDate) && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2 }}>Shipment Information</Typography>
                      <List>
                        <ListItem>
                          <ListItemText primary="Shipment ID" secondary={exportData.shipmentId} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Transport Identifier" secondary={exportData.transportIdentifier || '-'} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Transport Mode" secondary={exportData.transportMode || '-'} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Departure Date" secondary={new Date(exportData.departureDate).toLocaleDateString()} />
                        </ListItem>
                        <Divider />
                        <ListItem>
                          <ListItemText primary="Arrival Date" secondary={new Date(exportData.arrivalDate).toLocaleDateString()} />
                        </ListItem>
                        {exportData.shippedAt && (
                          <>
                            <Divider />
                            <ListItem>
                              <ListItemText primary="Shipped At" secondary={new Date(exportData.shippedAt).toLocaleString()} />
                            </ListItem>
                          </>
                        )}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Transaction History</Typography>
                <Stack spacing={2}>
                  {history.map((record, index) => (
                    <Paper key={index} sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between">
                        <Chip label={record.record?.status || 'Unknown'} color="primary" />
                        <Typography variant="body2">{new Date(record.timestamp).toLocaleString()}</Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1 }}>Transaction ID: {record.txId}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Actions</Typography>
              <Stack spacing={2}>
                {user.role === 'exporter' && exportData.status === 'SHIPPED' && (
                  <Button variant="contained" onClick={handleCompleteExport}>
                    Complete Export
                  </Button>
                )}
                {user.role === 'exporter' && 
                 !['COMPLETED', 'CANCELLED', 'SHIPPED'].includes(exportData.status) && (
                  <Button variant="outlined" color="error" onClick={handleCancelExport}>
                    Cancel Export
                  </Button>
                )}
                <Button variant="outlined">Print Details</Button>
                <Button variant="outlined">Download PDF</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExportDetails;