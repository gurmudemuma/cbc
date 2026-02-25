import { useState } from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { XCircle, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Rejection Handler Component
 * Displays rejection information and provides resubmission options
 */
const RejectionHandler = ({ exportData, onResubmit }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const isRejectionState = (status) => {
    return status && (
      status.includes('REJECTED') ||
      status === 'ECX_REJECTED' ||
      status === 'ECTA_LICENSE_REJECTED' ||
      status === 'ECTA_QUALITY_REJECTED' ||
      status === 'ECTA_CONTRACT_REJECTED' ||
      status === 'BANK_DOCUMENT_REJECTED' ||
      status === 'FX_REJECTED' ||
      status === 'CUSTOMS_REJECTED' ||
      status === 'SHIPMENT_REJECTED'
    );
  };

  const getRejectionStageLabel = (status) => {
    if (status === 'ECX_REJECTED') return 'ECX Lot Verification';
    if (status === 'ECTA_LICENSE_REJECTED') return 'ECTA License Approval';
    if (status === 'ECTA_QUALITY_REJECTED') return 'ECTA Quality Certification';
    if (status === 'ECTA_CONTRACT_REJECTED') return 'ECTA Contract Approval';
    if (status === 'BANK_DOCUMENT_REJECTED') return 'Commercial Bank Document Verification';
    if (status === 'FX_REJECTED') return 'NBE Foreign Exchange Approval';
    if (status === 'CUSTOMS_REJECTED') return 'Customs Clearance';
    if (status === 'SHIPMENT_REJECTED') return 'Shipment Scheduling';
    return 'Unknown Stage';
  };

  const getRejectionReason = () => {
    const { status } = exportData;
    
    if (status === 'ECX_REJECTED') return exportData.ecxRejectionReason;
    if (status === 'ECTA_LICENSE_REJECTED') return exportData.licenseRejectionReason;
    if (status === 'ECTA_QUALITY_REJECTED') return exportData.qualityRejectionReason;
    if (status === 'ECTA_CONTRACT_REJECTED') return exportData.contractRejectionReason;
    if (status === 'BANK_DOCUMENT_REJECTED') return exportData.bankRejectionReason;
    if (status === 'FX_REJECTED') return exportData.fxRejectionReason;
    if (status === 'CUSTOMS_REJECTED') return exportData.customsRejectionReason;
    if (status === 'SHIPMENT_REJECTED') return exportData.shipmentRejectionReason;
    
    return 'No reason provided';
  };

  const getRequiredActions = (status) => {
    const actions = {
      ECX_REJECTED: [
        'Verify and correct ECX lot number',
        'Ensure warehouse receipt number is valid',
        'Confirm warehouse location details',
        'Contact ECX if you believe this is an error',
      ],
      ECTA_LICENSE_REJECTED: [
        'Check export license validity and expiration date',
        'Verify exporter credentials and TIN',
        'Ensure all license information is accurate',
        'Renew license if expired',
      ],
      ECTA_QUALITY_REJECTED: [
        'Review quality inspection report',
        'Address quality issues identified',
        'Ensure coffee meets minimum quality standards',
        'Request re-inspection if needed',
      ],
      ECTA_CONTRACT_REJECTED: [
        'Review export contract details',
        'Verify buyer information is complete and accurate',
        'Check payment terms and conditions',
        'Ensure contract complies with ECTA regulations',
      ],
      BANK_DOCUMENT_REJECTED: [
        'Review all submitted documents',
        'Ensure all ECTA certificates are valid',
        'Verify commercial invoice matches contract',
        'Check that all required documents are uploaded',
      ],
      FX_REJECTED: [
        'Review FX application details',
        'Ensure export value is correctly stated',
        'Verify all supporting documents are complete',
        'Contact NBE for specific requirements',
      ],
      CUSTOMS_REJECTED: [
        'Review customs declaration',
        'Ensure all documentation is complete',
        'Verify export compliance requirements',
        'Address any tax or duty issues',
      ],
      SHIPMENT_REJECTED: [
        'Review shipment details',
        'Verify transport arrangements',
        'Ensure all shipping documents are ready',
        'Contact shipping line for clarification',
      ],
    };

    return actions[status] || ['Contact support for assistance'];
  };

  const canResubmit = (status) => {
    return isRejectionState(status);
  };

  const handleResubmit = async () => {
    setLoading(true);
    try {
      if (onResubmit) {
        await onResubmit();
      } else {
        // Navigate to edit page
        navigate(`/exports/${exportData.exportId}/edit`);
      }
    } catch (error) {
      console.error('Resubmission error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isRejectionState(exportData.status)) {
    return null;
  }

  const stageLabel = getRejectionStageLabel(exportData.status);
  const rejectionReason = getRejectionReason();
  const requiredActions = getRequiredActions(exportData.status);

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, border: '2px solid #f44336' }}>
      <Alert 
        severity="error" 
        icon={<XCircle size={24} />}
        sx={{ mb: 2 }}
      >
        <AlertTitle sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          Export Rejected at {stageLabel}
        </AlertTitle>
      </Alert>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Rejection Reason:
        </Typography>
        <Paper sx={{ p: 2, bgcolor: '#fff3e0', border: '1px solid #ff9800' }}>
          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <AlertCircle size={20} color="#ff9800" style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{rejectionReason}</span>
          </Typography>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      {canResubmit(exportData.status) && (
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Required Actions to Resubmit:
          </Typography>
          <List dense>
            {requiredActions.map((action, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ArrowRight size={16} color="#1976d2" />
                </ListItemIcon>
                <ListItemText 
                  primary={action}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<RefreshCw size={20} />}
              onClick={handleResubmit}
              disabled={loading}
              fullWidth
            >
              {loading ? 'Processing...' : 'Update Export & Resubmit'}
            </Button>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              After addressing the issues above, you can resubmit your export for review. 
              Make sure all required documents are uploaded and all information is accurate.
            </Typography>
          </Alert>
        </Box>
      )}
    </Paper>
  );
};

export default RejectionHandler;
