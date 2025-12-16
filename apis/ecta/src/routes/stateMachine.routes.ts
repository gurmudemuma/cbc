import { Router, Request, Response } from 'express';
import { ExportStateMachine } from '../../../shared/stateMachine';
import { FabricGateway } from '../fabric/gateway';
import { createExportService } from '../../../shared/exportService';
import { ExportStatus } from '../../../shared/exportService';

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
 * Create state machine routes
 */
export function createStateMachineRoutes(): Router {
  const router = Router();
  const fabricGateway = FabricGateway.getInstance();

  /**
   * GET /export/:exportId/next-statuses
   * Get allowed next statuses for an export
   */
  router.get('/export/:exportId/next-statuses', async (req: RequestWithUser, res: Response) => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        res.status(400).json({
          success: false,
          message: 'Export ID is required',
        });
        return;
      }

      const contract = fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);

      const nextStatuses = ExportStateMachine.getNextStatuses(exportData.status);
      const stage = ExportStateMachine.getWorkflowStage(exportData.status);
      const progress = ExportStateMachine.getProgressPercentage(exportData.status);
      const isTerminal = ExportStateMachine.isTerminalState(exportData.status);

      res.status(200).json({
        success: true,
        message: 'Next statuses retrieved successfully',
        data: {
          currentStatus: exportData.status,
          currentStage: stage,
          progress,
          isTerminal,
          nextStatuses,
          nextStages: nextStatuses.map((status) => ExportStateMachine.getWorkflowStage(status)),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch next statuses',
        error: error.message,
      });
    }
  });

  /**
   * POST /validate-transition
   * Validate a status transition
   */
  router.post('/validate-transition', async (req: RequestWithUser, res: Response) => {
    try {
      const { exportId, newStatus } = req.body;

      if (!exportId || !newStatus) {
        res.status(400).json({
          success: false,
          message: 'Export ID and new status are required',
        });
        return;
      }

      const contract = fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);

      const transitionInfo = ExportStateMachine.getTransitionInfo(
        exportData.status,
        newStatus as ExportStatus
      );

      res.status(200).json({
        success: true,
        message: 'Transition validation completed',
        data: transitionInfo,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to validate transition',
        error: error.message,
      });
    }
  });

  /**
   * GET /transitions
   * Get all valid transitions
   */
  router.get('/transitions', async (req: RequestWithUser, res: Response) => {
    try {
      const transitions = ExportStateMachine.getAllTransitions();

      res.status(200).json({
        success: true,
        message: 'All transitions retrieved successfully',
        data: transitions,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transitions',
        error: error.message,
      });
    }
  });

  /**
   * GET /status/:status/info
   * Get information about a status
   */
  router.get('/status/:status/info', async (req: RequestWithUser, res: Response) => {
    try {
      const { status } = req.params;

      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required',
        });
        return;
      }

      const nextStatuses = ExportStateMachine.getNextStatuses(status as ExportStatus);
      const stage = ExportStateMachine.getWorkflowStage(status as ExportStatus);
      const progress = ExportStateMachine.getProgressPercentage(status as ExportStatus);
      const isTerminal = ExportStateMachine.isTerminalState(status as ExportStatus);

      res.status(200).json({
        success: true,
        message: 'Status information retrieved successfully',
        data: {
          status,
          stage,
          progress,
          isTerminal,
          nextStatuses,
          nextStages: nextStatuses.map((s) => ExportStateMachine.getWorkflowStage(s)),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch status information',
        error: error.message,
      });
    }
  });

  /**
   * GET /workflow
   * Get complete workflow diagram
   */
  router.get('/workflow', async (req: RequestWithUser, res: Response) => {
    try {
      const transitions = ExportStateMachine.getAllTransitions();
      const stages = new Set<string>();
      const statusToStage = new Map<string, string>();

      // Build stage mapping
      Object.keys(transitions).forEach((status) => {
        const stage = ExportStateMachine.getWorkflowStage(status as ExportStatus);
        stages.add(stage);
        statusToStage.set(status, stage);
      });

      // Build workflow structure
      const workflow = Array.from(stages).map((stage) => ({
        stage,
        statuses: Array.from(statusToStage.entries())
          .filter(([_, s]) => s === stage)
          .map(([status, _]) => ({
            status,
            progress: ExportStateMachine.getProgressPercentage(status as ExportStatus),
            isTerminal: ExportStateMachine.isTerminalState(status as ExportStatus),
            nextStatuses: ExportStateMachine.getNextStatuses(status as ExportStatus),
          })),
      }));

      res.status(200).json({
        success: true,
        message: 'Workflow diagram retrieved successfully',
        data: {
          stages: Array.from(stages),
          workflow,
          totalStatuses: Object.keys(transitions).length,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch workflow diagram',
        error: error.message,
      });
    }
  });

  /**
   * POST /export/:exportId/can-transition
   * Check if export can transition to a specific status
   */
  router.post('/export/:exportId/can-transition', async (req: RequestWithUser, res: Response) => {
    try {
      const { exportId } = req.params;
      const { targetStatus } = req.body;

      if (!exportId || !targetStatus) {
        res.status(400).json({
          success: false,
          message: 'Export ID and target status are required',
        });
        return;
      }

      const contract = fabricGateway.getExportContract();
      const exportService = createExportService(contract);
      const exportData = await exportService.getExport(exportId);

      const canTransition = ExportStateMachine.isValidTransition(
        exportData.status,
        targetStatus as ExportStatus
      );

      res.status(200).json({
        success: true,
        message: 'Transition check completed',
        data: {
          exportId,
          currentStatus: exportData.status,
          targetStatus,
          canTransition,
          reason: canTransition
            ? 'Valid transition'
            : `Cannot transition from ${exportData.status} to ${targetStatus}. Allowed: ${ExportStateMachine.getNextStatuses(exportData.status).join(', ')}`,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to check transition',
        error: error.message,
      });
    }
  });

  return router;
}

export default createStateMachineRoutes;
