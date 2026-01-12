/**
 * API Endpoints Constants - Single Source of Truth
 * 
 * This file defines all API endpoints used across the Coffee Blockchain Consortium.
 * Both frontend and backend should reference these constants to ensure consistency.
 * 
 * ARCHITECTURE:
 * - All services use /api prefix
 * - Each service runs on a dedicated port in development
 * - Production uses API gateway with service-specific paths
 * 
 * SERVICES:
 * - Commercial Bank (3001): Document verification, FX submission
 * - Custom Authorities (3002): Export clearance
 * - ECTA (3003): Licensing, quality, contracts, pre-registration
 * - Exporter Portal (3004): External exporter interface
 * - National Bank (3005): Foreign exchange approval
 * - ECX (3006): Lot verification
 * - Shipping Line (3007): Shipment management
 */

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

export interface ServiceConfig {
  id: string;
  name: string;
  port: number;
  mspId: string | null;
  description: string;
  type: 'consortium' | 'external';
  order: number;
  hasAuth?: boolean; // Whether this service has authentication endpoints
}

export const SERVICES: Record<string, ServiceConfig> = {
  EXPORTER_PORTAL: {
    id: 'exporter-portal',
    name: 'Exporter Portal',
    port: 3004,
    mspId: null,
    description: 'External exporters - Submit export requests via SDK',
    type: 'external',
    order: 0,
    hasAuth: true,
  },
  ECX: {
    id: 'ecx',
    name: 'Ethiopian Commodity Exchange',
    port: 3006,
    mspId: 'ECXMSP',
    description: 'ECX - Verifies coffee lots and creates blockchain records',
    type: 'consortium',
    order: 1,
    hasAuth: false, // ECX is internal service, no direct login
  },
  ECTA: {
    id: 'ecta',
    name: 'Ethiopian Coffee & Tea Authority',
    port: 3003,
    mspId: 'ECTAMSP',
    description: 'ECTA - Primary regulator: License, Quality, Origin, Contract',
    type: 'consortium',
    order: 2,
    hasAuth: true,
  },
  COMMERCIAL_BANK: {
    id: 'commercial-bank',
    name: 'Commercial Bank',
    port: 3001,
    mspId: 'CommercialBankMSP',
    description: 'Commercial Bank - Document verification and FX submission',
    type: 'consortium',
    order: 3,
    hasAuth: true,
  },
  NATIONAL_BANK: {
    id: 'national-bank',
    name: 'National Bank of Ethiopia',
    port: 3005,
    mspId: 'NationalBankMSP',
    description: 'NBE - Foreign exchange approval only',
    type: 'consortium',
    order: 4,
    hasAuth: true,
  },
  CUSTOM_AUTHORITIES: {
    id: 'custom-authorities',
    name: 'Ethiopian Customs Commission',
    port: 3002,
    mspId: 'CustomAuthoritiesMSP',
    description: 'Customs - Export clearance and compliance',
    type: 'consortium',
    order: 5,
    hasAuth: true,
  },
  SHIPPING_LINE: {
    id: 'shipping-line',
    name: 'Shipping Line',
    port: 3007,
    mspId: 'ShippingLineMSP',
    description: 'Shipping Line - Manages shipments and logistics',
    type: 'consortium',
    order: 6,
    hasAuth: true,
  },
};

// ============================================================================
// API ENDPOINT PATHS (without base URL)
// ============================================================================

/**
 * Authentication endpoints (common across all services)
 */
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH: '/api/auth/refresh',
  PROFILE: '/api/auth/profile',
} as const;

/**
 * Exporter Portal endpoints
 */
export const EXPORTER_ENDPOINTS = {
  // Profile Management
  PROFILE: '/api/exporter/profile',
  PROFILE_REGISTER: '/api/exporter/profile/register',
  PROFILE_VERIFICATION: '/api/exporter/profile/verification',
  
  // Applications
  APPLICATIONS: '/api/exporter/applications',
  APPLICATION_DETAILS: (id: string) => `/api/exporter/applications/${id}`,
  APPLICATION_SUBMIT: (type: string) => `/api/exporter/applications/${type}`,
  
  // Support
  SUPPORT_TICKETS: '/api/exporter/support/tickets',
  SUPPORT_FAQ: '/api/exporter/support/faq',
  SUPPORT_RESOURCES: (id: string) => `/api/exporter/support/resources/${id}/download`,
} as const;

/**
 * Export management endpoints (common across multiple services)
 */
export const EXPORT_ENDPOINTS = {
  // Base exports
  EXPORTS: '/api/exports',
  EXPORT_DETAILS: (id: string) => `/api/exports/${id}`,
  EXPORT_STATISTICS: '/api/exports/statistics',
  
  // Export workflow stages
  EXPORT_SUBMIT: '/api/exports',
  EXPORT_UPDATE: (id: string) => `/api/exports/${id}`,
  EXPORT_DOCUMENTS: (id: string) => `/api/exports/${id}/documents`,
  EXPORT_DOCUMENT_VERIFY: (id: string) => `/api/exports/${id}/documents/verify`,
  
  // Status-specific queries
  EXPORTS_PENDING: '/api/exports/pending',
  EXPORTS_READY_FOR_SHIPMENT: '/api/exports/ready-for-shipment',
  EXPORTS_PENDING_CUSTOMS: '/api/exports/pending/export-customs',
} as const;

/**
 * ECTA Pre-registration endpoints
 */
export const PREREGISTRATION_ENDPOINTS = {
  // Exporter management
  EXPORTERS: '/api/preregistration/exporters',
  EXPORTERS_PENDING: '/api/preregistration/exporters/pending',
  EXPORTER_APPROVE: (id: string) => `/api/preregistration/exporters/${id}/approve`,
  EXPORTER_REJECT: (id: string) => `/api/preregistration/exporters/${id}/reject`,
  EXPORTER_RESUBMIT: (id: string) => `/api/preregistration/exporters/${id}/resubmit`,
  EXPORTER_VALIDATE: (id: string) => `/api/preregistration/exporters/${id}/validate`,
  
  // Laboratory
  LABORATORIES: '/api/preregistration/laboratories',
  LABORATORIES_PENDING: '/api/preregistration/laboratories/pending',
  LABORATORY_APPROVE: (id: string) => `/api/preregistration/laboratories/${id}/approve`,
  LABORATORY_REJECT: (id: string) => `/api/preregistration/laboratories/${id}/reject`,
  
  // Tasters
  TASTERS: '/api/preregistration/tasters',
  TASTERS_PENDING: '/api/preregistration/tasters/pending',
  TASTER_APPROVE: (id: string) => `/api/preregistration/tasters/${id}/approve`,
  TASTER_REJECT: (id: string) => `/api/preregistration/tasters/${id}/reject`,
  
  // Competence certificates
  COMPETENCE_CERTIFICATES: '/api/preregistration/competence-certificates',
  COMPETENCE_PENDING: '/api/preregistration/competence-certificates/pending',
  COMPETENCE_APPROVE: (id: string) => `/api/preregistration/competence-certificates/${id}/approve`,
  COMPETENCE_REJECT: (id: string) => `/api/preregistration/competence-certificates/${id}/reject`,
  
  // Export licenses
  EXPORT_LICENSES: '/api/preregistration/export-licenses',
  LICENSES_PENDING: '/api/preregistration/export-licenses/pending',
  LICENSE_APPROVE: (id: string) => `/api/preregistration/export-licenses/${id}/approve`,
  LICENSE_REJECT: (id: string) => `/api/preregistration/export-licenses/${id}/reject`,
} as const;

/**
 * Quality management endpoints (ECTA)
 */
export const QUALITY_ENDPOINTS = {
  QUALITY_CHECKS: '/api/quality',
  QUALITY_PENDING: '/api/quality/pending',
  QUALITY_APPROVE: (id: string) => `/api/quality/${id}/approve`,
  QUALITY_REJECT: (id: string) => `/api/quality/${id}/reject`,
  QUALITY_STATISTICS: '/api/quality/statistics',
} as const;

/**
 * License management endpoints (ECTA)
 */
export const LICENSE_ENDPOINTS = {
  LICENSES: '/api/licenses',
  LICENSE_DETAILS: (id: string) => `/api/licenses/${id}`,
  LICENSE_APPLY: '/api/licenses/apply',
  LICENSE_RENEW: (id: string) => `/api/licenses/${id}/renew`,
  LICENSE_VERIFY: (id: string) => `/api/licenses/${id}/verify`,
} as const;

/**
 * Contract management endpoints (ECTA)
 */
export const CONTRACT_ENDPOINTS = {
  CONTRACTS: '/api/contracts',
  CONTRACT_DETAILS: (id: string) => `/api/contracts/${id}`,
  CONTRACT_VERIFY: (id: string) => `/api/contracts/${id}/verify`,
  CONTRACT_APPROVE: (id: string) => `/api/contracts/${id}/approve`,
  CONTRACT_REJECT: (id: string) => `/api/contracts/${id}/reject`,
} as const;

/**
 * Foreign Exchange endpoints (National Bank)
 */
export const FX_ENDPOINTS = {
  FX_APPROVALS: '/api/fx/approvals',
  FX_APPROVAL_DETAILS: (id: string) => `/api/fx/approvals/${id}`,
  FX_APPROVE: (id: string) => `/api/fx/approvals/${id}/approve`,
  FX_REJECT: (id: string) => `/api/fx/approvals/${id}/reject`,
  FX_PENDING: '/api/fx/pending',
  FX_RATES: '/api/fx/rates',
  FX_STATISTICS: '/api/fx/statistics',
} as const;

/**
 * Monetary policy endpoints (National Bank)
 */
export const MONETARY_ENDPOINTS = {
  POLICIES: '/api/monetary/policies',
  POLICY_DETAILS: (id: string) => `/api/monetary/policies/${id}`,
  POLICY_ACTIVATE: (id: string) => `/api/monetary/policies/${id}/activate`,
  POLICY_DEACTIVATE: (id: string) => `/api/monetary/policies/${id}/deactivate`,
  
  CONTROLS: '/api/monetary/controls',
  CONTROL_DETAILS: (id: string) => `/api/monetary/controls/${id}`,
  CONTROL_ENABLE: (id: string) => `/api/monetary/controls/${id}/enable`,
  CONTROL_DISABLE: (id: string) => `/api/monetary/controls/${id}/disable`,
  
  COMPLIANCE: '/api/monetary/compliance',
  COMPLIANCE_DETAILS: (id: string) => `/api/monetary/compliance/${id}`,
  COMPLIANCE_RUN: '/api/monetary/compliance/run',
  COMPLIANCE_STATISTICS: '/api/monetary/compliance/statistics',
  
  EXPORTS_TRANSACTIONS: '/api/monetary/exports/transactions',
  EXPORTS_CURRENCY: '/api/monetary/exports/currency',
  EXPORTS_REPORTS: '/api/monetary/exports/reports',
  
  ADMIN_SETTINGS: '/api/monetary/admin/settings',
  ADMIN_AUDIT: '/api/monetary/admin/audit',
  
  STATISTICS: '/api/monetary/statistics',
} as const;

/**
 * Customs endpoints
 */
export const CUSTOMS_ENDPOINTS = {
  CUSTOMS_CLEARANCE: '/api/customs/clearance',
  CUSTOMS_PENDING: '/api/customs/pending',
  CUSTOMS_CLEAR: (id: string) => `/api/exports/${id}/export-customs/clear`,
  CUSTOMS_REJECT: (id: string) => `/api/exports/${id}/export-customs/reject`,
  CUSTOMS_STATISTICS: '/api/customs/statistics',
} as const;

/**
 * ECX Lot Verification endpoints
 */
export const LOT_VERIFICATION_ENDPOINTS = {
  LOT_VERIFICATION: '/api/lot-verification',
  LOT_PENDING: '/api/lot-verification/pending/verification',
  LOT_VERIFY: (id: string) => `/api/lot-verification/${id}/verify`,
  LOT_REJECT: (id: string) => `/api/lot-verification/${id}/reject`,
} as const;

/**
 * Shipment endpoints (Shipping Line)
 */
export const SHIPMENT_ENDPOINTS = {
  SHIPMENTS: '/api/shipment',
  SHIPMENT_DETAILS: (id: string) => `/api/shipment/${id}`,
  SHIPMENT_SCHEDULE: (id: string) => `/api/exports/${id}/shipment/schedule`,
  SHIPMENT_UPDATE: (id: string) => `/api/exports/${id}/shipment/update`,
  SHIPMENT_COMPLETE: (id: string) => `/api/exports/${id}/shipment/complete`,
} as const;

/**
 * User management endpoints
 */
export const USER_ENDPOINTS = {
  USERS: '/api/users',
  USER_DETAILS: (id: string) => `/api/users/${id}`,
  USER_CREATE: '/api/users',
  USER_UPDATE: (id: string) => `/api/users/${id}`,
  USER_DELETE: (id: string) => `/api/users/${id}`,
} as const;

/**
 * Banking endpoints (Commercial Bank)
 */
export const BANKING_ENDPOINTS = {
  // Document Verification
  DOCUMENTS: '/api/banking/documents',
  DOCUMENT_DETAILS: (id: string) => `/api/banking/documents/${id}`,
  DOCUMENT_VERIFY: (id: string) => `/api/banking/documents/${id}/verify`,
  DOCUMENT_REJECT: (id: string) => `/api/banking/documents/${id}/reject`,
  
  // Export Financing
  FINANCING: '/api/banking/financing',
  FINANCING_DETAILS: (id: string) => `/api/banking/financing/${id}`,
  FINANCING_APPROVE: (id: string) => `/api/banking/financing/${id}/approve`,
  FINANCING_REJECT: (id: string) => `/api/banking/financing/${id}/reject`,
  
  // Compliance Review
  COMPLIANCE: '/api/banking/compliance',
  COMPLIANCE_DETAILS: (id: string) => `/api/banking/compliance/${id}`,
  COMPLIANCE_RUN: '/api/banking/compliance/run',
  
  // Export Management
  EXPORTS: '/api/banking/exports',
  EXPORT_APPROVE: (id: string) => `/api/banking/exports/${id}/approve`,
  EXPORT_REJECT: (id: string) => `/api/banking/exports/${id}/reject`,
  
  // Blockchain Operations
  BLOCKCHAIN_TRANSACTIONS: '/api/banking/blockchain/transactions',
  BLOCKCHAIN_STATUS: '/api/banking/blockchain/status',
  BLOCKCHAIN_PEERS: '/api/banking/blockchain/peers',
  
  // External Gateway
  GATEWAY_EXPORTER_REQUESTS: '/api/banking/gateway/exporter-requests',
  GATEWAY_LOGS: '/api/banking/gateway/logs',
} as const;

/**
 * Lot management endpoints (ECX)
 */
export const LOT_ENDPOINTS = {
  // Lot Management
  LOTS: '/api/lots',
  LOT_DETAILS: (id: string) => `/api/lots/${id}`,
  LOT_CREATE: '/api/lots',
  LOT_UPDATE: (id: string) => `/api/lots/${id}`,
  
  // Lot Verification
  LOTS_PENDING: '/api/lots/pending',
  LOT_VERIFY: (id: string) => `/api/lots/${id}/verify`,
  LOT_REJECT: (id: string) => `/api/lots/${id}/reject`,
  
  // Lot Grading
  LOT_GRADE: (id: string) => `/api/lots/${id}/grade`,
  LOT_GRADING_HISTORY: (id: string) => `/api/lots/${id}/grading-history`,
  GRADE_STANDARDS: '/api/lots/grade-standards',
  
  // Statistics
  LOT_STATISTICS: '/api/lots/statistics',
} as const;

/**
 * Trading endpoints (ECX)
 */
export const TRADING_ENDPOINTS = {
  ACTIVE: '/api/trading/active',
  PRICES: '/api/trading/prices',
  REPORTS: '/api/trading/reports',
  HISTORY: '/api/trading/history',
  STATISTICS: '/api/trading/statistics',
} as const;

/**
 * Warehouse endpoints (ECX)
 */
export const WAREHOUSE_ENDPOINTS = {
  RECEIPTS: '/api/warehouse/receipts',
  STORAGE: '/api/warehouse/storage',
  QUALITY: '/api/warehouse/quality',
  INVENTORY: '/api/warehouse/inventory',
  STATISTICS: '/api/warehouse/statistics',
} as const;

/**
 * Export verification endpoints (ECX)
 */
export const EXPORT_VERIFICATION_ENDPOINTS = {
  EXPORTS_PENDING: '/api/exports/pending',
  EXPORT_VERIFY: (id: string) => `/api/exports/${id}/verify`,
  EXPORT_REJECT: (id: string) => `/api/exports/${id}/reject`,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build full URL for a service endpoint
 * @param serviceId - Service identifier (e.g., 'exporter-portal')
 * @param path - API path (e.g., '/api/exports')
 * @param baseUrl - Optional base URL override
 */
export function buildServiceUrl(
  serviceId: string,
  path: string,
  baseUrl?: string
): string {
  const service = Object.values(SERVICES).find(s => s.id === serviceId);
  if (!service) {
    throw new Error(`Unknown service: ${serviceId}`);
  }
  
  if (baseUrl) {
    // Production/staging with API gateway
    return `${baseUrl}/${serviceId}${path}`;
  }
  
  // Development with individual ports
  return `http://localhost:${service.port}${path}`;
}

/**
 * Get service configuration by ID
 */
export function getServiceConfig(serviceId: string): ServiceConfig | undefined {
  return Object.values(SERVICES).find(s => s.id === serviceId);
}

/**
 * Get all services sorted by workflow order
 */
export function getAllServices(): ServiceConfig[] {
  return Object.values(SERVICES).sort((a, b) => a.order - b.order);
}
