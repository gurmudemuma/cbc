/**
 * IPFS Document Service for Pre-Registration System
 * Handles license and certificate document uploads with metadata
 */

import { getIPFSService } from '../ipfs.service';
import pool from '../database/db.config';

export interface DocumentUploadResult {
  ipfsHash: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
}

export interface PreRegistrationDocument {
  documentId: string;
  entityId: string; // exporterId, laboratoryId, tasterId, etc.
  entityType: 'exporter_profile' | 'laboratory' | 'taster' | 'competence_certificate' | 'export_license';
  documentType: 'capital_proof' | 'business_registration' | 'laboratory_certificate' | 'taster_qualification' | 'competence_certificate' | 'export_license' | 'inspection_report' | 'contract_document';
  fileName: string;
  fileSize: number;
  mimeType: string;
  ipfsHash: string;
  uploadedBy: string;
  uploadedAt: string;
  isActive: boolean;
}

export class IPFSDocumentService {
  private ipfsService = getIPFSService();

  /**
   * Upload capital proof document for exporter profile
   */
  async uploadCapitalProofDocument(
    exporterId: string,
    fileBuffer: Buffer,
    fileName: string
  ): Promise<DocumentUploadResult> {
    const result = await this.ipfsService.uploadBuffer(fileBuffer, fileName);
    
    // Pin the document for persistence
    await this.ipfsService.pinFile(result.hash);

    // Update exporter profile with document hash
    await this.updateExporterCapitalProof(exporterId, result.hash);

    return {
      ipfsHash: result.hash,
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      url: result.url,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Upload business registration document
   */
  async uploadBusinessRegistrationDocument(
    exporterId: string,
    fileBuffer: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<DocumentUploadResult> {
    const result = await this.ipfsService.uploadBuffer(fileBuffer, fileName);
    await this.ipfsService.pinFile(result.hash);

    // Store document metadata
    await this.storeDocumentMetadata({
      entityId: exporterId,
      entityType: 'exporter_profile',
      documentType: 'business_registration',
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      ipfsHash: result.hash,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      isActive: true
    });

    return {
      ipfsHash: result.hash,
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      url: result.url,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Upload laboratory certification document
   */
  async uploadLaboratoryCertificate(
    laboratoryId: string,
    fileBuffer: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<DocumentUploadResult> {
    const result = await this.ipfsService.uploadBuffer(fileBuffer, fileName);
    await this.ipfsService.pinFile(result.hash);

    await this.storeDocumentMetadata({
      entityId: laboratoryId,
      entityType: 'laboratory',
      documentType: 'laboratory_certificate',
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      ipfsHash: result.hash,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      isActive: true
    });

    return {
      ipfsHash: result.hash,
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      url: result.url,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Upload taster qualification document
   */
  async uploadTasterQualificationDocument(
    tasterId: string,
    fileBuffer: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<DocumentUploadResult> {
    const result = await this.ipfsService.uploadBuffer(fileBuffer, fileName);
    await this.ipfsService.pinFile(result.hash);

    await this.storeDocumentMetadata({
      entityId: tasterId,
      entityType: 'taster',
      documentType: 'taster_qualification',
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      ipfsHash: result.hash,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      isActive: true
    });

    return {
      ipfsHash: result.hash,
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      url: result.url,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Upload competence certificate document
   */
  async uploadCompetenceCertificateDocument(
    certificateId: string,
    fileBuffer: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<DocumentUploadResult> {
    const result = await this.ipfsService.uploadBuffer(fileBuffer, fileName);
    await this.ipfsService.pinFile(result.hash);

    await this.storeDocumentMetadata({
      entityId: certificateId,
      entityType: 'competence_certificate',
      documentType: 'competence_certificate',
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      ipfsHash: result.hash,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      isActive: true
    });

    return {
      ipfsHash: result.hash,
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      url: result.url,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Upload export license document
   */
  async uploadExportLicenseDocument(
    licenseId: string,
    fileBuffer: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<DocumentUploadResult> {
    const result = await this.ipfsService.uploadBuffer(fileBuffer, fileName);
    await this.ipfsService.pinFile(result.hash);

    await this.storeDocumentMetadata({
      entityId: licenseId,
      entityType: 'export_license',
      documentType: 'export_license',
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      ipfsHash: result.hash,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      isActive: true
    });

    return {
      ipfsHash: result.hash,
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      url: result.url,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Upload inspection report document
   */
  async uploadInspectionReportDocument(
    entityId: string,
    entityType: 'laboratory' | 'competence_certificate',
    fileBuffer: Buffer,
    fileName: string,
    uploadedBy: string
  ): Promise<DocumentUploadResult> {
    const result = await this.ipfsService.uploadBuffer(fileBuffer, fileName);
    await this.ipfsService.pinFile(result.hash);

    await this.storeDocumentMetadata({
      entityId,
      entityType,
      documentType: 'inspection_report',
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      ipfsHash: result.hash,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      isActive: true
    });

    return {
      ipfsHash: result.hash,
      fileName,
      fileSize: result.size,
      mimeType: this.getMimeType(fileName),
      url: result.url,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * Get document by IPFS hash
   */
  async getDocument(ipfsHash: string): Promise<Buffer> {
    return await this.ipfsService.getFile(ipfsHash);
  }

  /**
   * Get document URL
   */
  getDocumentUrl(ipfsHash: string): string {
    return this.ipfsService.getFileUrl(ipfsHash);
  }

  /**
   * Get documents for an entity
   */
  async getEntityDocuments(
    entityId: string,
    entityType: PreRegistrationDocument['entityType']
  ): Promise<PreRegistrationDocument[]> {
    const query = `
      SELECT * FROM preregistration_documents 
      WHERE entity_id = $1 AND entity_type = $2 AND is_active = TRUE
      ORDER BY uploaded_at DESC
    `;
    const result = await pool.query(query, [entityId, entityType]);
    
    return result.rows.map(row => ({
      documentId: row.document_id,
      entityId: row.entity_id,
      entityType: row.entity_type,
      documentType: row.document_type,
      fileName: row.file_name,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      ipfsHash: row.ipfs_hash,
      uploadedBy: row.uploaded_by,
      uploadedAt: row.uploaded_at,
      isActive: row.is_active
    }));
  }

  /**
   * Deactivate document (soft delete)
   */
  async deactivateDocument(documentId: string, deactivatedBy: string, reason?: string): Promise<void> {
    const query = `
      UPDATE preregistration_documents 
      SET is_active = FALSE, deactivated_by = $1, deactivated_at = CURRENT_TIMESTAMP, deactivation_reason = $2
      WHERE document_id = $3
    `;
    await pool.query(query, [deactivatedBy, reason, documentId]);
  }

  /**
   * Validate document format and size
   */
  validateDocument(fileName: string, fileSize: number): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`
      };
    }
    
    if (fileSize > maxSize) {
      return {
        valid: false,
        error: `File size too large. Maximum size: ${maxSize / 1024 / 1024}MB`
      };
    }
    
    return { valid: true };
  }

  /**
   * Private helper methods
   */
  private async updateExporterCapitalProof(exporterId: string, ipfsHash: string): Promise<void> {
    const query = `
      UPDATE exporter_profiles 
      SET capital_proof_document = $1, updated_at = CURRENT_TIMESTAMP
      WHERE exporter_id = $2
    `;
    await pool.query(query, [ipfsHash, exporterId]);
  }

  private async storeDocumentMetadata(document: Omit<PreRegistrationDocument, 'documentId'>): Promise<string> {
    const query = `
      INSERT INTO preregistration_documents (
        entity_id, entity_type, document_type, file_name, file_size, 
        mime_type, ipfs_hash, ipfs_url, uploaded_by, uploaded_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING document_id
    `;
    
    const ipfsUrl = this.getDocumentUrl(document.ipfsHash);
    
    const result = await pool.query(query, [
      document.entityId,
      document.entityType,
      document.documentType,
      document.fileName,
      document.fileSize,
      document.mimeType,
      document.ipfsHash,
      ipfsUrl,
      document.uploadedBy,
      document.uploadedAt,
      document.isActive
    ]);
    
    return result.rows[0].document_id;
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }
}

// Singleton instance
let ipfsDocumentService: IPFSDocumentService | null = null;

export const getIPFSDocumentService = (): IPFSDocumentService => {
  if (!ipfsDocumentService) {
    ipfsDocumentService = new IPFSDocumentService();
  }
  return ipfsDocumentService;
};
