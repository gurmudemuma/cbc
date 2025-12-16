/**
 * Shared TypeScript Type Definitions
 * Central location for all domain types used across the frontend
 */

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
    id: string;
    username: string;
    email: string;
    role: UserRole;
    organization: string;
    organizationId: string;
    permissions?: string[];
    createdAt?: string;
    updatedAt?: string;
}

export type UserRole =
    | 'exporter'
    | 'commercial_bank'
    | 'nbe'
    | 'ecta'
    | 'ecx'
    | 'shipping_line'
    | 'customs'
    | 'admin';

export interface Organization {
    id: string;
    name: string;
    type: OrganizationType;
    email?: string;
    phone?: string;
    address?: string;
    registrationNumber?: string;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
}

export type OrganizationType =
    | 'exporter'
    | 'bank'
    | 'government'
    | 'shipping'
    | 'customs';

// ============================================================================
// Export Types
// ============================================================================

export interface ExportData {
    exportId: string;
    exportID?: string; // Alias for compatibility
    exporterId: string;
    coffeeType: string;
    quantity: number;
    quantityUnit?: string;
    destinationCountry: string;
    estimatedValue: number;
    currency?: string;
    status: ExportStatus;
    currentStage?: string;
    createdAt: string;
    updatedAt?: string;

    // Optional fields for detailed view
    lotNumber?: string;
    contractNumber?: string;
    licenseNumber?: string;

    // Dates
    ectaApprovedAt?: string | null;
    ecxApprovedAt?: string | null;
    fxApprovedAt?: string | null;
    qualityCertifiedAt?: string | null;
    customsClearedAt?: string | null;
    departureDate?: string | null;
    arrivalDate?: string | null;

    // Quality metrics
    qualityGrade?: string;
    moistureContent?: number;
    defectCount?: number;

    // Documents
    documents?: Document[];
    documentCIDs?: string[];

    // Workflow
    workflowStage?: string;
    rejectionReason?: string;

    // Banking
    bankApprovalStatus?: string;
    fxRate?: number;

    // Shipping
    shipmentId?: string;
    vesselName?: string;
    containerNumber?: string;
}

export type ExportStatus =
    | 'DRAFT'
    | 'PENDING_ECTA_LICENSE'
    | 'PENDING_ECTA_CONTRACT'
    | 'PENDING_ECX_APPROVAL'
    | 'PENDING_QUALITY'
    | 'PENDING_FX_APPROVAL'
    | 'PENDING_CUSTOMS'
    | 'PENDING_SHIPMENT'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'COMPLETED'
    | 'REJECTED'
    | 'CANCELLED';

// ============================================================================
// Document Types
// ============================================================================

export interface Document {
    id: string;
    name: string;
    type: DocumentType;
    cid?: string;
    ipfsHash?: string;
    uploadedAt: string;
    uploadedBy: string;
    size?: number;
    mimeType?: string;
    verified?: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
}

export type DocumentType =
    | 'license'
    | 'contract'
    | 'quality_certificate'
    | 'invoice'
    | 'packing_list'
    | 'bill_of_lading'
    | 'certificate_of_origin'
    | 'customs_declaration'
    | 'other';

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: ApiError;
    timestamp?: string;
    path?: string;
}

export interface ApiError {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// ============================================================================
// Form Types
// ============================================================================

export interface LoginFormData {
    username: string;
    password: string;
}

export interface ExportFormData {
    coffeeType: string;
    quantity: number;
    quantityUnit: string;
    destinationCountry: string;
    estimatedValue: number;
    currency: string;
    lotNumber?: string;
}

export interface QualityFormData {
    qualityGrade: string;
    moistureContent: number;
    defectCount: number;
    cupping_score?: number;
    screen_size?: string;
    notes?: string;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    link?: string;
    data?: any;
}

export type NotificationType =
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'export_update'
    | 'approval_required'
    | 'document_uploaded';

// ============================================================================
// Workflow Types
// ============================================================================

export interface WorkflowStage {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'rejected';
    completedAt?: string;
    completedBy?: string;
    notes?: string;
}

export interface WorkflowProgress {
    currentStage: string;
    stages: WorkflowStage[];
    percentComplete: number;
}

// ============================================================================
// Shipment Types
// ============================================================================

export interface Shipment {
    id: string;
    exportId: string;
    vesselName: string;
    containerNumber: string;
    departurePort: string;
    arrivalPort: string;
    departureDate: string;
    estimatedArrivalDate: string;
    actualArrivalDate?: string;
    status: ShipmentStatus;
    trackingUpdates?: TrackingUpdate[];
}

export type ShipmentStatus =
    | 'scheduled'
    | 'in_transit'
    | 'arrived'
    | 'customs_clearance'
    | 'delivered'
    | 'delayed';

export interface TrackingUpdate {
    timestamp: string;
    location: string;
    status: string;
    notes?: string;
}

// ============================================================================
// License & Contract Types
// ============================================================================

export interface License {
    id: string;
    licenseNumber: string;
    exporterId: string;
    issueDate: string;
    expiryDate: string;
    status: 'active' | 'expired' | 'revoked';
    coffeeType: string;
    maxQuantity: number;
}

export interface Contract {
    id: string;
    contractNumber: string;
    exporterId: string;
    buyerId: string;
    coffeeType: string;
    quantity: number;
    pricePerUnit: number;
    totalValue: number;
    currency: string;
    deliveryTerms: string;
    signedDate?: string;
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed';
}

// ============================================================================
// Type Guards
// ============================================================================

export function isUser(obj: any): obj is User {
    return obj && typeof obj.id === 'string' && typeof obj.role === 'string';
}

export function isExportData(obj: any): obj is ExportData {
    return obj && typeof obj.exportId === 'string' && typeof obj.status === 'string';
}

export function isApiResponse<T>(obj: any): obj is ApiResponse<T> {
    return obj && typeof obj.success === 'boolean';
}
