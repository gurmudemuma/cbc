import {
  ExportRequest,
  ExportRequestStatus,
  UpdateExportRequestDTO,
  ExportRequestListResponse,
  ConsortiumStatus,
  DEFAULT_DOCUMENT_REQUIREMENTS,
} from "../models/export-request.model";

interface ExportRequestQueryOptions {
  page: number;
  limit: number;
  status?: ExportRequestStatus;
  search?: string;
}

interface StatusHistoryEntry {
  status: ExportRequestStatus;
  timestamp: Date;
  notes?: string;
  processedBy?: string;
}

interface ConsortiumStatusDetails {
  currentStep: string;
  completedSteps: string[];
  pendingSteps: string[];
  processingOrganization?: string;
  estimatedCompletion?: Date;
  blockchainTransactions: Array<{
    txId: string;
    timestamp: Date;
    operation: string;
    organization: string;
  }>;
}

export class ExportRequestService {
  // In-memory storage for development
  // In production, this would use a database (SQLite, PostgreSQL, etc.)
  private exportRequests: Map<string, ExportRequest> = new Map();
  private statusHistory: Map<string, StatusHistoryEntry[]> = new Map();

  /**
   * Get export requests for a specific user
   */
  async getExportRequestsByUser(
    userId: string,
    options: ExportRequestQueryOptions,
  ): Promise<ExportRequestListResponse> {
    try {
      let requests = Array.from(this.exportRequests.values()).filter(
        (request) => request.exporterId === userId,
      );

      // Apply status filter
      if (options.status) {
        requests = requests.filter(
          (request) => request.status === options.status,
        );
      }

      // Apply search filter
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        requests = requests.filter(
          (request) =>
            request.requestNumber.toLowerCase().includes(searchLower) ||
            request.exporterDetails.companyName
              .toLowerCase()
              .includes(searchLower) ||
            request.coffeeDetails.coffeeType
              .toLowerCase()
              .includes(searchLower),
        );
      }

      // Sort by most recent first
      requests.sort(
        (a, b) =>
          new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
      );

      // Apply pagination
      const startIndex = (options.page - 1) * options.limit;
      const endIndex = startIndex + options.limit;
      const paginatedRequests = requests.slice(startIndex, endIndex);

      return {
        requests: paginatedRequests,
        total: requests.length,
        page: options.page,
        limit: options.limit,
      };
    } catch (error) {
      console.error("Error getting export requests by user:", error);
      throw new Error("Failed to retrieve export requests");
    }
  }

  /**
   * Get export request by ID
   */
  async getExportRequestById(id: string): Promise<ExportRequest | null> {
    try {
      return this.exportRequests.get(id) || null;
    } catch (error) {
      console.error("Error getting export request by ID:", error);
      throw new Error("Failed to retrieve export request");
    }
  }

  /**
   * Create new export request
   */
  async createExportRequest(
    exportRequest: ExportRequest,
  ): Promise<ExportRequest> {
    try {
      this.exportRequests.set(exportRequest.id, exportRequest);

      // Initialize status history
      this.statusHistory.set(exportRequest.id, [
        {
          status: ExportRequestStatus.DRAFT,
          timestamp: new Date(),
          notes: "Export request created",
        },
      ]);

      return exportRequest;
    } catch (error) {
      console.error("Error creating export request:", error);
      throw new Error("Failed to create export request");
    }
  }

  /**
   * Update export request
   */
  async updateExportRequest(
    id: string,
    updateData: UpdateExportRequestDTO,
  ): Promise<ExportRequest> {
    try {
      const existingRequest = this.exportRequests.get(id);

      if (!existingRequest) {
        throw new Error("Export request not found");
      }

      const updatedRequest: ExportRequest = {
        ...existingRequest,
        exporterDetails: {
          ...existingRequest.exporterDetails,
          ...updateData.exporterDetails,
        },
        coffeeDetails: {
          ...existingRequest.coffeeDetails,
          ...updateData.coffeeDetails,
        },
        tradeDetails: {
          ...existingRequest.tradeDetails,
          ...updateData.tradeDetails,
        },
        ...(updateData.notes && { notes: updateData.notes }),
        lastUpdated: new Date(),
      };

      this.exportRequests.set(id, updatedRequest);

      // Add to status history if notes provided
      if (updateData.notes) {
        const history = this.statusHistory.get(id) || [];
        history.push({
          status: existingRequest.status,
          timestamp: new Date(),
          notes: updateData.notes,
        });
        this.statusHistory.set(id, history);
      }

      return updatedRequest;
    } catch (error) {
      console.error("Error updating export request:", error);
      throw new Error("Failed to update export request");
    }
  }

  /**
   * Delete export request
   */
  async deleteExportRequest(id: string): Promise<void> {
    try {
      const deleted = this.exportRequests.delete(id);
      this.statusHistory.delete(id);

      if (!deleted) {
        throw new Error("Export request not found");
      }
    } catch (error) {
      console.error("Error deleting export request:", error);
      throw new Error("Failed to delete export request");
    }
  }

  /**
   * Submit export request to consortium
   */
  async submitToConsortium(
    id: string,
    finalNotes?: string,
  ): Promise<ExportRequest> {
    try {
      const exportRequest = this.exportRequests.get(id);

      if (!exportRequest) {
        throw new Error("Export request not found");
      }

      // Update status to submitted - starts with National Bank (Step 1)
      const updatedRequest: ExportRequest = {
        ...exportRequest,
        status: ExportRequestStatus.SUBMITTED,
        consortiumStatus: ConsortiumStatus.LICENSE_VALIDATION_PENDING,
        lastUpdated: new Date(),
        notes: finalNotes,
      };

      this.exportRequests.set(id, updatedRequest);

      // Add to status history
      const history = this.statusHistory.get(id) || [];
      history.push({
        status: ExportRequestStatus.SUBMITTED,
        timestamp: new Date(),
        notes:
          finalNotes || "Export request submitted to consortium for processing",
      });
      this.statusHistory.set(id, history);

      // TODO: In production, this would make an API call to the Exporter Bank consortium node
      // to actually submit the request to the blockchain
      console.log(`Export request ${id} submitted to consortium`);

      return updatedRequest;
    } catch (error) {
      console.error("Error submitting to consortium:", error);
      throw new Error("Failed to submit export request to consortium");
    }
  }

  /**
   * Cancel export request
   */
  async cancelExportRequest(id: string): Promise<ExportRequest> {
    try {
      const exportRequest = this.exportRequests.get(id);

      if (!exportRequest) {
        throw new Error("Export request not found");
      }

      const cancelledRequest: ExportRequest = {
        ...exportRequest,
        status: ExportRequestStatus.CANCELLED,
        lastUpdated: new Date(),
      };

      this.exportRequests.set(id, cancelledRequest);

      // Add to status history
      const history = this.statusHistory.get(id) || [];
      history.push({
        status: ExportRequestStatus.CANCELLED,
        timestamp: new Date(),
        notes: "Export request cancelled by user",
      });
      this.statusHistory.set(id, history);

      return cancelledRequest;
    } catch (error) {
      console.error("Error cancelling export request:", error);
      throw new Error("Failed to cancel export request");
    }
  }

  /**
   * Validate export request
   */
  async validateExportRequest(exportRequest: ExportRequest): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Validate exporter details
      if (!exportRequest.exporterDetails.companyName?.trim()) {
        errors.push("Company name is required");
      }
      if (!exportRequest.exporterDetails.registrationNumber?.trim()) {
        errors.push("Registration number is required");
      }
      if (!exportRequest.exporterDetails.contactPerson.email?.trim()) {
        errors.push("Contact email is required");
      }

      // Validate coffee details
      if (!exportRequest.coffeeDetails.coffeeType) {
        errors.push("Coffee type is required");
      }
      if (!exportRequest.coffeeDetails.origin.farm?.trim()) {
        errors.push("Farm origin is required");
      }
      if (
        !exportRequest.coffeeDetails.quantity.totalWeight ||
        exportRequest.coffeeDetails.quantity.totalWeight <= 0
      ) {
        errors.push("Valid total weight is required");
      }

      // Validate trade details
      if (!exportRequest.tradeDetails.buyer.name?.trim()) {
        errors.push("Buyer name is required");
      }
      if (!exportRequest.tradeDetails.contractDetails.contractNumber?.trim()) {
        errors.push("Contract number is required");
      }
      if (
        !exportRequest.tradeDetails.contractDetails.totalValue ||
        exportRequest.tradeDetails.contractDetails.totalValue <= 0
      ) {
        errors.push("Valid contract value is required");
      }

      // Validate required documents
      const requiredDocs = DEFAULT_DOCUMENT_REQUIREMENTS.requiredDocuments;
      const uploadedDocTypes = exportRequest.documents.map((doc) => doc.type);

      for (const reqDocType of requiredDocs) {
        if (!uploadedDocTypes.includes(reqDocType)) {
          errors.push(
            `Required document missing: ${reqDocType.replace("_", " ").toUpperCase()}`,
          );
        }
      }

      return errors;
    } catch (error) {
      console.error("Error validating export request:", error);
      return ["Validation error occurred"];
    }
  }

  /**
   * Get status history for export request
   */
  async getStatusHistory(id: string): Promise<StatusHistoryEntry[]> {
    try {
      return this.statusHistory.get(id) || [];
    } catch (error) {
      console.error("Error getting status history:", error);
      throw new Error("Failed to retrieve status history");
    }
  }

  /**
   * Get consortium status details
   */
  async getConsortiumStatus(
    id: string,
  ): Promise<ConsortiumStatusDetails | null> {
    try {
      const exportRequest = this.exportRequests.get(id);

      if (!exportRequest || !exportRequest.consortiumStatus) {
        return null;
      }

      // Mock consortium status details
      // In production, this would query the consortium blockchain for actual status
      const mockDetails: ConsortiumStatusDetails = {
        currentStep: this.getConsortiumStepName(exportRequest.consortiumStatus),
        completedSteps: this.getCompletedSteps(exportRequest.consortiumStatus),
        pendingSteps: this.getPendingSteps(exportRequest.consortiumStatus),
        processingOrganization: this.getProcessingOrganization(
          exportRequest.consortiumStatus,
        ),
        estimatedCompletion: this.getEstimatedCompletion(
          exportRequest.consortiumStatus,
        ),
        blockchainTransactions: [
          {
            txId: exportRequest.blockchainTxId || "tx_mock_001",
            timestamp: exportRequest.submittedAt,
            operation: "SUBMIT_EXPORT_REQUEST",
            organization: "ExporterPortal",
          },
        ],
      };

      return mockDetails;
    } catch (error) {
      console.error("Error getting consortium status:", error);
      throw new Error("Failed to retrieve consortium status");
    }
  }

  /**
   * Helper methods for consortium status mapping
   */
  private getConsortiumStepName(status: ConsortiumStatus): string {
    switch (status) {
      case ConsortiumStatus.LICENSE_VALIDATION_PENDING:
        return "Export License Validation (National Bank)";
      case ConsortiumStatus.BANKING_REVIEW_PENDING:
        return "Banking & Financial Review (Exporter Bank)";
      case ConsortiumStatus.QUALITY_CERTIFICATION_PENDING:
        return "Quality Certification (NCAT)";
      case ConsortiumStatus.LOGISTICS_ARRANGEMENT_PENDING:
        return "Logistics Arrangement (Shipping Line)";
      case ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING:
        return "Customs Clearance (Custom Authorities)";
      case ConsortiumStatus.COMPLETED:
        return "Export Approved & Completed";
      case ConsortiumStatus.FAILED:
        return "Processing Failed";
      default:
        return "Unknown Status";
    }
  }

  private getCompletedSteps(status: ConsortiumStatus): string[] {
    const steps: string[] = ["Document Upload", "Portal Submission"];

    // Add completed steps based on current status (sequential)
    if (
      [
        ConsortiumStatus.BANKING_REVIEW_PENDING,
        ConsortiumStatus.QUALITY_CERTIFICATION_PENDING,
        ConsortiumStatus.LOGISTICS_ARRANGEMENT_PENDING,
        ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING,
        ConsortiumStatus.COMPLETED,
      ].includes(status)
    ) {
      steps.push("Export License Validation");
    }

    if (
      [
        ConsortiumStatus.QUALITY_CERTIFICATION_PENDING,
        ConsortiumStatus.LOGISTICS_ARRANGEMENT_PENDING,
        ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING,
        ConsortiumStatus.COMPLETED,
      ].includes(status)
    ) {
      steps.push("Banking & Financial Review");
    }

    if (
      [
        ConsortiumStatus.LOGISTICS_ARRANGEMENT_PENDING,
        ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING,
        ConsortiumStatus.COMPLETED,
      ].includes(status)
    ) {
      steps.push("Quality Certification");
    }

    if (
      [
        ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING,
        ConsortiumStatus.COMPLETED,
      ].includes(status)
    ) {
      steps.push("Logistics Arrangement");
    }

    if (status === ConsortiumStatus.COMPLETED) {
      steps.push("Customs Clearance");
    }

    return steps;
  }

  private getPendingSteps(status: ConsortiumStatus): string[] {
    switch (status) {
      case ConsortiumStatus.LICENSE_VALIDATION_PENDING:
        return [
          "Export License Validation",
          "Banking & Financial Review",
          "Quality Certification",
          "Logistics Arrangement",
          "Customs Clearance",
        ];
      case ConsortiumStatus.BANKING_REVIEW_PENDING:
        return [
          "Banking & Financial Review",
          "Quality Certification",
          "Logistics Arrangement",
          "Customs Clearance",
        ];
      case ConsortiumStatus.QUALITY_CERTIFICATION_PENDING:
        return [
          "Quality Certification",
          "Logistics Arrangement",
          "Customs Clearance",
        ];
      case ConsortiumStatus.LOGISTICS_ARRANGEMENT_PENDING:
        return ["Logistics Arrangement", "Customs Clearance"];
      case ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING:
        return ["Customs Clearance"];
      case ConsortiumStatus.COMPLETED:
      case ConsortiumStatus.FAILED:
        return [];
      default:
        return ["Unknown Processing Steps"];
    }
  }

  private getProcessingOrganization(
    status: ConsortiumStatus,
  ): string | undefined {
    switch (status) {
      case ConsortiumStatus.LICENSE_VALIDATION_PENDING:
        return "NationalBank"; // Step 1: National Bank first
      case ConsortiumStatus.BANKING_REVIEW_PENDING:
        return "ExporterBank"; // Step 2: Exporter Bank second
      case ConsortiumStatus.QUALITY_CERTIFICATION_PENDING:
        return "NCAT"; // Step 3: NCAT third
      case ConsortiumStatus.LOGISTICS_ARRANGEMENT_PENDING:
        return "ShippingLine"; // Step 4: Shipping Line fourth
      case ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING:
        return "CustomAuthorities"; // Step 5: Custom Authorities fifth
      default:
        return undefined;
    }
  }

  private getEstimatedCompletion(status: ConsortiumStatus): Date | undefined {
    const now = new Date();

    switch (status) {
      case ConsortiumStatus.LICENSE_VALIDATION_PENDING:
        return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 business days - National Bank
      case ConsortiumStatus.BANKING_REVIEW_PENDING:
        return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 business days - Exporter Bank
      case ConsortiumStatus.QUALITY_CERTIFICATION_PENDING:
        return new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000); // 5 business days - NCAT
      case ConsortiumStatus.LOGISTICS_ARRANGEMENT_PENDING:
        return new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 business days - Shipping Line
      case ConsortiumStatus.CUSTOMS_CLEARANCE_PENDING:
        return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 business days - Custom Authorities
      default:
        return undefined;
    }
  }
}
