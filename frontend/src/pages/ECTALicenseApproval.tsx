import { useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton, Snackbar, Alert } from '@mui/material';
import { FileCheck, Eye, XCircle, Info } from 'lucide-react';
import { CommonPageProps, Export, ECTALicenseFormData } from '../types';
import { useExports } from '../hooks/useExportManager';
import ECTALicenseForm from '../components/forms/ECTALicenseForm';
import ExportDetailView from '../components/ExportDetailView';
import apiClient from '../services/api';

interface ECTALicenseApprovalProps extends CommonPageProps { }

const ECTALicenseApproval = ({ user, org }: ECTALicenseApprovalProps): JSX.Element => {
  const { exports: allExports, refreshExports } = useExports();
  // Show exports that are ready for ECTA license approval (ECX_VERIFIED) or already processed
  const exports = allExports.filter((e: Export) => 
    e.status === 'ECTA_LICENSE_PENDING' || 
    e.status === 'ECX_VERIFIED' || 
    e.status === 'ECTA_LICENSE_APPROVED' || 
    e.status === 'ECTA_LICENSE_REJECTED'
  );
  const [selectedExport, setSelectedExport] = useState<Export | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
  const [viewingExport, setViewingExport] = useState<Export | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleApprove = async (data: ECTALicenseFormData) => {
    if (!selectedExport) return;
    setLoading(true);
    try {
      const response = await apiClient.post(`/ecta/license/${selectedExport.exportId}/approve`, data);
      setIsModalOpen(false);
      setSelectedExport(null);
      showNotification(
        `License approved successfully for Export ${selectedExport.exportId}. Status: ${response.data.newStatus || 'ECTA_LICENSE_APPROVED'}`,
        'success'
      );
      refreshExports();
    } catch (error: any) {
      console.error('Approval error:', error);
      showNotification(
        `Failed to approve license: ${error.response?.data?.message || error.response?.data?.error?.message || error.message}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async ({ category, reason }: { category: string; reason: string }) => {
    if (!selectedExport) return;
    setLoading(true);
    try {
      const response = await apiClient.post(`/ecta/license/${selectedExport.exportId}/reject`, { category, reason });
      setIsModalOpen(false);
      setSelectedExport(null);
      showNotification(
        `License rejected for Export ${selectedExport.exportId}. Reason: ${category}`,
        'warning'
      );
      refreshExports();
    } catch (error: any) {
      console.error('Rejection error:', error);
      showNotification(
        `Failed to reject license: ${error.response?.data?.message || error.response?.data?.error?.message || error.message}`,
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (exp: Export) => {
    setViewingExport(exp);
    setIsDetailViewOpen(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FileCheck size={32} /> ECTA Export License Approval
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECTA_LICENSE_PENDING' || e.status === 'ECX_VERIFIED').length}</Typography><Typography variant="body2">Pending Approval</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECTA_LICENSE_APPROVED').length}</Typography><Typography variant="body2">Approved</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECTA_LICENSE_REJECTED').length}</Typography><Typography variant="body2">Rejected</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Export ID</TableCell>
              <TableCell>Exporter</TableCell>
              <TableCell>License Number</TableCell>
              <TableCell>Coffee Type</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exports.map((exp) => (
              <TableRow key={exp.exportId}>
                <TableCell>{exp.exportId}</TableCell>
                <TableCell>{exp.exporterName}</TableCell>
                <TableCell>{exp.exportLicenseNumber}</TableCell>
                <TableCell>{exp.coffeeType}</TableCell>
                <TableCell>{exp.destinationCountry}</TableCell>
                <TableCell><Chip label={exp.status.replace(/_/g, ' ')} color={exp.status === 'ECTA_LICENSE_APPROVED' ? 'success' : exp.status === 'ECTA_LICENSE_REJECTED' ? 'error' : 'warning'} size="small" /></TableCell>
                <TableCell>
                  {(exp.status === 'ECTA_LICENSE_PENDING' || exp.status === 'ECX_VERIFIED') && (
                    <>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<Info />} 
                        onClick={() => handleViewDetails(exp)}
                        sx={{ mr: 1 }}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained" 
                        startIcon={<Eye />} 
                        onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}
                      >
                        Review License
                      </Button>
                    </>
                  )}
                  {(exp.status === 'ECTA_LICENSE_APPROVED' || exp.status === 'ECTA_LICENSE_REJECTED') && (
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<Info />} 
                      onClick={() => handleViewDetails(exp)}
                    >
                      View Details
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>ECTA License Approval <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><XCircle /></IconButton></DialogTitle>
        <DialogContent>
          {selectedExport && <ECTALicenseForm exportData={selectedExport} onApprove={handleApprove} onReject={handleReject} loading={loading} user={user} org={org} />}
        </DialogContent>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ExportDetailView
        open={isDetailViewOpen}
        onClose={() => setIsDetailViewOpen(false)}
        exportData={viewingExport}
      />
    </Box>
  );
};

export default ECTALicenseApproval;
