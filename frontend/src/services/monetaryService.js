/**
 * Monetary Service
 * Handles monetary policy, FX management, and compliance for National Bank
 * 
 * UPDATED: Now uses shared endpoint constants for consistency
 */

import apiClient from './api';
import { FX_ENDPOINTS, MONETARY_ENDPOINTS } from '../../../api/shared/api-endpoints.constants';

const monetaryService = {
  // ============================================================================
  // FX MANAGEMENT
  // ============================================================================

  /**
   * Get FX approval requests
   */
  getFXApprovalRequests: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get(FX_ENDPOINTS.FX_APPROVALS, { params });
    return response.data;
  },

  /**
   * Get FX approval details
   */
  getFXApprovalDetails: async (approvalId) => {
    const response = await apiClient.get(FX_ENDPOINTS.FX_APPROVAL_DETAILS(approvalId));
    return response.data;
  },

  /**
   * Approve FX request
   */
  approveFXRequest: async (approvalId, approvalData) => {
    const response = await apiClient.post(FX_ENDPOINTS.FX_APPROVE(approvalId), approvalData);
    return response.data;
  },

  /**
   * Reject FX request
   */
  rejectFXRequest: async (approvalId, rejectionReason) => {
    const response = await apiClient.post(FX_ENDPOINTS.FX_REJECT(approvalId), { reason: rejectionReason });
    return response.data;
  },

  /**
   * Get FX rates
   */
  getFXRates: async () => {
    const response = await apiClient.get(FX_ENDPOINTS.FX_RATES);
    return response.data;
  },

  /**
   * Update FX rates
   */
  updateFXRates: async (rateData) => {
    const response = await apiClient.post(FX_ENDPOINTS.FX_RATES, rateData);
    return response.data;
  },

  // ============================================================================
  // MONETARY POLICY
  // ============================================================================

  /**
   * Get current monetary policies
   */
  getMonetaryPolicies: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.POLICIES);
    return response.data;
  },

  /**
   * Get policy details
   */
  getPolicyDetails: async (policyId) => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.POLICY_DETAILS(policyId));
    return response.data;
  },

  /**
   * Create new policy
   */
  createPolicy: async (policyData) => {
    const response = await apiClient.post(MONETARY_ENDPOINTS.POLICIES, policyData);
    return response.data;
  },

  /**
   * Update policy
   */
  updatePolicy: async (policyId, policyData) => {
    const response = await apiClient.put(MONETARY_ENDPOINTS.POLICY_DETAILS(policyId), policyData);
    return response.data;
  },

  /**
   * Activate policy
   */
  activatePolicy: async (policyId) => {
    const response = await apiClient.post(MONETARY_ENDPOINTS.POLICY_ACTIVATE(policyId));
    return response.data;
  },

  /**
   * Deactivate policy
   */
  deactivatePolicy: async (policyId) => {
    const response = await apiClient.post(MONETARY_ENDPOINTS.POLICY_DEACTIVATE(policyId));
    return response.data;
  },

  // ============================================================================
  // EXCHANGE CONTROLS
  // ============================================================================

  /**
   * Get exchange controls
   */
  getExchangeControls: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.CONTROLS);
    return response.data;
  },

  /**
   * Get control details
   */
  getControlDetails: async (controlId) => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.CONTROL_DETAILS(controlId));
    return response.data;
  },

  /**
   * Update control settings
   */
  updateControlSettings: async (controlId, settingsData) => {
    const response = await apiClient.put(MONETARY_ENDPOINTS.CONTROL_DETAILS(controlId), settingsData);
    return response.data;
  },

  /**
   * Enable control
   */
  enableControl: async (controlId) => {
    const response = await apiClient.post(MONETARY_ENDPOINTS.CONTROL_ENABLE(controlId));
    return response.data;
  },

  /**
   * Disable control
   */
  disableControl: async (controlId) => {
    const response = await apiClient.post(MONETARY_ENDPOINTS.CONTROL_DISABLE(controlId));
    return response.data;
  },

  // ============================================================================
  // COMPLIANCE MONITORING
  // ============================================================================

  /**
   * Get compliance monitoring data
   */
  getComplianceMonitoring: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.COMPLIANCE);
    return response.data;
  },

  /**
   * Get compliance details
   */
  getComplianceDetails: async (complianceId) => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.COMPLIANCE_DETAILS(complianceId));
    return response.data;
  },

  /**
   * Run compliance check
   */
  runComplianceCheck: async (exporterId, checkType) => {
    const response = await apiClient.post(MONETARY_ENDPOINTS.COMPLIANCE_RUN, { exporterId, checkType });
    return response.data;
  },

  // ============================================================================
  // EXPORT OVERSIGHT
  // ============================================================================

  /**
   * Get export transactions for oversight
   */
  getExportTransactions: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.EXPORTS_TRANSACTIONS);
    return response.data;
  },

  /**
   * Get currency flows
   */
  getCurrencyFlows: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.EXPORTS_CURRENCY);
    return response.data;
  },

  /**
   * Get regulatory reports
   */
  getRegulatoryReports: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.EXPORTS_REPORTS);
    return response.data;
  },

  // ============================================================================
  // SYSTEM ADMINISTRATION
  // ============================================================================

  /**
   * Get system settings
   */
  getSystemSettings: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.ADMIN_SETTINGS);
    return response.data;
  },

  /**
   * Update system settings
   */
  updateSystemSettings: async (settingsData) => {
    const response = await apiClient.put(MONETARY_ENDPOINTS.ADMIN_SETTINGS, settingsData);
    return response.data;
  },

  /**
   * Get audit logs
   */
  getAuditLogs: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.ADMIN_AUDIT);
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get FX statistics
   */
  getFXStatistics: async () => {
    const response = await apiClient.get(FX_ENDPOINTS.FX_STATISTICS);
    return response.data;
  },

  /**
   * Get monetary policy statistics
   */
  getMonetaryStatistics: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.STATISTICS);
    return response.data;
  },

  /**
   * Get compliance statistics
   */
  getComplianceStatistics: async () => {
    const response = await apiClient.get(MONETARY_ENDPOINTS.COMPLIANCE_STATISTICS);
    return response.data;
  },
};

export default monetaryService;
