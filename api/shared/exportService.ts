import { Contract } from 'fabric-network';

export interface ExportDocument {
  cid: string;
  version: number;
  timestamp: string;
  isActive: boolean;
}

export type ExportStatus =
  // Initial States
  | 'DRAFT'
  | 'PENDING'
  // ECX Stage
  | 'ECX_PENDING'
  | 'ECX_VERIFIED'
  | 'ECX_REJECTED'
  // ECTA Stage
  | 'ECTA_LICENSE_PENDING'
  | 'ECTA_LICENSE_APPROVED'
  | 'ECTA_LICENSE_REJECTED'
  | 'LICENSE_REJECTED' // Alias for ECTA_LICENSE_REJECTED
  | 'ECTA_QUALITY_PENDING'
  | 'ECTA_QUALITY_APPROVED'
  | 'ECTA_QUALITY_REJECTED'
  | 'QUALITY_PENDING' // Alias
  | 'QUALITY_CERTIFIED' // Alias for ECTA_QUALITY_APPROVED
  | 'QUALITY_REJECTED' // Alias for ECTA_QUALITY_REJECTED
  | 'ECTA_ORIGIN_PENDING'
  | 'ECTA_ORIGIN_APPROVED'
  | 'ECTA_ORIGIN_REJECTED'
  | 'ECTA_CONTRACT_PENDING'
  | 'ECTA_CONTRACT_APPROVED'
  | 'ECTA_CONTRACT_REJECTED'
  | 'CONTRACT_REJECTED' // Alias for ECTA_CONTRACT_REJECTED
  // Commercial Bank Stage
  | 'BANK_DOCUMENT_PENDING'
  | 'BANK_DOCUMENT_VERIFIED'
  | 'BANK_DOCUMENT_REJECTED'
  // NBE Stage
  | 'FX_APPLICATION_PENDING'
  | 'FX_PENDING' // Alias for FX_APPLICATION_PENDING
  | 'FX_APPROVED'
  | 'FX_REJECTED'
  // Customs Stage
  | 'CUSTOMS_PENDING'
  | 'CUSTOMS_CLEARED'
  | 'CUSTOMS_REJECTED'
  | 'EXPORT_CUSTOMS_PENDING' // Alias
  | 'EXPORT_CUSTOMS_CLEARED' // Alias
  | 'EXPORT_CUSTOMS_REJECTED' // Alias
  | 'IMPORT_CUSTOMS_PENDING'
  | 'IMPORT_CUSTOMS_CLEARED'
  | 'IMPORT_CUSTOMS_REJECTED'
  // Shipping Stage
  | 'SHIPMENT_PENDING'
  | 'SHIPMENT_SCHEDULED'
  | 'SHIPPED'
  | 'SHIPMENT_REJECTED'
  | 'ARRIVED'
  // Final States
  | 'DELIVERED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_RECEIVED'
  | 'FX_REPATRIATED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ExportRequest {
  exportId: string;
  commercialBankId: string;
  exporterName: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  status: ExportStatus;
  createdAt: string;
  updatedAt: string;
  
  // Pre-export fields
  exportLicenseNumber?: string;
  ecxLotNumber?: string;
  warehouseLocation?: string;
  
  // Quality fields (NCAT)
  qualityDocuments?: ExportDocument[];
  qualityGrade?: string;
  qualityCertifiedBy?: string;
  qualityCertifiedAt?: string;
  qualityRejectionReason?: string;
  
  // Certificate of Origin
  originCertificateNumber?: string;
  originCertificateDate?: string;
  originCertificateIssuedBy?: string;
  originCertDocuments?: ExportDocument[];
  
  // FX fields (National Bank)
  fxDocuments?: ExportDocument[];
  fxApprovedBy?: string;
  fxApprovedAt?: string;
  fxRejectionReason?: string;
  
  // Export Customs fields
  exportCustomsDeclarationNumber?: string;
  exportCustomsClearedBy?: string;
  exportCustomsClearedAt?: string;
  exportCustomsRejectionReason?: string;
  exportCustomsDocuments?: ExportDocument[];
  
  // Shipping fields
  shipmentDocuments?: ExportDocument[];
  transportIdentifier?: string;
  departureDate?: string;
  arrivalDate?: string;
  actualArrivalDate?: string;
  shippingLineId?: string;
  transportMode?: 'SEA' | 'AIR' | 'RAIL';
  shippedAt?: string;
  
  // Import Customs fields
  importCustomsDeclarationNumber?: string;
  importCustomsClearedBy?: string;
  importCustomsClearedAt?: string;
  importCustomsRejectionReason?: string;
  importCustomsDocuments?: ExportDocument[];
  
  // Delivery fields
  deliveryConfirmedBy?: string;
  deliveryDate?: string;
  
  // Payment fields
  paymentMethod?: string;
  paymentReceivedDate?: string;
  paymentAmount?: number;
  fxRepatriatedDate?: string;
  fxRepatriatedAmount?: number;
}

export interface CreateExportData {
  exporterName: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  exportLicenseNumber?: string;
  ecxLotNumber?: string;
  warehouseLocation?: string;
}

export interface ApproveQualityData {
  qualityGrade: string;
  certifiedBy: string;
  documentCIDs?: string[];
  originCertificateNumber?: string;
}

export interface ApproveBankingData {
  bankingApprovalID: string;
  documentCIDs?: string[];
}

export interface ApproveFXData {
  fxApprovalID: string;
  documentCIDs?: string[];
}

export interface ClearCustomsData {
  declarationNumber: string;
  clearedBy: string;
  documentCIDs?: string[];
}

export interface ScheduleShipmentData {
  transportIdentifier: string;
  departureDate: string;
  arrivalDate: string;
  transportMode: 'SEA' | 'AIR' | 'RAIL';
  documentCIDs?: string[];
}

/**
 * BlockchainExportService - Handles all export-related blockchain operations
 */
export class BlockchainExportService {
  private contract: Contract;

  constructor(contract: Contract) {
    this.contract = contract;
  }

  /**
   * Create a new export request (Exporter)
   */
  async createExport(exportId: string, commercialBankId: string, data: CreateExportData): Promise<ExportRequest> {
    // Generate temporary license number if not provided
    const licenseNumber = data.exportLicenseNumber || `TEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Generate temporary ECX lot number if not provided
    const ecxLotNumber = data.ecxLotNumber || `LOT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Use default warehouse location if not provided
    const warehouseLocation = data.warehouseLocation || 'Pending Assignment';
    
    await this.contract.submitTransaction(
      'CreateExportRequest',
      exportId,
      commercialBankId,
      data.exporterName,
      licenseNumber,
      data.coffeeType,
      data.quantity.toString(),
      data.destinationCountry,
      data.estimatedValue.toString(),
      ecxLotNumber,
      warehouseLocation
    );

    return this.getExport(exportId);
  }

  /**
   * Get a single export by ID
   */
  async getExport(exportId: string): Promise<ExportRequest> {
    const result = await this.contract.evaluateTransaction('GetExport', exportId);
    return JSON.parse(result.toString());
  }

  /**
   * Get all exports
   */
  async getAllExports(): Promise<ExportRequest[]> {
    const result = await this.contract.evaluateTransaction('GetAllExports');
    const resultStr = result.toString().trim();
    
    // Handle empty result
    if (!resultStr || resultStr === '') {
      return [];
    }
    
    try {
      const exports = JSON.parse(resultStr);
      return Array.isArray(exports) ? exports : [];
    } catch (error) {
      console.error('Error parsing exports:', error);
      return [];
    }
  }

  /**
   * Get exports by status
   */
  async getExportsByStatus(status: ExportStatus): Promise<ExportRequest[]> {
    const result = await this.contract.evaluateTransaction('GetExportsByStatus', status);
    const resultStr = result.toString().trim();
    
    // Handle empty result
    if (!resultStr || resultStr === '') {
      return [];
    }
    
    try {
      const exports = JSON.parse(resultStr);
      return Array.isArray(exports) ? exports : [];
    } catch (error) {
      console.error('Error parsing exports by status:', error);
      return [];
    }
  }

  /**
   * Submit for quality inspection (Exporter)
   */
  async submitForQuality(exportId: string): Promise<void> {
    await this.contract.submitTransaction('SubmitForQuality', exportId);
  }

  /**
   * Approve quality and issue certificate (NCAT)
   */
  async approveQuality(exportId: string, data: ApproveQualityData): Promise<void> {
    const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
    
    await this.contract.submitTransaction(
      'ApproveQuality',
      exportId,
      data.qualityGrade,
      data.certifiedBy,
      documentCIDsJSON,
      data.originCertificateNumber || ''
    );
  }

  /**
   * Reject quality (NCAT)
   */
  async rejectQuality(exportId: string, reason: string, rejectedBy: string): Promise<void> {
    await this.contract.submitTransaction('RejectQuality', exportId, reason, rejectedBy);
  }

  /**
   * Submit for FX approval (Exporter)
   */
  async submitForFX(exportId: string): Promise<void> {
    await this.contract.submitTransaction('SubmitForFX', exportId);
  }

  /**
   * Approve FX (National Bank)
   */
  async approveFX(exportId: string, data: ApproveFXData): Promise<void> {
    const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
    
    await this.contract.submitTransaction(
      'ApproveFX',
      exportId,
      data.fxApprovalID,
      documentCIDsJSON
    );
  }

  /**
   * Reject FX (National Bank)
   */
  async rejectFX(exportId: string, reason: string): Promise<void> {
    await this.contract.submitTransaction('RejectFX', exportId, reason);
  }

  /**
   * Submit for banking review (Exporter)
   */
  async submitForBankingReview(exportId: string): Promise<void> {
    await this.contract.submitTransaction('SubmitForBankingReview', exportId);
  }

  /**
   * Approve banking/financial documents (commercialbank)
   */
  async approveBanking(exportId: string, data: ApproveBankingData): Promise<void> {
    const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
    
    await this.contract.submitTransaction(
      'ApproveBanking',
      exportId,
      data.bankingApprovalID,
      documentCIDsJSON
    );
  }

  /**
   * Reject banking (commercialbank)
   */
  async rejectBanking(exportId: string, reason: string): Promise<void> {
    await this.contract.submitTransaction('RejectBanking', exportId, reason);
  }

  /**
   * Submit to export customs (Exporter)
   */
  async submitToExportCustoms(exportId: string, declarationNumber: string): Promise<void> {
    await this.contract.submitTransaction('SubmitToExportCustoms', exportId, declarationNumber);
  }

  /**
   * Clear export customs (Customs Authorities)
   */
  async clearExportCustoms(exportId: string, data: ClearCustomsData): Promise<void> {
    const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
    
    await this.contract.submitTransaction(
      'ClearExportCustoms',
      exportId,
      data.clearedBy,
      documentCIDsJSON
    );
  }

  /**
   * Reject export customs (Customs Authorities)
   */
  async rejectExportCustoms(exportId: string, reason: string, rejectedBy: string): Promise<void> {
    await this.contract.submitTransaction('RejectExportCustoms', exportId, reason, rejectedBy);
  }

  /**
   * Schedule shipment (Shipping Line)
   */
  async scheduleShipment(exportId: string, data: ScheduleShipmentData): Promise<void> {
    const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
    
    await this.contract.submitTransaction(
      'ScheduleShipment',
      exportId,
      data.transportIdentifier,
      data.departureDate,
      data.arrivalDate,
      data.transportMode,
      documentCIDsJSON
    );
  }

  /**
   * Mark as shipped (Shipping Line)
   */
  async markAsShipped(exportId: string): Promise<void> {
    await this.contract.submitTransaction('MarkAsShipped', exportId);
  }

  /**
   * Mark as arrived (Shipping Line)
   */
  async markAsArrived(exportId: string, actualArrivalDate: string): Promise<void> {
    await this.contract.submitTransaction('MarkAsArrived', exportId, actualArrivalDate);
  }

  /**
   * Submit to import customs (Importer/Shipping Line)
   */
  async submitToImportCustoms(exportId: string, declarationNumber: string): Promise<void> {
    await this.contract.submitTransaction('SubmitToImportCustoms', exportId, declarationNumber);
  }

  /**
   * Clear import customs (Destination Customs)
   */
  async clearImportCustoms(exportId: string, data: ClearCustomsData): Promise<void> {
    const documentCIDsJSON = data.documentCIDs ? JSON.stringify(data.documentCIDs) : '[]';
    
    await this.contract.submitTransaction(
      'ClearImportCustoms',
      exportId,
      data.clearedBy,
      documentCIDsJSON
    );
  }

  /**
   * Confirm delivery (Importer/Shipping Line)
   */
  async confirmDelivery(exportId: string, confirmedBy: string): Promise<void> {
    await this.contract.submitTransaction('ConfirmDelivery', exportId, confirmedBy);
  }

  /**
   * Confirm payment received (commercialbank)
   */
  async confirmPayment(exportId: string, paymentMethod: string, amount: number): Promise<void> {
    await this.contract.submitTransaction(
      'ConfirmPayment',
      exportId,
      paymentMethod,
      amount.toString()
    );
  }

  /**
   * Confirm FX repatriation (National Bank)
   */
  async confirmFXRepatriation(exportId: string, amount: number): Promise<void> {
    await this.contract.submitTransaction('ConfirmFXRepatriation', exportId, amount.toString());
  }

  /**
   * Cancel export (Exporter)
   */
  async cancelExport(exportId: string, reason: string): Promise<void> {
    await this.contract.submitTransaction('CancelExport', exportId, reason);
  }

  /**
   * Update rejected export (Exporter)
   */
  async updateRejectedExport(exportId: string, data: Partial<CreateExportData>): Promise<void> {
    await this.contract.submitTransaction(
      'UpdateRejectedExport',
      exportId,
      data.coffeeType || '',
      data.quantity?.toString() || '',
      data.destinationCountry || '',
      data.estimatedValue?.toString() || ''
    );
  }
}

/**
 * Factory function to create BlockchainExportService instance
 */
export function createExportService(contract: Contract): BlockchainExportService {
  return new BlockchainExportService(contract);
}

/**
 * Helper function to get available actions for a role and export status
 */
export function getAvailableActions(role: string, status: ExportStatus): string[] {
  const actions: string[] = [];

  switch (role) {
    case 'exporter':
      if (status === 'DRAFT') actions.push('submit_to_ecx');
      if (status === 'ECX_VERIFIED') actions.push('submit_to_ecta');
      if (status === 'ECTA_CONTRACT_APPROVED') actions.push('submit_to_bank');
      if (status === 'FX_REJECTED' || status === 'BANK_DOCUMENT_REJECTED' || status === 'ECTA_LICENSE_REJECTED') {
        actions.push('update_export', 'cancel_export');
      }
      break;

    case 'ecx':
      if (status === 'ECX_PENDING') actions.push('verify_lot', 'reject_lot');
      break;

    case 'ecta': // ECTA (formerly NCAT)
      if (status === 'ECTA_LICENSE_PENDING') actions.push('approve_license', 'reject_license');
      if (status === 'ECTA_QUALITY_PENDING') actions.push('approve_quality', 'reject_quality');
      if (status === 'ECTA_CONTRACT_PENDING') actions.push('approve_contract', 'reject_contract');
      break;

    case 'bank':
      if (status === 'BANK_DOCUMENT_PENDING') actions.push('verify_documents', 'reject_documents');
      if (status === 'BANK_DOCUMENT_VERIFIED') actions.push('submit_fx_application');
      if (status === 'PAYMENT_RECEIVED') actions.push('confirm_payment');
      break;

    case 'nbe': // National Bank of Ethiopia
      if (status === 'FX_APPLICATION_PENDING') actions.push('approve_fx', 'reject_fx');
      if (status === 'FX_REPATRIATED') actions.push('confirm_fx_repatriation');
      break;

    case 'customs':
      if (status === 'CUSTOMS_PENDING') actions.push('clear_customs', 'reject_customs');
      break;

    case 'shipper':
      if (status === 'CUSTOMS_CLEARED') actions.push('schedule_shipment');
      if (status === 'SHIPMENT_SCHEDULED') actions.push('mark_as_shipped');
      if (status === 'SHIPPED') actions.push('mark_as_arrived');
      if (status === 'ARRIVED') actions.push('confirm_delivery');
      break;
  }

  return actions;
}

/**
 * Get status display information
 */
export function getStatusInfo(status: ExportStatus): { label: string; color: string; description: string } {
  const statusMap: Record<ExportStatus, { label: string; color: string; description: string }> = {
    // Initial States
    DRAFT: { label: 'Draft', color: 'gray', description: 'Export request created' },
    PENDING: { label: 'Pending', color: 'yellow', description: 'Awaiting submission' },
    // ECX Stage
    ECX_PENDING: { label: 'ECX Pending', color: 'yellow', description: 'Awaiting ECX verification' },
    ECX_VERIFIED: { label: 'ECX Verified', color: 'green', description: 'Verified by ECX' },
    ECX_REJECTED: { label: 'ECX Rejected', color: 'red', description: 'Rejected by ECX' },
    // ECTA Stage
    ECTA_LICENSE_PENDING: { label: 'License Pending', color: 'yellow', description: 'Awaiting ECTA license approval' },
    ECTA_LICENSE_APPROVED: { label: 'License Approved', color: 'green', description: 'Export license approved' },
    ECTA_LICENSE_REJECTED: { label: 'License Rejected', color: 'red', description: 'Export license rejected' },
    LICENSE_REJECTED: { label: 'License Rejected', color: 'red', description: 'Export license rejected' }, // Alias
    ECTA_QUALITY_PENDING: { label: 'Quality Pending', color: 'yellow', description: 'Awaiting ECTA quality certification' },
    ECTA_QUALITY_APPROVED: { label: 'Quality Approved', color: 'green', description: 'Quality certified by ECTA' },
    ECTA_QUALITY_REJECTED: { label: 'Quality Rejected', color: 'red', description: 'Quality certification rejected' },
    QUALITY_PENDING: { label: 'Quality Pending', color: 'yellow', description: 'Awaiting quality certification' }, // Alias
    QUALITY_CERTIFIED: { label: 'Quality Certified', color: 'green', description: 'Quality certified' }, // Alias
    QUALITY_REJECTED: { label: 'Quality Rejected', color: 'red', description: 'Quality rejected' }, // Alias
    ECTA_ORIGIN_PENDING: { label: 'Origin Pending', color: 'yellow', description: 'Awaiting origin verification' },
    ECTA_ORIGIN_APPROVED: { label: 'Origin Approved', color: 'green', description: 'Origin verified' },
    ECTA_ORIGIN_REJECTED: { label: 'Origin Rejected', color: 'red', description: 'Origin verification failed' },
    ECTA_CONTRACT_PENDING: { label: 'Contract Pending', color: 'yellow', description: 'Awaiting contract approval' },
    ECTA_CONTRACT_APPROVED: { label: 'Contract Approved', color: 'green', description: 'Contract approved by ECTA' },
    ECTA_CONTRACT_REJECTED: { label: 'Contract Rejected', color: 'red', description: 'Contract rejected' },
    CONTRACT_REJECTED: { label: 'Contract Rejected', color: 'red', description: 'Contract rejected' }, // Alias
    // Commercial Bank Stage
    BANK_DOCUMENT_PENDING: { label: 'Bank Review', color: 'yellow', description: 'Awaiting bank document verification' },
    BANK_DOCUMENT_VERIFIED: { label: 'Documents Verified', color: 'green', description: 'Documents verified by bank' },
    BANK_DOCUMENT_REJECTED: { label: 'Documents Rejected', color: 'red', description: 'Documents rejected by bank' },
    // NBE Stage
    FX_APPLICATION_PENDING: { label: 'FX Pending', color: 'yellow', description: 'Awaiting NBE FX approval' },
    FX_PENDING: { label: 'FX Pending', color: 'yellow', description: 'Awaiting FX approval' }, // Alias
    FX_APPROVED: { label: 'FX Approved', color: 'green', description: 'FX approved by NBE' },
    FX_REJECTED: { label: 'FX Rejected', color: 'red', description: 'FX approval rejected' },
    // Customs Stage
    CUSTOMS_PENDING: { label: 'Customs Pending', color: 'yellow', description: 'Awaiting customs clearance' },
    CUSTOMS_CLEARED: { label: 'Customs Cleared', color: 'green', description: 'Cleared by customs' },
    CUSTOMS_REJECTED: { label: 'Customs Rejected', color: 'red', description: 'Customs clearance rejected' },
    EXPORT_CUSTOMS_PENDING: { label: 'Export Customs Pending', color: 'yellow', description: 'Awaiting export customs clearance' }, // Alias
    EXPORT_CUSTOMS_CLEARED: { label: 'Export Customs Cleared', color: 'green', description: 'Export customs cleared' }, // Alias
    EXPORT_CUSTOMS_REJECTED: { label: 'Export Customs Rejected', color: 'red', description: 'Export customs rejected' }, // Alias
    IMPORT_CUSTOMS_PENDING: { label: 'Import Customs Pending', color: 'yellow', description: 'Awaiting import customs clearance' },
    IMPORT_CUSTOMS_CLEARED: { label: 'Import Customs Cleared', color: 'green', description: 'Import customs cleared' },
    IMPORT_CUSTOMS_REJECTED: { label: 'Import Customs Rejected', color: 'red', description: 'Import customs rejected' },
    // Shipping Stage
    SHIPMENT_PENDING: { label: 'Shipment Pending', color: 'yellow', description: 'Awaiting shipment scheduling' },
    SHIPMENT_SCHEDULED: { label: 'Shipment Scheduled', color: 'blue', description: 'Shipment scheduled' },
    SHIPPED: { label: 'Shipped', color: 'blue', description: 'In transit' },
    SHIPMENT_REJECTED: { label: 'Shipment Rejected', color: 'red', description: 'Shipment rejected' },
    ARRIVED: { label: 'Arrived', color: 'blue', description: 'Arrived at destination' },
    // Final States
    DELIVERED: { label: 'Delivered', color: 'green', description: 'Delivered to buyer' },
    PAYMENT_PENDING: { label: 'Payment Pending', color: 'yellow', description: 'Awaiting payment' },
    PAYMENT_RECEIVED: { label: 'Payment Received', color: 'green', description: 'Payment received' },
    FX_REPATRIATED: { label: 'FX Repatriated', color: 'green', description: 'Foreign exchange repatriated' },
    COMPLETED: { label: 'Completed', color: 'green', description: 'Export process completed' },
    CANCELLED: { label: 'Cancelled', color: 'gray', description: 'Export cancelled' },
  };

  return statusMap[status] || { label: status, color: 'gray', description: 'Unknown status' };
}
