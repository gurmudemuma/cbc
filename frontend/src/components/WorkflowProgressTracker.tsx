import {
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Typography,
  Box,
  Chip,
  Paper,
} from '@mui/material';
import {
  FileText,
  PackageCheck,
  FileCheck,
  Award,
  Banknote,
  DollarSign,
  ShieldCheck,
  Ship,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';

/**
 * Workflow Progress Tracker Component
 * Visual stepper showing export progress through all stages
 */
const WorkflowProgressTracker = ({ exportData }) => {
  const stages = [
    {
      name: 'Export Created',
      status: 'DRAFT',
      org: 'Exporter',
      icon: FileText,
      description: 'Export request created with all required information',
    },
    {
      name: 'ECX Lot Verified',
      status: 'ECX_VERIFIED',
      org: 'ECX',
      icon: PackageCheck,
      description: 'Lot number and warehouse receipt verified by Ethiopian Commodity Exchange',
      rejectedStatus: 'ECX_REJECTED',
    },
    {
      name: 'ECTA License Approved',
      status: 'ECTA_LICENSE_APPROVED',
      org: 'ECTA',
      icon: FileCheck,
      description: 'Export license validated by Ethiopian Coffee & Tea Authority',
      rejectedStatus: 'ECTA_LICENSE_REJECTED',
    },
    {
      name: 'ECTA Quality Certified',
      status: 'ECTA_QUALITY_APPROVED',
      org: 'ECTA',
      icon: Award,
      description: 'Coffee quality inspected and certified by ECTA',
      rejectedStatus: 'ECTA_QUALITY_REJECTED',
    },
    {
      name: 'ECTA Contract Approved',
      status: 'ECTA_CONTRACT_APPROVED',
      org: 'ECTA',
      icon: FileCheck,
      description: 'Export contract approved and Certificate of Origin issued',
      rejectedStatus: 'ECTA_CONTRACT_REJECTED',
    },
    {
      name: 'Bank Documents Verified',
      status: 'BANK_DOCUMENT_VERIFIED',
      org: 'Commercial Bank',
      icon: Banknote,
      description: 'All export documents verified by Commercial Bank',
      rejectedStatus: 'BANK_DOCUMENT_REJECTED',
    },
    {
      name: 'NBE FX Approved',
      status: 'FX_APPROVED',
      org: 'National Bank',
      icon: DollarSign,
      description: 'Foreign exchange allocation approved by National Bank of Ethiopia',
      rejectedStatus: 'FX_REJECTED',
    },
    {
      name: 'Customs Cleared',
      status: 'CUSTOMS_CLEARED',
      org: 'Customs',
      icon: ShieldCheck,
      description: 'Export cleared by Customs Authorities',
      rejectedStatus: 'CUSTOMS_REJECTED',
    },
    {
      name: 'Shipped',
      status: 'SHIPPED',
      org: 'Shipping Line',
      icon: Ship,
      description: 'Coffee shipment dispatched to destination',
      rejectedStatus: 'SHIPMENT_REJECTED',
    },
    {
      name: 'Completed',
      status: 'COMPLETED',
      org: 'System',
      icon: CheckCircle,
      description: 'Export process completed successfully',
    },
  ];

  const getCurrentStageIndex = () => {
    const currentStatus = exportData.status;
    
    // Check for rejection states
    const rejectedIndex = stages.findIndex(s => s.rejectedStatus === currentStatus);
    if (rejectedIndex !== -1) return rejectedIndex;
    
    // Check for normal states
    const index = stages.findIndex(s => s.status === currentStatus);
    if (index !== -1) return index;
    
    // Check for pending states
    if (currentStatus === 'ECX_PENDING') return 1;
    if (currentStatus === 'ECTA_LICENSE_PENDING') return 2;
    if (currentStatus === 'ECTA_QUALITY_PENDING') return 3;
    if (currentStatus === 'ECTA_CONTRACT_PENDING') return 4;
    if (currentStatus === 'BANK_DOCUMENT_PENDING') return 5;
    if (currentStatus === 'FX_APPLICATION_PENDING' || currentStatus === 'FX_PENDING') return 6;
    if (currentStatus === 'CUSTOMS_PENDING') return 7;
    if (currentStatus === 'SHIPMENT_PENDING' || currentStatus === 'SHIPMENT_SCHEDULED') return 8;
    
    return 0;
  };

  const getStepStatus = (index) => {
    const currentIndex = getCurrentStageIndex();
    const currentStatus = exportData.status;
    const stage = stages[index];
    
    // Check if this stage is rejected
    if (stage.rejectedStatus === currentStatus) {
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

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Ship size={24} />
        Workflow Progress
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Current Status: <strong>{exportData.status}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Progress: <strong>{Math.round((currentStageIndex / (stages.length - 1)) * 100)}%</strong>
        </Typography>
      </Box>

      <Stepper activeStep={currentStageIndex} orientation="vertical">
        {stages.map((stage, index) => {
          const stepStatus = getStepStatus(index);
          const StageIcon = stage.icon;
          
          return (
            <Step key={stage.name} completed={stepStatus.status === 'completed'}>
              <StepLabel
                optional={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {stage.org}
                    </Typography>
                    <Chip
                      label={stepStatus.label}
                      size="small"
                      color={stepStatus.color}
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
                        stepStatus.status === 'completed' ? '#e8f5e9' :
                        stepStatus.status === 'in-progress' ? '#fff3e0' :
                        stepStatus.status === 'rejected' ? '#ffebee' :
                        '#f5f5f5',
                      border: `2px solid ${
                        stepStatus.status === 'completed' ? '#4caf50' :
                        stepStatus.status === 'in-progress' ? '#ff9800' :
                        stepStatus.status === 'rejected' ? '#f44336' :
                        '#9e9e9e'
                      }`,
                    }}
                  >
                    <StageIcon
                      size={20}
                      color={
                        stepStatus.status === 'completed' ? '#4caf50' :
                        stepStatus.status === 'in-progress' ? '#ff9800' :
                        stepStatus.status === 'rejected' ? '#f44336' :
                        '#9e9e9e'
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
                <Typography variant="body2" color="text.secondary">
                  {stage.description}
                </Typography>
                {stepStatus.status === 'rejected' && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
                    <Typography variant="caption" color="error">
                      This stage was rejected. Please review the rejection reason and resubmit.
                    </Typography>
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

export default WorkflowProgressTracker;
