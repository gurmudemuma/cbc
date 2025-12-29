import { useState, useEffect } from 'react';
import { Box, Grid, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { Package, Eye, XCircle } from 'lucide-react';
import { CommonPageProps } from '../types';
<<<<<<< HEAD
import { useExports } from '../hooks/useExportManager';
import ECXApprovalForm from '../components/forms/ECXApprovalForm';
import apiClient from '../services/api';

interface ECXVerificationProps extends CommonPageProps { }
=======
import { useExports } from '../hooks/useExports';
import ECXApprovalForm from '../components/forms/ECXApprovalForm';
import apiClient from '../services/api';

interface ECXVerificationProps extends CommonPageProps {}
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const ECXVerification = ({ user, org }: ECXVerificationProps): JSX.Element => {
  const { exports: allExports, loading: exportsLoading, refreshExports } = useExports();
  const exports = allExports.filter((e) => e.status === 'ECX_PENDING' || e.status === 'ECX_VERIFIED' || e.status === 'ECX_REJECTED');
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      // Use /verify endpoint for lot verification with details
      await apiClient.post(`/ecx/exports/${selectedExport.exportId}/verify`, data);
      setIsModalOpen(false);
      setSelectedExport(null);
      refreshExports();
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async ({ category, reason }) => {
    setLoading(true);
    try {
      await apiClient.post(`/ecx/exports/${selectedExport.exportId}/reject`, { category, reason });
      setIsModalOpen(false);
      setSelectedExport(null);
      refreshExports();
    } catch (error) {
      console.error('Rejection error:', error);
      alert('Failed to reject: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Package size={32} /> ECX Lot Verification
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECX_PENDING').length}</Typography><Typography variant="body2">Pending Verification</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECX_VERIFIED').length}</Typography><Typography variant="body2">Verified</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECX_REJECTED').length}</Typography><Typography variant="body2">Rejected</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Export ID</TableCell>
              <TableCell>Exporter</TableCell>
              <TableCell>Coffee Type</TableCell>
              <TableCell>Quantity (kg)</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {exports.map((exp) => (
              <TableRow key={exp.exportId}>
                <TableCell>{exp.exportId}</TableCell>
                <TableCell>{exp.exporterName}</TableCell>
                <TableCell>{exp.coffeeType}</TableCell>
                <TableCell>{exp.quantity?.toLocaleString()}</TableCell>
                <TableCell><Chip label={exp.status} color={exp.status === 'ECX_VERIFIED' ? 'success' : exp.status === 'ECX_REJECTED' ? 'error' : 'warning'} size="small" /></TableCell>
                <TableCell>
                  {exp.status === 'ECX_PENDING' && (
                    <Button size="small" variant="contained" startIcon={<Eye />} onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}>Verify</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>ECX Lot Verification <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><XCircle /></IconButton></DialogTitle>
        <DialogContent>
          {selectedExport && <ECXApprovalForm exportData={selectedExport} onApprove={handleApprove} onReject={handleReject} loading={loading} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ECXVerification;
