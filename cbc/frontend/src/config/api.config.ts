/**
 * API Configuration
 * Centralized API endpoint management
 *
 * SINGLE SOURCE OF TRUTH: This file imports shared constants from the backend
 * to ensure frontend and backend use identical endpoint definitions.
 */

// Import shared constants from backend (single source of truth)
// @ts-ignore - This file is copied during Docker build
import { SERVICES, getAllServices } from '../../services/shared/api-endpoints.constants';

// Type definitions for imported constants
interface ServiceConfig {
  id: string;
  name: string;
  port: number;
  mspId: string | null;
  description: string;
  type: 'consortium' | 'external';
  order: number;
  hasAuth?: boolean;
}

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

export type ApiEndpoints = Record<string, string>;

// Extend ImportMetaEnv to include our custom env vars
declare global {
  interface ImportMetaEnv {
    VITE_ENV?: string;
    VITE_API_BASE_URL?: string;
    [key: string]: string | undefined;
  }
}

// Get environment variables with fallbacks
const getEnvVar = (key: string, fallback: string): string => {
  return (import.meta.env[key] as string) || fallback;
};

// Determine if we're in production/staging (uses API gateway)
const isProduction = import.meta.env.VITE_ENV === 'production';
const isStaging = import.meta.env.VITE_ENV === 'staging';
const apiGatewayUrl = isProduction
  ? getEnvVar('VITE_API_BASE_URL', 'https://api.coffeeexport.com')
  : isStaging
    ? getEnvVar('VITE_API_BASE_URL', 'https://staging-api.coffeeexport.com')
    : null;

// Build service URLs based on environment
const buildUrl = (serviceId: string): string => {
  const service = Object.values(SERVICES as Record<string, ServiceConfig>).find(s => s.id === serviceId);
  if (!service) return 'http://localhost:3000';

  if (apiGatewayUrl) {
    // Production/staging: use API gateway with service path
    return `${apiGatewayUrl}/${serviceId}`;
  }

  // Development: use individual service ports
  const envKey = `VITE_API_${serviceId.toUpperCase().replace(/-/g, '_')}`;
  return getEnvVar(envKey, `http://localhost:${service.port}`);
};

// Base API URL for services (used by some service files)
export const API_BASE_URL = apiGatewayUrl || 'http://localhost';

// API Endpoints - Generated dynamically from SERVICES
export const API_ENDPOINTS = Object.values(SERVICES as Record<string, ServiceConfig>).reduce((acc, service) => {
  // Map service IDs to camelCase property names for backward compatibility if needed
  // or just use the service IDs directly if the app supports it.
  // The previous api.config.ts had camelCase keys (commercialBank, nationalBank, etc.)
  // We will map them manually to ensure compatibility with existing code.

  const keyMap: Record<string, string> = {
    'exporter-portal': 'exporterPortal',
    'commercial-bank': 'commercialBank',
    'national-bank': 'nationalBank',
    'ecta': 'ecta',
    'custom-authorities': 'customAuthorities',
    'ecx': 'ecx',
    'esw': 'esw',
    'shipping-line': 'shippingLine',
    'government-agency': 'exporterPortal', // Re-use exporter auth endpoint for now as it supports agency roles
  };

  const key = keyMap[service.id] || service.id;
  acc[key] = buildUrl(service.id);
  return acc;
}, {} as Record<string, string>);

// Custom label mapping for better UI display
const labelMap: Record<string, string> = {
  'exporter-portal': 'Exporter Portal',
  'commercial-bank': 'Commercial Bank',
  'national-bank': 'National Bank of Ethiopia (NBE)',
  'ecta': 'Ethiopian Coffee & Tea Authority (ECTA)',
  'custom-authorities': 'Ethiopian Revenues and Customs Authority (ERCA)',
  'ecx': 'Ethiopian Commodity Exchange (ECX)',
  'esw': 'Electronic Single Window (ESW)',
  'shipping-line': 'Shipping Line',
  // Government Agencies
  'mot': 'Ministry of Trade (MOT)',
  'nbe-agency': 'National Bank of Ethiopia - Agency (NBE)',
  'moa': 'Ministry of Agriculture (MOA)',
  'moh': 'Ministry of Health (MOH)',
  'eic': 'Ethiopian Investment Commission (EIC)',
  'epa': 'Environment Protection Authority (EPA)',
  'ecta-agency': 'Coffee & Tea Authority - Agency (ECTA)',
  'ecx-agency': 'Commodity Exchange - Agency (ECX)',
  'mofed': 'Ministry of Finance and Economic Development (MOFED)',
  'moti': 'Ministry of Transport and Infrastructure (MOTI)',
  'midroc': 'Ministry of Industry (MIDROC)',
  'qsae': 'Quality and Standards Authority (QSAE)',
  'fdre-customs': 'Federal Democratic Republic Customs (FDRE)',
  'trade-remedy': 'Trade Remedy Commission',
};

// Organization Configuration - Built from shared constants
export const ORGANIZATIONS: Organization[] = (getAllServices() as ServiceConfig[]).map((service) => ({
  id: service.id,
  value: service.id,
  label: labelMap[service.id] || service.name,
  fullName: service.name,
  apiUrl: buildUrl(service.id),
  port: service.port,
  mspId: service.mspId,
  description: service.description,
  order: service.order,
  type: service.type as 'external' | 'consortium',
}));

// Organizations that support authentication (for login dropdown)
export const LOGIN_ORGANIZATIONS: Organization[] = ORGANIZATIONS.filter(
  (org) => {
    const service = Object.values(SERVICES as Record<string, ServiceConfig>).find(s => s.id === org.id);
    return service?.hasAuth !== false; // Include if hasAuth is true or undefined (default true)
  }
);

// Agency organizations for government agencies (excluding duplicates with existing consortium members)
// Note: ERCA is already in SERVICES as 'custom-authorities', so we don't duplicate it here
export const AGENCY_ORGANIZATIONS: Organization[] = [
  {
    id: 'mot',
    value: 'MOT',
    label: 'Ministry of Trade (MOT)',
    fullName: 'Ministry of Trade',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Trade policy and regulation',
    order: 100,
    type: 'consortium'
  },
  {
    id: 'moa',
    value: 'MOA',
    label: 'Ministry of Agriculture (MOA)',
    fullName: 'Ministry of Agriculture',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Agricultural policy and development',
    order: 101,
    type: 'consortium'
  },
  {
    id: 'moh',
    value: 'MOH',
    label: 'Ministry of Health (MOH)',
    fullName: 'Ministry of Health',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Health standards and regulations',
    order: 102,
    type: 'consortium'
  },
  {
    id: 'eic',
    value: 'EIC',
    label: 'Ethiopian Investment Commission (EIC)',
    fullName: 'Ethiopian Investment Commission',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Investment promotion and facilitation',
    order: 103,
    type: 'consortium'
  },
  {
    id: 'epa',
    value: 'EPA',
    label: 'Environment Protection Authority (EPA)',
    fullName: 'Environment Protection Authority',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Environmental protection and compliance',
    order: 104,
    type: 'consortium'
  },
  {
    id: 'mofed',
    value: 'MOFED',
    label: 'Ministry of Finance and Economic Development (MOFED)',
    fullName: 'Ministry of Finance and Economic Development',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Financial policy and economic development',
    order: 105,
    type: 'consortium'
  },
  {
    id: 'moti',
    value: 'MOTI',
    label: 'Ministry of Transport and Infrastructure (MOTI)',
    fullName: 'Ministry of Transport and Infrastructure',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Transport and infrastructure development',
    order: 106,
    type: 'consortium'
  },
  {
    id: 'midroc',
    value: 'MIDROC',
    label: 'Ministry of Industry (MIDROC)',
    fullName: 'Ministry of Industry',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Industrial development and policy',
    order: 107,
    type: 'consortium'
  },
  {
    id: 'qsae',
    value: 'QSAE',
    label: 'Quality and Standards Authority (QSAE)',
    fullName: 'Quality and Standards Authority of Ethiopia',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Quality standards and certification',
    order: 108,
    type: 'consortium'
  },
  {
    id: 'fdre-customs',
    value: 'FDRE_CUSTOMS',
    label: 'Federal Democratic Republic Customs (FDRE)',
    fullName: 'Federal Democratic Republic of Ethiopia Customs',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Federal customs operations',
    order: 109,
    type: 'consortium'
  },
  {
    id: 'trade-remedy',
    value: 'TRADE_REMEDY',
    label: 'Trade Remedy Commission',
    fullName: 'Trade Remedy Commission',
    apiUrl: buildUrl('esw'),
    port: 3008,
    mspId: null,
    description: 'Trade remedy investigations',
    order: 110,
    type: 'consortium'
  },
];

// Note: ECTA, ECX, NBE, and ERCA are already in LOGIN_ORGANIZATIONS as consortium members
// so they are NOT duplicated in AGENCY_ORGANIZATIONS

// Remove the manual "government-agency" addition since we now have specific agencies
// Combine organizations and agencies for complete list
export const ALL_LOGIN_OPTIONS = [...LOGIN_ORGANIZATIONS, ...AGENCY_ORGANIZATIONS];

// Get API URL by organization value
export const getApiUrl = (orgValue: string | null): string => {
  if (!orgValue) return (API_ENDPOINTS as any).commercialBank || 'http://localhost:3001';
  const org = ORGANIZATIONS.find((o) => o.value === orgValue);
  return org ? org.apiUrl : (API_ENDPOINTS as any).commercialBank || 'http://localhost:3001';
};

// Get organization by value
export const getOrganization = (orgValue: string | null): Organization | undefined => {
  if (!orgValue) return undefined;
  return ORGANIZATIONS.find((o) => o.value === orgValue);
};

// Get MSP ID by organization value
export const getMspId = (orgValue: string | null): string => {
  const org = getOrganization(orgValue);
  return org?.mspId || 'CommercialBankMSP';
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  ORGANIZATIONS,
  LOGIN_ORGANIZATIONS,
  AGENCY_ORGANIZATIONS,
  ALL_LOGIN_OPTIONS,
  getApiUrl,
  getOrganization,
  getMspId,
};
