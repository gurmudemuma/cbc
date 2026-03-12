import { useState } from 'react';
import { Coffee, LogIn, CheckCircle2, Globe, ShieldCheck, UserPlus, ArrowLeft } from 'lucide-react';
import {
  Box,
  FormControl,
  MenuItem,
  Typography,
  Stack,
  Alert,
  Fade,
  Tabs,
  Tab,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Grid,
  Select,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import apiClient, { setApiBaseUrl } from '../services/api';
import { ALL_LOGIN_OPTIONS, getApiUrl } from '../config/api.config';
import ectaPreRegistrationService from '../services/ectaPreRegistration';
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
  exporterId?: string;
}

interface LoginProps {
  onLogin: (user: User, token: string, organization: string) => void;
}

interface FormData {
  username: string;
  password: string;
  organization: string;
}

interface RegistrationData {
  username: string;
  password: string;
  email: string;
  businessName: string;
  businessType: string;
  tin: string;
  officeAddress: string;
  city: string;
  region: string;
  contactPerson: string;
  phone: string;
}

const registrationSteps = ['Account', 'Business Profile'];

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    organization: 'exporter-portal',
  });
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    username: '',
    password: '',
    email: '',
    businessName: '',
    businessType: 'PRIVATE_EXPORTER', // Individual/Private category
    tin: '',
    officeAddress: '',
    city: '',
    region: '',
    contactPerson: '',
    phone: '',
  });
  const [registrationStep, setRegistrationStep] = useState(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [qualificationStatus, setQualificationStatus] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use gateway's unified auth endpoint for all users
      const authEndpoint = '/api/auth/login';

      const response = await apiClient.post(authEndpoint, {
        username: formData.username,
        password: formData.password,
      });

      // Handle different response formats
      const responseData = response.data.data || response.data;
      const { user, token } = responseData;
      
      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);

      // For agency users, use 'government-agency' as organization but preserve agency code
      let orgToPass = formData.organization;
      if (user.agencyCode) {
        orgToPass = 'government-agency';
      }
      
      onLogin(user, token, orgToPass);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Invalid credentials. Please attempt again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationNext = async () => {
    setError('');

    if (registrationStep === 0) {
      // Validate account info
      if (!registrationData.username || !registrationData.password || !registrationData.email) {
        setError('Please fill in all account fields');
        return;
      }
      setRegistrationStep(1);
    } else if (registrationStep === 1) {
      // Validate business info before submission
      if (!registrationData.businessName || !registrationData.tin || !registrationData.businessType) {
        setError('Please fill in all business fields (Company Name, TIN, Business Type)');
        return;
      }
      if (!registrationData.officeAddress || !registrationData.city || !registrationData.region) {
        setError('Please fill in all address fields');
        return;
      }
      if (!registrationData.contactPerson || !registrationData.phone) {
        setError('Please fill in contact information');
        return;
      }
      
      // Submit registration
      setLoading(true);
      try {
        // Calculate minimum capital based on business type (ECTA v1.2 Two-Category System)
        // Category 1: Individual/Private = 15M ETB
        // Category 2: Company (Union/Cooperative) = 20M ETB
        const capitalRequirements: Record<string, number> = {
          'PRIVATE_EXPORTER': 15000000,      // 15 million ETB - Individual/Private
          'INDIVIDUAL': 15000000,            // 15 million ETB - Individual
          'UNION': 20000000,                 // 20 million ETB - Company (Union)
          'FARMER_COOPERATIVE': 20000000,    // 20 million ETB - Company (Cooperative)
        };
        
        const minimumCapital = capitalRequirements[registrationData.businessType] || 15000000;

        // Prepare registration data
        const registrationPayload = {
          username: registrationData.username,
          password: registrationData.password,
          email: registrationData.email,
          companyName: registrationData.businessName,
          businessType: registrationData.businessType,
          tin: registrationData.tin,
          capitalETB: minimumCapital,
          phone: registrationData.phone,
          address: `${registrationData.officeAddress}, ${registrationData.city}, ${registrationData.region}`,
          contactPerson: registrationData.contactPerson,
        };

        console.log('Sending registration data:', registrationPayload);

        // Create user account with all required fields
        const userResponse = await ectaPreRegistrationService.registerUserAccount(registrationPayload);

        // Registration successful - no token returned, user must wait for approval
        setSuccess('Registration successful! Your account has been created and submitted for ECTA approval. You will be notified once approved.');

        // Switch back to login mode after 3 seconds
        setTimeout(() => {
          setMode('login');
          setFormData({ ...formData, username: registrationData.username });
          setSuccess('');
        }, 3000);
      } catch (err: any) {
        console.error('Registration error:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        if (err.response?.status === 409) {
          setError('Account with this username or email already exists. Please login.');
        } else {
          const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed. Please try again.';
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleRegistrationBack = () => {
    if (registrationStep > 0) {
      setRegistrationStep(registrationStep - 1);
    } else {
      setMode('login');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    if (mode === 'login') {
      setFormData({
        ...formData,
        [name]: value,
      });
    } else {
      setRegistrationData({
        ...registrationData,
        [name]: value,
      });
    }
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
          <Box sx={{ width: '100%', maxWidth: 500 }}>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                {mode === 'login' ? 'Welcome !!!' : 'Register as Exporter'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {mode === 'login' ? 'Sign in to access your dashboard' : 'Create your exporter account'}
              </Typography>
            </Box>

            {mode === 'register' && (
              <Stepper activeStep={registrationStep} sx={{ mb: 4 }}>
                {registrationSteps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            )}

            <Fade in={!!error || !!success}>
              {error ? (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                  {qualificationStatus && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" display="block">Pre-registration Status:</Typography>
                      <Typography variant="caption" display="block">
                        • Profile: {qualificationStatus.profile?.status}
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Laboratory: {qualificationStatus.laboratory?.status}
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Taster: {qualificationStatus.taster?.status}
                      </Typography>
                      <Typography variant="caption" display="block">
                        • Competence: {qualificationStatus.competence?.status}
                      </Typography>
                      <Typography variant="caption" display="block">
                        • License: {qualificationStatus.license?.status}
                      </Typography>
                    </Box>
                  )}
                </Alert>
              ) : success ? (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {success}
                </Alert>
              ) : <Box sx={{ mb: 3 }} />}
            </Fade>

            {mode === 'login' ? (
              <form onSubmit={handleSubmit}>
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
                    {ALL_LOGIN_OPTIONS.map((org) => (
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
                  placeholder="e.g. exporter1"
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

                {formData.organization === 'exporter-portal' && (
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      New exporter?{' '}
                      <Typography
                        component="span"
                        sx={{
                          color: 'primary.main',
                          cursor: 'pointer',
                          fontWeight: 600,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                        onClick={() => setMode('register')}
                      >
                        Register here
                      </Typography>
                    </Typography>
                  </Box>
                )}
              </form>
            ) : (
              <Box>
                {registrationStep === 0 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        USERNAME
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="username"
                        value={registrationData.username}
                        onChange={handleChange}
                        required
                        placeholder="Choose a username"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        EMAIL
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="email"
                        type="email"
                        value={registrationData.email}
                        onChange={handleChange}
                        required
                        placeholder="your@email.com"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        PASSWORD
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="password"
                        type="password"
                        value={registrationData.password}
                        onChange={handleChange}
                        required
                        placeholder="Choose a strong password"
                      />
                    </Grid>
                  </Grid>
                )}

                {registrationStep === 1 && (
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        BUSINESS NAME
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="businessName"
                        value={registrationData.businessName}
                        onChange={handleChange}
                        required
                        placeholder="Your company name"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        BUSINESS TYPE
                      </Typography>
                      <StyledSelect
                        fullWidth
                        name="businessType"
                        value={registrationData.businessType}
                        onChange={handleChange}
                        required
                      >
                        <MenuItem value="PRIVATE_EXPORTER">Private Ltd (15M ETB)</MenuItem>
                        <MenuItem value="INDIVIDUAL">Individual (15M ETB)</MenuItem>
                        <MenuItem value="UNION">Union (20M ETB)</MenuItem>
                        <MenuItem value="FARMER_COOPERATIVE">Cooperative (20M ETB)</MenuItem>
                      </StyledSelect>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        TIN NUMBER
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="tin"
                        value={registrationData.tin}
                        onChange={handleChange}
                        required
                        placeholder="Tax Identification Number"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: 'primary.main', fontSize: '0.7rem' }}>
                        {(registrationData.businessType === 'PRIVATE_EXPORTER' || registrationData.businessType === 'INDIVIDUAL') && '✓ Individual/Private: 15M ETB minimum • Full auto-qualification'}
                        {(registrationData.businessType === 'UNION' || registrationData.businessType === 'FARMER_COOPERATIVE') && '✓ Company: 20M ETB minimum • Full auto-qualification'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        OFFICE ADDRESS
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="officeAddress"
                        value={registrationData.officeAddress}
                        onChange={handleChange}
                        required
                        placeholder="Street address"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        CITY
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="city"
                        value={registrationData.city}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Addis Ababa"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        REGION
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="region"
                        value={registrationData.region}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Oromia"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        CONTACT PERSON
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="contactPerson"
                        value={registrationData.contactPerson}
                        onChange={handleChange}
                        required
                        placeholder="Full name"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                        PHONE
                      </Typography>
                      <StyledTextField
                        fullWidth
                        name="phone"
                        value={registrationData.phone}
                        onChange={handleChange}
                        required
                        placeholder="+251911234567"
                      />
                    </Grid>
                  </Grid>
                )}

                <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                  <StyledButton
                    variant="outlined"
                    onClick={handleRegistrationBack}
                    startIcon={<ArrowLeft size={20} />}
                    disabled={loading}
                  >
                    Back
                  </StyledButton>
                  <StyledButton
                    variant="contained"
                    onClick={handleRegistrationNext}
                    fullWidth
                    disabled={loading}
                    startIcon={registrationStep === 1 ? <UserPlus size={20} /> : undefined}
                  >
                    {loading ? <CircularProgress size={24} /> : (registrationStep === 1 ? 'Complete Registration' : 'Next')}
                  </StyledButton>
                </Box>
              </Box>
            )}

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
