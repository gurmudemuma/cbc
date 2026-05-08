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
  buyer_country?: string;
  exporter_name?: string;
  exporter_tin?: string;
  coffee_type: string;
  origin_region?: string;
  quantity: number;
  unit_price?: number;
  total_value: number;
  currency?: string;
  quality_grade?: string;
  payment_method?: string;
  payment_terms?: string;
  incoterms?: string;
  delivery_date?: string;
  port_of_loading?: string;
  port_of_discharge?: string;
  status: string;
  created_at: string;
  finalized_at: string;
  submitted_at?: string;
  blockchain_contract_id?: string;
  ecta_reference_number?: string;
  lc_number?: string;
}

interface RegistrationStats {
  totalFinalized: number;
  pendingRegistration: number;
  registered: number;
}

const ECTASalesContractRegistration = () => {
  const location = useLocation();
  const [contracts, setContracts] = useState<FinalizedContract[]>([]);
  const [registeredContracts, setRegisteredContracts] = useState<FinalizedContract[]>([]);
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
    fetchRegisteredContracts();
    fetchStats();
  }, []);

  const fetchFinalizedContracts = async () => {
    try {
      setLoading(true);
      // Fetch from the new pending registrations endpoint
      const response = await apiClient.get('/api/ecta/contracts/pending-registration');
      if (response.data.success) {
        // Map the pending registrations to the contract format with full details
        const pendingContracts = response.data.pendingRegistrations.map((reg: any) => ({
          draft_id: reg.draftId,
          contract_number: reg.contractNumber,
          buyer_name: reg.buyer.name,
          buyer_country: reg.buyer.country,
          exporter_name: reg.exporter.name,
          exporter_tin: reg.exporter.tin,
          coffee_type: reg.contract.coffeeType,
          quantity: reg.contract.quantity,
          unit_price: reg.contract.unitPrice,
          total_value: reg.contract.totalValue,
          currency: reg.contract.currency || 'USD',
          quality_grade: reg.contract.qualityGrade,
          payment_method: reg.contract.paymentMethod,
          payment_terms: reg.contract.paymentTerms,
          incoterms: reg.contract.incoterms,
          delivery_date: reg.contract.deliveryDate,
          port_of_loading: reg.contract.portOfLoading,
          port_of_discharge: reg.contract.portOfDischarge,
          status: 'PENDING_REGISTRATION',
          created_at: reg.submittedAt,
          finalized_at: reg.submittedAt,
          submitted_at: reg.submittedAt,
          ecta_reference_number: reg.ectaReferenceNumber
        }));
        setContracts(pendingContracts);
      }
    } catch (err) {
      console.error('Failed to fetch pending registrations:', err);
      setError('Failed to fetch pending registrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredContracts = async () => {
    try {
      const response = await apiClient.get('/api/ecta/contracts/registered');
      if (response.data.success) {
        const registered = response.data.registeredContracts.map((reg: any) => ({
          draft_id: reg.draftId,
          contract_number: reg.contractNumber,
          buyer_name: reg.buyer.name,
          buyer_country: reg.buyer.country,
          exporter_name: reg.exporter.name,
          exporter_tin: reg.exporter.tin,
          coffee_type: reg.contract.coffeeType,
          quantity: reg.contract.quantity,
          unit_price: reg.contract.unitPrice,
          total_value: reg.contract.totalValue,
          currency: reg.contract.currency || 'USD',
          quality_grade: reg.contract.qualityGrade,
          payment_method: reg.contract.paymentMethod,
          payment_terms: reg.contract.paymentTerms,
          incoterms: reg.contract.incoterms,
          delivery_date: reg.contract.deliveryDate,
          port_of_loading: reg.contract.portOfLoading,
          port_of_discharge: reg.contract.portOfDischarge,
          status: 'REGISTERED',
          created_at: reg.submittedAt,
          finalized_at: reg.registeredAt,
          submitted_at: reg.submittedAt,
          ecta_reference_number: reg.ectaReferenceNumber,
          lc_number: reg.lcNumber,
          registered_at: reg.registeredAt,
          registered_by: reg.registeredBy,
          registration_notes: reg.registrationNotes
        }));
        setRegisteredContracts(registered);
      }
    } catch (err) {
      console.error('Failed to fetch registered contracts:', err);
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
        setSuccess(`Contract registered successfully with LC Number: ${response.data.lcNumber || referenceNumber}`);
        setRegistrationDialog(false);
        setSelectedContract(null);
        // Refresh both pending and registered lists
        fetchFinalizedContracts();
        fetchRegisteredContracts();
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

  const pendingContracts = contracts;
  const displayedRegisteredContracts = registeredContracts;

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
          <Tab label={`Registered Contracts (${displayedRegisteredContracts.length})`} />
        </Tabs>
      </Box>

      {/* Statistics Cards - Clickable to switch tabs */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Box 
              onClick={() => setActiveTab(0)} 
              sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}
            >
              <ModernStatCard
                title="Total Finalized"
                value={stats.totalFinalized}
                icon={<FileSignature size={24} />}
                color="primary"
                subtitle="All finalized contracts (click to view)"
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box 
              onClick={() => setActiveTab(0)} 
              sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}
            >
              <ModernStatCard
                title="Pending Registration"
                value={stats.pendingRegistration}
                icon={<Search size={24} />}
                color="warning"
                subtitle="Awaiting ECTA registration (click to view)"
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box 
              onClick={() => setActiveTab(1)} 
              sx={{ cursor: 'pointer', '&:hover': { transform: 'translateY(-2px)', transition: 'transform 0.2s' } }}
            >
              <ModernStatCard
                title="Registered"
                value={stats.registered}
                icon={<CheckCircle size={24} />}
                color="success"
                subtitle="With ECTA reference (click to view)"
              />
            </Box>
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
                      <TableCell>ECTA Ref</TableCell>
                      <TableCell>Contract #</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Buyer</TableCell>
                      <TableCell>Coffee Details</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell>Delivery</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingContracts.map((contract) => (
                      <TableRow key={contract.draft_id} hover>
                        <TableCell>
                          <Chip
                            label={contract.ecta_reference_number || 'Pending'}
                            color="warning"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {contract.contract_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {contract.exporter_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            TIN: {contract.exporter_tin}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {contract.buyer_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contract.buyer_country}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {contract.coffee_type}
                          </Typography>
                          {contract.quality_grade && (
                            <Typography variant="caption" color="text.secondary">
                              Grade: {contract.quality_grade}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {contract.quantity} bags
                          </Typography>
                          {contract.unit_price && (
                            <Typography variant="caption" color="text.secondary">
                              @{contract.currency} {contract.unit_price}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {contract.currency} {contract.total_value?.toLocaleString()}
                          </Typography>
                          {contract.payment_method && (
                            <Typography variant="caption" color="text.secondary">
                              {contract.payment_method}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {contract.delivery_date && (
                            <>
                              <Typography variant="body2">
                                {new Date(contract.delivery_date).toLocaleDateString()}
                              </Typography>
                              {contract.incoterms && (
                                <Typography variant="caption" color="text.secondary">
                                  {contract.incoterms}
                                </Typography>
                              )}
                            </>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {contract.submitted_at
                              ? new Date(contract.submitted_at).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contract.submitted_at
                              ? new Date(contract.submitted_at).toLocaleTimeString()
                              : ''}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Eye size={16} />}
                            onClick={() => handleViewDetails(contract)}
                            sx={{ mr: 1, mb: 0.5 }}
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
              <CheckCircle size={20} /> Registered Contracts ({displayedRegisteredContracts.length})
            </Typography>
            <Divider sx={{ my: 2 }} />
            {displayedRegisteredContracts.length === 0 ? (
              <Alert severity="info">No registered contracts yet</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>ECTA Reference</TableCell>
                      <TableCell>LC Number</TableCell>
                      <TableCell>Contract #</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Buyer</TableCell>
                      <TableCell>Coffee Type</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell>Registered Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {displayedRegisteredContracts.map((contract) => (
                      <TableRow key={contract.draft_id} hover>
                        <TableCell>
                          <Chip
                            label={contract.ecta_reference_number}
                            color="success"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {contract.lc_number || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>{contract.contract_number}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{contract.exporter_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contract.exporter_tin}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{contract.buyer_name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {contract.buyer_country}
                          </Typography>
                        </TableCell>
                        <TableCell>{contract.coffee_type}</TableCell>
                        <TableCell align="right">
                          {contract.currency} {contract.total_value?.toLocaleString()}
                        </TableCell>
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
        <DialogTitle>
          Contract Details - {selectedContract?.lc_number ? 'Registered' : 'Pending Registration'}
        </DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Alert severity={selectedContract.lc_number ? "success" : "warning"} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      Status: {selectedContract.lc_number ? 'REGISTERED' : 'PENDING ECTA REGISTRATION'}
                    </Typography>
                    <Typography variant="body2">
                      {selectedContract.lc_number 
                        ? `This contract has been officially registered by ECTA with LC Number: ${selectedContract.lc_number}`
                        : 'This contract has been finalized and is awaiting official registration by ECTA.'}
                    </Typography>
                  </Alert>
                </Grid>

                {/* Contract Identification */}
                <Grid item xs={12}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Contract Identification
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Contract Number
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedContract.contract_number}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    {selectedContract.lc_number ? 'LC Number' : 'ECTA Reference'}
                  </Typography>
                  <Chip 
                    label={selectedContract.lc_number || selectedContract.ecta_reference_number || 'Awaiting Registration'} 
                    color={selectedContract.lc_number ? 'success' : 'warning'}
                    size="small"
                  />
                </Grid>

                {/* Parties Information */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Contracting Parties
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Exporter (Seller)
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedContract.exporter_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    TIN: {selectedContract.exporter_tin}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Buyer (Purchaser)
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedContract.buyer_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedContract.buyer_country}
                  </Typography>
                </Grid>

                {/* Coffee Details */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Coffee Specifications
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Coffee Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedContract.coffee_type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quality Grade
                  </Typography>
                  <Typography variant="body1">{selectedContract.quality_grade || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">{selectedContract.quantity} bags (60kg each)</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Unit Price
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.currency} {selectedContract.unit_price?.toLocaleString() || 'N/A'}
                  </Typography>
                </Grid>

                {/* Financial Terms */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Financial Terms
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Contract Value
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {selectedContract.currency} {selectedContract.total_value?.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Method
                  </Typography>
                  <Typography variant="body1">{selectedContract.payment_method || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Payment Terms
                  </Typography>
                  <Typography variant="body1">{selectedContract.payment_terms || 'Not specified'}</Typography>
                </Grid>

                {/* Delivery Terms */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    Delivery & Logistics
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Incoterms
                  </Typography>
                  <Typography variant="body1">{selectedContract.incoterms || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Delivery Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.delivery_date
                      ? new Date(selectedContract.delivery_date).toLocaleDateString()
                      : 'Not specified'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Port of Loading
                  </Typography>
                  <Typography variant="body1">{selectedContract.port_of_loading || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Port of Discharge
                  </Typography>
                  <Typography variant="body1">{selectedContract.port_of_discharge || 'Not specified'}</Typography>
                </Grid>

                {/* Submission Details */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" color="primary" gutterBottom>
                    {selectedContract.lc_number ? 'Registration Information' : 'Submission Information'}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Submitted to ECTA
                  </Typography>
                  <Typography variant="body1">
                    {selectedContract.submitted_at
                      ? new Date(selectedContract.submitted_at).toLocaleString()
                      : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Current Status
                  </Typography>
                  <Chip
                    label={selectedContract.lc_number ? "REGISTERED" : "PENDING REGISTRATION"}
                    color={selectedContract.lc_number ? "success" : "warning"}
                    size="small"
                  />
                </Grid>

                {selectedContract.lc_number && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Registered At
                      </Typography>
                      <Typography variant="body1">
                        {selectedContract.registered_at
                          ? new Date(selectedContract.registered_at).toLocaleString()
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Registered By
                      </Typography>
                      <Typography variant="body1">
                        {selectedContract.registered_by || 'N/A'}
                      </Typography>
                    </Grid>
                    {selectedContract.registration_notes && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Registration Notes
                        </Typography>
                        <Typography variant="body1">
                          {selectedContract.registration_notes}
                        </Typography>
                      </Grid>
                    )}
                  </>
                )}

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
          {selectedContract && !selectedContract.ecta_reference_number && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<FileSignature size={18} />}
              onClick={() => {
                setDetailsDialog(false);
                handleOpenRegistration(selectedContract);
              }}
            >
              Register Now
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ECTASalesContractRegistration;
