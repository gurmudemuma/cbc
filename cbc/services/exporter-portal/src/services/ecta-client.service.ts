/**
 * ECTA Client Service
 * Handles communication with ECTA (Ethiopian Coffee and Tea Authority) API
 */

import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../../../shared/logger';
import { ContractDraft } from '../types/contract.types';

const logger = createLogger('ECTAClientService');

export interface ECTAConfig {
  apiUrl: string;
  apiKey: string;
  timeout: number;
}

export interface ECTARegistrationRequest {
  contract_id: string;
  exporter_id: string;
  buyer_email: string;
  coffee_type: string;
  quantity_bags: number;
  unit_price: number;
  currency: string;
  payment_terms: string;
  delivery_location: string;
  delivery_date: string;
  blockchain_tx_hash: string;
}

export interface ECTARegistrationResponse {
  reference_number: string;
  registration_timestamp: Date;
  status: 'REGISTERED' | 'PENDING' | 'REJECTED';
  message?: string;
}

export class ECTAClientService {
  private config: ECTAConfig;
  private client: AxiosInstance;

  constructor(config?: ECTAConfig) {
    this.config = config || this.getDefaultConfig();
    this.client = this.initializeClient();
  }

  /**
   * Get default ECTA configuration from environment
   */
  private getDefaultConfig(): ECTAConfig {
    return {
      apiUrl: process.env.ECTA_API_URL || 'https://api.ecta.gov.et',
      apiKey: process.env.ECTA_API_KEY || '',
      timeout: parseInt(process.env.ECTA_TIMEOUT || '30000', 10),
    };
  }

  /**
   * Initialize axios client
   */
  private initializeClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
  }

  /**
   * Register contract with ECTA
   */
  async registerContract(contract: ContractDraft, blockchainTxHash: string): Promise<ECTARegistrationResponse> {
    try {
      logger.info(`Registering contract with ECTA: ${contract.draft_id}`);

      const request: ECTARegistrationRequest = {
        contract_id: contract.draft_id,
        exporter_id: contract.exporter_id,
        buyer_email: contract.buyer_email,
        coffee_type: contract.coffee_type,
        quantity_bags: contract.quantity_bags,
        unit_price: contract.unit_price,
        currency: contract.currency,
        payment_terms: contract.payment_terms,
        delivery_location: contract.delivery_location,
        delivery_date: new Date(contract.delivery_date).toISOString(),
        blockchain_tx_hash: blockchainTxHash,
      };

      const response = await this.client.post('/contracts/register', request);

      const result: ECTARegistrationResponse = {
        reference_number: response.data.reference_number,
        registration_timestamp: new Date(response.data.registration_timestamp),
        status: response.data.status,
        message: response.data.message,
      };

      logger.info(`Contract registered with ECTA: ${result.reference_number}`);

      return result;
    } catch (error) {
      logger.error(`Error registering contract with ECTA: ${contract.draft_id}`, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Get registration status
   */
  async getRegistrationStatus(referenceNumber: string): Promise<ECTARegistrationResponse> {
    try {
      logger.info(`Getting registration status: ${referenceNumber}`);

      const response = await this.client.get(`/contracts/status/${referenceNumber}`);

      const result: ECTARegistrationResponse = {
        reference_number: response.data.reference_number,
        registration_timestamp: new Date(response.data.registration_timestamp),
        status: response.data.status,
        message: response.data.message,
      };

      logger.info(`Registration status retrieved: ${referenceNumber}`, { status: result.status });

      return result;
    } catch (error) {
      logger.error(`Error getting registration status: ${referenceNumber}`, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Generate certificate
   */
  async generateCertificate(referenceNumber: string): Promise<Buffer> {
    try {
      logger.info(`Generating certificate: ${referenceNumber}`);

      const response = await this.client.get(`/certificates/${referenceNumber}`, {
        responseType: 'arraybuffer',
      });

      logger.info(`Certificate generated: ${referenceNumber}`);

      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Error generating certificate: ${referenceNumber}`, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Validate contract compliance
   */
  async validateCompliance(contract: ContractDraft): Promise<{
    compliant: boolean;
    issues: string[];
  }> {
    try {
      logger.info(`Validating contract compliance: ${contract.draft_id}`);

      const response = await this.client.post('/contracts/validate', {
        contract_id: contract.draft_id,
        coffee_type: contract.coffee_type,
        quantity_bags: contract.quantity_bags,
        delivery_location: contract.delivery_location,
      });

      const result = {
        compliant: response.data.compliant,
        issues: response.data.issues || [],
      };

      logger.info(`Compliance validation completed: ${contract.draft_id}`, { compliant: result.compliant });

      return result;
    } catch (error) {
      logger.error(`Error validating compliance: ${contract.draft_id}`, { error });
      throw this.handleError(error);
    }
  }

  /**
   * Generate reference number
   */
  generateReferenceNumber(): string {
    const year = new Date().getFullYear();
    const randomNumber = Math.floor(Math.random() * 1000000);
    const paddedNumber = String(randomNumber).padStart(6, '0');
    return `ECTA-${year}-${paddedNumber}`;
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): boolean {
    try {
      if (!this.config.apiUrl) {
        throw new Error('ECTA API URL not configured');
      }

      if (!this.config.apiKey) {
        throw new Error('ECTA API key not configured');
      }

      logger.info('ECTA configuration validated');
      return true;
    } catch (error) {
      logger.error('ECTA configuration validation failed', { error });
      return false;
    }
  }

  /**
   * Get configuration
   */
  getConfiguration(): ECTAConfig {
    return {
      ...this.config,
      apiKey: '***', // Don't expose API key
    };
  }

  /**
   * Set configuration
   */
  setConfiguration(config: Partial<ECTAConfig>): void {
    this.config = { ...this.config, ...config };
    this.client = this.initializeClient();
    logger.info('ECTA configuration updated');
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      if (status === 400) {
        return new Error(`ECTA validation error: ${message}`);
      } else if (status === 401) {
        return new Error('ECTA authentication failed - invalid API key');
      } else if (status === 403) {
        return new Error('ECTA access denied');
      } else if (status === 404) {
        return new Error('ECTA resource not found');
      } else if (status === 429) {
        return new Error('ECTA rate limit exceeded');
      } else if (status === 500) {
        return new Error('ECTA server error');
      } else if (status === 503) {
        return new Error('ECTA service unavailable');
      }

      return new Error(`ECTA API error: ${message}`);
    }

    return error instanceof Error ? error : new Error(String(error));
  }
}

// Export singleton instance
export const ectaClient = new ECTAClientService();
