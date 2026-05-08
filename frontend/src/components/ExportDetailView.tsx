import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Divider,
  Box,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
} from '@mui/material';
import { X, Package, User, MapPin, Calendar, DollarSign, FileText, History } from 'lucide-react';
import { useState, useEffect } from 'react';
import apiClient from '../services/api';

interface ExportDetailViewProps {
  open: boolean;
  onClose: () => void;
  exportData: any;
}

const ExportDetailView = ({ open, onClose, exportData }: ExportDetailViewProps): JSX.Element => {
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && exportData?.exportId) {
      fetchStatusHistory();
    }
  }, [open, exportData]);

  const fetchStatusHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/ecta/exports/${exportData.exportId}/history`);
      if (response.data.success) {
        setStatusHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch status history:', error);
      setStatusHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status?.includes('APPROVED')) return 'success';
    if (status?.includes('REJECTED')) return 'error';
    if (status?.includes('PENDING')) return 'warning';
    return 'default';
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (value: number) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (!exportData) return <></>;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileText size={24} />
          <Typography variant="h6">Export Details</Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <X size={20} />
        </IconButton>
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ p: 3 }}>
        {/* Status Badge */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Chip
            label={exportData.status?.replace(/_/g, ' ')}
            color={getStatusColor(exportData.status)}
            size="medium"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="caption" color="text.secondary">
            Export ID: {exportData.exportId}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Exporter Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <User size={20} color="#1976d2" />
                  <Typography variant="h6">Exporter Information</Typography>
                </Box>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Name</TableCell>
                      <TableCell>{exportData.exporterName || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>License Number</TableCell>
                      <TableCell>{exportData.exportLicenseNumber || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>License Expiry</TableCell>
                      <TableCell>{exportData.licenseExpiryDate ? formatDate(exportData.licenseExpiryDate) : 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>TIN Number</TableCell>
                      <TableCell>{exportData.exporterTIN || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Coffee Details */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Package size={20} color="#1976d2" />
                  <Typography variant="h6">Coffee Details</Typography>
                </Box>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Coffee Type</TableCell>
                      <TableCell>{exportData.coffeeType || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Origin Region</TableCell>
                      <TableCell>{exportData.originRegion || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                      <TableCell>{exportData.quantity ? `${exportData.quantity.toLocaleString()} kg` : 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>ECX Lot Number</TableCell>
                      <TableCell>{exportData.ecxLotNumber || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Destination & Value */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <MapPin size={20} color="#1976d2" />
                  <Typography variant="h6">Destination</Typography>
                </Box>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Country</TableCell>
                      <TableCell>{exportData.destinationCountry || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Buyer Name</TableCell>
                      <TableCell>{exportData.buyerName || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Buyer Email</TableCell>
                      <TableCell>{exportData.buyerEmail || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Buyer Country</TableCell>
                      <TableCell>{exportData.buyerCountry || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Financial Information */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <DollarSign size={20} color="#1976d2" />
                  <Typography variant="h6">Financial Information</Typography>
                </Box>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', width: '40%' }}>Estimated Value</TableCell>
                      <TableCell>{formatCurrency(exportData.estimatedValue)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Unit Price</TableCell>
                      <TableCell>
                        {exportData.estimatedValue && exportData.quantity
                          ? formatCurrency(exportData.estimatedValue / exportData.quantity) + '/kg'
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Payment Terms</TableCell>
                      <TableCell>{exportData.paymentTerms || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Contract Number</TableCell>
                      <TableCell>{exportData.contractNumber || 'N/A'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Quality Information (if available) */}
          {(exportData.qualityGrade || exportData.moistureContent || exportData.cupScore) && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Package size={20} color="#1976d2" />
                    <Typography variant="h6">Quality Information</Typography>
                  </Box>
                  <Grid container spacing={2}>
                    {exportData.qualityGrade && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Quality Grade</Typography>
                        <Typography variant="body1" fontWeight="bold">{exportData.qualityGrade}</Typography>
                      </Grid>
                    )}
                    {exportData.moistureContent && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Moisture Content</Typography>
                        <Typography variant="body1" fontWeight="bold">{exportData.moistureContent}%</Typography>
                      </Grid>
                    )}
                    {exportData.defectCount !== undefined && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Defect Count</Typography>
                        <Typography variant="body1" fontWeight="bold">{exportData.defectCount}</Typography>
                      </Grid>
                    )}
                    {exportData.cupScore && (
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="caption" color="text.secondary">Cup Score</Typography>
                        <Typography variant="body1" fontWeight="bold">{exportData.cupScore}/100</Typography>
                      </Grid>
                    )}
                  </Grid>
                  {exportData.inspectionNotes && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">Inspection Notes</Typography>
                      <Typography variant="body2">{exportData.inspectionNotes}</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Dates */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Calendar size={20} color="#1976d2" />
                  <Typography variant="h6">Important Dates</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Created</Typography>
                    <Typography variant="body2">{formatDate(exportData.createdAt)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                    <Typography variant="body2">{formatDate(exportData.updatedAt)}</Typography>
                  </Grid>
                  {exportData.licenseApprovedAt && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">License Approved</Typography>
                      <Typography variant="body2">{formatDate(exportData.licenseApprovedAt)}</Typography>
                    </Grid>
                  )}
                  {exportData.qualityApprovedAt && (
                    <Grid item xs={12} sm={6} md={3}>
                      <Typography variant="caption" color="text.secondary">Quality Approved</Typography>
                      <Typography variant="body2">{formatDate(exportData.qualityApprovedAt)}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Status History */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <History size={20} color="#1976d2" />
                  <Typography variant="h6">Status History</Typography>
                </Box>
                {loading ? (
                  <Typography variant="body2" color="text.secondary">Loading history...</Typography>
                ) : statusHistory.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {statusHistory.map((history, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 1.5,
                          mb: 1,
                          bgcolor: '#f5f5f5',
                          borderRadius: 1,
                          borderLeft: '4px solid',
                          borderLeftColor: getStatusColor(history.newStatus) + '.main',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Chip
                            label={history.newStatus?.replace(/_/g, ' ')}
                            color={getStatusColor(history.newStatus)}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(history.createdAt)}
                          </Typography>
                        </Box>
                        {history.notes && (
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {history.notes}
                          </Typography>
                        )}
                        {history.changedBy && (
                          <Typography variant="caption" color="text.secondary">
                            By: {history.changedBy}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">No status history available</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDetailView;
