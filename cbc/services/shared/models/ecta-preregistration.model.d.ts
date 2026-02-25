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
    userId: string;
    businessName: string;
    tin: string;
    registrationNumber: string;
    businessType: BusinessType;
    minimumCapital: number;
    capitalVerified: boolean;
    capitalVerificationDate?: string;
    capitalProofDocument?: string;
    officeAddress: string;
    city: string;
    region: string;
    contactPerson: string;
    email: string;
    phone: string;
    status: ExporterStatus;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
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
    certificationNumber: string;
    certifiedDate: string;
    expiryDate: string;
    status: CertificateStatus;
    equipment: string[];
    hasRoastingFacility: boolean;
    hasCuppingRoom: boolean;
    hasSampleStorage: boolean;
    lastInspectionDate?: string;
    inspectionReports: string[];
    inspectedBy?: string;
    createdAt: string;
    updatedAt: string;
}
/**
 * Qualified Coffee Taster
 * Must be exclusively employed by one exporter
 */
export interface CoffeeTaster {
    tasterId: string;
    exporterId: string;
    fullName: string;
    dateOfBirth: string;
    nationalId: string;
    qualificationLevel: 'DIPLOMA' | 'DEGREE' | 'MASTER' | 'CERTIFICATE';
    qualificationDocument?: string;
    proficiencyCertificateNumber: string;
    certificateIssueDate: string;
    certificateExpiryDate: string;
    lastRenewalDate?: string;
    employmentStartDate: string;
    employmentContract?: string;
    isExclusiveEmployee: boolean;
    status: CertificateStatus;
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
    issuedDate: string;
    expiryDate: string;
    status: CertificateStatus;
    laboratoryId: string;
    tasterId: string;
    facilityInspectionDate: string;
    inspectionReport: string;
    inspectedBy: string;
    inspectionPassed: boolean;
    hasQualityManagementSystem: boolean;
    qmsDocumentation?: string;
    storageCapacity: number;
    storageConditions: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    renewalHistory: RenewalRecord[];
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
    issuedDate: string;
    expiryDate: string;
    status: LicenseStatus;
    competenceCertificateId: string;
    eicRegistrationNumber: string;
    authorizedCoffeeTypes: string[];
    authorizedOrigins: string[];
    annualQuota?: number;
    approvedBy: string;
    approvedAt: string;
    rejectionReason?: string;
    renewalHistory: RenewalRecord[];
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
    warehouseLocation: string;
    warehouseName: string;
    coffeeType: string;
    originRegion: string;
    processingMethod: 'WASHED' | 'NATURAL' | 'HONEY';
    quantity: number;
    preliminaryGrade: string;
    purchaseDate: string;
    purchasedBy: string;
    purchasePrice: number;
    status: 'IN_WAREHOUSE' | 'INSPECTED' | 'RESERVED_FOR_EXPORT' | 'EXPORTED';
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
    inspectionDate: string;
    inspectionCenter: string;
    inspector: string;
    beanSize: string;
    moistureContent: number;
    defectCount: number;
    primaryDefects: number;
    secondaryDefects: number;
    foreignMatter: number;
    cuppingScore: number;
    flavorProfile: string;
    aromaScore: number;
    acidityScore: number;
    bodyScore: number;
    balanceScore: number;
    cleanCupScore: number;
    sweetnessScore: number;
    uniformityScore: number;
    finalGrade: string;
    qualityCertificateNumber: string;
    passed: boolean;
    remarks: string;
    inspectionReport: string;
    cuppingForm: string;
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
    buyerName: string;
    buyerCountry: string;
    buyerAddress: string;
    buyerEmail: string;
    buyerPhone: string;
    coffeeType: string;
    originRegion: string;
    quantity: number;
    contractValue: number;
    pricePerKg: number;
    paymentTerms: string;
    incoterms: string;
    deliveryDate: string;
    portOfLoading: string;
    portOfDischarge: string;
    registrationDate: string;
    approvedBy?: string;
    approvedAt?: string;
    status: 'REGISTERED' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
    rejectionReason?: string;
    contractDocument: string;
    buyerProofOfBusiness?: string;
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
    exportLicenseId: string;
    competenceCertificateId: string;
    qualityInspectionId: string;
    salesContractId: string;
    lotId: string;
    issuedDate: string;
    validUntil: string;
    coffeeType: string;
    quantity: number;
    grade: string;
    destinationCountry: string;
    status: 'ISSUED' | 'USED' | 'EXPIRED' | 'CANCELLED';
    usedDate?: string;
    issuedBy: string;
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
    exporterName: string;
    exporterAddress: string;
    buyerName: string;
    buyerCountry: string;
    buyerAddress: string;
    coffeeType: string;
    originRegion: string;
    quantity: number;
    grade: string;
    processingMethod: string;
    issuedDate: string;
    issuedBy: string;
    certificateDocument: string;
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
    hasValidProfile: boolean;
    hasMinimumCapital: boolean;
    hasCertifiedLaboratory: boolean;
    hasQualifiedTaster: boolean;
    hasCompetenceCertificate: boolean;
    hasExportLicense: boolean;
    profile?: ExporterProfile;
    laboratory?: CoffeeLaboratory;
    taster?: CoffeeTaster;
    competenceCertificate?: CompetenceCertificate;
    exportLicense?: ExportLicense;
    issues: string[];
    requiredActions: string[];
}
/**
 * Export Request (Modified - requires all pre-existing documents)
 */
export interface ValidatedExportRequest {
    exportId: string;
    exporterId: string;
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
    coffeeType: string;
    originRegion: string;
    quantity: number;
    destinationCountry: string;
    buyerName: string;
    estimatedValue: number;
    status: 'BANK_VERIFICATION' | 'FX_PENDING' | 'FX_APPROVED' | 'CUSTOMS_PENDING' | 'CUSTOMS_CLEARED' | 'SHIPPED' | 'DELIVERED' | 'PAYMENT_RECEIVED' | 'FX_REPATRIATED' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=ecta-preregistration.model.d.ts.map