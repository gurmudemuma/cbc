import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { FabricGateway } from "../fabric/gateway";

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class CustomsController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  public getAllExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction("GetAllExports");
      const exports = JSON.parse(result.toString());

      res
        .status(200)
        .json({ success: true, data: exports, count: exports.length });
    } catch (error: unknown) {
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

      res.status(200).json({ success: true, data: exportData });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Export not found";
      res
        .status(404)
        .json({ success: false, message: "Export not found", error: message });
    }
  };

  public issueClearance = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId, clearanceId } = req.body;
      if (!exportId || !clearanceId) {
        res.status(400).json({
          success: false,
          message: "exportId and clearanceId are required",
        });
        return;
      }
      const clearedBy = req.user?.username || "Customs Officer";
      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction(
        "IssueCustomsClearance",
        exportId,
        clearanceId,
        clearedBy,
      );

      res.status(200).json({
        success: true,
        message: "Customs clearance issued",
        data: { exportId, clearanceId, clearedBy, status: "CUSTOMS_CLEARED" },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to issue customs clearance",
        error: message,
      });
    }
  };

  public rejectAtCustoms = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId, rejectionReason } = req.body;
      if (!exportId || !rejectionReason) {
        res.status(400).json({
          success: false,
          message: "exportId and rejectionReason are required",
        });
        return;
      }
      const rejectedBy = req.user?.username || "Customs Officer";
      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction(
        "RejectCustoms",
        exportId,
        rejectionReason,
        rejectedBy,
      );

      res.status(200).json({
        success: true,
        message: "Customs rejection recorded",
        data: {
          exportId,
          rejectionReason,
          rejectedBy,
          status: "CUSTOMS_REJECTED",
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to reject at customs",
        error: message,
      });
    }
  };
}
