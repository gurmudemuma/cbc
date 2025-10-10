import { Request, Response, NextFunction } from "express";
import { FabricGateway } from "../fabric/gateway";
import { v4 as uuidv4 } from "uuid";

export class ExportController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  public createExport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        exporterName,
        coffeeType,
        quantity,
        destinationCountry,
        estimatedValue,
      } = req.body;
      const exportId = `EXP-${uuidv4()}`;
      const exporterBankId = "EXPORTER-BANK-001"; // This should ideally come from the user's session

      const contract = await this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        "CreateExportRequest",
        exportId,
        exporterBankId,
        exporterName,
        coffeeType,
        String(quantity),
        destinationCountry,
        String(estimatedValue),
      );

      res.status(201).json({
        success: true,
        message: "Export request created successfully",
        exportId,
      });
    } catch (error) {
      next(error);
    }
  };

  public getAllExports = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const contract = await this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction("GetAllExports");
      const exports = JSON.parse(result.toString());
      res.status(200).json({ success: true, data: exports });
    } catch (error) {
      next(error);
    }
  };

  public getExportById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: "ID is required" });
        return;
      }
      const contract = await this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction("GetExportRequest", id);
      const exportData = JSON.parse(result.toString());
      res.status(200).json({ success: true, data: exportData });
    } catch (error) {
      next(error);
    }
  };

  public getExportsByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { status } = req.params;
      if (!status) {
        res.status(400).json({ success: false, message: "Status is required" });
        return;
      }
      const contract = await this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction(
        "GetExportsByStatus",
        status,
      );
      const exports = JSON.parse(result.toString());
      res.status(200).json({ success: true, data: exports });
    } catch (error) {
      next(error);
    }
  };

  public getExportHistory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: "ID is required" });
        return;
      }
      const contract = await this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction("GetExportHistory", id);
      const history = JSON.parse(result.toString());
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };

  public completeExport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: "ID is required" });
        return;
      }
      const contract = await this.fabricGateway.getExportContract();
      await contract.submitTransaction("CompleteExport", id);
      res
        .status(200)
        .json({ success: true, message: "Export completed successfully" });
    } catch (error) {
      next(error);
    }
  };

  public cancelExport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({ success: false, message: "ID is required" });
        return;
      }
      const contract = await this.fabricGateway.getExportContract();
      await contract.submitTransaction("CancelExport", id);
      res
        .status(200)
        .json({ success: true, message: "Export cancelled successfully" });
    } catch (error) {
      next(error);
    }
  };
}