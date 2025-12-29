/**
 * Coffee Export Workflow Manager - UPDATED
 * Manages the complete lifecycle of coffee exports through all organizations
 * CORRECTED: Now follows actual Ethiopian coffee export process
 */

// Workflow States - UPDATED with corrected flow
export const WORKFLOW_STATES = {
  // Initial States
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',

  // Pre-Registration States (NEW - Exporter qualification)
  PROFILE_PENDING: 'PROFILE_PENDING',
  PROFILE_ACTIVE: 'PROFILE_ACTIVE',
  PROFILE_REJECTED: 'PROFILE_REJECTED',
  LAB_PENDING: 'LAB_PENDING',
  LAB_ACTIVE: 'LAB_ACTIVE',
  LAB_REJECTED: 'LAB_REJECTED',
  LAB_EXPIRED: 'LAB_EXPIRED',
  TASTER_PENDING: 'TASTER_PENDING',
  TASTER_ACTIVE: 'TASTER_ACTIVE',
  TASTER_REJECTED: 'TASTER_REJECTED',
  COMPETENCE_PENDING: 'COMPETENCE_PENDING',
  COMPETENCE_ACTIVE: 'COMPETENCE_ACTIVE',
  COMPETENCE_REJECTED: 'COMPETENCE_REJECTED',
  LICENSE_PENDING: 'LICENSE_PENDING',
  LICENSE_ACTIVE: 'LICENSE_ACTIVE',
  LICENSE_REJECTED: 'LICENSE_REJECTED',

  // Contract States (NEW - Sales contract workflow)
  CONTRACT_DRAFT: 'CONTRACT_DRAFT',
  CONTRACT_REGISTERED: 'CONTRACT_REGISTERED',
  CONTRACT_ECTA_REVIEW: 'CONTRACT_ECTA_REVIEW',
  CONTRACT_APPROVED: 'CONTRACT_APPROVED',
  CONTRACT_REJECTED: 'CONTRACT_REJECTED',

  // ECX Stage (NEW - First mandatory step)
  ECX_PENDING: 'ECX_PENDING',
  ECX_VERIFIED: 'ECX_VERIFIED',
  ECX_REJECTED: 'ECX_REJECTED',

  // ECTA Stage (UPDATED - Primary regulator, multiple steps)
  ECTA_LICENSE_PENDING: 'ECTA_LICENSE_PENDING',
  ECTA_LICENSE_APPROVED: 'ECTA_LICENSE_APPROVED',
  ECTA_LICENSE_REJECTED: 'ECTA_LICENSE_REJECTED',
  ECTA_QUALITY_PENDING: 'ECTA_QUALITY_PENDING',
  ECTA_QUALITY_APPROVED: 'ECTA_QUALITY_APPROVED',
  ECTA_QUALITY_REJECTED: 'ECTA_QUALITY_REJECTED',
  ECTA_CONTRACT_PENDING: 'ECTA_CONTRACT_PENDING',
  ECTA_CONTRACT_APPROVED: 'ECTA_CONTRACT_APPROVED',
  ECTA_CONTRACT_REJECTED: 'ECTA_CONTRACT_REJECTED',

  // Commercial Bank Stage
  BANK_DOCUMENT_PENDING: 'BANK_DOCUMENT_PENDING',
  BANK_DOCUMENT_VERIFIED: 'BANK_DOCUMENT_VERIFIED',
  BANK_DOCUMENT_REJECTED: 'BANK_DOCUMENT_REJECTED',

  // National Bank Stage (UPDATED - FX approval only)
  FX_APPLICATION_PENDING: 'FX_APPLICATION_PENDING',
  FX_APPROVED: 'FX_APPROVED',
  FX_REJECTED: 'FX_REJECTED',

  // Custom Authorities Stage (UPDATED - Simplified names)
  CUSTOMS_PENDING: 'CUSTOMS_PENDING',
  CUSTOMS_CLEARED: 'CUSTOMS_CLEARED',
  CUSTOMS_REJECTED: 'CUSTOMS_REJECTED',

  // Shipping Line Stage
  SHIPMENT_PENDING: 'SHIPMENT_PENDING',
  SHIPMENT_SCHEDULED: 'SHIPMENT_SCHEDULED',
  SHIPPED: 'SHIPPED',
  SHIPMENT_REJECTED: 'SHIPMENT_REJECTED',

  // Final States
  DELIVERED: 'DELIVERED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Workflow Stages - UPDATED with corrected sequence
export const WORKFLOW_STAGES = {
  PRE_REGISTRATION: { order: 0, name: 'Pre-Registration', org: 'ECTA' },
  CONTRACT_REGISTRATION: { order: 0.5, name: 'Contract Registration', org: 'ECTA' },
  CREATION: { order: 1, name: 'Export Creation', org: 'Portal' },
  ECX_VERIFICATION: { order: 2, name: 'ECX Verification', org: 'ECX' },
  ECTA_REGULATION: { order: 3, name: 'ECTA Regulation', org: 'ECTA' },
  BANK_DOCUMENTS: { order: 4, name: 'Bank Documents', org: 'Commercial Bank' },
  FX_APPROVAL: { order: 5, name: 'FX Approval', org: 'NBE' },
  CUSTOMS_CLEAR: { order: 6, name: 'Customs Clearance', org: 'Customs' },
  SHIPPING: { order: 7, name: 'Shipment & Delivery', org: 'Shipping Line' },
  COMPLETION: { order: 8, name: 'Completed', org: 'System' },
};

// State Transitions Map
export const STATE_TRANSITIONS = {
  [WORKFLOW_STATES.DRAFT]: {
    canTransitionTo: [WORKFLOW_STATES.PENDING, WORKFLOW_STATES.CANCELLED],
    requiredRole: 'exporter',
  },
  [WORKFLOW_STATES.PENDING]: {
    canTransitionTo: [WORKFLOW_STATES.FX_PENDING, WORKFLOW_STATES.CANCELLED],
    requiredRole: 'exporter',
  },
  [WORKFLOW_STATES.FX_PENDING]: {
    canTransitionTo: [WORKFLOW_STATES.FX_APPROVED, WORKFLOW_STATES.FX_REJECTED],
    requiredRole: 'banker',
  },
  [WORKFLOW_STATES.FX_REJECTED]: {
    canTransitionTo: [WORKFLOW_STATES.PENDING, WORKFLOW_STATES.CANCELLED],
    requiredRole: 'exporter',
    isRejectionState: true,
    canResubmit: true,
  },
  [WORKFLOW_STATES.FX_APPROVED]: {
    canTransitionTo: [WORKFLOW_STATES.QUALITY_PENDING],
    requiredRole: 'system',
  },
  [WORKFLOW_STATES.QUALITY_PENDING]: {
    canTransitionTo: [WORKFLOW_STATES.QUALITY_CERTIFIED, WORKFLOW_STATES.QUALITY_REJECTED],
    requiredRole: 'inspector',
  },
  [WORKFLOW_STATES.QUALITY_REJECTED]: {
    canTransitionTo: [WORKFLOW_STATES.PENDING, WORKFLOW_STATES.CANCELLED],
    requiredRole: 'exporter',
    isRejectionState: true,
    canResubmit: true,
  },
  [WORKFLOW_STATES.QUALITY_CERTIFIED]: {
    canTransitionTo: [WORKFLOW_STATES.EXPORT_CUSTOMS_PENDING],
    requiredRole: 'system',
  },
  [WORKFLOW_STATES.EXPORT_CUSTOMS_PENDING]: {
    canTransitionTo: [
      WORKFLOW_STATES.EXPORT_CUSTOMS_CLEARED,
      WORKFLOW_STATES.EXPORT_CUSTOMS_REJECTED,
    ],
    requiredRole: 'customs',
  },
  [WORKFLOW_STATES.EXPORT_CUSTOMS_REJECTED]: {
    canTransitionTo: [WORKFLOW_STATES.PENDING, WORKFLOW_STATES.CANCELLED],
    requiredRole: 'exporter',
    isRejectionState: true,
    canResubmit: true,
  },
  [WORKFLOW_STATES.EXPORT_CUSTOMS_CLEARED]: {
    canTransitionTo: [WORKFLOW_STATES.SHIPMENT_PENDING],
    requiredRole: 'system',
  },
  [WORKFLOW_STATES.SHIPMENT_PENDING]: {
    canTransitionTo: [WORKFLOW_STATES.SHIPMENT_SCHEDULED, WORKFLOW_STATES.SHIPMENT_REJECTED],
    requiredRole: 'shipper',
  },
  [WORKFLOW_STATES.SHIPMENT_REJECTED]: {
    canTransitionTo: [WORKFLOW_STATES.PENDING, WORKFLOW_STATES.CANCELLED],
    requiredRole: 'exporter',
    isRejectionState: true,
    canResubmit: true,
  },
  [WORKFLOW_STATES.SHIPMENT_SCHEDULED]: {
    canTransitionTo: [WORKFLOW_STATES.SHIPPED],
    requiredRole: 'shipper',
  },
  [WORKFLOW_STATES.SHIPPED]: {
    canTransitionTo: [WORKFLOW_STATES.COMPLETED],
    requiredRole: 'system',
  },
};

// Get current workflow stage
export const getCurrentStage = (status) => {
  if ([WORKFLOW_STATES.DRAFT, WORKFLOW_STATES.PENDING].includes(status)) {
    return WORKFLOW_STAGES.CREATION;
  }
  if (
    [WORKFLOW_STATES.FX_PENDING, WORKFLOW_STATES.FX_APPROVED, WORKFLOW_STATES.FX_REJECTED].includes(
      status
    )
  ) {
    return WORKFLOW_STAGES.FX_APPROVAL;
  }
  if (
    [
      WORKFLOW_STATES.QUALITY_PENDING,
      WORKFLOW_STATES.QUALITY_CERTIFIED,
      WORKFLOW_STATES.QUALITY_REJECTED,
    ].includes(status)
  ) {
    return WORKFLOW_STAGES.QUALITY_CERT;
  }
  if (
    [
      WORKFLOW_STATES.EXPORT_CUSTOMS_PENDING,
      WORKFLOW_STATES.EXPORT_CUSTOMS_CLEARED,
      WORKFLOW_STATES.EXPORT_CUSTOMS_REJECTED,
    ].includes(status)
  ) {
    return WORKFLOW_STAGES.CUSTOMS_CLEAR;
  }
  if (
    [
      WORKFLOW_STATES.SHIPMENT_PENDING,
      WORKFLOW_STATES.SHIPMENT_SCHEDULED,
      WORKFLOW_STATES.SHIPPED,
      WORKFLOW_STATES.SHIPMENT_REJECTED,
    ].includes(status)
  ) {
    return WORKFLOW_STAGES.SHIPPING;
  }
  if (status === WORKFLOW_STATES.COMPLETED) {
    return WORKFLOW_STAGES.COMPLETION;
  }
  return null;
};

// Check if state is a rejection state
export const isRejectionState = (status) => {
  const transition = STATE_TRANSITIONS[status];
  return transition?.isRejectionState || false;
};

// Check if export can be resubmitted
export const canResubmit = (status) => {
  const transition = STATE_TRANSITIONS[status];
  return transition?.canResubmit || false;
};

// Check if user can perform action on export
export const canPerformAction = (status, userRole, action) => {
  const transition = STATE_TRANSITIONS[status];
  if (!transition) return false;

  // Check if user has required role
  if (transition.requiredRole !== userRole && transition.requiredRole !== 'system') {
    return false;
  }

  // Check if action is valid for current state
  return transition.canTransitionTo.includes(action);
};

// Get next state after approval
export const getNextStateAfterApproval = (currentStatus) => {
  const approvalMap = {
    [WORKFLOW_STATES.FX_PENDING]: WORKFLOW_STATES.FX_APPROVED,
    [WORKFLOW_STATES.FX_APPROVED]: WORKFLOW_STATES.QUALITY_PENDING,
    [WORKFLOW_STATES.QUALITY_PENDING]: WORKFLOW_STATES.QUALITY_CERTIFIED,
    [WORKFLOW_STATES.QUALITY_CERTIFIED]: WORKFLOW_STATES.EXPORT_CUSTOMS_PENDING,
    [WORKFLOW_STATES.EXPORT_CUSTOMS_PENDING]: WORKFLOW_STATES.EXPORT_CUSTOMS_CLEARED,
    [WORKFLOW_STATES.EXPORT_CUSTOMS_CLEARED]: WORKFLOW_STATES.SHIPMENT_PENDING,
    [WORKFLOW_STATES.SHIPMENT_PENDING]: WORKFLOW_STATES.SHIPMENT_SCHEDULED,
    [WORKFLOW_STATES.SHIPMENT_SCHEDULED]: WORKFLOW_STATES.SHIPPED,
    [WORKFLOW_STATES.SHIPPED]: WORKFLOW_STATES.COMPLETED,
  };
  return approvalMap[currentStatus];
};

// Get rejection state for current status
export const getRejectionState = (currentStatus) => {
  const rejectionMap = {
    [WORKFLOW_STATES.FX_PENDING]: WORKFLOW_STATES.FX_REJECTED,
    [WORKFLOW_STATES.QUALITY_PENDING]: WORKFLOW_STATES.QUALITY_REJECTED,
    [WORKFLOW_STATES.EXPORT_CUSTOMS_PENDING]: WORKFLOW_STATES.EXPORT_CUSTOMS_REJECTED,
    [WORKFLOW_STATES.SHIPMENT_PENDING]: WORKFLOW_STATES.SHIPMENT_REJECTED,
  };
  return rejectionMap[currentStatus];
};

// Get workflow progress percentage
export const getWorkflowProgress = (status) => {
  const stage = getCurrentStage(status);
  if (!stage) return 0;

  const totalStages = Object.keys(WORKFLOW_STAGES).length;
  return Math.round((stage.order / totalStages) * 100);
};

// Get human-readable status
export const getStatusLabel = (status) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

// Get status color
export const getStatusColor = (status) => {
  if (isRejectionState(status)) return 'error';
  if (status === WORKFLOW_STATES.COMPLETED) return 'success';
  if (status.includes('APPROVED') || status.includes('CERTIFIED') || status.includes('CLEARED'))
    return 'success';
  if (status.includes('PENDING')) return 'warning';
  if (status.includes('SCHEDULED') || status.includes('SHIPPED')) return 'info';
  return 'default';
};

// Get rejection reason label
export const getRejectionStageLabel = (status) => {
  if (status === WORKFLOW_STATES.FX_REJECTED) return 'FX & Compliance';
  if (status === WORKFLOW_STATES.QUALITY_REJECTED) return 'Quality Certification';
  if (status === WORKFLOW_STATES.EXPORT_CUSTOMS_REJECTED) return 'Customs Clearance';
  if (status === WORKFLOW_STATES.SHIPMENT_REJECTED) return 'Shipment';
  return 'Unknown Stage';
};

export default {
  WORKFLOW_STATES,
  WORKFLOW_STAGES,
  STATE_TRANSITIONS,
  getCurrentStage,
  isRejectionState,
  canResubmit,
  canPerformAction,
  getNextStateAfterApproval,
  getRejectionState,
  getWorkflowProgress,
  getStatusLabel,
  getStatusColor,
  getRejectionStageLabel,
};
