/**
 * Monetary Service
 * Handles monetary policy, FX management, and compliance for National Bank
 */

import apiClient from './api';

interface ApprovalData {
  [key: string]: any;
}

interface PolicyData {
  [key: string]: any;
}

interface SettingsData {
  [key: string]: any;
}

interface RateData {
  [key: string]: any;
}

const monetaryService = {
  // ============================================================================
  // FX MANAGEMENT
  // ============================================================================

  /**
   * Get FX approval requests
   */
  getFXApprovalRequests: async (filter: string | null = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/fx/approvals', { params });
    return response.data;
  },

  /**
   * Get FX approval details
   */
  getFXApprovalDetails: async (approvalId: string) => {
    const response = await apiClient.get(`/api/fx/approvals/${approvalId}`);
    return response.data;
  },

  /**
   * Approve FX request
   */
  approveFXRequest: async (approvalId: string, approvalData: ApprovalData) => {
    const response = await apiClient.post(`/api/fx/approvals/${approvalId}/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject FX request
   */
  rejectFXRequest: async (approvalId: string, rejectionReason: string) => {
    const response = await apiClient.post(`/api/fx/approvals/${approvalId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  /**
   * Get FX rates
   */
  getFXRates: async () => {
    const response = await apiClient.get('/api/fx/rates');
    return response.data;
  },

  /**
   * Update FX rates
   */
  updateFXRates: async (rateData: RateData) => {
    const response = await apiClient.post('/api/fx/rates', rateData);
    return response.data;
  },

  // ============================================================================
  // MONETARY POLICY
  // ============================================================================

  /**
   * Get current monetary policies
   */
  getMonetaryPolicies: async () => {
    const response = await apiClient.get('/api/monetary/policies');
    return response.data;
  },

  /**
   * Get policy details
   */
  getPolicyDetails: async (policyId: string) => {
    const response = await apiClient.get(`/api/monetary/policies/${policyId}`);
    return response.data;
  },

  /**
   * Create new policy
   */
  createPolicy: async (policyData: PolicyData) => {
    const response = await apiClient.post('/api/monetary/policies', policyData);
    return response.data;
  },

  /**
   * Update policy
   */
  updatePolicy: async (policyId: string, policyData: PolicyData) => {
    const response = await apiClient.put(`/api/monetary/policies/${policyId}`, policyData);
    return response.data;
  },

  /**
   * Activate policy
   */
  activatePolicy: async (policyId: string) => {
    const response = await apiClient.post(`/api/monetary/policies/${policyId}/activate`);
    return response.data;
  },

  /**
   * Deactivate policy
   */
  deactivatePolicy: async (policyId: string) => {
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
    const response = await apiClient.get('/api/monetary/controls');
    return response.data;
  },

  /**
   * Get control details
   */
  getControlDetails: async (controlId: string) => {
    const response = await apiClient.get(`/api/monetary/controls/${controlId}`);
    return response.data;
  },

  /**
   * Update control settings
   */
  updateControlSettings: async (controlId: string, settingsData: SettingsData) => {
    const response = await apiClient.put(`/api/monetary/controls/${controlId}`, settingsData);
    return response.data;
  },

  /**
   * Enable control
   */
  enableControl: async (controlId: string) => {
    const response = await apiClient.post(`/api/monetary/controls/${controlId}/enable`);
    return response.data;
  },

  /**
   * Disable control
   */
  disableControl: async (controlId: string) => {
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
    const response = await apiClient.get('/api/monetary/compliance');
    return response.data;
  },

  /**
   * Get compliance details
   */
  getComplianceDetails: async (complianceId: string) => {
    const response = await apiClient.get(`/api/monetary/compliance/${complianceId}`);
    return response.data;
  },

  /**
   * Run compliance check
   */
  runComplianceCheck: async (exporterId: string, checkType: string) => {
    const response = await apiClient.post('/api/monetary/compliance/run', { exporterId, checkType });
    return response.data;
  },

  // ============================================================================
  // EXPORT OVERSIGHT
  // ============================================================================

  /**
   * Get export transactions for oversight
   */
  getExportTransactions: async () => {
    const response = await apiClient.get('/api/monetary/exports/transactions');
    return response.data;
  },

  /**
   * Get currency flows
   */
  getCurrencyFlows: async () => {
    const response = await apiClient.get('/api/monetary/exports/currency');
    return response.data;
  },

  /**
   * Get regulatory reports
   */
  getRegulatoryReports: async () => {
    const response = await apiClient.get('/api/monetary/exports/reports');
    return response.data;
  },

  // ============================================================================
  // SYSTEM ADMINISTRATION
  // ============================================================================

  /**
   * Get system settings
   */
  getSystemSettings: async () => {
    const response = await apiClient.get('/api/monetary/admin/settings');
    return response.data;
  },

  /**
   * Update system settings
   */
  updateSystemSettings: async (settingsData: SettingsData) => {
    const response = await apiClient.put('/api/monetary/admin/settings', settingsData);
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async () => {
    const response = await apiClient.get('/api/monetary/admin/audit');
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get FX statistics
   */
  getFXStatistics: async () => {
    const response = await apiClient.get('/api/fx/statistics');
    return response.data;
  },

  /**
   * Get monetary policy statistics
   */
  getMonetaryStatistics: async () => {
    const response = await apiClient.get('/api/monetary/statistics');
    return response.data;
  },

  /**
   * Get compliance statistics
   */
  getComplianceStatistics: async () => {
    const response = await apiClient.get('/api/monetary/compliance/statistics');
    return response.data;
  },
};

export default monetaryService;
