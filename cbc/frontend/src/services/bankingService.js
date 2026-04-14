/**
 * Banking Service
 * Handles banking operations, document verification, and compliance
 * 
 * NOTE: Commercial Bank primarily manages exports through the network.
 * This service provides a banking-focused view of export data.
 */

import apiClient from './api';

const bankingService = {
  // ============================================================================
  // DOCUMENT VERIFICATION
  // ============================================================================

  /**
   * Get documents pending verification
   * Uses exports data filtered for banking review
   */
  getPendingDocuments: async (filter = null) => {
    const params = filter ? { status: filter } : { status: 'BANKING_PENDING' };
    const response = await apiClient.get('/api/exports', { params });
    return response.data;
  },

  /**
   * Get document details
   */
  getDocumentDetails: async (documentId) => {
    const response = await apiClient.get(`/api/exports/${documentId}`);
    return response.data;
  },

  /**
   * Verify document
   */
  verifyDocument: async (documentId, verificationData) => {
    const response = await apiClient.post(`/api/exports/${documentId}/banking/verify`, verificationData);
    return response.data;
  },

  /**
   * Reject document
   */
  rejectDocument: async (documentId, rejectionReason) => {
    const response = await apiClient.post(`/api/exports/${documentId}/banking/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // EXPORT FINANCING
  // ============================================================================

  /**
   * Get financing requests
   * Returns exports that need financing approval
   */
  getFinancingRequests: async (filter = null) => {
    const params = filter ? { status: filter } : { status: 'BANKING_PENDING' };
    const response = await apiClient.get('/api/exports', { params });
    return response.data;
  },

  /**
   * Get financing details
   */
  getFinancingDetails: async (financingId) => {
    const response = await apiClient.get(`/api/exports/${financingId}`);
    return response.data;
  },

  /**
   * Approve financing
   */
  approveFinancing: async (financingId, approvalData) => {
    const response = await apiClient.post(`/api/exports/${financingId}/banking/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject financing
   */
  rejectFinancing: async (financingId, rejectionReason) => {
    const response = await apiClient.post(`/api/exports/${financingId}/banking/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // COMPLIANCE REVIEW
  // ============================================================================

  /**
   * Get compliance checks
   * Returns exports that need compliance review
   */
  getComplianceChecks: async (filter = null) => {
    const params = filter ? { status: filter } : { status: 'BANKING_PENDING' };
    const response = await apiClient.get('/api/exports', { params });
    return response.data;
  },

  /**
   * Get compliance details
   */
  getComplianceDetails: async (complianceId) => {
    const response = await apiClient.get(`/api/exports/${complianceId}`);
    return response.data;
  },

  /**
   * Run compliance check
   */
  runComplianceCheck: async (exporterId, checkType) => {
    const response = await apiClient.post('/api/exports/compliance/check', { exporterId, checkType });
    return response.data;
  },

  // ============================================================================
  // EXPORT MANAGEMENT
  // ============================================================================

  /**
   * Get all export requests for banking review
   */
  getAllExportRequests: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/exports', { params });
    return response.data;
  },

  /**
   * Approve export request
   */
  approveExportRequest: async (exportId, approvalData) => {
    const response = await apiClient.post(`/api/exports/${exportId}/banking/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject export request
   */
  rejectExportRequest: async (exportId, rejectionReason) => {
    const response = await apiClient.post(`/api/exports/${exportId}/banking/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get banking statistics
   */
  getBankingStatistics: async () => {
    const response = await apiClient.get('/api/analytics/exports/statistics');
    return response.data;
  },

  // ============================================================================
  // SALES CONTRACT VERIFICATION
  // ============================================================================

  /**
   * Verify sales contract by ECTA reference number
   */
  verifySalesContract: async (referenceNumber) => {
    const response = await apiClient.get(`/api/ecta/contracts/verify/${referenceNumber}`);
    return response.data;
  },
};

export default bankingService;
