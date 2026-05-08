import { Router, Response } from 'express';
import { AuthenticatedRequest, requireAuth, requireExporter } from '../middleware/rbac.middleware';
import { verifyExporterOwnership } from '../middleware/contract-ownership.middleware';
import { logAccessAttempt } from '../middleware/audit-logging.middleware';
import { ContractExportService } from '../services/contract-export.service';
import logger from '../config/logger';

const router = Router();
const contractExportService = new ContractExportService();

/**
 * POST /api/contract-exports
 * Link a contract to an export shipment
 */
router.post(
  '/',
  requireAuth,
  requireExporter,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { contractId, exportId, coffeeTypeMatch, quantityMatch, quantityVariance } = req.body;
      const exporterId = req.user?.exporterId;
      const userId = req.user?.id;

      if (!contractId || !exportId || !exporterId || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate contract-export link
      const validation = await contractExportService.validateContractExportLink(
        contractId,
        exportId,
        { coffee_type: coffeeTypeMatch, quantity: quantityMatch }
      );

      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid contract-export link',
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }

      // Link contract to export
      const link = await contractExportService.linkContractToExport(
        contractId,
        exportId,
        exporterId,
        userId,
        { coffeeTypeMatch, quantityMatch, quantityVariance }
      );

      res.status(201).json({
        success: true,
        message: 'Contract linked to export successfully',
        link,
        warnings: validation.warnings,
      });
    } catch (err) {
      logger.error('Error linking contract to export:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/contract-exports/:linkId
 * Unlink a contract from an export shipment
 */
router.delete(
  '/:linkId',
  requireAuth,
  requireExporter,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { linkId } = req.params;
      const exporterId = req.user?.exporterId;

      if (!linkId || !exporterId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get link to verify ownership
      const link = await contractExportService.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ error: 'Contract-export link not found' });
      }

      if (link.exporter_id !== exporterId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Unlink contract from export
      const success = await contractExportService.unlinkContractFromExport(
        link.contract_id,
        link.export_id
      );

      if (!success) {
        return res.status(404).json({ error: 'Contract-export link not found' });
      }

      res.json({
        success: true,
        message: 'Contract unlinked from export successfully',
      });
    } catch (err) {
      logger.error('Error unlinking contract from export:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/contract-exports/contract/:contractId
 * Get all exports linked to a contract
 */
router.get(
  '/contract/:contractId',
  requireAuth,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        return res.status(400).json({ error: 'Contract ID is required' });
      }

      const exports = await contractExportService.getExportsForContract(contractId);

      res.json({
        success: true,
        count: exports.length,
        exports,
      });
    } catch (err) {
      logger.error('Error getting exports for contract:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/contract-exports/export/:exportId
 * Get all contracts linked to an export
 */
router.get(
  '/export/:exportId',
  requireAuth,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { exportId } = req.params;

      if (!exportId) {
        return res.status(400).json({ error: 'Export ID is required' });
      }

      const contracts = await contractExportService.getContractsForExport(exportId);

      res.json({
        success: true,
        count: contracts.length,
        contracts,
      });
    } catch (err) {
      logger.error('Error getting contracts for export:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/contract-exports/:linkId
 * Get contract-export link by ID
 */
router.get(
  '/:linkId',
  requireAuth,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { linkId } = req.params;

      if (!linkId) {
        return res.status(400).json({ error: 'Link ID is required' });
      }

      const link = await contractExportService.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ error: 'Contract-export link not found' });
      }

      res.json({
        success: true,
        link,
      });
    } catch (err) {
      logger.error('Error getting contract-export link:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/contract-exports/:linkId/verify
 * Verify contract-export link
 */
router.put(
  '/:linkId/verify',
  requireAuth,
  requireExporter,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { linkId } = req.params;
      const { coffeeTypeMatch, quantityMatch, quantityVariance } = req.body;
      const exporterId = req.user?.exporterId;
      const userId = req.user?.id;

      if (!linkId || !exporterId || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get link to verify ownership
      const link = await contractExportService.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ error: 'Contract-export link not found' });
      }

      if (link.exporter_id !== exporterId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Verify link
      const updatedLink = await contractExportService.verifyLink(
        linkId,
        userId,
        coffeeTypeMatch ?? true,
        quantityMatch ?? true,
        quantityVariance
      );

      res.json({
        success: true,
        message: 'Contract-export link verified',
        link: updatedLink,
      });
    } catch (err) {
      logger.error('Error verifying contract-export link:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/contract-exports/:linkId/shipped
 * Mark contract-export as shipped
 */
router.put(
  '/:linkId/shipped',
  requireAuth,
  requireExporter,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { linkId } = req.params;
      const exporterId = req.user?.exporterId;
      const userId = req.user?.id;

      if (!linkId || !exporterId || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get link to verify ownership
      const link = await contractExportService.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ error: 'Contract-export link not found' });
      }

      if (link.exporter_id !== exporterId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Mark as shipped
      const updatedLink = await contractExportService.markAsShipped(linkId, userId);

      res.json({
        success: true,
        message: 'Contract-export marked as shipped',
        link: updatedLink,
      });
    } catch (err) {
      logger.error('Error marking contract-export as shipped:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/contract-exports/:linkId/completed
 * Mark contract-export as completed
 */
router.put(
  '/:linkId/completed',
  requireAuth,
  requireExporter,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { linkId } = req.params;
      const exporterId = req.user?.exporterId;
      const userId = req.user?.id;

      if (!linkId || !exporterId || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get link to verify ownership
      const link = await contractExportService.getLinkById(linkId);
      if (!link) {
        return res.status(404).json({ error: 'Contract-export link not found' });
      }

      if (link.exporter_id !== exporterId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Mark as completed
      const updatedLink = await contractExportService.markAsCompleted(linkId, userId);

      res.json({
        success: true,
        message: 'Contract-export marked as completed',
        link: updatedLink,
      });
    } catch (err) {
      logger.error('Error marking contract-export as completed:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/contract-exports/exporter/:exporterId
 * Get all contract-export links for an exporter
 */
router.get(
  '/exporter/:exporterId',
  requireAuth,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { exporterId } = req.params;
      const { status } = req.query;

      if (!exporterId) {
        return res.status(400).json({ error: 'Exporter ID is required' });
      }

      let links;
      if (status) {
        links = await contractExportService.getLinksByStatus(status as string);
        links = links.filter(link => link.exporter_id === exporterId);
      } else {
        links = await contractExportService.getLinksForExporter(exporterId);
      }

      res.json({
        success: true,
        count: links.length,
        links,
      });
    } catch (err) {
      logger.error('Error getting contract-export links for exporter:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/contract-exports/validate
 * Validate contract-export link before linking
 */
router.post(
  '/validate',
  requireAuth,
  requireExporter,
  logAccessAttempt,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { contractId, exportId, exportData } = req.body;

      if (!contractId || !exportId || !exportData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const validation = await contractExportService.validateContractExportLink(
        contractId,
        exportId,
        exportData
      );

      res.json({
        success: true,
        ...validation,
      });
    } catch (err) {
      logger.error('Error validating contract-export link:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
