import { useState, useEffect } from 'react';
<<<<<<< HEAD
import { ShieldCheck, CheckCircle, XCircle, Search, FileCheck, FileText, MapPin, Eye, AlertTriangle } from 'lucide-react';
import apiClient from '../services/api';
import { useExports } from '../hooks/useExportManager';
=======
import { ShieldCheck, CheckCircle, XCircle, Search, FileCheck, FileText, MapPin, Eye } from 'lucide-react';
import apiClient from '../services/api';
import { useExports } from '../hooks/useExports';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
  IconButton,
  useTheme,
  LinearProgress,
} from '@mui/material';
import { DashboardContainer, PulseChip } from './Dashboard.styles';
import { ModernStatCard, ModernSectionHeader, ModernEmptyState } from '../components/ModernUIKit';
=======
  Divider,
  IconButton,
} from '@mui/material';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

interface CustomsClearanceProps {
  user: any;
  org: string | null;
}

const CustomsClearance = ({ user, org }: CustomsClearanceProps): JSX.Element => {
<<<<<<< HEAD
  const theme = useTheme();
  const { exports: allExports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  // Filter for customs relevant statuses
  const exports = allExports.filter((e) =>
    ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'SHIPPED', 'CUSTOMS_PENDING', 'CUSTOMS_CLEARED', 'CUSTOMS_REJECTED'].includes(e.status)
  );

=======
  const { exports: allExports, loading: exportsLoading, error: exportsError, refreshExports } = useExports();
  const exports = allExports.filter((e) => e.status === 'CUSTOMS_PENDING' || e.status === 'CUSTOMS_CLEARED' || e.status === 'CUSTOMS_REJECTED');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

<<<<<<< HEAD
  useEffect(() => {
    filterExports();
  }, [allExports, searchTerm, statusFilter]);
=======
  // API base URL is set in App.jsx based on user's organization

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

  const filterExports = () => {
    let filtered = [...exports];

    if (statusFilter === 'pending') {
      filtered = filtered.filter((exp) =>
<<<<<<< HEAD
        ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'CUSTOMS_PENDING'].includes(exp.status)
=======
        ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED'].includes(exp.status)
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
      CUSTOMS_PENDING: 'warning',
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    };
    return statusMap[status] || 'default';
  };

<<<<<<< HEAD
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
=======
  return (
    <Box className={`organization-${user.organizationId || 'custom-authorities'}`} sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={9}>
          <Typography variant="h4">Customs Clearance</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3 }}>
            Review export records and issue customs clearance
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {
                      exports.filter((e) =>
                        ['QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED', 'SHIPPED'].includes(e.status)
                      ).length
                    }
                  </Typography>
                  <Typography variant="body2">Pending Clearance</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'CUSTOMS_CLEARED').length}
                  </Typography>
                  <Typography variant="body2">Cleared</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6">
                    {exports.filter((e) => e.status === 'CUSTOMS_REJECTED').length}
                  </Typography>
                  <Typography variant="body2">Rejected</Typography>
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
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="cleared">Cleared</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Customs Queue
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 520, borderRadius: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead sx={{ '& th': { fontWeight: 700 } }}>
                    <TableRow>
                      <TableCell>Export ID</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Destination</TableCell>
                      <TableCell>Quantity (kg)</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredExports.map((exp) => (
                      <TableRow key={exp.exportId} hover>
                        <TableCell>{exp.exportId}</TableCell>
                        <TableCell>{exp.exporterName}</TableCell>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <MapPin size={14} />
                            {exp.destinationCountry}
                          </Stack>
                        </TableCell>
                        <TableCell>{exp.quantity?.toLocaleString?.() || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={exp.status?.replace(/_/g, ' ')}
                            color={getStatusColor(exp.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell align="right">
                          {exp.status === 'CUSTOMS_PENDING' ? (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Eye />}
                              onClick={() => { setSelectedExport(exp); setIsModalOpen(true); }}
                            >
                              Review Clearance
                            </Button>
                          ) : (
                            <Button variant="outlined" size="small">
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {filteredExports.length === 0 && (
                <Box sx={{ textAlign: 'center', p: 3 }}>
                  <FileText size={48} color="#9E9E9E" />
                  <Typography color="text.secondary">No exports awaiting customs</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Actions
              </Typography>
              <Stack spacing={2}>
                <Button variant="contained">Issue Clearance</Button>
                <Button variant="outlined">Generate Report</Button>
                <Button variant="outlined">View Cleared</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={isModalOpen} onClose={() => !loading && setIsModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Customs Clearance
          <IconButton onClick={() => !loading && setIsModalOpen(false)} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <XCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    </DashboardContainer>
=======
    </Box>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  );
};

export default CustomsClearance;
