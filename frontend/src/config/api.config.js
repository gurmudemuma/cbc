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
  exporterportal: '/api/exporter-portal',
  nationalbank: '/api/nationalbank',
  ncat: '/api/ncat',
  shipping: '/api/shipping',
  customauthorities: '/api/customauthorities',
};

// Organization Configuration
export const ORGANIZATIONS = [
  { 
    value: 'exporter-portal', 
    label: 'Exporter Portal', 
    apiUrl: API_ENDPOINTS.exporterportal,
    port: 3006 
  },
  { 
    value: 'exporter-bank', 
    label: 'Exporter Bank (Consortium)', 
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
  },
  { 
    value: 'customauthorities', 
    label: 'Custom Authorities', 
    apiUrl: API_ENDPOINTS.customauthorities,
    port: 3005 
  }
];

// Get API URL by organization value
export const getApiUrl = (orgValue) => {
  const org = ORGANIZATIONS.find(o => o.value === orgValue);
  return org ? org.apiUrl : API_ENDPOINTS.exporterportal;
};

export default {
  API_ENDPOINTS,
  ORGANIZATIONS,
  getApiUrl
};
