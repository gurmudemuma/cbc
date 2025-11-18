import { useState } from 'react';
import { Coffee, LogIn, Lock, Globe, Zap, Users, Link2, Network, Shield, Database } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { ORGANIZATIONS, getApiUrl } from '../config/api.config';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Stack,
  Alert,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import {
  LoginPageContainer,
  LoginPaper,
  InfoContainer,
  FormContainer,
  StyledSelect,
  StyledTextField,
  StyledButton,
} from './Login.styles';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    organization: 'commercial-bank',  // Default to commercial bank (main API)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get the API URL for the selected organization
      const apiUrl = getApiUrl(formData.organization);
      setApiBaseUrl(apiUrl);

      // Use standard auth endpoint
      const authEndpoint = '/api/auth/login';

      const response = await apiClient.post(authEndpoint, {
        username: formData.username,
        password: formData.password,
      });

      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
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
    <LoginPageContainer>
      <LoginPaper elevation={3}>
        <InfoContainer>
          {/* Blockchain Network Visualization */}
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              display: 'flex',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Chip
              icon={<Database size={14} />}
              label="Hyperledger Fabric"
              size="small"
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.15)',
                color: '#22C55E',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontWeight: 600,
              }}
            />
            <Chip
              icon={<Shield size={14} />}
              label="Consortium Network"
              size="small"
              sx={{
                bgcolor: 'rgba(59, 130, 246, 0.15)',
                color: '#3B82F6',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                fontWeight: 600,
              }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              mb: 2,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.5px',
            }}
          >
            Coffee Blockchain Consortium
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mb: 5,
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '90%',
            }}
          >
            Secure, transparent, and efficient coffee export management powered by distributed ledger technology
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid xs={6}>
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.5)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.2)',
                  },
                }}
              >
                <Link2 size={40} color="#3B82F6" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Blockchain Secured
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}
                >
                  Immutable distributed ledger ensures data integrity
                </Typography>
              </Stack>
            </Grid>
            <Grid xs={6}>
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(34, 197, 94, 0.5)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(34, 197, 94, 0.2)',
                  },
                }}
              >
                <Network size={40} color="#22C55E" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Distributed Network
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}
                >
                  7 consortium members with shared governance
                </Typography>
              </Stack>
            </Grid>
            <Grid xs={6}>
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.5)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.2)',
                  },
                }}
              >
                <Zap size={40} color="#F59E0B" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Smart Contracts
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}
                >
                  Automated workflows with chaincode execution
                </Typography>
              </Stack>
            </Grid>
            <Grid xs={6}>
              <Stack
                alignItems="center"
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.5)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(168, 85, 247, 0.2)',
                  },
                }}
              >
                <Users size={40} color="#A855F7" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#FFFFFF' }}>
                  Multi-Party Consensus
                </Typography>
                <Typography
                  variant="body2"
                  align="center"
                  sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}
                >
                  Banks • ECX • ECTA • Customs • Shipping collaboration
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </InfoContainer>
        <FormContainer>
          {/* Professional Header */}
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                mb: 3,
                boxShadow: '0 12px 32px rgba(30, 64, 175, 0.25)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  inset: -2,
                  borderRadius: 3,
                  padding: 2,
                  background: 'linear-gradient(135deg, #3B82F6, #1E40AF)',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                  opacity: 0.3,
                },
              }}
            >
              <Coffee size={44} color="#FFFFFF" strokeWidth={2.5} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#0F172A',
                letterSpacing: '-0.5px',
                mb: 1,
              }}
            >
              Consortium Access
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: '#64748B',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              Coffee Blockchain Network
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#475569',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.7rem',
                }}
              >
                Select Organization
              </Typography>
            </Box>
            <FormControl
              fullWidth
              sx={{
                mb: 3,
              }}
            >
              <StyledSelect
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                variant="outlined"
                displayEmpty
              >
                {ORGANIZATIONS.map((org) => (
                  <MenuItem 
                    key={org.value} 
                    value={org.value}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        bgcolor: 'rgba(59, 130, 246, 0.08)',
                      },
                      '&.Mui-selected': {
                        bgcolor: 'rgba(59, 130, 246, 0.12)',
                        '&:hover': {
                          bgcolor: 'rgba(59, 130, 246, 0.16)',
                        },
                      },
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#0F172A' }}>
                      {org.label} {org.fullName !== org.label && `- ${org.fullName}`}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', mt: 0.5 }}>
                      {org.description}
                    </Typography>
                  </MenuItem>
                ))}
              </StyledSelect>
            </FormControl>

            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#475569',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.7rem',
                }}
              >
                Username
              </Typography>
            </Box>
            <StyledTextField
              fullWidth
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              autoComplete="username"
              placeholder="Enter your username"
              sx={{
                mb: 3,
              }}
              variant="outlined"
            />

            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: '#475569',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontSize: '0.7rem',
                }}
              >
                Password
              </Typography>
            </Box>
            <StyledTextField
              fullWidth
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              sx={{
                mb: 4,
              }}
              variant="outlined"
            />

            <StyledButton
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={<LogIn size={20} color="#FFFFFF" strokeWidth={2.5} />}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </StyledButton>
          </form>

          <Typography
            variant="body2"
            align="center"
            sx={{
              mt: 3.5,
              color: '#94A3B8',
              fontSize: '0.8rem',
              fontWeight: 400,
            }}
          >
            🔐 Secured by Hyperledger Fabric • 🌐 Distributed Ledger Technology
          </Typography>
        </FormContainer>
      </LoginPaper>
    </LoginPageContainer>
  );
};

export default Login;
