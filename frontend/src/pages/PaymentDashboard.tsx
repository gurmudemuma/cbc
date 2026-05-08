import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Description as DocumentIcon,
  AccountBalance as BankIcon,
  LocalShipping as ShipIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as MoneyIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import apiClient from '../services/api';

// Professional color scheme: Black text, Purple & Golden from logo, White backgrounds
const colors = {
  purple: {
    main: '#9333EA', // Vibrant purple from logo
    light: '#A855F7',
    dark: '#7E22CE',
    gradient: 'linear-gradient(135deg, #9333EA 0%, #7E22CE 100%)'
  },
  golden: {
    main: '#FBBF24', // Bright golden yellow from logo
    light: '#FCD34D',
    dark: '#F59E0B',
    gradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)'
  },
  text: {
    primary: '#000000', // Black text only
    secondary: '#424242' // Dark gray for secondary text
  },
  background: {
    main: '#FFFFFF', // White background
    paper: '#FAFAFA', // Light gray for cards
    light: '#F5F5F5'
  }
};

interface PaymentDashboardProps {
  user: any;
  org: string | null;
}

const PaymentDashboard: React.FC<PaymentDashboardProps> = ({ user, org }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [ledger, setLedger] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openLedgerDialog, setOpenLedgerDialog] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadPayments();
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await apiClient.get('/api/payments/statistics');
      setStatistics(response.data?.statistics || null);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  };

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/payments/dashboard/all');
      setPayments(response.data?.payments || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLedger = async (payment: any) => {
    try {
      setSelectedPayment(payment);
      const response = await apiClient.get(`/api/payments/dashboard/ledger/${payment.payment_id}`);
      setLedger(response.data?.ledger || null);
      setOpenLedgerDialog(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load payment ledger');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return colors.golden.main;
      case 'APPROVED':
        return colors.purple.light;
      case 'FAILED':
      case 'DISPUTED':
        return colors.purple.dark; // Use purple instead of red
      case 'UNDER_REVIEW':
      case 'PROCESSING':
        return colors.purple.main;
      default:
        return colors.golden.dark;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon />;
      case 'FAILED':
      case 'DISPUTED':
        return <CancelIcon />;
      case 'UNDER_REVIEW':
      case 'PROCESSING':
        return <PendingIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const formatCurrency = (amount: number, curr: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr
    }).format(amount);
  };

  const getTimelineColor = (action: string) => {
    if (action.includes('APPROVED') || action.includes('COMPLETED')) return colors.golden.main;
    if (action.includes('REJECTED') || action.includes('FAILED')) return colors.purple.dark; // Use purple instead of red
    if (action.includes('REVIEW')) return colors.purple.main;
    return colors.purple.light;
  };

  return (
    <Box sx={{ p: 3, bgcolor: colors.background.main, minHeight: '100vh' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" sx={{ 
            color: colors.text.primary,
            fontWeight: 'bold'
          }}>
            Payment Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Complete payment tracking for all parties - CBE, Importer Bank, ECTA, NBE
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadPayments}
          sx={{
            borderColor: colors.purple.main,
            color: colors.purple.main,
            '&:hover': {
              borderColor: colors.purple.dark,
              bgcolor: 'rgba(106, 27, 154, 0.1)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Statistics Cards */}
      {statistics && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ 
              background: colors.purple.gradient,
              color: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.9, mb: 1 }}>
                      Total Payments
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
                      {statistics.total_payments || 0}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 60, opacity: 0.3, color: '#FFFFFF' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              background: colors.golden.gradient,
              color: '#FFFFFF',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.9, mb: 1, fontWeight: 600 }}>
                      Completed
                    </Typography>
                    <Typography variant="h3" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
                      {statistics.completed_payments || 0}
                    </Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 60, opacity: 0.3, color: '#FFFFFF' }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              bgcolor: colors.background.paper,
              border: `2px solid ${colors.purple.main}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1 }}>
                      Total Value
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: colors.text.primary }}>
                      {formatCurrency(statistics.total_completed_amount || 0)}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 60, opacity: 0.3, color: colors.purple.main }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ 
              bgcolor: colors.background.paper,
              border: `2px solid ${colors.golden.main}`
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1 }}>
                      Pending Amount
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: colors.text.primary }}>
                      {formatCurrency(statistics.total_pending_amount || 0)}
                    </Typography>
                  </Box>
                  <PendingIcon sx={{ fontSize: 60, opacity: 0.3, color: colors.golden.main }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Payments Table */}
      <Card sx={{ 
        bgcolor: colors.background.paper,
        border: `1px solid ${colors.purple.main}`
      }}>
        <CardContent>
          <Typography variant="h6" sx={{ 
            color: colors.text.primary,
            mb: 2,
            fontWeight: 'bold'
          }}>
            All Payments
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress sx={{ color: colors.purple.main }} />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ bgcolor: colors.background.main }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: colors.purple.main }}>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Payment ID</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Exporter</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Buyer</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Coffee Type</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Method</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Initiated By</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Reviewing Bank</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ color: colors.text.secondary, py: 4 }}>
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow 
                        key={payment.payment_id}
                        sx={{ 
                          '&:hover': { bgcolor: 'rgba(106, 27, 154, 0.05)' },
                          borderBottom: `1px solid ${colors.background.light}`
                        }}
                      >
                        <TableCell sx={{ color: colors.text.primary, fontFamily: 'monospace' }}>
                          {payment.payment_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell sx={{ color: colors.text.primary }}>
                          {payment.exporter_name || 'N/A'}
                        </TableCell>
                        <TableCell sx={{ color: colors.text.primary }}>
                          {payment.buyer_name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colors.text.primary }}>
                            {payment.coffee_type || 'N/A'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            {payment.quantity ? `${payment.quantity} kg` : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                            {formatCurrency(payment.amount, payment.currency)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={payment.payment_method} 
                            size="small"
                            sx={{
                              bgcolor: colors.purple.main,
                              color: '#FFFFFF',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payment.status}
                            size="small"
                            icon={getStatusIcon(payment.status)}
                            sx={{
                              bgcolor: getStatusColor(payment.status),
                              color: '#FFFFFF',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<BankIcon />}
                            label={payment.processing_bank || 'CBE'}
                            size="small"
                            sx={{
                              bgcolor: colors.purple.main,
                              color: '#FFFFFF'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={<BankIcon />}
                            label={payment.lc_issuing_bank || 'Importer Bank'}
                            size="small"
                            sx={{
                              bgcolor: colors.golden.main,
                              color: '#FFFFFF'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: colors.text.primary }}>
                          {payment.initiated_at
                            ? new Date(payment.initiated_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Complete Ledger">
                            <IconButton
                              size="small"
                              onClick={() => handleViewLedger(payment)}
                              sx={{
                                color: colors.purple.main,
                                '&:hover': { bgcolor: 'rgba(106, 27, 154, 0.1)' }
                              }}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Payment Ledger Dialog */}
      <Dialog
        open={openLedgerDialog}
        onClose={() => setOpenLedgerDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.background.main,
            border: `2px solid ${colors.purple.main}`
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: colors.purple.main,
          color: '#FFFFFF'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <DocumentIcon sx={{ color: colors.golden.main }} />
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#FFFFFF' }}>Complete Payment Ledger</Typography>
              <Typography variant="caption" sx={{ color: '#FFFFFF', opacity: 0.9 }}>
                Full audit trail visible to all parties
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: colors.background.main, pt: 4, pb: 3 }}>
          {ledger && (
            <Grid container spacing={4}>
              {/* Payment Summary */}
              <Grid item xs={12}>
                <Card sx={{ 
                  background: colors.golden.gradient,
                  color: '#FFFFFF'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ color: '#FFFFFF', mb: 2 }}>
                      Payment Summary
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.9, mb: 1.5 }}>
                          Amount
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
                          {formatCurrency(ledger.payment.amount, ledger.payment.currency)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.9, mb: 1.5 }}>
                          Status
                        </Typography>
                        <Chip
                          label={ledger.payment.status}
                          sx={{
                            bgcolor: getStatusColor(ledger.payment.status),
                            color: '#FFFFFF',
                            fontWeight: 'bold'
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.9, mb: 1.5 }}>
                          Exporter
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
                          {ledger.payment.exporter_name}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6} md={3}>
                        <Typography variant="body2" sx={{ color: '#FFFFFF', opacity: 0.9, mb: 1.5 }}>
                          Buyer
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ color: '#FFFFFF' }}>
                          {ledger.payment.buyer_name || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              {/* Payment Flow - Correct Ethiopian Coffee Export Process */}
              <Grid item xs={12}>
                <Card sx={{ 
                  bgcolor: colors.background.paper,
                  border: `1px solid ${colors.purple.main}`
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: colors.text.primary, fontWeight: 'bold', mb: 1 }}>
                      Payment Flow
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block', mb: 4 }}>
                      Payment after sales contract is signed and registered on ECTA. Export process comes to exporter bank, then exporter bank initiates payment from importer/buyer side bank by sending documents received from exporter. Importer/buyer side bank reviews and approves all documents as agreed during sales contract negotiation.
                    </Typography>
                    
                    <Divider sx={{ mb: 3, borderColor: colors.purple.main, opacity: 0.3 }} />
                    
                    {/* Desktop Flow - Horizontal */}
                    <Box sx={{ 
                      display: { xs: 'none', lg: 'flex' }, 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: 2,
                      px: 2
                    }}>
                      {/* Step 1: Export Process Comes to Exporter Bank */}
                      <Box sx={{ flex: '1 1 0', textAlign: 'center', minWidth: 0 }}>
                        <PersonIcon sx={{ fontSize: 50, color: colors.purple.main, mb: 1.5 }} />
                        <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary, mb: 0.5 }}>
                          Export Process
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          Comes to
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          Exporter Bank
                        </Typography>
                      </Box>
                      
                      <ArrowForwardIcon sx={{ color: colors.golden.main, fontSize: 28, flexShrink: 0 }} />
                      
                      {/* Step 2: CBE (Exporter Bank) Initiates Payment */}
                      <Box sx={{ flex: '1 1 0', textAlign: 'center', minWidth: 0 }}>
                        <BankIcon sx={{ fontSize: 50, color: colors.purple.main, mb: 1.5 }} />
                        <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary, mb: 0.5 }}>
                          CBE (Exporter Bank)
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          Initiates Payment &
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          Sends Documents
                        </Typography>
                      </Box>
                      
                      <ArrowForwardIcon sx={{ color: colors.golden.main, fontSize: 28, flexShrink: 0 }} />
                      
                      {/* Step 3: Importer/Buyer Bank Reviews & Approves */}
                      <Box sx={{ flex: '1 1 0', textAlign: 'center', minWidth: 0 }}>
                        <BankIcon sx={{ fontSize: 50, color: colors.golden.main, mb: 1.5 }} />
                        <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary, mb: 0.5 }}>
                          Importer/Buyer Bank
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          Reviews & Approves
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          Documents
                        </Typography>
                      </Box>
                      
                      <ArrowForwardIcon sx={{ color: colors.golden.main, fontSize: 28, flexShrink: 0 }} />
                      
                      {/* Step 4: Payment Complete */}
                      <Box sx={{ flex: '1 1 0', textAlign: 'center', minWidth: 0 }}>
                        <CheckCircleIcon sx={{ fontSize: 50, color: colors.golden.main, mb: 1.5 }} />
                        <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary, mb: 0.5 }}>
                          Payment Complete
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          Funds Transferred
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.text.secondary, display: 'block' }}>
                          to Exporter
                        </Typography>
                      </Box>
                    </Box>

                    {/* Mobile/Tablet Flow - Vertical */}
                    <Box sx={{ display: { xs: 'block', lg: 'none' } }}>
                      {/* Step 1 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                        <Box sx={{ 
                          bgcolor: colors.purple.main, 
                          color: '#FFFFFF', 
                          borderRadius: '50%', 
                          width: 40, 
                          height: 40, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          1
                        </Box>
                        <PersonIcon sx={{ fontSize: 40, color: colors.purple.main, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                            Export Process Comes to Exporter Bank
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            After sales contract is signed and registered on ECTA, export process comes to exporter bank (CBE)
                          </Typography>
                        </Box>
                      </Box>

                      {/* Step 2 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                        <Box sx={{ 
                          bgcolor: colors.purple.main, 
                          color: '#FFFFFF', 
                          borderRadius: '50%', 
                          width: 40, 
                          height: 40, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          2
                        </Box>
                        <BankIcon sx={{ fontSize: 40, color: colors.purple.main, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                            CBE (Exporter Bank) Initiates Payment
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            Exporter bank initiates payment from importer/buyer side bank by sending documents received from exporter
                          </Typography>
                        </Box>
                      </Box>

                      {/* Step 3 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                        <Box sx={{ 
                          bgcolor: colors.golden.main, 
                          color: '#FFFFFF', 
                          borderRadius: '50%', 
                          width: 40, 
                          height: 40, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          3
                        </Box>
                        <BankIcon sx={{ fontSize: 40, color: colors.golden.main, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                            Importer/Buyer Bank Reviews & Approves
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            Importer/buyer side bank reviews and approves all documents as agreed during sales contract negotiation
                          </Typography>
                        </Box>
                      </Box>

                      {/* Step 4 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                          bgcolor: colors.golden.main, 
                          color: '#FFFFFF', 
                          borderRadius: '50%', 
                          width: 40, 
                          height: 40, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          4
                        </Box>
                        <CheckCircleIcon sx={{ fontSize: 40, color: colors.golden.main, flexShrink: 0 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" fontWeight="bold" sx={{ color: colors.text.primary }}>
                            Payment Complete
                          </Typography>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            Funds transferred to exporter after approval
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Documents */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  bgcolor: colors.background.paper,
                  border: `1px solid ${colors.golden.main}`,
                  height: '100%'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: colors.text.primary, fontWeight: 'bold', mb: 3 }}>
                      Submitted Documents ({ledger.documents.length})
                    </Typography>
                    <List>
                      {ledger.documents.map((doc: any) => (
                        <ListItem
                          key={doc.document_id}
                          sx={{
                            border: '1px solid',
                            borderColor: doc.review_status === 'APPROVED' ? colors.golden.main :
                                       doc.review_status === 'REJECTED' ? colors.purple.dark :
                                       colors.purple.main,
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: doc.review_status === 'APPROVED' ? 'rgba(251, 191, 36, 0.1)' :
                                     doc.review_status === 'REJECTED' ? 'rgba(126, 34, 206, 0.1)' :
                                     'rgba(147, 51, 234, 0.1)'
                          }}
                        >
                          <DocumentIcon sx={{ mr: 2, color: colors.golden.main }} />
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" fontWeight="medium" sx={{ color: colors.text.primary }}>
                                  {doc.document_name}
                                </Typography>
                                <Chip
                                  label={doc.review_status || 'PENDING'}
                                  sx={{
                                    bgcolor: doc.review_status === 'APPROVED' ? colors.golden.main :
                                            doc.review_status === 'REJECTED' ? colors.purple.dark :
                                            colors.purple.main,
                                    color: '#FFFFFF',
                                    fontWeight: 'bold'
                                  }}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="caption" display="block" sx={{ color: colors.text.secondary }}>
                                  Type: {doc.document_type}
                                </Typography>
                                {doc.reviewed_by && (
                                  <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                    Reviewed by: {doc.reviewed_by}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Audit Trail */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  bgcolor: colors.background.paper,
                  border: `1px solid ${colors.purple.main}`,
                  height: '100%'
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: colors.text.primary, fontWeight: 'bold', mb: 3 }}>
                      Audit Trail
                    </Typography>
                    <List>
                      {ledger.audit_trail.map((audit: any) => (
                        <ListItem
                          key={audit.log_id}
                          sx={{
                            border: '1px solid',
                            borderColor: colors.purple.main,
                            borderRadius: 1,
                            mb: 1,
                            bgcolor: 'rgba(106, 27, 154, 0.05)',
                            flexDirection: 'column',
                            alignItems: 'flex-start'
                          }}
                        >
                          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                              {audit.action.replace(/_/g, ' ')}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                              {new Date(audit.performed_at).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                            By: {audit.performed_by}
                          </Typography>
                          {audit.new_status && (
                            <Chip
                              label={audit.new_status}
                              size="small"
                              sx={{
                                mt: 0.5,
                                bgcolor: getStatusColor(audit.new_status),
                                color: '#FFFFFF',
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: colors.background.paper, borderTop: `1px solid ${colors.purple.main}` }}>
          <Button 
            onClick={() => setOpenLedgerDialog(false)}
            sx={{
              color: colors.purple.main,
              '&:hover': { bgcolor: 'rgba(106, 27, 154, 0.1)' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentDashboard;
