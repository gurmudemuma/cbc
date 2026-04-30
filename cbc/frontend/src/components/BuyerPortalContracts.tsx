import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, TextField, Grid, Box, Typography,
  Divider, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, Chip,
  InputAdornment, Pagination,
} from '@mui/material';
import { Eye, Download, Send, X, Search } from 'lucide-react';

interface Contract {
  draft_id: string;
  contract_number: string;
  status: string;
  exporter_name: string;
  exporter_email: string;
  coffee_type: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  payment_terms: string;
  incoterms: string;
  delivery_date: string;
  port_of_loading: string;
  port_of_discharge: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}

interface BuyerPortalContractsProps {
  buyerEmail: string;
  onAccept?: (contractId: string) => void;
  onReject?: (contractId: string, reason: string) => void;
  onCounter?: (contractId: string, updates: any, notes: string) => void;
  loading?: boolean;
}

const BuyerPortalContracts = ({
  buyerEmail,
  onAccept,
  onReject,
  onCounter,
  loading = false,
}: BuyerPortalContractsProps) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseAction, setResponseAction] = useState<'ACCEPT' | 'REJECT' | 'COUNTER' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [counterData, setCounterData] = useState({
    quantity: 0,
    unit_price: 0,
    delivery_date: '',
    payment_terms: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const itemsPerPage = 10;

  const API_BASE = '/api';
  const token = localStorage.getItem('token');

  // Fetch contracts for buyer
  useEffect(() => {
    if (buyerEmail && token) {
      fetchContracts();
    }
  }, [buyerEmail, token]);

  const fetchContracts = async () => {
    try {
      const response = await fetch(`${API_BASE}/buyer/contracts?buyer_email=${buyerEmail}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
    }
  };

  const getFilteredContracts = () => {
    if (!searchQuery.trim()) return contracts;
    const query = searchQuery.toLowerCase();
    return contracts.filter(c =>
      c.exporter_name.toLowerCase().includes(query) ||
      c.coffee_type.toLowerCase().includes(query) ||
      c.contract_number.toLowerCase().includes(query)
    );
  };

  const filteredContracts = getFilteredContracts();
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'COUNTERED':
        return 'warning';
      case 'ACCEPTED':
        return 'info';
      case 'REJECTED':
        return 'error';
      case 'FINALIZED':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailsDialog(true);
  };

  const handleResponseClick = (action: 'ACCEPT' | 'REJECT' | 'COUNTER') => {
    setResponseAction(action);
    if (action === 'COUNTER' && selectedContract) {
      setCounterData({
        quantity: selectedContract.quantity,
        unit_price: selectedContract.unit_price,
        delivery_date: selectedContract.delivery_date,
        payment_terms: selectedContract.payment_terms,
        notes: '',
      });
    }
    setShowResponseDialog(true);
  };

  const validateResponse = () => {
    const newErrors: Record<string, string> = {};
    if (responseAction === 'REJECT' && !rejectionReason.trim()) {
      newErrors.reason = 'Please provide a rejection reason';
    }
    if (responseAction === 'COUNTER') {
      if (!counterData.quantity || counterData.quantity <= 0) {
        newErrors.quantity = 'Quantity must be greater than 0';
      }
      if (!counterData.unit_price || counterData.unit_price <= 0) {
        newErrors.unit_price = 'Unit price must be greater than 0';
      }
      if (!counterData.notes.trim()) {
        newErrors.notes = 'Please provide notes for your counter-offer';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitResponse = async () => {
    if (!validateResponse() || !selectedContract) return;

    if (responseAction === 'ACCEPT' && onAccept) {
      onAccept(selectedContract.draft_id);
    } else if (responseAction === 'REJECT' && onReject) {
      onReject(selectedContract.draft_id, rejectionReason);
    } else if (responseAction === 'COUNTER' && onCounter) {
      onCounter(selectedContract.draft_id, {
        quantity: counterData.quantity,
        unit_price: counterData.unit_price,
        delivery_date: counterData.delivery_date,
        payment_terms: counterData.payment_terms,
      }, counterData.notes);
    }

    setShowResponseDialog(false);
    setRejectionReason('');
    setCounterData({ quantity: 0, unit_price: 0, delivery_date: '', payment_terms: '', notes: '' });
    setResponseAction(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Contracts Sent to You"
          subheader={`Buyer: ${buyerEmail}`}
        />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            Review contracts sent by exporters. You can accept, reject, or submit counter-offers.
          </Alert>

          {/* Search Bar */}
          <TextField
            fullWidth
            placeholder="Search by exporter name, coffee type, or contract number..."
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
          ) : paginatedContracts.length === 0 ? (
            <Typography color="text.secondary">
              {filteredContracts.length === 0 && searchQuery
                ? 'No contracts match your search.'
                : 'No contracts sent to you yet.'}
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Contract #</TableCell>
                      <TableCell>Exporter</TableCell>
                      <TableCell>Coffee Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Sent Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedContracts.map((contract) => (
                      <TableRow key={contract.draft_id} hover>
                        <TableCell>{contract.contract_number}</TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {contract.exporter_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {contract.exporter_email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{contract.coffee_type}</TableCell>
                        <TableCell align="right">{contract.quantity} bags</TableCell>
                        <TableCell align="right">${contract.total_value.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={contract.status}
                            color={getStatusColor(contract.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(contract.created_at)}</TableCell>
                        <TableCell align="center">
                          <Button
                            size="small"
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

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details - {selectedContract?.contract_number}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedContract && (
            <Grid container spacing={2}>
              {/* Exporter Information */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Exporter Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {selectedContract.exporter_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedContract.exporter_email}
                  </Typography>
                </Box>
              </Grid>

              {/* Coffee Details */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Coffee Specifications
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedContract.coffee_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Quantity:</strong> {selectedContract.quantity} bags
                  </Typography>
                </Box>
              </Grid>

              {/* Pricing */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Pricing
                  </Typography>
                  <Typography variant="body2">
                    <strong>Unit Price:</strong> ${selectedContract.unit_price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Value:</strong> ${selectedContract.total_value.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>

              {/* Payment & Delivery */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Payment & Delivery
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Terms:</strong> {selectedContract.payment_terms}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Incoterms:</strong> {selectedContract.incoterms}
                  </Typography>
                </Box>
              </Grid>

              {/* Delivery Details */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Delivery Details
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Delivery Date:</strong> {formatDate(selectedContract.delivery_date)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Port of Loading:</strong> {selectedContract.port_of_loading}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Port of Discharge:</strong> {selectedContract.port_of_discharge}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          {selectedContract && selectedContract.status === 'COUNTERED' && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<X size={18} />}
                onClick={() => handleResponseClick('REJECT')}
              >
                Reject
              </Button>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Send size={18} />}
                onClick={() => handleResponseClick('COUNTER')}
              >
                Counter
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => handleResponseClick('ACCEPT')}
              >
                Accept
              </Button>
            </Stack>
          )}
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onClose={() => setShowResponseDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {responseAction === 'ACCEPT' && 'Accept Contract'}
          {responseAction === 'REJECT' && 'Reject Contract'}
          {responseAction === 'COUNTER' && 'Submit Counter-Offer'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {responseAction === 'REJECT' && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Please provide a reason for rejecting this contract.
              </Alert>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Price is too high, delivery date doesn't work, etc."
                error={!!(errors.reason)}
                helperText={errors.reason}
              />
            </>
          )}

          {responseAction === 'COUNTER' && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Propose your counter-offer terms below.
              </Alert>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Quantity (bags)"
                    value={counterData.quantity}
                    onChange={(e) => setCounterData({ ...counterData, quantity: parseInt(e.target.value) || 0 })}
                    inputProps={{ min: 1 }}
                    size="small"
                    error={!!(errors.quantity)}
                    helperText={errors.quantity}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Unit Price (USD)"
                    value={counterData.unit_price}
                    onChange={(e) => setCounterData({ ...counterData, unit_price: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0.01, step: 0.01 }}
                    size="small"
                    error={!!(errors.unit_price)}
                    helperText={errors.unit_price}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Delivery Date"
                    value={counterData.delivery_date}
                    onChange={(e) => setCounterData({ ...counterData, delivery_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Payment Terms"
                    value={counterData.payment_terms}
                    onChange={(e) => setCounterData({ ...counterData, payment_terms: e.target.value })}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 0.5 }}>
                    <Typography variant="caption" color="primary">
                      <strong>Proposed Total Value:</strong> ${(counterData.quantity * counterData.unit_price).toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Notes for Counter-Offer"
                    value={counterData.notes}
                    onChange={(e) => setCounterData({ ...counterData, notes: e.target.value })}
                    placeholder="Explain your proposed changes..."
                    error={!!(errors.notes)}
                    helperText={errors.notes}
                  />
                </Grid>
              </Grid>
            </>
          )}

          {responseAction === 'ACCEPT' && (
            <Alert severity="success">
              You are about to accept this contract. This action cannot be undone.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResponseDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={responseAction === 'REJECT' ? 'error' : 'primary'}
            onClick={handleSubmitResponse}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {responseAction === 'ACCEPT' && 'Accept'}
            {responseAction === 'REJECT' && 'Reject'}
            {responseAction === 'COUNTER' && 'Submit Counter-Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BuyerPortalContracts;
