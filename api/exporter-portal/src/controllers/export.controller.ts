import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { ExportRequestService } from "../services/export-request.service";
import { DocumentService } from "../services/document.service";
import {
  CreateExportRequestDTO,
  UpdateExportRequestDTO,
  ExportRequestStatus,
  DEFAULT_DOCUMENT_REQUIREMENTS,
} from "../models/export-request.model";
import { v4 as uuidv4 } from "uuid";

export class ExportController {
  private exportRequestService: ExportRequestService;
  private documentService: DocumentService;

  constructor() {
    this.exportRequestService = new ExportRequestService();
    this.documentService = new DocumentService();
  }

  /**
   * Get all export requests for authenticated user
   */
  public getExportRequests = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const userId = req.user!.id;

      const result = await this.exportRequestService.getExportRequestsByUser(
        userId,
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          status: status as ExportRequestStatus,
          search: search as string,
        },
      );

      res.status(200).json({
        success: true,
        message: "Export requests retrieved successfully",
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Create new export request (draft)
   */
  public createExportRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const exportRequestData: CreateExportRequestDTO = req.body;

      // Generate unique request number
      const requestNumber = `EXP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const exportRequest = await this.exportRequestService.createExportRequest(
        {
          id: uuidv4(),
          requestNumber,
          status: ExportRequestStatus.DRAFT,
          exporterId: userId,
          exporterDetails: exportRequestData.exporterDetails,
          coffeeDetails: exportRequestData.coffeeDetails,
          tradeDetails: exportRequestData.tradeDetails,
          documents: [],
          submittedAt: new Date(),
          lastUpdated: new Date(),
        },
      );

      res.status(201).json({
        success: true,
        message: "Export request created successfully",
        data: exportRequest,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get export request by ID
   */
  public getExportRequestById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;

      const exportRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!exportRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (exportRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied: You can only view your own export requests",
        });
        return;
      }

      // Get available actions based on current status
      const availableActions = this.getAvailableActions(exportRequest.status);

      // Check for validation errors
      const validationErrors =
        await this.exportRequestService.validateExportRequest(exportRequest);

      res.status(200).json({
        success: true,
        message: "Export request retrieved successfully",
        data: {
          request: exportRequest,
          availableActions,
          validationErrors,
        },
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Update export request (only drafts)
   */
  public updateExportRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;
      const updateData: UpdateExportRequestDTO = req.body;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message:
            "Access denied: You can only update your own export requests",
        });
        return;
      }

      // Only drafts can be updated
      if (existingRequest.status !== ExportRequestStatus.DRAFT) {
        res.status(400).json({
          success: false,
          message: "Only draft export requests can be updated",
        });
        return;
      }

      const updatedRequest =
        await this.exportRequestService.updateExportRequest(id, updateData);

      res.status(200).json({
        success: true,
        message: "Export request updated successfully",
        data: updatedRequest,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Delete export request (only drafts)
   */
  public deleteExportRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message:
            "Access denied: You can only delete your own export requests",
        });
        return;
      }

      // Only drafts can be deleted
      if (existingRequest.status !== ExportRequestStatus.DRAFT) {
        res.status(400).json({
          success: false,
          message: "Only draft export requests can be deleted",
        });
        return;
      }

      await this.exportRequestService.deleteExportRequest(id);

      res.status(200).json({
        success: true,
        message: "Export request deleted successfully",
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Submit export request to consortium
   */
  public submitExportRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const { finalNotes } = req.body;
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message:
            "Access denied: You can only submit your own export requests",
        });
        return;
      }

      // Can only submit drafts
      if (existingRequest.status !== ExportRequestStatus.DRAFT) {
        res.status(400).json({
          success: false,
          message: "Only draft export requests can be submitted",
        });
        return;
      }

      // Validate request before submission
      const validationErrors =
        await this.exportRequestService.validateExportRequest(existingRequest);
      if (validationErrors.length > 0) {
        res.status(400).json({
          success: false,
          message: "Export request has validation errors",
          errors: validationErrors,
        });
        return;
      }

      // Submit to consortium (this would integrate with exporter-bank API)
      const submittedRequest =
        await this.exportRequestService.submitToConsortium(id, finalNotes);

      res.status(200).json({
        success: true,
        message: "Export request submitted to consortium successfully",
        data: submittedRequest,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Cancel export request
   */
  public cancelExportRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message:
            "Access denied: You can only cancel your own export requests",
        });
        return;
      }

      // Cannot cancel completed or already cancelled requests
      if (
        [
          ExportRequestStatus.APPROVED,
          ExportRequestStatus.REJECTED,
          ExportRequestStatus.CANCELLED,
        ].includes(existingRequest.status)
      ) {
        res.status(400).json({
          success: false,
          message: "Cannot cancel export request in current status",
        });
        return;
      }

      const cancelledRequest =
        await this.exportRequestService.cancelExportRequest(id);

      res.status(200).json({
        success: true,
        message: "Export request cancelled successfully",
        data: cancelledRequest,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Upload documents for export request
   */
  public uploadDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;
      const files = req.files as Express.Multer.File[];
      const { documentTypes } = req.body; // Array of document types corresponding to files

      if (!files || files.length === 0) {
        res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
        return;
      }

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message:
            "Access denied: You can only upload documents to your own export requests",
        });
        return;
      }

      // Upload documents to IPFS and create document records
      const uploadedDocuments = await this.documentService.uploadDocuments(
        id,
        files,
        documentTypes ? JSON.parse(documentTypes) : [],
      );

      res.status(200).json({
        success: true,
        message: "Documents uploaded successfully",
        data: uploadedDocuments,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get documents for export request
   */
  public getDocuments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      const documents = await this.documentService.getDocumentsByRequestId(id);

      res.status(200).json({
        success: true,
        message: "Documents retrieved successfully",
        data: documents,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Delete document
   */
  public deleteDocument = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id, documentId } = req.params;
      if (!id || !documentId) {
        res.status(400).json({
          success: false,
          message: "Export request ID and document ID are required",
        });
        return;
      }
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      await this.documentService.deleteDocument(documentId);

      res.status(200).json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Download document
   */
  public downloadDocument = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id, documentId } = req.params;
      if (!id || !documentId) {
        res.status(400).json({
          success: false,
          message: "Export request ID and document ID are required",
        });
        return;
      }
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      const fileStream =
        await this.documentService.downloadDocument(documentId);

      // Set appropriate headers and pipe the file
      res.setHeader("Content-Type", "application/octet-stream");
      fileStream.pipe(res);
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get export request status and processing history
   */
  public getExportRequestStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      const statusHistory =
        await this.exportRequestService.getStatusHistory(id);
      const consortiumStatus =
        await this.exportRequestService.getConsortiumStatus(id);

      res.status(200).json({
        success: true,
        message: "Status retrieved successfully",
        data: {
          currentStatus: existingRequest.status,
          consortiumStatus: existingRequest.consortiumStatus,
          statusHistory,
          consortiumDetails: consortiumStatus,
        },
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get document requirements
   */
  public getDocumentRequirements = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { coffeeType, destinationCountry } = req.params;

      // For now, return default requirements
      // In production, this would query a requirements database
      const requirements = {
        ...DEFAULT_DOCUMENT_REQUIREMENTS,
        coffeeType,
        destinationCountry,
      };

      res.status(200).json({
        success: true,
        message: "Document requirements retrieved successfully",
        data: requirements,
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Validate export request
   */
  public validateExportRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        res
          .status(400)
          .json({ success: false, message: "Export request ID is required" });
        return;
      }
      const userId = req.user!.id;

      const existingRequest =
        await this.exportRequestService.getExportRequestById(id);

      if (!existingRequest) {
        res.status(404).json({
          success: false,
          message: "Export request not found",
        });
        return;
      }

      // Check ownership
      if (existingRequest.exporterId !== userId) {
        res.status(403).json({
          success: false,
          message: "Access denied",
        });
        return;
      }

      const validationErrors =
        await this.exportRequestService.validateExportRequest(existingRequest);
      const isValid = validationErrors.length === 0;

      res.status(200).json({
        success: true,
        message: "Validation completed",
        data: {
          isValid,
          errors: validationErrors,
          canSubmit:
            isValid && existingRequest.status === ExportRequestStatus.DRAFT,
        },
      });
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get available actions based on export request status
   */
  private getAvailableActions(status: ExportRequestStatus): string[] {
    const actions: string[] = [];

    switch (status) {
      case ExportRequestStatus.DRAFT:
        actions.push(
          "edit",
          "delete",
          "submit",
          "validate",
          "upload_documents",
        );
        break;
      case ExportRequestStatus.SUBMITTED:
        actions.push("cancel", "view_status");
        break;
      case ExportRequestStatus.UNDER_REVIEW:
        actions.push("cancel", "view_status");
        break;
      case ExportRequestStatus.DOCUMENTS_REQUESTED:
        actions.push("upload_documents", "view_status");
        break;
      case ExportRequestStatus.APPROVED:
        actions.push("view_status", "download_documents");
        break;
      case ExportRequestStatus.REJECTED:
        actions.push("view_status", "view_rejection_reason");
        break;
      case ExportRequestStatus.CANCELLED:
        actions.push("view_status");
        break;
    }

    return actions;
  }
}
