/**
 * Exporter Pre-Registration Page
 * Multi-step wizard for exporter qualification process
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  Business,
  Science,
  Person,
  VerifiedUser,
  Description,
  Schedule,
} from '@mui/icons-material';
import ectaPreRegistrationService from '../services/ectaPreRegistration';
import { PageContainer, RegistrationPaper } from './ExporterPreRegistration.styles';
import PreRegistrationWorkflowTracker from '../components/PreRegistrationWorkflowTracker';

const steps = [
  'Business Profile',
  'Laboratory Registration',
  'Taster Registration',
  'Competence Certificate',
  'Export License',
];

interface ExporterPreRegistrationProps {
  user: any;
  org: string | null;
}

const ExporterPreRegistration = ({ user, org }: ExporterPreRegistrationProps): JSX.Element => {
  const [searchParams] = useSearchParams();
  const stepParam = searchParams.get('step');
  const initialStep = stepParam ? parseInt(stepParam, 10) : 0;
  const [activeStep, setActiveStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [qualificationStatus, setQualificationStatus] = useState(null);

  // Form data
  const [profileData, setProfileData] = useState({
    businessName: '',
    tin: '',
    registrationNumber: '',
    businessType: 'PRIVATE',
    minimumCapital: 15000000,
    capitalVerified: false,
    capitalProofDocument: '', // IPFS hash or document ID
    officeAddress: '',
    city: '',
    region: '',
    contactPerson: '',
    email: '',
    phone: '',
  });

  const [laboratoryData, setLaboratoryData] = useState({
    laboratoryName: '',
    address: '',
    city: '',
    region: '',
    contactPerson: '',
    phone: '',
    email: '',
    equipment: [],
    hasRoastingFacility: false,
    hasCuppingRoom: false,
    hasSampleStorage: false,
  });

  const [tasterData, setTasterData] = useState({
    fullName: '',
    dateOfBirth: '',
    nationalId: '',
    qualificationLevel: 'CERTIFICATE',
    qualificationDocument: '',
    proficiencyCertificateNumber: '',
    certificateIssueDate: '',
    certificateExpiryDate: '',
    employmentStartDate: new Date().toISOString().split('T')[0], // Default to today
    employmentContract: '',
    phone: '',
    email: '',
  });

  const [competenceData, setCompetenceData] = useState({
    applicationReason: '',
    businessExperience: '',
    exportPlans: '',
    qualityStandards: '',
    facilityDescription: '',
    equipmentList: '',
    staffCount: 0,
    annualCapacity: 0,
    targetMarkets: '',
    certificationGoals: '',
    additionalDocuments: [],
  });

  const [licenseData, setLicenseData] = useState({
    licenseType: 'STANDARD',
    eicRegistrationNumber: '',
    requestedCoffeeTypes: ['ARABICA', 'ROBUSTA'], // Default values
    requestedOrigins: ['SIDAMA', 'YIRGACHEFFE', 'HARRAR'], // Default values
    exportDestinations: '',
    annualExportVolume: 0,
    businessPlan: '',
    marketingStrategy: '',
    qualityAssuranceProcess: '',
    complianceCommitment: false,
    environmentalCompliance: false,
    socialResponsibility: false,
  });

  // Auto-save key based on user ID
  const DRAFT_KEY = `exporter_registration_draft_${user?.id || 'guest'}`;

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.profileData) setProfileData(parsed.profileData);
        if (parsed.laboratoryData) setLaboratoryData(parsed.laboratoryData);
        if (parsed.tasterData) setTasterData(parsed.tasterData);
        if (parsed.competenceData) setCompetenceData(parsed.competenceData);
        if (parsed.licenseData) setLicenseData(parsed.licenseData);

        // Restore step if valid
        if (typeof parsed.activeStep === 'number' && parsed.activeStep >= 0 && parsed.activeStep < steps.length) {
          // Only restore step if no URL param overrides it
          const stepParam = searchParams.get('step');
          if (!stepParam) {
            setActiveStep(parsed.activeStep);
          }
        }
      } catch (e) {
        console.error("Failed to restore draft", e);
      }
    }
  }, [user?.id, DRAFT_KEY, searchParams]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    const draft = {
      profileData,
      laboratoryData,
      tasterData,
      competenceData,
      licenseData,
      activeStep
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [profileData, laboratoryData, tasterData, competenceData, licenseData, activeStep, DRAFT_KEY]);

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    window.location.reload(); // Simple way to reset state
  };

  // Load qualification status on mount
  useEffect(() => {
    loadQualificationStatus();
  }, []);

  // Update active step when URL parameter changes
  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (step >= 0 && step < steps.length) {
        setActiveStep(step);
      }
    }
  }, [searchParams]);

  const loadQualificationStatus = async () => {
    try {
      const status = await ectaPreRegistrationService.checkQualificationStatus();
      setQualificationStatus(status);

      // Auto-advance to next incomplete step only if no URL step parameter
      const stepParam = searchParams.get('step');
      if (!stepParam && status.profile?.status === 'ACTIVE') {
        if (!status.laboratory?.certified) {
          setActiveStep(1);
        } else if (!status.taster?.verified) {
          setActiveStep(2);
        } else if (!status.competenceCertificate?.valid) {
          setActiveStep(3);
        } else if (!status.exportLicense?.valid) {
          setActiveStep(4);
        }
      }
    } catch (err) {
      console.error('Failed to load qualification status:', err);
    }
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (activeStep === 0) {
      // Basic validation for business profile
      if (!profileData.businessName || !profileData.tin) {
        setError('Please fill in all required fields');
        return;
      }
    } else if (activeStep === 1) {
      // Basic validation for laboratory registration
      if (!laboratoryData.laboratoryName || !laboratoryData.address) {
        setError('Please fill in all required laboratory information');
        return;
      }
    } else if (activeStep === 2) {
      // Basic validation for taster registration
      if (!tasterData.fullName || !tasterData.proficiencyCertificateNumber || !tasterData.certificateIssueDate) {
        setError('Please fill in all required taster information');
        return;
      }
    } else if (activeStep === 3) {
      // Basic validation for competence certificate
      if (!competenceData.applicationReason || !competenceData.businessExperience || !competenceData.exportPlans) {
        setError('Please fill in all required competence certificate information');
        return;
      }
    } else if (activeStep === 4) {
      // Basic validation for export license
      if (!licenseData.eicRegistrationNumber || !licenseData.exportDestinations || !licenseData.businessPlan || !licenseData.complianceCommitment) {
        setError('Please fill in all required license information including EIC registration number and accept compliance commitments');
        return;
      }
    }

    setError(null);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleProfileSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await ectaPreRegistrationService.registerProfile(profileData);
      setSuccess('Profile registered successfully! Waiting for ECTA approval.');
      await loadQualificationStatus();
      // Auto-advance
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLaboratorySubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await ectaPreRegistrationService.registerLaboratory(laboratoryData);
      setSuccess('Laboratory registered successfully! Waiting for ECTA certification.');
      await loadQualificationStatus();
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register laboratory');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileResubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const exporterId = qualificationStatus?.profile?.exporter_id || user?.organizationId;
      if (!exporterId) {
        setError('Exporter ID not found');
        return;
      }

      await ectaPreRegistrationService.resubmitProfile(exporterId);
      setSuccess('Profile resubmitted successfully! Waiting for ECTA review.');
      await loadQualificationStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resubmit profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLaboratoryResubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const laboratoryId = qualificationStatus?.laboratory?.laboratory_id;
      if (!laboratoryId) {
        setError('Laboratory ID not found');
        return;
      }

      await ectaPreRegistrationService.resubmitLaboratory(laboratoryId);
      setSuccess('Laboratory resubmitted successfully! Waiting for ECTA certification.');
      await loadQualificationStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resubmit laboratory');
    } finally {
      setLoading(false);
    }
  };

  const handleTasterSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await ectaPreRegistrationService.registerTaster(tasterData);
      setSuccess('Taster registered successfully! Waiting for ECTA verification.');
      await loadQualificationStatus();
      setActiveStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register taster');
    } finally {
      setLoading(false);
    }
  };

  const handleCompetenceApply = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Map rich frontend data to backend schema
      // We combine multiple fields into the text fields supported by the backend
      // to ensure no information is lost during the application process.
      const payload = {
        applicationReason: `
Reason: ${competenceData.applicationReason}
Experience: ${competenceData.businessExperience}
Plans: ${competenceData.exportPlans}
        `.trim(),
        facilityDescription: `
Description: ${competenceData.facilityDescription}
Equipment: ${competenceData.equipmentList}
Staff Count: ${competenceData.staffCount}
Annual Capacity: ${competenceData.annualCapacity}
Target Markets: ${competenceData.targetMarkets}
Certification Goals: ${competenceData.certificationGoals}
Quality Standards: ${competenceData.qualityStandards}
        `.trim(),
        additionalDocuments: competenceData.additionalDocuments || []
      };

      await ectaPreRegistrationService.applyForCompetenceCertificate(payload);
      setSuccess('Competence certificate application submitted! Waiting for ECTA inspection.');
      await loadQualificationStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply for competence certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleLicenseApply = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await ectaPreRegistrationService.applyForExportLicense(licenseData);
      setSuccess('Export license application submitted! Waiting for ECTA approval.');
      await loadQualificationStatus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply for export license');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                Business Profile Registration
              </Typography>
              <Button color="error" variant="text" size="small" onClick={handleClearDraft}>
                Clear Draft
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Register your business with ECTA. Minimum capital requirement: ETB {profileData.businessType === 'FARMER' ? '0 (Exempt)' : (profileData.businessType === 'PRIVATE' ? '15,000,000' : '20,000,000')}
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Name"
                  value={profileData.businessName}
                  onChange={(e) => setProfileData({ ...profileData, businessName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="TIN Number"
                  value={profileData.tin}
                  onChange={(e) => setProfileData({ ...profileData, tin: e.target.value })}
                  required
                />
              </Grid>
              {/* Registration Number is now auto-generated by the system */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Business Type</InputLabel>
                  <Select
                    value={profileData.businessType}
                    onChange={(e) => setProfileData({ ...profileData, businessType: e.target.value })}
                  >
                    <MenuItem value="PRIVATE">Private Limited Company</MenuItem>
                    <MenuItem value="JOINT_STOCK">Share Company</MenuItem>
                    <MenuItem value="TRADE_ASSOCIATION">Trade Association</MenuItem>
                    <MenuItem value="FARMER">Farmer-Exporter</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Capital (ETB)"
                  type="number"
                  value={profileData.minimumCapital}
                  onChange={(e) => setProfileData({ ...profileData, minimumCapital: parseFloat(e.target.value) })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Office Address"
                  value={profileData.officeAddress}
                  onChange={(e) => setProfileData({ ...profileData, officeAddress: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={profileData.city}
                  onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Region"
                  value={profileData.region}
                  onChange={(e) => setProfileData({ ...profileData, region: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={profileData.contactPerson}
                  onChange={(e) => setProfileData({ ...profileData, contactPerson: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  required
                />
              </Grid>
            </Grid>

            {/* Show rejection alert if profile is rejected */}
            {qualificationStatus?.profile?.status === 'REJECTED' && (
              <Alert severity="error" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Your profile was rejected
                </Typography>
                <Typography variant="body2">
                  <strong>Reason:</strong> {qualificationStatus.profile.rejection_reason || 'No reason provided'}
                </Typography>
                {qualificationStatus.profile.rejected_at && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Rejected on {new Date(qualificationStatus.profile.rejected_at).toLocaleString()}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Please update the information above and click "Resubmit Profile" to submit for review again.
                </Typography>
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {qualificationStatus?.profile ? (
                  <>
                    {qualificationStatus.profile.status === 'REJECTED' ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleProfileResubmit}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Resubmit Profile'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          onClick={handleProfileSubmit}
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Update Profile'}
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={loading}
                        >
                          Next
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleProfileSubmit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register & Continue'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <Science sx={{ mr: 1, verticalAlign: 'middle' }} />
              Laboratory Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Register your ECTA-certified coffee laboratory (mandatory for non-farmer exporters)
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Laboratory Name"
                  value={laboratoryData.laboratoryName}
                  onChange={(e) => setLaboratoryData({ ...laboratoryData, laboratoryName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Address"
                  value={laboratoryData.address}
                  onChange={(e) => setLaboratoryData({ ...laboratoryData, address: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={laboratoryData.city}
                  onChange={(e) => setLaboratoryData({ ...laboratoryData, city: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Region"
                  value={laboratoryData.region}
                  onChange={(e) => setLaboratoryData({ ...laboratoryData, region: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact Person"
                  value={laboratoryData.contactPerson}
                  onChange={(e) => setLaboratoryData({ ...laboratoryData, contactPerson: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={laboratoryData.phone}
                  onChange={(e) => setLaboratoryData({ ...laboratoryData, phone: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={laboratoryData.email}
                  onChange={(e) => setLaboratoryData({ ...laboratoryData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={laboratoryData.hasRoastingFacility}
                      onChange={(e) => setLaboratoryData({ ...laboratoryData, hasRoastingFacility: e.target.checked })}
                    />
                  }
                  label="Has Roasting Facility"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={laboratoryData.hasCuppingRoom}
                      onChange={(e) => setLaboratoryData({ ...laboratoryData, hasCuppingRoom: e.target.checked })}
                    />
                  }
                  label="Has Cupping Room"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={laboratoryData.hasSampleStorage}
                      onChange={(e) => setLaboratoryData({ ...laboratoryData, hasSampleStorage: e.target.checked })}
                    />
                  }
                  label="Has Sample Storage"
                />
              </Grid>
            </Grid>

            {/* Show rejection alert if laboratory is rejected */}
            {qualificationStatus?.laboratory?.status === 'REJECTED' && (
              <Alert severity="error" sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Your laboratory certification was rejected
                </Typography>
                <Typography variant="body2">
                  <strong>Reason:</strong> {qualificationStatus.laboratory.rejection_reason || 'No reason provided'}
                </Typography>
                {qualificationStatus.laboratory.rejected_at && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Rejected on {new Date(qualificationStatus.laboratory.rejected_at).toLocaleString()}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Please update the information above and click "Resubmit Laboratory" to submit for review again.
                </Typography>
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {qualificationStatus?.laboratory ? (
                  <>
                    {qualificationStatus.laboratory.status === 'REJECTED' ? (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleLaboratoryResubmit}
                        disabled={loading}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Resubmit Laboratory'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          onClick={handleLaboratorySubmit}
                          disabled={loading}
                        >
                          {loading ? <CircularProgress size={24} /> : 'Update Laboratory'}
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          disabled={loading}
                        >
                          Next
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleLaboratorySubmit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register & Continue'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Coffee Taster Registration
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Register your qualified coffee taster with valid proficiency certificate
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={tasterData.fullName}
                  onChange={(e) => setTasterData({ ...tasterData, fullName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={tasterData.dateOfBirth}
                  onChange={(e) => setTasterData({ ...tasterData, dateOfBirth: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="National ID"
                  value={tasterData.nationalId}
                  onChange={(e) => setTasterData({ ...tasterData, nationalId: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Qualification Level"
                  select
                  value={tasterData.qualificationLevel}
                  onChange={(e) => setTasterData({ ...tasterData, qualificationLevel: e.target.value })}
                >
                  <MenuItem value="CERTIFICATE">Certificate</MenuItem>
                  <MenuItem value="DIPLOMA">Diploma</MenuItem>
                  <MenuItem value="DEGREE">Degree</MenuItem>
                  <MenuItem value="MASTER">Master</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Proficiency Certificate Number"
                  value={tasterData.proficiencyCertificateNumber}
                  onChange={(e) => setTasterData({ ...tasterData, proficiencyCertificateNumber: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Certificate Issue Date"
                  type="date"
                  value={tasterData.certificateIssueDate}
                  onChange={(e) => setTasterData({ ...tasterData, certificateIssueDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Certificate Expiry Date"
                  type="date"
                  value={tasterData.certificateExpiryDate}
                  onChange={(e) => setTasterData({ ...tasterData, certificateExpiryDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employment Start Date"
                  type="date"
                  value={tasterData.employmentStartDate}
                  onChange={(e) => setTasterData({ ...tasterData, employmentStartDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={tasterData.phone}
                  onChange={(e) => setTasterData({ ...tasterData, phone: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={tasterData.email}
                  onChange={(e) => setTasterData({ ...tasterData, email: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>Back</Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {qualificationStatus?.taster ? (
                  <>
                    <Button
                      variant="outlined"
                      onClick={handleTasterSubmit}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Update Taster'}
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={loading}
                    >
                      Next
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleTasterSubmit}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Register & Continue'}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <VerifiedUser sx={{ mr: 1, verticalAlign: 'middle' }} />
              Competence Certificate Application
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Apply for your competence certificate. ECTA will inspect your facilities before issuance.
            </Typography>

            {qualificationStatus?.profile && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Prerequisites Check:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {qualificationStatus.profile?.status === 'ACTIVE' ? (
                        <CheckCircle color="success" />
                      ) : (
                        <RadioButtonUnchecked color="disabled" />
                      )}
                      <Typography>Business Profile Approved</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {qualificationStatus.laboratory?.certified ? (
                        <CheckCircle color="success" />
                      ) : (
                        <RadioButtonUnchecked color="disabled" />
                      )}
                      <Typography>Laboratory Certified</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {qualificationStatus.taster?.verified ? (
                        <CheckCircle color="success" />
                      ) : (
                        <RadioButtonUnchecked color="disabled" />
                      )}
                      <Typography>Taster Verified</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Application Reason"
                  multiline
                  rows={3}
                  value={competenceData.applicationReason}
                  onChange={(e) => setCompetenceData({ ...competenceData, applicationReason: e.target.value })}
                  placeholder="Explain why you are applying for a competence certificate"
                  required
                  helperText="Required field"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Business Experience (years)"
                  value={competenceData.businessExperience}
                  onChange={(e) => setCompetenceData({ ...competenceData, businessExperience: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Staff Count"
                  type="number"
                  value={competenceData.staffCount}
                  onChange={(e) => setCompetenceData({ ...competenceData, staffCount: parseInt(e.target.value) || 0 })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Annual Capacity (tons)"
                  type="number"
                  value={competenceData.annualCapacity}
                  onChange={(e) => setCompetenceData({ ...competenceData, annualCapacity: parseInt(e.target.value) || 0 })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Target Markets"
                  value={competenceData.targetMarkets}
                  onChange={(e) => setCompetenceData({ ...competenceData, targetMarkets: e.target.value })}
                  placeholder="e.g., Europe, USA, Asia"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Export Plans"
                  multiline
                  rows={3}
                  value={competenceData.exportPlans}
                  onChange={(e) => setCompetenceData({ ...competenceData, exportPlans: e.target.value })}
                  placeholder="Describe your export plans and strategies"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quality Standards"
                  multiline
                  rows={2}
                  value={competenceData.qualityStandards}
                  onChange={(e) => setCompetenceData({ ...competenceData, qualityStandards: e.target.value })}
                  placeholder="Quality standards you follow (e.g., SCA, Organic, Fair Trade)"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Facility Description"
                  multiline
                  rows={3}
                  value={competenceData.facilityDescription}
                  onChange={(e) => setCompetenceData({ ...competenceData, facilityDescription: e.target.value })}
                  placeholder="Describe your processing and storage facilities"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Equipment List"
                  multiline
                  rows={2}
                  value={competenceData.equipmentList}
                  onChange={(e) => setCompetenceData({ ...competenceData, equipmentList: e.target.value })}
                  placeholder="List your processing equipment"
                  required
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={handleCompetenceApply}
                  disabled={loading || !competenceData.applicationReason || !competenceData.businessExperience || !competenceData.exportPlans}
                >
                  {loading ? <CircularProgress size={24} /> : 'Apply for Certificate'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading || !competenceData.applicationReason || !competenceData.businessExperience || !competenceData.exportPlans}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Box>
        );

      case 4:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
              Export License Application
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Apply for your export license. This is the final step before you can create export requests.
            </Typography>

            {qualificationStatus && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>
                    Qualification Status:
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {qualificationStatus.profile?.status === 'ACTIVE' ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Schedule color="warning" />
                        )}
                        <Typography>Business Profile</Typography>
                      </Box>
                      <Typography variant="caption" color={qualificationStatus.profile?.status === 'ACTIVE' ? 'success.main' : 'warning.main'}>
                        {qualificationStatus.profile?.status === 'ACTIVE' ? 'Approved' : 'Pending'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {qualificationStatus.laboratory?.certified ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Schedule color="warning" />
                        )}
                        <Typography>Laboratory</Typography>
                      </Box>
                      <Typography variant="caption" color={qualificationStatus.laboratory?.certified ? 'success.main' : 'warning.main'}>
                        {qualificationStatus.laboratory?.certified ? 'Certified' : 'Pending'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {qualificationStatus.taster?.verified ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Schedule color="warning" />
                        )}
                        <Typography>Taster</Typography>
                      </Box>
                      <Typography variant="caption" color={qualificationStatus.taster?.verified ? 'success.main' : 'warning.main'}>
                        {qualificationStatus.taster?.verified ? 'Verified' : 'Pending'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {qualificationStatus.competenceCertificate?.valid ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Schedule color="warning" />
                        )}
                        <Typography>Competence Certificate</Typography>
                      </Box>
                      <Typography variant="caption" color={qualificationStatus.competenceCertificate?.valid ? 'success.main' : 'warning.main'}>
                        {qualificationStatus.competenceCertificate?.valid ? 'Valid' : 'Pending'}
                      </Typography>
                    </Box>
                  </Box>

                  {qualificationStatus.isQualified && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      âœ… You are qualified to apply for an export license!
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>License Type</InputLabel>
                  <Select
                    value={licenseData.licenseType}
                    onChange={(e) => setLicenseData({ ...licenseData, licenseType: e.target.value })}
                  >
                    <MenuItem value="STANDARD">Standard Export License</MenuItem>
                    <MenuItem value="PREMIUM">Premium Export License</MenuItem>
                    <MenuItem value="ORGANIC">Organic Export License</MenuItem>
                    <MenuItem value="SPECIALTY">Specialty Coffee License</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Annual Export Volume (tons)"
                  type="number"
                  value={licenseData.annualExportVolume}
                  onChange={(e) => setLicenseData({ ...licenseData, annualExportVolume: parseInt(e.target.value) || 0 })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="EIC Registration Number"
                  value={licenseData.eicRegistrationNumber}
                  onChange={(e) => setLicenseData({ ...licenseData, eicRegistrationNumber: e.target.value })}
                  placeholder="Enter your Ethiopian Investment Commission registration number"
                  required
                  helperText="Required for export license application"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Requested Coffee Types</InputLabel>
                  <Select
                    multiple
                    value={licenseData.requestedCoffeeTypes}
                    onChange={(e) => {
                      const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                      setLicenseData({ ...licenseData, requestedCoffeeTypes: value });
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="ARABICA">Arabica</MenuItem>
                    <MenuItem value="ROBUSTA">Robusta</MenuItem>
                    <MenuItem value="LIBERICA">Liberica</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Requested Origins</InputLabel>
                  <Select
                    multiple
                    value={licenseData.requestedOrigins}
                    onChange={(e) => {
                      const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                      setLicenseData({ ...licenseData, requestedOrigins: value });
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="SIDAMA">Sidama</MenuItem>
                    <MenuItem value="YIRGACHEFFE">Yirgacheffe</MenuItem>
                    <MenuItem value="HARRAR">Harrar</MenuItem>
                    <MenuItem value="LIMU">Limu</MenuItem>
                    <MenuItem value="JIMMA">Jimma</MenuItem>
                    <MenuItem value="GUJI">Guji</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Export Destinations"
                  value={licenseData.exportDestinations}
                  onChange={(e) => setLicenseData({ ...licenseData, exportDestinations: e.target.value })}
                  placeholder="List countries/regions you plan to export to"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Business Plan"
                  multiline
                  rows={4}
                  value={licenseData.businessPlan}
                  onChange={(e) => setLicenseData({ ...licenseData, businessPlan: e.target.value })}
                  placeholder="Describe your export business plan and strategy"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Marketing Strategy"
                  multiline
                  rows={3}
                  value={licenseData.marketingStrategy}
                  onChange={(e) => setLicenseData({ ...licenseData, marketingStrategy: e.target.value })}
                  placeholder="Describe your marketing approach and target customers"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Quality Assurance Process"
                  multiline
                  rows={3}
                  value={licenseData.qualityAssuranceProcess}
                  onChange={(e) => setLicenseData({ ...licenseData, qualityAssuranceProcess: e.target.value })}
                  placeholder="Describe your quality control and assurance processes"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Compliance Commitments
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={licenseData.complianceCommitment}
                      onChange={(e) => setLicenseData({ ...licenseData, complianceCommitment: e.target.checked })}
                    />
                  }
                  label="I commit to comply with all Ethiopian coffee export regulations"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={licenseData.environmentalCompliance}
                      onChange={(e) => setLicenseData({ ...licenseData, environmentalCompliance: e.target.checked })}
                    />
                  }
                  label="I commit to environmental sustainability practices"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={licenseData.socialResponsibility}
                      onChange={(e) => setLicenseData({ ...licenseData, socialResponsibility: e.target.checked })}
                    />
                  }
                  label="I commit to social responsibility and fair trade practices"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
              >
                Back
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={handleLicenseApply}
                  disabled={loading || !licenseData.eicRegistrationNumber || !licenseData.exportDestinations || !licenseData.businessPlan || !licenseData.complianceCommitment}
                >
                  {loading ? <CircularProgress size={24} /> : 'Apply for License'}
                </Button>
              </Box>
            </Box>
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <PageContainer>
      <RegistrationPaper elevation={3}>
        <Typography variant="h4" gutterBottom>
          Exporter Pre-Registration
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Complete all steps to qualify for coffee export operations
        </Typography>

        {/* Workflow Progress Tracker */}
        {qualificationStatus && (
          <Box sx={{ mb: 4 }}>
            <PreRegistrationWorkflowTracker
              data={{
                profile: qualificationStatus.profile,
                laboratory: qualificationStatus.laboratory,
                taster: qualificationStatus.taster,
                competenceCertificate: qualificationStatus.competenceCertificate,
                exportLicense: qualificationStatus.exportLicense,
              }}
              onAction={(action: string, stage?: string) => {
                // Handle workflow actions
                if (action === 'start' && stage) {
                  const stageMap: Record<string, number> = {
                    profile: 0,
                    laboratory: 1,
                    taster: 2,
                    competenceCertificate: 3,
                    exportLicense: 4,
                  };
                  setActiveStep(stageMap[stage] || 0);
                }
              }}
            />
          </Box>
        )}


        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)} variant="filled">
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)} variant="filled">
            {success}
          </Alert>
        )}

        {renderStepContent(activeStep)}
      </RegistrationPaper>
    </PageContainer>
  );
};

export default ExporterPreRegistration;
