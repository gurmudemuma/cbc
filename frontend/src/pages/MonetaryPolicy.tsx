import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
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
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Settings,
  Eye,
  Edit,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { CommonPageProps } from '../types';

interface MonetaryPolicyProps extends CommonPageProps {}

const MonetaryPolicy = ({ user, org }: MonetaryPolicyProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState(0);
  const [policies, setPolicies] = useState([]);
  const [controls, setControls] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API calls
    const mockPolicies = [
      {
        id: 'POL-001',
        name: 'Export FX Rate Policy',
        type: 'Exchange Rate',
        status: 'ACTIVE',
        effectiveDate: '2024-01-01',
        rate: 55.25,
        change: 2.5,
        description: 'Official exchange rate for coffee exports',
      },
      {
        id: 'POL-002',
        name: 'Coffee Export Incentive',
        type: 'Incentive',
        status: 'ACTIVE',
        effectiveDate: '2024-01-15',
        rate: 5.0,
        change: 0,
        description: 'Additional incentive rate for coffee exporters',
      },
    ];

    const mockControls = [
      {
        id: 'CTRL-001',
        name: 'Daily FX Limit',
        type: 'Transaction Limit',
        value: 100000,
        currency: 'USD',
        status: 'ENABLED',
        lastUpdated: '2024-01-15',
      },
      {
        id: 'CTRL-002',
        name: 'Export Documentation Check',
        type: 'Compliance Check',
        value: true,
        status: 'ENABLED',
        lastUpdated: '2024-01-10',
      },
    ];

    const mockCompliance = [
      {
        id: 'COMP-001',
        exportId: 'EXP-001',
        exporter: 'ABC Coffee Export',
        checkType: 'FX Compliance',
        status: 'COMPLIANT',
        score: 95,
        lastCheck: '2024-01-15',
        issues: 0,
      },
      {
        id: 'COMP-002',
        exportId: 'EXP-002',
        exporter: 'XYZ Trading',
        checkType: 'Documentation Check',
        status: 'NON_COMPLIANT',
        score: 65,
        lastCheck: '2024-01-14',
        issues: 3,
      },
    ];

    setTimeout(() => {
      setPolicies(mockPolicies);
      setControls(mockControls);
      setCompliance(mockCompliance);
      setLoading(false);
    }, 1000);
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'ENABLED':
      case 'COMPLIANT': return 'success';
      case 'INACTIVE':
      case 'DISABLED':
      case 'NON_COMPLIANT': return 'error';
      case 'PENDING': return 'warning';
      default: return 'default';
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const getPolicyStats = () => {
    return {
      activePolicies: policies.filter(p => p.status === 'ACTIVE').length,
      enabledControls: controls.filter(c => c.status === 'ENABLED').length,
      compliantExporters: compliance.filter(c => c.status === 'COMPLIANT').length,
      avgComplianceScore: compliance.reduce((sum, c) => sum + c.score, 0) / compliance.length || 0,
    };
  };

  const stats = getPolicyStats();

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
          Monetary Policy Dashboard
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Settings size={40} color="#1976d2" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="primary" gutterBottom>
                  {stats.activePolicies}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Policies
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Shield size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {stats.enabledControls}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Controls
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {stats.compliantExporters}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Compliant Exporters
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <DollarSign size={40} color="#ed6c02" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {stats.avgComplianceScore.toFixed(0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Compliance Score
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
            <Tab icon={<Settings size={20} />} label="Policy Dashboard" />
            <Tab icon={<Shield size={20} />} label="Exchange Controls" />
            <Tab icon={<TrendingUp size={20} />} label="Compliance Monitoring" />
          </Tabs>

          {loading && <LinearProgress />}

          {/* Policy Dashboard Tab */}
          <TabPanel value={activeTab} index={0}>
            <Typography variant="h6" gutterBottom>
              Current Monetary Policies
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Policy ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rate/Value</TableCell>
                    <TableCell>Change</TableCell>
                    <TableCell>Effective Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {policies.map((policy) => (
                    <TableRow key={policy.id} hover>
                      <TableCell>{policy.id}</TableCell>
                      <TableCell>{policy.name}</TableCell>
                      <TableCell>{policy.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={policy.status}
                          color={getStatusColor(policy.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {policy.rate}
                        {policy.type === 'Exchange Rate' ? ' ETB/USD' : '%'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {policy.change > 0 ? (
                            <TrendingUp size={16} color="#2e7d32" />
                          ) : policy.change < 0 ? (
                            <TrendingDown size={16} color="#d32f2f" />
                          ) : null}
                          <Typography
                            variant="body2"
                            color={policy.change > 0 ? 'success.main' : policy.change < 0 ? 'error.main' : 'text.secondary'}
                          >
                            {policy.change > 0 ? '+' : ''}{policy.change}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{policy.effectiveDate}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetails(policy)}>
                          <Eye size={18} />
                        </IconButton>
                        <IconButton size="small">
                          <Edit size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Exchange Controls Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" gutterBottom>
              Exchange Control Settings
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Control ID</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {controls.map((control) => (
                    <TableRow key={control.id} hover>
                      <TableCell>{control.id}</TableCell>
                      <TableCell>{control.name}</TableCell>
                      <TableCell>{control.type}</TableCell>
                      <TableCell>
                        {typeof control.value === 'boolean' 
                          ? (control.value ? 'Enabled' : 'Disabled')
                          : `${control.currency} ${control.value.toLocaleString()}`
                        }
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={control.status}
                          color={getStatusColor(control.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{control.lastUpdated}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetails(control)}>
                          <Eye size={18} />
                        </IconButton>
                        <IconButton size="small">
                          <Settings size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Compliance Monitoring Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" gutterBottom>
              Compliance Monitoring
            </Typography>
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
                    <TableCell>Issues</TableCell>
                    <TableCell>Last Check</TableCell>
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
                          label={comp.status.replace('_', ' ')}
                          color={getStatusColor(comp.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={comp.score >= 80 ? 'success.main' : comp.score >= 60 ? 'warning.main' : 'error.main'}
                        >
                          {comp.score}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {comp.issues > 0 ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AlertTriangle size={16} color="#d32f2f" />
                            <Typography variant="body2" color="error.main">
                              {comp.issues}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="success.main">
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{comp.lastCheck}</TableCell>
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
            {selectedItem?.name || selectedItem?.checkType} Details
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
                    Status
                  </Typography>
                  <Chip
                    label={selectedItem.status?.replace('_', ' ')}
                    color={getStatusColor(selectedItem.status)}
                  />
                </Grid>
                {selectedItem.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedItem.description}
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
                {selectedItem.issues !== undefined && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Issues Found
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedItem.issues}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default MonetaryPolicy;
