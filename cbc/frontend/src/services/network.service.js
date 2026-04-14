/**
 * Network API Service
 * Handles Network submission and network member approval workflows
 * Cache bust: v2
 */

import apiClient from './api';

const networkService = {
  // ============================================================================
  // NETWORK SUBMISSIONS
  // ============================================================================

  /**
   * Submit export to Network
   */
  submitToNetwork: async (submissionData) => {
    const response = await apiClient.post('/api/network/submissions', submissionData);
    return response.data;
  },

  /**
   * Get all Network submissions (with optional filters)
   */
  getSubmissions: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.exportId) params.append('exportId', filters.exportId);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);

    const response = await apiClient.get(`/api/network/submissions?${params.toString()}`);
    return response.data;
  },

  /**
   * Get submission details by ID
   */
  getSubmissionById: async (submissionId) => {
    const response = await apiClient.get(`/api/network/submissions/${submissionId}`);
    return response.data;
  },

  /**
   * Get submissions for a specific export
   */
  getSubmissionsByExport: async (exportId) => {
    const response = await apiClient.get(`/api/network/exports/${exportId}/submissions`);
    return response.data;
  },

  /**
   * Update submission status
   */
  updateSubmissionStatus: async (submissionId, status, notes) => {
    const response = await apiClient.patch(`/api/network/submissions/${submissionId}/status`, {
      status,
      notes
    });
    return response.data;
  },

  /**
   * Get submission timeline
   */
  getSubmissionTimeline: async (submissionId) => {
    const response = await apiClient.get(`/api/network/submissions/${submissionId}/timeline`);
    return response.data;
  },

  // ============================================================================
  // NETWORK MEMBER APPROVALS
  // ============================================================================

  /**
   * Get network member approvals for a submission
   */
  getNetworkMemberApprovals: async (submissionId) => {
    const response = await apiClient.get(`/api/network/submissions/${submissionId}/approvals`);
    return response.data;
  },

  /**
   * Process network member approval (approve/reject)
   */
  processNetworkMemberApproval: async (approvalData) => {
    const { submissionId, memberCode, ...body } = approvalData;
    const response = await apiClient.post(
      `/api/network/submissions/${submissionId}/agencies/${memberCode}/approve`,
      body
    );
    return response.data;
  },

  /**
   * Process agency approval (alias for consistency with dashboard)
   */
  processAgencyApproval: async (approvalData) => {
    const { submissionId, agencyCode, ...body } = approvalData;
    const response = await apiClient.post(
      `/api/network/submissions/${submissionId}/agencies/${agencyCode}/approve`,
      body
    );
    return response.data;
  },

  /**
   * Get pending approvals for a network member
   */
  getPendingApprovalsForNetworkMember: async (memberCode) => {
    const response = await apiClient.get(`/api/network/agencies/${memberCode}/pending`);
    return response.data;
  },

  /**
   * Get pending approvals for an agency (alias for consistency)
   */
  getPendingApprovalsForAgency: async (memberCode) => {
    const response = await apiClient.get(`/api/network/agencies/${memberCode}/pending`);
    return response.data;
  },

  /**
   * Get network member-specific statistics
   */
  getNetworkMemberStatistics: async (memberCode) => {
    const response = await apiClient.get(`/api/network/agencies/${memberCode}/stats`);
    return response.data;
  },

  /**
   * Get agency-specific statistics (alias for consistency)
   */
  getAgencyStatistics: async (memberCode) => {
    const response = await apiClient.get(`/api/network/agencies/${memberCode}/stats`);
    return response.data;
  },

  /**
   * Get user's assigned network members
   */
  getUserNetworkMembers: async () => {
    const response = await apiClient.get('/api/network/user/network-members');
    return response.data;
  },

  // ============================================================================
  // AGENCIES
  // ============================================================================

  /**
   * Get all Network agencies
   */
  getAgencies: async (activeOnly = true) => {
    const params = activeOnly ? '?activeOnly=true' : '';
    const response = await apiClient.get(`/api/network/agencies${params}`);
    return response.data;
  },

  /**
   * Get user's assigned agencies
   */
  getMyAgencies: async () => {
    const response = await apiClient.get('/api/network/agencies/my/list');
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get Network statistics
   */
  getStatistics: async () => {
    const response = await apiClient.get('/api/network/statistics');
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

    const response = await apiClient.post('/api/network/documents/upload', formData, {
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
    const response = await apiClient.get(`/api/network/exports/${exportId}/documents`);
    return response.data;
  },

  // ============================================================================
  // CERTIFICATES
  // ============================================================================

  /**
   * Get all certificates for a submission
   */
  getSubmissionCertificates: async (submissionId) => {
    const response = await apiClient.get(`/api/network/submissions/${submissionId}/certificates`);
    return response.data;
  },

  /**
   * Get certificate metadata
   */
  getCertificate: async (certificateId) => {
    const response = await apiClient.get(`/api/network/certificates/${certificateId}`);
    return response.data;
  },

  /**
   * Download certificate PDF
   */
  downloadCertificate: async (certificateId, certificateNumber) => {
    const response = await apiClient.get(`/api/network/certificates/${certificateId}/download`, {
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
    const response = await apiClient.get(`/api/network/certificates/verify/${certificateNumber}`);
    return response.data;
  },

  /**
   * Verify sales contract by reference number
   */
  verifySalesContract: async (referenceNumber) => {
    const response = await apiClient.get(`/api/ecta/contracts/verify/${referenceNumber}`);
    return response.data;
  },
};

export default networkService;
