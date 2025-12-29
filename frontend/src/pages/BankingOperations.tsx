<<<<<<< HEAD
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
=======
import React, { useState, useEffect } from 'react';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
import {
  Box,
  Card,
  CardContent,
  Typography,
<<<<<<< HEAD
=======
  Grid,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
  LinearProgress,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
=======
  Alert,
  LinearProgress,
} from '@mui/material';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
import {
  FileCheck,
  DollarSign,
  ShieldCheck,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
<<<<<<< HEAD
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
=======
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CommonPageProps } from '../types';
import bankingService from '../services/bankingService';

interface BankingOperationsProps extends CommonPageProps {}

const BankingOperations = ({ user, org }: BankingOperationsProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState(0);
  const [documents, setDocuments] = useState([]);
  const [financing, setFinancing] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBankingData = async () => {
      setLoading(true);
      try {
        const [documentsData, financingData, complianceData] = await Promise.all([
          bankingService.getPendingDocuments(),
          bankingService.getFinancingRequests(),
          bankingService.getComplianceChecks(),
        ]);
        
        setDocuments(documentsData);
        setFinancing(financingData);
        setCompliance(complianceData);
      } catch (error) {
        console.error('Error loading banking data:', error);
        // Fallback to empty arrays on error
        setDocuments([]);
        setFinancing([]);
        setCompliance([]);
      } finally {
        setLoading(false);
      }
    };

    loadBankingData();
  }, [user]);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

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

<<<<<<< HEAD
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

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

<<<<<<< HEAD
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
=======
  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Banking Operations
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <FileCheck size={40} color="#1976d2" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="primary" gutterBottom>
                  {documents.filter(d => d.status === 'PENDING_VERIFICATION').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Verification
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DollarSign size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {financing.filter(f => f.status === 'APPROVED').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved Financing
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <ShieldCheck size={40} color="#ed6c02" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {compliance.filter(c => c.status === 'PENDING').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Compliance
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {documents.filter(d => d.status === 'VERIFIED').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified Documents
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<FileCheck size={20} />} label="Document Verification" />
            <Tab icon={<DollarSign size={20} />} label="Export Financing" />
            <Tab icon={<ShieldCheck size={20} />} label="Compliance Review" />
          </Tabs>

          {loading && <LinearProgress />}

          {/* Document Verification Tab */}
          <TabPanel value={activeTab} index={0}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Document ID</TableCell>
                    <TableCell>Export ID</TableCell>
                    <TableCell>Exporter</TableCell>
                    <TableCell>Document Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Submitted Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>{doc.id}</TableCell>
                      <TableCell>{doc.exportId}</TableCell>
                      <TableCell>{doc.exporter}</TableCell>
                      <TableCell>{doc.documentType}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(doc.status)}
                          label={doc.status.replace('_', ' ')}
                          color={getStatusColor(doc.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={doc.priority}
                          color={doc.priority === 'HIGH' ? 'error' : doc.priority === 'MEDIUM' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{doc.submittedDate}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetails(doc)}>
                          <Eye size={18} />
                        </IconButton>
                        <IconButton size="small">
                          <Download size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Export Financing Tab */}
          <TabPanel value={activeTab} index={1}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Financing ID</TableCell>
                    <TableCell>Export ID</TableCell>
                    <TableCell>Exporter</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {financing.map((fin) => (
                    <TableRow key={fin.id} hover>
                      <TableCell>{fin.id}</TableCell>
                      <TableCell>{fin.exportId}</TableCell>
                      <TableCell>{fin.exporter}</TableCell>
                      <TableCell>
                        {fin.currency} {fin.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{fin.type}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(fin.status)}
                          label={fin.status}
                          color={getStatusColor(fin.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {fin.approvedDate || fin.submittedDate}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetails(fin)}>
                          <Eye size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Compliance Review Tab */}
          <TabPanel value={activeTab} index={2}>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Compliance ID</TableCell>
                    <TableCell>Export ID</TableCell>
                    <TableCell>Exporter</TableCell>
                    <TableCell>Check Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compliance.map((comp) => (
                    <TableRow key={comp.id} hover>
                      <TableCell>{comp.id}</TableCell>
                      <TableCell>{comp.exportId}</TableCell>
                      <TableCell>{comp.exporter}</TableCell>
                      <TableCell>{comp.checkType}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(comp.status)}
                          label={comp.status}
                          color={getStatusColor(comp.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {comp.score ? `${comp.score}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {comp.completedDate || comp.initiatedDate}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetails(comp)}>
                          <Eye size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Card>

        {/* Details Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedItem?.documentType || selectedItem?.type || selectedItem?.checkType} Details
          </DialogTitle>
          <DialogContent>
            {selectedItem && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedItem.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Export ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedItem.exportId}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Exporter
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedItem.exporter}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    icon={getStatusIcon(selectedItem.status)}
                    label={selectedItem.status.replace('_', ' ')}
                    color={getStatusColor(selectedItem.status)}
                  />
                </Grid>
                {selectedItem.amount && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Amount
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedItem.currency} {selectedItem.amount.toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {selectedItem.score && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Compliance Score
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedItem.score}%
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
            {selectedItem?.status === 'PENDING_VERIFICATION' && (
              <>
                <Button color="error">Reject</Button>
                <Button variant="contained">Approve</Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  );
};

export default BankingOperations;
