/**
 * API Configuration
 * Centralized API endpoint management
 *
 * UPDATED: Reorganized to match Ethiopian coffee export workflow
 * - exporter-portal: Exporter Portal API (Port 3007) - External entity (SDK-based)
 * - commercial-bank: Commercial Bank API (Port 3001) - Consortium member
 * - national-bank: National Bank of Ethiopia API (Port 3002)
 * - ecta: Ethiopian Coffee & Tea Authority API (Port 3003)
 * - custom-authorities: Custom Authorities API (Port 3005)
 * - ecx: Ethiopian Commodity Exchange API (Port 3006)
 * - shipping-line: Shipping Line API (Port 3004)
 */

// Type definitions
export interface Organization {
  id: string;
  value: string;
  label: string;
  fullName: string;
  apiUrl: string;
  port: number;
  mspId: string | null;
  description: string;
  order: number;
  type?: 'external' | 'consortium';
}

export interface ApiEndpoints {
  exporterPortal: string;
  commercialBank: string;
  nationalBank: string;
  ecta: string;
  customAuthorities: string;
  ecx: string;
  shippingLine: string;
}

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  return (import.meta.env[key] as string) || fallback;
};

// API Endpoints - Use environment variables with localhost fallbacks
export const API_ENDPOINTS: ApiEndpoints = {
  exporterPortal: getEnvVar('VITE_API_EXPORTER_PORTAL', 'http://localhost:3004'),
  commercialBank: getEnvVar('VITE_API_COMMERCIAL_BANK', 'http://localhost:3001'),
  nationalBank: getEnvVar('VITE_API_NATIONAL_BANK', 'http://localhost:3005'),
  ecta: getEnvVar('VITE_API_ECTA', 'http://localhost:3003'),
  customAuthorities: getEnvVar('VITE_API_CUSTOM_AUTHORITIES', 'http://localhost:3002'),
  ecx: getEnvVar('VITE_API_ECX', 'http://localhost:3006'),
  shippingLine: getEnvVar('VITE_API_SHIPPING_LINE', 'http://localhost:3007'),
};

// Organization Configuration - UPDATED with corrected workflow
export const ORGANIZATIONS: Organization[] = [
  {
    id: 'exporter-portal',
    value: 'exporter-portal',
    label: 'Exporter Portal',
    fullName: 'Coffee Exporter Portal',
    apiUrl: API_ENDPOINTS.exporterPortal,
    port: 3004,
    mspId: null,
    description: 'External exporters - Submit export requests via SDK',
    order: 0,
    type: 'external',
  },
  {
    id: 'ecx',
    value: 'ecx',
    label: 'ECX',
    fullName: 'Ethiopian Commodity Exchange',
    apiUrl: API_ENDPOINTS.ecx,
    port: 3006,
    mspId: 'ECXMSP',
    description: 'ECX - Verifies coffee lots and creates blockchain records',
    order: 1,
    type: 'consortium',
  },
  {
    id: 'ecta',
    value: 'ecta',
    label: 'ECTA',
    fullName: 'Ethiopian Coffee & Tea Authority',
    apiUrl: API_ENDPOINTS.ecta,
    port: 3003,
    mspId: 'ECTAMSP',
    description: 'ECTA - Primary regulator: License, Quality, Origin, Contract',
    order: 2,
    type: 'consortium',
  },
  {
    id: 'commercial-bank',
    value: 'commercial-bank',
    label: 'Commercial Bank',
    fullName: 'Commercial Bank',
    apiUrl: API_ENDPOINTS.commercialBank,
    port: 3001,
    mspId: 'CommercialBankMSP',
    description: 'Commercial Bank - Document verification and FX submission',
    order: 3,
    type: 'consortium',
  },
  {
    id: 'national-bank',
    value: 'national-bank',
    label: 'NBE',
    fullName: 'National Bank of Ethiopia',
    apiUrl: API_ENDPOINTS.nationalBank,
    port: 3005,
    mspId: 'NationalBankMSP',
    description: 'NBE - Foreign exchange approval only',
    order: 4,
  },
  {
    id: 'custom-authorities',
    value: 'custom-authorities',
    label: 'Customs',
    fullName: 'Ethiopian Customs Commission',
    apiUrl: API_ENDPOINTS.customAuthorities,
    port: 3002,
    mspId: 'CustomAuthoritiesMSP',
    description: 'Customs - Export clearance and compliance',
    order: 5,
  },
  {
    id: 'shipping-line',
    value: 'shipping-line',
    label: 'Shipping Line',
    fullName: 'Shipping Line',
    apiUrl: API_ENDPOINTS.shippingLine,
    port: 3007,
    mspId: 'ShippingLineMSP',
    description: 'Shipping Line - Manages shipments and logistics',
    order: 6,
  },
];

// Get API URL by organization value
export const getApiUrl = (orgValue: string): string => {
  const org = ORGANIZATIONS.find((o) => o.value === orgValue);
  return org ? org.apiUrl : API_ENDPOINTS.commercialBank;
};

// Get organization by value
export const getOrganization = (orgValue: string): Organization | undefined => {
  return ORGANIZATIONS.find((o) => o.value === orgValue);
};

// Get MSP ID by organization value
export const getMspId = (orgValue: string): string => {
  const org = getOrganization(orgValue);
  return org?.mspId || 'CommercialBankMSP';
};

export default {
  API_ENDPOINTS,
  ORGANIZATIONS,
  getApiUrl,
  getOrganization,
  getMspId,
};
