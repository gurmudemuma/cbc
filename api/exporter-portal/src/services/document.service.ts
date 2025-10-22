import {
  ExportDocument,
  DocumentType,
  DocumentStatus,
} from "../models/export-request.model";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { Readable } from "stream";

export class DocumentService {
  // In-memory storage for development
  // In production, this would use a database
  private documents: Map<string, ExportDocument> = new Map();

  /**
   * Upload documents to IPFS and create document records
   */
  async uploadDocuments(
    exportRequestId: string,
    files: Express.Multer.File[],
    documentTypes: DocumentType[],
  ): Promise<ExportDocument[]> {
    try {
      const uploadedDocuments: ExportDocument[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;
        const docType = documentTypes[i] || DocumentType.OTHER;

        // Create document record
        const document: ExportDocument = {
          id: uuidv4(),
          type: docType,
          name: this.generateDocumentName(docType, file.originalname),
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date(),
          status: DocumentStatus.UPLOADED,
          required: this.isRequiredDocument(docType),
          url: `/api/exports/${exportRequestId}/documents/${uuidv4()}/download`,
        };

        // In production, upload to IPFS here
        document.ipfsHash = await this.uploadToIPFS(file);

        // Store document record
        this.documents.set(document.id, document);
        uploadedDocuments.push(document);
      }

      return uploadedDocuments;
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw new Error("Failed to upload documents");
    }
  }

  /**
   * Get documents by export request ID
   */
  async getDocumentsByRequestId(
    _exportRequestId: string,
  ): Promise<ExportDocument[]> {
    try {
      // In production, this would query the database with exportRequestId
      // For now, return all documents (mock implementation)
      return Array.from(this.documents.values());
    } catch (error) {
      console.error("Error getting documents:", error);
      throw new Error("Failed to retrieve documents");
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      const document = this.documents.get(documentId);

      if (!document) {
        throw new Error("Document not found");
      }

      // Delete from IPFS if hash exists
      if (document.ipfsHash) {
        await this.deleteFromIPFS(document.ipfsHash);
      }

      // Delete local file if exists
      if (document.url) {
        await this.deleteLocalFile(document.url);
      }

      // Remove from storage
      this.documents.delete(documentId);
    } catch (error) {
      console.error("Error deleting document:", error);
      throw new Error("Failed to delete document");
    }
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string): Promise<Readable> {
    try {
      const document = this.documents.get(documentId);

      if (!document) {
        throw new Error("Document not found");
      }

      // In production, download from IPFS using the hash
      if (document.ipfsHash) {
        return await this.downloadFromIPFS(document.ipfsHash);
      }

      // Fallback to local file (for development)
      return await this.downloadLocalFile(document.url || "");
    } catch (error) {
      console.error("Error downloading document:", error);
      throw new Error("Failed to download document");
    }
  }

  /**
   * Validate document type and content
   */
  async validateDocument(document: ExportDocument): Promise<string[]> {
    const errors: string[] = [];

    try {
      // Validate file size
      const maxSize =
        parseInt(process.env.MAX_FILE_SIZE_MB || "20") * 1024 * 1024;
      if (document.size > maxSize) {
        errors.push(
          `File size exceeds maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || "20"}MB`,
        );
      }

      // Validate file type
      const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(",") || [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(document.mimeType)) {
        errors.push(`File type ${document.mimeType} is not allowed`);
      }

      // Validate document content based on type (basic checks)
      switch (document.type) {
        case DocumentType.SALES_CONTRACT:
          if (!document.name.toLowerCase().includes("contract")) {
            errors.push(
              'Sales contract document should contain "contract" in filename',
            );
          }
          break;
        case DocumentType.COMMERCIAL_INVOICE:
          if (!document.name.toLowerCase().includes("invoice")) {
            errors.push(
              'Commercial invoice document should contain "invoice" in filename',
            );
          }
          break;
      }

      return errors;
    } catch (error) {
      console.error("Error validating document:", error);
      return ["Document validation error occurred"];
    }
  }

  /**
   * Upload file to IPFS
   * In production, this would use ipfs-http-client
   */
  private async uploadToIPFS(file: Express.Multer.File): Promise<string> {
    try {
      // Mock IPFS upload - in production, use actual IPFS client
      const mockHash = `Qm${Math.random().toString(36).substring(2, 46)}`;

      // TODO: Implement actual IPFS upload
      // const ipfs = create({ host: process.env.IPFS_HOST, port: process.env.IPFS_PORT, protocol: process.env.IPFS_PROTOCOL });
      // const result = await ipfs.add(file.buffer);
      // return result.cid.toString();

      console.log(`Mock IPFS upload: ${file.originalname} -> ${mockHash}`);
      return mockHash;
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      throw new Error("Failed to upload file to IPFS");
    }
  }

  /**
   * Download file from IPFS
   */
  private async downloadFromIPFS(hash: string): Promise<Readable> {
    try {
      // Mock IPFS download - in production, use actual IPFS client
      console.log(`Mock IPFS download: ${hash}`);

      // Return a mock readable stream
      const mockData = Buffer.from(`Mock file content for IPFS hash: ${hash}`);
      return Readable.from(mockData);

      // TODO: Implement actual IPFS download
      // const ipfs = create({ host: process.env.IPFS_HOST, port: process.env.IPFS_PORT, protocol: process.env.IPFS_PROTOCOL });
      // const chunks = [];
      // for await (const chunk of ipfs.cat(hash)) {
      //   chunks.push(chunk);
      // }
      // return Readable.from(Buffer.concat(chunks));
    } catch (error) {
      console.error("Error downloading from IPFS:", error);
      throw new Error("Failed to download file from IPFS");
    }
  }

  /**
   * Delete file from IPFS
   */
  private async deleteFromIPFS(hash: string): Promise<void> {
    try {
      // Mock IPFS deletion - in production, files in IPFS are immutable
      // but you might want to unpin them from your node
      console.log(`Mock IPFS deletion: ${hash}`);

      // TODO: Implement actual IPFS unpin if needed
      // const ipfs = create({ host: process.env.IPFS_HOST, port: process.env.IPFS_PORT, protocol: process.env.IPFS_PROTOCOL });
      // await ipfs.pin.rm(hash);
    } catch (error) {
      console.error("Error deleting from IPFS:", error);
      // Don't throw error for IPFS deletion failures as files are immutable anyway
    }
  }

  /**
   * Download local file (fallback)
   */
  private async downloadLocalFile(_url: string): Promise<Readable> {
    try {
      // Extract file path from URL (mock implementation)
      const mockFilePath = path.join(
        process.env.UPLOAD_PATH || "./uploads",
        "mock-file.pdf",
      );

      // Create a mock file if it doesn't exist
      if (!fs.existsSync(mockFilePath)) {
        fs.writeFileSync(mockFilePath, "Mock file content for local download");
      }

      return fs.createReadStream(mockFilePath);
    } catch (error) {
      console.error("Error downloading local file:", error);
      throw new Error("Failed to download file");
    }
  }

  /**
   * Delete local file
   */
  private async deleteLocalFile(url: string): Promise<void> {
    try {
      // Mock local file deletion
      console.log(`Mock local file deletion: ${url}`);
    } catch (error) {
      console.error("Error deleting local file:", error);
      // Don't throw error for local file deletion failures
    }
  }

  /**
   * Generate document name based on type
   */
  private generateDocumentName(
    docType: DocumentType,
    originalName: string,
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);

    return `${docType}-${timestamp}-${baseName}${extension}`;
  }

  /**
   * Check if document type is required
   */
  private isRequiredDocument(docType: DocumentType): boolean {
    const requiredTypes = [
      DocumentType.SALES_CONTRACT,
      DocumentType.COMMERCIAL_INVOICE,
      DocumentType.PACKING_LIST,
      DocumentType.CERTIFICATE_OF_ORIGIN,
      DocumentType.EXPORT_LICENSE,
    ];

    return requiredTypes.includes(docType);
  }
}
