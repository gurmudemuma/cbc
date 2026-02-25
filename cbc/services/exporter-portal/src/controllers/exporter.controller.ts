import { Request, Response, NextFunction } from "express";
import { logger } from "../config/logger";
import { ExporterPreRegistrationController } from "./preregistration.controller";

/**
 * ExporterController (Exporter Portal)
 *
 * This controller consolidates exporter-facing endpoints by delegating
 * functionality to the existing preregistration controller which already
 * implements profile, laboratory, taster, competence and license flows.
 *
 * The goal is to keep a thin adapter here, maintain the commercial-bank
 * semantics/route names, and ensure all exporter tasks remain intact.
 */
export class ExporterController {
  private preregController: ExporterPreRegistrationController;

  constructor() {
    this.preregController = new ExporterPreRegistrationController();
  }

  /**
   * Get qualification status
   * Delegates to preregistration controller's checkQualificationStatus
   */
  public getQualificationStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Delegate directly
      await this.preregController.checkQualificationStatus(
        req as any,
        res,
        next,
      );
    } catch (error: unknown) {
      logger.error(
        "Failed to get qualification status (exporter controller):",
        error,
      );
      const message =
        error instanceof Error
          ? error.message
          : "Failed to get qualification status";
      res.status(500).json({ success: false, message, error: message });
    }
  };

  /**
   * Register exporter profile
   * Delegates to preregistration controller's registerProfile
   */
  public registerProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.registerProfile(req as any, res, next);
    } catch (error: unknown) {
      logger.error("Failed to register profile (exporter controller):", error);
      const message =
        error instanceof Error ? error.message : "Failed to register profile";
      res.status(500).json({ success: false, message, error: message });
    }
  };

  /**
   * Get own exporter profile
   * Delegates to preregistration controller's getMyProfile
   */
  public getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.getMyProfile(req as any, res, next);
    } catch (error: unknown) {
      logger.error("Failed to get profile (exporter controller):", error);
      const message =
        error instanceof Error ? error.message : "Failed to get profile";
      res.status(500).json({ success: false, message, error: message });
    }
  };

  /**
   * Update own exporter profile
   * Delegates to preregistration controller's updateProfile
   */
  public updateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.updateProfile(req as any, res, next);
    } catch (error: unknown) {
      logger.error("Failed to update profile (exporter controller):", error);
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      res.status(500).json({ success: false, message, error: message });
    }
  };

  /**
   * Apply for export license
   * Delegates to preregistration controller's applyForExportLicense
   */
  public applyLicense = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.applyForExportLicense(req as any, res, next);
    } catch (error: unknown) {
      logger.error(
        "Failed to apply for export license (exporter controller):",
        error,
      );
      const message =
        error instanceof Error
          ? error.message
          : "Failed to apply for export license";
      res.status(500).json({ success: false, message, error: message });
    }
  };

  /**
   * Register laboratory
   * Delegates to preregistration controller's registerLaboratory
   */
  public registerLaboratory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.registerLaboratory(req as any, res, next);
    } catch (error: unknown) {
      logger.error(
        "Failed to register laboratory (exporter controller):",
        error,
      );
      const message =
        error instanceof Error
          ? error.message
          : "Failed to register laboratory";
      res.status(500).json({ success: false, message, error: message });
    }
  };

  /**
   * Register coffee taster
   * Delegates to preregistration controller's registerTaster
   */
  public registerTaster = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.registerTaster(req as any, res, next);
    } catch (error: unknown) {
      logger.error("Failed to register taster (exporter controller):", error);
      const message =
        error instanceof Error ? error.message : "Failed to register taster";
      res.status(500).json({ success: false, message, error: message });
    }
  };

  /**
   * Apply for competence certificate
   * Delegates to preregistration controller's applyForCompetenceCertificate
   */
  public applyCompetence = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.applyForCompetenceCertificate(
        req as any,
        res,
        next,
      );
    } catch (error: unknown) {
      logger.error(
        "Failed to apply for competence certificate (exporter controller):",
        error,
      );
      const message =
        error instanceof Error
          ? error.message
          : "Failed to apply for competence certificate";
      res.status(500).json({ success: false, message, error: message });
    }
  };
  /**
   * Get all applications
   * Delegates to preregistration controller's getMyApplications
   */
  public getApplications = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.preregController.getMyApplications(req as any, res, next);
    } catch (error: unknown) {
      logger.error("Failed to get applications (exporter controller):", error);
      const message =
        error instanceof Error ? error.message : "Failed to get applications";
      res.status(500).json({ success: false, message, error: message });
    }
  };
}
