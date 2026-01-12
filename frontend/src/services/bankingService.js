/**
 * Banking Service
 * Handles banking operations, document verification, and compliance
 * 
 * UPDATED: Now uses shared endpoint constants for consistency
 */

import apiClient from './api';
import { BANKING_ENDPOINTS, EXPORT_ENDPOINTS } from '../../../api/shared/api-endpoints.constants';

const bankingService = {
  // ============================================================================
  // DOCUMENT VERIFICATION
  // ============================================================================

  /**
   * Get documents pending verification
   */
  getPendingDocuments: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get(BANKING_ENDPOINTS.DOCUMENTS, { params });
    return response.data;
  },

  /**
   * Get document details
   */
  getDocumentDetails: async (documentId) => {
    const response = await apiClient.get(BANKING_ENDPOINTS.DOCUMENT_DETAILS(documentId));
    return response.data;
  },

  /**
   * Verify document
   */
  verifyDocument: async (documentId, verificationData) => {
    const response = await apiClient.post(BANKING_ENDPOINTS.DOCUMENT_VERIFY(documentId), verificationData);
    return response.data;
  },

  /**
   * Reject document
   */
  rejectDocument: async (documentId, rejectionReason) => {
    const response = await apiClient.post(BANKING_ENDPOINTS.DOCUMENT_REJECT(documentId), { reason: rejectionReason });
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
    const response = await apiClient.get(BANKING_ENDPOINTS.FINANCING, { params });
    return response.data;
  },

  /**
   * Get financing details
   */
  getFinancingDetails: async (financingId) => {
    const response = await apiClient.get(BANKING_ENDPOINTS.FINANCING_DETAILS(financingId));
    return response.data;
  },

  /**
   * Approve financing
   */
  approveFinancing: async (financingId, approvalData) => {
    const response = await apiClient.post(BANKING_ENDPOINTS.FINANCING_APPROVE(financingId), approvalData);
    return response.data;
  },

  /**
   * Reject financing
   */
  rejectFinancing: async (financingId, rejectionReason) => {
    const response = await apiClient.post(BANKING_ENDPOINTS.FINANCING_REJECT(financingId), { reason: rejectionReason });
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
    const response = await apiClient.get(BANKING_ENDPOINTS.COMPLIANCE, { params });
    return response.data;
  },

  /**
   * Get compliance details
   */
  getComplianceDetails: async (complianceId) => {
    const response = await apiClient.get(BANKING_ENDPOINTS.COMPLIANCE_DETAILS(complianceId));
    return response.data;
  },

  /**
   * Run compliance check
   */
  runComplianceCheck: async (exporterId, checkType) => {
    const response = await apiClient.post(BANKING_ENDPOINTS.COMPLIANCE_RUN, { exporterId, checkType });
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
    const response = await apiClient.get(BANKING_ENDPOINTS.EXPORTS, { params });
    return response.data;
  },

  /**
   * Approve export request
   */
  approveExportRequest: async (exportId, approvalData) => {
    const response = await apiClient.post(BANKING_ENDPOINTS.EXPORT_APPROVE(exportId), approvalData);
    return response.data;
  },

  /**
   * Reject export request
   */
  rejectExportRequest: async (exportId, rejectionReason) => {
    const response = await apiClient.post(BANKING_ENDPOINTS.EXPORT_REJECT(exportId), { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // BLOCKCHAIN OPERATIONS
  // ============================================================================

  /**
   * Get blockchain transaction history
   */
  getBlockchainTransactions: async () => {
    const response = await apiClient.get(BANKING_ENDPOINTS.BLOCKCHAIN_TRANSACTIONS);
    return response.data;
  },

  /**
   * Get blockchain network status
   */
  getNetworkStatus: async () => {
    const response = await apiClient.get(BANKING_ENDPOINTS.BLOCKCHAIN_STATUS);
    return response.data;
  },

  /**
   * Get peer information
   */
  getPeerInfo: async () => {
    const response = await apiClient.get(BANKING_ENDPOINTS.BLOCKCHAIN_PEERS);
    return response.data;
  },

  // ============================================================================
  // EXTERNAL GATEWAY
  // ============================================================================

  /**
   * Get exporter portal requests
   */
  getExporterPortalRequests: async () => {
    const response = await apiClient.get(BANKING_ENDPOINTS.GATEWAY_EXPORTER_REQUESTS);
    return response.data;
  },

  /**
   * Get API gateway logs
   */
  getGatewayLogs: async () => {
    const response = await apiClient.get(BANKING_ENDPOINTS.GATEWAY_LOGS);
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get banking statistics
   */
  getBankingStatistics: async () => {
    const response = await apiClient.get(EXPORT_ENDPOINTS.EXPORT_STATISTICS);
    return response.data;
  },
};

export default bankingService;
