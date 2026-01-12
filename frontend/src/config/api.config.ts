/**
 * API Configuration
 * Centralized API endpoint management
 *
 * SINGLE SOURCE OF TRUTH: This file imports shared constants from the backend
 * to ensure frontend and backend use identical endpoint definitions.
 */

// Import shared constants from backend (single source of truth)
import { SERVICES, getAllServices, ServiceConfig } from '../../../api/shared/api-endpoints.constants';

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
  const service = Object.values(SERVICES).find(s => s.id === serviceId);
  if (!service) return 'http://localhost:3000';

  if (apiGatewayUrl) {
    // Production/staging: use API gateway with service path
    return `${apiGatewayUrl}/${serviceId}`;
  }

  // Development: use individual service ports
  const envKey = `VITE_API_${serviceId.toUpperCase().replace(/-/g, '_')}`;
  return getEnvVar(envKey, `http://localhost:${service.port}`);
};

// API Endpoints - Generated dynamically from SERVICES
export const API_ENDPOINTS = Object.values(SERVICES).reduce((acc, service) => {
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
    'shipping-line': 'shippingLine',
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
  'custom-authorities': 'Ethiopian Customs Commission',
  'ecx': 'Ethiopian Commodity Exchange (ECX)',
  'shipping-line': 'Shipping Line',
};

// Organization Configuration - Built from shared constants
export const ORGANIZATIONS: Organization[] = getAllServices().map((service) => ({
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
    const service = Object.values(SERVICES).find(s => s.id === org.id);
    return service?.hasAuth !== false; // Include if hasAuth is true or undefined (default true)
  }
);

// Get API URL by organization value
export const getApiUrl = (orgValue: string | null): string => {
  if (!orgValue) return API_ENDPOINTS.commercialBank;
  const org = ORGANIZATIONS.find((o) => o.value === orgValue);
  return org ? org.apiUrl : API_ENDPOINTS.commercialBank;
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
  API_ENDPOINTS,
  ORGANIZATIONS,
  LOGIN_ORGANIZATIONS,
  getApiUrl,
  getOrganization,
  getMspId,
};
