import { apiClient } from './api';

export interface ContractDraft {
  draft_id: string;
  contract_number: string;
  version: number;
  status: 'DRAFT' | 'COUNTERED' | 'ACCEPTED' | 'REJECTED' | 'FINALIZED';
  buyer_id: string;
  buyer_name: string;
  exporter_id: string;
  exporter_name: string;
  coffee_type: string;
  origin_region: string;
  quantity: number;
  unit_price: number;
  currency: string;
  total_value: number;
  payment_terms: string;
  payment_method: string;
  incoterms: string;
  delivery_date: string;
  port_of_loading: string;
  port_of_discharge: string;
  governing_law: string;
  arbitration_location: string;
  arbitration_rules: string;
  quality_grade: string;
  special_conditions: string;
  certifications_required: string[];
  proposed_by: string;
  proposed_by_type: 'EXPORTER' | 'BUYER';
  responded_by?: string;
  responded_by_type?: 'EXPORTER' | 'BUYER';
  responded_at?: string;
  finalized_contract_id?: string;
  created_at: string;
  updated_at: string;
}

export interface NegotiationActivity {
  negotiation_id: string;
  draft_id: string;
  actor_id: string;
  actor_type: 'EXPORTER' | 'BUYER';
  action_type: 'CREATE' | 'COUNTER' | 'ACCEPT' | 'REJECT';
  message: string;
  changes_made?: Record<string, any>;
  created_at: string;
}

export interface CreateDraftRequest {
  buyerId: string;
  coffeeType: string;
  originRegion: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  paymentTerms: string;
  paymentMethod: string;
  incoterms: string;
  deliveryDate: string;
  portOfLoading: string;
  portOfDischarge: string;
  governingLaw: string;
  arbitrationLocation: string;
  arbitrationRules: string;
  qualityGrade: string;
  specialConditions: string;
  certificationsRequired: string[];
}

export interface CounterOfferRequest {
  updates: Partial<CreateDraftRequest>;
  notes: string;
}

class SalesContractService {
  private baseUrl = '/api/contracts';
  private token = localStorage.getItem('token');

  private async request(method: string, endpoint: string, body?: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  /**
   * Create a new contract draft
   */
  async createDraft(data: CreateDraftRequest): Promise<{ draft: ContractDraft }> {
    return this.request('POST', '/drafts', data);
  }

  /**
   * Get a specific draft by ID
   */
  async getDraft(draftId: string): Promise<ContractDraft> {
    return this.request('GET', `/drafts/${draftId}`);
  }

  /**
   * List all drafts for an exporter
   */
  async listExporterDrafts(exporterId: string): Promise<{ drafts: ContractDraft[] }> {
    return this.request('GET', `/drafts/exporter/${exporterId}`);
  }

  /**
   * Submit a counter offer
   */
  async submitCounterOffer(draftId: string, data: CounterOfferRequest): Promise<{ draft: ContractDraft }> {
    return this.request('POST', `/drafts/${draftId}/counter`, data);
  }

  /**
   * Accept a contract draft
   */
  async acceptDraft(draftId: string): Promise<{ draft: ContractDraft }> {
    return this.request('POST', `/drafts/${draftId}/accept`, {});
  }

  /**
   * Reject a contract draft
   */
  async rejectDraft(draftId: string, reason: string): Promise<{ draft: ContractDraft }> {
    return this.request('POST', `/drafts/${draftId}/reject`, { reason });
  }

  /**
   * Get negotiation history for a draft
   */
  async getNegotiationHistory(draftId: string): Promise<{ history: NegotiationActivity[] }> {
    return this.request('GET', `/drafts/${draftId}/history`);
  }

  /**
   * Finalize contract to blockchain
   */
  async finalizeDraft(draftId: string): Promise<{ draft: ContractDraft; blockchainContractId: string }> {
    return this.request('POST', `/drafts/${draftId}/finalize`, {});
  }

  /**
   * Download certificate PDF
   */
  async downloadCertificate(draftId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/drafts/${draftId}/certificate`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download certificate');
    }

    return response.blob();
  }

  /**
   * Get legal frameworks
   */
  async getLegalFrameworks(): Promise<{ frameworks: any[] }> {
    return this.request('GET', '/../legal/frameworks');
  }

  /**
   * Get contract clauses by type
   */
  async getContractClauses(type: string): Promise<{ clauses: any[] }> {
    return this.request('GET', `/../legal/clauses?type=${type}`);
  }
}

export const salesContractService = new SalesContractService();
