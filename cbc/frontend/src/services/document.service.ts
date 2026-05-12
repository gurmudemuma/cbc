/**
 * Document Service
 * Handles document issuance and management operations
 * Last updated: 2026-05-06
 */

interface DocumentRequest {
  requestId: string;
  exporterId: string;
  exporterName: string;
  exporterTin: string;
  exporterEmail: string;
  documentType: string;
  requestedAt: string;
  status: string;
  exporterQualification: any;
  requiredData?: Record<string, any>;
}

interface IssueDocumentData {
  requestId: string;
  exporterId: string;
  documentType: string;
  documentNumber: string;
  documentMetadata: Record<string, any>;
  expiryDate?: string;
}

interface RejectRequestData {
  rejectionReason: string;
}

class DocumentService {
  private baseUrl = '/api';

  async getPendingRequests(): Promise<{ success: boolean; requests: DocumentRequest[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/exporter/documents/issuance/document-requests/pending`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, requests: data.data || [] };
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      throw error;
    }
  }

  async issueDocument(issueData: IssueDocumentData): Promise<{ success: boolean; document?: any }> {
    try {
      // Generate a simple PDF document as base64
      const documentFile = this.generateSimplePDF(issueData);

      const response = await fetch(`${this.baseUrl}/exporter/documents/issuance/documents/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...issueData,
          documentFile: documentFile
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, document: data.data };
    } catch (error) {
      console.error('Error issuing document:', error);
      throw error;
    }
  }

  async rejectRequest(requestId: string, rejectData: RejectRequestData): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/exporter/documents/issuance/document-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(rejectData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error rejecting request:', error);
      throw error;
    }
  }

  async getRegisteredContracts(): Promise<{ success: boolean; registeredContracts?: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/exporter/documents/registered-contracts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        // Return empty array instead of throwing error
        console.warn('Could not fetch registered contracts, returning empty array');
        return { success: true, registeredContracts: [] };
      }

      const data = await response.json();
      return { success: true, registeredContracts: data.data || [] };
    } catch (error) {
      console.error('Error fetching registered contracts:', error);
      // Return empty array instead of throwing
      return { success: true, registeredContracts: [] };
    }
  }

  async getMyDocumentRequests(): Promise<{ success: boolean; requests?: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/exporter/documents/requests`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        // Return empty array instead of throwing error
        console.warn('Could not fetch document requests, returning empty array');
        return { success: true, requests: [] };
      }

      const data = await response.json();
      return { success: true, requests: data.data || [] };
    } catch (error) {
      console.error('Error fetching document requests:', error);
      // Return empty array instead of throwing
      return { success: true, requests: [] };
    }
  }

  async getDocumentRequestBatches(): Promise<{ success: boolean; batches?: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/exporter/documents/request-batches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        // Return empty array instead of throwing error
        console.warn('Could not fetch document request batches, returning empty array');
        return { success: true, batches: [] };
      }

      const data = await response.json();
      return { success: true, batches: data.data || [] };
    } catch (error) {
      console.error('Error fetching document request batches:', error);
      // Return empty array instead of throwing
      return { success: true, batches: [] };
    }
  }

  async getCollectionStatus(): Promise<{ success: boolean; data?: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/exporter/documents/collection-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        // Return default status instead of throwing error
        console.warn('Could not fetch collection status, returning default');
        return {
          success: true,
          data: {
            completionPercentage: 0,
            totalRequired: 12,
            issued: 0,
            pending: 0,
            underReview: 0,
            rejected: 0,
            recentActivities: [],
            documents: [],
            pendingDocuments: 0,
            issuedDocuments: 0,
            requiredDocuments: 12,
            canSubmitToNetwork: false,
            isComplete: false,
          }
        };
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching collection status:', error);
      // Return default status instead of throwing
      return {
        success: true,
        data: {
          completionPercentage: 0,
          totalRequired: 12,
          issued: 0,
          pending: 0,
          underReview: 0,
          rejected: 0,
          recentActivities: [],
          documents: [],
          pendingDocuments: 0,
          issuedDocuments: 0,
          requiredDocuments: 12,
          canSubmitToNetwork: false,
          isComplete: false,
        }
      };
    }
  }

  private generateSimplePDF(issueData: IssueDocumentData): string {
    // Generate a simple PDF document as base64
    // This is a minimal PDF structure for demonstration
    try {
      const documentNumber = issueData.documentNumber.replace(/[()]/g, '');
      const documentType = issueData.documentType.replace(/[()]/g, '');
      const exporterId = issueData.exporterId.replace(/[()]/g, '');
      const currentDate = new Date().toLocaleDateString();
      
      const pdfContent = '%PDF-1.4\n' +
        '1 0 obj\n' +
        '<<\n' +
        '/Type /Catalog\n' +
        '/Pages 2 0 R\n' +
        '>>\n' +
        'endobj\n\n' +
        '2 0 obj\n' +
        '<<\n' +
        '/Type /Pages\n' +
        '/Kids [3 0 R]\n' +
        '/Count 1\n' +
        '>>\n' +
        'endobj\n\n' +
        '3 0 obj\n' +
        '<<\n' +
        '/Type /Page\n' +
        '/Parent 2 0 R\n' +
        '/MediaBox [0 0 612 792]\n' +
        '/Contents 4 0 R\n' +
        '/Resources <<\n' +
        '/Font <<\n' +
        '/F1 5 0 R\n' +
        '>>\n' +
        '>>\n' +
        '>>\n' +
        'endobj\n\n' +
        '4 0 obj\n' +
        '<<\n' +
        '/Length 200\n' +
        '>>\n' +
        'stream\n' +
        'BT\n' +
        '/F1 12 Tf\n' +
        '50 750 Td\n' +
        '(Document Number: ' + documentNumber + ') Tj\n' +
        '0 -20 Td\n' +
        '(Document Type: ' + documentType + ') Tj\n' +
        '0 -20 Td\n' +
        '(Issued Date: ' + currentDate + ') Tj\n' +
        '0 -20 Td\n' +
        '(Exporter ID: ' + exporterId + ') Tj\n' +
        'ET\n' +
        'endstream\n' +
        'endobj\n\n' +
        '5 0 obj\n' +
        '<<\n' +
        '/Type /Font\n' +
        '/Subtype /Type1\n' +
        '/BaseFont /Helvetica\n' +
        '>>\n' +
        'endobj\n\n' +
        'xref\n' +
        '0 6\n' +
        '0000000000 65535 f \n' +
        '0000000010 00000 n \n' +
        '0000000053 00000 n \n' +
        '0000000110 00000 n \n' +
        '0000000251 00000 n \n' +
        '0000000504 00000 n \n' +
        'trailer\n' +
        '<<\n' +
        '/Size 6\n' +
        '/Root 1 0 R\n' +
        '>>\n' +
        'startxref\n' +
        '581\n' +
        '%%EOF';

      return btoa(pdfContent);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Return a simple base64 string as fallback
      return btoa('Simple PDF document');
    }
  }

  getDocumentTypeLabel(documentType: string): string {
    const labels: Record<string, string> = {
      'EXPORT_LICENSE': 'Export License',
      'PHYTOSANITARY_CERTIFICATE': 'Phytosanitary Certificate',
      'HEALTH_CERTIFICATE': 'Health Certificate',
      'QUALITY_CERTIFICATE': 'Quality Certificate',
      'CERTIFICATE_OF_ORIGIN': 'Certificate of Origin',
      'PAYMENT_CERTIFICATE': 'Payment Certificate',
      'FX_APPROVAL_CERTIFICATE': 'FX Approval Certificate',
      'CUSTOMS_CLEARANCE_CERTIFICATE': 'Customs Clearance Certificate',
      'TRADE_LICENSE': 'Trade License',
      'INVESTMENT_CERTIFICATE': 'Investment Certificate',
      'ENVIRONMENTAL_COMPLIANCE_CERTIFICATE': 'Environmental Compliance Certificate',
      'QUALITY_STANDARDS_CERTIFICATE': 'Quality Standards Certificate',
      'FINANCIAL_COMPLIANCE_CERTIFICATE': 'Financial Compliance Certificate',
    };

    return labels[documentType] || documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

const documentService = new DocumentService();
export default documentService;