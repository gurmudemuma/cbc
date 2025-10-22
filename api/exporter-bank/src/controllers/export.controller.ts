import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";
import { FabricGateway } from "../fabric/gateway";
import { v4 as uuidv4 } from "uuid";
import { getIPFSService } from "../../../shared/ipfs.service";
import { getWebSocketService } from "../../../shared/websocket.service";
import { InputSanitizer } from "../../../shared/input.sanitizer";
import * as crypto from "crypto";

interface AuthJWTPayload extends JwtPayload {
  id: string;
  username: string;
  organizationId: string;
  role: string;
}

interface RequestWithUser extends Request {
  user?: AuthJWTPayload;
}

export class ExportController {
  private fabricGateway: FabricGateway;

  constructor() {
    this.fabricGateway = FabricGateway.getInstance();
  }

  public createExport = async (
    req: RequestWithUser,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.organizationId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // Sanitize all inputs before processing
      const sanitizedData = InputSanitizer.sanitizeExportRequest(req.body);

      const exportId = `EXP-${uuidv4()}`;
      const exporterBankId = req.user.organizationId;

      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction(
        "CreateExportRequest",
        exportId,
        exporterBankId,
        sanitizedData.exporterName,
        sanitizedData.coffeeType,
        sanitizedData.quantity.toString(),
        sanitizedData.destinationCountry,
        sanitizedData.estimatedValue.toString(),
      );

      res.status(201).json({
        success: true,
        message: "Export request created successfully",
        data: {
          exportId,
          exporterBankId,
          ...sanitizedData,
          status: "PENDING",
        },
      });
    } catch (error: unknown) {
      console.error("Error creating export:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to create export request",
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
      // Check if Fabric gateway is connected
      if (!this.fabricGateway.isConnected()) {
        console.error("Fabric gateway is not connected");
        res.status(503).json({
          success: false,
          message:
            "Blockchain network is not available. Please try again later.",
          error: "Fabric gateway not connected",
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      const result = await contract.evaluateTransaction("GetAllExports");

      // Handle empty or null responses
      const resultString = result.toString().trim();
      const exports =
        resultString && resultString !== "" ? JSON.parse(resultString) : [];

      res.status(200).json({
        success: true,
        data: exports,
        count: exports.length,
      });
    } catch (error: unknown) {
      console.error("Error getting all exports:", error);
      const message = error instanceof Error ? error.message : "Unknown error";

      // Provide more specific error messages
      let statusCode = 500;
      let userMessage = "Failed to retrieve exports";

      if (
        message.includes("not initialized") ||
        message.includes("not connected")
      ) {
        statusCode = 503;
        userMessage =
          "Blockchain network is not available. Please try again later.";
      } else if (
        message.includes("ECONNREFUSED") ||
        message.includes("UNAVAILABLE")
      ) {
        statusCode = 503;
        userMessage = "Unable to connect to blockchain network";
      }

      res.status(statusCode).json({
        success: false,
        message: userMessage,
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

      // Sanitize export ID
      const sanitizedExportId = InputSanitizer.sanitizeId(exportId);

      const contract = this.fabricGateway.getExportContract();

      const result = await contract.evaluateTransaction(
        "GetExportRequest",
        sanitizedExportId,
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

  public getExportsByStatus = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { status } = req.params;
      if (!status) {
        res.status(400).json({ success: false, message: "Status is required" });
        return;
      }

      // Check if Fabric gateway is connected
      if (!this.fabricGateway.isConnected()) {
        console.error("Fabric gateway is not connected");
        res.status(503).json({
          success: false,
          message:
            "Blockchain network is not available. Please try again later.",
          error: "Fabric gateway not connected",
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();

      const result = await contract.evaluateTransaction(
        "GetExportsByStatus",
        status,
      );

      // Handle empty or null responses
      const resultString = result.toString().trim();
      const exports =
        resultString && resultString !== "" ? JSON.parse(resultString) : [];

      res.status(200).json({
        success: true,
        data: exports,
        count: exports.length,
      });
    } catch (error: unknown) {
      console.error("Error getting exports by status:", error);
      const message =
        error instanceof Error ? error.message : "Failed to retrieve exports";

      // Provide more specific error messages
      let statusCode = 500;
      let userMessage = "Failed to retrieve exports by status";

      if (
        message.includes("not initialized") ||
        message.includes("not connected")
      ) {
        statusCode = 503;
        userMessage =
          "Blockchain network is not available. Please try again later.";
      } else if (
        message.includes("ECONNREFUSED") ||
        message.includes("UNAVAILABLE")
      ) {
        statusCode = 503;
        userMessage = "Unable to connect to blockchain network";
      }

      res.status(statusCode).json({
        success: false,
        message: userMessage,
        error: message,
      });
    }
  };

  public getExportHistory = async (
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
        "GetExportHistory",
        exportId,
      );
      const history = JSON.parse(result.toString());

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error: unknown) {
      console.error("Error getting export history:", error);
      const message =
        error instanceof Error ? error.message : "Failed to retrieve history";
      res.status(500).json({
        success: false,
        message: "Failed to retrieve export history",
        error: message,
      });
    }
  };

  public completeExport = async (
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

      await contract.submitTransaction("CompleteExport", exportId);

      res.status(200).json({
        success: true,
        message: "Export completed successfully",
        data: { exportId, status: "COMPLETED" },
      });
    } catch (error: unknown) {
      console.error("Error completing export:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to complete export",
        error: message,
      });
    }
  };

  public updateRejectedExport = async (
    req: RequestWithUser,
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

      const sanitizedData = InputSanitizer.sanitizeExportRequest(req.body);
      const contract = this.fabricGateway.getExportContract();

      await contract.submitTransaction(
        "UpdateRejectedExport",
        exportId,
        sanitizedData.coffeeType || "",
        sanitizedData.quantity?.toString() || "0",
        sanitizedData.destinationCountry || "",
        sanitizedData.estimatedValue?.toString() || "0",
      );

      res.status(200).json({
        success: true,
        message:
          "Rejected export updated successfully. Status reset to DRAFT. You can now resubmit.",
        data: { exportId, status: "DRAFT", ...sanitizedData },
      });
    } catch (error: unknown) {
      console.error("Error updating rejected export:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to update rejected export",
        error: message,
      });
    }
  };

  public resubmitRejectedExport = async (
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

      await contract.submitTransaction("ResubmitRejectedExport", exportId);

      res.status(200).json({
        success: true,
        message: "Export resubmitted successfully. Status reset to DRAFT.",
        data: { exportId, status: "DRAFT" },
      });
    } catch (error: unknown) {
      console.error("Error resubmitting rejected export:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to resubmit rejected export",
        error: message,
      });
    }
  };

  public cancelExport = async (
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

      await contract.submitTransaction("CancelExport", exportId);

      res.status(200).json({
        success: true,
        message: "Export cancelled successfully",
        data: { exportId, status: "CANCELLED" },
      });
    } catch (error: unknown) {
      console.error("Error cancelling export:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to cancel export",
        error: message,
      });
    }
  };

  public addDocument = async (
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
      const { docType } = req.body;
      const file = req.file; // Assuming multer middleware is used for file upload

      if (!file) {
        res.status(400).json({ success: false, message: "No file uploaded" });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        res
          .status(400)
          .json({ success: false, message: "File too large (max 10MB)" });
        return;
      }

      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.mimetype)) {
        res
          .status(400)
          .json({ success: false, message: "Unsupported file type" });
        return;
      }

      // Map frontend document types to chaincode document categories
      const docTypeMapping: { [key: string]: string } = {
        COMMERCIAL_INVOICE: "fx",
        PACKING_LIST: "shipment",
        CERTIFICATE_OF_ORIGIN: "quality",
        BILL_OF_LADING: "shipment",
        PHYTOSANITARY_CERTIFICATE: "quality",
        QUALITY_REPORT: "quality",
        EXPORT_LICENSE: "fx",
        // Legacy support
        fx: "fx",
        quality: "quality",
        shipment: "shipment",
      };

      if (!docType) {
        res.status(400).json({
          success: false,
          message: "Document type is required",
        });
        return;
      }

      const mappedDocType = docTypeMapping[docType.toUpperCase()];
      if (!mappedDocType) {
        res.status(400).json({
          success: false,
          message: `Invalid document type: ${docType}. Supported types: ${Object.keys(docTypeMapping).join(", ")}`,
        });
        return;
      }

      // Encrypt file buffer (AES-256, using a demo key - in production, use secure key management)
      const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32); // 256-bit key
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
      const encryptedBuffer = Buffer.concat([
        iv,
        cipher.update(file.buffer),
        cipher.final(),
      ]);

      // Upload encrypted buffer to IPFS
      const ipfs = getIPFSService();
      const result = await ipfs.uploadBuffer(
        encryptedBuffer,
        file.originalname,
      );
      const cid = result.hash;

      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        "AddDocument",
        exportId,
        mappedDocType,
        cid,
      );

      // Query to get the actual version
      const queryResult = await contract.evaluateTransaction(
        "GetExportRequest",
        exportId,
      );
      const exportData = JSON.parse(queryResult.toString());
      let version = 1;
      switch (mappedDocType) {
        case "fx":
          version = exportData.FXDocuments?.length || 1;
          break;
        case "quality":
          version = exportData.QualityDocuments?.length || 1;
          break;
        case "shipment":
          version = exportData.ShipmentDocuments?.length || 1;
          break;
      }

      // Emit notification
      const ws = getWebSocketService();
      if (ws) {
        ws.emitDocumentUploaded(exportId, mappedDocType, version, cid);
      }

      res.status(200).json({
        success: true,
        message: "Document added successfully",
        data: {
          exportId,
          docType: mappedDocType,
          originalDocType: docType,
          cid,
        },
      });
    } catch (error: unknown) {
      console.error("Error adding document:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to add document",
        error: message,
      });
    }
  };

  public deleteDocument = async (
    req: Request,
    res: Response,
    _next: NextFunction,
  ): Promise<void> => {
    try {
      const { exportId, docType, version: versionStr } = req.params;
      if (!exportId) {
        res
          .status(400)
          .json({ success: false, message: "Export ID is required" });
        return;
      }
      if (!docType) {
        res
          .status(400)
          .json({ success: false, message: "Document type is required" });
        return;
      }
      if (!versionStr) {
        res
          .status(400)
          .json({ success: false, message: "Version is required" });
        return;
      }

      if (!["fx", "quality", "shipment"].includes(docType)) {
        res.status(400).json({
          success: false,
          message: "Invalid docType (must be fx, quality, or shipment)",
        });
        return;
      }

      const version = parseInt(versionStr);
      if (isNaN(version) || version <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid version (must be positive integer)",
        });
        return;
      }

      const contract = this.fabricGateway.getExportContract();
      await contract.submitTransaction(
        "DeleteDocument",
        exportId,
        docType,
        version.toString(),
      );

      // Emit notification
      const ws = getWebSocketService();
      if (ws) {
        ws.emitDocumentDeleted(exportId, docType, version);
      }

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
        data: { exportId, docType, version },
      });
    } catch (error: unknown) {
      console.error("Error deleting document:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        success: false,
        message: "Failed to delete document",
        error: message,
      });
    }
  };
}
