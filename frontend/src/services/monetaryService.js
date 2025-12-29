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
<<<<<<< HEAD
    const response = await apiClient.get('/fx/approvals', { params });
=======
    const response = await apiClient.get('/api/fx/approvals', { params });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.get('/fx/rates');
=======
    const response = await apiClient.get('/api/fx/rates');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Update FX rates
   */
  updateFXRates: async (rateData) => {
<<<<<<< HEAD
    const response = await apiClient.post('/fx/rates', rateData);
=======
    const response = await apiClient.post('/api/fx/rates', rateData);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // MONETARY POLICY
  // ============================================================================

  /**
   * Get current monetary policies
   */
  getMonetaryPolicies: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/policies');
=======
    const response = await apiClient.get('/api/monetary/policies');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.post('/monetary/policies', policyData);
=======
    const response = await apiClient.post('/api/monetary/policies', policyData);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/controls');
=======
    const response = await apiClient.get('/api/monetary/controls');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/compliance');
=======
    const response = await apiClient.get('/api/monetary/compliance');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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
<<<<<<< HEAD
    const response = await apiClient.post('/monetary/compliance/run', { exporterId, checkType });
=======
    const response = await apiClient.post('/api/monetary/compliance/run', { exporterId, checkType });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // EXPORT OVERSIGHT
  // ============================================================================

  /**
   * Get export transactions for oversight
   */
  getExportTransactions: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/exports/transactions');
=======
    const response = await apiClient.get('/api/monetary/exports/transactions');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get currency flows
   */
  getCurrencyFlows: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/exports/currency');
=======
    const response = await apiClient.get('/api/monetary/exports/currency');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get regulatory reports
   */
  getRegulatoryReports: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/exports/reports');
=======
    const response = await apiClient.get('/api/monetary/exports/reports');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // SYSTEM ADMINISTRATION
  // ============================================================================

  /**
   * Get system settings
   */
  getSystemSettings: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/admin/settings');
=======
    const response = await apiClient.get('/api/monetary/admin/settings');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Update system settings
   */
  updateSystemSettings: async (settingsData) => {
<<<<<<< HEAD
    const response = await apiClient.put('/monetary/admin/settings', settingsData);
=======
    const response = await apiClient.put('/api/monetary/admin/settings', settingsData);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/admin/audit');
=======
    const response = await apiClient.get('/api/monetary/admin/audit');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get FX statistics
   */
  getFXStatistics: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/fx/statistics');
=======
    const response = await apiClient.get('/api/fx/statistics');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get monetary policy statistics
   */
  getMonetaryStatistics: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/statistics');
=======
    const response = await apiClient.get('/api/monetary/statistics');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get compliance statistics
   */
  getComplianceStatistics: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/monetary/compliance/statistics');
=======
    const response = await apiClient.get('/api/monetary/compliance/statistics');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },
};

export default monetaryService;
