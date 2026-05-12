/**
 * LC Tracker Component
 * Displays Letter of Credit status and details
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Divider,
  Alert,
  Button,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  LocalShipping,
  Payment,
  Description,
  AccountBalance,
} from '@mui/icons-material';

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

interface LCTrackerProps {
  lc: LCData;
  onAccept?: () => void;
  onReject?: () => void;
  onPresentDocuments?: () => void;
  showActions?: boolean;
}

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
    case 'NOT_REQUIRED':
      return 'default';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'ACCEPTED':
    case 'PAID':
      return <CheckCircle />;
    case 'REJECTED':
    case 'EXPIRED':
    case 'CANCELLED':
      return <Cancel />;
    case 'DOCUMENTS_PRESENTED':
      return <Description />;
    case 'ISSUED':
    case 'ADVISED':
      return <AccountBalance />;
    default:
      return <HourglassEmpty />;
  }
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

const LCTracker: React.FC<LCTrackerProps> = ({
  lc,
  onAccept,
  onReject,
  onPresentDocuments,
  showActions = true,
}) => {
  const isExpiringSoon = () => {
    const expiryDate = new Date(lc.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    const expiryDate = new Date(lc.expiryDate);
    const today = new Date();
    return expiryDate < today;
  };

  const canAcceptReject = lc.status === 'ISSUED' || lc.status === 'ADVISED';
  const canPresentDocuments = lc.status === 'ACCEPTED' && lc.nbeApprovalStatus === 'APPROVED';

  return (
    <Card elevation={3}>
      <CardContent>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" component="h2">
              Letter of Credit
            </Typography>
            <Chip
              label={lc.status.replace(/_/g, ' ')}
              color={getStatusColor(lc.status)}
              icon={getStatusIcon(lc.status)}
            />
          </Stack>
          <Typography variant="h6" color="primary" gutterBottom>
            {lc.lcNumber}
          </Typography>
        </Box>

        {/* Expiry Warning */}
        {isExpiringSoon() && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This LC expires in {Math.ceil((new Date(lc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
          </Alert>
        )}
        {isExpired() && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This LC has expired
          </Alert>
        )}

        {/* LC Details */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              LC Type
            </Typography>
            <Typography variant="body1" gutterBottom>
              {lc.lcType.replace(/_/g, ' ')}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Amount
            </Typography>
            <Typography variant="h6" color="primary" gutterBottom>
              {formatCurrency(lc.lcAmount, lc.lcCurrency)}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Issuing Bank
            </Typography>
            <Typography variant="body1" gutterBottom>
              {lc.issuingBankName}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Issue Date
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(lc.issueDate)}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              Expiry Date
            </Typography>
            <Typography variant="body1" gutterBottom>
              {formatDate(lc.expiryDate)}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
              NBE Approval Status
            </Typography>
            <Chip
              label={lc.nbeApprovalStatus.replace(/_/g, ' ')}
              color={getNBEStatusColor(lc.nbeApprovalStatus)}
              size="small"
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Parties */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Beneficiary (Exporter)
            </Typography>
            <Typography variant="body1" gutterBottom>
              {lc.beneficiaryName}
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">
              Applicant (Buyer)
            </Typography>
            <Typography variant="body1" gutterBottom>
              {lc.applicantName}
            </Typography>
          </Grid>
        </Grid>

        {/* Exporter Response */}
        {lc.exporterResponse && (
          <>
            <Divider sx={{ my: 3 }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Your Response
              </Typography>
              <Chip
                label={lc.exporterResponse.replace(/_/g, ' ')}
                color={lc.exporterResponse === 'ACCEPTED' ? 'success' : 'error'}
                size="small"
              />
            </Box>
          </>
        )}

        {/* Actions */}
        {showActions && (
          <>
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={2}>
              {canAcceptReject && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={onAccept}
                  >
                    Accept LC
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={onReject}
                  >
                    Reject LC
                  </Button>
                </>
              )}
              {canPresentDocuments && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<Description />}
                  onClick={onPresentDocuments}
                >
                  Present Documents
                </Button>
              )}
            </Stack>
          </>
        )}

        {/* Status Timeline */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" gutterBottom>
          LC Timeline
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <AccountBalance color="primary" />
            </ListItemIcon>
            <ListItemText
              primary="LC Issued"
              secondary={`${formatDate(lc.issueDate)} - Issued by ${lc.issuingBankName}`}
            />
          </ListItem>

          {lc.exporterResponse && (
            <ListItem>
              <ListItemIcon>
                {lc.exporterResponse === 'ACCEPTED' ? (
                  <CheckCircle color="success" />
                ) : (
                  <Cancel color="error" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={lc.exporterResponse === 'ACCEPTED' ? 'LC Accepted' : 'LC Rejected'}
                secondary={`${formatDate(lc.updatedAt)} - By exporter`}
              />
            </ListItem>
          )}

          {lc.status === 'DOCUMENTS_PRESENTED' && (
            <ListItem>
              <ListItemIcon>
                <Description color="warning" />
              </ListItemIcon>
              <ListItemText
                primary="Documents Presented"
                secondary={`${formatDate(lc.updatedAt)} - Awaiting bank review`}
              />
            </ListItem>
          )}

          {lc.status === 'PAID' && (
            <ListItem>
              <ListItemIcon>
                <Payment color="success" />
              </ListItemIcon>
              <ListItemText
                primary="Payment Received"
                secondary={`${formatDate(lc.updatedAt)} - ${formatCurrency(lc.lcAmount, lc.lcCurrency)}`}
              />
            </ListItem>
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default LCTracker;
