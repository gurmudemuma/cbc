// @ts-nocheck
import { useState } from 'react';
import { Button, Stack, Alert, AlertTitle, CircularProgress } from '@mui/material';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../services/api';

/**
 * Exporter Submission Actions Component
 * Displays submission buttons based on current export status
 */
const ExporterSubmissionActions = ({ exportData, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (endpoint, successMessage) => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await apiClient.post(`/exports/${exportData.exportId}/${endpoint}`);
      
      setMessage({
        type: 'success',
        text: successMessage,
        data: response.data.data,
      });

      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Submission failed';
      
      setMessage({
        type: 'error',
        text: errorMessage,
      });

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionAction = () => {
    const { status } = exportData;

    switch (status) {
      case 'DRAFT':
        return {
          endpoint: 'submit-to-ecx',
          label: 'Submit to ECX for Lot Verification',
          description: 'Submit your export request to Ethiopian Commodity Exchange for lot number verification and warehouse receipt validation.',
          icon: <Send size={20} />,
          color: 'primary',
        };

      case 'ECX_VERIFIED':
        return {
          endpoint: 'submit-to-ecta',
          label: 'Submit to ECTA for License Approval',
          description: 'Submit to Ethiopian Coffee & Tea Authority for export license validation and regulatory approval.',
          icon: <Send size={20} />,
          color: 'primary',
        };

      case 'ECTA_CONTRACT_APPROVED':
        return {
          endpoint: 'submit-to-bank',
          label: 'Submit to Commercial Bank',
          description: 'Submit to your Commercial Bank for document verification and FX application processing.',
          icon: <Send size={20} />,
          color: 'primary',
        };

      default:
        return null;
    }
  };

  const action = getSubmissionAction();

  if (!action) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {message && (
        <Alert 
          severity={message.type}
          icon={message.type === 'success' ? <span><CheckCircle /></span> : <span><AlertCircle /></span>}
        >
          <AlertTitle>
            {message.type === 'success' ? 'Success' : 'Error'}
          </AlertTitle>
          {message.text}
          {message.data?.newStatus && (
            <div style={{ marginTop: 8, fontSize: '0.875rem' }}>
              New Status: <strong>{message.data.newStatus}</strong>
            </div>
          )}
        </Alert>
      )}

      <Alert severity="info">
        <AlertTitle>Ready for Next Stage</AlertTitle>
        {action.description}
      </Alert>

      <Button
        variant="contained"
        color={action.color}
        size="large"
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : action.icon}
        onClick={() => handleSubmit(action.endpoint, `Successfully submitted to ${action.label.split(' ')[2]}`)}
        disabled={loading}
        fullWidth
      >
        {loading ? 'Submitting...' : action.label}
      </Button>
    </Stack>
  );
};

export default ExporterSubmissionActions;
