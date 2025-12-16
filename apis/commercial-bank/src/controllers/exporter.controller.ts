import { Request, Response, NextFunction } from 'express';
import { SharedExporterController } from '../../../shared/controllers/exporter.controller';

// Thin adapter for Commercial Bank API that delegates to the shared exporter
// controller implementation. Keeps the API-specific file minimal and ensures
// behaviour is consistent across services.
export class ExporterController {
  private shared: SharedExporterController;

  constructor() {
    this.shared = new SharedExporterController();
  }

  public getQualificationStatus = (req: Request, res: Response, next: NextFunction) =>
    this.shared.getQualificationStatus(req, res, next);
  public registerProfile = (req: Request, res: Response, next: NextFunction) =>
    this.shared.registerProfile(req, res, next);
  public getProfile = (req: Request, res: Response, next: NextFunction) =>
    this.shared.getProfile(req, res, next);
  public applyLicense = (req: Request, res: Response, next: NextFunction) =>
    this.shared.applyLicense(req, res, next);
  public registerLaboratory = (req: Request, res: Response, next: NextFunction) =>
    this.shared.registerLaboratory(req, res, next);
  public registerTaster = (req: Request, res: Response, next: NextFunction) =>
    this.shared.registerTaster(req, res, next);
  public applyCompetence = (req: Request, res: Response, next: NextFunction) =>
    this.shared.applyCompetence(req, res, next);
}
