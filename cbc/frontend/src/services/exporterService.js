/**
 * Exporter Service
 * Handles exporter profile management, applications, and export requests
 * 
 * UPDATED: Now uses shared endpoint constants for consistency
 */

import apiClient from './api';

// Export endpoints - Gateway handles all export routes at /api/exports
const EXPORTER_ENDPOINTS = {
  EXPORTS: '/api/exports',
  EXPORT_DETAILS: (id) => `/api/exports/${id}`,
  EXPORT_STATISTICS: '/api/exports/statistics',
  EXPORT_SUBMIT: '/api/exports',
  EXPORT_UPDATE: (id) => `/api/exports/${id}`,
  PROFILE: '/api/exporter/profile',
  PROFILE_VERIFICATION: '/api/exporter/profile/verification',
};

const exporterService = {
  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  /**
   * Get exporter profile
   */
  getProfile: async () => {
    const response = await apiClient.get(EXPORTER_ENDPOINTS.PROFILE);
    return response.data.data;
  },

  /**
   * Update exporter profile
   */
  updateProfile: async (profileData) => {
    const response = await apiClient.put(EXPORTER_ENDPOINTS.PROFILE, profileData);
    return response.data;
  },

  /**
   * Get profile verification status
   */
  getVerificationStatus: async () => {
    const response = await apiClient.get(EXPORTER_ENDPOINTS.PROFILE_VERIFICATION);
    return response.data.data;
  },

  // ============================================================================
  // APPLICATION TRACKING
  // ============================================================================

  /**
   * Get all applications for current exporter
   */
  getApplications: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get(EXPORTER_ENDPOINTS.APPLICATIONS, { params });
    return response.data.data || [];
  },

  /**
   * Get application details
   */
  getApplicationDetails: async (applicationId) => {
    const response = await apiClient.get(EXPORTER_ENDPOINTS.APPLICATION_DETAILS(applicationId));
    return response.data;
  },

  /**
   * Submit application
   */
  submitApplication: async (applicationType, applicationData) => {
    const response = await apiClient.post(EXPORTER_ENDPOINTS.APPLICATION_SUBMIT(applicationType), applicationData);
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
    const response = await apiClient.get(EXPORT_ENDPOINTS.EXPORTS, { params });
    return response.data;
  },

  /**
   * Create new export request
   */
  createExportRequest: async (exportData) => {
    const response = await apiClient.post(EXPORT_ENDPOINTS.EXPORT_SUBMIT, exportData);
    return response.data;
  },

  /**
   * Update export request
   */
  updateExportRequest: async (exportId, exportData) => {
    const response = await apiClient.put(EXPORT_ENDPOINTS.EXPORT_UPDATE(exportId), exportData);
    return response.data;
  },

  /**
   * Get export request details
   */
  getExportRequestDetails: async (exportId) => {
    const response = await apiClient.get(EXPORT_ENDPOINTS.EXPORT_DETAILS(exportId));
    return response.data;
  },

  /**
   * Get export statistics
   */
  getExportStatistics: async () => {
    const response = await apiClient.get(EXPORT_ENDPOINTS.EXPORT_STATISTICS);
    return response.data;
  },

  // ============================================================================
  // SUPPORT
  // ============================================================================

  /**
   * Submit support ticket
   */
  submitSupportTicket: async (ticketData) => {
    const response = await apiClient.post(EXPORTER_ENDPOINTS.SUPPORT_TICKETS, ticketData);
    return response.data;
  },

  /**
   * Get support tickets
   */
  getSupportTickets: async () => {
    const response = await apiClient.get(EXPORTER_ENDPOINTS.SUPPORT_TICKETS);
    return response.data;
  },

  /**
   * Get FAQ
   */
  getFAQ: async () => {
    const response = await apiClient.get(EXPORTER_ENDPOINTS.SUPPORT_FAQ);
    return response.data;
  },

  /**
   * Download resource
   */
  downloadResource: async (resourceId) => {
    const response = await apiClient.get(EXPORTER_ENDPOINTS.SUPPORT_RESOURCES(resourceId), {
      responseType: 'blob'
    });
    return response.data;
  },
};

export default exporterService;
