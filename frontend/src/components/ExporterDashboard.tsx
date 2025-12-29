import React, { useEffect, useState } from 'react';
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
} from '@mui/icons-material';
import ectaPreRegistrationService from '../services/ectaPreRegistration';

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
        exportLicenseNumber: string | null;
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
}

const ExporterDashboard: React.FC<ExporterDashboardProps> = ({ exporterId, tin }) => {
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
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
                    throw new Error('Either exporterId or tin must be provided');
                }

                setDashboard(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [exporterId, tin]);

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
            </Paper>

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
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Registration Number:</strong> <Chip label={dashboard.documents.registrationNumber} size="small" color="primary" />
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Lab Certification:</strong> {dashboard.documents.laboratoryCertificationNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Taster Certificate:</strong> {dashboard.documents.tasterCertificateNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Competence Certificate:</strong> {dashboard.documents.competenceCertificateNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                <strong>Export License:</strong> {dashboard.documents.exportLicenseNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
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
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
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
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
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
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
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
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
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
