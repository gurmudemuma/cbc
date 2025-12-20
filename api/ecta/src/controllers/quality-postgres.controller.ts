import { Request, Response } from 'express';
import { Pool } from 'pg';
import { ExportService } from '../../../shared/services/export.service';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('QualityController');

export class QualityPostgresController {
  private exportService: ExportService;

  constructor(private pool: Pool) {
    this.exportService = new ExportService(pool);
  }

  /**
   * Get pending quality certifications
   * GET /api/quality/pending
   */
  async getPendingCertifications(req: Request, res: Response) {
    try {
      const approvals = await this.exportService.getPendingApprovals('ECTA');

      res.json({
        success: true,
        data: approvals,
        count: approvals.length
      });
    } catch (error) {
      logger.error('Error getting pending certifications', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get all exports (for ECTA view)
   * GET /api/quality/exports
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
   * GET /api/quality/exports/:id
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
   * Issue quality certificate
   * POST /api/quality/certify
   */
  async issueCertificate(req: Request, res: Response) {
    try {
      const { export_id, quality_grade, cupping_score } = req.body;
      const user_id = (req as any).user?.id;

      if (!user_id) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      if (!export_id || !quality_grade) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: export_id, quality_grade'
        });
      }

      // Update export status
      const updated = await this.exportService.updateExportStatus({
        export_id,
        new_status: 'QUALITY_CERTIFIED',
        changed_by: user_id,
        organization: 'ECTA',
        reason: `Quality certified with grade ${quality_grade}`
      });

      // Record approval with quality data
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'QUALITY_CERTIFICATION',
        organization: 'ECTA',
        approved_by: user_id,
        status: 'APPROVED',
        approval_data: {
          quality_grade,
          cupping_score: cupping_score || null,
          certified_at: new Date().toISOString()
        }
      });

      logger.info('Quality certificate issued', { export_id, quality_grade, approved_by: user_id });

      res.json({
        success: true,
        data: updated,
        message: 'Quality certificate issued'
      });
    } catch (error) {
      logger.error('Error issuing quality certificate', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Reject quality
   * POST /api/quality/reject
   */
  async rejectQuality(req: Request, res: Response) {
    try {
      const { export_id, reason } = req.body;
      const user_id = (req as any).user?.id;

      if (!user_id) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      if (!export_id) {
        return res.status(400).json({ success: false, error: 'Missing required field: export_id' });
      }

      // Update export status
      const updated = await this.exportService.updateExportStatus({
        export_id,
        new_status: 'QUALITY_REJECTED',
        changed_by: user_id,
        organization: 'ECTA',
        reason: reason || 'Quality rejected by ECTA'
      });

      // Record rejection
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'QUALITY_CERTIFICATION',
        organization: 'ECTA',
        approved_by: user_id,
        status: 'REJECTED',
        rejection_reason: reason,
        approval_data: { rejected_at: new Date().toISOString(), reason }
      });

      logger.info('Quality rejected', { export_id, rejected_by: user_id });

      res.json({
        success: true,
        data: updated,
        message: 'Quality rejected'
      });
    } catch (error) {
      logger.error('Error rejecting quality', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export history
   * GET /api/quality/exports/:id/history
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
   * GET /api/quality/exports/:id/summary
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
}
