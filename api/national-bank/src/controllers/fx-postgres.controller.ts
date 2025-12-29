import { Request, Response } from 'express';
import { Pool } from 'pg';
<<<<<<< HEAD
import { ExportService } from '@shared/services/export.service';
import { createLogger } from '@shared/logger';
=======
import { ExportService } from '../../../shared/services/export.service';
import { createLogger } from '../../../shared/logger';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('FXController');

export class FXPostgresController {
  private exportService: ExportService;

  constructor(private pool: Pool) {
    this.exportService = new ExportService(pool);
  }

  /**
   * Get pending FX approvals
   * GET /api/fx/pending
   */
  async getPendingApprovals(req: Request, res: Response) {
    try {
      const approvals = await this.exportService.getPendingApprovals('NationalBank');

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
   * Get all exports (for National Bank view)
   * GET /api/fx/exports
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
   * GET /api/fx/exports/:id
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
   * Approve FX
   * POST /api/fx/approve
   */
  async approveFX(req: Request, res: Response) {
    try {
      const { export_id } = req.body;
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
        new_status: 'FX_APPROVED',
        changed_by: user_id,
        organization: 'NationalBank',
        reason: 'FX approved by National Bank'
      });

      // Record approval
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'FX_APPROVAL',
        organization: 'NationalBank',
        approved_by: user_id,
        status: 'APPROVED',
        approval_data: { approved_at: new Date().toISOString() }
      });

      logger.info('FX approved', { export_id, approved_by: user_id });

      res.json({
        success: true,
        data: updated,
        message: 'FX approved successfully'
      });
    } catch (error) {
      logger.error('Error approving FX', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Reject FX
   * POST /api/fx/reject
   */
  async rejectFX(req: Request, res: Response) {
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
        new_status: 'FX_REJECTED',
        changed_by: user_id,
        organization: 'NationalBank',
        reason: reason || 'FX rejected by National Bank'
      });

      // Record rejection
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'FX_APPROVAL',
        organization: 'NationalBank',
        approved_by: user_id,
        status: 'REJECTED',
        rejection_reason: reason,
        approval_data: { rejected_at: new Date().toISOString(), reason }
      });

      logger.info('FX rejected', { export_id, rejected_by: user_id });

      res.json({
        success: true,
        data: updated,
        message: 'FX rejected'
      });
    } catch (error) {
      logger.error('Error rejecting FX', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export history
   * GET /api/fx/exports/:id/history
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
   * GET /api/fx/exports/:id/summary
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
