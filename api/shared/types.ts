// Shared TypeScript type definitions for Coffee Export Consortium

export type ExportStatus = 
  | 'PENDING'
  | 'FX_APPROVED'
  | 'FX_REJECTED'
  | 'QUALITY_CERTIFIED'
  | 'QUALITY_REJECTED'
  | 'SHIPMENT_SCHEDULED'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ExportRequest {
  exportId: string;
  exporterBankId: string;
  exporterName: string;
  coffeeType: string;
  quantity: number; // in kg
  destinationCountry: string;
  estimatedValue: number; // in USD
  status: ExportStatus;
  createdAt: string;
  updatedAt: string;
  
  // National Bank fields
  fxApprovalId?: string;
  fxApprovedBy?: string;
  fxApprovedAt?: string;
  fxRejectionReason?: string;
  
  // NCAT fields
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
