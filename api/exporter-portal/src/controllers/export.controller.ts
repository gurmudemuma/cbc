import { Request, Response, NextFunction } from "express";
import { FabricSDKGateway } from "../fabric/sdk-gateway";
import { logger } from "../config/logger";
import { ectaPreRegistrationService } from "../../../shared/services/ecta-preregistration.service";
import { EctaPreRegistrationRepository } from "../../../shared/database/repositories/ecta-preregistration.repository";
import pool from "../../../shared/database/db.config";

/**
 * Export Controller for Exporter Portal
 *
 * Exporters can:
 * - Create export requests (submit to blockchain via SDK)
 * - View their own exports
 * - Track export status
 * - Upload documents
 *
 * They CANNOT:
 * - Approve exports
 * - Modify other exporters' exports
 * - Access banking operations
 */
export class ExportController {
  private fabricGateway: FabricSDKGateway;

  constructor() {
    this.fabricGateway = FabricSDKGateway.getInstance();
  }

  /**
   * Create new export request
   * Submits transaction to blockchain via SDK
   */
  public createExport = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const exportData = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      // CRITICAL: Validate exporter qualification BEFORE allowing export creation
      // Based on real-world ECTA requirements and Directive 1106/2025

      // Map userId -> exporterId using the preregistration repository
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);
      if (!profile) {
        logger.warn(`Exporter profile not found for user ${userId}`);
        res.status(403).json({
          success: false,
          message: "Exporter profile not found. Please register first.",
        });
        return;
      }
      const exporterId = profile.exporterId;

      const qualificationCheck =
        await ectaPreRegistrationService.canCreateExportRequest(exporterId);

      if (!qualificationCheck.allowed) {
        logger.warn(
          `❌ Export creation blocked for ${exporterId}: ${qualificationCheck.reason}`,
        );

        res.status(403).json({
          success: false,
          message:
            "Cannot create export request. Pre-qualification requirements not met.",
          reason: qualificationCheck.reason,
          requiredActions: qualificationCheck.requiredActions,
          helpUrl: "/api/exporter/qualification-status",
        });
        return;
      }

      // Validate required pre-existing documents
      const requiredDocs = [
        "exportLicenseNumber",
        "competenceCertificateNumber",
        "ecxLotNumber",
        "warehouseReceiptNumber",
        "qualityCertificateNumber",
        "salesContractNumber",
        "exportPermitNumber",
        "originCertificateNumber",
      ];

      const missingDocs = requiredDocs.filter((doc) => !exportData[doc]);

      if (missingDocs.length > 0) {
        res.status(400).json({
          success: false,
          message: "Missing required pre-existing documents",
          missingDocuments: missingDocs,
          requiredActions: [
            "Obtain export license from ECTA",
            "Get competence certificate from ECTA",
            "Purchase coffee lot from ECX",
            "Complete quality inspection with ECTA",
            "Register sales contract with ECTA",
            "Obtain export permit from ECTA",
            "Get certificate of origin from ECTA",
          ],
        });
        return;
      }

      // Validate basic required fields
      if (
        !exportData.exportId ||
        !exportData.coffeeType ||
        !exportData.quantity
      ) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: exportId, coffeeType, quantity",
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();

      // Submit transaction to blockchain with all pre-existing documents
      const result = await contract.submitTransaction(
        "CreateExportRequest",
        exportData.exportId,
        exportData.exporterName || "",
        exportData.exporterTIN || "",
        exportData.exportLicenseNumber,
        exportData.coffeeType,
        exportData.quantity.toString(),
        exportData.destinationCountry || "",
        exportData.estimatedValue?.toString() || "0",
        userId,
        JSON.stringify({
          ...exportData.metadata,
          // Pre-existing regulatory documents
          competenceCertificateNumber: exportData.competenceCertificateNumber,
          ecxLotNumber: exportData.ecxLotNumber,
          warehouseReceiptNumber: exportData.warehouseReceiptNumber,
          qualityCertificateNumber: exportData.qualityCertificateNumber,
          qualityGrade: exportData.qualityGrade,
          salesContractNumber: exportData.salesContractNumber,
          exportPermitNumber: exportData.exportPermitNumber,
          originCertificateNumber: exportData.originCertificateNumber,
        }),
      );

      const exportRecord = JSON.parse(result.toString());

      logger.info(
        `✅ Export created via SDK: ${exportData.exportId} (Exporter: ${exporterId})`,
      );

      res.status(201).json({
        success: true,
        message:
          "Export request created successfully. All ECTA pre-qualifications verified.",
        data: exportRecord,
      });
    } catch (error: unknown) {
      logger.error("❌ Error creating export:", error);
      const message =
        error instanceof Error ? error.message : "Failed to create export";

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get all exports for the logged-in exporter
   */
  public getMyExports = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();

      // Query exports for this user
      const result = await contract.evaluateTransaction(
        "GetExportsByExporter",
        userId,
      );
      const exports = JSON.parse(result.toString());

      res.status(200).json({
        success: true,
        data: exports,
      });
    } catch (error: unknown) {
      logger.error("❌ Error fetching exports:", error);
      const message =
        error instanceof Error ? error.message : "Failed to fetch exports";

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get single export by ID (only if owned by user)
   */
  public getExportById = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const contract = this.fabricGateway.getExportContract();

      // Query export
      const result = await contract.evaluateTransaction("GetExport", id!);
      const exportRecord = JSON.parse(result.toString());

      // Verify ownership
      if (exportRecord.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied. You can only view your own exports.",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: exportRecord,
      });
    } catch (error: unknown) {
      logger.error("❌ Error fetching export:", error);
      const message =
        error instanceof Error ? error.message : "Failed to fetch export";
      const statusCode = message.includes("does not exist") ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get export history/audit trail
   */
  public getExportHistory = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const contract = this.fabricGateway.getExportContract();

      // First verify ownership
      const exportResult = await contract.evaluateTransaction("GetExport", id!);
      const exportRecord = JSON.parse(exportResult.toString());

      if (exportRecord.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      // Get history
      const historyResult = await contract.evaluateTransaction(
        "GetExportHistory",
        id!,
      );
      const history = JSON.parse(historyResult.toString());

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: unknown) {
      logger.error("❌ Error fetching export history:", error);
      const message =
        error instanceof Error ? error.message : "Failed to fetch history";

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Submit export to ECX for lot verification
   * Status: DRAFT → ECX_PENDING
   */
  public submitToECX = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const contract = this.fabricGateway.getExportContract();

      // Verify ownership
      const exportResult = await contract.evaluateTransaction("GetExport", id!);
      const exportRecord = JSON.parse(exportResult.toString());

      if (exportRecord.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied. You can only submit your own exports.",
        });
        return;
      }

      // Verify status
      if (exportRecord.status !== "DRAFT") {
        res.status(400).json({
          success: false,
          message: `Cannot submit to ECX. Current status: ${exportRecord.status}. Expected: DRAFT`,
        });
        return;
      }

      // Submit to blockchain
      await contract.submitTransaction("SubmitToECX", id!);

      logger.info(`✅ Export ${id} submitted to ECX by ${userId}`);

      res.status(200).json({
        success: true,
        message: "Export submitted to ECX for lot verification",
        data: { exportId: id, newStatus: "ECX_PENDING" },
      });
    } catch (error: unknown) {
      logger.error("❌ Error submitting to ECX:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit to ECX";

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Submit export to ECTA for license approval
   * Status: ECX_VERIFIED → ECTA_LICENSE_PENDING
   */
  public submitToECTA = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const contract = this.fabricGateway.getExportContract();

      // Verify ownership
      const exportResult = await contract.evaluateTransaction("GetExport", id!);
      const exportRecord = JSON.parse(exportResult.toString());

      if (exportRecord.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      // Verify status
      if (exportRecord.status !== "ECX_VERIFIED") {
        res.status(400).json({
          success: false,
          message: `Cannot submit to ECTA. Current status: ${exportRecord.status}. Expected: ECX_VERIFIED`,
        });
        return;
      }

      // Submit to blockchain
      await contract.submitTransaction("SubmitToECTA", id!);

      logger.info(`✅ Export ${id} submitted to ECTA by ${userId}`);

      res.status(200).json({
        success: true,
        message: "Export submitted to ECTA for license approval",
        data: { exportId: id, newStatus: "ECTA_LICENSE_PENDING" },
      });
    } catch (error: unknown) {
      logger.error("❌ Error submitting to ECTA:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit to ECTA";

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Submit export to Commercial Bank for document verification
   * Status: ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_PENDING
   */
  public submitToBank = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const contract = this.fabricGateway.getExportContract();

      // Verify ownership
      const exportResult = await contract.evaluateTransaction("GetExport", id!);
      const exportRecord = JSON.parse(exportResult.toString());

      if (exportRecord.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      // Verify status
      if (exportRecord.status !== "ECTA_CONTRACT_APPROVED") {
        res.status(400).json({
          success: false,
          message: `Cannot submit to Bank. Current status: ${exportRecord.status}. Expected: ECTA_CONTRACT_APPROVED`,
        });
        return;
      }

      // Submit to blockchain
      await contract.submitTransaction("SubmitToBank", id!);

      logger.info(`✅ Export ${id} submitted to Commercial Bank by ${userId}`);

      res.status(200).json({
        success: true,
        message:
          "Export submitted to Commercial Bank for document verification",
        data: { exportId: id, newStatus: "BANK_DOCUMENT_PENDING" },
      });
    } catch (error: unknown) {
      logger.error("❌ Error submitting to Bank:", error);
      const message =
        error instanceof Error ? error.message : "Failed to submit to Bank";

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };

  /**
   * Get document checklist and upload status
   */
  public getDocumentStatus = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const contract = this.fabricGateway.getExportContract();

      // Verify ownership
      const exportResult = await contract.evaluateTransaction("GetExport", id!);
      const exportRecord = JSON.parse(exportResult.toString());

      if (exportRecord.createdBy !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      // Import document tracking service
      const {
        getDocumentChecklist,
        getStageRequirements,
        getDocumentCompletionPercentage,
      } = await import("../../../shared/documentTracking.service");

      const checklist = getDocumentChecklist(exportRecord);
      const stageRequirements = getStageRequirements(
        exportRecord,
        exportRecord.status,
      );
      const completionPercentage =
        getDocumentCompletionPercentage(exportRecord);

      res.status(200).json({
        success: true,
        data: {
          exportId: id,
          status: exportRecord.status,
          checklist,
          stageRequirements,
          completionPercentage,
        },
      });
    } catch (error: unknown) {
      logger.error("❌ Error fetching document status:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch document status";

      res.status(500).json({
        success: false,
        message,
        error: message,
      });
    }
  };
}
