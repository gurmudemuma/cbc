import { Pool } from 'pg';
import type { QueryResult } from 'pg';
import logger from '../config/logger';

interface ContractExport {
  id: string;
  contract_id: string;
  export_id: string;
  exporter_id: string;
  coffee_type_match: boolean;
  quantity_match: boolean;
  quantity_variance: number;
  status: string;
  linked_at: Date;
  verified_at?: Date;
  shipped_at?: Date;
  completed_at?: Date;
  created_by: string;
  updated_by?: string;
  created_at: Date;
  updated_at: Date;
}

export class ContractExportService {
  private pool: Pool;

  constructor(pool?: Pool) {
    this.pool = pool || new Pool();
  }

  /**
   * Link a contract to an export shipment
   */
  async linkContractToExport(
    contractId: string,
    exportId: string,
    exporterId: string,
    userId: string,
    options?: {
      coffeeTypeMatch?: boolean;
      quantityMatch?: boolean;
      quantityVariance?: number;
    }
  ): Promise<ContractExport> {
    try {
      const query = `
        INSERT INTO contract_exports (
          contract_id,
          export_id,
          exporter_id,
          coffee_type_match,
          quantity_match,
          quantity_variance,
          status,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *;
      `;

      const values = [
        contractId,
        exportId,
        exporterId,
        options?.coffeeTypeMatch ?? true,
        options?.quantityMatch ?? true,
        options?.quantityVariance ?? 0,
        'LINKED',
        userId,
      ];

      const result: QueryResult<ContractExport> = await this.pool.query(query, values);
      logger.info(`Contract ${contractId} linked to export ${exportId}`);
      return result.rows[0];
    } catch (err) {
      logger.error('Error linking contract to export:', err);
      throw err;
    }
  }

  /**
   * Unlink a contract from an export shipment
   */
  async unlinkContractFromExport(
    contractId: string,
    exportId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM contract_exports
        WHERE contract_id = $1 AND export_id = $2;
      `;

      const result: QueryResult = await this.pool.query(query, [contractId, exportId]);
      logger.info(`Contract ${contractId} unlinked from export ${exportId}`);
      return result.rowCount! > 0;
    } catch (err) {
      logger.error('Error unlinking contract from export:', err);
      throw err;
    }
  }

  /**
   * Get all exports linked to a contract
   */
  async getExportsForContract(contractId: string): Promise<ContractExport[]> {
    try {
      const query = `
        SELECT * FROM contract_exports
        WHERE contract_id = $1
        ORDER BY linked_at DESC;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [contractId]);
      return result.rows;
    } catch (err) {
      logger.error('Error getting exports for contract:', err);
      throw err;
    }
  }

  /**
   * Get all contracts linked to an export
   */
  async getContractsForExport(exportId: string): Promise<ContractExport[]> {
    try {
      const query = `
        SELECT * FROM contract_exports
        WHERE export_id = $1
        ORDER BY linked_at DESC;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [exportId]);
      return result.rows;
    } catch (err) {
      logger.error('Error getting contracts for export:', err);
      throw err;
    }
  }

  /**
   * Get contract-export link by ID
   */
  async getLinkById(linkId: string): Promise<ContractExport | null> {
    try {
      const query = `
        SELECT * FROM contract_exports
        WHERE id = $1;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [linkId]);
      return result.rows[0] || null;
    } catch (err) {
      logger.error('Error getting contract-export link:', err);
      throw err;
    }
  }

  /**
   * Update contract-export link status
   */
  async updateLinkStatus(
    linkId: string,
    status: string,
    userId: string
  ): Promise<ContractExport> {
    try {
      const query = `
        UPDATE contract_exports
        SET status = $1, updated_by = $2
        WHERE id = $3
        RETURNING *;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [
        status,
        userId,
        linkId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Contract-export link not found');
      }

      logger.info(`Contract-export link ${linkId} status updated to ${status}`);
      return result.rows[0];
    } catch (err) {
      logger.error('Error updating contract-export link status:', err);
      throw err;
    }
  }

  /**
   * Verify contract-export link (validate coffee type and quantity match)
   */
  async verifyLink(
    linkId: string,
    userId: string,
    coffeeTypeMatch: boolean,
    quantityMatch: boolean,
    quantityVariance?: number
  ): Promise<ContractExport> {
    try {
      const query = `
        UPDATE contract_exports
        SET 
          coffee_type_match = $1,
          quantity_match = $2,
          quantity_variance = $3,
          status = CASE WHEN $1 = true AND $2 = true THEN 'VERIFIED' ELSE 'LINKED' END,
          verified_at = CASE WHEN $1 = true AND $2 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
          updated_by = $4
        WHERE id = $5
        RETURNING *;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [
        coffeeTypeMatch,
        quantityMatch,
        quantityVariance ?? 0,
        userId,
        linkId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Contract-export link not found');
      }

      logger.info(`Contract-export link ${linkId} verified`);
      return result.rows[0];
    } catch (err) {
      logger.error('Error verifying contract-export link:', err);
      throw err;
    }
  }

  /**
   * Mark contract-export as shipped
   */
  async markAsShipped(linkId: string, userId: string): Promise<ContractExport> {
    try {
      const query = `
        UPDATE contract_exports
        SET 
          status = 'SHIPPED',
          shipped_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
        RETURNING *;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [userId, linkId]);

      if (result.rows.length === 0) {
        throw new Error('Contract-export link not found');
      }

      logger.info(`Contract-export link ${linkId} marked as shipped`);
      return result.rows[0];
    } catch (err) {
      logger.error('Error marking contract-export as shipped:', err);
      throw err;
    }
  }

  /**
   * Mark contract-export as completed
   */
  async markAsCompleted(linkId: string, userId: string): Promise<ContractExport> {
    try {
      const query = `
        UPDATE contract_exports
        SET 
          status = 'COMPLETED',
          completed_at = CURRENT_TIMESTAMP,
          updated_by = $1
        WHERE id = $2
        RETURNING *;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [userId, linkId]);

      if (result.rows.length === 0) {
        throw new Error('Contract-export link not found');
      }

      logger.info(`Contract-export link ${linkId} marked as completed`);
      return result.rows[0];
    } catch (err) {
      logger.error('Error marking contract-export as completed:', err);
      throw err;
    }
  }

  /**
   * Get all contract-export links for an exporter
   */
  async getLinksForExporter(exporterId: string): Promise<ContractExport[]> {
    try {
      const query = `
        SELECT * FROM contract_exports
        WHERE exporter_id = $1
        ORDER BY linked_at DESC;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [exporterId]);
      return result.rows;
    } catch (err) {
      logger.error('Error getting contract-export links for exporter:', err);
      throw err;
    }
  }

  /**
   * Get contract-export links by status
   */
  async getLinksByStatus(status: string): Promise<ContractExport[]> {
    try {
      const query = `
        SELECT * FROM contract_exports
        WHERE status = $1
        ORDER BY linked_at DESC;
      `;

      const result: QueryResult<ContractExport> = await this.pool.query(query, [status]);
      return result.rows;
    } catch (err) {
      logger.error('Error getting contract-export links by status:', err);
      throw err;
    }
  }

  /**
   * Validate contract can be linked to export
   */
  async validateContractExportLink(
    contractId: string,
    exportId: string,
    exportData: any
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Get contract details
      const contractQuery = `
        SELECT * FROM contract_drafts
        WHERE draft_id = $1;
      `;
      const contractResult: QueryResult = await this.pool.query(contractQuery, [contractId]);
      const contract = contractResult.rows[0];

      if (!contract) {
        errors.push('Contract not found');
        return { valid: false, errors, warnings };
      }

      // Validate contract is finalized
      if (contract.status !== 'FINALIZED') {
        errors.push(`Contract must be FINALIZED to link to export. Current status: ${contract.status}`);
      }

      // Validate coffee type matches
      if (contract.coffee_type !== exportData.coffee_type) {
        warnings.push(
          `Coffee type mismatch: Contract has ${contract.coffee_type}, export has ${exportData.coffee_type}`
        );
      }

      // Validate quantity matches (allow variance)
      const quantityVariance = Math.abs(contract.quantity - exportData.quantity) / contract.quantity * 100;
      if (quantityVariance > 5) { // 5% variance allowed
        warnings.push(
          `Quantity variance exceeds 5%: Contract has ${contract.quantity} bags, export has ${exportData.quantity} bags (${quantityVariance.toFixed(2)}% variance)`
        );
      }

      // Check if already linked
      const linkQuery = `
        SELECT * FROM contract_exports
        WHERE contract_id = $1 AND export_id = $2;
      `;
      const linkResult: QueryResult = await this.pool.query(linkQuery, [contractId, exportId]);
      if (linkResult.rows.length > 0) {
        errors.push('Contract is already linked to this export');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (err) {
      logger.error('Error validating contract-export link:', err);
      throw err;
    }
  }
}
