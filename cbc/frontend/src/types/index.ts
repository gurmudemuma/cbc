/**
 * Global Type Definitions for CBC Frontend
 */

// User and Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  organizationId: string;
  organization?: string;
  role: string;
  permissions?: string[];
}

// Common Component Props
export interface CommonPageProps {
  user: User | null;
  org: string | null;
}

// Export Types
export interface Export {
  exportId: string;
  id?: string;
  exporterTin?: string; // Standardized TIN
  exporter_tin?: string; // Raw DB column
  status: string;
  coffeeType: string;
  quantity: number;
  estimatedValue: number;
  exporterName: string;
  destinationCountry: string;
  updatedAt: string;           // Required field
  createdAt?: string;          // Optional field
  vesselName?: string;         // Added
  rejectionReason?: string;    // Added
  transportIdentifier?: string; // Added from usage
  departureDate?: string;      // Added from usage
  arrivalDate?: string;        // Added from usage
  fxApprovedBy?: string;
  bankingApprovedBy?: string;
  qualityCertifiedBy?: string;
  exportCustomsClearedBy?: string;
  originCertificateNumber?: string;
  originCertificateIssuedBy?: string;
  originCertificateDate?: string;
  [key: string]: any;
}

// Form Data Types
export interface CustomsClearanceFormData {
  declarationNumber?: string;
  inspectionNotes?: string;
  dutyPaid?: string | number;
  taxPaid?: string | number;
  documents?: any[];
  [key: string]: any;
}

export interface ECTAContractFormData {
  contractNumber?: string;
  originCertNumber?: string;
  originCertificateNumber?: string;
  buyerName?: string;
  buyerCountry?: string;
  paymentTerms?: string;
  buyerVerified?: boolean;
  notes?: string;
  [key: string]: any;
}

export interface ECTAQualityFormData {
  qualityGrade?: string;
  qualityCertNumber?: string;
  moistureContent?: string | number;
  defectCount?: string | number;
  cupScore?: string | number;
  inspectionNotes?: string;
  documents?: any[];
  [key: string]: any;
}

export interface ECXApprovalFormData {
  lotNumber?: string;
  warehouseReceiptNumber?: string;
  warehouseLocation?: string;
  notes?: string;
  verificationNotes?: string;
  ecxLotNumber?: string;
  [key: string]: any;
}

export interface NBEFXApprovalFormData {
  approvedFXAmount?: string | number;
  fxRate?: string | number;
  fxAllocationNumber?: string;
  approvalNotes?: string;
  fxApprovalId?: string;
  [key: string]: any;
}

export interface ShipmentScheduleFormData {
  transportMode?: string;
  transportIdentifier?: string;
  departureDate?: string;
  estimatedArrivalDate?: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  notes?: string;
  [key: string]: any;
}

export interface ECTALicenseFormData {
  validatedLicenseNumber?: string;
  licenseExpiryDate?: string;
  exporterTIN?: string;
  validationNotes?: string;
  licenseNumber?: string;
  validUntil?: string;
  notes?: string;
  [key: string]: any;
}

// Notification Types
export interface Notification {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  autoHideDuration?: number;
  [key: string]: any;
}

// Theme Types
export interface ThemeContextType {
  mode: 'light' | 'dark';
  org: string | null;
  toggleColorMode: () => void;
  setOrganization: (org: string) => void;
}

// Detail Modal State
export interface DetailModalState {
  open: boolean;
  exportId: any;
  exportData: any;
  stage: string;
}

// Validation Result
export interface ValidationResult {
  valid: boolean;
  issues?: string[];
  requiredActions?: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalExports: number;
  pendingCertifications: number;
  activeShipments: number;
  currentFXRate: number;
  completedExports: number;
  totalValue: number;
}

// Blockchain Metrics
export interface BlockchainMetrics {
  totalTransactions: number;
  blockHeight: number;
  averageBlockTime: number;
  networkStatus: 'healthy' | 'degraded' | 'offline';
}

// Workflow Stage Data
export interface WorkflowStageData {
  stage: string;
  count: number;
  percentage: number;
  organization: string;
  actors: string[];
  actorsCount: number;
}

// Rejection Reasons
export interface RejectionReasons {
  [key: string]: string[];
}

// Document Type
export interface Document {
  id?: string;
  name: string;
  type: string;
  url?: string;
  cid?: string;
  required?: boolean;
  uploaded?: boolean;
  verified?: boolean;
  [key: string]: any;
}

// Stat Card Props
export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  trend: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  subtitle: string;
}

// Accessibility Settings
export interface AccessibilitySettings {
  highContrast?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  reduceMotion?: boolean;
  [key: string]: any;
}

// Dashboard Layout
export interface DashboardLayout {
  id: string;
  name: string;
  widgets: string[];
  [key: string]: any;
}
