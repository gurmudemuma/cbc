/**
 * Bank LC Management Page
 * For CBE/Bank officers to manage Letters of Credit
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add,
  Refresh,
  Visibility,
  CheckCircle,
  HourglassEmpty,
  Description,
} from '@mui/icons-material';
import axios from 'axios';
import BankLCCreationForm from '../components/BankLCCreationForm';

interface LCData {
  lcId: string;
  contractId: string;
  exporterId: string;
  lcNumber: string;
  lcType: string;
  issuingBankName: string;
  beneficiaryName: string;
  applicantName: string;
  lcAmount: number;
  lcCurrency: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  nbeApprovalStatus: string;
  exporterResponse?: string;
  createdAt: string;
  updatedAt: string;
}

const BankLCManagement: React.FC = () => {
  const [lcs, setLcs] = useState<LCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createFormOpen, setCreateFormOpen] = useState(false);

  useEffect(() => {
    fetchLCs();
  }, []);

  const fetchLCs = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/lc', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setLcs(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching LCs:', err);
      setError(
        err.response?.data?.error?.details ||
        err.response?.data?.message ||
        'Failed to load Letters of Credit'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    fetchLCs();
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'ISSUED':
      case 'ADVISED':
        return 'info';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
      case 'EXPIRED':
      case 'CANCELLED':
        return 'error';
      case 'DOCUMENTS_PRESENTED':
        return 'warning';
      case 'PAID':
        return 'success';
      default:
        return 'default';
    }
  };

  const getNBEStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Statistics
  const stats = {
    total: lcs.length,
    pending: lcs.filter(lc => lc.status === 'ISSUED' || lc.status === 'ADVISED').length,
    accepted: lcs.filter(lc => lc.status === 'ACCEPTED').length,
    active: lcs.filter(lc => lc.status === 'DOCUMENTS_PRESENTED').length,
    completed: lcs.filter(lc => lc.status === 'PAID').length,
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          LC Management (CBE)
        </Typography>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLCs} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setCreateFormOpen(true)}
          >
            Create LC
          </Button>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3 }}>
        As the advising bank (CBE), you receive LCs from foreign issuing banks via SWIFT MT700.
        Create LC records here to advise exporters of incoming LCs.
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total LCs
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Accepted
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.accepted}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Completed
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* LC Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Letters of Credit
          </Typography>
          {lcs.length === 0 ? (
            <Alert severity="info">
              No Letters of Credit found. Click "Create LC" to record a new LC received from an issuing bank.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>LC Number</TableCell>
                    <TableCell>Issuing Bank</TableCell>
                    <TableCell>Beneficiary</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>NBE Status</TableCell>
                    <TableCell>Exporter Response</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lcs.map((lc) => (
                    <TableRow key={lc.lcId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {lc.lcNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lc.lcType}
                        </Typography>
                      </TableCell>
                      <TableCell>{lc.issuingBankName}</TableCell>
                      <TableCell>{lc.beneficiaryName}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {formatCurrency(lc.lcAmount, lc.lcCurrency)}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(lc.expiryDate)}</TableCell>
                      <TableCell>
                        <Chip
                          label={lc.status.replace(/_/g, ' ')}
                          color={getStatusColor(lc.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={lc.nbeApprovalStatus.replace(/_/g, ' ')}
                          color={getNBEStatusColor(lc.nbeApprovalStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {lc.exporterResponse ? (
                          <Chip
                            label={lc.exporterResponse.replace(/_/g, ' ')}
                            color={lc.exporterResponse === 'ACCEPTED' ? 'success' : 'error'}
                            size="small"
                          />
                        ) : (
                          <Chip label="Pending" color="default" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" color="primary">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create LC Form Dialog */}
      <BankLCCreationForm
        open={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </Container>
  );
};

export default BankLCManagement;
