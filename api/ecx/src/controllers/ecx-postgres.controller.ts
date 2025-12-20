import { Request, Response } from 'express';
import { Pool } from 'pg';
import { ExportService } from '../../../shared/services/export.service';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('ECXController');

export class ECXPostgresController {
  private exportService: ExportService;

  constructor(private pool: Pool) {
    this.exportService = new ExportService(pool);
  }

  /**
   * Get all exports (for ECX view)
   * GET /api/ecx/exports
   */
  async getExports(req: Request, res: Response) {
    try {
      const exports = await this.exportService.getPendingExports();

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
   * Get export by ID
   * GET /api/ecx/exports/:id
   */
  async getExportById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const export_record = await this.exportService.getExport(id);

      if (!export_record) {
        return res.status(404).json({ success: false, error: 'Export not found' });
      }

      res.json({ success: true, data: export_record });
    } catch (error) {
      logger.error('Error getting export', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get exports by status
   * GET /api/ecx/exports/status/:status
   */
  async getExportsByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;

      const exports = await this.exportService.getExportsByStatus(status);

      res.json({
        success: true,
        data: exports,
        count: exports.length
      });
    } catch (error) {
      logger.error('Error getting exports by status', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export history
   * GET /api/ecx/exports/:id/history
   */
  async getExportHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
   * GET /api/ecx/exports/:id/summary
   */
  async getExportSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const summary = await this.exportService.getExportSummary(id);

      if (!summary) {
        return res.status(404).json({ success: false, error: 'Export not found' });
      }

      res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error getting export summary', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get all approvals for export
   * GET /api/ecx/exports/:id/approvals
   */
  async getExportApprovals(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
   * Get export documents
   * GET /api/ecx/exports/:id/documents
   */
  async getExportDocuments(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
   * Get pending approvals
   * GET /api/ecx/pending
   */
  async getPendingApprovals(req: Request, res: Response) {
    try {
      const approvals = await this.exportService.getPendingApprovals();

      res.json({
        success: true,
        data: approvals,
        count: approvals.length
      });
    } catch (error) {
      logger.error('Error getting pending approvals', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export summary for all exports
   * GET /api/ecx/summary
   */
  async getAllExportSummaries(req: Request, res: Response) {
    try {
      const query = `
        SELECT * FROM export_summary
        ORDER BY created_at DESC
      `;
      const result = await this.pool.query(query);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      logger.error('Error getting export summaries', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
}
