import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import {
  getDocumentChecklist,
  getStageRequirements,
  getDocumentCompletionPercentage,
  getNextRequiredAction,
  getDocumentUploadInstructions,
} from '../services/documentTracking.service';

// Lazy helper to obtain export contract from exporter-portal Fabric gateway when
// running inside that API. We avoid a static import to prevent cross-package
// import errors at build time.
const getExportContract = (): any => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { FabricSDKGateway } = require('../../exporter-portal/src/fabric/sdk-gateway');
    return FabricSDKGateway.getInstance().getExportContract();
  } catch (err) {
    logger.error('Fabric SDK Gateway not available in this runtime', { error: err });
    throw err;
  }
};

/**
 * Document Controller
 * Manages document tracking, validation, and upload status
 */
export class DocumentController {
  // Note: we intentionally do not hold a FabricSDKGateway instance here to avoid
  // cross-package static imports. Use getExportContract() helper at runtime.

  /**
   * Get document checklist for an export
   */
  public getDocumentChecklist = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let contract: any;
      try {
        contract = getExportContract();
      } catch (err: unknown) {
        const message =
          'Fabric SDK Gateway not available. This endpoint requires running inside exporter-portal or configure a Fabric contract provider.';
        logger.error('Fabric gateway unavailable when fetching export', { error: err });
        res.status(500).json({ success: false, message, error: String(err) });
        return;
      }
      // Get export
      const result = await contract.evaluateTransaction('GetExport', exportId);
      const exportData = JSON.parse(result.toString());

      // Verify ownership
      if (exportData.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own exports.',
        });
        return;
      }

      // Get document checklist
      const checklist = getDocumentChecklist(exportData);
      const completionPercentage = getDocumentCompletionPercentage(exportData);

      res.status(200).json({
        success: true,
        data: {
          exportId,
          status: exportData.status,
          checklist,
          completionPercentage,
        },
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching document checklist:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch document checklist';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get stage-specific document requirements
   */
  public getStageRequirements = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let contract: any;
      try {
        contract = getExportContract();
      } catch (err: unknown) {
        const message =
          'Fabric SDK Gateway not available. This endpoint requires running inside exporter-portal or configure a Fabric contract provider.';
        logger.error('Fabric gateway unavailable when fetching stage requirements', { error: err });
        res.status(500).json({ success: false, message, error: String(err) });
        return;
      }

      // Get export
      const result = await contract.evaluateTransaction('GetExport', exportId);
      const exportData = JSON.parse(result.toString());

      // Verify ownership
      if (exportData.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Get stage requirements
      const requirements = getStageRequirements(exportData, exportData.status);

      res.status(200).json({
        success: true,
        data: {
          exportId,
          status: exportData.status,
          requirements,
        },
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching stage requirements:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch stage requirements';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get document upload instructions for current stage
   */
  public getUploadInstructions = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let contract: any;
      try {
        contract = getExportContract();
      } catch (err: unknown) {
        const message =
          'Fabric SDK Gateway not available. This endpoint requires running inside exporter-portal or configure a Fabric contract provider.';
        logger.error('Fabric gateway unavailable when fetching upload instructions', {
          error: err,
        });
        res.status(500).json({ success: false, message, error: String(err) });
        return;
      }

      // Get export
      const result = await contract.evaluateTransaction('GetExport', exportId);
      const exportData = JSON.parse(result.toString());

      // Verify ownership
      if (exportData.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Get instructions
      const instructions = getDocumentUploadInstructions(exportData.status);
      const nextAction = getNextRequiredAction(exportData, exportData.status);

      res.status(200).json({
        success: true,
        data: {
          exportId,
          status: exportData.status,
          instructions,
          nextAction,
        },
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching upload instructions:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to fetch upload instructions';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get document completion status
   */
  public getCompletionStatus = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let contract: any;
      try {
        contract = getExportContract();
      } catch (err: unknown) {
        const message =
          'Fabric SDK Gateway not available. This endpoint requires running inside exporter-portal or configure a Fabric contract provider.';
        logger.error('Fabric gateway unavailable when fetching completion status', { error: err });
        res.status(500).json({ success: false, message, error: String(err) });
        return;
      }

      // Get export
      const result = await contract.evaluateTransaction('GetExport', exportId);
      const exportData = JSON.parse(result.toString());

      // Verify ownership
      if (exportData.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Get completion status
      const checklist = getDocumentChecklist(exportData);
      const requirements = getStageRequirements(exportData, exportData.status);
      const completionPercentage = getDocumentCompletionPercentage(exportData);

      // Count uploaded documents
      const uploadedCount = Object.values(checklist).filter((doc) => doc.uploaded).length;
      const totalCount = Object.keys(checklist).length;

      res.status(200).json({
        success: true,
        data: {
          exportId,
          status: exportData.status,
          uploadedCount,
          totalCount,
          completionPercentage,
          canProceed: requirements.canProceed,
          missingDocuments: requirements.missingDocuments,
          nextAction: getNextRequiredAction(exportData, exportData.status),
        },
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching completion status:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch completion status';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Validate if export can proceed to next stage
   */
  public validateCanProceed = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let contract: any;
      try {
        contract = getExportContract();
      } catch (err: unknown) {
        const message =
          'Fabric SDK Gateway not available. This endpoint requires running inside exporter-portal or configure a Fabric contract provider.';
        logger.error('Fabric gateway unavailable when validating canProceed', { error: err });
        res.status(500).json({ success: false, message, error: String(err) });
        return;
      }

      // Get export
      const result = await contract.evaluateTransaction('GetExport', exportId);
      const exportData = JSON.parse(result.toString());

      // Verify ownership
      if (exportData.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Check if can proceed
      const requirements = getStageRequirements(exportData, exportData.status);

      if (requirements.canProceed) {
        res.status(200).json({
          success: true,
          data: {
            exportId,
            canProceed: true,
            message: 'All required documents are uploaded. You can proceed to the next stage.',
            nextAction: getNextRequiredAction(exportData, exportData.status),
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Cannot proceed. Missing required documents.',
          data: {
            exportId,
            canProceed: false,
            missingDocuments: requirements.missingDocuments,
            requiredDocuments: requirements.requiredDocuments,
          },
        });
      }
    } catch (error: unknown) {
      logger.error('❌ Error validating can proceed:', error);
      const message = error instanceof Error ? error.message : 'Failed to validate can proceed';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get all documents for an export
   */
  public getAllDocuments = async (
    req: Request,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      let contract: any;
      try {
        contract = getExportContract();
      } catch (err: unknown) {
        const message =
          'Fabric SDK Gateway not available. This endpoint requires running inside exporter-portal or configure a Fabric contract provider.';
        logger.error('Fabric gateway unavailable when fetching all documents', { error: err });
        res.status(500).json({ success: false, message, error: String(err) });
        return;
      }

      // Get export
      const result = await contract.evaluateTransaction('GetExport', exportId);
      const exportData = JSON.parse(result.toString());

      // Verify ownership
      if (exportData.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Collect all documents
      const documents = {
        preQualification: {
          exportLicense: exportData.exportLicenseNumber,
          competenceCertificate: exportData.competenceCertificateNumber,
          ecxLotNumber: exportData.ecxLotNumber,
          warehouseReceipt: exportData.warehouseReceiptNumber,
          qualityCertificate: exportData.qualityCertificateNumber,
          qualityGrade: exportData.qualityGrade,
          salesContract: exportData.salesContractNumber,
          exportPermit: exportData.exportPermitNumber,
          originCertificate: exportData.originCertificateNumber,
          commercialInvoice: exportData.commercialInvoiceNumber,
        },
        regulatory: {
          qualityDocuments: exportData.qualityDocuments || [],
          originCertificateDocuments: exportData.originCertDocuments || [],
          exportCustomsDocuments: exportData.exportCustomsDocuments || [],
          importCustomsDocuments: exportData.importCustomsDocuments || [],
        },
        financial: {
          fxDocuments: exportData.fxDocuments || [],
          bankDocuments: exportData.bankDocuments || [],
        },
        logistics: {
          shipmentDocuments: exportData.shipmentDocuments || [],
        },
      };

      res.status(200).json({
        success: true,
        data: {
          exportId,
          status: exportData.status,
          documents,
        },
      });
    } catch (error: unknown) {
      logger.error('❌ Error fetching all documents:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch all documents';

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };
}
