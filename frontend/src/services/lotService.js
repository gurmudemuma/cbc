/**
 * Lot Service
 * Handles coffee lot management, verification, and grading for ECX
 * 
 * UPDATED: Now uses shared endpoint constants for consistency
 */

import apiClient from './api';
import { LOT_ENDPOINTS, TRADING_ENDPOINTS, WAREHOUSE_ENDPOINTS, EXPORT_VERIFICATION_ENDPOINTS } from '../../../api/shared/api-endpoints.constants';

const lotService = {
  // ============================================================================
  // LOT MANAGEMENT
  // ============================================================================

  /**
   * Get all coffee lots
   */
  getAllLots: async (filter = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get(LOT_ENDPOINTS.LOTS, { params });
    return response.data;
  },

  /**
   * Get lot details
   */
  getLotDetails: async (lotId) => {
    const response = await apiClient.get(LOT_ENDPOINTS.LOT_DETAILS(lotId));
    return response.data;
  },

  /**
   * Create new lot
   */
  createLot: async (lotData) => {
    const response = await apiClient.post(LOT_ENDPOINTS.LOT_CREATE, lotData);
    return response.data;
  },

  /**
   * Update lot information
   */
  updateLot: async (lotId, lotData) => {
    const response = await apiClient.put(LOT_ENDPOINTS.LOT_UPDATE(lotId), lotData);
    return response.data;
  },

  // ============================================================================
  // LOT VERIFICATION
  // ============================================================================

  /**
   * Get lots pending verification
   */
  getPendingVerification: async () => {
    const response = await apiClient.get(LOT_ENDPOINTS.LOTS_PENDING);
    return response.data;
  },

  /**
   * Verify lot
   */
  verifyLot: async (lotId, verificationData) => {
    const response = await apiClient.post(LOT_ENDPOINTS.LOT_VERIFY(lotId), verificationData);
    return response.data;
  },

  /**
   * Reject lot
   */
  rejectLot: async (lotId, rejectionReason) => {
    const response = await apiClient.post(LOT_ENDPOINTS.LOT_REJECT(lotId), { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // LOT GRADING
  // ============================================================================

  /**
   * Grade lot
   */
  gradeLot: async (lotId, gradeData) => {
    const response = await apiClient.post(LOT_ENDPOINTS.LOT_GRADE(lotId), gradeData);
    return response.data;
  },

  /**
   * Get grading history
   */
  getGradingHistory: async (lotId) => {
    const response = await apiClient.get(LOT_ENDPOINTS.LOT_GRADING_HISTORY(lotId));
    return response.data;
  },

  /**
   * Get grade standards
   */
  getGradeStandards: async () => {
    const response = await apiClient.get(LOT_ENDPOINTS.GRADE_STANDARDS);
    return response.data;
  },

  // ============================================================================
  // TRADING OPERATIONS
  // ============================================================================

  /**
   * Get active trading lots
   */
  getActiveTradingLots: async () => {
    const response = await apiClient.get(TRADING_ENDPOINTS.ACTIVE);
    return response.data;
  },

  /**
   * Get price discovery data
   */
  getPriceDiscovery: async () => {
    const response = await apiClient.get(TRADING_ENDPOINTS.PRICES);
    return response.data;
  },

  /**
   * Get market reports
   */
  getMarketReports: async () => {
    const response = await apiClient.get(TRADING_ENDPOINTS.REPORTS);
    return response.data;
  },

  /**
   * Get trading history
   */
  getTradingHistory: async () => {
    const response = await apiClient.get(TRADING_ENDPOINTS.HISTORY);
    return response.data;
  },

  // ============================================================================
  // WAREHOUSE MANAGEMENT
  // ============================================================================

  /**
   * Get warehouse receipts
   */
  getWarehouseReceipts: async () => {
    const response = await apiClient.get(WAREHOUSE_ENDPOINTS.RECEIPTS);
    return response.data;
  },

  /**
   * Get storage monitoring data
   */
  getStorageMonitoring: async () => {
    const response = await apiClient.get(WAREHOUSE_ENDPOINTS.STORAGE);
    return response.data;
  },

  /**
   * Get warehouse quality control
   */
  getWarehouseQuality: async () => {
    const response = await apiClient.get(WAREHOUSE_ENDPOINTS.QUALITY);
    return response.data;
  },

  /**
   * Get inventory reports
   */
  getInventoryReports: async () => {
    const response = await apiClient.get(WAREHOUSE_ENDPOINTS.INVENTORY);
    return response.data;
  },

  // ============================================================================
  // EXPORT VERIFICATION
  // ============================================================================

  /**
   * Get exports pending ECX verification
   */
  getPendingExportVerification: async () => {
    const response = await apiClient.get(EXPORT_VERIFICATION_ENDPOINTS.EXPORTS_PENDING);
    return response.data;
  },

  /**
   * Verify export
   */
  verifyExport: async (exportId, verificationData) => {
    const response = await apiClient.post(EXPORT_VERIFICATION_ENDPOINTS.EXPORT_VERIFY(exportId), verificationData);
    return response.data;
  },

  /**
   * Reject export
   */
  rejectExport: async (exportId, rejectionReason) => {
    const response = await apiClient.post(EXPORT_VERIFICATION_ENDPOINTS.EXPORT_REJECT(exportId), { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get lot statistics
   */
  getLotStatistics: async () => {
    const response = await apiClient.get(LOT_ENDPOINTS.LOT_STATISTICS);
    return response.data;
  },

  /**
   * Get trading statistics
   */
  getTradingStatistics: async () => {
    const response = await apiClient.get(TRADING_ENDPOINTS.STATISTICS);
    return response.data;
  },

  /**
   * Get warehouse statistics
   */
  getWarehouseStatistics: async () => {
    const response = await apiClient.get(WAREHOUSE_ENDPOINTS.STATISTICS);
    return response.data;
  },
};

export default lotService;
