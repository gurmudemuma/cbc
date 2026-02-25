import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Divider,
    CircularProgress,
    Alert,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Tooltip,
    IconButton,
} from '@mui/material';
import {
    CheckCircle,
    Cancel,
    HourglassEmpty,
    Business,
    ContactMail,
    Description,
    Verified,
    Warning,
    ArrowForward,
    Lock,
    Science,
    Person,
    EmojiEvents,
    CardMembership,
    Download,
    Visibility,
} from '@mui/icons-material';
import ectaPreRegistrationService from '../services/ectaPreRegistration';
import * as ectaService from '../services/ecta.service';

interface DashboardData {
    identity: {
        exporterId: string;
        businessName: string;
        tin: string;
        registrationNumber: string;
        businessType: string;
    };
    contact: {
        contactPerson: string;
        email: string;
        phone: string;
        officeAddress: string;
        city: string;
        region: string;
    };
    compliance: {
        profileStatus: string;
        profileApproved: boolean;
        capitalVerified: boolean;
        laboratoryStatus: string;
        laboratoryApproved: boolean;
        tasterStatus: string;
        tasterApproved: boolean;
        competenceStatus: string;
        competenceApproved: boolean;
        licenseStatus: string;
        licenseApproved: boolean;
        isFullyQualified: boolean;
    };
    documents: {
        registrationNumber: string;
        laboratoryCertificationNumber: string | null;
        tasterCertificateNumber: string | null;
        competenceCertificateNumber: string | null;
        competenceCertificateId: string | null;
        exportLicenseNumber: string | null;
        exportLicenseId: string | null;
        eicRegistrationNumber: string | null;
    };
    validation: {
        isValid: boolean;
        issues: string[];
        requiredActions: string[];
    };
    metadata: {
        lastUpdated: string;
        createdAt: string;
    };
}

interface ExporterDashboardProps {
    exporterId?: string;
    tin?: string;
    dashboardData?: DashboardData;
}

const ExporterDashboard: React.FC<ExporterDashboardProps> = ({ exporterId, tin, dashboardData: propDashboardData }) => {
    const navigate = useNavigate();
    const [dashboard, setDashboard] = useState<DashboardData | null>(propDashboardData || null);
    const [loading, setLoading] = useState(!propDashboardData);
    const [error, setError] = useState<string | null>(null);
    const [navigatingToESW, setNavigatingToESW] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        // If dashboard data is provided as prop, use it directly
        if (propDashboardData) {
            setDashboard(propDashboardData);
            setLoading(false);
            return;
        }

        // Otherwise fetch it (for ECTA officials viewing other exporters)
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                setError(null);

                let response;
                if (exporterId) {
                    response = await ectaPreRegistrationService.getExporterDashboard(exporterId);
                } else if (tin) {
                    response = await ectaPreRegistrationService.getExporterDashboardByTin(tin);
                } else {
                    throw new Error('Either exporterId, tin, or dashboardData must be provided');
                }

                setDashboard(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [exporterId, tin, propDashboardData]);

    const handleDownloadCompetenceCertificate = async (certificateId: string) => {
        try {
            setDownloading(certificateId);
            setError(null);
            await ectaService.downloadCompetenceCertificate(certificateId);
            setSuccess('Certificate downloaded successfully');
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You do not have permission to download this certificate');
            } else if (err.response?.status === 404) {
                setError('Certificate not found or PDF not generated yet');
            } else {
                setError('Failed to download certificate. Please try again.');
            }
            console.error('Download error:', err);
        } finally {
            setDownloading(null);
        }
    };

    const handleDownloadExportLicense = async (licenseId: string) => {
        try {
            setDownloading(licenseId);
            setError(null);
            await ectaService.downloadExportLicense(licenseId);
            setSuccess('License downloaded successfully');
        } catch (err: any) {
            if (err.response?.status === 403) {
                setError('You do not have permission to download this license');
            } else if (err.response?.status === 404) {
                setError('License not found or PDF not generated yet');
            } else {
                setError('Failed to download license. Please try again.');
            }
            console.error('Download error:', err);
        } finally {
            setDownloading(null);
        }
    };

    const handleNavigateToESW = async () => {
        try {
            setNavigatingToESW(true);
            
            // Fetch pre-fill data from the API
            const token = localStorage.getItem('token');
            const response = await fetch('/api/exporter/esw-prefill', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch pre-fill data');
            }

            const result = await response.json();

            if (result.success && result.data.isQualified) {
                // Navigate to ESW submission with pre-fill data
                navigate('/esw/submission', {
                    state: { prefillData: result.data }
                });
            } else {
                alert('You must complete all pre-registration requirements first:\n' + 
                      (result.data.validation?.requiredActions || []).join('\n'));
            }
        } catch (err: any) {
            console.error('Failed to navigate to ESW:', err);
            alert('Failed to load your information. Please try again.');
        } finally {
            setNavigatingToESW(false);
        }
    };

    const getStatusIcon = (status: string, approved: boolean) => {
        if (approved) return <CheckCircle color="success" />;
        if (status === 'PENDING' || status === 'PENDING_APPROVAL') return <HourglassEmpty color="warning" />;
        if (status === 'MISSING') return <Cancel color="disabled" />;
        return <Cancel color="error" />;
    };

    const getStatusColor = (status: string, approved: boolean): "success" | "warning" | "error" | "default" => {
        if (approved) return 'success';
        if (status === 'PENDING' || status === 'PENDING_APPROVAL') return 'warning';
        if (status === 'MISSING') return 'default';
        return 'error';
    };

    const getActionButton = (step: string, status: string, approved: boolean) => {
        // Don't show button if already approved
        if (approved) {
            return null;
        }

        // Check if profile is approved (required for other steps)
        const profileApproved = dashboard?.compliance.profileApproved;

        switch (step) {
            case 'profile':
                if (status === 'PENDING' || status === 'PENDING_APPROVAL') {
                    return (
                        <Tooltip title="Waiting for ECTA approval">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<HourglassEmpty />}
                                    sx={{ mt: 1 }}
                                >
                                    Pending Approval
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                break;

            case 'laboratory':
                if (!profileApproved) {
                    return (
                        <Tooltip title="Complete profile approval first">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<Lock />}
                                    sx={{ mt: 1 }}
                                >
                                    Locked
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                if (status === 'PENDING') {
                    return (
                        <Tooltip title="Waiting for ECTA certification">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<HourglassEmpty />}
                                    sx={{ mt: 1 }}
                                >
                                    Pending Certification
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                return (
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<Science />}
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/pre-registration?step=1')}
                        sx={{ mt: 1 }}
                    >
                        Register Laboratory
                    </Button>
                );

            case 'taster':
                if (!profileApproved) {
                    return (
                        <Tooltip title="Complete profile approval first">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<Lock />}
                                    sx={{ mt: 1 }}
                                >
                                    Locked
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                if (status === 'PENDING') {
                    return (
                        <Tooltip title="Waiting for ECTA verification">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<HourglassEmpty />}
                                    sx={{ mt: 1 }}
                                >
                                    Pending Verification
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                return (
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<Person />}
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/pre-registration?step=2')}
                        sx={{ mt: 1 }}
                    >
                        Register Taster
                    </Button>
                );

            case 'competence':
                const labApproved = dashboard?.compliance.laboratoryApproved;
                const tasterApproved = dashboard?.compliance.tasterApproved;
                
                if (!profileApproved || !labApproved || !tasterApproved) {
                    return (
                        <Tooltip title="Complete laboratory and taster registration first">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<Lock />}
                                    sx={{ mt: 1 }}
                                >
                                    Locked
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                if (status === 'PENDING') {
                    return (
                        <Tooltip title="Waiting for ECTA to issue certificate">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<HourglassEmpty />}
                                    sx={{ mt: 1 }}
                                >
                                    Pending Issuance
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                return (
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<EmojiEvents />}
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/pre-registration?step=3')}
                        sx={{ mt: 1 }}
                    >
                        Apply for Certificate
                    </Button>
                );

            case 'license':
                const competenceApproved = dashboard?.compliance.competenceApproved;
                
                if (!profileApproved || !competenceApproved) {
                    return (
                        <Tooltip title="Complete competence certificate first">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<Lock />}
                                    sx={{ mt: 1 }}
                                >
                                    Locked
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                if (status === 'PENDING') {
                    return (
                        <Tooltip title="Waiting for ECTA to issue license">
                            <span>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    disabled
                                    startIcon={<HourglassEmpty />}
                                    sx={{ mt: 1 }}
                                >
                                    Pending Issuance
                                </Button>
                            </span>
                        </Tooltip>
                    );
                }
                return (
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<CardMembership />}
                        endIcon={<ArrowForward />}
                        onClick={() => navigate('/pre-registration?step=4')}
                        sx={{ mt: 1 }}
                    >
                        Apply for License
                    </Button>
                );

            default:
                return null;
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                {error}
            </Alert>
        );
    }

    if (!dashboard) {
        return (
            <Alert severity="info" sx={{ mt: 2 }}>
                No dashboard data available
            </Alert>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 1 }}>
                            <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
                            {dashboard.identity.businessName}
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            {dashboard.identity.businessType} • TIN: {dashboard.identity.tin}
                        </Typography>
                        <Chip
                            label={dashboard.compliance.isFullyQualified ? 'Fully Qualified' : 'Incomplete'}
                            color={dashboard.compliance.isFullyQualified ? 'success' : 'warning'}
                            icon={dashboard.compliance.isFullyQualified ? <Verified /> : <Warning />}
                            sx={{ mt: 2, fontWeight: 'bold' }}
                        />
                    </Box>
                    {dashboard.compliance.isFullyQualified && (
                        <Button
                            variant="contained"
                            size="large"
                            disabled={navigatingToESW}
                            sx={{
                                bgcolor: 'white',
                                color: '#667eea',
                                fontWeight: 'bold',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.9)',
                                }
                            }}
                            startIcon={navigatingToESW ? <CircularProgress size={20} /> : <ArrowForward />}
                            onClick={handleNavigateToESW}
                        >
                            {navigatingToESW ? 'Loading...' : 'Submit to ESW'}
                        </Button>
                    )}
                </Box>
            </Paper>

            {/* Success/Error Messages */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Identity & Contact */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <ContactMail sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Contact Information
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Contact Person:</strong> {dashboard.contact.contactPerson}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Email:</strong> {dashboard.contact.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Phone:</strong> {dashboard.contact.phone}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Address:</strong> {dashboard.contact.officeAddress}, {dashboard.contact.city}, {dashboard.contact.region}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Official Documents */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Official Documents
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Registration Number:</strong>
                                </Typography>
                                <Chip label={dashboard.documents.registrationNumber} size="small" color="primary" />
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Lab Certification:</strong> {dashboard.documents.laboratoryCertificationNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Taster Certificate:</strong> {dashboard.documents.tasterCertificateNumber || 'N/A'}
                            </Typography>
                            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Competence Certificate:</strong> {dashboard.documents.competenceCertificateNumber || 'N/A'}
                                </Typography>
                                {dashboard.documents.competenceCertificateId && (
                                    <Tooltip title="Download Certificate">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleDownloadCompetenceCertificate(dashboard.documents.competenceCertificateId!)}
                                            disabled={downloading === dashboard.documents.competenceCertificateId}
                                        >
                                            {downloading === dashboard.documents.competenceCertificateId ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <Download />
                                            )}
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>Export License:</strong> {dashboard.documents.exportLicenseNumber || 'N/A'}
                                </Typography>
                                {dashboard.documents.exportLicenseId && (
                                    <Tooltip title="Download License">
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleDownloadExportLicense(dashboard.documents.exportLicenseId!)}
                                            disabled={downloading === dashboard.documents.exportLicenseId}
                                        >
                                            {downloading === dashboard.documents.exportLicenseId ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <Download />
                                            )}
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 1 }}>
                                <strong>EIC Registration:</strong> {dashboard.documents.eicRegistrationNumber || 'N/A'}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Compliance Status */}
                <Grid item xs={12}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Verified sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Compliance Status
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getStatusIcon(dashboard.compliance.profileStatus, dashboard.compliance.profileApproved)}
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">Profile</Typography>
                                                <Chip
                                                    label={dashboard.compliance.profileStatus}
                                                    size="small"
                                                    color={getStatusColor(dashboard.compliance.profileStatus, dashboard.compliance.profileApproved)}
                                                />
                                            </Box>
                                        </Box>
                                        {getActionButton('profile', dashboard.compliance.profileStatus, dashboard.compliance.profileApproved)}
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getStatusIcon(dashboard.compliance.laboratoryStatus, dashboard.compliance.laboratoryApproved)}
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">Laboratory</Typography>
                                                <Chip
                                                    label={dashboard.compliance.laboratoryStatus}
                                                    size="small"
                                                    color={getStatusColor(dashboard.compliance.laboratoryStatus, dashboard.compliance.laboratoryApproved)}
                                                />
                                            </Box>
                                        </Box>
                                        {getActionButton('laboratory', dashboard.compliance.laboratoryStatus, dashboard.compliance.laboratoryApproved)}
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getStatusIcon(dashboard.compliance.tasterStatus, dashboard.compliance.tasterApproved)}
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">Taster</Typography>
                                                <Chip
                                                    label={dashboard.compliance.tasterStatus}
                                                    size="small"
                                                    color={getStatusColor(dashboard.compliance.tasterStatus, dashboard.compliance.tasterApproved)}
                                                />
                                            </Box>
                                        </Box>
                                        {getActionButton('taster', dashboard.compliance.tasterStatus, dashboard.compliance.tasterApproved)}
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getStatusIcon(dashboard.compliance.competenceStatus, dashboard.compliance.competenceApproved)}
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">Competence</Typography>
                                                <Chip
                                                    label={dashboard.compliance.competenceStatus}
                                                    size="small"
                                                    color={getStatusColor(dashboard.compliance.competenceStatus, dashboard.compliance.competenceApproved)}
                                                />
                                            </Box>
                                        </Box>
                                        {getActionButton('competence', dashboard.compliance.competenceStatus, dashboard.compliance.competenceApproved)}
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Box display="flex" flexDirection="column" gap={1}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {getStatusIcon(dashboard.compliance.licenseStatus, dashboard.compliance.licenseApproved)}
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">Export License</Typography>
                                                <Chip
                                                    label={dashboard.compliance.licenseStatus}
                                                    size="small"
                                                    color={getStatusColor(dashboard.compliance.licenseStatus, dashboard.compliance.licenseApproved)}
                                                />
                                            </Box>
                                        </Box>
                                        {getActionButton('license', dashboard.compliance.licenseStatus, dashboard.compliance.licenseApproved)}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Required Actions */}
                {dashboard.validation.requiredActions.length > 0 && (
                    <Grid item xs={12}>
                        <Alert severity="warning" icon={<Warning />}>
                            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                Required Actions
                            </Typography>
                            <List dense>
                                {dashboard.validation.requiredActions.map((action, index) => (
                                    <ListItem key={index}>
                                        <ListItemIcon>
                                            <Warning color="warning" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText primary={action} />
                                    </ListItem>
                                ))}
                            </List>
                        </Alert>
                    </Grid>
                )}
            </Grid>

            {/* Metadata */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3, textAlign: 'center' }}>
                Last Updated: {new Date(dashboard.metadata.lastUpdated).toLocaleString()} •
                Created: {new Date(dashboard.metadata.createdAt).toLocaleString()}
            </Typography>
        </Box>
    );
};

export default ExporterDashboard;
