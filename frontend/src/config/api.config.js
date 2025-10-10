/**
 * API Configuration
 * Centralized API endpoint management
 */

// Get environment variables with fallbacks
const getEnvVar = (key, fallback) => {
  return import.meta.env[key] || fallback;
};

// API Endpoints
export const API_ENDPOINTS = {
  exporter: '/api/exporter',
  nationalbank: '/api/nationalbank',
  ncat: '/api/ncat',
  shipping: '/api/shipping',
};

// Organization Configuration
export const ORGANIZATIONS = [
  { 
    value: 'exporter', 
    label: 'Exporter Bank', 
    apiUrl: API_ENDPOINTS.exporter,
    port: 3001 
  },
  { 
    value: 'nationalbank', 
    label: 'National Bank', 
    apiUrl: API_ENDPOINTS.nationalbank,
    port: 3002 
  },
  { 
    value: 'ncat', 
    label: 'NCAT', 
    apiUrl: API_ENDPOINTS.ncat,
    port: 3003 
  },
  { 
    value: 'shipping', 
    label: 'Shipping Line', 
    apiUrl: API_ENDPOINTS.shipping,
    port: 3004 
  }
];

// Get API URL by organization value
export const getApiUrl = (orgValue) => {
  const org = ORGANIZATIONS.find(o => o.value === orgValue);
  return org ? org.apiUrl : API_ENDPOINTS.exporter;
};

export default {
  API_ENDPOINTS,
  ORGANIZATIONS,
  getApiUrl
};
