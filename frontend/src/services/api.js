import axios from 'axios';

const API_BASE_URLS = {
  commercialBank: 'http://localhost:3001',
  nationalBank: 'http://localhost:3002',
  ecta: 'http://localhost:3003',
  ecx: 'http://localhost:3004',
  shippingLine: 'http://localhost:3005',
  customAuthorities: 'http://localhost:3006'
};

class ApiService {
  constructor() {
    this.clients = {};
    
    // Create axios clients for each organization
    Object.keys(API_BASE_URLS).forEach(org => {
      this.clients[org] = axios.create({
        baseURL: API_BASE_URLS[org],
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Add auth interceptor
      this.clients[org].interceptors.request.use(config => {
        const token = localStorage.getItem(`${org}_token`);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      });
    });
  }

  // Authentication
  async login(organization, credentials) {
    try {
      const response = await this.clients[organization].post('/api/auth/login', credentials);
      if (response.data.success) {
        localStorage.setItem(`${organization}_token`, response.data.token);
        localStorage.setItem('currentUser', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  // Exports
  async getExports(organization) {
    try {
      const response = await this.clients[organization].get('/api/exports');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get exports: ${error.message}`);
    }
  }

  async createExport(organization, exportData) {
    try {
      const response = await this.clients[organization].post('/api/exports', exportData);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create export: ${error.message}`);
    }
  }

  // Health checks
  async checkHealth(organization) {
    try {
      const response = await this.clients[organization].get('/health');
      return response.data;
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Check all services
  async checkAllServices() {
    const results = {};
    for (const org of Object.keys(API_BASE_URLS)) {
      results[org] = await this.checkHealth(org);
    }
    return results;
  }
}

const apiService = new ApiService();

// Create a default axios client for backward compatibility
export const apiClient = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth interceptor
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setApiBaseUrl = (baseUrl) => {
  apiClient.defaults.baseURL = baseUrl;
  // Update base URLs for all clients
  Object.keys(apiService.clients).forEach(org => {
    apiService.clients[org].defaults.baseURL = baseUrl;
  });
};

export default apiClient;
