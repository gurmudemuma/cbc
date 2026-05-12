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
import { LOGIN_ORGANIZATIONS, ALL_LOGIN_OPTIONS, getApiUrl } from '../config/api.config';
import ectaPreRegistrationService from '../services/ectaPreRegistration';
import {
  LoginPageContainer,
  LoginPaper,
  LoginHeader,
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
      // Route to appropriate service based on organization
      // Exporter portal users go to exporter-portal service
      // All other organization users go to gateway service
      const isExporterPortal = formData.organization === 'exporter-portal';
      const authEndpoint = '/api/auth/login';
      
      // For non-exporter users, we need to send the request to gateway
      // We'll add organization to the request body so backend knows which org
      const loginData: any = {
        username: formData.username,
        password: formData.password,
      };
      
      // Add organization for non-exporter users (gateway needs this)
      if (!isExporterPortal) {
        loginData.organization = formData.organization;
      }

      const response = await apiClient.post(authEndpoint, loginData);

      // Handle different response formats
      const responseData = response.data.data || response.data;
      const { user, token } = responseData;
      
      if (!token) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', token);

      // For network member users, use 'government-agency' as organization but preserve member code
      let orgToPass = formData.organization;
      if (user.memberCode) {
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
          organization: 'exporter-portal', // Add organization for proper routing
        };

        console.log('Sending registration data:', registrationPayload);

        // Create user account with all required fields
        const userResponse = await ectaPreRegistrationService.registerUserAccount(registrationPayload);

        // Registration successful - account is active, user can login immediately
        setSuccess('Registration successful! You can login now and complete your qualification steps.');

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
        {/* CBE Logo - Top Left Corner */}
        <LoginHeader>
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              padding: '8px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            <Box
              component="img"
              src="/cbe-logo-image.webp"
              alt="Commercial Bank of Ethiopia"
              sx={{
                height: 40,
                width: 'auto',
              }}
            />
          </Box>
        </LoginHeader>

        <InfoContainer>
          {/* Additional bold cryptographic overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '15%',
              left: '8%',
              width: '250px',
              height: '250px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='250' height='250' viewBox='0 0 250 250' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23FFFFFF' stroke-width='2' opacity='0.25'%3E%3Ccircle cx='125' cy='125' r='100' stroke-dasharray='8,8'/%3E%3Ccircle cx='125' cy='125' r='80' stroke-dasharray='6,6'/%3E%3Ccircle cx='125' cy='125' r='60' stroke-dasharray='4,4'/%3E%3Ccircle cx='125' cy='125' r='40'/%3E%3Cpath d='M125,25 L125,225 M25,125 L225,125' stroke-width='1.5' stroke-dasharray='10,5'/%3E%3Cpath d='M45,45 L205,205 M205,45 L45,205' stroke-width='1.5' stroke-dasharray='10,5'/%3E%3Cpolygon points='125,65 155,80 155,110 125,125 95,110 95,80' stroke-width='2.5'/%3E%3Ccircle cx='125' cy='125' r='15' fill='%23FFFFFF' opacity='0.3'/%3E%3Ctext x='125' y='130' text-anchor='middle' fill='%23FFFFFF' font-size='12' opacity='0.4'%3E256%3C/text%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              animation: 'spin 30s linear infinite',
              zIndex: 1,
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
          
          {/* Roasted Coffee Beans with Cryptographic Integration */}
          <Box
            sx={{
              position: 'absolute',
              top: '20%',
              left: '10%',
              width: '180px',
              height: '180px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='bean1' cx='40%25' cy='40%25'%3E%3Cstop offset='0%25' style='stop-color:%23D4A574;stop-opacity:1'/%3E%3Cstop offset='50%25' style='stop-color:%238B4513;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%235C3317;stop-opacity:1'/%3E%3C/radialGradient%3E%3CradialGradient id='bean2' cx='40%25' cy='40%25'%3E%3Cstop offset='0%25' style='stop-color:%23C19A6B;stop-opacity:1'/%3E%3Cstop offset='50%25' style='stop-color:%23704214;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%234A2511;stop-opacity:1'/%3E%3C/radialGradient%3E%3CradialGradient id='bean3' cx='40%25' cy='40%25'%3E%3Cstop offset='0%25' style='stop-color:%23B8956A;stop-opacity:1'/%3E%3Cstop offset='50%25' style='stop-color:%236F4E37;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%233E2723;stop-opacity:1'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cg opacity='0.85'%3E%3C!-- Coffee Bean 1 --%3E%3Cellipse cx='60' cy='50' rx='25' ry='35' fill='url(%23bean1)' stroke='%235C3317' stroke-width='2'/%3E%3Cpath d='M60,20 Q55,50 60,80' stroke='%23D4A574' stroke-width='2.5' fill='none' opacity='0.7'/%3E%3Cellipse cx='60' cy='35' rx='8' ry='12' fill='%23D4A574' opacity='0.4'/%3E%3C!-- Coffee Bean 2 --%3E%3Cellipse cx='110' cy='70' rx='28' ry='38' fill='url(%23bean2)' stroke='%234A2511' stroke-width='2' transform='rotate(25 110 70)'/%3E%3Cpath d='M95,45 Q110,70 125,95' stroke='%23C19A6B' stroke-width='2.5' fill='none' opacity='0.7'/%3E%3Cellipse cx='110' cy='60' rx='9' ry='14' fill='%23C19A6B' opacity='0.4' transform='rotate(25 110 70)'/%3E%3C!-- Coffee Bean 3 --%3E%3Cellipse cx='80' cy='120' rx='22' ry='32' fill='url(%23bean3)' stroke='%233E2723' stroke-width='2' transform='rotate(-15 80 120)'/%3E%3Cpath d='M70,92 Q80,120 90,148' stroke='%23B8956A' stroke-width='2.5' fill='none' opacity='0.7'/%3E%3Cellipse cx='80' cy='108' rx='7' ry='11' fill='%23B8956A' opacity='0.4' transform='rotate(-15 80 120)'/%3E%3C!-- Cryptographic connections --%3E%3Cpath d='M60,50 L110,70 L80,120' stroke='%23FFFFFF' stroke-width='1.5' stroke-dasharray='4,4' opacity='0.4'/%3E%3Ccircle cx='60' cy='50' r='4' fill='%23FFFFFF' opacity='0.6'/%3E%3Ccircle cx='110' cy='70' r='4' fill='%23FFFFFF' opacity='0.6'/%3E%3Ccircle cx='80' cy='120' r='4' fill='%23FFFFFF' opacity='0.6'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              animation: 'float 15s ease-in-out infinite',
              zIndex: 1,
            }}
          />
          
          {/* Additional Coffee Beans Cluster (Bottom Right) */}
          <Box
            sx={{
              position: 'absolute',
              bottom: '25%',
              right: '12%',
              width: '140px',
              height: '140px',
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='beanA' cx='40%25' cy='40%25'%3E%3Cstop offset='0%25' style='stop-color:%23C8A882;stop-opacity:1'/%3E%3Cstop offset='50%25' style='stop-color:%237B3F00;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%234E2A1C;stop-opacity:1'/%3E%3C/radialGradient%3E%3CradialGradient id='beanB' cx='40%25' cy='40%25'%3E%3Cstop offset='0%25' style='stop-color:%23D2B48C;stop-opacity:1'/%3E%3Cstop offset='50%25' style='stop-color:%23654321;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%233B2414;stop-opacity:1'/%3E%3C/radialGradient%3E%3CradialGradient id='beanC' cx='40%25' cy='40%25'%3E%3Cstop offset='0%25' style='stop-color:%23BC9B6A;stop-opacity:1'/%3E%3Cstop offset='50%25' style='stop-color:%236F4E37;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%233E2723;stop-opacity:1'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cg opacity='0.8'%3E%3C!-- Small Bean Cluster --%3E%3Cellipse cx='45' cy='45' rx='18' ry='26' fill='url(%23beanA)' stroke='%234E2A1C' stroke-width='1.5' transform='rotate(30 45 45)'/%3E%3Cpath d='M35,25 Q45,45 55,65' stroke='%23C8A882' stroke-width='2' fill='none' opacity='0.6'/%3E%3Cellipse cx='45' cy='38' rx='6' ry='9' fill='%23C8A882' opacity='0.4' transform='rotate(30 45 45)'/%3E%3Cellipse cx='75' cy='55' rx='20' ry='28' fill='url(%23beanB)' stroke='%233B2414' stroke-width='1.5' transform='rotate(-20 75 55)'/%3E%3Cpath d='M65,32 Q75,55 85,78' stroke='%23D2B48C' stroke-width='2' fill='none' opacity='0.6'/%3E%3Cellipse cx='75' cy='47' rx='7' ry='10' fill='%23D2B48C' opacity='0.4' transform='rotate(-20 75 55)'/%3E%3Cellipse cx='60' cy='90' rx='16' ry='24' fill='url(%23beanC)' stroke='%233E2723' stroke-width='1.5'/%3E%3Cpath d='M60,68 Q58,90 60,112' stroke='%23BC9B6A' stroke-width='2' fill='none' opacity='0.6'/%3E%3Cellipse cx='60' cy='82' rx='5' ry='8' fill='%23BC9B6A' opacity='0.4'/%3E%3C!-- Hexagonal connection --%3E%3Cpolygon points='60,30 80,40 80,60 60,70 40,60 40,40' stroke='%23FFFFFF' stroke-width='1.5' fill='none' opacity='0.3' stroke-dasharray='3,3'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              animation: 'float 18s ease-in-out infinite',
              animationDelay: '2s',
              zIndex: 1,
            }}
          />
          
          <Box sx={{ maxWidth: 480, mx: 'auto', position: 'relative', zIndex: 2 }}>
            {/* Main Title - Centered */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
                <Coffee size={40} color="#FFFFFF" />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 700, 
                    color: '#FFFFFF',
                    letterSpacing: '0.5px'
                  }}
                >
                  Coffee Export Consortium
                </Typography>
              </Stack>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.95)', 
                  fontWeight: 400,
                  fontStyle: 'italic',
                  lineHeight: 1.6
                }}
              >
                The unified platform for secure, transparent, and efficient coffee export management.
              </Typography>
            </Box>

            <Stack spacing={3}>
              {features.map((feature, idx) => (
                <Stack direction="row" spacing={2} alignItems="center" key={idx}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
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
                {mode === 'login' ? 'Welcome' : 'Register as Exporter'}
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
                  <StyledButton
                    type="button"
                    variant="outlined"
                    fullWidth
                    disabled={loading}
                    startIcon={<UserPlus size={20} />}
                    onClick={() => {
                      console.log('Register button clicked');
                      setMode('register');
                    }}
                    sx={{ mt: 2 }}
                  >
                    Register as New Exporter
                  </StyledButton>
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
              sx={{ 
                mt: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                color: 'text.secondary',
              }}
            >
              <ShieldCheck size={16} style={{ color: '#A855F7' }} />
              Secured by Hyperledger Fabric with 256-bit Encryption
            </Typography>
          </Box>
        </FormContainer>
      </LoginPaper>
    </LoginPageContainer>
  );
};

export default Login;
