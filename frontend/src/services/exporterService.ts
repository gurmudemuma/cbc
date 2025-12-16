/**
 * Exporter Service
 * Handles exporter profile management, applications, and export requests
 */

import apiClient from './api';

interface ProfileData {
  [key: string]: any;
}

interface ApplicationData {
  [key: string]: any;
}

interface ExportData {
  [key: string]: any;
}

interface TicketData {
  [key: string]: any;
}

const exporterService = {
  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Get exporter profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/api/exporter/profile');
    return response.data;
  },

  /**
   * Update exporter profile
   */
  updateProfile: async (profileData: ProfileData) => {
    const response = await apiClient.put('/api/exporter/profile', profileData);
    return response.data;
  },

  /**
   * Get profile verification status
   */
  getVerificationStatus: async () => {
    const response = await apiClient.get('/api/exporter/profile/verification');
    return response.data;
  },

  // ============================================================================
  // APPLICATION TRACKING
  // ============================================================================

  /**
   * Get all applications for current exporter
   */
  getApplications: async (filter: string | null = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/exporter/applications', { params });
    return response.data;
  },

  /**
   * Get application details
   */
  getApplicationDetails: async (applicationId: string) => {
    const response = await apiClient.get(`/api/exporter/applications/${applicationId}`);
    return response.data;
  },

  /**
   * Submit application
   */
  submitApplication: async (applicationType: string, applicationData: ApplicationData) => {
    const response = await apiClient.post(`/api/exporter/applications/${applicationType}`, applicationData);
    return response.data;
  },

  // ============================================================================
  // EXPORT REQUESTS
  // ============================================================================

  /**
   * Get export requests for current exporter
   */
  getExportRequests: async (filter: string | null = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/exporter/exports', { params });
    return response.data;
  },

  /**
   * Create new export request
   */
  createExportRequest: async (exportData: ExportData) => {
    const response = await apiClient.post('/api/exporter/exports', exportData);
    return response.data;
  },

  /**
   * Update export request
   */
  updateExportRequest: async (exportId: string, exportData: ExportData) => {
    const response = await apiClient.put(`/api/exporter/exports/${exportId}`, exportData);
    return response.data;
  },

  /**
   * Get export request details
   */
  getExportRequestDetails: async (exportId: string) => {
    const response = await apiClient.get(`/api/exporter/exports/${exportId}`);
    return response.data;
  },

  /**
   * Get export statistics
   */
  getExportStatistics: async () => {
    const response = await apiClient.get('/api/exporter/exports/statistics');
    return response.data;
  },

  // ============================================================================
  // SUPPORT
  // ============================================================================

  /**
   * Submit support ticket
   */
  submitSupportTicket: async (ticketData: TicketData) => {
    const response = await apiClient.post('/api/exporter/support/tickets', ticketData);
    return response.data;
  },

  /**
   * Get support tickets
   */
  getSupportTickets: async () => {
    const response = await apiClient.get('/api/exporter/support/tickets');
    return response.data;
  },

  /**
   * Get FAQ
   */
  getFAQ: async () => {
    const response = await apiClient.get('/api/exporter/support/faq');
    return response.data;
  },

  /**
   * Download resource
   */
  downloadResource: async (resourceId: string) => {
    const response = await apiClient.get(`/api/exporter/support/resources/${resourceId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

export default exporterService;
