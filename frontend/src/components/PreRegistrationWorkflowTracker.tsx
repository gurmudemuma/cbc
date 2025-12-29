import {
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Typography,
    Box,
    Chip,
    Paper,
    Alert,
    Button,
} from '@mui/material';
import {
    UserPlus,
    Beaker,
    Users,
    Award,
    FileCheck,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';

/**
 * Pre-Registration Workflow Tracker Component
 * Visual stepper showing exporter's progress through ECTA pre-registration stages
 * Tracks: Profile → Laboratory → Taster → Competence Certificate → Export License
 */

interface PreRegistrationData {
    exporterId?: string;
    profile?: {
        status: string;
        businessName?: string;
        businessType?: string;
        approvedAt?: string;
        rejectedAt?: string;
        rejectionReason?: string;
    };
    laboratory?: {
        status: string;
        laboratoryName?: string;
        certifiedDate?: string;
        expiryDate?: string;
    };
    taster?: {
        status: string;
        fullName?: string;
        certificateExpiryDate?: string;
    };
    competenceCertificate?: {
        status: string;
        certificateNumber?: string;
        issuedDate?: string;
        expiryDate?: string;
    };
    exportLicense?: {
        status: string;
        licenseNumber?: string;
        issuedDate?: string;
        expiryDate?: string;
    };
}

interface PreRegistrationWorkflowTrackerProps {
    data: PreRegistrationData;
    onAction?: (action: string, stage: string) => void;
}

const PreRegistrationWorkflowTracker: React.FC<PreRegistrationWorkflowTrackerProps> = ({
    data,
    onAction
}) => {
    const stages = [
        {
            name: 'Exporter Profile',
            key: 'profile',
            icon: UserPlus,
            description: 'Register business details, TIN, and minimum capital',
            statuses: {
                pending: 'PENDING_APPROVAL',
                approved: 'ACTIVE',
                rejected: 'REJECTED',
            },
            requiredFor: 'All subsequent steps',
        },
        {
            name: 'Laboratory Certification',
            key: 'laboratory',
            icon: Beaker,
            description: 'ECTA-certified coffee laboratory with required equipment',
            statuses: {
                pending: 'PENDING',
                approved: 'ACTIVE',
                rejected: 'REJECTED',
                expired: 'EXPIRED',
            },
            requiredFor: 'Competence Certificate',
            exemptFor: 'FARMER',
        },
        {
            name: 'Coffee Taster Registration',
            key: 'taster',
            icon: Users,
            description: 'Qualified taster with valid proficiency certificate',
            statuses: {
                pending: 'PENDING',
                approved: 'ACTIVE',
                rejected: 'REJECTED',
                expired: 'EXPIRED',
            },
            requiredFor: 'Competence Certificate',
            exemptFor: 'FARMER',
        },
        {
            name: 'Competence Certificate',
            key: 'competenceCertificate',
            icon: Award,
            description: 'ECTA facility inspection and competence certification',
            statuses: {
                pending: 'PENDING',
                approved: 'ACTIVE',
                rejected: 'REJECTED',
                expired: 'EXPIRED',
            },
            requiredFor: 'Export License',
        },
        {
            name: 'Export License',
            key: 'exportLicense',
            icon: FileCheck,
            description: 'Official ECTA export license for coffee trade',
            statuses: {
                pending: 'PENDING_REVIEW',
                approved: 'ACTIVE',
                rejected: 'REJECTED',
                expired: 'EXPIRED',
            },
            requiredFor: 'Creating export requests',
        },
    ];

    const getStageData = (key: string) => {
        return data[key as keyof PreRegistrationData];
    };

    const getStageStatus = (stage: any, index: number) => {
        const stageData = getStageData(stage.key);

        // Check if exempt for farmers
        if (stage.exemptFor && stage.exemptFor === data.profile?.businessType) {
            return {
                status: 'exempt',
                icon: <CheckCircle size={20} color="#4caf50" />,
                color: 'success',
                label: 'Exempt',
                message: 'Not required for farmer-exporters',
            };
        }

        // Not started
        if (!stageData) {
            return {
                status: 'not-started',
                icon: <Clock size={20} color="#9e9e9e" />,
                color: 'default',
                label: 'Not Started',
                message: 'Complete previous steps first',
            };
        }

        const status = stageData.status;

        // Rejected
        if (status === stage.statuses.rejected) {
            return {
                status: 'rejected',
                icon: <XCircle size={20} color="#f44336" />,
                color: 'error',
                label: 'Rejected',
                message: stageData.rejectionReason || 'Please review and resubmit',
            };
        }

        // Expired
        if (status === stage.statuses.expired) {
            return {
                status: 'expired',
                icon: <AlertCircle size={20} color="#ff9800" />,
                color: 'warning',
                label: 'Expired',
                message: 'Renewal required',
            };
        }

        // Pending
        if (status === stage.statuses.pending) {
            return {
                status: 'pending',
                icon: <Clock size={20} color="#ff9800" />,
                color: 'warning',
                label: 'Pending ECTA Approval',
                message: 'Awaiting review by ECTA',
            };
        }

        // Approved/Active
        if (status === stage.statuses.approved) {
            return {
                status: 'approved',
                icon: <CheckCircle size={20} color="#4caf50" />,
                color: 'success',
                label: 'Approved',
                message: 'Completed successfully',
            };
        }

        // Default
        return {
            status: 'unknown',
            icon: <Clock size={20} color="#9e9e9e" />,
            color: 'default',
            label: 'Unknown',
            message: 'Status unknown',
        };
    };

    const getCurrentStageIndex = () => {
        for (let i = stages.length - 1; i >= 0; i--) {
            const stageData = getStageData(stages[i].key);
            if (stageData && stageData.status) {
                return i;
            }
        }
        return 0;
    };

    const getOverallProgress = () => {
        let completed = 0;
        let total = stages.length;

        stages.forEach((stage) => {
            const stageStatus = getStageStatus(stage, 0);
            if (stageStatus.status === 'approved' || stageStatus.status === 'exempt') {
                completed++;
            }
        });

        return Math.round((completed / total) * 100);
    };

    const canExport = () => {
        const licenseStatus = getStageStatus(stages[4], 4);
        return licenseStatus.status === 'approved';
    };

    const currentStageIndex = getCurrentStageIndex();
    const progress = getOverallProgress();
    const readyToExport = canExport();

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileCheck size={24} />
                Pre-Registration Progress
            </Typography>

            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    Overall Progress: <strong>{progress}%</strong>
                </Typography>
                {readyToExport ? (
                    <Alert severity="success" sx={{ mt: 1 }}>
                        ✅ You are fully qualified to create export requests!
                    </Alert>
                ) : (
                    <Alert severity="info" sx={{ mt: 1 }}>
                        Complete all steps to unlock export capabilities
                    </Alert>
                )}
            </Box>

            <Stepper activeStep={currentStageIndex} orientation="vertical">
                {stages.map((stage, index) => {
                    const stepStatus = getStageStatus(stage, index);
                    const StageIcon = stage.icon;
                    const stageData = getStageData(stage.key);

                    return (
                        <Step key={stage.name} completed={stepStatus.status === 'approved' || stepStatus.status === 'exempt'}>
                            <StepLabel
                                optional={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Typography variant="caption" color="text.secondary">
                                            Required for: {stage.requiredFor}
                                        </Typography>
                                        <Chip
                                            label={stepStatus.label}
                                            size="small"
                                            color={stepStatus.color as any}
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                }
                                error={stepStatus.status === 'rejected' || stepStatus.status === 'expired'}
                                StepIconComponent={() => (
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            bgcolor:
                                                stepStatus.status === 'approved' || stepStatus.status === 'exempt'
                                                    ? '#e8f5e9'
                                                    : stepStatus.status === 'pending'
                                                        ? '#fff3e0'
                                                        : stepStatus.status === 'rejected' || stepStatus.status === 'expired'
                                                            ? '#ffebee'
                                                            : '#f5f5f5',
                                            border: `2px solid ${stepStatus.status === 'approved' || stepStatus.status === 'exempt'
                                                ? '#4caf50'
                                                : stepStatus.status === 'pending'
                                                    ? '#ff9800'
                                                    : stepStatus.status === 'rejected' || stepStatus.status === 'expired'
                                                        ? '#f44336'
                                                        : '#9e9e9e'
                                                }`,
                                        }}
                                    >
                                        <StageIcon
                                            size={20}
                                            color={
                                                stepStatus.status === 'approved' || stepStatus.status === 'exempt'
                                                    ? '#4caf50'
                                                    : stepStatus.status === 'pending'
                                                        ? '#ff9800'
                                                        : stepStatus.status === 'rejected' || stepStatus.status === 'expired'
                                                            ? '#f44336'
                                                            : '#9e9e9e'
                                            }
                                        />
                                    </Box>
                                )}
                            >
                                <Typography variant="body2" fontWeight="medium">
                                    {stage.name}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {stage.description}
                                </Typography>

                                {stepStatus.status === 'exempt' && (
                                    <Box sx={{ p: 1, bgcolor: '#e8f5e9', borderRadius: 1, mb: 1 }}>
                                        <Typography variant="caption" color="success.dark">
                                            {stepStatus.message}
                                        </Typography>
                                    </Box>
                                )}

                                {(stepStatus.status === 'rejected' || stepStatus.status === 'expired') && (
                                    <Box sx={{ p: 1, bgcolor: '#ffebee', borderRadius: 1, mb: 1 }}>
                                        <Typography variant="caption" color="error">
                                            {stepStatus.message}
                                        </Typography>
                                        {onAction && (
                                            <Button
                                                size="small"
                                                color="error"
                                                sx={{ mt: 1 }}
                                                onClick={() => onAction('resubmit', stage.key)}
                                            >
                                                Resubmit
                                            </Button>
                                        )}
                                    </Box>
                                )}

                                {stepStatus.status === 'pending' && (
                                    <Box sx={{ p: 1, bgcolor: '#fff3e0', borderRadius: 1, mb: 1 }}>
                                        <Typography variant="caption" color="warning.dark">
                                            {stepStatus.message}
                                        </Typography>
                                    </Box>
                                )}

                                {stepStatus.status === 'not-started' && onAction && (
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        sx={{ mt: 1 }}
                                        onClick={() => onAction('start', stage.key)}
                                    >
                                        Start {stage.name}
                                    </Button>
                                )}

                                {stageData && (
                                    <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                                        <Typography variant="caption" display="block">
                                            {stage.key === 'profile' && stageData.businessName && (
                                                <>Business: {stageData.businessName}</>
                                            )}
                                            {stage.key === 'laboratory' && stageData.laboratoryName && (
                                                <>Laboratory: {stageData.laboratoryName}</>
                                            )}
                                            {stage.key === 'taster' && stageData.fullName && (
                                                <>Taster: {stageData.fullName}</>
                                            )}
                                            {stage.key === 'competenceCertificate' && stageData.certificateNumber && (
                                                <>Certificate: {stageData.certificateNumber}</>
                                            )}
                                            {stage.key === 'exportLicense' && stageData.licenseNumber && (
                                                <>License: {stageData.licenseNumber}</>
                                            )}
                                        </Typography>
                                        {stageData.expiryDate && (
                                            <Typography variant="caption" display="block" color="text.secondary">
                                                Expires: {new Date(stageData.expiryDate).toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </StepContent>
                        </Step>
                    );
                })}
            </Stepper>
        </Paper>
    );
};

export default PreRegistrationWorkflowTracker;
