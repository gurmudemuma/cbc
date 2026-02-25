import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  LocalShipping as LocalShippingIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import eswService from '../services/esw.service';

interface Certificate {
  certificateId: string;
  certificateNumber: string;
  agencyCode: string;
  exporterName: string;
  exporterTin: string;
  eswReferenceNumber: string;
  coffeeType?: string;
  quantity?: number;
  originRegion?: string;
  destinationCountry?: string;
  approvedBy: string;
  approvedAt: string;
  issuedAt: string;
  expiresAt?: string;
  status: 'ACTIVE' | 'REVOKED';
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

interface VerificationResult {
  isValid: boolean;
  certificate?: Certificate;
  status: 'VALID' | 'REVOKED' | 'NOT_FOUND' | 'EXPIRED';
  message: string;
  verifiedAt: string;
}

const CertificateVerification: React.FC = () => {
  const [certificateNumber, setCertificateNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!certificateNumber.trim()) {
      setError('Please enter a certificate number');
      return;
    }

    setLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await eswService.verifyCertificate(certificateNumber.trim());
      
      if (response.success) {
        setVerificationResult(response.data);
      } else {
        setError(response.error?.message || 'Failed to verify certificate');
      }
    } catch (err: any) {
      console.error('Certificate verification error:', err);
      setError(err.response?.data?.error?.message || 'Failed to verify certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'VALID':
        return <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main' }} />;
      case 'REVOKED':
        return <CancelIcon sx={{ fontSize: 60, color: 'error.main' }} />;
      case 'EXPIRED':
        return <AccessTimeIcon sx={{ fontSize: 60, color: 'warning.main' }} />;
      case 'NOT_FOUND':
        return <ErrorIcon sx={{ fontSize: 60, color: 'error.main' }} />;
      default:
        return <ErrorIcon sx={{ fontSize: 60, color: 'grey.500' }} />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'VALID':
        return 'success';
      case 'REVOKED':
      case 'NOT_FOUND':
        return 'error';
      case 'EXPIRED':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Certificate Verification
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verify the authenticity of ESW agency approval certificates
          </Typography>
        </Box>

        {/* Search Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Certificate Number"
              placeholder="e.g., ECTA-CERT-2025-00001"
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              variant="outlined"
              helperText="Enter the certificate number found on the certificate document"
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Button
              variant="contained"
              size="large"
              onClick={handleVerify}
              disabled={loading || !certificateNumber.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Verifying...' : 'Verify Certificate'}
            </Button>
          </Stack>
        </Paper>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          </motion.div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper elevation={3} sx={{ p: 4 }}>
              {/* Status Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                {getStatusIcon(verificationResult.status)}
                <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                  {verificationResult.status}
                </Typography>
                <Chip
                  label={verificationResult.status}
                  color={getStatusColor(verificationResult.status)}
                  size="medium"
                  sx={{ fontWeight: 'bold' }}
                />
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  {verificationResult.message}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Verification Timestamp */}
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Verified at: {formatDate(verificationResult.verifiedAt)}
                </Typography>
              </Box>

              {/* Certificate Details */}
              {verificationResult.certificate && (
                <>
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                    Certificate Details
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Certificate Information */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <DescriptionIcon fontSize="small" />
                                Certificate Number
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {verificationResult.certificate.certificateNumber}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Agency
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {verificationResult.certificate.agencyCode}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                ESW Reference Number
                              </Typography>
                              <Typography variant="body1">
                                {verificationResult.certificate.eswReferenceNumber}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <CalendarTodayIcon fontSize="small" />
                                Issue Date
                              </Typography>
                              <Typography variant="body1">
                                {formatShortDate(verificationResult.certificate.issuedAt)}
                              </Typography>
                            </Box>

                            {verificationResult.certificate.expiresAt && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  Expiry Date
                                </Typography>
                                <Typography variant="body1">
                                  {formatShortDate(verificationResult.certificate.expiresAt)}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Exporter Information */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <BusinessIcon fontSize="small" />
                                Exporter Name
                              </Typography>
                              <Typography variant="body1" fontWeight="bold">
                                {verificationResult.certificate.exporterName}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                TIN Number
                              </Typography>
                              <Typography variant="body1">
                                {verificationResult.certificate.exporterTin}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                <PersonIcon fontSize="small" />
                                Approved By
                              </Typography>
                              <Typography variant="body1">
                                {verificationResult.certificate.approvedBy}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                Approval Date
                              </Typography>
                              <Typography variant="body1">
                                {formatShortDate(verificationResult.certificate.approvedAt)}
                              </Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Export Details */}
                    {(verificationResult.certificate.coffeeType || 
                      verificationResult.certificate.quantity || 
                      verificationResult.certificate.originRegion || 
                      verificationResult.certificate.destinationCountry) && (
                      <Grid item xs={12}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle2" gutterBottom fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
                              <LocalShippingIcon fontSize="small" />
                              Export Details
                            </Typography>
                            <Grid container spacing={2} sx={{ mt: 1 }}>
                              {verificationResult.certificate.coffeeType && (
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Coffee Type
                                  </Typography>
                                  <Typography variant="body2">
                                    {verificationResult.certificate.coffeeType}
                                  </Typography>
                                </Grid>
                              )}
                              {verificationResult.certificate.quantity && (
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Quantity
                                  </Typography>
                                  <Typography variant="body2">
                                    {verificationResult.certificate.quantity} kg
                                  </Typography>
                                </Grid>
                              )}
                              {verificationResult.certificate.originRegion && (
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Origin
                                  </Typography>
                                  <Typography variant="body2">
                                    {verificationResult.certificate.originRegion}
                                  </Typography>
                                </Grid>
                              )}
                              {verificationResult.certificate.destinationCountry && (
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="caption" color="text.secondary">
                                    Destination
                                  </Typography>
                                  <Typography variant="body2">
                                    {verificationResult.certificate.destinationCountry}
                                  </Typography>
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}

                    {/* Revocation Information */}
                    {verificationResult.certificate.status === 'REVOKED' && (
                      <Grid item xs={12}>
                        <Alert severity="error">
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            Certificate Revoked
                          </Typography>
                          {verificationResult.certificate.revokedAt && (
                            <Typography variant="body2">
                              Revoked on: {formatDate(verificationResult.certificate.revokedAt)}
                            </Typography>
                          )}
                          {verificationResult.certificate.revokedBy && (
                            <Typography variant="body2">
                              Revoked by: {verificationResult.certificate.revokedBy}
                            </Typography>
                          )}
                          {verificationResult.certificate.revocationReason && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              Reason: {verificationResult.certificate.revocationReason}
                            </Typography>
                          )}
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </Paper>
          </motion.div>
        )}

        {/* Information Section */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            This verification system allows customs officers, shipping authorities, and other stakeholders
            to verify the authenticity of ESW agency approval certificates.
          </Typography>
        </Box>
      </motion.div>
    </Container>
  );
};

export default CertificateVerification;
