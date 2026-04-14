/**
 * Document Download List Component
 * Displays all issued documents with download functionality
 */

import { useState, useEffect } from 'react';
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
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Download,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Shield,
  RefreshCw,
} from 'lucide-react';
import documentService from '../services/document.service';

interface Document {
  documentId: string;
  issuerMemberCode: string;
  documentType: string;
  documentNumber: string;
  issuedAt: string;
  expiryDate: string | null;
  status: string;
  metadata: any;
  downloadUrl: string;
}

interface DocumentDownloadListProps {
  submissionId?: string;
  showTitle?: boolean;
}

const DocumentDownloadList = ({ submissionId, showTitle = true }: DocumentDownloadListProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [submissionId]);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (submissionId) {
        response = await documentService.getDocumentsBySubmission(submissionId);
      } else {
        response = await documentService.getIssuedDocuments();
      }

      if (response.success) {
        setDocuments(response.data || []);
      } else {
        setError(response.error || 'Failed to load documents');
      }
    } catch (err: any) {
      console.error('Failed to load documents:', err);
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    setDownloading(doc.documentId);
    try {
      await documentService.downloadDocument(doc.documentId, doc.documentNumber);
    } catch (err: any) {
      console.error('Download failed:', err);
      setError(`Failed to download ${doc.documentNumber}: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'EXPIRED':
        return 'warning';
      case 'REVOKED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle size={16} />;
      case 'EXPIRED':
        return <Clock size={16} />;
      case 'REVOKED':
        return <XCircle size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  const isExpired = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Group documents by issuer
  const documentsByIssuer = documents.reduce((acc, doc) => {
    if (!acc[doc.issuerMemberCode]) {
      acc[doc.issuerMemberCode] = [];
    }
    acc[doc.issuerMemberCode].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {showTitle && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield size={24} /> Issued Documents & Certificates
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={loadDocuments} disabled={loading}>
              <RefreshCw size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {documents.length === 0 ? (
        <Alert severity="info">
          No documents have been issued yet. Request documents from network members to get started.
        </Alert>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {documents.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main">
                    {documents.filter((d) => d.status === 'ACTIVE').length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Active Documents
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="warning.main">
                    {documents.filter((d) => isExpiringSoon(d.expiryDate)).length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Expiring Soon
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Documents by Issuer */}
          {Object.entries(documentsByIssuer).map(([issuerCode, docs]) => (
            <Card key={issuerCode} sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {documentService.getNetworkMemberName(issuerCode)}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Type</TableCell>
                        <TableCell>Document Number</TableCell>
                        <TableCell>Issued Date</TableCell>
                        <TableCell>Expiry Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {docs.map((doc) => (
                        <TableRow
                          key={doc.documentId}
                          sx={{
                            backgroundColor: isExpired(doc.expiryDate)
                              ? 'error.light'
                              : isExpiringSoon(doc.expiryDate)
                              ? 'warning.light'
                              : 'inherit',
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {documentService.getDocumentTypeLabel(doc.documentType)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {doc.documentNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{formatDate(doc.issuedAt)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(doc.expiryDate)}
                              {isExpiringSoon(doc.expiryDate) && !isExpired(doc.expiryDate) && (
                                <Chip
                                  label="Expiring Soon"
                                  size="small"
                                  color="warning"
                                  sx={{ ml: 1 }}
                                />
                              )}
                              {isExpired(doc.expiryDate) && (
                                <Chip label="Expired" size="small" color="error" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(doc.status)}
                              label={doc.status}
                              color={getStatusColor(doc.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Download Signed Document">
                              <span>
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={
                                    downloading === doc.documentId ? (
                                      <CircularProgress size={16} color="inherit" />
                                    ) : (
                                      <Download size={16} />
                                    )
                                  }
                                  onClick={() => handleDownload(doc)}
                                  disabled={downloading === doc.documentId || doc.status !== 'ACTIVE'}
                                >
                                  Download
                                </Button>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ))}

          {/* Digital Signature Notice */}
          <Alert severity="info" icon={<Shield />}>
            All documents are digitally signed by the issuing network member and include QR codes for
            verification. These documents are legally valid and can be used for export procedures.
          </Alert>
        </>
      )}
    </Box>
  );
};

export default DocumentDownloadList;
