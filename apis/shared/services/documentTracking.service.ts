/**
 * Document Tracking Service
 * Manages document upload status, validation, and stage-specific requirements
 */

export interface DocumentStatus {
  uploaded: boolean;
  cid?: string;
  version?: number;
  uploadedAt?: string;
  uploadedBy?: string;
  validated?: boolean;
  validatedAt?: string;
  validatedBy?: string;
}

export interface DocumentChecklist {
  exportLicense: DocumentStatus;
  competenceCertificate: DocumentStatus;
  ecxLotNumber: DocumentStatus;
  warehouseReceipt: DocumentStatus;
  qualityCertificate: DocumentStatus;
  qualityGrade: DocumentStatus;
  salesContract: DocumentStatus;
  exportPermit: DocumentStatus;
  originCertificate: DocumentStatus;
  commercialInvoice: DocumentStatus;
  customsDeclaration: DocumentStatus;
  bankDocuments: DocumentStatus;
  fxApplication: DocumentStatus;
  shipmentDocuments: DocumentStatus;
}

export interface StageRequirements {
  stage: string;
  requiredDocuments: string[];
  optionalDocuments: string[];
  missingDocuments: string[];
  canProceed: boolean;
  completionPercentage: number;
}

/**
 * Get document checklist for an export
 */
export function getDocumentChecklist(exportData: any): DocumentChecklist {
  return {
    exportLicense: {
      uploaded: !!exportData.exportLicenseNumber,
      cid: exportData.exportLicenseNumber,
      uploadedAt: exportData.exportLicenseValidatedAt,
      uploadedBy: exportData.exportLicenseValidatedBy,
      validated: !!exportData.exportLicenseValidatedBy,
    },
    competenceCertificate: {
      uploaded: !!exportData.competenceCertificateNumber,
      cid: exportData.competenceCertificateNumber,
      validated: true, // Pre-qualification requirement
    },
    ecxLotNumber: {
      uploaded: !!exportData.ecxLotNumber,
      cid: exportData.ecxLotNumber,
      uploadedAt: exportData.ecxVerifiedAt,
      uploadedBy: exportData.ecxVerifiedBy,
      validated: exportData.status !== 'ECX_REJECTED',
    },
    warehouseReceipt: {
      uploaded: !!exportData.warehouseReceiptNumber,
      cid: exportData.warehouseReceiptNumber,
      uploadedAt: exportData.ecxVerifiedAt,
      uploadedBy: exportData.ecxVerifiedBy,
      validated: exportData.status !== 'ECX_REJECTED',
    },
    qualityCertificate: {
      uploaded: !!exportData.qualityCertificateNumber,
      cid: exportData.qualityCertificateNumber,
      uploadedAt: exportData.qualityCertifiedAt,
      uploadedBy: exportData.qualityCertifiedBy,
      validated: exportData.status === 'ECTA_QUALITY_APPROVED',
    },
    qualityGrade: {
      uploaded: !!exportData.qualityGrade,
      cid: exportData.qualityGrade,
      uploadedAt: exportData.qualityCertifiedAt,
      uploadedBy: exportData.qualityCertifiedBy,
      validated: exportData.status === 'ECTA_QUALITY_APPROVED',
    },
    salesContract: {
      uploaded: !!exportData.salesContractNumber,
      cid: exportData.salesContractNumber,
      validated: true, // Pre-qualification requirement
    },
    exportPermit: {
      uploaded: !!exportData.exportPermitNumber,
      cid: exportData.exportPermitNumber,
      validated: true, // Pre-qualification requirement
    },
    originCertificate: {
      uploaded: !!exportData.originCertificateNumber,
      cid: exportData.originCertificateNumber,
      uploadedAt: exportData.originCertificateDate,
      uploadedBy: exportData.originCertificateIssuedBy,
      validated: !!exportData.originCertificateNumber,
    },
    commercialInvoice: {
      uploaded: !!exportData.commercialInvoiceNumber,
      cid: exportData.commercialInvoiceNumber,
      validated: true, // Pre-qualification requirement
    },
    customsDeclaration: {
      uploaded: !!exportData.exportCustomsDeclarationNumber,
      cid: exportData.exportCustomsDeclarationNumber,
      uploadedAt: exportData.exportCustomsClearedAt,
      uploadedBy: exportData.exportCustomsClearedBy,
      validated: exportData.status === 'CUSTOMS_CLEARED',
    },
    bankDocuments: {
      uploaded: exportData.status === 'BANK_DOCUMENT_VERIFIED',
      uploadedAt: exportData.updatedAt,
      validated: exportData.status === 'BANK_DOCUMENT_VERIFIED',
    },
    fxApplication: {
      uploaded:
        exportData.status === 'FX_APPROVED' || exportData.status === 'FX_APPLICATION_PENDING',
      uploadedAt: exportData.fxApprovedAt,
      uploadedBy: exportData.fxApprovedBy,
      validated: exportData.status === 'FX_APPROVED',
    },
    shipmentDocuments: {
      uploaded: exportData.status === 'SHIPPED' || exportData.status === 'SHIPMENT_SCHEDULED',
      uploadedAt: exportData.shippedAt,
      validated: exportData.status === 'SHIPPED',
    },
  };
}

/**
 * Get stage-specific document requirements
 */
export function getStageRequirements(exportData: any, status: string): StageRequirements {
  const checklist = getDocumentChecklist(exportData);

  // Define requirements per stage
  const stageMap: { [key: string]: { required: string[]; optional: string[] } } = {
    DRAFT: {
      required: [
        'exportLicense',
        'competenceCertificate',
        'ecxLotNumber',
        'warehouseReceipt',
        'qualityCertificate',
        'qualityGrade',
        'salesContract',
        'exportPermit',
        'originCertificate',
        'commercialInvoice',
      ],
      optional: [],
    },
    ECX_PENDING: {
      required: ['ecxLotNumber', 'warehouseReceipt'],
      optional: ['qualityCertificate'],
    },
    ECX_VERIFIED: {
      required: ['exportLicense', 'competenceCertificate'],
      optional: [],
    },
    ECTA_LICENSE_PENDING: {
      required: ['exportLicense'],
      optional: [],
    },
    ECTA_LICENSE_APPROVED: {
      required: ['qualityCertificate', 'qualityGrade'],
      optional: [],
    },
    ECTA_QUALITY_PENDING: {
      required: ['qualityCertificate'],
      optional: [],
    },
    ECTA_QUALITY_APPROVED: {
      required: ['originCertificate', 'salesContract'],
      optional: [],
    },
    ECTA_CONTRACT_PENDING: {
      required: ['originCertificate'],
      optional: [],
    },
    ECTA_CONTRACT_APPROVED: {
      required: ['commercialInvoice', 'bankDocuments'],
      optional: [],
    },
    BANK_DOCUMENT_PENDING: {
      required: ['commercialInvoice', 'exportLicense', 'qualityCertificate', 'originCertificate'],
      optional: [],
    },
    BANK_DOCUMENT_VERIFIED: {
      required: ['fxApplication'],
      optional: [],
    },
    FX_APPLICATION_PENDING: {
      required: ['fxApplication'],
      optional: [],
    },
    FX_APPROVED: {
      required: ['customsDeclaration'],
      optional: [],
    },
    CUSTOMS_PENDING: {
      required: ['customsDeclaration'],
      optional: [],
    },
    CUSTOMS_CLEARED: {
      required: ['shipmentDocuments'],
      optional: [],
    },
    SHIPMENT_SCHEDULED: {
      required: ['shipmentDocuments'],
      optional: [],
    },
    SHIPPED: {
      required: [],
      optional: [],
    },
    ARRIVED: {
      required: [],
      optional: [],
    },
    IMPORT_CUSTOMS_PENDING: {
      required: [],
      optional: [],
    },
    IMPORT_CUSTOMS_CLEARED: {
      required: [],
      optional: [],
    },
    DELIVERED: {
      required: [],
      optional: [],
    },
    PAYMENT_RECEIVED: {
      required: [],
      optional: [],
    },
    FX_REPATRIATED: {
      required: [],
      optional: [],
    },
    COMPLETED: {
      required: [],
      optional: [],
    },
  };

  const requirements = stageMap[status] || { required: [], optional: [] };

  // Check which required documents are missing
  const missingDocuments = requirements.required.filter(
    (doc) => !checklist[doc as keyof DocumentChecklist]?.uploaded
  );

  // Calculate completion percentage
  const totalRequired = requirements.required.length;
  const uploadedRequired = requirements.required.filter(
    (doc) => checklist[doc as keyof DocumentChecklist]?.uploaded
  ).length;
  const completionPercentage =
    totalRequired > 0 ? Math.round((uploadedRequired / totalRequired) * 100) : 100;

  return {
    stage: status,
    requiredDocuments: requirements.required,
    optionalDocuments: requirements.optional,
    missingDocuments,
    canProceed: missingDocuments.length === 0,
    completionPercentage,
  };
}

/**
 * Get overall document completion percentage
 */
export function getDocumentCompletionPercentage(exportData: any): number {
  const checklist = getDocumentChecklist(exportData);
  const allDocs = Object.values(checklist);
  const uploadedDocs = allDocs.filter((doc) => doc.uploaded).length;
  return Math.round((uploadedDocs / allDocs.length) * 100);
}

/**
 * Get document upload status for a specific stage
 */
export function getDocumentStatusForStage(exportData: any, stage: string): DocumentStatus[] {
  const checklist = getDocumentChecklist(exportData);
  const requirements = getStageRequirements(exportData, stage);

  return requirements.requiredDocuments.map((docKey) => ({
    name: docKey,
    ...checklist[docKey as keyof DocumentChecklist],
  })) as any;
}

/**
 * Validate if export can proceed to next stage
 */
export function canProceedToNextStage(exportData: any, currentStatus: string): boolean {
  const requirements = getStageRequirements(exportData, currentStatus);
  return requirements.canProceed;
}

/**
 * Get next required action for exporter
 */
export function getNextRequiredAction(exportData: any, currentStatus: string): string {
  const requirements = getStageRequirements(exportData, currentStatus);

  if (requirements.missingDocuments.length > 0) {
    return `Upload missing documents: ${requirements.missingDocuments.join(', ')}`;
  }

  if (requirements.canProceed) {
    // Map status to next action
    const nextActions: { [key: string]: string } = {
      DRAFT: 'Submit to ECX for lot verification',
      ECX_VERIFIED: 'Submit to ECTA for license approval',
      ECTA_LICENSE_APPROVED: 'Wait for ECTA quality certification',
      ECTA_QUALITY_APPROVED: 'Wait for ECTA contract approval',
      ECTA_CONTRACT_APPROVED: 'Submit to Commercial Bank for document verification',
      BANK_DOCUMENT_VERIFIED: 'Wait for NBE FX approval',
      FX_APPROVED: 'Wait for customs clearance',
      CUSTOMS_CLEARED: 'Wait for shipping line to schedule shipment',
      SHIPMENT_SCHEDULED: 'Wait for shipment confirmation',
      SHIPPED: 'Wait for arrival notification',
      ARRIVED: 'Wait for import customs clearance',
      IMPORT_CUSTOMS_CLEARED: 'Wait for delivery confirmation',
      DELIVERED: 'Wait for payment confirmation',
      PAYMENT_RECEIVED: 'Wait for FX repatriation',
      FX_REPATRIATED: 'Export process complete',
      COMPLETED: 'Export completed successfully',
    };

    return nextActions[currentStatus] || 'Proceed to next stage';
  }

  return 'Complete all required documents';
}

/**
 * Get document upload instructions for a stage
 */
export function getDocumentUploadInstructions(stage: string): { [key: string]: string } {
  const instructions: { [key: string]: { [key: string]: string } } = {
    DRAFT: {
      exportLicense: 'Upload your export license issued by ECTA',
      competenceCertificate: 'Upload your competence certificate from ECTA',
      ecxLotNumber: 'Provide your ECX lot number',
      warehouseReceipt: 'Upload warehouse receipt from ECX',
      qualityCertificate: 'Upload quality certificate from ECTA',
      qualityGrade: 'Specify the quality grade (e.g., Grade 1, Grade 2)',
      salesContract: 'Upload your sales contract',
      exportPermit: 'Upload export permit from ECTA',
      originCertificate: 'Upload certificate of origin',
      commercialInvoice: 'Upload commercial invoice',
    },
    ECX_PENDING: {
      ecxLotNumber: 'Verify your ECX lot number is correct',
      warehouseReceipt: 'Ensure warehouse receipt is valid',
    },
    ECTA_LICENSE_PENDING: {
      exportLicense: 'Verify your export license details',
    },
    ECTA_QUALITY_PENDING: {
      qualityCertificate: 'Upload quality inspection certificate',
      qualityGrade: 'Confirm quality grade assessment',
    },
    ECTA_CONTRACT_PENDING: {
      originCertificate: 'Upload certificate of origin',
      salesContract: 'Verify sales contract details',
    },
    BANK_DOCUMENT_PENDING: {
      commercialInvoice: 'Upload commercial invoice for banking review',
      exportLicense: 'Provide export license for verification',
      qualityCertificate: 'Provide quality certificate for verification',
      originCertificate: 'Provide certificate of origin for verification',
    },
    FX_APPLICATION_PENDING: {
      fxApplication: 'FX application submitted to NBE for approval',
    },
    CUSTOMS_PENDING: {
      customsDeclaration: 'Upload customs declaration for export clearance',
    },
  };

  return instructions[stage] || {};
}

/**
 * Export all functions for use in controllers
 */
export const documentTrackingService = {
  getDocumentChecklist,
  getStageRequirements,
  getDocumentCompletionPercentage,
  getDocumentStatusForStage,
  canProceedToNextStage,
  getNextRequiredAction,
  getDocumentUploadInstructions,
};

export default documentTrackingService;
