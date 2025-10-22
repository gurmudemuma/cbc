import { useState } from 'react';
import { Coffee, LogIn, Lock, Globe, Zap, Users } from 'lucide-react';
import apiClient, { setApiBaseUrl } from '../services/api';
import { ORGANIZATIONS, getApiUrl } from '../config/api.config';
import { Box, Button, FormControl, InputLabel, MenuItem, Paper, Select, TextField, Typography, Stack, Alert } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    organization: 'exporter-portal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Authentication flow:
      // - Exporter Portal users authenticate via National Bank (who manages export licenses)
      // - All other organizations authenticate via their own APIs
      const apiUrl = formData.organization === 'exporter-portal' 
        ? getApiUrl('nationalbank') 
        : getApiUrl(formData.organization);
      setApiBaseUrl(apiUrl);

      // Use portal auth endpoint for exporter portal users
      const authEndpoint = formData.organization === 'exporter-portal' 
        ? '/portal/auth/login' 
        : '/auth/login';

      const response = await apiClient.post(authEndpoint, {
        username: formData.username,
        password: formData.password,
      });

      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      onLogin(user, token, formData.organization);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #E1BEE7 0%, #F3E5F5 50%, #EDE7F6 100%)',
      alignItems: 'center', 
      justifyContent: 'center', 
      p: { xs: 2, sm: 3 },
      position: 'relative'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          width: '85vw', 
          height: '92vh',
          maxWidth: '1400px',
          mx: 'auto', 
          overflow: 'hidden', 
          borderRadius: 3,
          bgcolor: '#FFFFFF',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Box 
          sx={{ 
            flex: 1, 
            p: { xs: 4, md: 6 }, 
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F3E5F5 100%)',
            borderRight: { md: '1px solid #E1BEE7' },
            color: '#212121', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            order: { xs: 1, md: 0 }
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 5, 
              fontWeight: 700,
              color: '#7B1FA2',
              letterSpacing: '-0.5px'
            }}
          >
            Welcome to Coffee Blockchain Consortium
          </Typography>
          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid xs={6}>
              <Stack 
                alignItems="center" 
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid rgba(139, 0, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: '#F9F9F9',
                    border: '1px solid rgba(139, 0, 255, 0.4)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Lock size={40} color="#8E24AA" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7B1FA2' }}>Secure</Typography>
                <Typography variant="body2" align="center" sx={{ color: '#616161', fontSize: '0.875rem' }}>Immutable ledger ensures data integrity and prevents tampering</Typography>
              </Stack>
            </Grid>
            <Grid xs={6}>
              <Stack 
                alignItems="center" 
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid rgba(139, 0, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: '#F9F9F9',
                    border: '1px solid rgba(139, 0, 255, 0.4)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Globe size={40} color="#8E24AA" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7B1FA2' }}>Transparent</Typography>
                <Typography variant="body2" align="center" sx={{ color: '#616161', fontSize: '0.875rem' }}>Full visibility of supply chain from farm to export</Typography>
              </Stack>
            </Grid>
            <Grid xs={6}>
              <Stack 
                alignItems="center" 
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid rgba(139, 0, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: '#F9F9F9',
                    border: '1px solid rgba(139, 0, 255, 0.4)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Zap size={40} color="#8E24AA" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7B1FA2' }}>Efficient</Typography>
                <Typography variant="body2" align="center" sx={{ color: '#616161', fontSize: '0.875rem' }}>Automated smart contracts reduce paperwork and delays</Typography>
              </Stack>
            </Grid>
            <Grid xs={6}>
              <Stack 
                alignItems="center" 
                spacing={1.5}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: '#FFFFFF',
                  border: '1px solid rgba(139, 0, 255, 0.2)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  '&:hover': {
                    bgcolor: '#F9F9F9',
                    border: '1px solid rgba(139, 0, 255, 0.4)',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Users size={40} color="#8E24AA" strokeWidth={2} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#7B1FA2' }}>Collaborative</Typography>
                <Typography variant="body2" align="center" sx={{ color: '#616161', fontSize: '0.875rem' }}>Real-time coordination between exporters, banks, certifiers, and shippers</Typography>
              </Stack>
            </Grid>
          </Grid>
        </Box>
        <Box 
          sx={{ 
            flex: 1, 
            p: { xs: 4, md: 6 }, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center',
            bgcolor: '#FFFFFF'
          }}
        >
          <Stack alignItems="center" spacing={2} sx={{ mb: 5 }}>
            <Box
              sx={{
                p: 1.8,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #E1BEE7 0%, #CE93D8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1
              }}
            >
              <Coffee size={52} color="#7B1FA2" strokeWidth={2} />
            </Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600,
                color: '#7B1FA2',
                letterSpacing: '-0.3px'
              }}
            >
              Coffee Blockchain
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#616161',
                fontWeight: 400,
                fontSize: '0.9rem'
              }}
            >
              Consortium Portal
            </Typography>
          </Stack>

          <form onSubmit={handleSubmit}>
            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 1.5 }}>{error}</Alert>}

            <FormControl 
              fullWidth 
              sx={{ 
                mb: 2.5
              }}
            >
              <InputLabel>Organization</InputLabel>
              <Select
                label="Organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
                variant="outlined"
                sx={{ 
                  sx: { color: '#212121' },
                  '& .MuiSelect-icon': {
                    color: '#666'
                  }
                }}
              >
                {ORGANIZATIONS.map(org => (
                  <MenuItem key={org.value} value={org.value}>
                    {org.label}
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
              autoComplete="username"
              sx={{ mb: 2.5 }}
              variant="outlined"
            />

            <TextField
              fullWidth
              type="password"
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              sx={{ mb: 3.5 }}
              variant="outlined"
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              startIcon={<LogIn size={20} color="#FFFFFF" strokeWidth={2.5} />}
              sx={{ 
                py: 1.4, 
                fontWeight: 600,
                fontSize: '0.95rem',
                borderRadius: 1.5,
                textTransform: 'none',
                letterSpacing: '0.3px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          <Typography 
            variant="body2" 
            align="center" 
            sx={{ 
              mt: 3.5, 
              color: '#9E9E9E',
              fontSize: '0.8rem',
              fontWeight: 400
            }}
          >
            Secure blockchain-based coffee export management
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;