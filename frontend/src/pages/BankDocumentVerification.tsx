import { useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { DollarSign, Eye, XCircle } from 'lucide-react';
import { CommonPageProps } from '../types';
import { useExports } from '../hooks/useExportManager';
import BankDocumentVerificationForm from '../components/forms/BankDocumentVerificationForm';
import apiClient from '../services/api';

interface BankDocumentVerificationProps extends CommonPageProps { }

const BankDocumentVerification = ({ user, org }: BankDocumentVerificationProps): JSX.Element => {
  const { exports: allExports, refreshExports } = useExports();
  const exports = allExports.filter((e) => e.status === 'BANK_DOCUMENT_PENDING' || e.status === 'BANK_DOCUMENT_VERIFIED' || e.status === 'BANK_DOCUMENT_REJECTED');
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      await apiClient.post(`/bank/exports/${selectedExport.exportId}/approve-documents`, data);
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
      await apiClient.post(`/bank/exports/${selectedExport.exportId}/reject`, { category, reason });
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
        <DollarSign size={32} /> Commercial Bank Document Verification
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'BANK_DOCUMENT_PENDING').length}</Typography><Typography variant="body2">Pending Verification</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'BANK_DOCUMENT_VERIFIED').length}</Typography><Typography variant="body2">Verified</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'BANK_DOCUMENT_REJECTED').length}</Typography><Typography variant="body2">Rejected</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Export ID</TableCell>
              <TableCell>Exporter</TableCell>
              <TableCell>Value (USD)</TableCell>
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
                <TableCell>${exp.estimatedValue?.toLocaleString()}</TableCell>
                <TableCell>{exp.destinationCountry}</TableCell>
                <TableCell><Chip label={exp.status.replace(/_/g, ' ')} color={exp.status === 'BANK_DOCUMENT_VERIFIED' ? 'success' : exp.status === 'BANK_DOCUMENT_REJECTED' ? 'error' : 'warning'} size="small" /></TableCell>
                <TableCell>
                  {exp.status === 'BANK_DOCUMENT_PENDING' && (
                    <Button size="small" variant="contained" startIcon={<Eye />} onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}>Verify Documents</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bank Document Verification <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><XCircle /></IconButton></DialogTitle>
        <DialogContent>
          {selectedExport && <BankDocumentVerificationForm exportData={selectedExport} onApprove={handleApprove} onReject={handleReject} loading={loading} />}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BankDocumentVerification;
