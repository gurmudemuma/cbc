/**
 * ESW (Electronic Single Window) Models
 * Based on Ethiopian Electronic Single Window system
 */

export interface ESWSubmission {
    submissionId: string;
    exportId: string;
    eswReferenceNumber: string;
    submittedBy: string;
    submittedAt: Date;
    status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'INFO_REQUIRED' | 'CANCELLED';
    approvedAt?: Date;
    approvedBy?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
    additionalInfoRequest?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ESWAgencyApproval {
    approvalId: string;
    submissionId: string;
    agencyName: string;
    agencyCode: string;
    agencyType: 'REGULATORY' | 'CUSTOMS' | 'BANKING' | 'HEALTH' | 'AGRICULTURE' | 'TRADE' | 'TRANSPORT' | 'OTHER';
    status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'INFO_REQUIRED' | 'NOT_APPLICABLE';
    approvedBy?: string;
    approvedAt?: Date;
    rejectionReason?: string;
    additionalInfoRequest?: string;
    responseDeadline?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ExportDocument {
    documentId: string;
    exportId: string;
    documentType: DocumentType;
    documentNumber?: string;
    documentName: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    uploadedBy: string;
    uploadedAt: Date;
    verifiedBy?: string;
    verifiedAt?: Date;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
    rejectionReason?: string;
    expiryDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type DocumentType =
    | 'EXPORT_DECLARATION'
    | 'COMMERCIAL_INVOICE'
    | 'PACKING_LIST'
    | 'BILL_OF_LADING'
    | 'CERTIFICATE_OF_ORIGIN'
    | 'QUALITY_CERTIFICATE'
    | 'EXPORT_LICENSE'
    | 'SALES_CONTRACT'
    | 'PROFORMA_INVOICE'
    | 'PHYTOSANITARY_CERTIFICATE'
    | 'HEALTH_CERTIFICATE'
    | 'FUMIGATION_CERTIFICATE'
    | 'INSURANCE_CERTIFICATE'
    | 'WEIGHT_CERTIFICATE'
    | 'OTHER';

export interface ExportCertificate {
    certificateId: string;
    exportId: string;
    certificateType: CertificateType;
    certificateNumber: string;
    issuedBy: string;
    issuingAuthority?: string;
    issuedAt: Date;
    expiryDate?: Date;
    documentUrl?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CertificateType =
    | 'PHYTOSANITARY'
    | 'HEALTH'
    | 'FUMIGATION'
    | 'ORGANIC'
    | 'FAIR_TRADE'
    | 'RAINFOREST_ALLIANCE'
    | 'UTZ'
    | 'OTHER';

export interface ESWAgency {
    agencyId: string;
    agencyCode: string;
    agencyName: string;
    agencyNameAmharic?: string;
    agencyType: string;
    contactEmail?: string;
    contactPhone?: string;
    websiteUrl?: string;
    isActive: boolean;
    isMandatory: boolean;
    typicalProcessingDays?: number;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ESWSubmissionRequest {
    exportId: string;
    documents: {
        documentType: DocumentType;
        documentNumber?: string;
        fileUrl: string;
        fileName: string;
    }[];
    certificates?: {
        certificateType: CertificateType;
        certificateNumber: string;
        documentUrl: string;
    }[];
    notes?: string;
}

export interface ESWAgencyApprovalRequest {
    submissionId: string;
    agencyCode: string;
    status: 'APPROVED' | 'REJECTED' | 'INFO_REQUIRED';
    rejectionReason?: string;
    additionalInfoRequest?: string;
    notes?: string;
}

export interface ESWSubmissionSummary extends ESWSubmission {
    export: {
        exportId: string;
        exporterName: string;
        destinationCountry: string;
        coffeeType: string;
        quantity: number;
    };
    agencyApprovals: ESWAgencyApproval[];
    documents: ExportDocument[];
    certificates: ExportCertificate[];
    pendingAgencies: string[];
    approvedAgencies: string[];
    rejectedAgencies: string[];
}

