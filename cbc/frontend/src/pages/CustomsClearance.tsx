import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Search, FileCheck, FileText, MapPin, Eye, AlertTriangle } from 'lucide-react';
import apiClient from '../services/api';
import { useExports } from '../hooks/useExportManager';
import CustomsClearanceForm from '../components/forms/CustomsClearanceForm';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
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
  IconButton,
  useTheme,
  LinearProgress,
} from '@mui/material';
import { DashboardContainer, PulseChip } from './Dashboard.styles';
import { ModernStatCard, ModernSectionHeader, ModernEmptyState } from '../components/ModernUIKit';

interface CustomsClearanceProps {
  user: any;
  org: string | null;
}

const CustomsClearance = ({ user, org }: CustomsClearanceProps): JSX.Element => {
  const theme = useTheme();
  const { exports: allExports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  // Filter for customs relevant statuses
  const exports = allExports.filter((e) =>
    ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'SHIPPED', 'CUSTOMS_PENDING', 'CUSTOMS_CLEARED', 'CUSTOMS_REJECTED'].includes(e.status)
  );

  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const location = window.location;

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/pending')) setStatusFilter('pending');
    else if (path.includes('/inspection')) setStatusFilter('pending');
    else if (path.includes('/cleared')) setStatusFilter('cleared');
    else if (path.includes('/rejected')) setStatusFilter('rejected');
    else setStatusFilter('all');
  }, [location.pathname]);

  useEffect(() => {
    filterExports();
  }, [allExports, searchTerm, statusFilter]);

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter((exp) =>
        ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'CUSTOMS_PENDING'].includes(exp.status)
      );
    } else if (statusFilter === 'cleared') {
      filtered = filtered.filter((exp) => exp.status === 'CUSTOMS_CLEARED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter((exp) => exp.status === 'CUSTOMS_REJECTED');
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (exp) =>
          exp.exportId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.exporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          exp.destinationCountry?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleApprove = async (data) => {
    setLoading(true);
    try {
      await apiClient.post(`/customs/clear`, {
        exportId: selectedExport.exportId,
        clearanceId: data.declarationNumber,
        clearedBy: data.clearedBy || user?.username
      });
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
      await apiClient.post(`/customs/reject`, {
        exportId: selectedExport.exportId,
        reason: reason,
        rejectedBy: user?.username
      });
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

  const getStatusColor = (status) => {
    const statusMap = {
      CUSTOMS_CLEARED: 'success',
      CUSTOMS_REJECTED: 'error',
      SHIPMENT_SCHEDULED: 'info',
      SHIPPED: 'primary',
      QUALITY_CERTIFIED: 'warning',
      CUSTOMS_PENDING: 'warning',
    };
    return statusMap[status] || 'default';
  };

  const stats = {
    pending: exports.filter(e => ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'CUSTOMS_PENDING'].includes(e.status)).length,
    cleared: exports.filter(e => e.status === 'CUSTOMS_CLEARED').length,
    rejected: exports.filter(e => e.status === 'CUSTOMS_REJECTED').length,
    total: exports.length
  };

  const statCards = [
    { title: 'Pending Clearance', value: stats.pending, icon: <ShieldCheck size={24} />, color: 'warning' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Awaiting review' },
    { title: 'Cleared Exports', value: stats.cleared, icon: <CheckCircle size={24} />, color: 'success' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Approved to ship' },
    { title: 'Rejected', value: stats.rejected, icon: <XCircle size={24} />, color: 'error' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'Requires attention' },
    { title: 'Total Volume', value: stats.total, icon: <FileCheck size={24} />, color: 'info' as const, trend: { value: 0, direction: 'neutral' as const }, subtitle: 'All records' },
  ];

  return (
    <DashboardContainer className={`organization-${user.organizationId || 'custom-authorities'}`}>
      <ModernSectionHeader
        title="Customs Clearance"
        subtitle="Review export records, verify documentation, and issue customs clearance."
        action={
          <Stack direction="row" spacing={1} alignItems="center">
            <PulseChip label="GATEWAY ACTIVE" size="small" color="primary" />
            <Button variant="outlined" startIcon={<FileCheck />}>Batch Review</Button>
          </Stack>
        }
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ModernStatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: theme.shadows[3] }}>
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={700}>Clearance Queue</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search exports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Select
                fullWidth
                size="small"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="cleared">Cleared</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </Grid>
          </Grid>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {exportsLoading ? <LinearProgress /> : (
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Export ID</TableCell>
                    <TableCell>Exporter</TableCell>
                    <TableCell>Destination</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExports.map((exp) => (
                    <TableRow key={exp.exportId || exp.id} hover>
                      <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {exp.exportId || exp.id}
                      </TableCell>
                      <TableCell>{exp.exporterName || 'Unknown Exporter'}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <MapPin size={14} color={theme.palette.text.secondary} />
                          <Typography variant="body2">{exp.destinationCountry}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{(exp.quantity || 0).toLocaleString()} kg</TableCell>
                      <TableCell>
                        <Chip
                          label={exp.status?.replace(/_/g, ' ')}
                          color={getStatusColor(exp.status)}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell>
                        {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'CUSTOMS_PENDING'].includes(exp.status) ? (
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Eye size={16} />}
                            onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}
                            sx={{ borderRadius: 2 }}
                          >
                            Review
                          </Button>
                        ) : (
                          <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                            History
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredExports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <ModernEmptyState
                          title="No Exports Found"
                          description="Current filters returned no results."
                          icon={<Search />}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <ShieldCheck color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={700}>Clearance Protocol</Typography>
          </Stack>
          <IconButton onClick={() => !loading && setIsModalOpen(false)}>
            <XCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedExport && (
            <CustomsClearanceForm
              exportData={selectedExport}
              onApprove={handleApprove}
              onReject={handleReject}
              loading={loading}
            />
          )}
        </DialogContent>
      </Dialog>
    </DashboardContainer>
  );
};

export default CustomsClearance;
