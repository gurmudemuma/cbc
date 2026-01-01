import { Request, Response } from 'express';
import { Pool } from 'pg';
<<<<<<< HEAD
import { ExportService } from '@shared/services/export.service';
import { createLogger } from '@shared/logger';
=======
import { ExportService } from '../../../shared/services/export.service';
import { createLogger } from '../../../shared/logger';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('CustomsController');

export class CustomsPostgresController {
  private exportService: ExportService;

  constructor(private pool: Pool) {
    this.exportService = new ExportService(pool);
  }

  /**
   * Get pending customs clearances
   * GET /api/customs/pending
   */
  async getPendingClearances(_req: Request, res: Response) {
    try {
      const approvals = await this.exportService.getPendingApprovals('CustomAuthorities');

      res.json({
        success: true,
        data: approvals,
        count: approvals.length
      });
    } catch (error) {
      logger.error('Error getting pending clearances', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get all exports (for Custom Authorities view)
   * GET /api/customs/exports
   */
  async getExports(_req: Request, res: Response) {
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
   * GET /api/customs/exports/:id
   */
  async getExportById(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
   * Clear customs
   * POST /api/customs/clear
   */
  async clearCustoms(req: Request, res: Response) {
    try {
      const { export_id, customs_clearance_number } = req.body;
      const user_id = (req as any).user?.id;

      if (!user_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      if (!export_id || !customs_clearance_number) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: export_id, customs_clearance_number'
        });
        return;
      }

      // Get current export to check status
      const current = await this.exportService.getExport(export_id);
      if (!current) {
        res.status(404).json({ success: false, error: 'Export not found' });
        return;
      }

      // Update export with customs clearance info
      const query = `
        UPDATE exports 
        SET customs_cleared_by = $1, customs_cleared_at = NOW(), customs_clearance_number = $2, updated_at = NOW()
        WHERE export_id = $3
        RETURNING *
      `;

      const result = await this.pool.query(query, [user_id, customs_clearance_number, export_id]);

      // Record approval
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'CUSTOMS_CLEARANCE',
        organization: 'CustomAuthorities',
        approved_by: user_id,
        status: 'APPROVED',
        approval_data: {
          customs_clearance_number,
          cleared_at: new Date().toISOString()
        }
      });

      logger.info('Customs cleared', { export_id, customs_clearance_number, cleared_by: user_id });

      res.json({
        success: true,
        data: result.rows[0],
        message: 'Customs cleared successfully'
      });
    } catch (error) {
      logger.error('Error clearing customs', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Reject customs clearance
   * POST /api/customs/reject
   */
  async rejectClearance(req: Request, res: Response) {
    try {
      const { export_id, reason } = req.body;
      const user_id = (req as any).user?.id;

      if (!user_id) {
        res.status(401).json({ success: false, error: 'User not authenticated' });
        return;
      }

      if (!export_id) {
        res.status(400).json({ success: false, error: 'Missing required field: export_id' });
        return;
      }

      // Record rejection
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'CUSTOMS_CLEARANCE',
        organization: 'CustomAuthorities',
        approved_by: user_id,
        status: 'REJECTED',
        rejection_reason: reason,
        approval_data: { rejected_at: new Date().toISOString(), reason }
      });

      logger.info('Customs clearance rejected', { export_id, rejected_by: user_id });

      res.json({
        success: true,
        message: 'Customs clearance rejected'
      });
    } catch (error) {
      logger.error('Error rejecting customs clearance', { error });
      res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export history
   * GET /api/customs/exports/:id/history
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
   * GET /api/customs/exports/:id/summary
   */
  async getExportSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;

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
}
