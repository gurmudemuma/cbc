import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
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

const Dashboard: React.FC = () => {
  const [exports, setExports] = useState<ExportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  const fetchExports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/exports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExports(response.data);
      setError('');
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      } else {
        setError('Failed to load exports');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchExports, 30000);
    return () => clearInterval(interval);
  }, [token]);

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
            Export Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and track your coffee export requests
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {exports.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No exports found
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/create-export')}
            >
              Create Your First Export
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {exports.map((exp) => (
              <Grid item xs={12} md={6} lg={4} key={exp.exportId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" component="div">
                        {exp.exportId}
                      </Typography>
                      <Chip label={exp.status} color={getStatusColor(exp.status)} size="small" />
                    </Box>
                    <Typography color="text.secondary" gutterBottom>
                      {exp.exporterName}
                    </Typography>
                    <Typography variant="body2">
                      Coffee: {exp.coffeeType}
                    </Typography>
                    <Typography variant="body2">
                      Quantity: {exp.quantity} kg
                    </Typography>
                    <Typography variant="body2">
                      Destination: {exp.destinationCountry}
                    </Typography>
                    <Typography variant="body2">
                      Value: ${exp.estimatedValue.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Updated: {new Date(exp.updatedAt).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => navigate(`/export/${exp.exportId}`)}>
                      View Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </>
  );
};

export default Dashboard;