import { Request, Response, NextFunction } from "express";
<<<<<<< HEAD
import { pool } from "@shared/database/pool";
import { createLogger } from "@shared/logger";
import { ErrorCode, AppError } from "@shared/error-codes";
import { ectaPreRegistrationService } from "@shared/services/ecta-preregistration.service";
import { EctaPreRegistrationRepository } from "@shared/database/repositories/ecta-preregistration.repository";
=======
import { pool } from "../../../shared/database/pool";
import { createLogger } from "../../../shared/logger";
import { ErrorCode, AppError } from "../../../shared/error-codes";
import { ectaPreRegistrationService } from "../../../shared/services/ecta-preregistration.service";
import { EctaPreRegistrationRepository } from "../../../shared/database/repositories/ecta-preregistration.repository";
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const logger = createLogger('ExporterPortalExportController');

/**
 * Export Controller for Exporter Portal
 *
 * Exporters can:
 * - Create export requests (submit to database)
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
  /**
   * Create new export request
   * Submits to database
   */
  public createExport = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const exportData = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      }

      // CRITICAL: Validate exporter qualification BEFORE allowing export creation
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);
      if (!profile) {
        logger.warn(`Exporter profile not found for user ${userId}`);
        throw new AppError(
          ErrorCode.NOT_FOUND,
          'Exporter profile not found. Please register first.',
          403
        );
      }
      const exporterId = profile.exporterId;

      const qualificationCheck =
        await ectaPreRegistrationService.canCreateExportRequest(exporterId);

      if (!qualificationCheck.allowed) {
        logger.warn(
          `Export creation blocked for ${exporterId}: ${qualificationCheck.reason}`,
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
        throw new AppError(
          ErrorCode.MISSING_REQUIRED_FIELD,
          'Missing required fields: exportId, coffeeType, quantity',
          400
        );
      }

      await client.query('BEGIN');

      const result = await client.query(
<<<<<<< HEAD
        `INSERT INTO exports (
           export_id, 
           exporter_id, 
           exporter_name, 
           exporter_tin, 
           export_license_number, 
           coffee_type, 
           quantity, 
           destination_country, 
           estimated_value, 
           ecx_lot_number, 
           warehouse_receipt_number,
           quality_certificate_number, 
           sales_contract_number, 
           export_permit_number, 
           origin_certificate_number, 
           status, 
           created_at, 
           updated_at
         )
=======
        `INSERT INTO exports (id, exporter_name, exporter_tin, export_license_number, coffee_type, 
         quantity, destination_country, estimated_value, ecx_lot_number, warehouse_receipt_number,
         quality_certificate_number, sales_contract_number, export_permit_number, 
         origin_certificate_number, created_by, status, created_at, updated_at)
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
         RETURNING *`,
        [
          exportData.exportId,
<<<<<<< HEAD
          exporterId, // Use exporterId from profile, NOT userId
          exportData.exporterName || profile.businessName || '',
          exportData.exporterTIN || profile.tin || '',
=======
          exportData.exporterName || '',
          exportData.exporterTIN || '',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          exportData.exportLicenseNumber,
          exportData.coffeeType,
          exportData.quantity,
          exportData.destinationCountry || '',
          exportData.estimatedValue || 0,
          exportData.ecxLotNumber,
          exportData.warehouseReceiptNumber,
          exportData.qualityCertificateNumber,
          exportData.salesContractNumber,
          exportData.exportPermitNumber,
          exportData.originCertificateNumber,
<<<<<<< HEAD
=======
          userId,
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
          'DRAFT'
        ]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [exportData.exportId, 'NONE', 'DRAFT', userId, 'Export created by exporter']
      );

      await client.query('COMMIT');

      logger.info(
        `Export created: ${exportData.exportId} (Exporter: ${exporterId})`,
      );

      res.status(201).json({
        success: true,
        message:
          "Export request created successfully. All ECTA pre-qualifications verified.",
        data: result.rows[0],
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error creating export:', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
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
        throw new AppError(ErrorCode.UNAUTHORIZED, 'User not authenticated', 401);
      }

<<<<<<< HEAD
      // Lookup exporter profile first
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        // If no profile, returns empty list (or could return 404, but empty list is safer for UI)
        res.status(200).json({
          success: true,
          data: [],
        });
        return;
      }

      const result = await pool.query(
        'SELECT * FROM exports WHERE exporter_id = $1 ORDER BY created_at DESC',
        [profile.exporterId]
=======
      const result = await pool.query(
        'SELECT * FROM exports WHERE created_by = $1 ORDER BY created_at DESC',
        [userId]
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
      );

      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error: any) {
      logger.error('Error fetching exports:', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get single export by ID (only if owned by user)
   */
<<<<<<< HEAD
  /**
   * Get single export by ID (only if owned by user)
   */
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  public getExportById = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

<<<<<<< HEAD
      // Lookup exporter profile
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Exporter profile not found', 404);
      }

      const result = await pool.query(
        'SELECT * FROM exports WHERE export_id = $1',
=======
      const result = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        [id]
      );

      if (result.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportRecord = result.rows[0];

      // Verify ownership
<<<<<<< HEAD
      if (exportRecord.exporter_id !== profile.exporterId) {
=======
      if (exportRecord.created_by !== userId) {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'Access denied. You can only view your own exports.',
          403
        );
      }

      res.status(200).json({
        success: true,
        data: exportRecord,
      });
    } catch (error: any) {
      logger.error('Error fetching export:', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Get export history/audit trail
   */
<<<<<<< HEAD
  /**
   * Get export history/audit trail
   */
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  public getExportHistory = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

<<<<<<< HEAD
      // Lookup exporter profile
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Exporter profile not found', 404);
      }

      const exportResult = await pool.query(
        'SELECT * FROM exports WHERE export_id = $1',
=======
      const exportResult = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        [id]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportRecord = exportResult.rows[0];

<<<<<<< HEAD
      if (exportRecord.exporter_id !== profile.exporterId) {
=======
      if (exportRecord.created_by !== userId) {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Access denied', 403);
      }

      // Get history
      const historyResult = await pool.query(
        'SELECT * FROM export_status_history WHERE export_id = $1 ORDER BY changed_at DESC',
        [id]
      );

      res.status(200).json({
        success: true,
        data: historyResult.rows,
      });
    } catch (error: any) {
      logger.error('Error fetching export history:', { error: error.message });
      this.handleError(error, res);
    }
  };

  /**
   * Submit export to ECX for lot verification
   * Status: DRAFT → ECX_PENDING
   */
<<<<<<< HEAD
  /**
   * Submit export to ECX for lot verification
   * Status: DRAFT → ECX_PENDING
   */
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  public submitToECX = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

<<<<<<< HEAD
      // Lookup exporter profile
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Exporter profile not found', 404);
      }

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
=======
      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        [id]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportRecord = exportResult.rows[0];

<<<<<<< HEAD
      if (exportRecord.exporter_id !== profile.exporterId) {
=======
      if (exportRecord.created_by !== userId) {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        throw new AppError(
          ErrorCode.UNAUTHORIZED,
          'Access denied. You can only submit your own exports.',
          403
        );
      }

      // Verify status
      if (exportRecord.status !== 'DRAFT') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Cannot submit to ECX. Current status: ${exportRecord.status}. Expected: DRAFT`,
          400
        );
      }

      await client.query('BEGIN');

      await client.query(
<<<<<<< HEAD
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE export_id = $2',
=======
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        ['ECX_PENDING', id]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [id, 'DRAFT', 'ECX_PENDING', userId, 'Submitted to ECX for lot verification']
      );

      await client.query('COMMIT');

      logger.info(`Export ${id} submitted to ECX by ${userId}`);

      res.status(200).json({
        success: true,
        message: "Export submitted to ECX for lot verification",
        data: { exportId: id, newStatus: "ECX_PENDING" },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error submitting to ECX:', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Submit export to ECTA for license approval
   * Status: ECX_VERIFIED → ECTA_LICENSE_PENDING
   */
<<<<<<< HEAD
  /**
   * Submit export to ECTA for license approval
   * Status: ECX_VERIFIED → ECTA_LICENSE_PENDING
   */
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  public submitToECTA = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

<<<<<<< HEAD
      // Lookup exporter profile
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Exporter profile not found', 404);
      }

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
=======
      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        [id]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportRecord = exportResult.rows[0];

<<<<<<< HEAD
      if (exportRecord.exporter_id !== profile.exporterId) {
=======
      if (exportRecord.created_by !== userId) {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Access denied', 403);
      }

      // Verify status
      if (exportRecord.status !== 'ECX_VERIFIED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Cannot submit to ECTA. Current status: ${exportRecord.status}. Expected: ECX_VERIFIED`,
          400
        );
      }

      await client.query('BEGIN');

      await client.query(
<<<<<<< HEAD
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE export_id = $2',
=======
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        ['ECTA_LICENSE_PENDING', id]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [id, 'ECX_VERIFIED', 'ECTA_LICENSE_PENDING', userId, 'Submitted to ECTA for license approval']
      );

      await client.query('COMMIT');

      logger.info(`Export ${id} submitted to ECTA by ${userId}`);

      res.status(200).json({
        success: true,
        message: "Export submitted to ECTA for license approval",
        data: { exportId: id, newStatus: "ECTA_LICENSE_PENDING" },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error submitting to ECTA:', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Submit export to Commercial Bank for document verification
   * Status: ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_PENDING
   */
<<<<<<< HEAD
  /**
   * Submit export to Commercial Bank for document verification
   * Status: ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_PENDING
   */
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  public submitToBank = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

<<<<<<< HEAD
      // Lookup exporter profile
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Exporter profile not found', 404);
      }

      const exportResult = await client.query(
        'SELECT * FROM exports WHERE export_id = $1',
=======
      const exportResult = await client.query(
        'SELECT * FROM exports WHERE id = $1',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        [id]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportRecord = exportResult.rows[0];

<<<<<<< HEAD
      if (exportRecord.exporter_id !== profile.exporterId) {
=======
      if (exportRecord.created_by !== userId) {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Access denied', 403);
      }

      // Verify status
      if (exportRecord.status !== 'ECTA_CONTRACT_APPROVED') {
        throw new AppError(
          ErrorCode.INVALID_STATUS_TRANSITION,
          `Cannot submit to Bank. Current status: ${exportRecord.status}. Expected: ECTA_CONTRACT_APPROVED`,
          400
        );
      }

      await client.query('BEGIN');

      await client.query(
<<<<<<< HEAD
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE export_id = $2',
=======
        'UPDATE exports SET status = $1, updated_at = NOW() WHERE id = $2',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        ['BANK_DOCUMENT_PENDING', id]
      );

      await client.query(
        `INSERT INTO export_status_history (export_id, old_status, new_status, changed_by, changed_at, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [id, 'ECTA_CONTRACT_APPROVED', 'BANK_DOCUMENT_PENDING', userId, 'Submitted to Commercial Bank for document verification']
      );

      await client.query('COMMIT');

      logger.info(`Export ${id} submitted to Commercial Bank by ${userId}`);

      res.status(200).json({
        success: true,
        message:
          "Export submitted to Commercial Bank for document verification",
        data: { exportId: id, newStatus: "BANK_DOCUMENT_PENDING" },
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      logger.error('Error submitting to Bank:', { error: error.message });
      this.handleError(error, res);
    } finally {
      client.release();
    }
  };

  /**
   * Get document checklist and upload status
   */
<<<<<<< HEAD
  /**
   * Get document checklist and upload status
   */
=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  public getDocumentStatus = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

<<<<<<< HEAD
      // Lookup exporter profile
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Exporter profile not found', 404);
      }

      const exportResult = await pool.query(
        'SELECT * FROM exports WHERE export_id = $1',
=======
      const exportResult = await pool.query(
        'SELECT * FROM exports WHERE id = $1',
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        [id]
      );

      if (exportResult.rows.length === 0) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Export not found', 404);
      }

      const exportRecord = exportResult.rows[0];

<<<<<<< HEAD
      if (exportRecord.exporter_id !== profile.exporterId) {
=======
      if (exportRecord.created_by !== userId) {
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
        throw new AppError(ErrorCode.UNAUTHORIZED, 'Access denied', 403);
      }

      // Build document checklist
      const checklist = {
        exportLicense: !!exportRecord.export_license_number,
        competenceCertificate: !!exportRecord.competence_certificate_number,
        ecxLot: !!exportRecord.ecx_lot_number,
        warehouseReceipt: !!exportRecord.warehouse_receipt_number,
        qualityCertificate: !!exportRecord.quality_certificate_number,
        salesContract: !!exportRecord.sales_contract_number,
        exportPermit: !!exportRecord.export_permit_number,
        originCertificate: !!exportRecord.origin_certificate_number,
      };

      const completedCount = Object.values(checklist).filter(Boolean).length;
      const completionPercentage = (completedCount / Object.keys(checklist).length) * 100;

      res.status(200).json({
        success: true,
        data: {
          exportId: id,
          status: exportRecord.status,
          checklist,
          completionPercentage: Math.round(completionPercentage),
        },
      });
    } catch (error: any) {
      logger.error('Error fetching document status:', { error: error.message });
      this.handleError(error, res);
    }
  };

<<<<<<< HEAD
  /**
   * Get dashboard statistics
   * Aggregates key metrics for the dashboard
   */
  public getDashboardStats = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = (req as any).user?.id;

      // Lookup exporter profile
      const repository = new EctaPreRegistrationRepository(pool);
      const profile = await repository.getExporterProfileByUserId(userId);

      if (!profile) {
        // Return zeros if no profile exists
        res.status(200).json({
          success: true,
          data: {
            totalExports: 0,
            totalValue: 0,
            completedExports: 0,
            pendingAction: 0,
            activeShipments: 0
          },
        });
        return;
      }

      // Execute optimized aggregation query
      const statsQuery = `
        SELECT 
          COUNT(*) as total_count,
          COALESCE(SUM(estimated_value), 0) as total_value,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_count,
          COUNT(CASE WHEN status IN ('SHIPPED', 'ARRIVED', 'IMPORT_CUSTOMS_PENDING', 'IMPORT_CUSTOMS_CLEARED') THEN 1 END) as active_shipments_count,
          COUNT(CASE WHEN status NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED') THEN 1 END) as pending_count
        FROM exports 
        WHERE exporter_id = $1
      `;

      const result = await pool.query(statsQuery, [profile.exporterId]);
      const stats = result.rows[0];

      res.status(200).json({
        success: true,
        data: {
          totalExports: parseInt(stats.total_count, 10),
          totalValue: parseFloat(stats.total_value),
          completedExports: parseInt(stats.completed_count, 10),
          activeShipments: parseInt(stats.active_shipments_count, 10),
          pendingAction: parseInt(stats.pending_count, 10)
        },
      });
    } catch (error: any) {
      logger.error('Error fetching dashboard stats:', { error: error.message });
      this.handleError(error, res);
    }
  };

=======
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  private handleError(error: any, res: Response): void {
    if (error instanceof AppError) {
      res.status(error.httpStatus).json({
        success: false,
        error: { code: error.code, message: error.message },
      });
      return;
    }

    logger.error('Unexpected error', { error: error.message });

    res.status(500).json({
      success: false,
      error: { code: ErrorCode.INTERNAL_SERVER_ERROR, message: 'An unexpected error occurred' },
    });
  }
}
