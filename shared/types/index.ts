// Shared TypeScript Types for Coffee Export Consortium

export interface ExportRequest {
  exportId: string;
  exporterId: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  status: ExportStatus;
  createdAt: string;
  updatedAt: string;
}

export enum ExportStatus {
  DRAFT = 'DRAFT',
  ECX_PENDING = 'ECX_PENDING',
  ECX_VERIFIED = 'ECX_VERIFIED',
  ECTA_LICENSE_PENDING = 'ECTA_LICENSE_PENDING',
  ECTA_LICENSE_APPROVED = 'ECTA_LICENSE_APPROVED',
  ECTA_QUALITY_PENDING = 'ECTA_QUALITY_PENDING',
  ECTA_QUALITY_APPROVED = 'ECTA_QUALITY_APPROVED',
  BANK_DOCUMENT_PENDING = 'BANK_DOCUMENT_PENDING',
  BANK_DOCUMENT_VERIFIED = 'BANK_DOCUMENT_VERIFIED',
  FX_APPLICATION_PENDING = 'FX_APPLICATION_PENDING',
  FX_APPROVED = 'FX_APPROVED',
  CUSTOMS_PENDING = 'CUSTOMS_PENDING',
  CUSTOMS_CLEARED = 'CUSTOMS_CLEARED',
  READY_FOR_SHIPMENT = 'READY_FOR_SHIPMENT',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED'
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organizationId: string;
  isActive: boolean;
}

export enum UserRole {
  EXPORTER = 'exporter',
  COMMERCIAL_BANK = 'commercial_bank',
  NATIONAL_BANK = 'national_bank',
  ECTA = 'ecta',
  ECX = 'ecx',
  SHIPPING_LINE = 'shipping_line',
  CUSTOMS = 'customs',
  ADMIN = 'admin'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  cid: string;
  uploadedAt: string;
  uploadedBy: string;
}
