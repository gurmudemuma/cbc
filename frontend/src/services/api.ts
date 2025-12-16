import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// Get base URL from environment or use default
const getBaseURL = (): string => {
  return '/api';
};

const apiClient: AxiosInstance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Inject bank context for Exporter Portal to consolidate exporter tasks under one portal
    try {
      const org = localStorage.getItem('org');
      const bankContextId = localStorage.getItem('bankContextId') || process.env.REACT_APP_DEFAULT_BANK_ID;
      if (org && org.toLowerCase().includes('exporter') && bankContextId) {
        config.headers['X-Bank-Id'] = bankContextId;
        config.headers['X-Org-Context'] = 'BANK';
      }
    } catch (_) {
      // no-op
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.warn('Authentication expired, redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('org');
      localStorage.removeItem('bankContextId');
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      console.error('Access forbidden: insufficient permissions');
    }
    
    // Handle 500+ Server errors
    if (error.response?.status && error.response.status >= 500) {
      console.error('Server error occurred:', (error.response?.data as any)?.message || 'Unknown error');
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error: Unable to reach server');
      // You could show a toast notification here
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout: Server took too long to respond');
    }
    
    return Promise.reject(error);
  }
);

export const setApiBaseUrl = (baseUrl: string): void => {
  apiClient.defaults.baseURL = baseUrl;
};

export { apiClient };
export default apiClient;
