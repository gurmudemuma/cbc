import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Paper,
  Divider,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from '@mui/material';
import {
  Search,
  CheckCircle,
  FileText,
  User,
  Building,
  Package,
  DollarSign,
  Calendar,
  MapPin,
  Shield,
  AlertCircle,
} from 'lucide-react';
import bankingService from '../services/bankingService';

const SalesContractVerification: React.FC = () => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractData, setContractData] = useState<any>(null);

  const handleVerify = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter a reference number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setContractData(null);

      const response = await bankingService.verifySalesContract(referenceNumber.trim());

      if (response.success) {
        setContractData(response.data);
      } else {
        setError(response.error || 'Contract not found');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Failed to verify sales contract');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case 'FINALIZED':
        return 'success';
      case 'ACCEPTED':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Shield size={24} /> Sales Contract Verification
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verify registered sales contracts using ECTA-generated reference numbers
        </Typography>
      </Box>

      {/* Search Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <TextField
              fullWidth
              label="ECTA Reference Number"
              placeholder="e.g., ECTA-SC-2026-00001"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              helperText="Enter the ECTA-generated sales contract reference number"
            />
            <Button
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <Search />}
              onClick={handleVerify}
              disabled={loading || !referenceNumber.trim()}
              sx={{ minWidth: 120, height: 56 }}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Contract Details */}
      {contractData && (
        <Grid container spacing={3}>
          {/* Status Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: '#f0f9ff', border: '1px solid #0ea5e9' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <CheckCircle size={32} color="#0ea5e9" />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" color="primary">
                    Contract Verified Successfully
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Reference: {contractData.referenceNumber}
                  </Typography>
                </Box>
                <Chip
                  label={contractData.status}
                  color={getStatusColor(contractData.status)}
                  sx={{ fontWeight: 600, fontSize: '1rem', py: 2.5, px: 1 }}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* Exporter Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <User size={20} /> Exporter Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '40%' }}>Business Name</TableCell>
                        <TableCell>{contractData.exporter.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Registration Number</TableCell>
                        <TableCell>{contractData.exporter.registration}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>TIN</TableCell>
                        <TableCell>{contractData.exporter.tin}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Exporter ID</TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {contractData.exporter.id}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Buyer Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Building size={20} /> Buyer Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '40%' }}>Company Name</TableCell>
                        <TableCell>{contractData.buyer.name}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Country</TableCell>
                        <TableCell>{contractData.buyer.country}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Registration</TableCell>
                        <TableCell>{contractData.buyer.registration || 'N/A'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Buyer ID</TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {contractData.buyer.id}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Contract Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <FileText size={20} /> Contract Details
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, width: '40%' }}>
                              <Package size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Coffee Type
                            </TableCell>
                            <TableCell>{contractData.contract.coffeeType}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Origin Region
                            </TableCell>
                            <TableCell>{contractData.contract.originRegion}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                            <TableCell>{contractData.contract.quantity} kg</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Quality Grade</TableCell>
                            <TableCell>
                              <Chip label={contractData.contract.qualityGrade} size="small" color="primary" />
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <DollarSign size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Unit Price
                            </TableCell>
                            <TableCell>
                              {contractData.contract.currency} {contractData.contract.unitPrice}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Total Value</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'success.main', fontSize: '1.1rem' }}>
                              {contractData.contract.currency} {contractData.contract.totalValue?.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, width: '40%' }}>Payment Method</TableCell>
                            <TableCell>{contractData.contract.paymentMethod}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Payment Terms</TableCell>
                            <TableCell>{contractData.contract.paymentTerms}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Incoterms</TableCell>
                            <TableCell>{contractData.contract.incoterms}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Port of Loading</TableCell>
                            <TableCell>{contractData.contract.portOfLoading}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Port of Discharge</TableCell>
                            <TableCell>{contractData.contract.portOfDischarge}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>
                              <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                              Delivery Date
                            </TableCell>
                            <TableCell>
                              {new Date(contractData.contract.deliveryDate).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Legal Framework */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Shield size={20} /> Legal Framework
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '50%' }}>Governing Law</TableCell>
                        <TableCell>{contractData.contract.governingLaw}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Arbitration Rules</TableCell>
                        <TableCell>{contractData.contract.arbitrationRules}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Arbitration Location</TableCell>
                        <TableCell>{contractData.contract.arbitrationLocation}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Registration Info */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircle size={20} /> Registration Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '50%' }}>Reference Number</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 600 }}>
                          {contractData.referenceNumber}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Registered At</TableCell>
                        <TableCell>
                          {new Date(contractData.registeredAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Registered By</TableCell>
                        <TableCell>{contractData.registeredBy || 'ECTA Officer'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Blockchain Verification */}
          {contractData.blockchainVerification && !contractData.blockchainVerification.error && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, bgcolor: '#f0fdf4', border: '1px solid #22c55e' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <CheckCircle size={24} color="#22c55e" />
                  <Box>
                    <Typography variant="h6" color="success.main">
                      Blockchain Verified
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      This contract is registered and verified on the blockchain network
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          )}

          {/* Blockchain Error */}
          {contractData.blockchainVerification?.error && (
            <Grid item xs={12}>
              <Alert severity="warning" icon={<AlertCircle />}>
                <Typography variant="body2">
                  Contract found in database but blockchain verification failed. This may indicate a synchronization issue.
                </Typography>
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      {/* Info Box */}
      {!contractData && !error && !loading && (
        <Alert severity="info" icon={<AlertCircle />}>
          <Typography variant="body2">
            Enter an ECTA-generated reference number (format: ECTA-SC-YYYY-XXXXX) to verify a registered sales contract.
            This verification checks both the database and blockchain records.
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default SalesContractVerification;
