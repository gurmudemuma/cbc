import { useState } from 'react';
import { Box, Grid, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import { FileCheck, Eye, XCircle } from 'lucide-react';
import { CommonPageProps } from '../types';
<<<<<<< HEAD
import { useExports } from '../hooks/useExportManager';
import ECTAContractForm from '../components/forms/ECTAContractForm';
import apiClient from '../services/api';

interface ECTAContractApprovalProps extends CommonPageProps { }
=======
import { useExports } from '../hooks/useExports';
import ECTAContractForm from '../components/forms/ECTAContractForm';
import apiClient from '../services/api';

interface ECTAContractApprovalProps extends CommonPageProps {}
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const ECTAContractApproval = ({ user, org }: ECTAContractApprovalProps): JSX.Element => {
  const { exports: allExports, refreshExports } = useExports();
  const exports = allExports.filter((e) => e.status === 'ECTA_CONTRACT_PENDING' || e.status === 'ECTA_CONTRACT_APPROVED' || e.status === 'ECTA_CONTRACT_REJECTED');
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      await apiClient.post(`/ecta/contract/${selectedExport.exportId}/approve`, data);
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
      await apiClient.post(`/ecta/contract/${selectedExport.exportId}/reject`, { category, reason });
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
        <FileCheck size={32} /> ECTA Contract Approval & Origin Certificate
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECTA_CONTRACT_PENDING').length}</Typography><Typography variant="body2">Pending Approval</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECTA_CONTRACT_APPROVED').length}</Typography><Typography variant="body2">Approved</Typography></CardContent></Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card><CardContent><Typography variant="h6">{exports.filter(e => e.status === 'ECTA_CONTRACT_REJECTED').length}</Typography><Typography variant="body2">Rejected</Typography></CardContent></Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Export ID</TableCell>
              <TableCell>Exporter</TableCell>
              <TableCell>Coffee Type</TableCell>
              <TableCell>Destination</TableCell>
              <TableCell>Value (USD)</TableCell>
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
                <TableCell>{exp.destinationCountry}</TableCell>
                <TableCell>${exp.estimatedValue?.toLocaleString()}</TableCell>
                <TableCell><Chip label={exp.status.replace(/_/g, ' ')} color={exp.status === 'ECTA_CONTRACT_APPROVED' ? 'success' : exp.status === 'ECTA_CONTRACT_REJECTED' ? 'error' : 'warning'} size="small" /></TableCell>
                <TableCell>
                  {exp.status === 'ECTA_CONTRACT_PENDING' && (
                    <Button size="small" variant="contained" startIcon={<Eye />} onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}>Review Contract</Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>ECTA Contract Approval <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}><XCircle /></IconButton></DialogTitle>
        <DialogContent>
<<<<<<< HEAD
          {selectedExport && <ECTAContractForm exportData={selectedExport} onApprove={handleApprove} onReject={handleReject} loading={loading} user={user} org={org} />}
=======
          {selectedExport && <ECTAContractForm exportData={selectedExport} onApprove={handleApprove} onReject={handleReject} loading={loading} />}
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ECTAContractApproval;
