import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  FileCheck,
  DollarSign,
  ShieldCheck,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Banknote,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { CommonPageProps } from '../types';
import bankingService from '../services/bankingService';
import { DashboardContainer, PulseChip } from './Dashboard.styles';
import { ModernStatCard, ModernSectionHeader, ModernEmptyState } from '../components/ModernUIKit';

interface BankingOperationsProps extends CommonPageProps { }

const BankingOperations = ({ user, org }: BankingOperationsProps): JSX.Element => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Auto-refreshing data hooks
  const { data: documents = [], isLoading: loadingDocs } = useQuery({
    queryKey: ['banking', 'documents'],
    queryFn: async () => {
      const data = await bankingService.getPendingDocuments();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const { data: financing = [], isLoading: loadingFin } = useQuery({
    queryKey: ['banking', 'financing'],
    queryFn: async () => {
      const data = await bankingService.getFinancingRequests();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const { data: compliance = [], isLoading: loadingComp } = useQuery({
    queryKey: ['banking', 'compliance'],
    queryFn: async () => {
      const data = await bankingService.getComplianceChecks();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });

  const loading = loadingDocs || loadingFin || loadingComp;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
      case 'PENDING': return 'warning';
      case 'VERIFIED':
      case 'APPROVED':
      case 'PASSED': return 'success';
      case 'REJECTED':
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
      case 'PENDING': return <Clock size={16} />;
      case 'VERIFIED':
      case 'APPROVED':
      case 'PASSED': return <CheckCircle size={16} />;
      case 'REJECTED':
      case 'FAILED': return <XCircle size={16} />;
      default: return <FileCheck size={16} />;
    }
  };

  // Helper for trend calculation (mock for now)
  const getTrend = (val) => ({ value: 5.2, direction: 'up' as const });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['banking', 'stats'],
    queryFn: async () => {
      const data = await bankingService.getBankingStatistics();
      return data?.data || {
        pendingDocuments: 0,
        pendingFxSubmission: 0,
        totalProcessed: 0,
        approvalRate: 0
      };
    },
    refetchInterval: 30000,
  });

  const statCards = [
    {
      title: 'Pending Documents',
      value: stats?.pendingDocuments || 0,
      icon: <FileCheck size={24} />,
      color: 'warning' as const,
      trend: { value: 0, direction: 'neutral' as const },
      subtitle: 'Requiring verification'
    },
    {
      title: 'Pending FX',
      value: stats?.pendingFxSubmission || 0,
      icon: <DollarSign size={24} />,
      color: 'info' as const,
      trend: { value: 0, direction: 'neutral' as const },
      subtitle: 'Awaiting submission'
    },
    {
      title: 'Total Processed',
      value: stats?.totalProcessed || 0,
      icon: <CheckCircle size={24} />,
      color: 'success' as const,
      trend: { value: 0, direction: 'neutral' as const },
      subtitle: 'Completed actions'
    },
    {
      title: 'Approval Rate',
      value: `${stats?.approvalRate || 0}%`,
      icon: <Activity size={24} />,
      color: 'primary' as const,
      trend: { value: 0, direction: 'neutral' as const },
      subtitle: 'FX Approval Rate'
    },
  ];

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const renderTable = (data, type) => (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 3,
        overflow: 'hidden'
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Exporter</TableCell>
            {type === 'finance' && <TableCell>Amount</TableCell>}
            <TableCell>{type === 'compliance' ? 'Check Type' : 'Type'}</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{item.id}</TableCell>
              <TableCell>{item.exporter}</TableCell>
              {type === 'finance' && (
                <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                  {item.currency} {item.amount?.toLocaleString()}
                </TableCell>
              )}
              <TableCell>{item.documentType || item.type || item.checkType}</TableCell>
              <TableCell>
                <Chip
                  icon={getStatusIcon(item.status)}
                  label={item.status.replace(/_/g, ' ')}
                  color={getStatusColor(item.status)}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                {item.submittedDate || item.date}
              </TableCell>
              <TableCell align="right">
                <IconButton size="small" onClick={() => handleViewDetails(item)} color="primary">
                  <Eye size={18} />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                <ModernEmptyState
                  title="No items found"
                  description={`No ${type} records available relative to your filters.`}
                  icon={<Activity />}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <DashboardContainer>
      <ModernSectionHeader
        title="Banking Operations"
        subtitle="Manage trade finance, document verification, and compliance."
        action={
          <Stack direction="row" spacing={2}>
            <PulseChip label="LIVE FEED" size="small" color="secondary" />
            <Button variant="contained" startIcon={<Download size={18} />}>
              Export Report
            </Button>
          </Stack>
        }
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((stat, index) => (
          <Grid xs={12} sm={6} md={3} key={index}>
            <ModernStatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: 4, overflow: 'hidden', boxShadow: theme.shadows[3] }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ px: 2, pt: 1 }}
            indicatorColor="primary"
            textColor="primary"
          >
            <Tab icon={<FileCheck size={18} />} iconPosition="start" label="Document Verification" sx={{ minHeight: 64 }} />
            <Tab icon={<Banknote size={18} />} iconPosition="start" label="Export Financing" sx={{ minHeight: 64 }} />
            <Tab icon={<ShieldCheck size={18} />} iconPosition="start" label="Compliance Review" sx={{ minHeight: 64 }} />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? <LinearProgress sx={{ borderRadius: 1 }} /> : (
            <>
              {activeTab === 0 && renderTable(documents, 'documents')}
              {activeTab === 1 && renderTable(financing, 'finance')}
              {activeTab === 2 && renderTable(compliance, 'compliance')}
            </>
          )}
        </Box>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, boxShadow: theme.shadows[10] }
        }}
      >
        <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Eye size={20} color={theme.palette.primary.main} />
            <Typography variant="h6" fontWeight={700}>
              {selectedItem?.documentType || selectedItem?.type || selectedItem?.checkType} Details
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* Dialog Content here (can keep existing structure but style it better if needed) */}
          <Grid container spacing={2}>
            {/* ... Display item details ... */}
            <Grid xs={12}>
              <Typography variant="body2" color="text.secondary">
                Transaction ID: {selectedItem?.id}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
          <Button variant="contained" endIcon={<ArrowRight size={16} />} sx={{ borderRadius: 2 }}>
            Proceed to Action
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContainer>
  );
};

export default BankingOperations;
