/**
 * ContractCertificateDownload Component
 * Display certificate details and enable PDF download
 */

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent, Button, Alert, CircularProgress, Box,
  Typography, Grid, Divider, Stack, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, QRCode,
} from '@mui/material';
import { Download, CheckCircle, AlertCircle } from 'lucide-react';

interface CertificateData {
  draft_id: string;
  contract_number: string;
  ecta_reference_number: string;
  blockchain_tx_hash: string;
  exporter_name: string;
  buyer_name: string;
  buyer_email: string;
  coffee_type: string;
  quantity_bags: number;
  unit_price: number;
  currency: string;
  total_value: number;
  finalized_at: string;
  created_at: string;
}

interface ContractCertificateDownloadProps {
  certificate: CertificateData;
  onDownload?: () => void;
}

const ContractCertificateDownload: React.FC<ContractCertificateDownloadProps> = ({
  certificate,
  onDownload,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrOpen, setQrOpen] = useState(false);

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/contracts/${certificate.draft_id}/certificate`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificate.ecta_reference_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Certificate downloaded successfully');
      if (onDownload) {
        onDownload();
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error downloading certificate');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader
        title="Sales Contract Certificate"
        subheader={`ECTA Reference: ${certificate.ecta_reference_number}`}
      />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 3 }}>
          <CheckCircle size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          This contract has been finalized on the blockchain and registered with ECTA. You can now
          download the official certificate.
        </Alert>

        <Grid container spacing={3}>
          {/* Certificate Details */}
          <Grid item xs={12} md={8}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Contract Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Contract Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {certificate.contract_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    ECTA Reference
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace' }}>
                    {certificate.ecta_reference_number}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Finalized Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(certificate.finalized_at)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(certificate.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Party Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Exporter
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {certificate.exporter_name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Buyer
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {certificate.buyer_name}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Buyer Email
                  </Typography>
                  <Typography variant="body2">
                    {certificate.buyer_email}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Coffee Specifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Coffee Type
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {certificate.coffee_type}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body2">
                    {certificate.quantity_bags} bags
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Unit Price
                  </Typography>
                  <Typography variant="body2">
                    {formatCurrency(certificate.unit_price, certificate.currency)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Total Value
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {formatCurrency(certificate.total_value, certificate.currency)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Blockchain Verification
              </Typography>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, wordBreak: 'break-all' }}>
                <Typography variant="caption" color="text.secondary">
                  Transaction Hash
                </Typography>
                <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
                  {certificate.blockchain_tx_hash}
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* QR Code & Download */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  QR Code for Verification
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box
                    sx={{
                      width: 150,
                      height: 150,
                      bgcolor: 'white',
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      [QR Code]
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  onClick={() => setQrOpen(true)}
                  sx={{ mt: 1 }}
                >
                  View QR Code
                </Button>
              </Box>

              <Stack spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <Download size={20} />}
                  onClick={handleDownload}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Downloading...' : 'Download Certificate (PDF)'}
                </Button>
                <Chip
                  label="Certificate Ready"
                  color="success"
                  icon={<CheckCircle size={16} />}
                  fullWidth
                />
              </Stack>

              <Box sx={{ p: 1.5, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                <Typography variant="caption" color="success.main">
                  ✓ Verified on Blockchain
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {/* QR Code Dialog */}
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)}>
        <DialogTitle>QR Code for Verification</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Box
              sx={{
                width: 300,
                height: 300,
                bgcolor: 'white',
                border: '2px solid #ddd',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                [QR Code - {certificate.ecta_reference_number}]
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Scan this QR code to verify the certificate authenticity
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ContractCertificateDownload;
