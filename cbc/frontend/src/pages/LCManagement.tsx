/**
 * LC Management Page
 * Dashboard for managing Letters of Credit
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  Visibility,
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Description,
} from '@mui/icons-material';
import axios from 'axios';
import LCTracker from '../components/LCTracker';
import LCAcceptanceForm from '../components/LCAcceptanceForm';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`lc-tabpanel-${index}`}
      aria-labelledby={`lc-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

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

const LCManagement: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [lcs, setLcs] = useState<LCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLC, setSelectedLC] = useState<LCData | null>(null);
  const [acceptanceFormOpen, setAcceptanceFormOpen] = useState(false);
  const [acceptanceAction, setAcceptanceAction] = useState<'accept' | 'reject'>('accept');

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

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAccept = (lc: LCData) => {
    setSelectedLC(lc);
    setAcceptanceAction('accept');
    setAcceptanceFormOpen(true);
  };

  const handleReject = (lc: LCData) => {
    setSelectedLC(lc);
    setAcceptanceAction('reject');
    setAcceptanceFormOpen(true);
  };

  const handleAcceptanceSuccess = () => {
    fetchLCs();
  };

  const filterLCs = (status?: string) => {
    if (!status) return lcs;
    return lcs.filter((lc) => lc.status === status);
  };

  const pendingLCs = lcs.filter((lc) => lc.status === 'ISSUED' || lc.status === 'ADVISED');
  const acceptedLCs = lcs.filter((lc) => lc.status === 'ACCEPTED');
  const activeLCs = lcs.filter((lc) => 
    lc.status === 'DOCUMENTS_PRESENTED' || 
    (lc.status === 'ACCEPTED' && lc.nbeApprovalStatus === 'APPROVED')
  );
  const completedLCs = lcs.filter((lc) => lc.status === 'PAID');
  const rejectedLCs = lcs.filter((lc) => 
    lc.status === 'REJECTED' || 
    lc.status === 'EXPIRED' || 
    lc.status === 'CANCELLED'
  );

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

  const renderLCCard = (lc: LCData) => (
    <Card key={lc.lcId} sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>
              {lc.lcNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lc.issuingBankName}
            </Typography>
          </Box>
          <Chip
            label={lc.status.replace(/_/g, ' ')}
            color={getStatusColor(lc.status)}
            size="small"
          />
        </Stack>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Amount
            </Typography>
            <Typography variant="h6" color="primary">
              {formatCurrency(lc.lcAmount, lc.lcCurrency)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">
              Expiry Date
            </Typography>
            <Typography variant="body1">
              {formatDate(lc.expiryDate)}
            </Typography>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              Applicant (Buyer)
            </Typography>
            <Typography variant="body1">
              {lc.applicantName}
            </Typography>
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {(lc.status === 'ISSUED' || lc.status === 'ADVISED') && (
            <>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => handleAccept(lc)}
              >
                Accept
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Cancel />}
                onClick={() => handleReject(lc)}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            size="small"
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => setSelectedLC(lc)}
          >
            View Details
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

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
          Letters of Credit
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchLCs} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {lcs.length === 0 ? (
        <Alert severity="info">
          No Letters of Credit found. LCs will appear here once issued by buyers.
        </Alert>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="LC tabs">
              <Tab
                label={`Pending (${pendingLCs.length})`}
                icon={<HourglassEmpty />}
                iconPosition="start"
              />
              <Tab
                label={`Accepted (${acceptedLCs.length})`}
                icon={<CheckCircle />}
                iconPosition="start"
              />
              <Tab
                label={`Active (${activeLCs.length})`}
                icon={<Description />}
                iconPosition="start"
              />
              <Tab
                label={`Completed (${completedLCs.length})`}
                icon={<CheckCircle />}
                iconPosition="start"
              />
              <Tab
                label={`Rejected (${rejectedLCs.length})`}
                icon={<Cancel />}
                iconPosition="start"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            {pendingLCs.length === 0 ? (
              <Alert severity="info">No pending LCs</Alert>
            ) : (
              pendingLCs.map(renderLCCard)
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {acceptedLCs.length === 0 ? (
              <Alert severity="info">No accepted LCs</Alert>
            ) : (
              acceptedLCs.map(renderLCCard)
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {activeLCs.length === 0 ? (
              <Alert severity="info">No active LCs</Alert>
            ) : (
              activeLCs.map(renderLCCard)
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {completedLCs.length === 0 ? (
              <Alert severity="info">No completed LCs</Alert>
            ) : (
              completedLCs.map(renderLCCard)
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            {rejectedLCs.length === 0 ? (
              <Alert severity="info">No rejected LCs</Alert>
            ) : (
              rejectedLCs.map(renderLCCard)
            )}
          </TabPanel>
        </>
      )}

      {/* LC Details Dialog */}
      {selectedLC && !acceptanceFormOpen && (
        <Box sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            onClick={() => setSelectedLC(null)}
            sx={{ mb: 2 }}
          >
            Back to List
          </Button>
          <LCTracker
            lc={selectedLC}
            onAccept={() => handleAccept(selectedLC)}
            onReject={() => handleReject(selectedLC)}
            showActions={true}
          />
        </Box>
      )}

      {/* Acceptance Form Dialog */}
      {selectedLC && (
        <LCAcceptanceForm
          open={acceptanceFormOpen}
          onClose={() => setAcceptanceFormOpen(false)}
          lcId={selectedLC.lcId}
          lcNumber={selectedLC.lcNumber}
          action={acceptanceAction}
          onSuccess={handleAcceptanceSuccess}
        />
      )}
    </Container>
  );
};

export default LCManagement;
