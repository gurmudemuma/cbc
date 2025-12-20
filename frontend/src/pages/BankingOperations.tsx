import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  FileCheck,
  DollarSign,
  ShieldCheck,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Download,
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

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

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
  );
};

export default BankingOperations;
