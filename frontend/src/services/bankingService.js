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
<<<<<<< HEAD
    const response = await apiClient.get('/banking/documents', { params });
=======
    const response = await apiClient.get('/api/banking/documents', { params });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.get('/banking/financing', { params });
=======
    const response = await apiClient.get('/api/banking/financing', { params });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.get('/banking/compliance', { params });
=======
    const response = await apiClient.get('/api/banking/compliance', { params });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.post('/banking/compliance/run', { exporterId, checkType });
=======
    const response = await apiClient.post('/api/banking/compliance/run', { exporterId, checkType });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.get('/banking/exports', { params });
=======
    const response = await apiClient.get('/api/banking/exports', { params });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.get('/banking/blockchain/transactions');
=======
    const response = await apiClient.get('/api/banking/blockchain/transactions');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get blockchain network status
   */
  getNetworkStatus: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/banking/blockchain/status');
=======
    const response = await apiClient.get('/api/banking/blockchain/status');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get peer information
   */
  getPeerInfo: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/banking/blockchain/peers');
=======
    const response = await apiClient.get('/api/banking/blockchain/peers');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // EXTERNAL GATEWAY
  // ============================================================================

  /**
   * Get exporter portal requests
   */
  getExporterPortalRequests: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/banking/gateway/exporter-requests');
=======
    const response = await apiClient.get('/api/banking/gateway/exporter-requests');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get API gateway logs
   */
  getGatewayLogs: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/banking/gateway/logs');
=======
    const response = await apiClient.get('/api/banking/gateway/logs');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get banking statistics
   */
  getBankingStatistics: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/exports/dashboard/stats');
=======
    const response = await apiClient.get('/api/banking/statistics');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },
};

export default bankingService;
