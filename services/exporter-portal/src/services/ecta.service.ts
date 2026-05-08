/**
 * ECTA Service
 * Handles ECTA registration workflow and reference number management
 */

import { Pool } from 'pg';
import { createLogger } from '../../../shared/logger';
import { ContractDraft } from '../types/contract.types';
import { ECTAClientService, ECTARegistrationResponse } from './ecta-client.service';
import { ContractService } from './contract.service';
import { NotificationService } from './notification.service';

const logger = createLogger('ECTAService');

export class ECTAService {
  private ectaClient: ECTAClientService;
  private contractService: ContractService;
  private notificationService: NotificationService;
  private pool: Pool;

  constructor(pool: Pool, ectaClient?: ECTAClientService) {
    this.pool = pool;
    this.ectaClient = ectaClient || new ECTAClientService();
    this.contractService = new ContractService(pool);
    this.notificationService = new NotificationService(pool);
  }

  /**
   * Register contract with ECTA
   */
  async registerContract(contract: ContractDraft, blockchainTxHash: string): Promise<string> {
    try {
      logger.info(`Starting ECTA registration: ${contract.draft_id}`);

      // Validate compliance first
      const compliance = await this.ectaClient.validateCompliance(contract);

      if (!compliance.compliant) {
        logger.warn(`Contract not compliant: ${contract.draft_id}`, { issues: compliance.issues });
        throw new Error(`Contract compliance validation failed: ${compliance.issues.join(', ')}`);
      }

      // Register with ECTA
      const response = await this.ectaClient.registerContract(contract, blockchainTxHash);

      // Update contract with reference number
      await this.contractService.updateEctaReference(contract.draft_id, response.reference_number);

      logger.info(`ECTA registration successful: ${response.reference_number}`);

      // Send notification to exporter
      await this.notificationService.notifyEctaRegistration(contract, response.reference_number);

      return response.reference_number;
    } catch (error) {
      logger.error(`Error registering contract with ECTA: ${contract.draft_id}`, { error });
      throw error;
    }
  }

  /**
   * Get registration status
   */
  async getRegistrationStatus(referenceNumber: string): Promise<ECTARegistrationResponse> {
    try {
      logger.info(`Getting ECTA registration status: ${referenceNumber}`);

      const status = await this.ectaClient.getRegistrationStatus(referenceNumber);

      logger.info(`ECTA registration status: ${referenceNumber}`, { status: status.status });

      return status;
    } catch (error) {
      logger.error(`Error getting ECTA registration status: ${referenceNumber}`, { error });
      throw error;
    }
  }

  /**
   * Generate certificate
   */
  async generateCertificate(referenceNumber: string): Promise<Buffer> {
    try {
      logger.info(`Generating ECTA certificate: ${referenceNumber}`);

      const certificate = await this.ectaClient.generateCertificate(referenceNumber);

      logger.info(`ECTA certificate generated: ${referenceNumber}`);

      return certificate;
    } catch (error) {
      logger.error(`Error generating ECTA certificate: ${referenceNumber}`, { error });
      throw error;
    }
  }

  /**
   * Generate reference number
   */
  generateReferenceNumber(): string {
    return this.ectaClient.generateReferenceNumber();
  }

  /**
   * Validate ECTA configuration
   */
  validateConfiguration(): boolean {
    return this.ectaClient.validateConfiguration();
  }

  /**
   * Get ECTA configuration
   */
  getConfiguration() {
    return this.ectaClient.getConfiguration();
  }

  /**
   * Set ECTA configuration
   */
  setConfiguration(config: any): void {
    this.ectaClient.setConfiguration(config);
  }
}

// Export singleton instance
export const ectaService = (pool: Pool) => new ECTAService(pool);
