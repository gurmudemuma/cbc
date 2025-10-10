import axios from 'axios';

// Get base URL from environment or use default
const getBaseURL = () => {
  return '/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const setApiBaseUrl = (baseUrl: string) => {
  apiClient.defaults.baseURL = baseUrl;
};

export default apiClient;
