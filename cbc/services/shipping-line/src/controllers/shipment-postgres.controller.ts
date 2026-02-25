import { Request, Response } from 'express';
import { Pool } from 'pg';
import { ExportService } from '@shared/services/export.service';
import { createLogger } from '@shared/logger';

const logger = createLogger('ShipmentController');

export class ShipmentPostgresController {
  private exportService: ExportService;

  constructor(private pool: Pool) {
    this.exportService = new ExportService(pool);
  }

  /**
   * Get ready for shipment exports
   * GET /api/shipments/ready
   */
  async getReadyExports(req: Request, res: Response) {
    try {
      const exports = await this.exportService.getExportsByStatus('QUALITY_CERTIFIED');

      return res.json({
        success: true,
        data: exports,
        count: exports.length
      });
    } catch (error) {
      logger.error('Error getting ready exports', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get all exports (for Shipping Line view)
   * GET /api/shipments/exports
   */
  async getExports(req: Request, res: Response) {
    try {
      const exports = await this.exportService.getPendingExports();

      return res.json({
        success: true,
        data: exports,
        count: exports.length
      });
    } catch (error) {
      logger.error('Error getting exports', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export by ID
   * GET /api/shipments/exports/:id
   */
  async getExportById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const export_record = await this.exportService.getExport(id);

      if (!export_record) {
        return res.status(404).json({ success: false, error: 'Export not found' });
      }

      return res.json({ success: true, data: export_record });
    } catch (error) {
      logger.error('Error getting export', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Schedule shipment
   * POST /api/shipments/schedule
   */
  async scheduleShipment(req: Request, res: Response) {
    try {
      const { export_id, vessel_name, departure_date, arrival_date } = req.body;
      const user_id = (req as any).user?.id;

      if (!user_id) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      if (!export_id || !vessel_name || !departure_date || !arrival_date) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: export_id, vessel_name, departure_date, arrival_date'
        });
      }

      // Update export status
      const updated = await this.exportService.updateExportStatus({
        export_id,
        new_status: 'SHIPMENT_SCHEDULED',
        changed_by: user_id,
        organization: 'ShippingLine',
        reason: `Shipment scheduled on ${vessel_name}`
      });

      // Record approval
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'SHIPMENT_SCHEDULING',
        organization: 'ShippingLine',
        approved_by: user_id,
        status: 'APPROVED',
        approval_data: {
          vessel_name,
          departure_date,
          arrival_date,
          scheduled_at: new Date().toISOString()
        }
      });

      logger.info('Shipment scheduled', { export_id, vessel_name, approved_by: user_id });

      return res.json({
        success: true,
        data: updated,
        message: 'Shipment scheduled'
      });
    } catch (error) {
      logger.error('Error scheduling shipment', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Confirm shipment
   * POST /api/shipments/confirm
   */
  async confirmShipment(req: Request, res: Response) {
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
        new_status: 'SHIPPED',
        changed_by: user_id,
        organization: 'ShippingLine',
        reason: 'Shipment confirmed'
      });

      // Record approval
      await this.exportService.recordApproval({
        export_id,
        approval_type: 'SHIPMENT_SCHEDULING',
        organization: 'ShippingLine',
        approved_by: user_id,
        status: 'APPROVED',
        approval_data: { confirmed_at: new Date().toISOString() }
      });

      logger.info('Shipment confirmed', { export_id, confirmed_by: user_id });

      return res.json({
        success: true,
        data: updated,
        message: 'Shipment confirmed'
      });
    } catch (error) {
      logger.error('Error confirming shipment', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export history
   * GET /api/shipments/exports/:id/history
   */
  async getExportHistory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const history = await this.exportService.getExportHistory(id);

      return res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error) {
      logger.error('Error getting export history', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  /**
   * Get export summary
   * GET /api/shipments/exports/:id/summary
   */
  async getExportSummary(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const summary = await this.exportService.getExportSummary(id);

      if (!summary) {
        return res.status(404).json({ success: false, error: 'Export not found' });
      }

      return res.json({ success: true, data: summary });
    } catch (error) {
      logger.error('Error getting export summary', { error });
      return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
}
