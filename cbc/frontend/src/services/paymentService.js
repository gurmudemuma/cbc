/**
 * Payment Service
 * Handles payment operations for coffee exports
 * Supports multiple payment methods: LC, TT, CAD, DP, DA, OA
 */

import apiClient from './api';

const paymentService = {
  // ============================================================================
  // EXPORTER OPERATIONS
  // ============================================================================

  /**
   * Initiate a new payment for an export
   */
  initiatePayment: async (paymentData) => {
    const response = await apiClient.post('/api/payments/initiate', paymentData);
    return response.data;
  },

  /**
   * Get all payments for the authenticated exporter
   */
  getPayments: async (filters = {}) => {
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;
    
    const response = await apiClient.get('/api/payments', { params });
    return response.data;
  },

  /**
   * Get detailed payment information
   */
  getPaymentDetails: async (paymentId) => {
    const response = await apiClient.get(`/api/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Submit documents for a payment
   */
  submitDocuments: async (paymentId, documents) => {
    const response = await apiClient.post(`/api/payments/${paymentId}/documents`, { documents });
    return response.data;
  },

  /**
   * Submit documents for a payment (alias)
   */
  submitPaymentDocuments: async (paymentId, documents) => {
    const response = await apiClient.post(`/api/payments/${paymentId}/documents`, { documents });
    return response.data;
  },

  /**
   * Get payment statistics for exporter
   */
  getStatistics: async () => {
    const response = await apiClient.get('/api/payments/statistics');
    return response.data;
  },

  /**
   * Get payment statistics for exporter (alias)
   */
  getPaymentStatistics: async () => {
    const response = await apiClient.get('/api/payments/statistics');
    return response.data;
  },

  // ============================================================================
  // BANK OPERATIONS
  // ============================================================================

  /**
   * Get payments pending bank review
   */
  getPendingReview: async () => {
    const response = await apiClient.get('/api/payments/bank/pending-review');
    return response.data;
  },

  /**
   * Open Letter of Credit
   */
  openLC: async (paymentId, lcData) => {
    const response = await apiClient.post(`/api/payments/bank/${paymentId}/lc/open`, lcData);
    return response.data;
  },

  /**
   * Review a payment document
   */
  reviewDocument: async (paymentId, documentId, reviewData) => {
    const response = await apiClient.post(`/api/payments/bank/${paymentId}/documents/review`, {
      documentId,
      ...reviewData
    });
    return response.data;
  },

  /**
   * Approve a payment
   */
  approvePayment: async (paymentId, approvalData) => {
    const response = await apiClient.post(`/api/payments/bank/${paymentId}/approve`, approvalData);
    return response.data;
  },

  /**
   * Reject a payment
   */
  rejectPayment: async (paymentId, rejectionReason) => {
    const response = await apiClient.post(`/api/payments/bank/${paymentId}/reject`, { rejectionReason });
    return response.data;
  },

  /**
   * Process an approved payment
   */
  processPayment: async (paymentId, processingData) => {
    const response = await apiClient.post(`/api/payments/bank/${paymentId}/process`, processingData);
    return response.data;
  },

  /**
   * Complete a payment
   */
  completePayment: async (paymentId, completionData) => {
    const response = await apiClient.post(`/api/payments/bank/${paymentId}/complete`, completionData);
    return response.data;
  },

  // ============================================================================
  // NBE OPERATIONS
  // ============================================================================

  /**
   * Get payments pending FX approval
   */
  getPendingFXApproval: async () => {
    const response = await apiClient.get('/api/payments/nbe/pending-fx-approval');
    return response.data;
  },

  /**
   * Approve foreign exchange for a payment
   */
  approveFX: async (paymentId, fxData) => {
    const response = await apiClient.post(`/api/payments/nbe/${paymentId}/fx/approve`, fxData);
    return response.data;
  },

  /**
   * Reject foreign exchange for a payment
   */
  rejectFX: async (paymentId, rejectionReason) => {
    const response = await apiClient.post(`/api/payments/nbe/${paymentId}/fx/reject`, { rejectionReason });
    return response.data;
  },

  /**
   * Get FX approval statistics
   */
  getFXStatistics: async () => {
    const response = await apiClient.get('/api/payments/nbe/statistics');
    return response.data;
  },

  /**
   * Get payment details for NBE review
   */
  getPaymentForNBE: async (paymentId) => {
    const response = await apiClient.get(`/api/payments/nbe/${paymentId}`);
    return response.data;
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get payment status badge color
   */
  getStatusColor: (status) => {
    const statusColors = {
      'INITIATED': 'info',
      'DOCUMENTS_SUBMITTED': 'warning',
      'UNDER_REVIEW': 'warning',
      'APPROVED': 'success',
      'PROCESSING': 'info',
      'COMPLETED': 'success',
      'FAILED': 'error',
      'DISPUTED': 'error'
    };
    return statusColors[status] || 'default';
  },

  /**
   * Get payment method display name
   */
  getPaymentMethodName: (method) => {
    const methods = {
      'LC': 'Letter of Credit',
      'TT': 'Telegraphic Transfer',
      'CAD': 'Cash Against Documents',
      'DP': 'Documents Against Payment',
      'DA': 'Documents Against Acceptance',
      'OA': 'Open Account'
    };
    return methods[method] || method;
  },

  /**
   * Format currency amount
   */
  formatAmount: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
};

export default paymentService;
