/**
 * ESW (Electronic Single Window) API Service
 * Handles ESW submission and agency approval workflows
 */

import apiClient from './api';

const eswService = {
  // ============================================================================
  // ESW SUBMISSIONS
  // ============================================================================

  /**
   * Submit export to ESW
   */
  submitToESW: async (submissionData) => {
    const response = await apiClient.post('/esw/submissions', submissionData);
    return response.data;
  },

  /**
   * Get all ESW submissions (with optional filters)
   */
  getSubmissions: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.exportId) params.append('exportId', filters.exportId);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);

    const response = await apiClient.get(`/esw/submissions?${params.toString()}`);
    return response.data;
  },

  /**
   * Get submission details by ID
   */
  getSubmissionById: async (submissionId) => {
    const response = await apiClient.get(`/esw/submissions/${submissionId}`);
    return response.data;
  },

  /**
   * Get submissions for a specific export
   */
  getSubmissionsByExport: async (exportId) => {
    const response = await apiClient.get(`/esw/exports/${exportId}/submissions`);
    return response.data;
  },

  /**
   * Update submission status
   */
  updateSubmissionStatus: async (submissionId, status, notes) => {
    const response = await apiClient.patch(`/esw/submissions/${submissionId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  /**
   * Get submission timeline
   */
  getSubmissionTimeline: async (submissionId) => {
    const response = await apiClient.get(`/esw/submissions/${submissionId}/timeline`);
    return response.data;
  },

  // ============================================================================
  // AGENCY APPROVALS
  // ============================================================================

  /**
   * Get agency approvals for a submission
   */
  getAgencyApprovals: async (submissionId) => {
    const response = await apiClient.get(`/esw/submissions/${submissionId}/approvals`);
    return response.data;
  },

  /**
   * Process agency approval (approve/reject)
   */
  processAgencyApproval: async (approvalData) => {
    const response = await apiClient.post('/esw/approvals', approvalData);
    return response.data;
  },

  /**
   * Get pending approvals for an agency
   */
  getPendingApprovalsForAgency: async (agencyCode) => {
    const response = await apiClient.get(`/esw/agencies/${agencyCode}/pending`);
    return response.data;
  },

  // ============================================================================
  // AGENCIES
  // ============================================================================

  /**
   * Get all ESW agencies
   */
  getAgencies: async (activeOnly = true) => {
    const params = activeOnly ? '?activeOnly=true' : '';
    const response = await apiClient.get(`/esw/agencies${params}`);
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get ESW statistics
   */
  getStatistics: async () => {
    const response = await apiClient.get('/esw/statistics');
    return response.data;
  },

  // ============================================================================
  // DOCUMENTS
  // ============================================================================

  /**
   * Upload document (placeholder - to be implemented with file upload)
   */
  uploadDocument: async (file, documentType, exportId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    formData.append('exportId', exportId);

    const response = await apiClient.post('/esw/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get documents for an export
   */
  getDocuments: async (exportId) => {
    const response = await apiClient.get(`/esw/exports/${exportId}/documents`);
    return response.data;
  },
};

export default eswService;
