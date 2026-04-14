import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress, Grid, Divider, Tabs, Tab
} from '@mui/material';
import { FileSignature, CheckCircle, Eye, Search } from 'lucide-react';
import { ModernStatCard } from '../components/ModernUIKit';
import apiClient from '../services/api';

interface FinalizedContract {
  draft_id: string;
  contract_number: string;
  buyer_name: string;
  coffee_type: string;
  quantity: number;
  total_value: number;
  status: string;
  created_at: string;
  finalized_at: string;
  blockchain_contract_id?: string;
  ecta_reference_number?: string;
}

interface RegistrationStats {
  totalFinalized: number;
  pendingRegistration: number;
  registered: number;
}

const ECTASalesContractRegistration = () => {
  const location = useLocation();
  const [contracts, setContracts] = useState<FinalizedContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<FinalizedContract | null>(null);
  const [registrationDialog, setRegistrationDialog] = useState(false);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState<RegistrationStats | null>(null);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  
  // Determine active tab based on route
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    // Set tab based on route
    if (location.pathname.includes('/registered')) {
      setActiveTab(1);
    } else {
      setActiveTab(0);
    }
  }, [location.pathname]);

  useEffect(() => {
    fetchFinalizedContracts();
    fetchStats();
  }, []);

  const fetchFinalizedContracts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/ecta/contracts/finalized');
      if (response.data.success) {
        setContracts(response.data.contracts || []);
      }
    } catch (err) {
      console.error('Failed to fetch finalized contracts:', err);
      setError('Failed to fetch finalized contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/api/ecta/contracts/registration-stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleOpenRegistration = (contract: FinalizedContract) => {
    setSelectedContract(contract);
    // Generate reference number format: ECTA-SC-YYYYMMDD-XXXX
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    setReferenceNumber(`ECTA-SC-${date}-${random}`);
    setNotes('');
    setRegistrationDialog(true);
  };

  const handleRegister = async () => {
    if (!selectedContract || !referenceNumber) return;

    try {
      setLoading(true);
      setError('');
      const response = await apiClient.post(
        `/api/ecta/contracts/${selectedContract.draft_id}/register`,
        {
          referenceNumber,
          notes
        }
      );

      if (response.data.success) {
        setSuccess(`Contract registered successfully with reference: ${referenceNumber}`);
        setRegistrationDialog(false);
        setSelectedContract(null);
        fetchFinalizedContracts();
        fetchStats();
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to register contract';
      setError(errorMsg);
      console.error('Error registering contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (contract: FinalizedContract) => {
    setSelectedContract(contract);
    setDetailsDialog(true);
  };

  const getStatusColor = (status: string) => {
    if (status === 'REGISTERED') return 'success';
    if (status === 'FINALIZED') return 'warning';
    return 'default';
  };

  const pendingContracts = contracts.filter(c => !c.ecta_reference_number);
  const registeredContracts = contracts.filter(c => c.ecta_reference_number);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FileSignature size={32} /> Sales Contract Registration
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Register finalized sales contracts and generate ECTA reference numbers
        </Typography>
      </Box>

      {/* Tabs for switching between views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Pending Registration (${pendingContracts.length})`} />
          <Tab label={`Registered Contracts (${registeredContracts.length})`} />
        </Tabs>
      </Box>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <ModernStatCard
              title="Total Finalized"
              value={stats.totalFinalized}
              icon={<FileSignature size={24} />}
              color="primary"
              subtitle="All finalized contracts"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <ModernStatCard
              title="Pending Registration"
              value={stats.pendingRegistration}
              icon={<Search size={24} />}
              color="warning"
              subtitle="Awaiting ECTA registration"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <ModernStatCard
              title="Registered"
              value={stats.registered}
              icon={<CheckCircle size={24} />}
              color="success"
              subtitle="With ECTA reference"
            />
          </Grid>
        </Grid>
      )}

      {/* Tab Content */}
      {activeTab === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Search size={20} /> Pending Registration ({pendingContracts.length})
            </Typography>
            <Divider sx={{ my: 2 }} />
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : pendingContracts.length === 0 ? (
              <Alert severity="info">No contracts pending registration</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Contract #</TableCell>
                      <TableCell>Buyer</TableCell>
                      <TableCell>Coffee Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell>Finalized Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingContracts.map((contract) => (
                      <TableRow key={contract.draft_id} hover>
                        <TableCell>{contract.contract_number}</TableCell>
                        <TableCell>{contract.buyer_name}</TableCell>
                        <TableCell>{contract.coffee_type}</TableCell>
                        <TableCell align="right">{contract.quantity} bags</TableCell>
                        <TableCell align="right">${contract.total_value?.toLocaleString()}</TableCell>
                        <TableCell>
                          {contract.finalized_at
                            ? new Date(contract.finalized_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Eye size={16} />}
                            onClick={() => handleViewDetails(contract)}
                            sx={{ mr: 1 }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<FileSignature size={16} />}
                            onClick={() => handleOpenRegistration(contract)}
                          >
                            Register
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle size={20} /> Registered Contracts ({registeredContracts.length})
            </Typography>
            <Divider sx={{ my: 2 }} />
            {registeredContracts.length === 0 ? (
              <Alert severity="info">No registered contracts yet</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>ECTA Reference</TableCell>
                      <TableCell>Contract #</TableCell>
                      <TableCell>Buyer</TableCell>
                      <TableCell>Coffee Type</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell>Registered Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {registeredContracts.map((contract) => (
                      <TableRow key={contract.draft_id} hover>
                        <TableCell>
                          <Chip
                            label={contract.ecta_reference_number}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{contract.contract_number}</TableCell>
                        <TableCell>{contract.buyer_name}</TableCell>
                        <TableCell>{contract.coffee_type}</TableCell>
                        <TableCell align="right">${contract.total_value?.toLocaleString()}</TableCell>
                        <TableCell>
                          {contract.finalized_at
                            ? new Date(contract.finalized_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Eye size={16} />}
                            onClick={() => handleViewDetails(contract)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Registration Dialog */}
      <Dialog open={registrationDialog} onClose={() => !loading && setRegistrationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register Sales Contract</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box sx={{ pt: 2 }}>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Contract: {selectedContract.contract_number}
                </Typography>
                <Typography variant="body2">
                  Buyer: {selectedContract.buyer_name}
                  <br />
                  Value: ${selectedContract.total_value?.toLocaleString()}
                </Typography>
              </Alert>

              <TextField
                fullWidth
                label="ECTA Reference Number"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                sx={{ mb: 2 }}
                required
                helperText="Format: ECTA-SC-YYYYMMDD-XXXX"
              />

              <TextField
                fullWidth
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                helperText="Any additional notes or comments"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrationDialog(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleRegister}
            variant="contained"
            color="primary"
            disabled={loading || !referenceNumber}
            startIcon={loading ? <CircularProgress size={20} /> : <FileSignature size={18} />}
          >
            {loading ? 'Registering...' : 'Register Contract'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onClose={() => setDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract Number
                  </Typography>
                  <Typography variant="body1">{selectedContract.contract_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ECTA Reference
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.ecta_reference_number || 'Not registered'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Buyer
                  </Typography>
                  <Typography variant="body1">{selectedContract.buyer_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Coffee Type
                  </Typography>
                  <Typography variant="body1">{selectedContract.coffee_type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1">{selectedContract.quantity} bags</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Value
                  </Typography>
                  <Typography variant="body1">${selectedContract.total_value?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedContract.ecta_reference_number ? 'REGISTERED' : 'FINALIZED'}
                    color={getStatusColor(selectedContract.ecta_reference_number ? 'REGISTERED' : 'FINALIZED')}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Finalized Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.finalized_at
                      ? new Date(selectedContract.finalized_at).toLocaleDateString()
                      : 'N/A'}
                  </Typography>
                </Grid>
                {selectedContract.blockchain_contract_id && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Blockchain Contract ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {selectedContract.blockchain_contract_id}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ECTASalesContractRegistration;
