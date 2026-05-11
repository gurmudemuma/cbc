import axios from 'axios';

// FORCE NEW BUNDLE: Added unique identifier to force rebuild
const BUNDLE_VERSION = '2026-04-28-11-27-00';
console.log('API Client Bundle Version:', BUNDLE_VERSION);

// FORCE REBUILD: Updated timestamp to force new bundle generation
// Last updated: 2026-04-28 11:25:00
// CRITICAL: Always use empty baseURL for relative URLs
// This ensures all requests go through the nginx proxy at the same origin
const apiClient = axios.create({
  baseURL: '', // Empty string = relative URLs to current origin
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // CRITICAL: Force baseURL to empty string to prevent any external modifications
    config.baseURL = '';
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Suppress console errors for expected failures (like stats endpoint when no data)
    const isExpectedError = 
      error.config?.url?.includes('/stats') ||
      error.config?.url?.includes('/exports') && error.response?.status === 404;

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Check if we're on a page that should handle 401 gracefully
      const currentPath = window.location.pathname;
      const shouldNotRedirect = 
        currentPath.includes('/preregistration') ||
        currentPath.includes('/public') ||
        currentPath.includes('/network') ||  // Allow network pages to handle 401 gracefully
        error.config?.skipAuthRedirect === true;

      if (shouldNotRedirect) {
        // Don't redirect, let the component handle the error
        console.warn('Authentication required for this action');
        return Promise.reject(error);
      }

      if (!isExpectedError) {
        console.warn('Authentication expired, redirecting to login...');
      }
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('org');
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      const errorMessage = error.response?.data?.error || 'Access forbidden';
      if (!isExpectedError) {
        console.error('Access forbidden:', errorMessage);
      }
      
      // If it's a token issue, redirect to login
      if (errorMessage.includes('token') || errorMessage.includes('expired')) {
        console.warn('Token issue detected, redirecting to login...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('org');
        window.location.href = '/login';
      }
    }
    
    // Handle 500+ Server errors - only log if not expected
    if (error.response?.status >= 500 && !isExpectedError) {
      const errorDetails = error.response?.data?.error || error.response?.data?.message || 'Unknown error';
      const endpoint = error.config?.url || 'unknown endpoint';
      console.error(`Server error at ${endpoint}:`, errorDetails);
    }
    
    // Handle network errors
    if (!error.response && !isExpectedError) {
      console.error('Network error: Unable to reach server');
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' && !isExpectedError) {
      console.error('Request timeout: Server took too long to respond');
    }
    
    return Promise.reject(error);
  }
);

// Deprecated: setApiBaseUrl is now a no-op
// All requests use relative URLs through nginx proxy
export const setApiBaseUrl = (baseUrl) => {
  console.warn('setApiBaseUrl is deprecated and has no effect. All requests use relative URLs.');
  // Do nothing - we always use relative URLs
};

export default apiClient;
