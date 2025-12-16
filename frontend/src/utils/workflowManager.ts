/**
 * Workflow Manager Utility
 * Provides helper functions for managing export workflow states and transitions
 */

export interface WorkflowStage {
    name: string;
    order: number;
    statuses: string[];
}

export const WORKFLOW_STAGES: WorkflowStage[] = [
    {
        name: 'Creation',
        order: 1,
        statuses: ['DRAFT', 'PENDING'],
    },
    {
        name: 'ECX Verification',
        order: 2,
        statuses: ['ECX_PENDING', 'ECX_VERIFIED', 'ECX_REJECTED'],
    },
    {
        name: 'ECTA License',
        order: 3,
        statuses: ['ECTA_LICENSE_PENDING', 'ECTA_LICENSE_APPROVED', 'ECTA_LICENSE_REJECTED', 'LICENSE_REJECTED'],
    },
    {
        name: 'ECTA Quality',
        order: 4,
        statuses: ['ECTA_QUALITY_PENDING', 'ECTA_QUALITY_APPROVED', 'ECTA_QUALITY_REJECTED', 'QUALITY_PENDING', 'QUALITY_CERTIFIED', 'QUALITY_REJECTED'],
    },
    {
        name: 'ECTA Origin',
        order: 5,
        statuses: ['ECTA_ORIGIN_PENDING', 'ECTA_ORIGIN_APPROVED', 'ECTA_ORIGIN_REJECTED'],
    },
    {
        name: 'ECTA Contract',
        order: 6,
        statuses: ['ECTA_CONTRACT_PENDING', 'ECTA_CONTRACT_APPROVED', 'ECTA_CONTRACT_REJECTED', 'CONTRACT_REJECTED'],
    },
    {
        name: 'Banking',
        order: 7,
        statuses: ['BANK_DOCUMENT_PENDING', 'BANK_DOCUMENT_VERIFIED', 'BANK_DOCUMENT_REJECTED', 'BANKING_PENDING', 'BANKING_APPROVED'],
    },
    {
        name: 'FX Approval',
        order: 8,
        statuses: ['FX_APPLICATION_PENDING', 'FX_PENDING', 'FX_APPROVED', 'FX_REJECTED'],
    },
    {
        name: 'Export Customs',
        order: 9,
        statuses: ['CUSTOMS_PENDING', 'EXPORT_CUSTOMS_PENDING', 'CUSTOMS_CLEARED', 'EXPORT_CUSTOMS_CLEARED', 'CUSTOMS_REJECTED', 'EXPORT_CUSTOMS_REJECTED'],
    },
    {
        name: 'Shipping',
        order: 10,
        statuses: ['SHIPMENT_PENDING', 'SHIPMENT_SCHEDULED', 'SHIPPED', 'SHIPMENT_REJECTED', 'ARRIVED'],
    },
    {
        name: 'Import Customs',
        order: 11,
        statuses: ['IMPORT_CUSTOMS_PENDING', 'IMPORT_CUSTOMS_CLEARED', 'IMPORT_CUSTOMS_REJECTED'],
    },
    {
        name: 'Delivery',
        order: 12,
        statuses: ['DELIVERED'],
    },
    {
        name: 'Payment',
        order: 13,
        statuses: ['PAYMENT_PENDING', 'PAYMENT_RECEIVED'],
    },
    {
        name: 'FX Repatriation',
        order: 14,
        statuses: ['FX_REPATRIATED'],
    },
    {
        name: 'Completion',
        order: 15,
        statuses: ['COMPLETED'],
    },
    {
        name: 'Cancellation',
        order: 0,
        statuses: ['CANCELLED'],
    },
];

/**
 * Get the current workflow stage for a given status
 */
export const getCurrentStage = (status: string): WorkflowStage | undefined => {
    return WORKFLOW_STAGES.find(stage => stage.statuses.includes(status));
};

/**
 * Get workflow progress percentage for a status
 */
export const getWorkflowProgress = (status: string): number => {
    const progressMap: Record<string, number> = {
        'DRAFT': 5,
        'PENDING': 5,
        'ECX_PENDING': 10,
        'ECX_VERIFIED': 15,
        'ECX_REJECTED': 0,
        'ECTA_LICENSE_PENDING': 20,
        'ECTA_LICENSE_APPROVED': 25,
        'ECTA_LICENSE_REJECTED': 0,
        'LICENSE_REJECTED': 0,
        'ECTA_QUALITY_PENDING': 30,
        'ECTA_QUALITY_APPROVED': 35,
        'ECTA_QUALITY_REJECTED': 0,
        'QUALITY_PENDING': 30,
        'QUALITY_CERTIFIED': 35,
        'QUALITY_REJECTED': 0,
        'ECTA_ORIGIN_PENDING': 40,
        'ECTA_ORIGIN_APPROVED': 45,
        'ECTA_ORIGIN_REJECTED': 0,
        'ECTA_CONTRACT_PENDING': 50,
        'ECTA_CONTRACT_APPROVED': 55,
        'ECTA_CONTRACT_REJECTED': 0,
        'CONTRACT_REJECTED': 0,
        'BANK_DOCUMENT_PENDING': 60,
        'BANK_DOCUMENT_VERIFIED': 65,
        'BANK_DOCUMENT_REJECTED': 0,
        'BANKING_PENDING': 60,
        'BANKING_APPROVED': 65,
        'FX_APPLICATION_PENDING': 70,
        'FX_PENDING': 70,
        'FX_APPROVED': 75,
        'FX_REJECTED': 0,
        'CUSTOMS_PENDING': 80,
        'EXPORT_CUSTOMS_PENDING': 80,
        'CUSTOMS_CLEARED': 85,
        'EXPORT_CUSTOMS_CLEARED': 85,
        'CUSTOMS_REJECTED': 0,
        'EXPORT_CUSTOMS_REJECTED': 0,
        'IMPORT_CUSTOMS_PENDING': 88,
        'IMPORT_CUSTOMS_CLEARED': 90,
        'IMPORT_CUSTOMS_REJECTED': 0,
        'SHIPMENT_PENDING': 92,
        'SHIPMENT_SCHEDULED': 93,
        'SHIPPED': 94,
        'SHIPMENT_REJECTED': 0,
        'ARRIVED': 95,
        'DELIVERED': 97,
        'PAYMENT_PENDING': 98,
        'PAYMENT_RECEIVED': 99,
        'FX_REPATRIATED': 99,
        'COMPLETED': 100,
        'CANCELLED': 0,
    };
    return progressMap[status] || 0;
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Get status color for UI display
 */
export const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    const rejectionStatuses = [
        'ECX_REJECTED', 'ECTA_LICENSE_REJECTED', 'LICENSE_REJECTED',
        'ECTA_QUALITY_REJECTED', 'QUALITY_REJECTED', 'ECTA_ORIGIN_REJECTED',
        'ECTA_CONTRACT_REJECTED', 'CONTRACT_REJECTED', 'BANK_DOCUMENT_REJECTED',
        'FX_REJECTED', 'CUSTOMS_REJECTED', 'EXPORT_CUSTOMS_REJECTED',
        'IMPORT_CUSTOMS_REJECTED', 'SHIPMENT_REJECTED', 'CANCELLED'
    ];

    const pendingStatuses = [
        'DRAFT', 'PENDING', 'ECX_PENDING', 'ECTA_LICENSE_PENDING',
        'ECTA_QUALITY_PENDING', 'QUALITY_PENDING', 'ECTA_ORIGIN_PENDING',
        'ECTA_CONTRACT_PENDING', 'BANK_DOCUMENT_PENDING', 'BANKING_PENDING',
        'FX_APPLICATION_PENDING', 'FX_PENDING', 'CUSTOMS_PENDING',
        'EXPORT_CUSTOMS_PENDING', 'IMPORT_CUSTOMS_PENDING', 'SHIPMENT_PENDING',
        'PAYMENT_PENDING'
    ];

    const approvedStatuses = [
        'ECX_VERIFIED', 'ECTA_LICENSE_APPROVED', 'ECTA_QUALITY_APPROVED',
        'QUALITY_CERTIFIED', 'ECTA_ORIGIN_APPROVED', 'ECTA_CONTRACT_APPROVED',
        'BANK_DOCUMENT_VERIFIED', 'BANKING_APPROVED', 'FX_APPROVED',
        'CUSTOMS_CLEARED', 'EXPORT_CUSTOMS_CLEARED', 'IMPORT_CUSTOMS_CLEARED'
    ];

    const inProgressStatuses = [
        'SHIPMENT_SCHEDULED', 'SHIPPED', 'ARRIVED', 'DELIVERED', 'PAYMENT_RECEIVED', 'FX_REPATRIATED'
    ];

    if (rejectionStatuses.includes(status)) return 'error';
    if (status === 'COMPLETED') return 'success';
    if (pendingStatuses.includes(status)) return 'warning';
    if (approvedStatuses.includes(status)) return 'info';
    if (inProgressStatuses.includes(status)) return 'primary';

    return 'default';
};

/**
 * Check if status is a rejection state
 */
export const isRejectionState = (status: string): boolean => {
    return status.includes('REJECTED') || status === 'CANCELLED';
};

/**
 * Check if export can be resubmitted from this status
 */
export const canResubmit = (status: string): boolean => {
    const resubmittableStatuses = [
        'ECX_REJECTED', 'ECTA_LICENSE_REJECTED', 'LICENSE_REJECTED',
        'ECTA_QUALITY_REJECTED', 'QUALITY_REJECTED', 'ECTA_ORIGIN_REJECTED',
        'ECTA_CONTRACT_REJECTED', 'CONTRACT_REJECTED', 'BANK_DOCUMENT_REJECTED',
        'FX_REJECTED', 'CUSTOMS_REJECTED', 'EXPORT_CUSTOMS_REJECTED',
        'SHIPMENT_REJECTED'
    ];
    return resubmittableStatuses.includes(status);
};

/**
 * Get rejection stage label for display
 */
export const getRejectionStageLabel = (status: string): string => {
    if (status.includes('ECX')) return 'ECX Verification';
    if (status.includes('LICENSE')) return 'ECTA License';
    if (status.includes('QUALITY')) return 'ECTA Quality';
    if (status.includes('ORIGIN')) return 'ECTA Origin';
    if (status.includes('CONTRACT')) return 'ECTA Contract';
    if (status.includes('BANK') || status.includes('BANKING')) return 'Banking';
    if (status.includes('FX')) return 'FX Approval';
    if (status.includes('CUSTOMS')) return 'Customs';
    if (status.includes('SHIPMENT')) return 'Shipping';
    return 'Unknown';
};

/**
 * Get next possible statuses for a given status
 */
export const getNextStatuses = (currentStatus: string): string[] => {
    const transitions: Record<string, string[]> = {
        'DRAFT': ['ECX_PENDING'],
        'PENDING': ['ECX_PENDING'],
        'ECX_PENDING': ['ECX_VERIFIED', 'ECX_REJECTED'],
        'ECX_VERIFIED': ['ECTA_LICENSE_PENDING'],
        'ECX_REJECTED': ['DRAFT'],
        'ECTA_LICENSE_PENDING': ['ECTA_LICENSE_APPROVED', 'ECTA_LICENSE_REJECTED'],
        'ECTA_LICENSE_APPROVED': ['ECTA_QUALITY_PENDING'],
        'ECTA_LICENSE_REJECTED': ['DRAFT'],
        'LICENSE_REJECTED': ['DRAFT'],
        'ECTA_QUALITY_PENDING': ['ECTA_QUALITY_APPROVED', 'ECTA_QUALITY_REJECTED'],
        'ECTA_QUALITY_APPROVED': ['ECTA_ORIGIN_PENDING'],
        'ECTA_QUALITY_REJECTED': ['DRAFT'],
        'QUALITY_PENDING': ['ECTA_QUALITY_APPROVED', 'ECTA_QUALITY_REJECTED'],
        'QUALITY_CERTIFIED': ['ECTA_ORIGIN_PENDING'],
        'QUALITY_REJECTED': ['DRAFT'],
        'ECTA_ORIGIN_PENDING': ['ECTA_ORIGIN_APPROVED', 'ECTA_ORIGIN_REJECTED'],
        'ECTA_ORIGIN_APPROVED': ['ECTA_CONTRACT_PENDING'],
        'ECTA_ORIGIN_REJECTED': ['DRAFT'],
        'ECTA_CONTRACT_PENDING': ['ECTA_CONTRACT_APPROVED', 'ECTA_CONTRACT_REJECTED'],
        'ECTA_CONTRACT_APPROVED': ['BANK_DOCUMENT_PENDING'],
        'ECTA_CONTRACT_REJECTED': ['DRAFT'],
        'CONTRACT_REJECTED': ['DRAFT'],
        'BANK_DOCUMENT_PENDING': ['BANK_DOCUMENT_VERIFIED', 'BANK_DOCUMENT_REJECTED'],
        'BANK_DOCUMENT_VERIFIED': ['FX_APPLICATION_PENDING'],
        'BANK_DOCUMENT_REJECTED': ['DRAFT'],
        'BANKING_PENDING': ['BANKING_APPROVED'],
        'BANKING_APPROVED': ['FX_PENDING'],
        'FX_APPLICATION_PENDING': ['FX_APPROVED', 'FX_REJECTED'],
        'FX_PENDING': ['FX_APPROVED', 'FX_REJECTED'],
        'FX_APPROVED': ['CUSTOMS_PENDING'],
        'FX_REJECTED': ['DRAFT'],
        'CUSTOMS_PENDING': ['CUSTOMS_CLEARED', 'CUSTOMS_REJECTED'],
        'EXPORT_CUSTOMS_PENDING': ['EXPORT_CUSTOMS_CLEARED', 'EXPORT_CUSTOMS_REJECTED'],
        'CUSTOMS_CLEARED': ['SHIPMENT_PENDING'],
        'EXPORT_CUSTOMS_CLEARED': ['SHIPMENT_PENDING'],
        'CUSTOMS_REJECTED': ['DRAFT'],
        'EXPORT_CUSTOMS_REJECTED': ['DRAFT'],
        'IMPORT_CUSTOMS_PENDING': ['IMPORT_CUSTOMS_CLEARED', 'IMPORT_CUSTOMS_REJECTED'],
        'IMPORT_CUSTOMS_CLEARED': ['DELIVERED'],
        'IMPORT_CUSTOMS_REJECTED': ['DRAFT'],
        'SHIPMENT_PENDING': ['SHIPMENT_SCHEDULED'],
        'SHIPMENT_SCHEDULED': ['SHIPPED'],
        'SHIPPED': ['ARRIVED'],
        'SHIPMENT_REJECTED': ['DRAFT'],
        'ARRIVED': ['IMPORT_CUSTOMS_PENDING'],
        'DELIVERED': ['PAYMENT_PENDING'],
        'PAYMENT_PENDING': ['PAYMENT_RECEIVED'],
        'PAYMENT_RECEIVED': ['FX_REPATRIATED'],
        'FX_REPATRIATED': ['COMPLETED'],
        'COMPLETED': [],
        'CANCELLED': [],
    };
    return transitions[currentStatus] || [];
};

/**
 * Check if a transition is valid
 */
export const isValidTransition = (currentStatus: string, newStatus: string): boolean => {
    const allowedNext = getNextStatuses(currentStatus);
    return allowedNext.includes(newStatus);
};
