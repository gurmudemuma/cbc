import axios from 'axios';

// Get base URL from environment or use default
const getBaseURL = () => {
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store the original baseURL setter
const originalSetBaseURL = (baseUrl) => {
  // Ensure the base URL includes /api if it's a full URL
  if (baseUrl && baseUrl.includes('http')) {
    // If it's a full URL like http://localhost:3007, append /api
    if (!baseUrl.endsWith('/api')) {
      apiClient.defaults.baseURL = `${baseUrl}/api`;
    } else {
      apiClient.defaults.baseURL = baseUrl;
    }
  } else {
    // If it's a relative path, use as-is
    apiClient.defaults.baseURL = baseUrl || '/api';
  }
};

apiClient.interceptors.request.use(
  (config) => {
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
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      console.warn('Authentication expired, redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('org');
      window.location.href = '/login';
    }
    
    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      console.error('Access forbidden: insufficient permissions');
    }
    
    // Handle 500+ Server errors
    if (error.response?.status >= 500) {
      console.error('Server error occurred:', error.response?.data?.message || 'Unknown error');
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

export const setApiBaseUrl = (baseUrl) => {
  originalSetBaseURL(baseUrl);
};

export default apiClient;
