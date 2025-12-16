import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Paper,
} from '@mui/material';
import {
  User,
  Building,
  CheckCircle,
  AlertCircle,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import exporterService from '../services/exporterService';

const VerificationCard = ({ verified, title, description }) => (
  <Card variant="outlined">
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        {verified ? (
          <span><CheckCircle size={20} color="#4caf50" /></span>
        ) : (
          <span><AlertCircle size={20} color="#ff9800" /></span>
        )}
        <Typography variant="h6">{title}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </CardContent>
  </Card>
);

const TabPanel = ({ children, value, index }) => {
  if (value !== index) return null;
  return <Box sx={{ p: 3 }}>{children}</Box>;
};

const ExporterProfile = ({ user, org }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    personalInfo: {
      fullName: user?.username || '',
      email: user?.email || '',
      phone: '',
      address: '',
      city: '',
      country: 'Ethiopia',
    },
    businessInfo: {
      companyName: '',
      businessType: 'PRIVATE',
      registrationNumber: '',
      taxId: '',
      establishedYear: '',
      employeeCount: '',
      annualRevenue: '',
    },
    verificationStatus: {
      profileComplete: false,
      documentsSubmitted: false,
      identityVerified: false,
      businessVerified: false,
    }
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (section, field, value) => {
    setProfileData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profile = await exporterService.getProfile();
        const verification = await exporterService.getVerificationStatus();
        
        setProfileData({
          personalInfo: {
            fullName: profile.fullName || user?.username || '',
            email: profile.email || user?.email || '',
            phone: profile.phone || '',
            address: profile.address || '',
            city: profile.city || '',
            country: profile.country || 'Ethiopia',
          },
          businessInfo: {
            companyName: profile.companyName || '',
            businessType: profile.businessType || 'PRIVATE',
            registrationNumber: profile.registrationNumber || '',
            taxId: profile.taxId || '',
            establishedYear: profile.establishedYear || '',
            employeeCount: profile.employeeCount || '',
            annualRevenue: profile.annualRevenue || '',
          },
          verificationStatus: verification || {
            profileComplete: false,
            documentsSubmitted: false,
            identityVerified: false,
            businessVerified: false,
          }
        });
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await exporterService.updateProfile({
        ...profileData.personalInfo,
        ...profileData.businessInfo,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Exporter Profile
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}>
                <span><User size={40} /></span>
              </Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {profileData.personalInfo.fullName || 'Complete Your Profile'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {profileData.businessInfo.companyName || 'Business information needed'}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={profileData.verificationStatus.profileComplete ? 'Verified' : 'Pending Verification'}
                    color={profileData.verificationStatus.profileComplete ? 'success' : 'warning'}
                    size="small"
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab icon={<span><User size={20} /></span>} label="Personal Info" />
            <Tab icon={<span><Building size={20} /></span>} label="Business Info" />
            <Tab icon={<span><CheckCircle size={20} /></span>} label="Verification Status" />
          </Tabs>

          {/* Personal Information Tab */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profileData.personalInfo.fullName}
                  onChange={(e) => handleInputChange('personalInfo', 'fullName', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileData.personalInfo.email}
                  onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profileData.personalInfo.phone}
                  onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Country"
                  value={profileData.personalInfo.country}
                  onChange={(e) => handleInputChange('personalInfo', 'country', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={3}
                  value={profileData.personalInfo.address}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Business Information Tab */}
          <TabPanel value={activeTab} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={profileData.businessInfo.companyName}
                  onChange={(e) => handleInputChange('businessInfo', 'companyName', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Registration Number"
                  value={profileData.businessInfo.registrationNumber}
                  onChange={(e) => handleInputChange('businessInfo', 'registrationNumber', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tax ID"
                  value={profileData.businessInfo.taxId}
                  onChange={(e) => handleInputChange('businessInfo', 'taxId', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Year Established"
                  type="number"
                  value={profileData.businessInfo.establishedYear}
                  onChange={(e) => handleInputChange('businessInfo', 'establishedYear', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Number of Employees"
                  type="number"
                  value={profileData.businessInfo.employeeCount}
                  onChange={(e) => handleInputChange('businessInfo', 'employeeCount', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Annual Revenue (USD)"
                  type="number"
                  value={profileData.businessInfo.annualRevenue}
                  onChange={(e) => handleInputChange('businessInfo', 'annualRevenue', e.target.value)}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Verification Status Tab */}
          <TabPanel value={activeTab} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Complete all verification steps to unlock full exporter capabilities.
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <VerificationCard
                  verified={profileData.verificationStatus.profileComplete}
                  title="Profile Complete"
                  description="All required profile information has been provided"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <VerificationCard
                  verified={profileData.verificationStatus.documentsSubmitted}
                  title="Documents Submitted"
                  description="Required business documents have been uploaded"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <VerificationCard
                  verified={profileData.verificationStatus.identityVerified}
                  title="Identity Verified"
                  description="Personal identity has been verified by authorities"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <VerificationCard
                  verified={profileData.verificationStatus.businessVerified}
                  title="Business Verified"
                  description="Business registration has been verified by ECTA"
                />
              </Grid>
            </Grid>
          </TabPanel>

          <Divider />
          
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<span><X size={20} /></span>}
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Save size={20} />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<span><Edit size={20} /></span>}
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default ExporterProfile;
