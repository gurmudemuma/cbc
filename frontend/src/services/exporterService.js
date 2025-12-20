/**
 * Exporter Service
 * Handles exporter profile management, applications, and export requests
 */

import apiClient from './api';

const exporterService = {
  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Get exporter profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/exporter/profile');
    return response.data;
  },

  /**
   * Update exporter profile
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/exporter/profile', profileData);
    return response.data;
  },

  /**
   * Get profile verification status
   */
  getVerificationStatus: async () => {
    const response = await apiClient.get('/exporter/profile/verification');
    return response.data;
  },

  // ============================================================================
  // APPLICATION TRACKING
  // ============================================================================

  /**
   * Get all applications for current exporter
   */
  getApplications: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/exporter/applications', { params });
    return response.data;
  },

  /**
   * Get application details
   */
  getApplicationDetails: async (applicationId) => {
    const response = await apiClient.get(`/exporter/applications/${applicationId}`);
    return response.data;
  },

  /**
   * Submit application
   */
  submitApplication: async (applicationType, applicationData) => {
    const response = await apiClient.post(`/exporter/applications/${applicationType}`, applicationData);
    return response.data;
  },

  // ============================================================================
  // EXPORT REQUESTS
  // ============================================================================

  /**
   * Get export requests for current exporter
   */
  getExportRequests: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/exports', { params });
    return response.data;
  },

  /**
   * Create new export request
   */
  createExportRequest: async (exportData) => {
    const response = await apiClient.post('/exports', exportData);
    return response.data;
  },

  /**
   * Update export request
   */
  updateExportRequest: async (exportId, exportData) => {
    const response = await apiClient.put(`/exports/${exportId}`, exportData);
    return response.data;
  },

  /**
   * Get export request details
   */
  getExportRequestDetails: async (exportId) => {
    const response = await apiClient.get(`/exports/${exportId}`);
    return response.data;
  },

  /**
   * Get export statistics
   */
  getExportStatistics: async () => {
    const response = await apiClient.get('/exports/statistics');
    return response.data;
  },

  // ============================================================================
  // SUPPORT
  // ============================================================================

  /**
   * Submit support ticket
   */
  submitSupportTicket: async (ticketData) => {
    const response = await apiClient.post('/exporter/support/tickets', ticketData);
    return response.data;
  },

  /**
   * Get support tickets
   */
  getSupportTickets: async () => {
    const response = await apiClient.get('/exporter/support/tickets');
    return response.data;
  },

  /**
   * Get FAQ
   */
  getFAQ: async () => {
    const response = await apiClient.get('/exporter/support/faq');
    return response.data;
  },

  /**
   * Download resource
   */
  downloadResource: async (resourceId) => {
    const response = await apiClient.get(`/exporter/support/resources/${resourceId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

export default exporterService;
