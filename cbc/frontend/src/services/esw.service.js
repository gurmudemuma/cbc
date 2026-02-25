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
    const response = await apiClient.post('/api/esw/submissions', submissionData);
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

    const response = await apiClient.get(`/api/esw/submissions?${params.toString()}`);
    return response.data;
  },

  /**
   * Get submission details by ID
   */
  getSubmissionById: async (submissionId) => {
    const response = await apiClient.get(`/api/esw/submissions/${submissionId}`);
    return response.data;
  },

  /**
   * Get submissions for a specific export
   */
  getSubmissionsByExport: async (exportId) => {
    const response = await apiClient.get(`/api/esw/exports/${exportId}/submissions`);
    return response.data;
  },

  /**
   * Update submission status
   */
  updateSubmissionStatus: async (submissionId, status, notes) => {
    const response = await apiClient.patch(`/api/esw/submissions/${submissionId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  /**
   * Get submission timeline
   */
  getSubmissionTimeline: async (submissionId) => {
    const response = await apiClient.get(`/api/esw/submissions/${submissionId}/timeline`);
    return response.data;
  },

  // ============================================================================
  // AGENCY APPROVALS
  // ============================================================================

  /**
   * Get agency approvals for a submission
   */
  getAgencyApprovals: async (submissionId) => {
    const response = await apiClient.get(`/api/esw/submissions/${submissionId}/approvals`);
    return response.data;
  },

  /**
   * Process agency approval (approve/reject)
   */
  processAgencyApproval: async (approvalData) => {
    const { submissionId, agencyCode, ...body } = approvalData;
    const response = await apiClient.post(
      `/api/esw/submissions/${submissionId}/agencies/${agencyCode}/approve`,
      body
    );
    return response.data;
  },

  /**
   * Get pending approvals for an agency
   */
  getPendingApprovalsForAgency: async (agencyCode) => {
    const response = await apiClient.get(`/api/esw/agencies/${agencyCode}/pending`);
    return response.data;
  },

  /**
   * Get agency-specific statistics
   */
  getAgencyStatistics: async (agencyCode) => {
    const response = await apiClient.get(`/api/esw/agencies/${agencyCode}/stats`);
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
    const response = await apiClient.get(`/api/esw/agencies${params}`);
    return response.data;
  },

  /**
   * Get user's assigned agencies
   */
  getMyAgencies: async () => {
    const response = await apiClient.get('/api/esw/agencies/my/list');
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get ESW statistics
   */
  getStatistics: async () => {
    const response = await apiClient.get('/api/esw/statistics');
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

    const response = await apiClient.post('/api/esw/documents/upload', formData, {
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
    const response = await apiClient.get(`/api/esw/exports/${exportId}/documents`);
    return response.data;
  },

  // ============================================================================
  // CERTIFICATES
  // ============================================================================

  /**
   * Get all certificates for a submission
   */
  getSubmissionCertificates: async (submissionId) => {
    const response = await apiClient.get(`/api/esw/submissions/${submissionId}/certificates`);
    return response.data;
  },

  /**
   * Get certificate metadata
   */
  getCertificate: async (certificateId) => {
    const response = await apiClient.get(`/api/esw/certificates/${certificateId}`);
    return response.data;
  },

  /**
   * Download certificate PDF
   */
  downloadCertificate: async (certificateId, certificateNumber) => {
    const response = await apiClient.get(`/api/esw/certificates/${certificateId}/download`, {
      responseType: 'blob'
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${certificateNumber || 'certificate'}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  /**
   * Verify certificate by certificate number (PUBLIC - no auth required)
   */
  verifyCertificate: async (certificateNumber) => {
    const response = await apiClient.get(`/api/esw/certificates/verify/${certificateNumber}`);
    return response.data;
  },
};

export default eswService;
