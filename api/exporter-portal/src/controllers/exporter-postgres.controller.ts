import { Request, Response } from 'express';
import { Pool } from 'pg';
import { ExportService } from '../../../shared/services/export.service';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('ExporterPortalController');

export class ExporterPortalPostgresController {
  private exportService: ExportService;

  constructor(private pool: Pool) {
    this.exportService = new ExportService(pool);
  }

  /**
   * Create new export request
   * POST /api/exports
   */
  async createExport(req: Request, res: Response): Promise<void> {
    try {
      const { coffee_type, origin_region, quantity, destination_country, estimated_value, buyer_name, buyer_country, buyer_email } = req.body;
      const exporter_id = (req as any).user?.id;

      if (!exporter_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      if (!coffee_type || !quantity || !destination_country) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: coffee_type, quantity, destination_country'
        });
        return;
      }

      const export_record = await this.exportService.createExport({
        exporter_id,
        coffee_type,
        origin_region,
        quantity: parseFloat(quantity),
        destination_country,
        estimated_value: estimated_value ? parseFloat(estimated_value) : undefined,
        buyer_name,
        buyer_country,
        buyer_email
      });

      logger.info('Export created successfully', { export_id: export_record.export_id });

      res.status(201).json({
        success: true,
        data: export_record,
        message: 'Export request created successfully'
      });
    } catch (error) {
      logger.error('Error creating export', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get all exports for authenticated exporter
   * GET /api/exports
   */
  async getExports(req: Request, res: Response): Promise<void> {
    try {
      const exporter_id = (req as any).user?.id;

      if (!exporter_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const exports = await this.exportService.getExporterExports(exporter_id);

      res.json({
        success: true,
        data: exports,
        count: exports.length
      });
    } catch (error) {
      logger.error('Error getting exports', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get exporter's export summaries
   * GET /api/exports/summaries
   */
  async getExporterSummaries(req: Request, res: Response): Promise<void> {
    try {
      const exporter_id = (req as any).user?.id;

      if (!exporter_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const summaries = await this.exportService.getExporterSummaries(exporter_id);

      if (!summaries || summaries.length === 0) {
        res.json({
          success: true,
          data: [],
          count: 0
        });
        return;
      }

      res.json({
        success: true,
        data: summaries,
        count: summaries.length
      });
    } catch (error) {
      logger.error('Error getting exporter summaries', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export by ID
   * GET /api/exports/:id
   */
  async getExportById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'Missing export ID' });
        return;
      }

      const export_record = await this.exportService.getExport(id);

      if (!export_record) {
        res.status(404).json({ success: false, error: 'Export not found' });
        return;
      }

      res.json({ success: true, data: export_record });
    } catch (error) {
      logger.error('Error getting export', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export history
   * GET /api/exports/:id/history
   */
  async getExportHistory(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'Missing export ID' });
        return;
      }

      const history = await this.exportService.getExportHistory(id);

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      logger.error('Error getting export history', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export summary
   * GET /api/exports/:id/summary
   */
  async getExportSummary(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'Missing export ID' });
        return;
      }

      const summary = await this.exportService.getExportSummary(id);

      if (!summary) {
        res.status(404).json({ success: false, error: 'Export not found' });
        return;
      }

      res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error getting export summary', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get all approvals for export
   * GET /api/exports/:id/approvals
   */
  async getExportApprovals(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'Missing export ID' });
        return;
      }

      const approvals = await this.exportService.getExportApprovals(id);

      res.json({
        success: true,
        data: approvals,
        count: approvals.length
      });
    } catch (error) {
      logger.error('Error getting export approvals', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Add document to export
   * POST /api/exports/:id/documents
   */
  async addDocument(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { document_type, document_name, document_path, file_size, mime_type, ipfs_hash } = req.body;
      const user_id = (req as any).user?.id;

      if (!user_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      if (!id) {
        res.status(400).json({ success: false, error: 'Missing export ID' });
        return;
      }

      if (!document_type || !document_name || !document_path) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: document_type, document_name, document_path'
        });
        return;
      }

      const document = await this.exportService.addDocument(id, {
        type: document_type,
        name: document_name,
        path: document_path,
        size: file_size || null,
        mime_type: mime_type || null,
        uploaded_by: user_id,
        ipfs_hash: ipfs_hash || null
      });

      logger.info('Document added to export', { export_id: id, document_id: document.document_id });

      res.status(201).json({
        success: true,
        data: document,
        message: 'Document added successfully'
      });
    } catch (error) {
      logger.error('Error adding document', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export documents
   * GET /api/exports/:id/documents
   */
  async getExportDocuments(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ success: false, error: 'Missing export ID' });
        return;
      }

      const documents = await this.exportService.getExportDocuments(id);

      res.json({
        success: true,
        data: documents,
        count: documents.length
      });
    } catch (error) {
      logger.error('Error getting export documents', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get dashboard statistics
   * GET /api/dashboard/stats
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const exporter_id = (req as any).user?.id;

      if (!exporter_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const query = `
        SELECT 
          COUNT(*) as total_exports,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'FX_APPROVED' THEN 1 END) as fx_approved,
          COUNT(CASE WHEN status = 'QUALITY_CERTIFIED' THEN 1 END) as quality_certified,
          COUNT(CASE WHEN status = 'SHIPMENT_SCHEDULED' THEN 1 END) as shipment_scheduled,
          COUNT(CASE WHEN status = 'SHIPPED' THEN 1 END) as shipped,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
          COUNT(CASE WHEN status IN ('FX_REJECTED', 'QUALITY_REJECTED', 'CANCELLED') THEN 1 END) as failed,
          SUM(CASE WHEN status = 'COMPLETED' THEN quantity ELSE 0 END) as total_quantity_shipped,
          SUM(CASE WHEN status = 'COMPLETED' THEN estimated_value ELSE 0 END) as total_value_shipped
        FROM exports
        WHERE exporter_id = $1
      `;

      const result = await this.pool.query(query, [exporter_id]);
      const stats = result.rows[0];

      res.json({
        success: true,
        data: {
          total_exports: parseInt(stats.total_exports || '0'),
          pending: parseInt(stats.pending || '0'),
          fx_approved: parseInt(stats.fx_approved || '0'),
          quality_certified: parseInt(stats.quality_certified || '0'),
          shipment_scheduled: parseInt(stats.shipment_scheduled || '0'),
          shipped: parseInt(stats.shipped || '0'),
          completed: parseInt(stats.completed || '0'),
          failed: parseInt(stats.failed || '0'),
          total_quantity_shipped: parseFloat(stats.total_quantity_shipped || '0'),
          total_value_shipped: parseFloat(stats.total_value_shipped || '0')
        }
      });
    } catch (error) {
      logger.error('Error getting dashboard stats', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get recent activity
   * GET /api/dashboard/activity
   */
  async getRecentActivity(req: Request, res: Response): Promise<void> {
    try {
      const exporter_id = (req as any).user?.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      if (!exporter_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      const query = `
        SELECT 
          esh.history_id,
          esh.export_id,
          esh.old_status,
          esh.new_status,
          esh.changed_by,
          esh.organization,
          esh.reason,
          esh.created_at,
          e.coffee_type,
          e.quantity,
          e.destination_country
        FROM export_status_history esh
        JOIN exports e ON esh.export_id = e.export_id
        WHERE e.exporter_id = $1
        ORDER BY esh.created_at DESC
        LIMIT $2
      `;

      const result = await this.pool.query(query, [exporter_id, limit]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      logger.error('Error getting recent activity', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
}
