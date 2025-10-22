/**
 * Export Request Models for Exporter Portal
 * These models define the structure of export requests created by external exporters
 */

export interface ExportRequest {
  id: string;
  requestNumber: string; // Auto-generated unique identifier
  status: ExportRequestStatus;

  // Exporter Information
  exporterId: string; // References user ID from National Bank
  exporterDetails: ExporterDetails;

  // Coffee/Trade Details
  coffeeDetails: CoffeeDetails;
  tradeDetails: TradeDetails;

  // Documents
  documents: ExportDocument[];

  // Processing Information
  submittedAt: Date;
  lastUpdated: Date;
  processedBy?: string; // Consortium member who processed
  notes?: string;

  // Blockchain Integration
  blockchainTxId?: string; // Transaction ID when submitted to consortium
  consortiumStatus?: ConsortiumStatus;
}

export enum ExportRequestStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  UNDER_REVIEW = "under_review",
  DOCUMENTS_REQUESTED = "documents_requested",
  APPROVED = "approved",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export enum ConsortiumStatus {
  // Sequential processing steps
  LICENSE_VALIDATION_PENDING = "license_validation_pending", // Step 1: National Bank
  BANKING_REVIEW_PENDING = "banking_review_pending", // Step 2: Exporter Bank
  QUALITY_CERTIFICATION_PENDING = "quality_certification_pending", // Step 3: NCAT
  LOGISTICS_ARRANGEMENT_PENDING = "logistics_arrangement_pending", // Step 4: Shipping Line
  CUSTOMS_CLEARANCE_PENDING = "customs_clearance_pending", // Step 5: Custom Authorities

  // Final states
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface ExporterDetails {
  companyName: string;
  registrationNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  contactPerson: {
    name: string;
    position: string;
    email: string;
    phone: string;
  };
  businessType: "individual" | "company" | "cooperative";
  taxId?: string;
  exportLicenseNumber?: string; // Issued by National Bank
}

export interface CoffeeDetails {
  coffeeType: "arabica" | "robusta" | "specialty" | "organic";
  grade: string;
  processingMethod: "washed" | "natural" | "honey" | "semi-washed";
  origin: {
    farm: string;
    region: string;
    altitude?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  harvestDate: Date;
  quantity: {
    bags: number;
    weightPerBag: number; // kg
    totalWeight: number; // kg
  };
  qualityCertifications?: string[]; // e.g., 'Fair Trade', 'Organic', 'Rainforest Alliance'
  cupScore?: number; // For specialty coffee
}

export interface TradeDetails {
  buyer: {
    name: string;
    company: string;
    country: string;
    email: string;
  };
  contractDetails: {
    contractNumber: string;
    contractDate: Date;
    pricePerUnit: number;
    currency: string;
    totalValue: number;
    paymentTerms: string;
    deliveryTerms: string; // Incoterms
  };
  shipping: {
    portOfLoading: string;
    portOfDischarge: string;
    expectedShippingDate: Date;
    shippingMethod: "container" | "bulk" | "bags";
  };
}

export interface ExportDocument {
  id: string;
  type: DocumentType;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  ipfsHash?: string; // IPFS storage hash
  url?: string; // Access URL
  status: DocumentStatus;
  required: boolean;
  validatedBy?: string; // Consortium member who validated
  validatedAt?: Date;
  notes?: string;
}

export enum DocumentType {
  // Required Documents
  SALES_CONTRACT = "sales_contract",
  COMMERCIAL_INVOICE = "commercial_invoice",
  PACKING_LIST = "packing_list",
  CERTIFICATE_OF_ORIGIN = "certificate_of_origin",

  // Quality Documents
  QUALITY_CERTIFICATE = "quality_certificate",
  PHYTOSANITARY_CERTIFICATE = "phytosanitary_certificate",
  CUPPING_REPORT = "cupping_report",

  // Business Documents
  EXPORT_LICENSE = "export_license",
  BUSINESS_REGISTRATION = "business_registration",
  TAX_CLEARANCE = "tax_clearance",

  // Additional Documents
  INSURANCE_CERTIFICATE = "insurance_certificate",
  WAREHOUSE_RECEIPT = "warehouse_receipt",
  TRANSPORT_DOCUMENT = "transport_document",
  OTHER = "other",
}

export enum DocumentStatus {
  UPLOADED = "uploaded",
  PENDING_VALIDATION = "pending_validation",
  VALIDATED = "validated",
  REJECTED = "rejected",
  MISSING = "missing",
}

// Request DTOs for API endpoints
export interface CreateExportRequestDTO {
  exporterDetails: ExporterDetails;
  coffeeDetails: CoffeeDetails;
  tradeDetails: TradeDetails;
  documents?: File[]; // For file uploads
}

export interface UpdateExportRequestDTO {
  exporterDetails?: Partial<ExporterDetails>;
  coffeeDetails?: Partial<CoffeeDetails>;
  tradeDetails?: Partial<TradeDetails>;
  notes?: string;
}

export interface SubmitExportRequestDTO {
  requestId: string;
  finalNotes?: string;
}

// Response DTOs
export interface ExportRequestListResponse {
  requests: ExportRequest[];
  total: number;
  page: number;
  limit: number;
}

export interface ExportRequestDetailResponse {
  request: ExportRequest;
  availableActions: string[]; // Actions user can take
  validationErrors?: string[];
}

// Validation schemas for required documents by coffee type and destination
export interface DocumentRequirements {
  coffeeType: string;
  destinationCountry: string;
  requiredDocuments: DocumentType[];
  optionalDocuments: DocumentType[];
}

export const DEFAULT_DOCUMENT_REQUIREMENTS: DocumentRequirements = {
  coffeeType: "all",
  destinationCountry: "all",
  requiredDocuments: [
    DocumentType.SALES_CONTRACT,
    DocumentType.COMMERCIAL_INVOICE,
    DocumentType.PACKING_LIST,
    DocumentType.CERTIFICATE_OF_ORIGIN,
    DocumentType.EXPORT_LICENSE,
  ],
  optionalDocuments: [
    DocumentType.QUALITY_CERTIFICATE,
    DocumentType.INSURANCE_CERTIFICATE,
    DocumentType.CUPPING_REPORT,
  ],
};
