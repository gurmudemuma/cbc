import { useState, useEffect } from 'react';
import {
  Container, Grid, Card, CardHeader, CardContent, Button, Alert, CircularProgress, Box,
  Typography, Divider, Chip, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Tab, Tabs, TextField, InputAdornment, Stack, Pagination,
} from '@mui/material';
import { Plus, Download, Eye, Search, Filter } from 'lucide-react';
import SalesContractDraftForm from '../components/forms/SalesContractDraftForm';
import SalesContractNegotiationForm from '../components/forms/SalesContractNegotiationForm';

interface Draft {
  draft_id: string;
  contract_number: string;
  status: string;
  buyer_name: string;
  buyer_email: string;
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
  ecta_reference_number?: string;
  blockchain_tx_hash?: string;
}

const SalesContractDashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_BASE = '/api';
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;

  // Fetch drafts
  useEffect(() => {
    if (userId && token) {
      fetchDrafts();
    }
  }, [userId, token]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/contracts/drafts/exporter/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      setError('Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const getFilteredDrafts = () => {
    let filtered = drafts;

    // Filter by tab status
    if (tabValue === 0) {
      // Drafts tab - show DRAFT status only
      filtered = filtered.filter(d => d.status === 'DRAFT');
    } else if (tabValue === 1) {
      // Negotiation tab - show COUNTERED and ACCEPTED status
      filtered = filtered.filter(d => d.status === 'COUNTERED' || d.status === 'ACCEPTED');
    } else if (tabValue === 2) {
      // Finalized tab - show FINALIZED status only
      filtered = filtered.filter(d => d.status === 'FINALIZED');
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(d =>
        d.buyer_name.toLowerCase().includes(query) ||
        d.buyer_email.toLowerCase().includes(query) ||
        d.coffee_type.toLowerCase().includes(query) ||
        d.contract_number.toLowerCase().includes(query) ||
        (d.ecta_reference_number && d.ecta_reference_number.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const filteredDrafts = getFilteredDrafts();
  const totalPages = Math.ceil(filteredDrafts.length / itemsPerPage);
  const paginatedDrafts = filteredDrafts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get contract counts by status
  const draftCount = drafts.filter(d => d.status === 'DRAFT').length;
  const negotiationCount = drafts.filter(d => d.status === 'COUNTERED' || d.status === 'ACCEPTED').length;
  const finalizedCount = drafts.filter(d => d.status === 'FINALIZED').length;

  const handleCreateDraft = async (formData: any) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/contracts/drafts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess('Contract draft created successfully');
        fetchDrafts();
        setTabValue(0);
        setSearchQuery('');
        setCurrentPage(1);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create draft');
      }
    } catch (err) {
      setError('Error creating draft');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/contracts/drafts/${selectedDraft.draft_id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: '{}',
      });

      if (response.ok) {
        setSuccess('Contract accepted successfully');
        fetchDrafts();
        setSelectedDraft(null);
        setCurrentPage(1);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to accept contract');
      }
    } catch (err) {
      setError('Error accepting contract');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/contracts/drafts/${selectedDraft.draft_id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setSuccess('Contract rejected');
        fetchDrafts();
        setSelectedDraft(null);
        setCurrentPage(1);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject contract');
      }
    } catch (err) {
      setError('Error rejecting contract');
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async (updates: any, notes: string) => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/contracts/drafts/${selectedDraft.draft_id}/counter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ updates, notes }),
      });

      if (response.ok) {
        setSuccess('Counter offer submitted');
        fetchDrafts();
        setSelectedDraft(null);
        setCurrentPage(1);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit counter offer');
      }
    } catch (err) {
      setError('Error submitting counter offer');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/contracts/drafts/${selectedDraft.draft_id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: '{}',
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Contract finalized! Blockchain ID: ${data.blockchainContractId}`);
        fetchDrafts();
        setSelectedDraft(null);
        setCurrentPage(1);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to finalize contract');
      }
    } catch (err) {
      setError('Error finalizing contract');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!selectedDraft) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/contracts/drafts/${selectedDraft.draft_id}/certificate`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
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
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to download certificate');
      }
    } catch (err) {
      setError('Error downloading certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_: any, newValue: number) => {
    setTabValue(newValue);
    setSearchQuery('');
    setCurrentPage(1);
    setSelectedDraft(null);
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

      {/* Tabs with Badge Counts */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Drafts
                <Chip label={draftCount} size="small" color="default" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Negotiation
                <Chip label={negotiationCount} size="small" color="warning" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Finalized
                <Chip label={finalizedCount} size="small" color="success" />
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Drafts Tab */}
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
                    onClick={() => handleTabChange(null, 3)}
                  >
                    New Draft
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                {/* Search Bar */}
                <TextField
                  fullWidth
                  placeholder="Search by buyer name, email, coffee type, or contract number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : paginatedDrafts.length === 0 ? (
                  <Typography color="text.secondary">
                    {filteredDrafts.length === 0 && searchQuery
                      ? 'No drafts match your search.'
                      : 'No drafts yet. Create one to get started.'}
                  </Typography>
                ) : (
                  <>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Contract #</TableCell>
                            <TableCell>Buyer</TableCell>
                            <TableCell>Coffee Type</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Total Value</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedDrafts.map((draft) => (
                            <TableRow key={draft.draft_id} hover>
                              <TableCell>{draft.contract_number}</TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {draft.buyer_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {draft.buyer_email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{draft.coffee_type}</TableCell>
                              <TableCell align="right">{draft.quantity} bags</TableCell>
                              <TableCell align="right">${draft.total_value.toLocaleString()}</TableCell>
                              <TableCell>{new Date(draft.created_at).toLocaleDateString()}</TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  startIcon={<Eye size={16} />}
                                  onClick={() => {
                                    setSelectedDraft(draft);
                                    setTabValue(3);
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
                    {totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={(_, page) => setCurrentPage(page)}
                        />
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Negotiation Tab */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Contracts Under Negotiation" />
              <Divider />
              <CardContent>
                {/* Search Bar */}
                <TextField
                  fullWidth
                  placeholder="Search by buyer name, email, coffee type, or contract number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : paginatedDrafts.length === 0 ? (
                  <Typography color="text.secondary">
                    {filteredDrafts.length === 0 && searchQuery
                      ? 'No contracts match your search.'
                      : 'No contracts under negotiation.'}
                  </Typography>
                ) : (
                  <>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Contract #</TableCell>
                            <TableCell>Buyer</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Last Update</TableCell>
                            <TableCell align="right">Total Value</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedDrafts.map((draft) => (
                            <TableRow key={draft.draft_id} hover>
                              <TableCell>{draft.contract_number}</TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {draft.buyer_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {draft.buyer_email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={draft.status}
                                  color={getStatusColor(draft.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{new Date(draft.updated_at).toLocaleDateString()}</TableCell>
                              <TableCell align="right">${draft.total_value.toLocaleString()}</TableCell>
                              <TableCell align="center">
                                <Button
                                  size="small"
                                  startIcon={<Eye size={16} />}
                                  onClick={() => {
                                    setSelectedDraft(draft);
                                    setTabValue(3);
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
                    {totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={(_, page) => setCurrentPage(page)}
                        />
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Finalized Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardHeader title="Finalized Contracts" />
              <Divider />
              <CardContent>
                {/* Search Bar */}
                <TextField
                  fullWidth
                  placeholder="Search by buyer name, email, ECTA reference, or contract number..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search size={20} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : paginatedDrafts.length === 0 ? (
                  <Typography color="text.secondary">
                    {filteredDrafts.length === 0 && searchQuery
                      ? 'No contracts match your search.'
                      : 'No finalized contracts yet.'}
                  </Typography>
                ) : (
                  <>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell>Contract #</TableCell>
                            <TableCell>Buyer</TableCell>
                            <TableCell>ECTA Reference</TableCell>
                            <TableCell>Finalized Date</TableCell>
                            <TableCell align="right">Total Value</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedDrafts.map((draft) => (
                            <TableRow key={draft.draft_id} hover>
                              <TableCell>{draft.contract_number}</TableCell>
                              <TableCell>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {draft.buyer_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {draft.buyer_email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                {draft.ecta_reference_number ? (
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                                    {draft.ecta_reference_number}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption" color="text.secondary">
                                    Pending
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>{new Date(draft.updated_at).toLocaleDateString()}</TableCell>
                              <TableCell align="right">${draft.total_value.toLocaleString()}</TableCell>
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <Button
                                    size="small"
                                    startIcon={<Eye size={16} />}
                                    onClick={() => {
                                      setSelectedDraft(draft);
                                      setTabValue(3);
                                    }}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    startIcon={<Download size={16} />}
                                    onClick={() => {
                                      setSelectedDraft(draft);
                                      handleDownloadCertificate();
                                    }}
                                  >
                                    Cert
                                  </Button>
                                </Stack>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={(_, page) => setCurrentPage(page)}
                        />
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Create New Draft Tab (Hidden, triggered by button) */}
      {tabValue === 3 && !selectedDraft && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SalesContractDraftForm
              buyerId="temp"
              buyerName="Select Buyer"
              onSubmit={handleCreateDraft}
              loading={loading}
            />
          </Grid>
        </Grid>
      )}

      {/* Details Tab */}
      {tabValue === 3 && selectedDraft && (
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
          )}
        </Grid>
      )}
    </Container>
  );
};

export default SalesContractDashboard;
