/**
 * Banking Service
 * Handles banking operations, document verification, and compliance
 */

import apiClient from './api';

const bankingService = {
  // ============================================================================
  // DOCUMENT VERIFICATION
  // ============================================================================

  /**
   * Get documents pending verification
   */
  getPendingDocuments: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/banking/documents', { params });
    return response.data;
  },

  /**
   * Get document details
   */
  getDocumentDetails: async (documentId) => {
    const response = await apiClient.get(`/api/banking/documents/${documentId}`);
    return response.data;
  },

  /**
   * Verify document
   */
  verifyDocument: async (documentId, verificationData) => {
    const response = await apiClient.post(`/api/banking/documents/${documentId}/verify`, verificationData);
    return response.data;
  },

  /**
   * Reject document
   */
  rejectDocument: async (documentId, rejectionReason) => {
    const response = await apiClient.post(`/api/banking/documents/${documentId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // EXPORT FINANCING
  // ============================================================================

  /**
   * Get financing requests
   */
  getFinancingRequests: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/banking/financing', { params });
    return response.data;
  },

  /**
   * Get financing details
   */
  getFinancingDetails: async (financingId) => {
    const response = await apiClient.get(`/api/banking/financing/${financingId}`);
    return response.data;
  },

  /**
   * Approve financing
   */
  approveFinancing: async (financingId, approvalData) => {
    const response = await apiClient.post(`/api/banking/financing/${financingId}/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject financing
   */
  rejectFinancing: async (financingId, rejectionReason) => {
    const response = await apiClient.post(`/api/banking/financing/${financingId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // COMPLIANCE REVIEW
  // ============================================================================

  /**
   * Get compliance checks
   */
  getComplianceChecks: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/banking/compliance', { params });
    return response.data;
  },

  /**
   * Get compliance details
   */
  getComplianceDetails: async (complianceId) => {
    const response = await apiClient.get(`/api/banking/compliance/${complianceId}`);
    return response.data;
  },

  /**
   * Run compliance check
   */
  runComplianceCheck: async (exporterId, checkType) => {
    const response = await apiClient.post('/api/banking/compliance/run', { exporterId, checkType });
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
    const response = await apiClient.get('/api/banking/exports', { params });
    return response.data;
  },

  /**
   * Approve export request
   */
  approveExportRequest: async (exportId, approvalData) => {
    const response = await apiClient.post(`/api/banking/exports/${exportId}/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject export request
   */
  rejectExportRequest: async (exportId, rejectionReason) => {
    const response = await apiClient.post(`/api/banking/exports/${exportId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // BLOCKCHAIN OPERATIONS
  // ============================================================================

  /**
   * Get blockchain transaction history
   */
  getBlockchainTransactions: async () => {
    const response = await apiClient.get('/api/banking/blockchain/transactions');
    return response.data;
  },

  /**
   * Get blockchain network status
   */
  getNetworkStatus: async () => {
    const response = await apiClient.get('/api/banking/blockchain/status');
    return response.data;
  },

  /**
   * Get peer information
   */
  getPeerInfo: async () => {
    const response = await apiClient.get('/api/banking/blockchain/peers');
    return response.data;
  },

  // ============================================================================
  // EXTERNAL GATEWAY
  // ============================================================================

  /**
   * Get exporter portal requests
   */
  getExporterPortalRequests: async () => {
    const response = await apiClient.get('/api/banking/gateway/exporter-requests');
    return response.data;
  },

  /**
   * Get API gateway logs
   */
  getGatewayLogs: async () => {
    const response = await apiClient.get('/api/banking/gateway/logs');
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get banking statistics
   */
  getBankingStatistics: async () => {
    const response = await apiClient.get('/api/banking/statistics');
    return response.data;
  },
};

export default bankingService;
