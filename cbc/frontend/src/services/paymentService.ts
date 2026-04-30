import apiClient from './api';

// Use the shared API client which has proper base URL configuration
const api = apiClient;

export interface Payment {
  payment_id: string;
  export_id: string;
  contract_id?: string;
  exporter_id: string;
  buyer_id?: string;
  payment_method: string;
  payment_terms?: string;
  amount: number;
  currency: string;
  exchange_rate?: number;
  amount_etb?: number;
  status: string;
  lc_number?: string;
  lc_issuing_bank?: string;
  lc_advising_bank?: string;
  lc_opening_date?: string;
  lc_expiry_date?: string;
  lc_amount?: number;
  documents_submitted_at?: string;
  documents_approved_at?: string;
  initiated_at: string;
  approved_at?: string;
  completed_at?: string;
  bank_reference?: string;
  nbe_approval_status?: string;
  nbe_approval_date?: string;
  nbe_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDocument {
  document_id: string;
  payment_id: string;
  document_type: string;
  document_name: string;
  document_url?: string;
  document_hash?: string;
  submitted_by: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_status?: string;
  review_notes?: string;
}

export interface PaymentStatistics {
  total_payments: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  total_received: number;
  pending_amount: number;
  avg_processing_days: number;
}

// Exporter Payment Services
export const initiatePayment = async (data: {
  exportId: string;
  contractId?: string;
  buyerId?: string;
  paymentMethod: string;
  paymentTerms?: string;
  amount: number;
  currency?: string;
  exchangeRate?: number;
  lcDetails?: {
    lcNumber?: string;
    issuingBank?: string;
    advisingBank?: string;
    openingDate?: string;
    expiryDate?: string;
    amount?: number;
  };
  notes?: string;
}) => {
  const response = await api.post('/api/payments/initiate', data);
  return response.data;
};

export const getPayments = async (params?: {
  status?: string;
  paymentMethod?: string;
  limit?: number;
  offset?: number;
}) => {
  const response = await api.get('/api/payments', { params });
  return response.data;
};

export const getPaymentDetails = async (paymentId: string) => {
  const response = await api.get(`/api/payments/${paymentId}`);
  return response.data;
};

export const submitPaymentDocuments = async (
  paymentId: string,
  documents: Array<{
    documentType: string;
    documentName: string;
    documentUrl?: string;
    documentHash?: string;
  }>
) => {
  const response = await api.post(`/api/payments/${paymentId}/documents`, { documents });
  return response.data;
};

export const getPaymentStatistics = async () => {
  const response = await api.get('/api/payments/statistics');
  return response.data;
};

// Bank Payment Services
export const getPendingPayments = async () => {
  const response = await api.get('/api/payments/bank/pending-review');
  return response.data;
};

export const openLetterOfCredit = async (
  paymentId: string,
  data: {
    lcNumber: string;
    issuingBank: string;
    advisingBank?: string;
    openingDate?: string;
    expiryDate: string;
    lcAmount?: number;
  }
) => {
  const response = await api.post(`/api/payments/bank/${paymentId}/lc/open`, data);
  return response.data;
};

export const reviewPaymentDocument = async (
  paymentId: string,
  data: {
    documentId: string;
    reviewStatus: string;
    reviewNotes?: string;
  }
) => {
  const response = await api.post(`/api/payments/bank/${paymentId}/documents/review`, data);
  return response.data;
};

export const approvePayment = async (
  paymentId: string,
  data: {
    bankReference?: string;
    notes?: string;
  }
) => {
  const response = await api.post(`/api/payments/bank/${paymentId}/approve`, data);
  return response.data;
};

export const rejectPayment = async (
  paymentId: string,
  data: {
    rejectionReason: string;
  }
) => {
  const response = await api.post(`/api/payments/bank/${paymentId}/reject`, data);
  return response.data;
};

export const processPayment = async (
  paymentId: string,
  data: {
    swiftReference?: string;
    transactionDetails?: {
      fromAccount?: string;
      toAccount?: string;
    };
  }
) => {
  const response = await api.post(`/api/payments/bank/${paymentId}/process`, data);
  return response.data;
};

export const completePayment = async (
  paymentId: string,
  data: {
    transactionReference?: string;
    completionNotes?: string;
  }
) => {
  const response = await api.post(`/api/payments/bank/${paymentId}/complete`, data);
  return response.data;
};

// NBE Payment Services
export const getPendingFXApprovals = async () => {
  const response = await api.get('/api/payments/nbe/pending-fx-approval');
  return response.data;
};

export const approveForeignExchange = async (
  paymentId: string,
  data: {
    exchangeRate: number;
    nbeReference?: string;
    notes?: string;
  }
) => {
  const response = await api.post(`/api/payments/nbe/${paymentId}/fx/approve`, data);
  return response.data;
};

export const rejectForeignExchange = async (
  paymentId: string,
  data: {
    rejectionReason: string;
  }
) => {
  const response = await api.post(`/api/payments/nbe/${paymentId}/fx/reject`, data);
  return response.data;
};

export const getFXStatistics = async () => {
  const response = await api.get('/api/payments/nbe/statistics');
  return response.data;
};

export const getNBEPaymentDetails = async (paymentId: string) => {
  const response = await api.get(`/api/payments/nbe/${paymentId}`);
  return response.data;
};

export default {
  // Exporter
  initiatePayment,
  getPayments,
  getPaymentDetails,
  submitPaymentDocuments,
  getPaymentStatistics,
  // Bank
  getPendingPayments,
  openLetterOfCredit,
  reviewPaymentDocument,
  approvePayment,
  rejectPayment,
  processPayment,
  completePayment,
  // NBE
  getPendingFXApprovals,
  approveForeignExchange,
  rejectForeignExchange,
  getFXStatistics,
  getNBEPaymentDetails,
};
