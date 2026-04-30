/**
 * Contract Service
 * Handles CRUD operations for sales contracts
 */

import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../../../shared/logger';
import {
  ContractDraft,
  ContractStatus,
  CreateContractDraftRequest,
  UpdateContractDraftRequest,
  ContractHistory,
  ContractHistoryAction,
  ActorType,
  ValidationResult,
} from '../types/contract.types';

const logger = createLogger('ContractService');

export class ContractService {
  constructor(private pool: Pool) {}

  /**
   * Create a new draft contract
   */
  async createDraft(
    exporterId: string,
    request: CreateContractDraftRequest
  ): Promise<ContractDraft> {
    const { executeContractCreationTransaction } = await import('../database');
    
    return executeContractCreationTransaction(async (client) => {
      const draftId = uuidv4();
      const now = new Date();

      const query = `
        INSERT INTO contract_drafts (
          draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
          quantity_bags, unit_price, currency, payment_terms,
          delivery_location, delivery_date, status, created_at, last_modified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        draftId,
        exporterId,
        request.buyer_email,
        request.buyer_name,
        request.coffee_type,
        request.quantity_bags,
        request.unit_price,
        request.currency,
        request.payment_terms,
        request.delivery_location,
        request.delivery_date,
        ContractStatus.DRAFT,
        now,
        now,
      ];

      const result = await client.query(query, values);
      const contract = result.rows[0];

      // Create initial history entry
      await this.createHistoryEntry(
        client,
        draftId,
        1,
        ContractStatus.DRAFT,
        ActorType.EXPORTER,
        exporterId,
        ContractHistoryAction.CREATED,
        null
      );

      logger.info(`Draft contract created: ${draftId} by exporter ${exporterId}`);
      return this.mapRowToContract(contract);
    });
  }

  /**
   * Get draft contract by ID
   */
  async getDraftById(draftId: string): Promise<ContractDraft | null> {
    try {
      const query = 'SELECT * FROM contract_drafts WHERE draft_id = $1';
      const result = await this.pool.query(query, [draftId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToContract(result.rows[0]);
    } catch (error) {
      logger.error(`Error retrieving draft contract ${draftId}: ${error}`);
      throw error;
    }
  }

  /**
   * Update draft contract
   */
  async updateDraft(
    draftId: string,
    request: UpdateContractDraftRequest
  ): Promise<ContractDraft> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get current contract
      const currentContract = await this.getDraftById(draftId);
      if (!currentContract) {
        throw new Error(`Contract ${draftId} not found`);
      }

      if (currentContract.status !== ContractStatus.DRAFT) {
        throw new Error(`Cannot edit contract with status ${currentContract.status}`);
      }

      const now = new Date();
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // Build dynamic update query
      if (request.buyer_email !== undefined) {
        updates.push(`buyer_email = $${paramIndex++}`);
        values.push(request.buyer_email);
      }
      if (request.buyer_name !== undefined) {
        updates.push(`buyer_name = $${paramIndex++}`);
        values.push(request.buyer_name);
      }
      if (request.coffee_type !== undefined) {
        updates.push(`coffee_type = $${paramIndex++}`);
        values.push(request.coffee_type);
      }
      if (request.quantity_bags !== undefined) {
        updates.push(`quantity_bags = $${paramIndex++}`);
        values.push(request.quantity_bags);
      }
      if (request.unit_price !== undefined) {
        updates.push(`unit_price = $${paramIndex++}`);
        values.push(request.unit_price);
      }
      if (request.currency !== undefined) {
        updates.push(`currency = $${paramIndex++}`);
        values.push(request.currency);
      }
      if (request.payment_terms !== undefined) {
        updates.push(`payment_terms = $${paramIndex++}`);
        values.push(request.payment_terms);
      }
      if (request.delivery_location !== undefined) {
        updates.push(`delivery_location = $${paramIndex++}`);
        values.push(request.delivery_location);
      }
      if (request.delivery_date !== undefined) {
        updates.push(`delivery_date = $${paramIndex++}`);
        values.push(request.delivery_date);
      }

      updates.push(`last_modified_at = $${paramIndex++}`);
      values.push(now);

      values.push(draftId);

      const query = `
        UPDATE contract_drafts
        SET ${updates.join(', ')}
        WHERE draft_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      const updatedContract = result.rows[0];

      // Create history entry for modification
      const versionNumber = await this.getNextVersionNumber(client, draftId);
      const changes = this.calculateChanges(currentContract, request);

      await this.createHistoryEntry(
        client,
        draftId,
        versionNumber,
        ContractStatus.DRAFT,
        ActorType.EXPORTER,
        currentContract.exporter_id,
        ContractHistoryAction.MODIFIED,
        changes
      );

      await client.query('COMMIT');

      logger.info(`Draft contract updated: ${draftId}`);
      return this.mapRowToContract(updatedContract);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error updating draft contract ${draftId}: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete draft contract
   */
  async deleteDraft(draftId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const contract = await this.getDraftById(draftId);
      if (!contract) {
        throw new Error(`Contract ${draftId} not found`);
      }

      if (contract.status !== ContractStatus.DRAFT) {
        throw new Error(`Cannot delete contract with status ${contract.status}`);
      }

      // Delete related records
      await client.query('DELETE FROM contract_history WHERE draft_id = $1', [draftId]);
      await client.query('DELETE FROM contract_notifications WHERE draft_id = $1', [draftId]);
      await client.query('DELETE FROM contract_permissions WHERE draft_id = $1', [draftId]);
      await client.query('DELETE FROM contract_drafts WHERE draft_id = $1', [draftId]);

      await client.query('COMMIT');

      logger.info(`Draft contract deleted: ${draftId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error deleting draft contract ${draftId}: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all contracts for an exporter
   */
  async getContractsByExporter(
    exporterId: string,
    status?: ContractStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<{ contracts: ContractDraft[]; total: number }> {
    try {
      let query = 'SELECT * FROM contract_drafts WHERE exporter_id = $1';
      const values: any[] = [exporterId];
      let paramIndex = 2;

      if (status) {
        query += ` AND status = $${paramIndex}`;
        values.push(status);
        paramIndex++;
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
      const countResult = await this.pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count, 10);

      // Get paginated results
      const offset = (page - 1) * limit;
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      values.push(limit, offset);

      const result = await this.pool.query(query, values);
      const contracts = result.rows.map((row) => this.mapRowToContract(row));

      return { contracts, total };
    } catch (error) {
      logger.error(`Error retrieving contracts for exporter ${exporterId}: ${error}`);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  async updateStatus(
    draftId: string,
    newStatus: ContractStatus,
    actorType: ActorType,
    actorId: string,
    action: ContractHistoryAction,
    changes?: Record<string, any>
  ): Promise<ContractDraft> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const now = new Date();
      const query = `
        UPDATE contract_drafts
        SET status = $1, last_modified_at = $2
        WHERE draft_id = $3
        RETURNING *
      `;

      const result = await client.query(query, [newStatus, now, draftId]);
      if (result.rows.length === 0) {
        throw new Error(`Contract ${draftId} not found`);
      }

      const updatedContract = result.rows[0];

      // Create history entry
      const versionNumber = await this.getNextVersionNumber(client, draftId);
      await this.createHistoryEntry(
        client,
        draftId,
        versionNumber,
        newStatus,
        actorType,
        actorId,
        action,
        changes
      );

      await client.query('COMMIT');

      logger.info(`Contract ${draftId} status updated to ${newStatus}`);
      return this.mapRowToContract(updatedContract);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error(`Error updating contract status for ${draftId}: ${error}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get contract history
   */
  async getContractHistory(draftId: string): Promise<ContractHistory[]> {
    try {
      const query = `
        SELECT * FROM contract_history
        WHERE draft_id = $1
        ORDER BY version_number ASC
      `;

      const result = await this.pool.query(query, [draftId]);
      return result.rows.map((row) => this.mapRowToHistory(row));
    } catch (error) {
      logger.error(`Error retrieving contract history for ${draftId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get contract by ECTA reference number
   */
  async getContractByEctaReference(referenceNumber: string): Promise<ContractDraft | null> {
    try {
      const query = `
        SELECT * FROM contract_drafts
        WHERE contract_number = $1
      `;

      const result = await this.pool.query(query, [referenceNumber]);
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToContract(result.rows[0]);
    } catch (error) {
      logger.error(`Error retrieving contract by ECTA reference ${referenceNumber}: ${error}`);
      throw error;
    }
  }

  /**
   * Update ECTA reference number
   */
  async updateEctaReference(draftId: string, referenceNumber: string): Promise<ContractDraft> {
    try {
      const query = `
        UPDATE contract_drafts
        SET ecta_reference_number = $1, last_modified_at = $2
        WHERE draft_id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [referenceNumber, new Date(), draftId]);
      if (result.rows.length === 0) {
        throw new Error(`Contract ${draftId} not found`);
      }

      logger.info(`ECTA reference ${referenceNumber} set for contract ${draftId}`);
      return this.mapRowToContract(result.rows[0]);
    } catch (error) {
      logger.error(`Error updating ECTA reference for ${draftId}: ${error}`);
      throw error;
    }
  }

  /**
   * Update blockchain transaction hash
   */
  async updateBlockchainHash(draftId: string, txHash: string): Promise<ContractDraft> {
    try {
      const query = `
        UPDATE contract_drafts
        SET blockchain_tx_hash = $1, last_modified_at = $2
        WHERE draft_id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [txHash, new Date(), draftId]);
      if (result.rows.length === 0) {
        throw new Error(`Contract ${draftId} not found`);
      }

      logger.info(`Blockchain hash ${txHash} set for contract ${draftId}`);
      return this.mapRowToContract(result.rows[0]);
    } catch (error) {
      logger.error(`Error updating blockchain hash for ${draftId}: ${error}`);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async createHistoryEntry(
    client: any,
    draftId: string,
    versionNumber: number,
    status: ContractStatus,
    actorType: ActorType,
    actorId: string,
    action: ContractHistoryAction,
    changes: Record<string, any> | null
  ): Promise<void> {
    const historyId = uuidv4();
    const query = `
      INSERT INTO contract_history (
        history_id, draft_id, version_number, status, actor_type, actor_id, action, changes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    const values = [
      historyId,
      draftId,
      versionNumber,
      status,
      actorType,
      actorId,
      action,
      changes ? JSON.stringify(changes) : null,
      new Date(),
    ];

    await client.query(query, values);
  }

  private async getNextVersionNumber(client: any, draftId: string): Promise<number> {
    const query = `
      SELECT MAX(version_number) as max_version FROM contract_history
      WHERE draft_id = $1
    `;

    const result = await client.query(query, [draftId]);
    const maxVersion = result.rows[0].max_version || 0;
    return maxVersion + 1;
  }

  private calculateChanges(
    original: ContractDraft,
    updates: UpdateContractDraftRequest
  ): Record<string, any> {
    const changes: Record<string, any> = {};

    if (updates.buyer_email !== undefined && updates.buyer_email !== original.buyer_email) {
      changes.buyer_email = { original: original.buyer_email, modified: updates.buyer_email };
    }
    if (updates.buyer_name !== undefined && updates.buyer_name !== original.buyer_name) {
      changes.buyer_name = { original: original.buyer_name, modified: updates.buyer_name };
    }
    if (updates.coffee_type !== undefined && updates.coffee_type !== original.coffee_type) {
      changes.coffee_type = { original: original.coffee_type, modified: updates.coffee_type };
    }
    if (updates.quantity_bags !== undefined && updates.quantity_bags !== original.quantity_bags) {
      changes.quantity_bags = { original: original.quantity_bags, modified: updates.quantity_bags };
    }
    if (updates.unit_price !== undefined && updates.unit_price !== original.unit_price) {
      changes.unit_price = { original: original.unit_price, modified: updates.unit_price };
    }
    if (updates.currency !== undefined && updates.currency !== original.currency) {
      changes.currency = { original: original.currency, modified: updates.currency };
    }
    if (updates.payment_terms !== undefined && updates.payment_terms !== original.payment_terms) {
      changes.payment_terms = { original: original.payment_terms, modified: updates.payment_terms };
    }
    if (updates.delivery_location !== undefined && updates.delivery_location !== original.delivery_location) {
      changes.delivery_location = { original: original.delivery_location, modified: updates.delivery_location };
    }
    if (updates.delivery_date !== undefined && updates.delivery_date !== original.delivery_date) {
      changes.delivery_date = { original: original.delivery_date, modified: updates.delivery_date };
    }

    return changes;
  }

  private mapRowToContract(row: any): ContractDraft {
    return {
      draft_id: row.draft_id,
      exporter_id: row.exporter_id,
      buyer_id: row.buyer_id,
      buyer_email: row.buyer_email,
      buyer_name: row.buyer_name,
      coffee_type: row.coffee_type,
      quantity_bags: row.quantity_bags,
      unit_price: row.unit_price,
      currency: row.currency,
      payment_terms: row.payment_terms,
      delivery_location: row.delivery_location,
      delivery_date: row.delivery_date,
      lc_number: row.lc_number,
      ecta_reference_number: row.ecta_reference_number,
      status: row.status,
      blockchain_tx_hash: row.blockchain_tx_hash,
      created_at: row.created_at,
      last_modified_at: row.last_modified_at,
      finalized_at: row.finalized_at,
    };
  }

  private mapRowToHistory(row: any): ContractHistory {
    return {
      history_id: row.history_id,
      draft_id: row.draft_id,
      version_number: row.version_number,
      status: row.status,
      actor_type: row.actor_type,
      actor_id: row.actor_id,
      action: row.action,
      changes: row.changes ? JSON.parse(row.changes) : undefined,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
    };
  }
}
