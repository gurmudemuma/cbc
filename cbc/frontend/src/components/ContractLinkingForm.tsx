import { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Button, Box, Typography, Grid, Divider,
  Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Select,
  MenuItem, FormControl, InputLabel, Stack, Chip, Table, TableBody, TableCell,
  TableContainer, TableRow, Paper,
} from '@mui/material';
import { Link, CheckCircle, AlertCircle } from 'lucide-react';

interface Contract {
  draft_id: string;
  contract_number: string;
  status: string;
  coffee_type: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  buyer_name: string;
  delivery_date: string;
}

interface ContractLinkingFormProps {
  exportId: string;
  exportData?: {
    coffee_type: string;
    quantity: number;
  };
  onLink?: (contractId: string) => void;
  loading?: boolean;
}

const ContractLinkingForm = ({
  exportId,
  exportData,
  onLink,
  loading = false,
}: ContractLinkingFormProps) => {
  const [availableContracts, setAvailableContracts] = useState<Contract[]>([]);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = '/api';
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.id;

  // Fetch available contracts
  useEffect(() => {
    if (userId && token) {
      fetchAvailableContracts();
    }
  }, [userId, token]);

  const fetchAvailableContracts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/contracts/drafts/exporter/${userId}?status=FINALIZED`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableContracts(data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to fetch contracts:', err);
      setError('Failed to load available contracts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContractSelect = async (contractId: string) => {
    setSelectedContractId(contractId);
    const contract = availableContracts.find(c => c.draft_id === contractId);
    setSelectedContract(contract || null);

    if (contract && exportData) {
      // Validate contract-export link
      try {
        const response = await fetch(`${API_BASE}/contract-exports/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contractId,
            exportId,
            exportData,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setValidation(data);
        }
      } catch (err) {
        console.error('Failed to validate contract-export link:', err);
      }
    }
  };

  const handleLink = async () => {
    if (!selectedContractId) {
      setError('Please select a contract');
      return;
    }

    if (onLink) {
      onLink(selectedContractId);
    }
  };

  const handlePreview = () => {
    setShowPreviewDialog(true);
  };

  return (
    <>
      <Card>
        <CardHeader
          avatar={<Link size={32} color="#1976d2" />}
          title="Link Contract to Export"
          subheader={`Export ID: ${exportId}`}
        />
        <Divider />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : availableContracts.length === 0 ? (
            <Alert severity="info">
              No finalized contracts available to link. Create and finalize a contract first.
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {/* Contract Selection */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Contract</InputLabel>
                  <Select
                    value={selectedContractId}
                    onChange={(e) => handleContractSelect(e.target.value)}
                    label="Select Contract"
                  >
                    {availableContracts.map((contract) => (
                      <MenuItem key={contract.draft_id} value={contract.draft_id}>
                        {contract.contract_number} - {contract.coffee_type} ({contract.quantity} bags)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Selected Contract Details */}
              {selectedContract && (
                <>
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Selected Contract Details
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableBody>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, width: '30%' }}>Contract #</TableCell>
                              <TableCell>{selectedContract.contract_number}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Coffee Type</TableCell>
                              <TableCell>{selectedContract.coffee_type}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                              <TableCell>{selectedContract.quantity} bags</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                              <TableCell>${selectedContract.unit_price.toFixed(2)}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Total Value</TableCell>
                              <TableCell sx={{ fontWeight: 600, color: 'success.main' }}>
                                ${selectedContract.total_value.toLocaleString()}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Buyer</TableCell>
                              <TableCell>{selectedContract.buyer_name}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Delivery Date</TableCell>
                              <TableCell>
                                {new Date(selectedContract.delivery_date).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Grid>

                  {/* Validation Results */}
                  {validation && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: validation.valid ? '#f0fdf4' : '#fef2f2', borderRadius: 1, border: `1px solid ${validation.valid ? '#22c55e' : '#ef4444'}` }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1 }}>
                          {validation.valid ? (
                            <CheckCircle size={20} color="#22c55e" />
                          ) : (
                            <AlertCircle size={20} color="#ef4444" />
                          )}
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {validation.valid ? 'Validation Passed' : 'Validation Issues'}
                          </Typography>
                        </Stack>

                        {validation.errors && validation.errors.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                              Errors:
                            </Typography>
                            {validation.errors.map((error: string, idx: number) => (
                              <Typography key={idx} variant="caption" color="error" display="block">
                                • {error}
                              </Typography>
                            ))}
                          </Box>
                        )}

                        {validation.warnings && validation.warnings.length > 0 && (
                          <Box>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                              Warnings:
                            </Typography>
                            {validation.warnings.map((warning: string, idx: number) => (
                              <Typography key={idx} variant="caption" color="warning.main" display="block">
                                ⚠ {warning}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {/* Export Data Comparison */}
                  {exportData && (
                    <Grid item xs={12}>
                      <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Export vs Contract Comparison
                        </Typography>
                        <TableContainer>
                          <Table size="small">
                            <TableBody>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, width: '30%' }}>Coffee Type</TableCell>
                                <TableCell sx={{ width: '35%' }}>
                                  Export: {exportData.coffee_type}
                                </TableCell>
                                <TableCell sx={{ width: '35%' }}>
                                  Contract: {selectedContract.coffee_type}
                                  {exportData.coffee_type === selectedContract.coffee_type ? (
                                    <Chip label="Match" size="small" color="success" sx={{ ml: 1 }} />
                                  ) : (
                                    <Chip label="Mismatch" size="small" color="error" sx={{ ml: 1 }} />
                                  )}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                                <TableCell>
                                  Export: {exportData.quantity} bags
                                </TableCell>
                                <TableCell>
                                  Contract: {selectedContract.quantity} bags
                                  {Math.abs(exportData.quantity - selectedContract.quantity) / selectedContract.quantity * 100 <= 5 ? (
                                    <Chip label="Match" size="small" color="success" sx={{ ml: 1 }} />
                                  ) : (
                                    <Chip label="Variance" size="small" color="warning" sx={{ ml: 1 }} />
                                  )}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          )}
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Stack direction="row" spacing={1}>
            {selectedContract && (
              <Button
                variant="outlined"
                onClick={handlePreview}
              >
                Preview
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Link size={18} />}
              onClick={handleLink}
              disabled={!selectedContractId || loading || (validation && !validation.valid)}
            >
              {loading ? 'Linking...' : 'Link Contract'}
            </Button>
          </Stack>
        </CardActions>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onClose={() => setShowPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Contract Preview</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedContract && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Contract Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Contract #:</strong> {selectedContract.contract_number}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {selectedContract.status}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Buyer:</strong> {selectedContract.buyer_name}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Coffee Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedContract.coffee_type}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Quantity:</strong> {selectedContract.quantity} bags
                  </Typography>
                  <Typography variant="body2">
                    <strong>Unit Price:</strong> ${selectedContract.unit_price.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ContractLinkingForm;
