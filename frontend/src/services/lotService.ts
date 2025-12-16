/**
 * Lot Service
 * Handles coffee lot management, verification, and grading for ECX
 */

import apiClient from './api';

interface LotData {
  [key: string]: any;
}

interface VerificationData {
  [key: string]: any;
}

interface GradeData {
  [key: string]: any;
}

const lotService = {
  // ============================================================================
  // LOT MANAGEMENT
  // ============================================================================

  /**
   * Get all coffee lots
   */
  getAllLots: async (filter: string | null = null) => {
    const params = filter ? { status: filter } : {};
    const response = await apiClient.get('/api/lots', { params });
    return response.data;
  },

  /**
   * Get lot details
   */
  getLotDetails: async (lotId: string) => {
    const response = await apiClient.get(`/api/lots/${lotId}`);
    return response.data;
  },

  /**
   * Create new lot
   */
  createLot: async (lotData: LotData) => {
    const response = await apiClient.post('/api/lots', lotData);
    return response.data;
  },

  /**
   * Update lot information
   */
  updateLot: async (lotId: string, lotData: LotData) => {
    const response = await apiClient.put(`/api/lots/${lotId}`, lotData);
    return response.data;
  },

  // ============================================================================
  // LOT VERIFICATION
  // ============================================================================

  /**
   * Get lots pending verification
   */
  getPendingVerification: async () => {
    const response = await apiClient.get('/api/lots/pending');
    return response.data;
  },

  /**
   * Verify lot
   */
  verifyLot: async (lotId: string, verificationData: VerificationData) => {
    const response = await apiClient.post(`/api/lots/${lotId}/verify`, verificationData);
    return response.data;
  },

  /**
   * Reject lot
   */
  rejectLot: async (lotId: string, rejectionReason: string) => {
    const response = await apiClient.post(`/api/lots/${lotId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // LOT GRADING
  // ============================================================================

  /**
   * Grade lot
   */
  gradeLot: async (lotId: string, gradeData: GradeData) => {
    const response = await apiClient.post(`/api/lots/${lotId}/grade`, gradeData);
    return response.data;
  },

  /**
   * Get grading history
   */
  getGradingHistory: async (lotId: string) => {
    const response = await apiClient.get(`/api/lots/${lotId}/grading-history`);
    return response.data;
  },

  /**
   * Get grade standards
   */
  getGradeStandards: async () => {
    const response = await apiClient.get('/api/lots/grade-standards');
    return response.data;
  },

  // ============================================================================
  // TRADING OPERATIONS
  // ============================================================================

  /**
   * Get active trading lots
   */
  getActiveTradingLots: async () => {
    const response = await apiClient.get('/api/trading/active');
    return response.data;
  },

  /**
   * Get price discovery data
   */
  getPriceDiscovery: async () => {
    const response = await apiClient.get('/api/trading/prices');
    return response.data;
  },

  /**
   * Get market reports
   */
  getMarketReports: async () => {
    const response = await apiClient.get('/api/trading/reports');
    return response.data;
  },

  /**
   * Get trading history
   */
  getTradingHistory: async () => {
    const response = await apiClient.get('/api/trading/history');
    return response.data;
  },

  // ============================================================================
  // WAREHOUSE MANAGEMENT
  // ============================================================================

  /**
   * Get warehouse receipts
   */
  getWarehouseReceipts: async () => {
    const response = await apiClient.get('/api/warehouse/receipts');
    return response.data;
  },

  /**
   * Get storage monitoring data
   */
  getStorageMonitoring: async () => {
    const response = await apiClient.get('/api/warehouse/storage');
    return response.data;
  },

  /**
   * Get warehouse quality control
   */
  getWarehouseQuality: async () => {
    const response = await apiClient.get('/api/warehouse/quality');
    return response.data;
  },

  /**
   * Get inventory reports
   */
  getInventoryReports: async () => {
    const response = await apiClient.get('/api/warehouse/inventory');
    return response.data;
  },

  // ============================================================================
  // EXPORT VERIFICATION
  // ============================================================================

  /**
   * Get exports pending ECX verification
   */
  getPendingExportVerification: async () => {
    const response = await apiClient.get('/api/exports/pending');
    return response.data;
  },

  /**
   * Verify export
   */
  verifyExport: async (exportId: string, verificationData: VerificationData) => {
    const response = await apiClient.post(`/api/exports/${exportId}/verify`, verificationData);
    return response.data;
  },

  /**
   * Reject export
   */
  rejectExport: async (exportId: string, rejectionReason: string) => {
    const response = await apiClient.post(`/api/exports/${exportId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get lot statistics
   */
  getLotStatistics: async () => {
    const response = await apiClient.get('/api/lots/statistics');
    return response.data;
  },

  /**
   * Get trading statistics
   */
  getTradingStatistics: async () => {
    const response = await apiClient.get('/api/trading/statistics');
    return response.data;
  },

  /**
   * Get warehouse statistics
   */
  getWarehouseStatistics: async () => {
    const response = await apiClient.get('/api/warehouse/statistics');
    return response.data;
  },
};

export default lotService;
