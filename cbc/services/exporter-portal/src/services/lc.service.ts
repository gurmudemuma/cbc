/**
 * Letter of Credit (LC) Service
 * Handles LC issuance, tracking, and lifecycle management for foreign buyer payments
 */

import { Pool } from 'pg';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('LCService');

export interface CreateLCRequest {
  contractId: string;
  exporterId: string;
  lcNumber: string;
  lcType: string;
  issuingBankName: string;
  issuingBankSwiftCode: string;
  issuingBankCountry: string;
  beneficiaryName: string;
  beneficiaryAddress: string;
  applicantName: string;
  applicantAddress: string;
  applicantCountry: string;
  lcAmount: number;
  lcCurrency: string;
  issueDate: Date;
  expiryDate: Date;
  latestShipmentDate?: Date;
  paymentTerms: string;
  incoterms: string;
  portOfLoading?: string;
  portOfDischarge?: string;
  goodsDescription: string;
  requiredDocuments?: string[];
  mt700Message?: string;
}

export interface LCResponse {
  lcId: string;
  contractId: string;
  exporterId: string;
  lcNumber: string;
  lcType: string;
  issuingBankName: string;
  beneficiaryName: string;
  applicantName: string;
  lcAmount: number;
  lcCurrency: string;
  issueDate: Date;
  expiryDate: Date;
  status: string;
  nbeApprovalStatus: string;
  exporterResponse?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class LCService {
  constructor(private pool: Pool) {}

  /**
   * Create a new LC record
   */
  async createLC(data: CreateLCRequest): Promise<LCResponse> {
    try {
      logger.info('Creating LC record', { contractId: data.contractId, lcNumber: data.lcNumber });

      const query = `
        INSERT INTO letter_of_credit (
          contract_id, exporter_id, lc_number, lc_type,
          issuing_bank_name, issuing_bank_swift_code, issuing_bank_country,
          beneficiary_name, beneficiary_address,
          applicant_name, applicant_address, applicant_country,
          lc_amount, lc_currency,
          issue_date, expiry_date, latest_shipment_date,
          payment_terms, incoterms,
          port_of_loading, port_of_discharge,
          goods_description, required_documents, mt700_message,
          status, nbe_approval_status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, 'ISSUED', 'PENDING'
        )
        RETURNING 
          lc_id, contract_id, exporter_id, lc_number, lc_type,
          issuing_bank_name, beneficiary_name, applicant_name,
          lc_amount, lc_currency, issue_date, expiry_date,
          status, nbe_approval_status, exporter_response,
          created_at, updated_at
      `;

      const values = [
        data.contractId,
        data.exporterId,
        data.lcNumber,
        data.lcType,
        data.issuingBankName,
        data.issuingBankSwiftCode,
        data.issuingBankCountry,
        data.beneficiaryName,
        data.beneficiaryAddress,
        data.applicantName,
        data.applicantAddress,
        data.applicantCountry,
        data.lcAmount,
        data.lcCurrency,
        data.issueDate,
        data.expiryDate,
        data.latestShipmentDate || null,
        data.paymentTerms,
        data.incoterms,
        data.portOfLoading || null,
        data.portOfDischarge || null,
        data.goodsDescription,
        data.requiredDocuments ? JSON.stringify(data.requiredDocuments) : '[]',
        data.mt700Message || null,
      ];

      const result = await this.pool.query(query, values);
      
      // Log history
      await this.logHistory(result.rows[0].lc_id, 'LC_CREATED', 'LC record created in system', 'SYSTEM');

      logger.info('LC created successfully', { lcId: result.rows[0].lc_id });
      return this.mapToLCResponse(result.rows[0]);
    } catch (error) {
      logger.error('Error creating LC', { error, contractId: data.contractId });
      throw error;
    }
  }

  /**
   * Get LC by contract ID
   */
  async getLCByContractId(contractId: string): Promise<LCResponse | null> {
    try {
      const query = `
        SELECT 
          lc_id, contract_id, exporter_id, lc_number, lc_type,
          issuing_bank_name, issuing_bank_swift_code, issuing_bank_country,
          beneficiary_name, beneficiary_address,
          applicant_name, applicant_address, applicant_country,
          lc_amount, lc_currency, tolerance_percentage,
          issue_date, expiry_date, latest_shipment_date, presentation_period_days,
          payment_terms, tenor_days, incoterms,
          port_of_loading, port_of_discharge,
          goods_description, required_documents,
          status, nbe_approval_status, nbe_approval_date, nbe_approval_reference,
          exporter_response, exporter_response_date, exporter_response_notes,
          amendment_count, documents_presented_date,
          payment_date, payment_amount, payment_reference,
          created_at, updated_at
        FROM letter_of_credit
        WHERE contract_id = $1
      `;

      const result = await this.pool.query(query, [contractId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToLCResponse(result.rows[0]);
    } catch (error) {
      logger.error('Error getting LC by contract ID', { error, contractId });
      throw error;
    }
  }

  /**
   * Get LC by ID
   */
  async getLCById(lcId: string): Promise<LCResponse | null> {
    try {
      const query = `
        SELECT 
          lc_id, contract_id, exporter_id, lc_number, lc_type,
          issuing_bank_name, issuing_bank_swift_code, issuing_bank_country,
          beneficiary_name, beneficiary_address,
          applicant_name, applicant_address, applicant_country,
          lc_amount, lc_currency, tolerance_percentage,
          issue_date, expiry_date, latest_shipment_date, presentation_period_days,
          payment_terms, tenor_days, incoterms,
          port_of_loading, port_of_discharge,
          goods_description, required_documents,
          status, nbe_approval_status, nbe_approval_date, nbe_approval_reference,
          exporter_response, exporter_response_date, exporter_response_notes,
          amendment_count, documents_presented_date,
          payment_date, payment_amount, payment_reference,
          created_at, updated_at
        FROM letter_of_credit
        WHERE lc_id = $1
      `;

      const result = await this.pool.query(query, [lcId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapToLCResponse(result.rows[0]);
    } catch (error) {
      logger.error('Error getting LC by ID', { error, lcId });
      throw error;
    }
  }

  /**
   * Update LC status
   */
  async updateLCStatus(lcId: string, status: string, actorType: string = 'SYSTEM'): Promise<void> {
    try {
      logger.info('Updating LC status', { lcId, status });

      const query = `
        UPDATE letter_of_credit
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE lc_id = $2
      `;

      await this.pool.query(query, [status, lcId]);
      
      // History is logged automatically by trigger
      logger.info('LC status updated', { lcId, status });
    } catch (error) {
      logger.error('Error updating LC status', { error, lcId, status });
      throw error;
    }
  }

  /**
   * Exporter accepts LC terms
   */
  async acceptLC(lcId: string, exporterId: string, notes?: string): Promise<LCResponse> {
    try {
      logger.info('Exporter accepting LC', { lcId, exporterId });

      const query = `
        UPDATE letter_of_credit
        SET 
          exporter_response = 'ACCEPTED',
          exporter_response_date = CURRENT_TIMESTAMP,
          exporter_response_notes = $1,
          status = 'ACCEPTED',
          updated_at = CURRENT_TIMESTAMP
        WHERE lc_id = $2 AND exporter_id = $3
        RETURNING 
          lc_id, contract_id, exporter_id, lc_number, lc_type,
          issuing_bank_name, beneficiary_name, applicant_name,
          lc_amount, lc_currency, issue_date, expiry_date,
          status, nbe_approval_status, exporter_response,
          created_at, updated_at
      `;

      const result = await this.pool.query(query, [notes || null, lcId, exporterId]);
      
      if (result.rows.length === 0) {
        throw new Error('LC not found or unauthorized');
      }

      await this.logHistory(lcId, 'LC_ACCEPTED', 'Exporter accepted LC terms', 'EXPORTER', exporterId);

      logger.info('LC accepted by exporter', { lcId, exporterId });
      return this.mapToLCResponse(result.rows[0]);
    } catch (error) {
      logger.error('Error accepting LC', { error, lcId, exporterId });
      throw error;
    }
  }

  /**
   * Exporter rejects LC terms
   */
  async rejectLC(lcId: string, exporterId: string, reason: string): Promise<LCResponse> {
    try {
      logger.info('Exporter rejecting LC', { lcId, exporterId });

      const query = `
        UPDATE letter_of_credit
        SET 
          exporter_response = 'REJECTED',
          exporter_response_date = CURRENT_TIMESTAMP,
          exporter_response_notes = $1,
          status = 'REJECTED',
          updated_at = CURRENT_TIMESTAMP
        WHERE lc_id = $2 AND exporter_id = $3
        RETURNING 
          lc_id, contract_id, exporter_id, lc_number, lc_type,
          issuing_bank_name, beneficiary_name, applicant_name,
          lc_amount, lc_currency, issue_date, expiry_date,
          status, nbe_approval_status, exporter_response,
          created_at, updated_at
      `;

      const result = await this.pool.query(query, [reason, lcId, exporterId]);
      
      if (result.rows.length === 0) {
        throw new Error('LC not found or unauthorized');
      }

      await this.logHistory(lcId, 'LC_REJECTED', `Exporter rejected LC: ${reason}`, 'EXPORTER', exporterId);

      logger.info('LC rejected by exporter', { lcId, exporterId, reason });
      return this.mapToLCResponse(result.rows[0]);
    } catch (error) {
      logger.error('Error rejecting LC', { error, lcId, exporterId });
      throw error;
    }
  }

  /**
   * Request NBE forex approval
   */
  async requestNBEApproval(lcId: string): Promise<void> {
    try {
      logger.info('Requesting NBE approval', { lcId });

      const query = `
        UPDATE letter_of_credit
        SET 
          nbe_approval_status = 'PENDING',
          updated_at = CURRENT_TIMESTAMP
        WHERE lc_id = $1
      `;

      await this.pool.query(query, [lcId]);
      
      await this.logHistory(lcId, 'NBE_APPROVAL_REQUESTED', 'NBE forex approval requested', 'SYSTEM');

      logger.info('NBE approval requested', { lcId });
    } catch (error) {
      logger.error('Error requesting NBE approval', { error, lcId });
      throw error;
    }
  }

  /**
   * Record NBE approval decision
   */
  async recordNBEApproval(
    lcId: string,
    approved: boolean,
    reference?: string,
    approvedBy?: string,
    rejectionReason?: string
  ): Promise<void> {
    try {
      logger.info('Recording NBE decision', { lcId, approved });

      const query = `
        UPDATE letter_of_credit
        SET 
          nbe_approval_status = $1,
          nbe_approval_date = CURRENT_TIMESTAMP,
          nbe_approval_reference = $2,
          nbe_approved_by = $3,
          nbe_rejection_reason = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE lc_id = $5
      `;

      const values = [
        approved ? 'APPROVED' : 'REJECTED',
        reference || null,
        approvedBy || null,
        rejectionReason || null,
        lcId,
      ];

      await this.pool.query(query, values);
      
      const eventDesc = approved 
        ? `NBE approved forex for LC (Ref: ${reference})`
        : `NBE rejected forex for LC: ${rejectionReason}`;
      
      await this.logHistory(lcId, approved ? 'NBE_APPROVED' : 'NBE_REJECTED', eventDesc, 'NBE', approvedBy);

      logger.info('NBE decision recorded', { lcId, approved });
    } catch (error) {
      logger.error('Error recording NBE decision', { error, lcId });
      throw error;
    }
  }

  /**
   * Present documents against LC
   */
  async presentDocuments(
    lcId: string,
    presentedBy: string,
    documents: any[]
  ): Promise<string> {
    try {
      logger.info('Presenting documents against LC', { lcId, documentCount: documents.length });

      // Insert document presentation
      const query = `
        INSERT INTO lc_document_presentations (
          lc_id, presented_by, documents_submitted, compliance_status
        ) VALUES ($1, $2, $3, 'PENDING')
        RETURNING presentation_id
      `;

      const result = await this.pool.query(query, [
        lcId,
        presentedBy,
        JSON.stringify(documents),
      ]);

      const presentationId = result.rows[0].presentation_id;

      // Update LC status
      await this.pool.query(
        `UPDATE letter_of_credit 
         SET status = 'DOCUMENTS_PRESENTED', 
             documents_presented_date = CURRENT_TIMESTAMP,
             documents_presented_by = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE lc_id = $2`,
        [presentedBy, lcId]
      );

      await this.logHistory(lcId, 'DOCUMENTS_PRESENTED', 'Documents presented against LC', 'EXPORTER', presentedBy);

      logger.info('Documents presented successfully', { lcId, presentationId });
      return presentationId;
    } catch (error) {
      logger.error('Error presenting documents', { error, lcId });
      throw error;
    }
  }

  /**
   * Record LC payment
   */
  async recordPayment(
    lcId: string,
    amount: number,
    reference: string,
    swiftMessage?: string
  ): Promise<void> {
    try {
      logger.info('Recording LC payment', { lcId, amount, reference });

      const query = `
        UPDATE letter_of_credit
        SET 
          status = 'PAID',
          payment_date = CURRENT_TIMESTAMP,
          payment_amount = $1,
          payment_reference = $2,
          payment_swift_message = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE lc_id = $4
      `;

      await this.pool.query(query, [amount, reference, swiftMessage || null, lcId]);
      
      await this.logHistory(
        lcId,
        'PAYMENT_RECEIVED',
        `Payment received: ${amount} (Ref: ${reference})`,
        'BANK'
      );

      logger.info('LC payment recorded', { lcId, amount, reference });
    } catch (error) {
      logger.error('Error recording payment', { error, lcId });
      throw error;
    }
  }

  /**
   * Get LC history
   */
  async getLCHistory(lcId: string): Promise<any[]> {
    try {
      const query = `
        SELECT 
          history_id, lc_id, event_type, event_description,
          previous_status, new_status, actor_type, actor_id, actor_name,
          event_data, created_at
        FROM lc_history
        WHERE lc_id = $1
        ORDER BY created_at DESC
      `;

      const result = await this.pool.query(query, [lcId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting LC history', { error, lcId });
      throw error;
    }
  }

  /**
   * Get LCs by exporter
   */
  async getLCsByExporter(exporterId: string, status?: string): Promise<LCResponse[]> {
    try {
      let query = `
        SELECT 
          lc_id, contract_id, exporter_id, lc_number, lc_type,
          issuing_bank_name, beneficiary_name, applicant_name,
          lc_amount, lc_currency, issue_date, expiry_date,
          status, nbe_approval_status, exporter_response,
          created_at, updated_at
        FROM letter_of_credit
        WHERE exporter_id = $1
      `;

      const values: any[] = [exporterId];

      if (status) {
        query += ' AND status = $2';
        values.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const result = await this.pool.query(query, values);
      return result.rows.map(row => this.mapToLCResponse(row));
    } catch (error) {
      logger.error('Error getting LCs by exporter', { error, exporterId });
      throw error;
    }
  }

  /**
   * Log LC history event
   */
  private async logHistory(
    lcId: string,
    eventType: string,
    description: string,
    actorType: string,
    actorId?: string
  ): Promise<void> {
    try {
      const query = `
        INSERT INTO lc_history (
          lc_id, event_type, event_description, actor_type, actor_id
        ) VALUES ($1, $2, $3, $4, $5)
      `;

      await this.pool.query(query, [lcId, eventType, description, actorType, actorId || null]);
    } catch (error) {
      logger.error('Error logging LC history', { error, lcId, eventType });
      // Don't throw - history logging failure shouldn't break main operation
    }
  }

  /**
   * Map database row to LC response
   */
  private mapToLCResponse(row: any): LCResponse {
    return {
      lcId: row.lc_id,
      contractId: row.contract_id,
      exporterId: row.exporter_id,
      lcNumber: row.lc_number,
      lcType: row.lc_type,
      issuingBankName: row.issuing_bank_name,
      beneficiaryName: row.beneficiary_name,
      applicantName: row.applicant_name,
      lcAmount: parseFloat(row.lc_amount),
      lcCurrency: row.lc_currency,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      status: row.status,
      nbeApprovalStatus: row.nbe_approval_status,
      exporterResponse: row.exporter_response,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
