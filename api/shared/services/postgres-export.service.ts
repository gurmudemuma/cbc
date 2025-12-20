import { getPool } from '../database/pool';
import { createLogger } from '../logger';

const logger = createLogger('PostgresExportService');

export interface ExportRecord {
  id: string;
  exporter_id: string;
  exporter_name: string;
  coffee_type: string;
  quantity: number;
  destination_country: string;
  status: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface ExportStatusHistory {
  id: string;
  export_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: Date;
  notes: string;
}

export interface ExportApproval {
  id: string;
  export_id: string;
  organization: string;
  approval_type: string;
  status: string;
  approved_by: string;
  approved_at: Date;
  notes: string;
}

export class PostgresExportService {
  /**
   * Create a new export
   */
  async createExport(
    exportId: string,
    exporterId: string,
    exporterName: string,
    coffeeType: string,
    quantity: number,
    destinationCountry: string,
    createdBy: string
  ): Promise<ExportRecord> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert export
      const result = await client.query(
        `INSERT INTO exports (
          id, exporter_id, exporter_name, coffee_type, quantity,
          destination_country, status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [exportId, exporterId, exporterName, coffeeType, quantity, destinationCountry, 'PENDING', createdBy]
      );

      // Insert initial status history
      await client.query(
        `INSERT INTO export_status_history (
          export_id, old_status, new_status, changed_by, changed_at, notes
        ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, 'NONE', 'PENDING', createdBy, 'Export created']
      );

      await client.query('COMMIT');

      logger.info('Export created', { exportId });
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create export', { error, exportId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get export by ID
   */
  async getExport(exportId: string): Promise<ExportRecord | null> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT * FROM exports WHERE id = $1`,
        [exportId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Failed to get export', { error, exportId });
      throw error;
    }
  }

  /**
   * Get all exports
   */
  async getAllExports(): Promise<ExportRecord[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT * FROM exports ORDER BY created_at DESC`
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get all exports', { error });
      throw error;
    }
  }

  /**
   * Get exports by status
   */
  async getExportsByStatus(status: string): Promise<ExportRecord[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT * FROM exports WHERE status = $1 ORDER BY created_at DESC`,
        [status]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get exports by status', { error, status });
      throw error;
    }
  }

  /**
   * Get exports by exporter
   */
  async getExportsByExporter(exporterId: string): Promise<ExportRecord[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT * FROM exports WHERE exporter_id = $1 ORDER BY created_at DESC`,
        [exporterId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get exports by exporter', { error, exporterId });
      throw error;
    }
  }

  /**
   * Update export status
   */
  async updateExportStatus(
    exportId: string,
    newStatus: string,
    changedBy: string,
    notes?: string
  ): Promise<ExportRecord> {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current export
      const currentResult = await client.query(
        `SELECT * FROM exports WHERE id = $1`,
        [exportId]
      );

      if (currentResult.rows.length === 0) {
        throw new Error(`Export not found: ${exportId}`);
      }

      const currentExport = currentResult.rows[0];
      const oldStatus = currentExport.status;

      // Update export
      const updateResult = await client.query(
        `UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [newStatus, exportId]
      );

      // Insert status history
      await client.query(
        `INSERT INTO export_status_history (
          export_id, old_status, new_status, changed_by, changed_at, notes
        ) VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportId, oldStatus, newStatus, changedBy, notes || `Status changed to ${newStatus}`]
      );

      await client.query('COMMIT');

      logger.info('Export status updated', { exportId, oldStatus, newStatus });
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to update export status', { error, exportId });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get status history for export
   */
  async getStatusHistory(exportId: string): Promise<ExportStatusHistory[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT * FROM export_status_history WHERE export_id = $1 ORDER BY changed_at DESC`,
        [exportId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get status history', { error, exportId });
      throw error;
    }
  }

  /**
   * Add approval
   */
  async addApproval(
    exportId: string,
    organization: string,
    approvalType: string,
    status: string,
    approvedBy: string,
    notes?: string
  ): Promise<ExportApproval> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `INSERT INTO export_approvals (
          export_id, organization, approval_type, status, approved_by, approved_at, notes
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        RETURNING *`,
        [exportId, organization, approvalType, status, approvedBy, notes || '']
      );

      logger.info('Approval added', { exportId, organization, approvalType, status });
      return result.rows[0];
    } catch (error) {
      logger.error('Failed to add approval', { error, exportId });
      throw error;
    }
  }

  /**
   * Get approvals for export
   */
  async getApprovals(exportId: string): Promise<ExportApproval[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT * FROM export_approvals WHERE export_id = $1 ORDER BY approved_at DESC`,
        [exportId]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get approvals', { error, exportId });
      throw error;
    }
  }

  /**
   * Get export summary
   */
  async getExportSummary(exporterId?: string): Promise<any> {
    try {
      let query = `
        SELECT 
          status,
          COUNT(*) as count,
          SUM(quantity) as total_quantity
        FROM exports
      `;
      const params: any[] = [];

      if (exporterId) {
        query += ` WHERE exporter_id = $1`;
        params.push(exporterId);
      }

      query += ` GROUP BY status ORDER BY status`;

      const pool = getPool();
      const result = await pool.query(query, params);

      const summary: any = {
        total: 0,
        byStatus: {}
      };

      result.rows.forEach(row => {
        summary.byStatus[row.status] = {
          count: parseInt(row.count),
          totalQuantity: parseFloat(row.total_quantity || 0)
        };
        summary.total += parseInt(row.count);
      });

      return summary;
    } catch (error) {
      logger.error('Failed to get export summary', { error });
      throw error;
    }
  }

  /**
   * Get pending approvals by organization
   */
  async getPendingApprovalsByOrganization(organization: string): Promise<ExportRecord[]> {
    try {
      const pool = getPool();
      const result = await pool.query(
        `SELECT DISTINCT e.* FROM exports e
         LEFT JOIN export_approvals ea ON e.id = ea.export_id
         WHERE (ea.organization = $1 AND ea.status IS NULL)
            OR (ea.organization = $1 AND ea.status = 'PENDING')
         ORDER BY e.created_at ASC`,
        [organization]
      );
      return result.rows;
    } catch (error) {
      logger.error('Failed to get pending approvals', { error, organization });
      throw error;
    }
  }

  /**
   * Get export statistics
   */
  async getExportStatistics(): Promise<any> {
    try {
      const pool = getPool();
      const result = await pool.query(`
        SELECT 
          COUNT(*) as total_exports,
          SUM(quantity) as total_quantity,
          COUNT(DISTINCT exporter_id) as total_exporters,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_exports,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_exports,
          COUNT(CASE WHEN status = 'FX_REJECTED' THEN 1 END) as rejected_exports
        FROM exports
      `);

      return result.rows[0];
    } catch (error) {
      logger.error('Failed to get export statistics', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const postgresExportService = new PostgresExportService();
