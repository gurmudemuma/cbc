import { useState } from 'react';
import { Coffee, LogIn, CheckCircle2, Globe, ShieldCheck } from 'lucide-react';
import {
  Box,
  FormControl,
  MenuItem,
  Typography,
  Stack,
  Alert,
  Fade,
} from '@mui/material';
import apiClient, { setApiBaseUrl } from '../services/api';
import { ORGANIZATIONS, getApiUrl } from '../config/api.config';
import {
  LoginPageContainer,
  LoginPaper,
  InfoContainer,
  FormContainer,
  StyledSelect,
  StyledTextField,
  StyledButton,
} from './Login.styles';

// Type definitions
interface User {
  id: string;
  username: string;
  email?: string;
  organization?: string;
  role?: string;
}

interface LoginProps {
  onLogin: (user: User, token: string, organization: string) => void;
}

interface FormData {
  username: string;
  password: string;
  organization: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    organization: 'commercial-bank',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get the API URL for the selected organization
      const apiUrl = getApiUrl(formData.organization);
      setApiBaseUrl(apiUrl);

      // Use standard auth endpoint (baseURL already includes /api)
      const authEndpoint = '/auth/login';

      const response = await apiClient.post(authEndpoint, {
        username: formData.username,
        password: formData.password,
      });

      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      onLogin(user, token, formData.organization);
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials. Please attempt again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const features = [
    { text: 'Immutable Ledger Records', icon: <ShieldCheck size={20} /> },
    { text: 'Real-time Export Tracking', icon: <Globe size={20} /> },
    { text: 'Smart Contract Automation', icon: <CheckCircle2 size={20} /> },
  ];

  return (
    <LoginPageContainer>
      <LoginPaper elevation={0}>
        <InfoContainer>
          <Box sx={{ maxWidth: 480, mx: 'auto', position: 'relative', zIndex: 2 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <Coffee size={32} />
            </Box>

            <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.1 }}>
              Coffee Blockchain<br />Consortium
            </Typography>

            <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)', mb: 6, fontWeight: 400 }}>
              The unified platform for secure, transparent, and efficient coffee export management.
            </Typography>

            <Stack spacing={3}>
              {features.map((feature, idx) => (
                <Stack direction="row" spacing={2} alignItems="center" key={idx}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#60A5FA',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {feature.text}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </InfoContainer>

        <FormContainer>
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <Box sx={{ mb: 5, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to access your dashboard
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <Fade in={!!error}>
                {error ? (
                  <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                    {error}
                  </Alert>
                ) : <Box sx={{ mb: 3 }} />}
              </Fade>

              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.primary' }}>
                ORGANIZATION
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <StyledSelect
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  displayEmpty
                >
                  {ORGANIZATIONS.map((org) => (
                    <MenuItem key={org.value} value={org.value}>
                      {org.label}
                    </MenuItem>
                  ))}
                </StyledSelect>
              </FormControl>

              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.primary' }}>
                USERNAME
              </Typography>
              <StyledTextField
                fullWidth
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="e.g. admin"
                sx={{ mb: 3 }}
              />

              <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'text.primary' }}>
                PASSWORD
              </Typography>
              <StyledTextField
                fullWidth
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                sx={{ mb: 4 }}
              />

              <StyledButton
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={<LogIn size={20} />}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </StyledButton>
            </form>

            <Typography
              variant="body2"
              align="center"
              color="text.secondary"
              sx={{ mt: 4 }}
            >
              Secured by Hyperledger Fabric
            </Typography>
          </Box>
        </FormContainer>
      </LoginPaper>
    </LoginPageContainer>
  );
};

export default Login;
