import { ExportStatus } from './exportService';

/**
 * Export State Machine - Enforces valid status transitions
 * Implements a finite state machine for the export workflow
 */
export class ExportStateMachine {
  /**
   * Valid transitions between statuses
   * Maps current status to array of allowed next statuses
   */
  private static readonly validTransitions: Record<ExportStatus, ExportStatus[]> = {
    // Initial States
    DRAFT: ['ECX_PENDING'],
    PENDING: ['ECX_PENDING'],

    // ECX Stage
    ECX_PENDING: ['ECX_VERIFIED', 'ECX_REJECTED'],
    ECX_VERIFIED: ['ECTA_LICENSE_PENDING'],
    ECX_REJECTED: ['DRAFT'],

    // ECTA License Stage
    ECTA_LICENSE_PENDING: ['ECTA_LICENSE_APPROVED', 'ECTA_LICENSE_REJECTED'],
    ECTA_LICENSE_APPROVED: ['ECTA_QUALITY_PENDING'],
    ECTA_LICENSE_REJECTED: ['DRAFT'],
    LICENSE_REJECTED: ['DRAFT'], // Alias

    // ECTA Quality Stage
    ECTA_QUALITY_PENDING: ['ECTA_QUALITY_APPROVED', 'ECTA_QUALITY_REJECTED'],
    ECTA_QUALITY_APPROVED: ['ECTA_ORIGIN_PENDING'],
    ECTA_QUALITY_REJECTED: ['DRAFT'],
    QUALITY_PENDING: ['ECTA_QUALITY_APPROVED', 'ECTA_QUALITY_REJECTED'], // Alias
    QUALITY_CERTIFIED: ['ECTA_ORIGIN_PENDING'], // Alias
    QUALITY_REJECTED: ['DRAFT'], // Alias

    // ECTA Origin Stage
    ECTA_ORIGIN_PENDING: ['ECTA_ORIGIN_APPROVED', 'ECTA_ORIGIN_REJECTED'],
    ECTA_ORIGIN_APPROVED: ['ECTA_CONTRACT_PENDING'],
    ECTA_ORIGIN_REJECTED: ['DRAFT'],

    // ECTA Contract Stage
    ECTA_CONTRACT_PENDING: ['ECTA_CONTRACT_APPROVED', 'ECTA_CONTRACT_REJECTED'],
    ECTA_CONTRACT_APPROVED: ['BANK_DOCUMENT_PENDING'],
    ECTA_CONTRACT_REJECTED: ['DRAFT'],
    CONTRACT_REJECTED: ['DRAFT'], // Alias

    // Commercial Bank Stage
    BANK_DOCUMENT_PENDING: ['BANK_DOCUMENT_VERIFIED', 'BANK_DOCUMENT_REJECTED'],
    BANK_DOCUMENT_VERIFIED: ['FX_APPLICATION_PENDING'],
    BANK_DOCUMENT_REJECTED: ['DRAFT'],

    // NBE FX Stage
    FX_APPLICATION_PENDING: ['FX_APPROVED', 'FX_REJECTED'],
    FX_PENDING: ['FX_APPROVED', 'FX_REJECTED'], // Alias
    FX_APPROVED: ['CUSTOMS_PENDING'],
    FX_REJECTED: ['DRAFT'],

    // Customs Stage
    CUSTOMS_PENDING: ['CUSTOMS_CLEARED', 'CUSTOMS_REJECTED'],
    EXPORT_CUSTOMS_PENDING: ['EXPORT_CUSTOMS_CLEARED', 'EXPORT_CUSTOMS_REJECTED'], // Alias
    CUSTOMS_CLEARED: ['SHIPMENT_PENDING'],
    EXPORT_CUSTOMS_CLEARED: ['SHIPMENT_PENDING'], // Alias
    CUSTOMS_REJECTED: ['DRAFT'],
    EXPORT_CUSTOMS_REJECTED: ['DRAFT'], // Alias
    IMPORT_CUSTOMS_PENDING: ['IMPORT_CUSTOMS_CLEARED', 'IMPORT_CUSTOMS_REJECTED'],
    IMPORT_CUSTOMS_CLEARED: ['DELIVERED'],
    IMPORT_CUSTOMS_REJECTED: ['DRAFT'],

    // Shipping Stage
    SHIPMENT_PENDING: ['SHIPMENT_SCHEDULED'],
    SHIPMENT_SCHEDULED: ['SHIPPED'],
    SHIPPED: ['ARRIVED'],
    SHIPMENT_REJECTED: ['DRAFT'],
    ARRIVED: ['IMPORT_CUSTOMS_PENDING'],

    // Final States
    DELIVERED: ['PAYMENT_PENDING'],
    PAYMENT_PENDING: ['PAYMENT_RECEIVED'],
    PAYMENT_RECEIVED: ['FX_REPATRIATED'],
    FX_REPATRIATED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  /**
   * Validate if a status transition is allowed
   * @param currentStatus Current export status
   * @param newStatus Desired new status
   * @returns true if transition is valid, false otherwise
   */
  static isValidTransition(currentStatus: ExportStatus, newStatus: ExportStatus): boolean {
    const allowedTransitions = this.validTransitions[currentStatus];
    if (!allowedTransitions) {
      return false;
    }
    return allowedTransitions.includes(newStatus);
  }

  /**
   * Get allowed next statuses for current status
   * @param currentStatus Current export status
   * @returns Array of allowed next statuses
   */
  static getNextStatuses(currentStatus: ExportStatus): ExportStatus[] {
    return this.validTransitions[currentStatus] || [];
  }

  /**
   * Validate transition and throw error if invalid
   * @param currentStatus Current export status
   * @param newStatus Desired new status
   * @throws Error if transition is invalid
   */
  static validateTransition(currentStatus: ExportStatus, newStatus: ExportStatus): void {
    if (!this.isValidTransition(currentStatus, newStatus)) {
      const allowedNext = this.getNextStatuses(currentStatus);
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
          `Allowed transitions: ${allowedNext.length > 0 ? allowedNext.join(', ') : 'None (terminal state)'}`
      );
    }
  }

  /**
   * Get transition metadata
   * @param currentStatus Current export status
   * @param newStatus Desired new status
   * @returns Transition information
   */
  static getTransitionInfo(currentStatus: ExportStatus, newStatus: ExportStatus) {
    return {
      from: currentStatus,
      to: newStatus,
      isValid: this.isValidTransition(currentStatus, newStatus),
      allowedNext: this.getNextStatuses(newStatus),
      reason: this.isValidTransition(currentStatus, newStatus)
        ? 'Valid transition'
        : `Invalid transition. Allowed from ${currentStatus}: ${this.getNextStatuses(currentStatus).join(', ')}`,
    };
  }

  /**
   * Get all valid transitions
   * @returns Complete transition map
   */
  static getAllTransitions(): Record<ExportStatus, ExportStatus[]> {
    return { ...this.validTransitions };
  }

  /**
   * Check if status is a terminal state (no further transitions allowed)
   * @param status Export status
   * @returns true if status is terminal
   */
  static isTerminalState(status: ExportStatus): boolean {
    const nextStates = this.getNextStatuses(status);
    return nextStates.length === 0;
  }

  /**
   * Get workflow stage for a status
   * @param status Export status
   * @returns Workflow stage name
   */
  static getWorkflowStage(status: ExportStatus): string {
    const stageMap: Record<ExportStatus, string> = {
      DRAFT: 'Creation',
      PENDING: 'Creation',
      ECX_PENDING: 'ECX Verification',
      ECX_VERIFIED: 'ECX Verification',
      ECX_REJECTED: 'ECX Verification',
      ECTA_LICENSE_PENDING: 'ECTA License',
      ECTA_LICENSE_APPROVED: 'ECTA License',
      ECTA_LICENSE_REJECTED: 'ECTA License',
      LICENSE_REJECTED: 'ECTA License',
      ECTA_QUALITY_PENDING: 'ECTA Quality',
      ECTA_QUALITY_APPROVED: 'ECTA Quality',
      ECTA_QUALITY_REJECTED: 'ECTA Quality',
      QUALITY_PENDING: 'ECTA Quality',
      QUALITY_CERTIFIED: 'ECTA Quality',
      QUALITY_REJECTED: 'ECTA Quality',
      ECTA_ORIGIN_PENDING: 'ECTA Origin',
      ECTA_ORIGIN_APPROVED: 'ECTA Origin',
      ECTA_ORIGIN_REJECTED: 'ECTA Origin',
      ECTA_CONTRACT_PENDING: 'ECTA Contract',
      ECTA_CONTRACT_APPROVED: 'ECTA Contract',
      ECTA_CONTRACT_REJECTED: 'ECTA Contract',
      CONTRACT_REJECTED: 'ECTA Contract',
      BANK_DOCUMENT_PENDING: 'Banking',
      BANK_DOCUMENT_VERIFIED: 'Banking',
      BANK_DOCUMENT_REJECTED: 'Banking',
      FX_APPLICATION_PENDING: 'FX Approval',
      FX_PENDING: 'FX Approval',
      FX_APPROVED: 'FX Approval',
      FX_REJECTED: 'FX Approval',
      CUSTOMS_PENDING: 'Export Customs',
      EXPORT_CUSTOMS_PENDING: 'Export Customs',
      CUSTOMS_CLEARED: 'Export Customs',
      EXPORT_CUSTOMS_CLEARED: 'Export Customs',
      CUSTOMS_REJECTED: 'Export Customs',
      EXPORT_CUSTOMS_REJECTED: 'Export Customs',
      IMPORT_CUSTOMS_PENDING: 'Import Customs',
      IMPORT_CUSTOMS_CLEARED: 'Import Customs',
      IMPORT_CUSTOMS_REJECTED: 'Import Customs',
      SHIPMENT_PENDING: 'Shipping',
      SHIPMENT_SCHEDULED: 'Shipping',
      SHIPPED: 'Shipping',
      SHIPMENT_REJECTED: 'Shipping',
      ARRIVED: 'Shipping',
      DELIVERED: 'Delivery',
      PAYMENT_PENDING: 'Payment',
      PAYMENT_RECEIVED: 'Payment',
      FX_REPATRIATED: 'FX Repatriation',
      COMPLETED: 'Completion',
      CANCELLED: 'Cancellation',
    };
    return stageMap[status] || 'Unknown';
  }

  /**
   * Get progress percentage for a status
   * @param status Export status
   * @returns Progress percentage (0-100)
   */
  static getProgressPercentage(status: ExportStatus): number {
    const progressMap: Record<ExportStatus, number> = {
      DRAFT: 5,
      PENDING: 5,
      ECX_PENDING: 10,
      ECX_VERIFIED: 15,
      ECX_REJECTED: 0,
      ECTA_LICENSE_PENDING: 20,
      ECTA_LICENSE_APPROVED: 25,
      ECTA_LICENSE_REJECTED: 0,
      LICENSE_REJECTED: 0,
      ECTA_QUALITY_PENDING: 30,
      ECTA_QUALITY_APPROVED: 35,
      ECTA_QUALITY_REJECTED: 0,
      QUALITY_PENDING: 30,
      QUALITY_CERTIFIED: 35,
      QUALITY_REJECTED: 0,
      ECTA_ORIGIN_PENDING: 40,
      ECTA_ORIGIN_APPROVED: 45,
      ECTA_ORIGIN_REJECTED: 0,
      ECTA_CONTRACT_PENDING: 50,
      ECTA_CONTRACT_APPROVED: 55,
      ECTA_CONTRACT_REJECTED: 0,
      CONTRACT_REJECTED: 0,
      BANK_DOCUMENT_PENDING: 60,
      BANK_DOCUMENT_VERIFIED: 65,
      BANK_DOCUMENT_REJECTED: 0,
      FX_APPLICATION_PENDING: 70,
      FX_PENDING: 70,
      FX_APPROVED: 75,
      FX_REJECTED: 0,
      CUSTOMS_PENDING: 80,
      EXPORT_CUSTOMS_PENDING: 80,
      CUSTOMS_CLEARED: 85,
      EXPORT_CUSTOMS_CLEARED: 85,
      CUSTOMS_REJECTED: 0,
      EXPORT_CUSTOMS_REJECTED: 0,
      IMPORT_CUSTOMS_PENDING: 88,
      IMPORT_CUSTOMS_CLEARED: 90,
      IMPORT_CUSTOMS_REJECTED: 0,
      SHIPMENT_PENDING: 92,
      SHIPMENT_SCHEDULED: 93,
      SHIPPED: 94,
      SHIPMENT_REJECTED: 0,
      ARRIVED: 95,
      DELIVERED: 97,
      PAYMENT_PENDING: 98,
      PAYMENT_RECEIVED: 99,
      FX_REPATRIATED: 99,
      COMPLETED: 100,
      CANCELLED: 0,
    };
    return progressMap[status] || 0;
  }
}

/**
 * Export for use in other modules
 */
export default ExportStateMachine;
