import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import Navbar from '../components/Navbar';
import { ExportRequest, HistoryEntry } from '../types';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getStatusColor = (status: string) => {
  const colors: { [key: string]: 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' } = {
    PENDING: 'warning',
    FX_APPROVED: 'info',
    FX_REJECTED: 'error',
    QUALITY_CERTIFIED: 'info',
    QUALITY_REJECTED: 'error',
    SHIPMENT_SCHEDULED: 'primary',
    SHIPPED: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'error',
  };
  return colors[status] || 'default';
};

const ExportDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [exportData, setExportData] = useState<ExportRequest | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  useEffect(() => {
    const fetchExportDetails = async () => {
      try {
        setLoading(true);
        const [exportResponse, historyResponse] = await Promise.all([
          axios.get(`${API_URL}/api/exports/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/exports/${id}/history`, {
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => ({ data: [] })), // History might not be available
        ]);
        setExportData(exportResponse.data);
        setHistory(historyResponse.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
        } else {
          setError('Failed to load export details');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExportDetails();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchExportDetails, 30000);
    return () => clearInterval(interval);
  }, [id, token]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </>
    );
  }

  if (!exportData) {
    return (
      <>
        <Navbar />
        <Container sx={{ mt: 4 }}>
          <Alert severity="error">Export not found</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container sx={{ mt: 4 }}>
        <Button onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          ← Back to Dashboard
        </Button>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Export Details
            </Typography>
            <Chip label={exportData.status} color={getStatusColor(exportData.status)} />
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Basic Information</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Export ID</Typography>
                <Typography variant="body1">{exportData.exportId}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Exporter Name</Typography>
                <Typography variant="body1">{exportData.exporterName}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Coffee Type</Typography>
                <Typography variant="body1">{exportData.coffeeType}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Quantity</Typography>
                <Typography variant="body1">{exportData.quantity} kg</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Destination Country</Typography>
                <Typography variant="body1">{exportData.destinationCountry}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Estimated Value</Typography>
                <Typography variant="body1">${exportData.estimatedValue.toLocaleString()}</Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Timeline</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Created At</Typography>
                <Typography variant="body1">{new Date(exportData.createdAt).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                <Typography variant="body1">{new Date(exportData.updatedAt).toLocaleString()}</Typography>
              </Box>

              {exportData.fxApprovedAt && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">FX Approved At</Typography>
                  <Typography variant="body1">{new Date(exportData.fxApprovedAt).toLocaleString()}</Typography>
                  <Typography variant="caption">By: {exportData.fxApprovedBy}</Typography>
                </Box>
              )}

              {exportData.qualityCertifiedAt && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Quality Certified At</Typography>
                  <Typography variant="body1">{new Date(exportData.qualityCertifiedAt).toLocaleString()}</Typography>
                  <Typography variant="caption">Grade: {exportData.qualityGrade}</Typography>
                </Box>
              )}

              {exportData.shippedAt && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">Shipped At</Typography>
                  <Typography variant="body1">{new Date(exportData.shippedAt).toLocaleString()}</Typography>
                </Box>
              )}
            </Grid>
          </Grid>

          {exportData.vesselName && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>Shipping Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Vessel Name</Typography>
                  <Typography variant="body1">{exportData.vesselName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">Shipment ID</Typography>
                  <Typography variant="body1">{exportData.shipmentId}</Typography>
                </Grid>
                {exportData.departureDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Departure Date</Typography>
                    <Typography variant="body1">{exportData.departureDate}</Typography>
                  </Grid>
                )}
                {exportData.arrivalDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Arrival Date</Typography>
                    <Typography variant="body1">{exportData.arrivalDate}</Typography>
                  </Grid>
                )}
              </Grid>
            </>
          )}

          {history.length > 0 && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" gutterBottom>Transaction History</Typography>
              {history.map((entry, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Transaction ID: {entry.txId}
                    </Typography>
                    <Typography variant="body2">
                      Timestamp: {new Date(entry.timestamp).toLocaleString()}
                    </Typography>
                    {entry.record && (
                      <Typography variant="body2">
                        Status: <Chip label={entry.record.status} size="small" color={getStatusColor(entry.record.status)} />
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </Paper>
      </Container>
    </>
  );
};

export default ExportDetails;