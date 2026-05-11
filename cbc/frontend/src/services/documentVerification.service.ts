import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface DocumentSubmissionBatch {
  batchId: string;
  submissionReference: string;
  contractReference: string;
  submissionStatus: string;
  totalDocuments: number;
  verifiedDocuments: number;
  rejectedDocuments: number;
  submittedAt: string;
  verificationCompletedAt?: string;
  paymentInitiatedAt?: string;
  verificationProgress: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

export interface DocumentVerification {
  verificationId: string;
  batchId: string;
  documentId: string;
  verifierMemberCode: string;
  verificationStatus: string;
  submissionReference: string;
  contractReference: string;
  submittedAt: string;
  document: {
    documentType: string;
    documentNumber: string;
    issuerMemberCode: string;
    documentHash: string;
    issuerSignature: string;
    blockchainTxId?: string;
    issuedAt: string;
  };
  exporter: {
    name: string;
    tin: string;
  };
}

export interface BatchReadyForPayment {
  batchId: string;
  submissionReference: string;
  contractReference: string;
  exporterId: string;
  exporterName: string;
  exporterTin: string;
  totalDocuments: number;
  verifiedDocuments: number;
  submittedAt: string;
  verificationCompletedAt: string;
  contract: {
    value: number;
    currency: string;
    paymentMethod: string;
    paymentTerms: string;
  };
  buyer: {
    name: string;
    country: string;
  };
}

export interface PaymentInitiation {
  initiationId: string;
  paymentReference: string;
  batchId: string;
  totalDocuments: number;
  paymentAmount: number;
  paymentCurrency: string;
  importerBank: {
    name: string;
    country: string;
    swift: string;
  };
}

/**
 * Submit collected documents for network verification
 */
export const submitDocumentBatch = async (
  contractReference: string,
  documentIds: string[]
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await api.post('/api/document-verification/submit-batch', {
      contractReference,
      documentIds,
    });
    return response.data;
  } catch (error: any) {
    console.error('Submit document batch error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Get all document submission batches for exporter
 */
export const getExporterBatches = async (): Promise<{
  success: boolean;
  batches?: DocumentSubmissionBatch[];
  error?: string;
}> => {
  try {
    const response = await api.get('/api/document-verification/exporter/batches');
    return response.data;
  } catch (error: any) {
    console.error('Get exporter batches error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Get pending document verifications for network member
 */
export const getPendingVerifications = async (): Promise<{
  success: boolean;
  verifications?: DocumentVerification[];
  error?: string;
}> => {
  try {
    const response = await api.get('/api/document-verification/network-member/pending');
    return response.data;
  } catch (error: any) {
    console.error('Get pending verifications error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Verify a document (network member)
 */
export const verifyDocument = async (
  verificationId: string,
  verificationStatus: 'VERIFIED' | 'REJECTED',
  verificationMethod?: string,
  verificationNotes?: string,
  rejectionReason?: string
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await api.post('/api/document-verification/network-member/verify', {
      verificationId,
      verificationStatus,
      verificationMethod,
      verificationNotes,
      rejectionReason,
    });
    return response.data;
  } catch (error: any) {
    console.error('Verify document error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Get batches ready for payment initiation (CBE only)
 */
export const getBatchesReadyForPayment = async (): Promise<{
  success: boolean;
  batches?: BatchReadyForPayment[];
  error?: string;
}> => {
  try {
    const response = await api.get('/api/document-verification/cbe/ready-for-payment');
    return response.data;
  } catch (error: any) {
    console.error('Get batches ready for payment error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

/**
 * Initiate payment (CBE only)
 */
export const initiatePayment = async (
  batchId: string,
  importerBankName: string,
  importerBankCountry: string,
  importerBankSwift: string,
  paymentAmount: number,
  paymentCurrency: string,
  paymentMethod: string,
  paymentTerms: string
): Promise<{ success: boolean; data?: PaymentInitiation; error?: string }> => {
  try {
    const response = await api.post('/api/document-verification/cbe/initiate-payment', {
      batchId,
      importerBankName,
      importerBankCountry,
      importerBankSwift,
      paymentAmount,
      paymentCurrency,
      paymentMethod,
      paymentTerms,
    });
    return response.data;
  } catch (error: any) {
    console.error('Initiate payment error:', error);
    return {
      success: false,
      error: error.response?.data?.error || error.message,
    };
  }
};

export default {
  submitDocumentBatch,
  getExporterBatches,
  getPendingVerifications,
  verifyDocument,
  getBatchesReadyForPayment,
  initiatePayment,
};
