import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import {
  ExporterProfile,
  CoffeeLaboratory,
  CompetenceCertificate,
  ExportLicense,
} from '../../../shared/models/ecta-preregistration.model';
import { ectaPreRegistrationService } from '../../../shared/services/ecta-preregistration.service';

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

/**
 * ECTA Pre-Registration Controller
 * Handles exporter qualification, licensing, and certification
 * Based on real-world ECTA processes and Directive 1106/2025
 */
export class PreRegistrationController {
  // ============================================================================
  // LEGACY METHODS (KEPT FOR BACKWARD COMPATIBILITY)
  // ============================================================================

  public getAllExporters = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const exporters: ExporterProfile[] = [];
      res.status(200).json({
        success: true,
        message: 'Exporters retrieved successfully',
        data: exporters,
        count: exporters.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch exporters',
        error: error.message,
      });
    }
  };

  public getPendingApplications = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: ExporterProfile[] = [];
      res.status(200).json({
        success: true,
        message: 'Exporter applications pending ECTA approval',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending applications',
        error: error.message,
      });
    }
  };

  public approveExporter = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Exporter profile approved',
        data: {
          exporterId,
          status: 'APPROVED',
          approvedBy: user.username,
          approvedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve exporter',
        error: error.message,
      });
    }
  };

  public rejectExporter = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Exporter profile rejected',
        data: {
          exporterId,
          status: 'REJECTED',
          reason,
          rejectedBy: user.username,
          rejectedAt: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject exporter',
        error: error.message,
      });
    }
  };

  public getPendingLaboratories = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: CoffeeLaboratory[] = [];
      res.status(200).json({
        success: true,
        message: 'Laboratory certifications pending inspection',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending laboratories',
        error: error.message,
      });
    }
  };

  public certifyLaboratory = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { laboratoryId } = req.params;
      const { certificationNumber, inspectionPassed, validityYears = 1 } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!laboratoryId || !certificationNumber) {
        res.status(400).json({
          success: false,
          message: 'Laboratory ID and certification number are required',
        });
        return;
      }

      if (!inspectionPassed) {
        res.status(400).json({
          success: false,
          message: 'Laboratory inspection must pass before certification',
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      res.status(200).json({
        success: true,
        message: 'Laboratory certified successfully',
        data: {
          laboratoryId,
          certificationNumber,
          status: 'CERTIFIED',
          expiryDate: expiryDate.toISOString(),
          certifiedBy: user.username,
          certifiedAt: now.toISOString(),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to certify laboratory',
        error: error.message,
      });
    }
  };

  public getPendingCompetenceCertificates = async (
    _req: RequestWithUser,
    res: Response
  ): Promise<void> => {
    try {
      const pending: CompetenceCertificate[] = [];
      res.status(200).json({
        success: true,
        message: 'Competence certificate applications pending review',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending certificates',
        error: error.message,
      });
    }
  };

  public issueCompetenceCertificate = async (
    req: RequestWithUser,
    res: Response
  ): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const {
        certificateNumber,
        laboratoryId,
        tasterId,
        facilityInspectionPassed,
        inspectionReport,
        validityYears = 1,
      } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !certificateNumber || !laboratoryId || !tasterId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: exporterId, certificateNumber, laboratoryId, tasterId',
        });
        return;
      }

      if (!facilityInspectionPassed) {
        res.status(400).json({
          success: false,
          message: 'Facility inspection must pass before issuing certificate',
        });
        return;
      }

      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      if (!validation.hasCertifiedLaboratory) {
        res.status(400).json({
          success: false,
          message: 'Exporter must have ECTA-certified laboratory',
        });
        return;
      }

      if (!validation.hasQualifiedTaster) {
        res.status(400).json({
          success: false,
          message: 'Exporter must have qualified taster',
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      const certificate: Partial<CompetenceCertificate> = {
        certificateId: uuidv4(),
        exporterId,
        certificateNumber,
        issuedDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'ACTIVE',
        laboratoryId,
        tasterId,
        facilityInspectionDate: now.toISOString(),
        inspectionReport,
        inspectedBy: user.username,
        inspectionPassed: true,
        approvedBy: user.username,
        approvedAt: now.toISOString(),
        renewalHistory: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'Competence certificate issued successfully',
        data: {
          ...certificate,
          certificateId: certificate.certificateId,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue competence certificate',
        error: error.message,
      });
    }
  };

  public receiveLicenseApplication = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const {
        exporterId,
        eicRegistrationNumber,
        requestedCoffeeTypes,
        requestedOrigins,
        applicantProfile,
        submittedAt,
        submittedBy,
      } = req.body;

      if (!exporterId || !eicRegistrationNumber) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and EIC registration number are required',
        });
        return;
      }

      const applicationId = uuidv4();
      const now = new Date().toISOString();

      res.status(201).json({
        success: true,
        message: 'License application received and queued for ECTA review',
        data: {
          applicationId,
          exporterId,
          eicRegistrationNumber,
          status: 'PENDING_REVIEW',
          requestedCoffeeTypes: requestedCoffeeTypes || ['ARABICA'],
          requestedOrigins: requestedOrigins || [],
          applicantProfile,
          submittedAt: submittedAt || now,
          submittedBy: submittedBy || 'Unknown',
          receivedAt: now,
          nextSteps: [
            'ECTA will review the application',
            'Exporter will be notified of the decision',
            'License will be issued if approved',
          ],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to receive license application',
        error: error.message,
      });
    }
  };

  public getPendingLicenses = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: ExportLicense[] = [];
      res.status(200).json({
        success: true,
        message: 'Export license applications pending review',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending licenses',
        error: error.message,
      });
    }
  };

  public issueExportLicense = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const {
        licenseNumber,
        competenceCertificateId,
        eicRegistrationNumber,
        authorizedCoffeeTypes,
        authorizedOrigins,
        annualQuota,
        validityYears = 1,
      } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !licenseNumber || !competenceCertificateId || !eicRegistrationNumber) {
        res.status(400).json({
          success: false,
          message:
            'Missing required fields: exporterId, licenseNumber, competenceCertificateId, eicRegistrationNumber',
        });
        return;
      }

      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      if (!validation.hasCompetenceCertificate) {
        res.status(400).json({
          success: false,
          message: 'Exporter must have valid competence certificate',
          requiredActions: validation.requiredActions,
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      const license: Partial<ExportLicense> = {
        licenseId: uuidv4(),
        exporterId,
        licenseNumber,
        issuedDate: now.toISOString(),
        expiryDate: expiryDate.toISOString(),
        status: 'ACTIVE',
        competenceCertificateId,
        eicRegistrationNumber,
        authorizedCoffeeTypes: authorizedCoffeeTypes || ['Arabica'],
        authorizedOrigins: authorizedOrigins || [],
        annualQuota,
        approvedBy: user.username,
        approvedAt: now.toISOString(),
        renewalHistory: [],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'Export license issued successfully',
        data: {
          ...license,
          licenseId: license.licenseId,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue export license',
        error: error.message,
      });
    }
  };

  public validateExporter = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      const validation = await ectaPreRegistrationService.validateExporter(exporterId);

      res.status(200).json({
        success: true,
        message: 'Exporter validation completed',
        data: validation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to validate exporter',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // STAGE 1: BUSINESS REGISTRATION VERIFICATION
  // ============================================================================

  public submitStage1 = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const {
        businessName,
        tin,
        registrationNumber,
        businessType,
        minimumCapital,
        capitalProofDocument,
      } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!businessName || !tin || !registrationNumber) {
        res.status(400).json({
          success: false,
          message: 'Business name, TIN, and registration number are required',
        });
        return;
      }

      const now = new Date().toISOString();
      const stage1Application = {
        exporterId: uuidv4(),
        userId: user.id,
        businessName,
        tin,
        registrationNumber,
        businessType: businessType || 'PRIVATE',
        minimumCapital: minimumCapital || 500000,
        capitalProofDocument,
        status: 'STAGE_1_PENDING',
        createdAt: now,
        updatedAt: now,
      };

      res.status(201).json({
        success: true,
        message: 'Stage 1 (Business Registration) application submitted',
        data: stage1Application,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit Stage 1 application',
        error: error.message,
      });
    }
  };

  public approveStage1 = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 1 (Business Registration) approved',
        data: {
          exporterId,
          status: 'STAGE_1_APPROVED',
          approvedBy: user.username,
          approvedAt: new Date().toISOString(),
          nextStage: 'Stage 2: Facility Inspection',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve Stage 1',
        error: error.message,
      });
    }
  };

  public rejectStage1 = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 1 (Business Registration) rejected',
        data: {
          exporterId,
          status: 'STAGE_1_REJECTED',
          reason,
          rejectedBy: user.username,
          rejectedAt: new Date().toISOString(),
          nextSteps: ['Exporter can update information and resubmit'],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject Stage 1',
        error: error.message,
      });
    }
  };

  public getPendingStage1 = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: ExporterProfile[] = [];

      res.status(200).json({
        success: true,
        message: 'Stage 1 applications pending approval',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 1 pending applications',
        error: error.message,
      });
    }
  };

  public getStage1Details = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 1 details retrieved successfully',
        data: { exporterId, stage: 1 },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 1 details',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // STAGE 2: FACILITY INSPECTION & VERIFICATION
  // ============================================================================

  public scheduleStage2Inspection = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId, warehouseLocation, storageCapacity, preferredDate } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !warehouseLocation) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and warehouse location are required',
        });
        return;
      }

      const inspection = {
        inspectionId: uuidv4(),
        exporterId,
        warehouseLocation,
        storageCapacity,
        preferredDate,
        status: 'STAGE_2_PENDING',
        scheduledBy: user.username,
        scheduledAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'Stage 2 (Facility Inspection) scheduled',
        data: inspection,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule Stage 2 inspection',
        error: error.message,
      });
    }
  };

  public approveStage2 = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { inspectionReport } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 2 (Facility Inspection) approved',
        data: {
          exporterId,
          status: 'STAGE_2_APPROVED',
          inspectionReport,
          approvedBy: user.username,
          approvedAt: new Date().toISOString(),
          nextStage: 'Stage 3: Laboratory Certification',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to approve Stage 2',
        error: error.message,
      });
    }
  };

  public rejectStage2 = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 2 (Facility Inspection) rejected',
        data: {
          exporterId,
          status: 'STAGE_2_REJECTED',
          reason,
          rejectedBy: user.username,
          rejectedAt: new Date().toISOString(),
          nextSteps: ['Exporter must correct facility issues and reschedule inspection'],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject Stage 2',
        error: error.message,
      });
    }
  };

  public getPendingStage2 = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: ExporterProfile[] = [];

      res.status(200).json({
        success: true,
        message: 'Stage 2 inspections pending completion',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 2 pending inspections',
        error: error.message,
      });
    }
  };

  public getStage2Details = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 2 details retrieved successfully',
        data: { exporterId, stage: 2 },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 2 details',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // STAGE 3: LABORATORY CERTIFICATION
  // ============================================================================

  public certifyStage3Laboratory = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { laboratoryId } = req.params;
      const { certificationNumber, inspectionPassed, validityYears = 2 } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!laboratoryId || !certificationNumber) {
        res.status(400).json({
          success: false,
          message: 'Laboratory ID and certification number are required',
        });
        return;
      }

      if (!inspectionPassed) {
        res.status(400).json({
          success: false,
          message: 'Laboratory inspection must pass before certification',
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      res.status(200).json({
        success: true,
        message: 'Stage 3 (Laboratory) certified successfully',
        data: {
          laboratoryId,
          certificationNumber,
          status: 'STAGE_3_APPROVED',
          expiryDate: expiryDate.toISOString(),
          certifiedBy: user.username,
          certifiedAt: now.toISOString(),
          nextStage: 'Stage 4: Competence Certificate',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to certify Stage 3 laboratory',
        error: error.message,
      });
    }
  };

  public rejectStage3Laboratory = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { laboratoryId } = req.params;
      const { reason } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!laboratoryId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Laboratory ID and rejection reason are required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 3 (Laboratory) rejected',
        data: {
          laboratoryId,
          status: 'STAGE_3_REJECTED',
          reason,
          rejectedBy: user.username,
          rejectedAt: new Date().toISOString(),
          nextSteps: ['Exporter must correct laboratory issues and resubmit'],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject Stage 3 laboratory',
        error: error.message,
      });
    }
  };

  public getPendingStage3 = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: CoffeeLaboratory[] = [];

      res.status(200).json({
        success: true,
        message: 'Stage 3 laboratory certifications pending review',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 3 pending certifications',
        error: error.message,
      });
    }
  };

  public getStage3Details = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { laboratoryId } = req.params;

      if (!laboratoryId) {
        res.status(400).json({
          success: false,
          message: 'Laboratory ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 3 details retrieved successfully',
        data: { laboratoryId, stage: 3 },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 3 details',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // STAGE 4: COMPETENCE CERTIFICATE
  // ============================================================================

  public issueStage4Competence = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const {
        certificateNumber,
        laboratoryId,
        tasterId,
        facilityInspectionPassed,
        validityYears = 2,
      } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !certificateNumber || !laboratoryId || !tasterId) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: exporterId, certificateNumber, laboratoryId, tasterId',
        });
        return;
      }

      if (!facilityInspectionPassed) {
        res.status(400).json({
          success: false,
          message: 'Facility inspection must pass before issuing certificate',
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      res.status(201).json({
        success: true,
        message: 'Stage 4 (Competence Certificate) issued successfully',
        data: {
          exporterId,
          certificateNumber,
          status: 'STAGE_4_APPROVED',
          expiryDate: expiryDate.toISOString(),
          issuedBy: user.username,
          issuedAt: now.toISOString(),
          nextStage: 'Stage 5: Export License',
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue Stage 4 competence certificate',
        error: error.message,
      });
    }
  };

  public rejectStage4Competence = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 4 (Competence Certificate) rejected',
        data: {
          exporterId,
          status: 'STAGE_4_REJECTED',
          reason,
          rejectedBy: user.username,
          rejectedAt: new Date().toISOString(),
          nextSteps: ['Exporter must address issues and reapply'],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject Stage 4 competence certificate',
        error: error.message,
      });
    }
  };

  public getPendingStage4 = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: CompetenceCertificate[] = [];

      res.status(200).json({
        success: true,
        message: 'Stage 4 competence certificate applications pending review',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 4 pending applications',
        error: error.message,
      });
    }
  };

  public getStage4Details = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 4 details retrieved successfully',
        data: { exporterId, stage: 4 },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 4 details',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // STAGE 5: EXPORT LICENSE
  // ============================================================================

  public issueStage5License = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const {
        licenseNumber,
        competenceCertificateId,
        eicRegistrationNumber,
        authorizedCoffeeTypes,
        authorizedOrigins,
        annualQuota,
        validityYears = 1,
      } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !licenseNumber || !competenceCertificateId || !eicRegistrationNumber) {
        res.status(400).json({
          success: false,
          message:
            'Missing required fields: exporterId, licenseNumber, competenceCertificateId, eicRegistrationNumber',
        });
        return;
      }

      const now = new Date();
      const expiryDate = new Date(now);
      expiryDate.setFullYear(expiryDate.getFullYear() + validityYears);

      res.status(201).json({
        success: true,
        message: 'Stage 5 (Export License) issued successfully',
        data: {
          exporterId,
          licenseNumber,
          status: 'STAGE_5_APPROVED',
          expiryDate: expiryDate.toISOString(),
          authorizedCoffeeTypes: authorizedCoffeeTypes || ['Arabica'],
          authorizedOrigins: authorizedOrigins || [],
          annualQuota,
          issuedBy: user.username,
          issuedAt: now.toISOString(),
          nextSteps: ['Exporter is now ready to create export requests'],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to issue Stage 5 export license',
        error: error.message,
      });
    }
  };

  public rejectStage5License = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { reason } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID and rejection reason are required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 5 (Export License) rejected',
        data: {
          exporterId,
          status: 'STAGE_5_REJECTED',
          reason,
          rejectedBy: user.username,
          rejectedAt: new Date().toISOString(),
          nextSteps: ['Exporter must address issues and reapply'],
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to reject Stage 5 export license',
        error: error.message,
      });
    }
  };

  public getPendingStage5 = async (_req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const pending: ExportLicense[] = [];

      res.status(200).json({
        success: true,
        message: 'Stage 5 export license applications pending review',
        data: pending,
        count: pending.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 5 pending applications',
        error: error.message,
      });
    }
  };

  public getStage5Details = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Stage 5 details retrieved successfully',
        data: { exporterId, stage: 5 },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch Stage 5 details',
        error: error.message,
      });
    }
  };

  // ============================================================================
  // COMPLIANCE MONITORING
  // ============================================================================

  public submitQuarterlyReport = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const {
        exporterId,
        quarter,
        year,
        totalExports,
        destinationCountries,
        averagePrices,
        qualityMetrics,
        issues,
      } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !quarter || !year) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID, quarter, and year are required',
        });
        return;
      }

      const report = {
        reportId: uuidv4(),
        exporterId,
        quarter,
        year,
        totalExports,
        destinationCountries,
        averagePrices,
        qualityMetrics,
        issues,
        submittedBy: user.username,
        submittedAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'Quarterly report submitted successfully',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to submit quarterly report',
        error: error.message,
      });
    }
  };

  public getQuarterlyReports = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      const reports: any[] = [];

      res.status(200).json({
        success: true,
        message: 'Quarterly reports retrieved',
        data: reports,
        count: reports.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch quarterly reports',
        error: error.message,
      });
    }
  };

  public scheduleAnnualAudit = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { preferredDate } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      const audit = {
        auditId: uuidv4(),
        exporterId,
        preferredDate,
        status: 'SCHEDULED',
        scheduledBy: user.username,
        scheduledAt: new Date().toISOString(),
      };

      res.status(201).json({
        success: true,
        message: 'Annual audit scheduled successfully',
        data: audit,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to schedule annual audit',
        error: error.message,
      });
    }
  };

  public getAnnualAudits = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      const audits: any[] = [];

      res.status(200).json({
        success: true,
        message: 'Annual audits retrieved',
        data: audits,
        count: audits.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch annual audits',
        error: error.message,
      });
    }
  };

  public recordViolation = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;
      const { category, description, penaltyAmount } = req.body;
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
        return;
      }

      if (!exporterId || !category || !description) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID, category, and description are required',
        });
        return;
      }

      if (!['A', 'B', 'C'].includes(category)) {
        res.status(400).json({
          success: false,
          message: 'Category must be A, B, or C',
        });
        return;
      }

      const violation = {
        violationId: uuidv4(),
        exporterId,
        category,
        description,
        penaltyAmount,
        recordedBy: user.username,
        recordedAt: new Date().toISOString(),
        status: 'ACTIVE',
      };

      res.status(201).json({
        success: true,
        message: 'Compliance violation recorded successfully',
        data: violation,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to record compliance violation',
        error: error.message,
      });
    }
  };

  public getViolations = async (req: RequestWithUser, res: Response): Promise<void> => {
    try {
      const { exporterId } = req.params;

      if (!exporterId) {
        res.status(400).json({
          success: false,
          message: 'Exporter ID is required',
        });
        return;
      }

      const violations: any[] = [];

      res.status(200).json({
        success: true,
        message: 'Violations retrieved',
        data: violations,
        count: violations.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch violations',
        error: error.message,
      });
    }
  };
}
