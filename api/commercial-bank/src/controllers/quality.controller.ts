import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { FabricGateway } from "../fabric/gateway";
import { v4 as uuidv4 } from "uuid";

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class QualityController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  public getPendingExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction(
        "GetExportsByStatus",
        "FX_APPROVED",
      );
      const exports = JSON.parse(result.toString());

      res.status(200).json({
        success: true,
        data: exports,
        count: exports.length,
      });
    } catch (error: unknown) {
      console.error("Error getting pending exports:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to retrieve pending exports",
        error: message,
      });
    }
  };

  public getAllExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction("GetAllExports");
      const exports = JSON.parse(result.toString());

      res.status(200).json({
        success: true,
        data: exports,
        count: exports.length,
      });
    } catch (error: unknown) {
      console.error("Error getting all exports:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to retrieve exports",
        error: message,
      });
    }
  };

  public getExportById = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId } = req.params;
      if (!exportId) {
        res
          .status(400)
          .json({ success: false, message: "Export ID is required" });
        return;
      }
      const contract = this.fabricGateway.getExportContract();

      const result = await contract.evaluateTransaction(
        "GetExportRequest",
        exportId,
      );
      const exportData = JSON.parse(result.toString());

      res.status(200).json({
        success: true,
        data: exportData,
      });
    } catch (error: unknown) {
      console.error("Error getting export by ID:", error);
      const message =
        error instanceof Error ? error.message : "Export not found";
      res.status(404).json({
        success: false,
        message: "Export not found",
        error: message,
      });
    }
  };

  public issueQualityCertificate = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId, qualityGrade } = req.body;
      const qualityCertId = `QC-${uuidv4()}`;
      const certifiedBy = req.user?.username || "NCAT Inspector";

      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction(
        "IssueQualityCertificate",
        exportId,
        qualityCertId,
        qualityGrade,
        certifiedBy,
      );

      res.status(200).json({
        success: true,
        message: "Quality certificate issued successfully",
        data: {
          exportId,
          qualityCertId,
          qualityGrade,
          certifiedBy,
          status: "QUALITY_CERTIFIED",
        },
      });
    } catch (error: unknown) {
      console.error("Error issuing quality certificate:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to issue quality certificate",
        error: message,
      });
    }
  };

  public rejectQuality = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId, rejectionReason } = req.body;
      const rejectedBy = req.user?.username || "NCAT Inspector";

      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction(
        "RejectQuality",
        exportId,
        rejectionReason,
        rejectedBy,
      );

      res.status(200).json({
        success: true,
        message: "Quality rejected successfully",
        data: {
          exportId,
          rejectionReason,
          rejectedBy,
          status: "QUALITY_REJECTED",
        },
      });
    } catch (error: unknown) {
      console.error("Error rejecting quality:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to reject quality",
        error: message,
      });
    }
  };
}
