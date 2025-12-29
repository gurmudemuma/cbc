import { Request, Response } from 'express';
import { Pool } from 'pg';
<<<<<<< HEAD
import { ExportService } from '@shared/services/export.service';
import { createLogger } from '@shared/logger';
=======
import { ExportService } from '../../../shared/services/export.service';
import { createLogger } from '../../../shared/logger';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

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

<<<<<<< HEAD
      return res.json({
=======
      res.json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        success: true,
        data: exports,
        count: exports.length
      });
    } catch (error) {
      logger.error('Error getting exports', { error });
<<<<<<< HEAD
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
      return res.json({ success: true, data: export_record });
    } catch (error) {
      logger.error('Error getting export', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.json({ success: true, data: export_record });
    } catch (error) {
      logger.error('Error getting export', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
      return res.json({
=======
      res.json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        success: true,
        data: exports,
        count: exports.length
      });
    } catch (error) {
      logger.error('Error getting exports by status', { error });
<<<<<<< HEAD
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
      return res.json({
=======
      res.json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      logger.error('Error getting export history', { error });
<<<<<<< HEAD
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
      return res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error getting export summary', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error getting export summary', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
      return res.json({
=======
      res.json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        success: true,
        data: approvals,
        count: approvals.length
      });
    } catch (error) {
      logger.error('Error getting export approvals', { error });
<<<<<<< HEAD
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
      return res.json({
=======
      res.json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        success: true,
        data: documents,
        count: documents.length
      });
    } catch (error) {
      logger.error('Error getting export documents', { error });
<<<<<<< HEAD
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    }
  }

  /**
   * Get pending approvals
   * GET /api/ecx/pending
   */
  async getPendingApprovals(req: Request, res: Response) {
    try {
      const approvals = await this.exportService.getPendingApprovals();

<<<<<<< HEAD
      return res.json({
=======
      res.json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        success: true,
        data: approvals,
        count: approvals.length
      });
    } catch (error) {
      logger.error('Error getting pending approvals', { error });
<<<<<<< HEAD
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
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

<<<<<<< HEAD
      return res.json({
=======
      res.json({
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        success: true,
        data: result.rows,
        count: result.rows.length
      });
    } catch (error) {
      logger.error('Error getting export summaries', { error });
<<<<<<< HEAD
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
=======
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
    }
  }
}
