/**
 * Lot Service
 * Handles coffee lot management, verification, and grading for ECX
 */

import apiClient from './api';

const lotService = {
  // ============================================================================
  // LOT MANAGEMENT
  // ============================================================================

  /**
   * Get all coffee lots
   */
  getAllLots: async (filter = null) => {
    const params = filter ? { status: filter } : {};
<<<<<<< HEAD
    const response = await apiClient.get('/lots', { params });
=======
    const response = await apiClient.get('/api/lots', { params });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get lot details
   */
  getLotDetails: async (lotId) => {
    const response = await apiClient.get(`/api/lots/${lotId}`);
    return response.data;
  },

  /**
   * Create new lot
   */
  createLot: async (lotData) => {
<<<<<<< HEAD
    const response = await apiClient.post('/lots', lotData);
=======
    const response = await apiClient.post('/api/lots', lotData);
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Update lot information
   */
  updateLot: async (lotId, lotData) => {
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
<<<<<<< HEAD
    const response = await apiClient.get('/lots/pending');
=======
    const response = await apiClient.get('/api/lots/pending');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Verify lot
   */
  verifyLot: async (lotId, verificationData) => {
    const response = await apiClient.post(`/api/lots/${lotId}/verify`, verificationData);
    return response.data;
  },

  /**
   * Reject lot
   */
  rejectLot: async (lotId, rejectionReason) => {
    const response = await apiClient.post(`/api/lots/${lotId}/reject`, { reason: rejectionReason });
    return response.data;
  },

  // ============================================================================
  // LOT GRADING
  // ============================================================================

  /**
   * Grade lot
   */
  gradeLot: async (lotId, gradeData) => {
    const response = await apiClient.post(`/api/lots/${lotId}/grade`, gradeData);
    return response.data;
  },

  /**
   * Get grading history
   */
  getGradingHistory: async (lotId) => {
    const response = await apiClient.get(`/api/lots/${lotId}/grading-history`);
    return response.data;
  },

  /**
   * Get grade standards
   */
  getGradeStandards: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/lots/grade-standards');
=======
    const response = await apiClient.get('/api/lots/grade-standards');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // TRADING OPERATIONS
  // ============================================================================

  /**
   * Get active trading lots
   */
  getActiveTradingLots: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/trading/active');
=======
    const response = await apiClient.get('/api/trading/active');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get price discovery data
   */
  getPriceDiscovery: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/trading/prices');
=======
    const response = await apiClient.get('/api/trading/prices');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get market reports
   */
  getMarketReports: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/trading/reports');
=======
    const response = await apiClient.get('/api/trading/reports');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get trading history
   */
  getTradingHistory: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/trading/history');
=======
    const response = await apiClient.get('/api/trading/history');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // WAREHOUSE MANAGEMENT
  // ============================================================================

  /**
   * Get warehouse receipts
   */
  getWarehouseReceipts: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/warehouse/receipts');
=======
    const response = await apiClient.get('/api/warehouse/receipts');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get storage monitoring data
   */
  getStorageMonitoring: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/warehouse/storage');
=======
    const response = await apiClient.get('/api/warehouse/storage');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get warehouse quality control
   */
  getWarehouseQuality: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/warehouse/quality');
=======
    const response = await apiClient.get('/api/warehouse/quality');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get inventory reports
   */
  getInventoryReports: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/warehouse/inventory');
=======
    const response = await apiClient.get('/api/warehouse/inventory');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  // ============================================================================
  // EXPORT VERIFICATION
  // ============================================================================

  /**
   * Get exports pending ECX verification
   */
  getPendingExportVerification: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/exports/pending');
=======
    const response = await apiClient.get('/api/exports/pending');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Verify export
   */
  verifyExport: async (exportId, verificationData) => {
    const response = await apiClient.post(`/api/exports/${exportId}/verify`, verificationData);
    return response.data;
  },

  /**
   * Reject export
   */
  rejectExport: async (exportId, rejectionReason) => {
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
<<<<<<< HEAD
    const response = await apiClient.get('/lots/statistics');
=======
    const response = await apiClient.get('/api/lots/statistics');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get trading statistics
   */
  getTradingStatistics: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/trading/statistics');
=======
    const response = await apiClient.get('/api/trading/statistics');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },

  /**
   * Get warehouse statistics
   */
  getWarehouseStatistics: async () => {
<<<<<<< HEAD
    const response = await apiClient.get('/warehouse/statistics');
=======
    const response = await apiClient.get('/api/warehouse/statistics');
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    return response.data;
  },
};

export default lotService;
