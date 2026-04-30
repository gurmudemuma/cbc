import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, Box, Typography, Grid, Divider, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Alert,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Stack,
  InputAdornment, TextField,
} from '@mui/material';
import { Link, Eye, Trash2, Search } from 'lucide-react';

interface LinkedContract {
  id: string;
  contract_id: string;
  export_id: string;
  coffee_type_match: boolean;
  quantity_match: boolean;
  quantity_variance: number;
  status: string;
  linked_at: string;
  verified_at?: string;
  shipped_at?: string;
  completed_at?: string;
  contract?: {
    contract_number: string;
    coffee_type: string;
    quantity: number;
    unit_price: number;
    total_value: number;
    buyer_name: string;
    delivery_date: string;
  };
}

interface LinkedContractsViewProps {
  exportId: string;
  onUnlink?: (linkId: string) => void;
  onStatusChange?: (linkId: string, status: string) => void;
  loading?: boolean;
}

const LinkedContractsView = ({
  exportId,
  onUnlink,
  onStatusChange,
  loading = false,
}: LinkedContractsViewProps) => {
  const [linkedContracts, setLinkedContracts] = useState<LinkedContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<LinkedContract | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE = '/api';
  const token = localStorage.getItem('token');

  // Fetch linked contracts
  useEffect(() => {
    if (exportId && token) {
      fetchLinkedContracts();
    }
  }, [exportId, token]);

  const fetchLinkedContracts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/contract-exports/export/${exportId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLinkedContracts(data.contracts || []);
      }
    } catch (err) {
      console.error('Failed to fetch linked contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredContracts = () => {
    if (!searchQuery.trim()) return linkedContracts;
    const query = searchQuery.toLowerCase();
    return linkedContracts.filter(c =>
      c.contract?.contract_number.toLowerCase().includes(query) ||
      c.contract?.coffee_type.toLowerCase().includes(query) ||
      c.contract?.buyer_name.toLowerCase().includes(query)
    );
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'LINKED':
        return 'default';
      case 'VERIFIED':
        return 'info';
      case 'SHIPPED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (contract: LinkedContract) => {
    setSelectedContract(contract);
    setShowDetailsDialog(true);
  };

  const handleUnlink = async () => {
    if (!selectedContract || !onUnlink) return;
    onUnlink(selectedContract.id);
    setShowUnlinkDialog(false);
    setShowDetailsDialog(false);
    setSelectedContract(null);
    fetchLinkedContracts();
  };

  const handleStatusChange = async (linkId: string, newStatus: string) => {
    if (!onStatusChange) return;
    onStatusChange(linkId, newStatus);
    fetchLinkedContracts();
  };

  const filteredContracts = getFilteredContracts();

  return (
    <>
      <Card>
        <CardHeader
          avatar={<Link size={32} color="#1976d2" />}
          title="Linked Contracts"
          subheader={`Export ID: ${exportId}`}
        />
        <Divider />
        <CardContent>
          {linkedContracts.length === 0 ? (
            <Alert severity="info">
              No contracts linked to this export yet. Link a finalized contract to track it with this shipment.
            </Alert>
          ) : (
            <>
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search by contract number, coffee type, or buyer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={20} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : filteredContracts.length === 0 ? (
                <Typography color="text.secondary">
                  No contracts match your search.
                </Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                        <TableCell>Contract #</TableCell>
                        <TableCell>Coffee Type</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell>Buyer</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Linked Date</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredContracts.map((contract) => (
                        <TableRow key={contract.id} hover>
                          <TableCell>{contract.contract?.contract_number}</TableCell>
                          <TableCell>{contract.contract?.coffee_type}</TableCell>
                          <TableCell align="right">{contract.contract?.quantity} bags</TableCell>
                          <TableCell>{contract.contract?.buyer_name}</TableCell>
                          <TableCell>
                            <Chip
                              label={contract.status}
                              color={getStatusColor(contract.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(contract.linked_at).toLocaleDateString()}
                          </TableCell>
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
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Linked Contract Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedContract && (
            <Grid container spacing={2}>
              {/* Contract Information */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Contract Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contract #:</strong> {selectedContract.contract?.contract_number}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Buyer:</strong> {selectedContract.contract?.buyer_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Delivery Date:</strong> {new Date(selectedContract.contract?.delivery_date || '').toLocaleDateString()}
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
                    <strong>Type:</strong> {selectedContract.contract?.coffee_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Quantity:</strong> {selectedContract.contract?.quantity} bags
                  </Typography>
                  <Typography variant="body2">
                    <strong>Unit Price:</strong> ${selectedContract.contract?.unit_price.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>

              {/* Link Status */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Link Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Status:</strong>
                        <Chip
                          label={selectedContract.status}
                          color={getStatusColor(selectedContract.status)}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Linked Date:</strong> {new Date(selectedContract.linked_at).toLocaleString()}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              {/* Validation Results */}
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Validation Results
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={selectedContract.coffee_type_match ? '✓ Coffee Type Match' : '✗ Coffee Type Mismatch'}
                        color={selectedContract.coffee_type_match ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={selectedContract.quantity_match ? '✓ Quantity Match' : '✗ Quantity Mismatch'}
                        color={selectedContract.quantity_match ? 'success' : 'error'}
                        size="small"
                      />
                      {selectedContract.quantity_variance > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          (Variance: {selectedContract.quantity_variance.toFixed(2)}%)
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          <Stack direction="row" spacing={1}>
            {selectedContract && selectedContract.status === 'LINKED' && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleStatusChange(selectedContract.id, 'VERIFIED')}
              >
                Mark Verified
              </Button>
            )}
            {selectedContract && selectedContract.status === 'VERIFIED' && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() => handleStatusChange(selectedContract.id, 'SHIPPED')}
              >
                Mark Shipped
              </Button>
            )}
            {selectedContract && selectedContract.status === 'SHIPPED' && (
              <Button
                variant="outlined"
                color="success"
                onClick={() => handleStatusChange(selectedContract.id, 'COMPLETED')}
              >
                Mark Completed
              </Button>
            )}
            {selectedContract && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<Trash2 size={16} />}
                onClick={() => setShowUnlinkDialog(true)}
              >
                Unlink
              </Button>
            )}
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onClose={() => setShowUnlinkDialog(false)}>
        <DialogTitle>Unlink Contract</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning">
            Are you sure you want to unlink this contract from the export? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUnlinkDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleUnlink}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            Unlink
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LinkedContractsView;
