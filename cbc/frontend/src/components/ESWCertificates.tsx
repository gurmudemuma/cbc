import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Download, FileText, CheckCircle, Eye } from 'lucide-react';
import eswService from '../services/esw.service';

interface Certificate {
  certificateId: string;
  certificateNumber: string;
  agencyCode: string;
  agencyName?: string;
  issuedAt: string;
  expiresAt?: string;
  status: string;
  fileSizeBytes?: number;
}

interface ESWCertificatesProps {
  submissionId: string;
}

const ESWCertificates = ({ submissionId }: ESWCertificatesProps): JSX.Element => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    loadCertificates();
  }, [submissionId]);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eswService.getSubmissionCertificates(submissionId);
      setCertificates(response.data || []);
    } catch (err: any) {
      console.error('Failed to load certificates:', err);
      setError(err.response?.data?.message || 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (certificate: Certificate) => {
    try {
      setDownloading(certificate.certificateId);
      await eswService.downloadCertificate(certificate.certificateId, certificate.certificateNumber);
    } catch (err: any) {
      console.error('Failed to download certificate:', err);
      alert('Failed to download certificate: ' + (err.response?.data?.message || err.message));
    } finally {
      setDownloading(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  if (certificates.length === 0) {
    return (
      <Card>
        <CardContent>
          <Alert severity="info">
            No certificates have been generated yet. Certificates will be generated automatically when agencies approve the submission.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={20} /> Agency Certificates ({certificates.length})
          </Typography>
          <Chip
            icon={<CheckCircle size={16} />}
            label={`${certificates.length} Generated`}
            color="success"
            size="small"
          />
        </Box>
        <Divider sx={{ mb: 2 }} />

        <Alert severity="success" sx={{ mb: 2 }}>
          All certificates are ready for download. Each agency has issued a certificate for this export.
        </Alert>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Agency</TableCell>
                <TableCell>Certificate Number</TableCell>
                <TableCell>Issued Date</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>File Size</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {certificates.map((cert) => (
                <TableRow key={cert.certificateId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {cert.agencyCode}
                    </Typography>
                    {cert.agencyName && (
                      <Typography variant="caption" color="textSecondary">
                        {cert.agencyName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {cert.certificateNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{formatDate(cert.issuedAt)}</TableCell>
                  <TableCell>{cert.expiresAt ? formatDate(cert.expiresAt) : 'No expiry'}</TableCell>
                  <TableCell>{formatFileSize(cert.fileSizeBytes)}</TableCell>
                  <TableCell>
                    <Chip
                      label={cert.status || 'ACTIVE'}
                      color={cert.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Download Certificate PDF">
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleDownload(cert)}
                          disabled={downloading === cert.certificateId}
                        >
                          {downloading === cert.certificateId ? (
                            <CircularProgress size={20} />
                          ) : (
                            <Download size={20} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="textSecondary">
            Click the download icon to save each certificate as a PDF file
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download size={16} />}
            onClick={() => {
              // Download all certificates
              certificates.forEach((cert, index) => {
                setTimeout(() => handleDownload(cert), index * 500); // Stagger downloads
              });
            }}
            disabled={downloading !== null}
          >
            Download All
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ESWCertificates;
