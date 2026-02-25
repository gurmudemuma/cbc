/**
 * ECTA Pre-Registration Models
 * Based on Ethiopian Coffee & Tea Authority real-world regulations
 * Directive 1106/2025 compliance
 */

export type BusinessType = 'PRIVATE' | 'TRADE_ASSOCIATION' | 'JOINT_STOCK' | 'LLC' | 'FARMER';
export type ExporterStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'PENDING_APPROVAL';
export type CertificateStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'PENDING';
export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED' | 'PENDING';

/**
 * Exporter Profile - Core business information
 */
export interface ExporterProfile {
  exporterId: string;
  userId: string; // Link to user account
  businessName: string;
  tin: string; // Tax Identification Number
  registrationNumber: string;
  businessType: BusinessType;
  
  // Capital Requirements (Directive 1106/2025)
  minimumCapital: number; // ETB
  capitalVerified: boolean;
  capitalVerificationDate?: string;
  capitalProofDocument?: string; // Bank statement CID
  
  // Contact Information
  officeAddress: string;
  city: string;
  region: string;
  contactPerson: string;
  email: string;
  phone: string;
  
  // Status
  status: ExporterStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * ECTA-Certified Coffee Laboratory
 * Mandatory for all exporters except farmer-exporters
 */
export interface CoffeeLaboratory {
  laboratoryId: string;
  exporterId: string;
  laboratoryName: string;
  address: string;
  
  // Certification
  certificationNumber: string;
  certifiedDate: string;
  expiryDate: string;
  status: CertificateStatus;
  
  // Equipment and Facilities
  equipment: string[]; // List of equipment
  hasRoastingFacility: boolean;
  hasCuppingRoom: boolean;
  hasSampleStorage: boolean;
  
  // Inspection
  lastInspectionDate?: string;
  inspectionReports: string[]; // Document CIDs
  inspectedBy?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Qualified Coffee Taster
 * Must be exclusively employed by one exporter
 */
export interface CoffeeTaster {
  tasterId: string;
  exporterId: string; // One taster per exporter
  
  // Personal Information
  fullName: string;
  dateOfBirth: string;
  nationalId: string;
  
  // Qualifications
  qualificationLevel: 'DIPLOMA' | 'DEGREE' | 'MASTER' | 'CERTIFICATE';
  qualificationDocument?: string; // CID
  
  // Proficiency Certificate
  proficiencyCertificateNumber: string;
  certificateIssueDate: string;
  certificateExpiryDate: string;
  lastRenewalDate?: string;
  
  // Employment
  employmentStartDate: string;
  employmentContract?: string; // CID
  isExclusiveEmployee: boolean; // Must be true
  
  // Status
  status: CertificateStatus;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Competence Certificate
 * Demonstrates exporter's capability to handle coffee exports
 */
export interface CompetenceCertificate {
  certificateId: string;
  exporterId: string;
  certificateNumber: string;
  
  // Validity
  issuedDate: string;
  expiryDate: string;
  status: CertificateStatus;
  
  // Requirements
  laboratoryId: string;
  tasterId: string;
  
  // Facility Inspection
  facilityInspectionDate: string;
  inspectionReport: string; // CID
  inspectedBy: string; // ECTA officer
  inspectionPassed: boolean;
  
  // Quality Management System
  hasQualityManagementSystem: boolean;
  qmsDocumentation?: string; // CID
  
  // Storage Facilities
  storageCapacity: number; // kg
  storageConditions: string;
  
  // Approval
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  
  // Renewal History
  renewalHistory: RenewalRecord[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Export License
 * Authorization to engage in coffee export activities
 */
export interface ExportLicense {
  licenseId: string;
  exporterId: string;
  licenseNumber: string;
  
  // Validity
  issuedDate: string;
  expiryDate: string;
  status: LicenseStatus;
  
  // Requirements
  competenceCertificateId: string;
  eicRegistrationNumber: string; // Ethiopian Investment Commission
  
  // Authorization
  authorizedCoffeeTypes: string[]; // e.g., ['Arabica', 'Robusta']
  authorizedOrigins: string[]; // e.g., ['Sidamo', 'Yirgacheffe']
  annualQuota?: number; // kg (if applicable)
  
  // Approval
  approvedBy: string; // ECTA officer
  approvedAt: string;
  rejectionReason?: string;
  
  // Renewal History
  renewalHistory: RenewalRecord[];
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Coffee Lot from ECX
 */
export interface CoffeeLot {
  lotId: string;
  ecxLotNumber: string;
  warehouseReceiptNumber: string;
  
  // Location
  warehouseLocation: string;
  warehouseName: string;
  
  // Coffee Details
  coffeeType: string;
  originRegion: string;
  processingMethod: 'WASHED' | 'NATURAL' | 'HONEY';
  quantity: number; // kg
  preliminaryGrade: string;
  
  // Purchase
  purchaseDate: string;
  purchasedBy: string; // exporterId
  purchasePrice: number; // ETB
  
  // Status
  status: 'IN_WAREHOUSE' | 'INSPECTED' | 'RESERVED_FOR_EXPORT' | 'EXPORTED';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Quality Inspection by ECTA
 */
export interface QualityInspection {
  inspectionId: string;
  lotId: string;
  exporterId: string;
  
  // Inspection Details
  inspectionDate: string;
  inspectionCenter: string; // 'Addis Ababa', 'Dire Dawa', etc.
  inspector: string; // ECTA inspector name
  
  // Physical Analysis
  beanSize: string; // e.g., 'Screen 15+', 'Screen 14-15'
  moistureContent: number; // percentage (optimal: 11-12%)
  defectCount: number; // per 300g sample
  primaryDefects: number;
  secondaryDefects: number;
  foreignMatter: number; // grams
  
  // Cupping Evaluation
  cuppingScore: number; // 0-100
  flavorProfile: string; // e.g., 'Floral, Citrus, Chocolate'
  aromaScore: number; // 0-10
  acidityScore: number; // 0-10
  bodyScore: number; // 0-10
  balanceScore: number; // 0-10
  cleanCupScore: number; // 0-10
  sweetnessScore: number; // 0-10
  uniformityScore: number; // 0-10
  
  // Results
  finalGrade: string; // Grade 1-9
  qualityCertificateNumber: string;
  passed: boolean;
  remarks: string;
  
  // Documents
  inspectionReport: string; // CID
  cuppingForm: string; // CID
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Sales Contract Registration with ECTA
 */
export interface SalesContract {
  contractId: string;
  exporterId: string;
  contractNumber: string;
  
  // Buyer Information
  buyerName: string;
  buyerCountry: string;
  buyerAddress: string;
  buyerEmail: string;
  buyerPhone: string;
  
  // Contract Details
  coffeeType: string;
  originRegion: string;
  quantity: number; // kg
  contractValue: number; // USD
  pricePerKg: number; // USD
  
  // Terms
  paymentTerms: string; // e.g., 'LC at sight', '30 days credit'
  incoterms: string; // e.g., 'FOB', 'CIF', 'CFR'
  deliveryDate: string;
  portOfLoading: string;
  portOfDischarge: string;
  
  // Registration
  registrationDate: string;
  approvedBy?: string; // ECTA officer
  approvedAt?: string;
  status: 'REGISTERED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  rejectionReason?: string;
  
  // Documents
  contractDocument: string; // CID
  buyerProofOfBusiness?: string; // CID
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Export Permit (Per Shipment)
 */
export interface ExportPermit {
  permitId: string;
  permitNumber: string;
  exporterId: string;
  
  // Required Pre-existing Documents
  exportLicenseId: string;
  competenceCertificateId: string;
  qualityInspectionId: string;
  salesContractId: string;
  lotId: string;
  
  // Permit Details
  issuedDate: string;
  validUntil: string;
  
  // Shipment Details
  coffeeType: string;
  quantity: number; // kg
  grade: string;
  destinationCountry: string;
  
  // Status
  status: 'ISSUED' | 'USED' | 'EXPIRED' | 'CANCELLED';
  usedDate?: string;
  
  // Approval
  issuedBy: string; // ECTA officer
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Certificate of Origin
 */
export interface CertificateOfOrigin {
  certificateId: string;
  certificateNumber: string;
  exportPermitId: string;
  exporterId: string;
  
  // Exporter Details
  exporterName: string;
  exporterAddress: string;
  
  // Buyer Details
  buyerName: string;
  buyerCountry: string;
  buyerAddress: string;
  
  // Coffee Details
  coffeeType: string;
  originRegion: string;
  quantity: number; // kg
  grade: string;
  processingMethod: string;
  
  // Issuance
  issuedDate: string;
  issuedBy: string; // ECTA officer
  
  // Documents
  certificateDocument: string; // CID
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Renewal Record for Certificates and Licenses
 */
export interface RenewalRecord {
  renewalDate: string;
  previousExpiryDate: string;
  newExpiryDate: string;
  renewedBy: string;
  notes?: string;
}

/**
 * Validation Result
 */
export interface ExporterValidation {
  isValid: boolean;
  exporterId: string;
  
  // Checks
  hasValidProfile: boolean;
  hasMinimumCapital: boolean;
  hasCertifiedLaboratory: boolean;
  hasQualifiedTaster: boolean;
  hasCompetenceCertificate: boolean;
  hasExportLicense: boolean;
  
  // Details
  profile?: ExporterProfile;
  laboratory?: CoffeeLaboratory;
  taster?: CoffeeTaster;
  competenceCertificate?: CompetenceCertificate;
  exportLicense?: ExportLicense;
  
  // Issues
  issues: string[];
  requiredActions: string[];
}

/**
 * Export Request (Modified - requires all pre-existing documents)
 */
export interface ValidatedExportRequest {
  exportId: string;
  exporterId: string;
  
  // Pre-existing Required Documents
  exportLicenseNumber: string;
  competenceCertificateNumber: string;
  laboratoryId: string;
  tasterId: string;
  ecxLotNumber: string;
  warehouseReceiptNumber: string;
  qualityCertificateNumber: string;
  qualityGrade: string;
  salesContractNumber: string;
  exportPermitNumber: string;
  originCertificateNumber: string;
  
  // Export Details
  coffeeType: string;
  originRegion: string;
  quantity: number; // kg
  destinationCountry: string;
  buyerName: string;
  estimatedValue: number; // USD
  
  // Status (starts after ECTA approvals)
  status: 'BANK_VERIFICATION' | 'FX_PENDING' | 'FX_APPROVED' | 
          'CUSTOMS_PENDING' | 'CUSTOMS_CLEARED' | 'SHIPPED' | 
          'DELIVERED' | 'PAYMENT_RECEIVED' | 'FX_REPATRIATED' | 'COMPLETED';
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
