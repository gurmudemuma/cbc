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
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    FileText,
    Upload,
    FileCheck,
    CheckCircle,
    XCircle,
    Clock,
    AlertCircle,
} from 'lucide-react';

/**
 * Contract Workflow Tracker Component
 * Visual stepper showing sales contract progress through ECTA verification
 * Tracks: Draft → Document Upload → ECTA Review → Approved/Rejected
 */

interface ContractData {
    contractId?: string;
    contractNumber?: string;
    buyerName?: string;
    buyerCountry?: string;
    coffeeType?: string;
    quantity?: number;
    contractValue?: number;
    status: string;
    registrationDate?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectionReason?: string;
    contractDocument?: string;
    buyerProofOfBusiness?: string;
}

interface ContractWorkflowTrackerProps {
    contractData: ContractData;
    onAction?: (action: string) => void;
}

const ContractWorkflowTracker: React.FC<ContractWorkflowTrackerProps> = ({
    contractData,
    onAction,
}) => {
    const stages = [
        {
            name: 'Contract Registration',
            status: 'DRAFT',
            icon: FileText,
            description: 'Register sales contract with buyer details',
            requiredDocuments: [
                'Sales contract agreement',
                'Buyer proof of business',
                'Export coffee specifications',
            ],
        },
        {
            name: 'Document Upload',
            status: 'REGISTERED',
            icon: Upload,
            description: 'Upload all required contract documents',
            requiredDocuments: [
                'Signed sales contract',
                'Buyer company registration',
                'Payment terms agreement',
            ],
        },
        {
            name: 'ECTA Review',
            status: 'ECTA_REVIEW',
            icon: FileCheck,
            description: 'ECTA verification of contract terms and buyer credentials',
            requiredDocuments: [],
        },
        {
            name: 'Contract Approved',
            status: 'APPROVED',
            icon: CheckCircle,
            description: 'Contract approved and ready for export processing',
            requiredDocuments: [],
        },
    ];

    const getCurrentStageIndex = () => {
        const status = contractData.status;

        if (status === 'REJECTED') {
            return 2; // Show rejection at ECTA Review stage
        }

        if (status === 'APPROVED') {
            return 3;
        }

        if (status === 'ECTA_REVIEW' || status === 'ECTA_CONTRACT_PENDING') {
            return 2;
        }

        if (status === 'REGISTERED' || status === 'DOCUMENTS_UPLOADED') {
            return 1;
        }

        return 0; // DRAFT
    };

    const getStageStatus = (index: number) => {
        const currentIndex = getCurrentStageIndex();
        const status = contractData.status;

        // Rejected at ECTA Review
        if (index === 2 && status === 'REJECTED') {
            return {
                status: 'rejected',
                icon: <XCircle size={20} color="#f44336" />,
                color: 'error',
                label: 'Rejected',
            };
        }

        // Completed stages
        if (index < currentIndex) {
            return {
                status: 'completed',
                icon: <CheckCircle size={20} color="#4caf50" />,
                color: 'success',
                label: 'Completed',
            };
        }

        // Current stage
        if (index === currentIndex) {
            return {
                status: 'in-progress',
                icon: <Clock size={20} color="#ff9800" />,
                color: 'warning',
                label: 'In Progress',
            };
        }

        // Future stages
        return {
            status: 'pending',
            icon: <Clock size={20} color="#9e9e9e" />,
            color: 'default',
            label: 'Pending',
        };
    };

    const currentStageIndex = getCurrentStageIndex();
    const progress = Math.round((currentStageIndex / (stages.length - 1)) * 100);
    const isApproved = contractData.status === 'APPROVED';
    const isRejected = contractData.status === 'REJECTED';

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FileCheck size={24} />
                Contract Workflow Progress
            </Typography>

            <Box sx={{ mb: 2 }}>
                {contractData.contractNumber && (
                    <Typography variant="body2" color="text.secondary">
                        Contract: <strong>{contractData.contractNumber}</strong>
                    </Typography>
                )}
                {contractData.buyerName && (
                    <Typography variant="body2" color="text.secondary">
                        Buyer: <strong>{contractData.buyerName}</strong> ({contractData.buyerCountry})
                    </Typography>
                )}
                <Typography variant="body2" color="text.secondary">
                    Progress: <strong>{progress}%</strong>
                </Typography>

                {isApproved && (
                    <Alert severity="success" sx={{ mt: 1 }}>
                        ✅ Contract approved! Ready for export processing.
                    </Alert>
                )}

                {isRejected && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                        ❌ Contract rejected. Please review and resubmit.
                    </Alert>
                )}
            </Box>

            <Stepper activeStep={currentStageIndex} orientation="vertical">
                {stages.map((stage, index) => {
                    const stepStatus = getStageStatus(index);
                    const StageIcon = stage.icon;

                    return (
                        <Step key={stage.name} completed={stepStatus.status === 'completed'}>
                            <StepLabel
                                optional={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Chip
                                            label={stepStatus.label}
                                            size="small"
                                            color={stepStatus.color as any}
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                    </Box>
                                }
                                error={stepStatus.status === 'rejected'}
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
                                                stepStatus.status === 'completed'
                                                    ? '#e8f5e9'
                                                    : stepStatus.status === 'in-progress'
                                                        ? '#fff3e0'
                                                        : stepStatus.status === 'rejected'
                                                            ? '#ffebee'
                                                            : '#f5f5f5',
                                            border: `2px solid ${stepStatus.status === 'completed'
                                                    ? '#4caf50'
                                                    : stepStatus.status === 'in-progress'
                                                        ? '#ff9800'
                                                        : stepStatus.status === 'rejected'
                                                            ? '#f44336'
                                                            : '#9e9e9e'
                                                }`,
                                        }}
                                    >
                                        <StageIcon
                                            size={20}
                                            color={
                                                stepStatus.status === 'completed'
                                                    ? '#4caf50'
                                                    : stepStatus.status === 'in-progress'
                                                        ? '#ff9800'
                                                        : stepStatus.status === 'rejected'
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

                                {stage.requiredDocuments.length > 0 && (
                                    <Box sx={{ mt: 1, mb: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight="medium">
                                            Required Documents:
                                        </Typography>
                                        <List dense>
                                            {stage.requiredDocuments.map((doc, idx) => (
                                                <ListItem key={idx} sx={{ py: 0 }}>
                                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                                        <FileText size={16} />
                                                    </ListItemIcon>
                                                    <ListItemText
                                                        primary={doc}
                                                        primaryTypographyProps={{ variant: 'caption' }}
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Box>
                                )}

                                {stepStatus.status === 'rejected' && contractData.rejectionReason && (
                                    <Box sx={{ p: 1, bgcolor: '#ffebee', borderRadius: 1, mb: 1 }}>
                                        <Typography variant="caption" color="error" display="block" fontWeight="medium">
                                            Rejection Reason:
                                        </Typography>
                                        <Typography variant="caption" color="error">
                                            {contractData.rejectionReason}
                                        </Typography>
                                        {onAction && (
                                            <Button
                                                size="small"
                                                color="error"
                                                sx={{ mt: 1 }}
                                                onClick={() => onAction('resubmit')}
                                            >
                                                Resubmit Contract
                                            </Button>
                                        )}
                                    </Box>
                                )}

                                {stepStatus.status === 'in-progress' && index === 0 && onAction && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        sx={{ mt: 1 }}
                                        onClick={() => onAction('upload-documents')}
                                    >
                                        Upload Documents
                                    </Button>
                                )}

                                {stepStatus.status === 'in-progress' && index === 1 && onAction && (
                                    <Button
                                        size="small"
                                        variant="contained"
                                        sx={{ mt: 1 }}
                                        onClick={() => onAction('submit-for-review')}
                                    >
                                        Submit for ECTA Review
                                    </Button>
                                )}

                                {stepStatus.status === 'in-progress' && index === 2 && (
                                    <Box sx={{ p: 1, bgcolor: '#fff3e0', borderRadius: 1, mb: 1 }}>
                                        <Typography variant="caption" color="warning.dark">
                                            ⏳ Awaiting ECTA review and approval
                                        </Typography>
                                    </Box>
                                )}

                                {stepStatus.status === 'completed' && index === 3 && contractData.approvedBy && (
                                    <Box sx={{ p: 1, bgcolor: '#e8f5e9', borderRadius: 1, mb: 1 }}>
                                        <Typography variant="caption" color="success.dark" display="block">
                                            Approved by: {contractData.approvedBy}
                                        </Typography>
                                        {contractData.approvedAt && (
                                            <Typography variant="caption" color="success.dark">
                                                Date: {new Date(contractData.approvedAt).toLocaleDateString()}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </StepContent>
                        </Step>
                    );
                })}
            </Stepper>

            {contractData.contractDocument && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="caption" fontWeight="medium" display="block">
                        Contract Details:
                    </Typography>
                    {contractData.coffeeType && (
                        <Typography variant="caption" display="block">
                            Coffee Type: {contractData.coffeeType}
                        </Typography>
                    )}
                    {contractData.quantity && (
                        <Typography variant="caption" display="block">
                            Quantity: {contractData.quantity} kg
                        </Typography>
                    )}
                    {contractData.contractValue && (
                        <Typography variant="caption" display="block">
                            Value: ${contractData.contractValue.toLocaleString()}
                        </Typography>
                    )}
                </Box>
            )}
        </Paper>
    );
};

export default ContractWorkflowTracker;
