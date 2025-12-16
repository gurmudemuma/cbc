import { Router, Request, Response } from 'express';
import { AuditService } from '../../../shared/auditService';

interface AuthJWTPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

/**
 * Create audit routes
 */
export function createAuditRoutes(auditService: AuditService): Router {
  const router = Router();

  /**
   * GET /audit/export/:exportId
   * Get audit logs for an export
   */
  router.get('/audit/export/:exportId', async (req: RequestWithUser, res: Response) => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }

      const logs = await auditService.getExportAuditLogs(exportId);

      res.status(200).json({
        success: true,
        message: 'Audit logs retrieved successfully',
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message,
      });
    }
  });

  /**
   * GET /audit/user/:userId
   * Get audit logs for a user
   */
  router.get('/audit/user/:userId', async (req: RequestWithUser, res: Response) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required',
        });
        return;
      }

      const logs = await auditService.getUserAuditLogs(userId, limit);

      res.status(200).json({
        success: true,
        message: 'User audit logs retrieved successfully',
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user audit logs',
        error: error.message,
      });
    }
  });

  /**
   * GET /audit/organization/:organizationId
   * Get audit logs for an organization
   */
  router.get('/audit/organization/:organizationId', async (req: RequestWithUser, res: Response) => {
    try {
      const { organizationId } = req.params;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 1000;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required',
        });
        return;
      }

      const logs = await auditService.getOrganizationAuditLogs(
        organizationId,
        startDate,
        endDate,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Organization audit logs retrieved successfully',
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch organization audit logs',
        error: error.message,
      });
    }
  });

  /**
   * GET /audit/action/:action
   * Get audit logs by action
   */
  router.get('/audit/action/:action', async (req: RequestWithUser, res: Response) => {
    try {
      const { action } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!action) {
        res.status(400).json({
          success: false,
          message: 'Action is required',
        });
        return;
      }

      const logs = await auditService.getAuditLogsByAction(action as any, limit);

      res.status(200).json({
        success: true,
        message: 'Audit logs by action retrieved successfully',
        data: logs,
        count: logs.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs by action',
        error: error.message,
      });
    }
  });

  /**
   * POST /audit/report
   * Generate audit report
   */
  router.post('/audit/report', async (req: RequestWithUser, res: Response) => {
    try {
      const { startDate, endDate, organizationId } = req.body;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          message: 'Start date and end date are required',
        });
        return;
      }

      const report = await auditService.generateAuditReport(
        new Date(startDate),
        new Date(endDate),
        organizationId
      );

      res.status(200).json({
        success: true,
        message: 'Audit report generated successfully',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate audit report',
        error: error.message,
      });
    }
  });

  /**
   * GET /audit/:auditId
   * Get specific audit log
   */
  router.get('/audit/:auditId', async (req: RequestWithUser, res: Response) => {
    try {
      const { auditId } = req.params;

      if (!auditId) {
        res.status(400).json({
          success: false,
          message: 'Audit ID is required',
        });
        return;
      }

      const log = await auditService.getAuditLog(auditId);

      if (!log) {
        res.status(404).json({
          success: false,
          message: 'Audit log not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Audit log retrieved successfully',
        data: log,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log',
        error: error.message,
      });
    }
  });

  /**
   * GET /audit/:auditId/verify
   * Verify audit log integrity
   */
  router.get('/audit/:auditId/verify', async (req: RequestWithUser, res: Response) => {
    try {
      const { auditId } = req.params;

      if (!auditId) {
        res.status(400).json({
          success: false,
          message: 'Audit ID is required',
        });
        return;
      }

      const isValid = await auditService.verifyAuditLogIntegrity(auditId);

      res.status(200).json({
        success: true,
        message: 'Audit log integrity verified',
        data: { auditId, isValid },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify audit log',
        error: error.message,
      });
    }
  });

  /**
   * GET /audit/statistics
   * Get audit statistics
   */
  router.get('/audit/statistics', async (req: RequestWithUser, res: Response) => {
    try {
      const stats = await auditService.getStatistics();

      res.status(200).json({
        success: true,
        message: 'Audit statistics retrieved successfully',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit statistics',
        error: error.message,
      });
    }
  });

  return router;
}

export default createAuditRoutes;
