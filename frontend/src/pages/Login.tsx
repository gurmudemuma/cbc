// @ts-nocheck
import { useState } from 'react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { ORGANIZATIONS, getApiUrl } from '../config/api.config';
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Business,
  Lock,
  Login as LoginIcon,
} from '@mui/icons-material';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    organization: 'commercial-bank',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = getApiUrl(formData.organization);
      setApiBaseUrl(apiUrl);

      const response = await apiClient.post('/api/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      
      const selectedOrg = (formData.organization || '').toLowerCase();
      if (selectedOrg.includes('exporter')) {
        const defaultBank = process.env.REACT_APP_DEFAULT_BANK_ID || 'commercial-bank';
        localStorage.setItem('bankContextId', defaultBank);
      } else {
        localStorage.removeItem('bankContextId');
      }
      
      onLogin(user, token, formData.organization);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            gap: 4,
            alignItems: 'center',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Left Side - Branding */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'block' },
              color: 'white',
            }}
          >
            <Typography variant="h2" fontWeight="700" gutterBottom>
              Trade finacnce-Coffee Export
            </Typography>
            <Typography variant="h4" fontWeight="300" gutterBottom>
              Consortium Blockchain
            </Typography>
            <Typography variant="body1" sx={{ mt: 3, opacity: 0.9, maxWidth: 500 }}>
              Secure, transparent, and efficient coffee export management powered by Hyperledger Fabric blockchain technology.
            </Typography>
            
            <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
              <Chip
                label="6 Organizations"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Chip
                label="Blockchain Verified"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
              <Chip
                label="Real-time Tracking"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 600 }}
              />
            </Stack>
          </Box>

          {/* Right Side - Login Form */}
          <Paper
            elevation={24}
            sx={{
              flex: { xs: 1, md: 0.6 },
              p: 5,
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <LoginIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h4" fontWeight="700" gutterBottom>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to access your dashboard
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>Organization</InputLabel>
                  <Select
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    label="Organization"
                    startAdornment={
                      <InputAdornment position="start">
                        <Business color="action" />
                      </InputAdornment>
                    }
                  >
                    {ORGANIZATIONS.map((org) => (
                      <MenuItem key={org.id} value={org.value}>
                        <Box>
                          <Typography variant="body1">{org.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {org.fullName}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #F59E0B 100%)',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7C3AED 0%, #D97706 100%)',
                    },
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Test Credentials
              </Typography>
            </Divider>

            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                <strong>Username:</strong> export_user
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                <strong>Password:</strong> Export123!@#
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
