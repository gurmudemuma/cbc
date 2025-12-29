import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../logger';

const logger = createLogger('ExportService');

export interface ExportRequest {
  exportId?: string;
  export_id?: string;
  exporterName?: string;
  exporter_id?: string;
  coffeeType?: string;
  coffee_type?: string;
  quantity: number;
  destinationCountry?: string;
  destination_country?: string;
  estimatedValue?: number;
  estimated_value?: number;
  status: string;
  qualityGrade?: string;
  qualityDocuments?: any[];
  fxDocuments?: any[];
  exportCustomsDocuments?: any[];
  shipmentDocuments?: any[];
  exportCustomsDeclarationNumber?: string;
  exportCustomsClearedBy?: string;
  exportCustomsClearedAt?: string;
  shippingLineId?: string;
  exportLicenseNumber?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface CreateExportRequest {
  exporter_id: string;
  coffee_type: string;
  origin_region?: string;
  quantity: number;
  destination_country: string;
  estimated_value?: number;
  buyer_name?: string;
  buyer_country?: string;
  buyer_email?: string;
}

export interface UpdateExportStatusRequest {
  export_id: string;
  new_status: string;
  changed_by: string;
  organization?: string;
  reason?: string;
}

export interface ExportApprovalData {
  export_id: string;
  approval_type: string;
  organization: string;
  approved_by: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason?: string;
  approval_data?: Record<string, any>;
}

export class ExportService {
  constructor(private pool: Pool) {}

  /**
   * Create a new export request
   */
  async createExport(data: CreateExportRequest) {
    try {
      const export_id = uuidv4();
      const query = `
        INSERT INTO exports (
          export_id, exporter_id, coffee_type, origin_region, quantity,
          destination_country, estimated_value, buyer_name, buyer_country, buyer_email,
          status, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING', NOW(), NOW()
        )
        RETURNING *;
      `;

      const result = await this.pool.query(query, [
        export_id,
        data.exporter_id,
        data.coffee_type,
        data.origin_region || null,
        data.quantity,
        data.destination_country,
        data.estimated_value || null,
        data.buyer_name || null,
        data.buyer_country || null,
        data.buyer_email || null
      ]);

      logger.info('Export created', { export_id, exporter_id: data.exporter_id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating export', { error });
      throw error;
    }
  }

  /**
   * Get export by ID
   */
  async getExport(export_id: string) {
    try {
      const query = 'SELECT * FROM exports WHERE export_id = $1';
      const result = await this.pool.query(query, [export_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting export', { error, export_id });
      throw error;
    }
  }

  /**
   * Get all exports for an exporter
   */
  async getExporterExports(exporter_id: string) {
    try {
      const query = `
        SELECT * FROM exports 
        WHERE exporter_id = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [exporter_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting exporter exports', { error, exporter_id });
      throw error;
    }
  }

  /**
   * Get exports by status
   */
  async getExportsByStatus(status: string) {
    try {
      const query = `
        SELECT * FROM exports 
        WHERE status = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [status]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting exports by status', { error, status });
      throw error;
    }
  }

  /**
   * Get all pending exports
   */
  async getPendingExports() {
    try {
      const query = `
        SELECT * FROM exports 
        WHERE status IN ('PENDING', 'FX_APPROVED', 'QUALITY_CERTIFIED', 'SHIPMENT_SCHEDULED')
        ORDER BY created_at ASC
      `;
      const result = await this.pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting pending exports', { error });
      throw error;
    }
  }

  /**
   * Update export status
   */
  async updateExportStatus(data: UpdateExportStatusRequest) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Get current export
      const currentResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
        [data.export_id]
      );

      if (currentResult.rows.length === 0) {
        throw new Error(`Export not found: ${data.export_id}`);
      }

      const current = currentResult.rows[0];

      // Update export status
      const updateQuery = `
        UPDATE exports 
        SET status = $1, updated_at = NOW()
        WHERE export_id = $2
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [
        data.new_status,
        data.export_id
      ]);

      // Record status change in history
      const historyQuery = `
        INSERT INTO export_status_history (
          history_id, export_id, old_status, new_status, changed_by, organization, reason, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, NOW()
        )
      `;

      await client.query(historyQuery, [
        uuidv4(),
        data.export_id,
        current.status,
        data.new_status,
        data.changed_by,
        data.organization || null,
        data.reason || null
      ]);

      await client.query('COMMIT');

      logger.info('Export status updated', {
        export_id: data.export_id,
        old_status: current.status,
        new_status: data.new_status,
        changed_by: data.changed_by
      });

      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Error updating export status', { error, data });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get export history
   */
  async getExportHistory(export_id: string) {
    try {
      const query = `
        SELECT * FROM export_status_history 
        WHERE export_id = $1
        ORDER BY created_at ASC
      `;
      const result = await this.pool.query(query, [export_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting export history', { error, export_id });
      throw error;
    }
  }

  /**
   * Add document to export
   */
  async addDocument(export_id: string, document_data: any) {
    try {
      const query = `
        INSERT INTO export_documents (
          document_id, export_id, document_type, document_name, document_path,
          file_size, mime_type, uploaded_by, ipfs_hash, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
        )
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        uuidv4(),
        export_id,
        document_data.type,
        document_data.name,
        document_data.path,
        document_data.size || null,
        document_data.mime_type || null,
        document_data.uploaded_by,
        document_data.ipfs_hash || null
      ]);

      logger.info('Document added to export', { export_id, document_id: result.rows[0].document_id });
      return result.rows[0];
    } catch (error) {
      logger.error('Error adding document', { error, export_id });
      throw error;
    }
  }

  /**
   * Get export documents
   */
  async getExportDocuments(export_id: string) {
    try {
      const query = `
        SELECT * FROM export_documents 
        WHERE export_id = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [export_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting export documents', { error, export_id });
      throw error;
    }
  }

  /**
   * Record approval
   */
  async recordApproval(data: ExportApprovalData) {
    try {
      const query = `
        INSERT INTO export_approvals (
          approval_id, export_id, approval_type, organization, approved_by,
          status, approval_date, rejection_reason, approval_data, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        uuidv4(),
        data.export_id,
        data.approval_type,
        data.organization,
        data.approved_by,
        data.status,
        data.status === 'APPROVED' ? new Date() : null,
        data.rejection_reason || null,
        JSON.stringify(data.approval_data || {})
      ]);

      logger.info('Approval recorded', {
        export_id: data.export_id,
        approval_type: data.approval_type,
        status: data.status
      });

      return result.rows[0];
    } catch (error) {
      logger.error('Error recording approval', { error, data });
      throw error;
    }
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(organization?: string) {
    try {
      let query = `
        SELECT * FROM pending_approvals_by_org
      `;
      const params: any[] = [];

      if (organization) {
        query += ` WHERE organization = $1`;
        params.push(organization);
      }

      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting pending approvals', { error, organization });
      throw error;
    }
  }

  /**
   * Get export summary
   */
  async getExportSummary(export_id: string) {
    try {
      const query = `
        SELECT * FROM export_summary 
        WHERE export_id = $1
      `;
      const result = await this.pool.query(query, [export_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting export summary', { error, export_id });
      throw error;
    }
  }

  /**
   * Get all export summaries for exporter
   */
  async getExporterSummaries(exporter_id: string) {
    try {
      const query = `
        SELECT * FROM export_summary 
        WHERE exporter_id = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [exporter_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting exporter summaries', { error, exporter_id });
      throw error;
    }
  }

  /**
   * Get approval by ID
   */
  async getApproval(approval_id: string) {
    try {
      const query = 'SELECT * FROM export_approvals WHERE approval_id = $1';
      const result = await this.pool.query(query, [approval_id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error getting approval', { error, approval_id });
      throw error;
    }
  }

  /**
   * Get approvals for export
   */
  async getExportApprovals(export_id: string) {
    try {
      const query = `
        SELECT * FROM export_approvals 
        WHERE export_id = $1
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query, [export_id]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting export approvals', { error, export_id });
      throw error;
    }
  }

  /**
   * Update approval status
   */
  async updateApprovalStatus(
    approval_id: string,
    status: 'APPROVED' | 'REJECTED',
    rejection_reason?: string
  ) {
    try {
      const query = `
        UPDATE export_approvals 
        SET status = $1, rejection_reason = $2, approval_date = NOW(), updated_at = NOW()
        WHERE approval_id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        status,
        rejection_reason || null,
        approval_id
      ]);

      logger.info('Approval status updated', { approval_id, status });
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating approval status', { error, approval_id });
      throw error;
    }
  }
}

/**
 * Factory function to create ExportService with database pool
 */
export function createExportService(pool: Pool): ExportService {
  return new ExportService(pool);
}
