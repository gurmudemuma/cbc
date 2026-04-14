import { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardHeader, CardContent, Button, Alert, CircularProgress, Box,
  Typography, Divider, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Tab, Tabs,
} from '@mui/material';
import { Plus, Download, Eye, TrendingUp, FileText, Clock, CheckCircle } from 'lucide-react';
import SalesContractDraftForm from '../components/forms/SalesContractDraftForm';
import SalesContractNegotiationForm from '../components/forms/SalesContractNegotiationForm';
import { ModernStatCard } from '../components/ModernUIKit';
import apiClient from '../services/api';

interface Draft {
  draft_id: string;
  contract_number: string;
  status: string;
  buyer_name: string;
  coffee_type: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  payment_terms: string;
  incoterms: string;
  delivery_date: string;
  proposed_by: string;
  created_at: string;
  updated_at: string;
}

interface Buyer {
  buyer_id: string;
  company_name: string;
  country: string;
  email: string;
}

interface ContractStats {
  totalContracts: number;
  inNegotiation: number;
  finalized: number;
  rejected: number;
  totalValue: number;
}

const SalesContractDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [contractStats, setContractStats] = useState<ContractStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch drafts and buyers
  useEffect(() => {
    fetchDrafts();
    fetchBuyers();
    fetchContractStats();
  }, []);

  const fetchContractStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiClient.get('/api/contracts/drafts/stats');
      if (response.data.success) {
        setContractStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch contract stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/contracts/drafts`);
      if (response.data.success) {
        setDrafts(response.data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to fetch drafts:', err);
      setError('Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const response = await apiClient.get(`/api/buyers`);
      if (response.data.success) {
        setBuyers(response.data.buyers || []);
      }
    } catch (err) {
      console.error('Failed to fetch buyers:', err);
    }
  };

  const handleCreateDraft = async (formData: any) => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.post(`/api/contracts/drafts`, formData);
      
      if (response.data.success) {
        setSuccess('Contract draft created successfully');
        fetchDrafts();
        setTabValue(0);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create draft';
      setError(errorMsg);
      console.error('Error creating draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await apiClient.post(`/api/contracts/drafts/${selectedDraft.draft_id}/accept`, {});
      
      if (response.data.success) {
        setSuccess('Contract accepted successfully');
        fetchDrafts();
        setSelectedDraft(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to accept contract';
      setError(errorMsg);
      console.error('Error accepting contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await apiClient.post(`/api/contracts/drafts/${selectedDraft.draft_id}/reject`, { reason });
      
      if (response.data.success) {
        setSuccess('Contract rejected');
        fetchDrafts();
        setSelectedDraft(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to reject contract';
      setError(errorMsg);
      console.error('Error rejecting contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async (updates: any, notes: string) => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await apiClient.post(`/api/contracts/drafts/${selectedDraft.draft_id}/counter`, { updates, notes });
      
      if (response.data.success) {
        setSuccess('Counter offer submitted');
        fetchDrafts();
        setSelectedDraft(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit counter offer';
      setError(errorMsg);
      console.error('Error submitting counter offer:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await apiClient.post(`/api/contracts/drafts/${selectedDraft.draft_id}/finalize`, {});
      
      if (response.data.success) {
        setSuccess(`Contract finalized! Blockchain ID: ${response.data.blockchainContractId}`);
        fetchDrafts();
        setSelectedDraft(null);
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to finalize contract';
      setError(errorMsg);
      console.error('Error finalizing contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/contracts/drafts/${selectedDraft.draft_id}/certificate`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-contract-${selectedDraft.draft_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Certificate downloaded');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to download certificate';
      setError(errorMsg);
      console.error('Error downloading certificate:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      DRAFT: 'default',
      COUNTERED: 'warning',
      ACCEPTED: 'info',
      REJECTED: 'error',
      FINALIZED: 'success',
    };
    return colors[status] || 'default';
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
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Sales Contract Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create, negotiate, and finalize coffee export contracts
        </Typography>
      </Box>

      {/* Statistics Cards */}
      {contractStats && !statsLoading && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <ModernStatCard
              title="Total Contracts"
              value={contractStats.totalContracts}
              icon={<FileText size={24} />}
              color="primary"
              subtitle="All contracts"
              onClick={() => setTabValue(0)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ModernStatCard
              title="In Negotiation"
              value={contractStats.inNegotiation}
              icon={<Clock size={24} />}
              color="warning"
              subtitle="Draft & Countered"
              onClick={() => setTabValue(0)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ModernStatCard
              title="Finalized"
              value={contractStats.finalized}
              icon={<CheckCircle size={24} />}
              color="success"
              subtitle="On blockchain"
              onClick={() => setTabValue(0)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ModernStatCard
              title="Total Value"
              value={`$${(contractStats.totalValue / 1000).toFixed(1)}K`}
              icon={<TrendingUp size={24} />}
              color="info"
              subtitle="USD"
              onClick={() => setTabValue(0)}
            />
          </Grid>
        </Grid>
      )}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="My Drafts" />
        <Tab label="Create New" />
        <Tab label="Details" disabled={!selectedDraft} />
      </Tabs>

      {/* My Drafts Tab */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader
                title="Contract Drafts"
                action={
                  <Button
                    variant="contained"
                    startIcon={<Plus size={18} />}
                    onClick={() => setTabValue(1)}
                  >
                    New Draft
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : drafts.length === 0 ? (
                  <Typography color="text.secondary">No drafts yet. Create one to get started.</Typography>
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
                          <TableCell>Status</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {drafts.map((draft) => (
                          <TableRow key={draft.draft_id} hover>
                            <TableCell>{draft.contract_number}</TableCell>
                            <TableCell>{draft.buyer_name}</TableCell>
                            <TableCell>{draft.coffee_type}</TableCell>
                            <TableCell align="right">{draft.quantity} bags</TableCell>
                            <TableCell align="right">${draft.total_value}</TableCell>
                            <TableCell>
                              <Chip
                                label={draft.status}
                                color={getStatusColor(draft.status)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{new Date(draft.created_at).toLocaleDateString()}</TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                startIcon={<Eye size={16} />}
                                onClick={() => {
                                  setSelectedDraft(draft);
                                  setTabValue(2);
                                }}
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
          </Grid>
        </Grid>
      )}

      {/* Create New Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          {!selectedBuyer ? (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Select Buyer" />
                <Divider />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Select a verified buyer to create a sales contract draft
                  </Alert>
                  {buyers.length === 0 ? (
                    <Typography color="text.secondary">
                      No buyers available. Buyers must be registered in the system first.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Company Name</TableCell>
                            <TableCell>Country</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell align="center">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {buyers.map((buyer) => (
                            <TableRow key={buyer.buyer_id} hover>
                              <TableCell>{buyer.company_name}</TableCell>
                              <TableCell>{buyer.country}</TableCell>
                              <TableCell>{buyer.email}</TableCell>
                              <TableCell align="center">
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => setSelectedBuyer(buyer)}
                                >
                                  Select
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
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setSelectedBuyer(null)}
                >
                  ← Change Buyer
                </Button>
              </Box>
              <SalesContractDraftForm
                buyerId={selectedBuyer.buyer_id}
                buyerName={selectedBuyer.company_name}
                onSubmit={handleCreateDraft}
                loading={loading}
              />
            </Grid>
          )}
        </Grid>
      )}

      {/* Details Tab */}
      {tabValue === 2 && selectedDraft && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SalesContractNegotiationForm
              draft={selectedDraft}
              onAccept={handleAccept}
              onReject={handleReject}
              onCounter={handleCounter}
              loading={loading}
            />
          </Grid>

          {selectedDraft.status === 'ACCEPTED' && (
            <Grid item xs={12}>
              <Card>
                <CardHeader title="Finalization" />
                <Divider />
                <CardContent>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This contract is ready to be finalized on the blockchain. Once finalized, it
                    becomes immutable and a certificate can be generated.
                  </Alert>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleFinalize}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                    Finalize to Blockchain
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          )}

          {selectedDraft.status === 'FINALIZED' && (
            <>
              <Grid item xs={12}>
                <Card>
                  <CardHeader title="Certificate" />
                  <Divider />
                  <CardContent>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      This contract has been finalized on the blockchain. You can now download the
                      official sales contract certificate.
                    </Alert>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<Download size={18} />}
                      onClick={handleDownloadCertificate}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                      Download Certificate (PDF)
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card sx={{ border: '2px solid #4caf50' }}>
                  <CardHeader 
                    title="Next Step: Submit to Network" 
                    sx={{ bgcolor: '#e8f5e9' }}
                  />
                  <Divider />
                  <CardContent>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Ready for Network Submission
                      </Typography>
                      <Typography variant="body2">
                        Your sales contract is finalized. Submit your export to the network for approval by:
                      </Typography>
                      <Box component="ul" sx={{ mt: 1, mb: 0 }}>
                        <li>ECTA (Contract & Quality Verification)</li>
                        <li>Commercial Bank (Letter of Credit & Payment)</li>
                        <li>National Bank of Ethiopia (FX Approval)</li>
                        <li>Customs Authority (Clearance & SAD)</li>
                        <li>Shipping Line (Booking & Bill of Lading)</li>
                      </Box>
                    </Alert>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      startIcon={<Plus size={18} />}
                      onClick={() => {
                        // Navigate to Network submission with contract data
                        window.location.href = `/network/submission?contractId=${selectedDraft.draft_id}`;
                      }}
                      fullWidth
                      sx={{ fontWeight: 'bold' }}
                    >
                      Submit to Network
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}
        </Grid>
      )}
    </Container>
  );
};

export default SalesContractDashboard;
