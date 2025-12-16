// Shared TypeScript type definitions for Coffee Export Consortium
// UPDATED: Aligned with corrected Ethiopian coffee export workflow

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
  commercialbankId: string;
  exporterName: string;
  coffeeType: string;
  quantity: number; // in kg
  destinationCountry: string;
  estimatedValue: number; // in USD
  status: ExportStatus;
  createdAt: string;
  updatedAt: string;

  // NBE (National Bank of Ethiopia) fields
  fxApprovalId?: string;
  fxApprovedBy?: string;
  fxApprovedAt?: string;
  fxRejectionReason?: string;

  // ECTA (Ethiopian Coffee & Tea Authority) fields
  qualityCertId?: string;
  qualityGrade?: string;
  qualityCertifiedBy?: string;
  qualityCertifiedAt?: string;
  qualityRejectionReason?: string;

  // Shipping Line fields
  shipmentId?: string;
  vesselName?: string;
  departureDate?: string;
  arrivalDate?: string;
  shippingLineId?: string;
  shippedAt?: string;
}

export interface HistoryQueryResult {
  record: ExportRequest | null;
  txId: string;
  timestamp: string;
  isDelete: boolean;
}

export interface User {
  userId: string;
  username: string;
  email: string;
  organization: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  userId: string;
  username: string;
  organization: string;
  role: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WebSocketEvent {
  event: string;
  data: any;
  timestamp: string;
}

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  exportId?: string;
  timestamp: string;
}

// Role-Based Access Control Types
export enum OrganizationRole {
  EXPORTER_PORTAL = 'exporter-portal',
  ECX = 'ecx',
  ECTA = 'ecta',
  COMMERCIAL_BANK = 'commercial-bank',
  NATIONAL_BANK = 'national-bank',
  CUSTOMS = 'custom-authorities',
  SHIPPING_LINE = 'shipping-line',
}

export enum ExportAction {
  // Exporter Portal Actions
  CREATE_EXPORT = 'CREATE_EXPORT',
  UPLOAD_DOCUMENTS = 'UPLOAD_DOCUMENTS',
  VIEW_OWN_EXPORT = 'VIEW_OWN_EXPORT',

  // ECX Actions
  VERIFY_LOT = 'VERIFY_LOT',
  APPROVE_LOT = 'APPROVE_LOT',
  REJECT_LOT = 'REJECT_LOT',

  // ECTA Actions
  ISSUE_LICENSE = 'ISSUE_LICENSE',
  APPROVE_LICENSE = 'APPROVE_LICENSE',
  REJECT_LICENSE = 'REJECT_LICENSE',
  CONDUCT_QUALITY_INSPECTION = 'CONDUCT_QUALITY_INSPECTION',
  ISSUE_QUALITY_CERTIFICATE = 'ISSUE_QUALITY_CERTIFICATE',
  APPROVE_QUALITY = 'APPROVE_QUALITY',
  REJECT_QUALITY = 'REJECT_QUALITY',
  APPROVE_CONTRACT = 'APPROVE_CONTRACT',
  REJECT_CONTRACT = 'REJECT_CONTRACT',

  // Commercial Bank Actions
  VERIFY_DOCUMENTS = 'VERIFY_DOCUMENTS',
  SUBMIT_FX_REQUEST = 'SUBMIT_FX_REQUEST',

  // National Bank Actions
  APPROVE_FX = 'APPROVE_FX',
  REJECT_FX = 'REJECT_FX',
  SET_FX_RATE = 'SET_FX_RATE',

  // Customs Actions
  REVIEW_CLEARANCE = 'REVIEW_CLEARANCE',
  APPROVE_CUSTOMS = 'APPROVE_CUSTOMS',
  REJECT_CUSTOMS = 'REJECT_CUSTOMS',

  // Shipping Line Actions
  SCHEDULE_SHIPMENT = 'SCHEDULE_SHIPMENT',
  SHIP_EXPORT = 'SHIP_EXPORT',
  CONFIRM_DELIVERY = 'CONFIRM_DELIVERY',

  // Common Actions
  VIEW_ALL_EXPORTS = 'VIEW_ALL_EXPORTS',
}

// Permission matrix mapping organizations to their allowed actions
export const ROLE_PERMISSIONS: Record<OrganizationRole, ExportAction[]> = {
  [OrganizationRole.EXPORTER_PORTAL]: [
    ExportAction.CREATE_EXPORT,
    ExportAction.UPLOAD_DOCUMENTS,
    ExportAction.VIEW_OWN_EXPORT,
  ],

  [OrganizationRole.ECX]: [
    ExportAction.VERIFY_LOT,
    ExportAction.APPROVE_LOT,
    ExportAction.REJECT_LOT,
    ExportAction.VIEW_ALL_EXPORTS,
  ],

  [OrganizationRole.ECTA]: [
    ExportAction.ISSUE_LICENSE,
    ExportAction.APPROVE_LICENSE,
    ExportAction.REJECT_LICENSE,
    ExportAction.CONDUCT_QUALITY_INSPECTION,
    ExportAction.ISSUE_QUALITY_CERTIFICATE,
    ExportAction.APPROVE_QUALITY,
    ExportAction.REJECT_QUALITY,
    ExportAction.APPROVE_CONTRACT,
    ExportAction.REJECT_CONTRACT,
    ExportAction.VIEW_ALL_EXPORTS,
  ],

  [OrganizationRole.COMMERCIAL_BANK]: [
    ExportAction.VERIFY_DOCUMENTS,
    ExportAction.SUBMIT_FX_REQUEST,
    ExportAction.VIEW_ALL_EXPORTS,
    ExportAction.CREATE_EXPORT, // Can create on behalf of exporters
  ],

  [OrganizationRole.NATIONAL_BANK]: [
    ExportAction.APPROVE_FX,
    ExportAction.REJECT_FX,
    ExportAction.SET_FX_RATE,
    ExportAction.VIEW_ALL_EXPORTS,
  ],

  [OrganizationRole.CUSTOMS]: [
    ExportAction.REVIEW_CLEARANCE,
    ExportAction.APPROVE_CUSTOMS,
    ExportAction.REJECT_CUSTOMS,
    ExportAction.VIEW_ALL_EXPORTS,
  ],

  [OrganizationRole.SHIPPING_LINE]: [
    ExportAction.SCHEDULE_SHIPMENT,
    ExportAction.SHIP_EXPORT,
    ExportAction.CONFIRM_DELIVERY,
    ExportAction.VIEW_ALL_EXPORTS,
  ],
};

// Helper function to check if an organization can perform an action
export function canPerformAction(
  organizationRole: OrganizationRole,
  action: ExportAction
): boolean {
  const allowedActions = ROLE_PERMISSIONS[organizationRole];
  return allowedActions ? allowedActions.includes(action) : false;
}

// Helper function to get organizations that can perform a specific action
export function getOrganizationsForAction(action: ExportAction): OrganizationRole[] {
  const organizations: OrganizationRole[] = [];
  for (const [role, actions] of Object.entries(ROLE_PERMISSIONS)) {
    if (actions.includes(action)) {
      organizations.push(role as OrganizationRole);
    }
  }
  return organizations;
}
