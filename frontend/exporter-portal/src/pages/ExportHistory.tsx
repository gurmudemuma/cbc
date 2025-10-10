import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import Navbar from '../components/Navbar';
import { ExportRequest } from '../types';
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

const ExportHistory: React.FC = () => {
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [filteredExports, setFilteredExports] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const statuses = [
    'ALL',
    'PENDING',
    'FX_APPROVED',
    'FX_REJECTED',
    'QUALITY_CERTIFIED',
    'QUALITY_REJECTED',
    'SHIPMENT_SCHEDULED',
    'SHIPPED',
    'COMPLETED',
    'CANCELLED',
  ];

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/exports`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setExports(response.data);
        setFilteredExports(response.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          logout();
        } else {
          setError('Failed to load history');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token]);

  useEffect(() => {
    if (statusFilter === 'ALL') {
      setFilteredExports(exports);
    } else {
      setFilteredExports(exports.filter((exp) => exp.status === statusFilter));
    }
  }, [statusFilter, exports]);

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

  return (
    <>
      <Navbar />
      <Container sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Export History
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View all your export requests and their current status
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            label="Filter by Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {statuses.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredExports.length} of {exports.length} exports
          </Typography>
        </Box>

        {filteredExports.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No exports found
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/create-export')}
            >
              Create New Export
            </Button>
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Export ID</TableCell>
                  <TableCell>Exporter</TableCell>
                  <TableCell>Coffee Type</TableCell>
                  <TableCell align="right">Quantity (kg)</TableCell>
                  <TableCell>Destination</TableCell>
                  <TableCell align="right">Value (USD)</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExports.map((exp) => (
                  <TableRow key={exp.exportId} hover>
                    <TableCell>{exp.exportId}</TableCell>
                    <TableCell>{exp.exporterName}</TableCell>
                    <TableCell>{exp.coffeeType}</TableCell>
                    <TableCell align="right">{exp.quantity.toLocaleString()}</TableCell>
                    <TableCell>{exp.destinationCountry}</TableCell>
                    <TableCell align="right">${exp.estimatedValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Chip label={exp.status} color={getStatusColor(exp.status)} size="small" />
                    </TableCell>
                    <TableCell>{new Date(exp.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => navigate(`/export/${exp.exportId}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </>
  );
};

export default ExportHistory;