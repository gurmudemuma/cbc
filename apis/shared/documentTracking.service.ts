/**
 * Document Tracking Service
 * Tracks document upload status and completeness for export requests
 */

import { ExportRequest } from './exportService';

export interface DocumentStatus {
  required: boolean;
  uploaded: boolean;
  cid?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface DocumentChecklist {
  // Exporter Documents (Initial Submission)
  exportLicense: DocumentStatus;
  commercialInvoice: DocumentStatus;
  salesContract: DocumentStatus;
  packingList: DocumentStatus;

  // ECX Documents
  ecxLotVerification: DocumentStatus;
  warehouseReceipt: DocumentStatus;

  // ECTA Documents
  ectaLicenseApproval: DocumentStatus;
  qualityCertificate: DocumentStatus;
  originCertificate: DocumentStatus;
  contractApproval: DocumentStatus;

  // Bank Documents
  bankDocumentVerification: DocumentStatus;
  letterOfCredit: DocumentStatus;

  // NBE Documents
  fxApproval: DocumentStatus;

  // Customs Documents
  customsDeclaration: DocumentStatus;
  customsClearance: DocumentStatus;

  // Shipping Documents
  billOfLading: DocumentStatus;
  shippingInvoice: DocumentStatus;
}

export interface StageRequirements {
  stage: string;
  requiredDocuments: string[];
  optionalDocuments: string[];
  allDocumentsUploaded: boolean;
  missingDocuments: string[];
  canProceed: boolean;
}

/**
 * Get document checklist for an export request
 */
export function getDocumentChecklist(exportRequest: ExportRequest): DocumentChecklist {
  const req = exportRequest as any;

  return {
    // Exporter Documents
    exportLicense: {
      required: true,
      uploaded: !!exportRequest.exportLicenseNumber,
      verified: !!req.exportLicenseValidatedBy || false,
      verifiedBy: req.exportLicenseValidatedBy || undefined,
      verifiedAt: req.exportLicenseValidatedAt || undefined,
    },
    commercialInvoice: {
      required: true,
      uploaded: !!req.commercialInvoice,
      verified: false,
    },
    salesContract: {
      required: true,
      uploaded: !!req.salesContract,
      verified: false,
    },
    packingList: {
      required: false,
      uploaded: !!req.packingList,
      verified: false,
    },

    // ECX Documents
    ecxLotVerification: {
      required: true,
      uploaded: !!req.ecxLotNumber,
      verified: !!req.ecxVerifiedBy || false,
      verifiedBy: req.ecxVerifiedBy || undefined,
      verifiedAt: req.ecxVerifiedAt || undefined,
    },
    warehouseReceipt: {
      required: true,
      uploaded: !!req.warehouseReceiptNumber,
      verified: !!req.ecxVerifiedBy || false,
      verifiedBy: req.ecxVerifiedBy || undefined,
      verifiedAt: req.ecxVerifiedAt || undefined,
    },

    // ECTA Documents
    ectaLicenseApproval: {
      required: true,
      uploaded: !!req.exportLicenseValidatedBy,
      verified: !!req.exportLicenseValidatedBy || false,
      verifiedBy: req.exportLicenseValidatedBy || undefined,
      verifiedAt: req.exportLicenseValidatedAt || undefined,
    },
    qualityCertificate: {
      required: true,
      uploaded: !!(exportRequest.qualityDocuments && exportRequest.qualityDocuments.length > 0),
      verified: !!exportRequest.qualityGrade || false,
    },
    originCertificate: {
      required: true,
      uploaded: !!req.originCertificateNumber,
      verified: !!req.originCertificateIssuedBy || false,
      verifiedBy: req.originCertificateIssuedBy || undefined,
      verifiedAt: req.originCertificateDate || undefined,
    },
    contractApproval: {
      required: true,
      uploaded: !!req.contractApprovedBy,
      verified: !!req.contractApprovedBy || false,
      verifiedBy: req.contractApprovedBy || undefined,
      verifiedAt: req.contractApprovedAt || undefined,
    },

    // Bank Documents
    bankDocumentVerification: {
      required: true,
      uploaded: !!req.bankDocumentVerifiedBy,
      verified: !!req.bankDocumentVerifiedBy || false,
      verifiedBy: req.bankDocumentVerifiedBy || undefined,
      verifiedAt: req.bankDocumentVerifiedAt || undefined,
    },
    letterOfCredit: {
      required: false,
      uploaded: !!req.letterOfCredit,
      verified: false,
    },

    // NBE Documents
    fxApproval: {
      required: true,
      uploaded: !!(exportRequest.fxDocuments && exportRequest.fxDocuments.length > 0),
      verified: !!req.fxApprovedBy || false,
      verifiedBy: req.fxApprovedBy || undefined,
      verifiedAt: req.fxApprovedAt || undefined,
    },

    // Customs Documents
    customsDeclaration: {
      required: true,
      uploaded: !!exportRequest.exportCustomsDeclarationNumber,
      verified: !!req.exportCustomsClearedBy || false,
      verifiedBy: req.exportCustomsClearedBy || undefined,
      verifiedAt: req.exportCustomsClearedAt || undefined,
    },
    customsClearance: {
      required: true,
      uploaded: !!(
        exportRequest.exportCustomsDocuments && exportRequest.exportCustomsDocuments.length > 0
      ),
      cid: exportRequest.exportCustomsDocuments?.[0]?.cid,
      verified: !!exportRequest.exportCustomsClearedBy || false,
      verifiedBy: exportRequest.exportCustomsClearedBy || undefined,
      verifiedAt: exportRequest.exportCustomsClearedAt || undefined,
    },

    // Shipping Documents
    billOfLading: {
      required: true,
      uploaded: !!(exportRequest.shipmentDocuments && exportRequest.shipmentDocuments.length > 0),
      cid: exportRequest.shipmentDocuments?.[0]?.cid,
      verified: !!exportRequest.shippingLineId,
    },
    shippingInvoice: {
      required: true,
      uploaded: !!(exportRequest.shipmentDocuments && exportRequest.shipmentDocuments.length > 1),
      cid: exportRequest.shipmentDocuments?.[1]?.cid,
      verified: !!exportRequest.shippingLineId,
    },
  };
}

/**
 * Get stage-specific document requirements
 */
export function getStageRequirements(
  exportRequest: ExportRequest,
  stage: string
): StageRequirements {
  const checklist = getDocumentChecklist(exportRequest);

  const stageRequirements: Record<string, { required: string[]; optional: string[] }> = {
    DRAFT: {
      required: ['exportLicense', 'commercialInvoice', 'salesContract'],
      optional: ['packingList'],
    },
    ECX_PENDING: {
      required: ['exportLicense', 'ecxLotVerification', 'warehouseReceipt'],
      optional: [],
    },
    ECTA_LICENSE_PENDING: {
      required: ['exportLicense', 'ecxLotVerification'],
      optional: [],
    },
    ECTA_QUALITY_PENDING: {
      required: ['ectaLicenseApproval'],
      optional: [],
    },
    ECTA_CONTRACT_PENDING: {
      required: ['ectaLicenseApproval', 'qualityCertificate'],
      optional: [],
    },
    BANK_DOCUMENT_PENDING: {
      required: [
        'ectaLicenseApproval',
        'qualityCertificate',
        'originCertificate',
        'contractApproval',
        'commercialInvoice',
        'salesContract',
      ],
      optional: ['letterOfCredit'],
    },
    FX_APPLICATION_PENDING: {
      required: ['bankDocumentVerification'],
      optional: [],
    },
    CUSTOMS_PENDING: {
      required: ['fxApproval', 'customsDeclaration'],
      optional: [],
    },
    SHIPMENT_SCHEDULED: {
      required: ['customsClearance', 'billOfLading'],
      optional: ['shippingInvoice'],
    },
  };

  const requirements = stageRequirements[stage] || { required: [], optional: [] };
  const requiredDocs = requirements.required;
  const optionalDocs = requirements.optional;

  const missingDocuments: string[] = [];

  requiredDocs.forEach((docKey) => {
    const doc = checklist[docKey as keyof DocumentChecklist];
    if (!doc.uploaded) {
      missingDocuments.push(docKey);
    }
  });

  return {
    stage,
    requiredDocuments: requiredDocs,
    optionalDocuments: optionalDocs,
    allDocumentsUploaded: missingDocuments.length === 0,
    missingDocuments,
    canProceed: missingDocuments.length === 0,
  };
}

/**
 * Get overall document completion percentage
 */
export function getDocumentCompletionPercentage(exportRequest: ExportRequest): number {
  const checklist = getDocumentChecklist(exportRequest);
  const allDocs = Object.values(checklist);
  const requiredDocs = allDocs.filter((doc) => doc.required);
  const uploadedRequiredDocs = requiredDocs.filter((doc) => doc.uploaded);

  if (requiredDocs.length === 0) return 0;

  return Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100);
}

/**
 * Get missing documents for current stage
 */
export function getMissingDocuments(exportRequest: ExportRequest): string[] {
  const stage = exportRequest.status;
  const requirements = getStageRequirements(exportRequest, stage);
  return requirements.missingDocuments;
}

/**
 * Check if export can proceed to next stage
 */
export function canProceedToNextStage(exportRequest: ExportRequest): {
  canProceed: boolean;
  reason?: string;
  missingDocuments?: string[];
} {
  const stage = exportRequest.status;
  const requirements = getStageRequirements(exportRequest, stage);

  if (!requirements.allDocumentsUploaded) {
    return {
      canProceed: false,
      reason: 'Missing required documents',
      missingDocuments: requirements.missingDocuments,
    };
  }

  return {
    canProceed: true,
  };
}
