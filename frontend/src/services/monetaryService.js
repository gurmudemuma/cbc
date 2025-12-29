/**
 * Monetary Service
 * Handles monetary policy, FX management, and compliance for National Bank
 */

import apiClient from './api';

const monetaryService = {
  // ============================================================================
  // FX MANAGEMENT
  // ============================================================================

  /**
   * Get FX approval requests
   */
  getFXApprovalRequests: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/fx/approvals', { params });
    return response.data;
  },

  /**
   * Get FX approval details
   */
  getFXApprovalDetails: async (approvalId) => {
    const response = await apiClient.get(`/api/fx/approvals/${approvalId}`);
    return response.data;
  },

  /**
   * Approve FX request
   */
  approveFXRequest: async (approvalId, approvalData) => {
    const response = await apiClient.post(`/api/fx/approvals/${approvalId}/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject FX request
   */
  rejectFXRequest: async (approvalId, rejectionReason) => {
    const response = await apiClient.post(`/api/fx/approvals/${approvalId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  /**
   * Get FX rates
   */
  getFXRates: async () => {
    const response = await apiClient.get('/fx/rates');
    return response.data;
  },

  /**
   * Update FX rates
   */
  updateFXRates: async (rateData) => {
    const response = await apiClient.post('/fx/rates', rateData);
    return response.data;
  },

  // ============================================================================
  // MONETARY POLICY
  // ============================================================================

  /**
   * Get current monetary policies
   */
  getMonetaryPolicies: async () => {
    const response = await apiClient.get('/monetary/policies');
    return response.data;
  },

  /**
   * Get policy details
   */
  getPolicyDetails: async (policyId) => {
    const response = await apiClient.get(`/api/monetary/policies/${policyId}`);
    return response.data;
  },

  /**
   * Create new policy
   */
  createPolicy: async (policyData) => {
    const response = await apiClient.post('/monetary/policies', policyData);
    return response.data;
  },

  /**
   * Update policy
   */
  updatePolicy: async (policyId, policyData) => {
    const response = await apiClient.put(`/api/monetary/policies/${policyId}`, policyData);
    return response.data;
  },

  /**
   * Activate policy
   */
  activatePolicy: async (policyId) => {
    const response = await apiClient.post(`/api/monetary/policies/${policyId}/activate`);
    return response.data;
  },

  /**
   * Deactivate policy
   */
  deactivatePolicy: async (policyId) => {
    const response = await apiClient.post(`/api/monetary/policies/${policyId}/deactivate`);
    return response.data;
  },

  // ============================================================================
  // EXCHANGE CONTROLS
  // ============================================================================

  /**
   * Get exchange controls
   */
  getExchangeControls: async () => {
    const response = await apiClient.get('/monetary/controls');
    return response.data;
  },

  /**
   * Get control details
   */
  getControlDetails: async (controlId) => {
    const response = await apiClient.get(`/api/monetary/controls/${controlId}`);
    return response.data;
  },

  /**
   * Update control settings
   */
  updateControlSettings: async (controlId, settingsData) => {
    const response = await apiClient.put(`/api/monetary/controls/${controlId}`, settingsData);
    return response.data;
  },

  /**
   * Enable control
   */
  enableControl: async (controlId) => {
    const response = await apiClient.post(`/api/monetary/controls/${controlId}/enable`);
    return response.data;
  },

  /**
   * Disable control
   */
  disableControl: async (controlId) => {
    const response = await apiClient.post(`/api/monetary/controls/${controlId}/disable`);
    return response.data;
  },

  // ============================================================================
  // COMPLIANCE MONITORING
  // ============================================================================

  /**
   * Get compliance monitoring data
   */
  getComplianceMonitoring: async () => {
    const response = await apiClient.get('/monetary/compliance');
    return response.data;
  },

  /**
   * Get compliance details
   */
  getComplianceDetails: async (complianceId) => {
    const response = await apiClient.get(`/api/monetary/compliance/${complianceId}`);
    return response.data;
  },

  /**
   * Run compliance check
   */
  runComplianceCheck: async (exporterId, checkType) => {
    const response = await apiClient.post('/monetary/compliance/run', { exporterId, checkType });
    return response.data;
  },

  // ============================================================================
  // EXPORT OVERSIGHT
  // ============================================================================

  /**
   * Get export transactions for oversight
   */
  getExportTransactions: async () => {
    const response = await apiClient.get('/monetary/exports/transactions');
    return response.data;
  },

  /**
   * Get currency flows
   */
  getCurrencyFlows: async () => {
    const response = await apiClient.get('/monetary/exports/currency');
    return response.data;
  },

  /**
   * Get regulatory reports
   */
  getRegulatoryReports: async () => {
    const response = await apiClient.get('/monetary/exports/reports');
    return response.data;
  },

  // ============================================================================
  // SYSTEM ADMINISTRATION
  // ============================================================================

  /**
   * Get system settings
   */
  getSystemSettings: async () => {
    const response = await apiClient.get('/monetary/admin/settings');
    return response.data;
  },

  /**
   * Update system settings
   */
  updateSystemSettings: async (settingsData) => {
    const response = await apiClient.put('/monetary/admin/settings', settingsData);
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async () => {
    const response = await apiClient.get('/monetary/admin/audit');
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get FX statistics
   */
  getFXStatistics: async () => {
    const response = await apiClient.get('/fx/statistics');
    return response.data;
  },

  /**
   * Get monetary policy statistics
   */
  getMonetaryStatistics: async () => {
    const response = await apiClient.get('/monetary/statistics');
    return response.data;
  },

  /**
   * Get compliance statistics
   */
  getComplianceStatistics: async () => {
    const response = await apiClient.get('/monetary/compliance/statistics');
    return response.data;
  },
};

export default monetaryService;
