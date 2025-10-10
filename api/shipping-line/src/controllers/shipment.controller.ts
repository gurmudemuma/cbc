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

export class ShipmentController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  public getReadyExports = async (
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const contract = this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction(
        "GetExportsByStatus",
        "QUALITY_CERTIFIED",
      );
      const exports = JSON.parse(result.toString());

      res.status(200).json({
        success: true,
        data: exports,
        count: exports.length,
      });
    } catch (error: unknown) {
      console.error("Error getting ready exports:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to retrieve ready exports",
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

  public scheduleShipment = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId, vesselName, departureDate, arrivalDate } = req.body;
      const shipmentId = `SHIP-${uuidv4()}`;
      const shippingLineId = req.user?.organizationId || "SHIPPING-LINE-001";

      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction(
        "ScheduleShipment",
        exportId,
        shipmentId,
        vesselName,
        departureDate,
        arrivalDate,
        shippingLineId,
      );

      res.status(200).json({
        success: true,
        message: "Shipment scheduled successfully",
        data: {
          exportId,
          shipmentId,
          vesselName,
          departureDate,
          arrivalDate,
          shippingLineId,
          status: "SHIPMENT_SCHEDULED",
        },
      });
    } catch (error: unknown) {
      console.error("Error scheduling shipment:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to schedule shipment",
        error: message,
      });
    }
  };

  public confirmShipment = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId } = req.body;

      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction("ConfirmShipment", exportId);

      res.status(200).json({
        success: true,
        message: "Shipment confirmed successfully",
        data: {
          exportId,
          status: "SHIPPED",
        },
      });
    } catch (error: unknown) {
      console.error("Error confirming shipment:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to confirm shipment",
        error: message,
      });
    }
  };
}
