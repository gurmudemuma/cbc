/**
 * Document Service
 * Handles document request, issuance, and collection workflows
 */

import apiClient from './api';

interface RequestDocumentData {
  networkMemberCode: string;
  documentType: string;
  requestNotes?: string;
}

interface IssueDocumentData {
  requestId: string;
  exporterId: string;
  documentType: string;
  documentNumber: string;
  documentMetadata?: Record<string, any>;
  expiryDate?: string;
  documentFile?: string; // base64 encoded PDF
}

interface RejectRequestData {
  rejectionReason: string;
}

const documentService = {
  // ============================================================================
  // EXPORTER ENDPOINTS - Document Requests
  // ============================================================================

  /**
   * Request a document from a network member
   */
  requestDocument: async (data: { networkMemberCode: string; documentType: string; requestNotes?: string }) => {
    const response = await apiClient.post('/api/exporter/documents/request', {
      networkMemberCode: data.networkMemberCode,
      documentType: data.documentType,
      requestNotes: data.requestNotes
    });
    return response.data;
  },

  /**
   * Request all export documents at once (bulk request)
   */
  requestAllDocuments: async (contractId: string, shipmentDetails?: Record<string, any>) => {
    const response = await apiClient.post('/api/exporter/documents/request-all', {
      contractId,
      shipmentDetails
    });
    return response.data;
  },

  /**
   * Get all required documents with their status
   */
  getRequiredDocuments: async () => {
    const response = await apiClient.get('/api/exporter/documents/required');
    return response.data;
  },

  /**
   * Get all document requests for the logged-in exporter
   */
  getDocumentRequests: async (status?: string) => {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/api/exporter/documents/requests${params}`);
    return response.data;
  },

  /**
   * Get issued documents for the logged-in exporter
   */
  getIssuedDocuments: async () => {
    const response = await apiClient.get('/api/exporter/documents');
    return response.data;
  },

  /**
   * Get documents for a specific submission
   */
  getDocumentsBySubmission: async (submissionId: string) => {
    const response = await apiClient.get(`/api/exporter/documents/by-submission/${submissionId}`);
    return response.data;
  },

  /**
   * Get document collection status
   */
  getCollectionStatus: async () => {
    const response = await apiClient.get('/api/exporter/documents/collection-status');
    return response.data;
  },

  /**
   * Download an issued document
   */
  downloadDocument: async (documentId: string, documentNumber?: string) => {
    const response = await apiClient.get(`/api/exporter/documents/${documentId}/download`, {
      responseType: 'blob',
    });

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${documentNumber || documentId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return response.data;
  },

  // ============================================================================
  // NETWORK MEMBER ENDPOINTS - Document Issuance
  // ============================================================================

  /**
   * Get pending document requests for a network member
   */
  getPendingRequests: async () => {
    const response = await apiClient.get('/api/network-member/document-requests/pending');
    return response.data;
  },

  /**
   * Issue a document to an exporter
   */
  issueDocument: async (data: IssueDocumentData) => {
    const response = await apiClient.post('/api/network-member/documents/issue', data);
    return response.data;
  },

  /**
   * Reject a document request
   */
  rejectRequest: async (requestId: string, data: RejectRequestData) => {
    const response = await apiClient.post(
      `/api/network-member/document-requests/${requestId}/reject`,
      data
    );
    return response.data;
  },

  /**
   * Get issued documents by network member
   */
  getIssuedDocumentsByMember: async (memberCode?: string) => {
    const params = memberCode ? `?memberCode=${memberCode}` : '';
    const response = await apiClient.get(`/api/network-member/documents/issued${params}`);
    return response.data;
  },

  /**
   * Revoke an issued document
   */
  revokeDocument: async (documentId: string, revocationReason: string) => {
    const response = await apiClient.post(`/api/network-member/documents/${documentId}/revoke`, {
      revocationReason,
    });
    return response.data;
  },

  // ============================================================================
  // NETWORK MEMBER ENDPOINTS - Document Authentication
  // ============================================================================

  /**
   * Authenticate a document during Network Submission
   */
  authenticateDocument: async (submissionId: string, documentId: string, authenticationStatus: string) => {
    const response = await apiClient.post('/api/network/authenticate-document', {
      submissionId,
      documentId,
      authenticationStatus,
    });
    return response.data;
  },

  /**
   * Get authentication status for a submission
   */
  getAuthenticationStatus: async (submissionId: string) => {
    const response = await apiClient.get(`/api/network/submissions/${submissionId}/authentications`);
    return response.data;
  },

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get document type label
   */
  getDocumentTypeLabel: (documentType: string): string => {
    const labels: Record<string, string> = {
      EXPORT_LICENSE: 'Export License',
      PHYTOSANITARY_CERTIFICATE: 'Phytosanitary Certificate',
      HEALTH_CERTIFICATE: 'Health Certificate',
      FUMIGATION_CERTIFICATE: 'Fumigation Certificate',
      QUALITY_CERTIFICATE: 'Quality Certificate',
      CERTIFICATE_OF_ORIGIN: 'Certificate of Origin',
      BANK_GUARANTEE: 'Bank Guarantee',
      SHIPPING_BOOKING: 'Shipping Booking',
      CUSTOMS_CLEARANCE: 'Customs Clearance',
    };
    return labels[documentType] || documentType;
  },

  /**
   * Get network member name
   */
  getNetworkMemberName: (memberCode: string): string => {
    const names: Record<string, string> = {
      ECTA: 'Ethiopian Coffee & Tea Authority',
      MOA: 'Ministry of Agriculture',
      MOH: 'Ministry of Health',
      ECX: 'Ethiopian Commodity Exchange',
      BANK: 'Commercial Bank',
      SHIPPING: 'Shipping Line',
      ERCA: 'Ethiopian Revenue & Customs Authority',
    };
    return names[memberCode] || memberCode;
  },
};

export { documentService };
export default documentService;
