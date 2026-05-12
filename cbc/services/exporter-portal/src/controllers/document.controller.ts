import { Request, Response } from 'express';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('DocumentController');

export class DocumentController {
  /**
   * Get all required documents with their status
   * GET /api/exporter/documents/required
   */
  async getRequiredDocuments(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;

      if (!exporterId) {
        logger.warn('No exporter ID found for required documents', { userId: user?.id });
        // Return empty list instead of 401
        res.json({
          success: true,
          data: {
            all: [],
            byCategory: {
              PRE_QUALIFICATION: [],
              SALES_CONTRACT: [],
              EXPORT_EXECUTION: [],
            },
            summary: {
              total: 0,
              issued: 0,
              pending: 0,
              underReview: 0,
              rejected: 0,
              notRequested: 0,
            },
            message: 'No exporter profile found. Please complete your profile registration first.',
          },
        });
        return;
      }

      const pool = getPool();

      // Define all required document types
      const requiredDocumentTypes = [
        // Pre-qualification documents
        { type: 'EXPORT_LICENSE', category: 'PRE_QUALIFICATION', issuer: 'ECTA' },
        { type: 'COMPETENCE_CERTIFICATE', category: 'PRE_QUALIFICATION', issuer: 'ECTA' },
        { type: 'LABORATORY_CERTIFICATION', category: 'PRE_QUALIFICATION', issuer: 'ECTA' },
        
        // Sales contract documents
        { type: 'SALES_CONTRACT', category: 'SALES_CONTRACT', issuer: 'BUYER' },
        
        // Export execution documents
        { type: 'PHYTOSANITARY_CERTIFICATE', category: 'EXPORT_EXECUTION', issuer: 'MOA' },
        { type: 'HEALTH_CERTIFICATE', category: 'EXPORT_EXECUTION', issuer: 'MOH' },
        { type: 'FUMIGATION_CERTIFICATE', category: 'EXPORT_EXECUTION', issuer: 'MOA' },
        { type: 'QUALITY_CERTIFICATE', category: 'EXPORT_EXECUTION', issuer: 'ECX' },
        { type: 'CERTIFICATE_OF_ORIGIN', category: 'EXPORT_EXECUTION', issuer: 'ECTA' },
        { type: 'BANK_GUARANTEE', category: 'EXPORT_EXECUTION', issuer: 'BANK' },
        { type: 'SHIPPING_BOOKING', category: 'EXPORT_EXECUTION', issuer: 'SHIPPING' },
        { type: 'CUSTOMS_CLEARANCE', category: 'EXPORT_EXECUTION', issuer: 'ERCA' },
      ];

      // Get document requests status
      const requestsQuery = `
        SELECT 
          document_type,
          request_status as status,
          COUNT(*) as count
        FROM document_requests
        WHERE exporter_id = $1
        GROUP BY document_type, request_status
      `;
      const requestsResult = await pool.query(requestsQuery, [exporterId]);

      // Get issued documents
      const issuedQuery = `
        SELECT 
          document_type,
          status,
          COUNT(*) as count
        FROM issued_documents
        WHERE exporter_id = $1
        GROUP BY document_type, status
      `;
      const issuedResult = await pool.query(issuedQuery, [exporterId]);

      // Build document status map
      const documentStatusMap: Record<string, any> = {};
      
      requiredDocumentTypes.forEach(doc => {
        documentStatusMap[doc.type] = {
          type: doc.type,
          category: doc.category,
          issuer: doc.issuer,
          status: 'NOT_REQUESTED',
          requestId: null,
          documentId: null,
        };
      });

      // Update with request status
      requestsResult.rows.forEach(row => {
        if (documentStatusMap[row.document_type]) {
          documentStatusMap[row.document_type].status = row.status;
          documentStatusMap[row.document_type].requestCount = parseInt(row.count);
        }
      });

      // Update with issued document status
      issuedResult.rows.forEach(row => {
        if (documentStatusMap[row.document_type]) {
          if (row.status === 'ACTIVE') {
            documentStatusMap[row.document_type].status = 'ISSUED';
          }
          documentStatusMap[row.document_type].issuedCount = parseInt(row.count);
        }
      });

      // Convert to array and categorize
      const allDocuments = Object.values(documentStatusMap);
      const byCategory = {
        PRE_QUALIFICATION: allDocuments.filter(d => d.category === 'PRE_QUALIFICATION'),
        SALES_CONTRACT: allDocuments.filter(d => d.category === 'SALES_CONTRACT'),
        EXPORT_EXECUTION: allDocuments.filter(d => d.category === 'EXPORT_EXECUTION'),
      };

      // Calculate summary
      const summary = {
        total: allDocuments.length,
        issued: allDocuments.filter(d => d.status === 'ISSUED').length,
        pending: allDocuments.filter(d => d.status === 'PENDING').length,
        underReview: allDocuments.filter(d => d.status === 'UNDER_REVIEW').length,
        rejected: allDocuments.filter(d => d.status === 'REJECTED').length,
        notRequested: allDocuments.filter(d => d.status === 'NOT_REQUESTED').length,
      };

      res.json({
        success: true,
        data: {
          all: allDocuments,
          byCategory,
          summary,
        },
      });
    } catch (error) {
      logger.error('Error fetching required documents', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch required documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get document collection status
   * GET /api/exporter/documents/collection-status
   */
  async getCollectionStatus(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      
      logger.info('Collection status request - full user object', { 
        user: JSON.stringify(user),
        userId: user?.id,
        username: user?.username,
        exporterId: user?.exporterId,
        keys: Object.keys(user || {})
      });

      // Try to get exporterId from multiple possible sources
      const exporterId = user?.exporterId;

      if (!exporterId) {
        logger.warn('No exporter ID found for collection status', { 
          userId: user?.id,
          username: user?.username,
          hasExporterId: !!user?.exporterId 
        });
        // Return empty collection status with correct structure
        res.json({
          success: true,
          data: {
            completionPercentage: 0,
            totalRequired: 12,
            issued: 0,
            pending: 0,
            underReview: 0,
            rejected: 0,
            recentActivities: [],
            documents: [], // Empty documents array
            pendingDocuments: 0,
            issuedDocuments: 0,
            requiredDocuments: 12,
            canSubmitToNetwork: false,
            isComplete: false,
            message: 'No exporter profile found. Please complete your profile registration first.',
          },
        });
        return;
      }

      const pool = getPool();

      // Get overall collection status
      const statusQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE request_status = 'ISSUED') as issued_count,
          COUNT(*) FILTER (WHERE request_status = 'PENDING') as pending_count,
          COUNT(*) FILTER (WHERE request_status = 'UNDER_REVIEW') as under_review_count,
          COUNT(*) FILTER (WHERE request_status = 'REJECTED') as rejected_count
        FROM document_requests
        WHERE exporter_id = $1
      `;
      const statusResult = await pool.query(statusQuery, [exporterId]);
      const stats = statusResult.rows[0];

      // Get recent document activities
      const recentQuery = `
        SELECT 
          dr.request_id as id,
          dr.document_type,
          dr.request_status as status,
          dr.requested_at,
          dr.updated_at,
          nm.member_name as issuer_name
        FROM document_requests dr
        LEFT JOIN network_members nm ON dr.network_member_code = nm.member_code
        WHERE dr.exporter_id = $1
        ORDER BY dr.updated_at DESC
        LIMIT 10
      `;
      const recentResult = await pool.query(recentQuery, [exporterId]);

      // Calculate completion percentage
      const totalRequired = 12; // Total number of required documents
      const issuedCount = parseInt(stats.issued_count) || 0;
      const completionPercentage = Math.round((issuedCount / totalRequired) * 100);

      res.json({
        success: true,
        data: {
          completionPercentage,
          totalRequired,
          issued: parseInt(stats.issued_count) || 0,
          pending: parseInt(stats.pending_count) || 0,
          underReview: parseInt(stats.under_review_count) || 0,
          rejected: parseInt(stats.rejected_count) || 0,
          recentActivities: recentResult.rows,
          documents: [], // Add empty documents array for consistency
          issuedDocuments: parseInt(stats.issued_count) || 0,
          pendingDocuments: parseInt(stats.pending_count) || 0,
          requiredDocuments: totalRequired,
          canSubmitToNetwork: issuedCount >= totalRequired,
          isComplete: issuedCount >= totalRequired,
        },
      });
    } catch (error) {
      logger.error('Error fetching document collection status', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document collection status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Request a document from a network member
   * POST /api/exporter/documents/request
   */
  async requestDocument(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;
      const { networkMemberCode, documentType, requestNotes } = req.body;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter ID not found in token',
        });
        return;
      }

      if (!networkMemberCode || !documentType) {
        res.status(400).json({
          success: false,
          message: 'Network member code and document type are required',
        });
        return;
      }

      const pool = getPool();

      const insertQuery = `
        INSERT INTO document_requests (
          exporter_id, network_member_code, document_type, 
          request_notes, request_status, requested_at
        )
        VALUES ($1, $2, $3, $4, 'PENDING', NOW())
        RETURNING *
      `;

      const result = await pool.query(insertQuery, [
        exporterId,
        networkMemberCode,
        documentType,
        requestNotes || null,
      ]);

      res.status(201).json({
        success: true,
        message: 'Document request submitted successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error requesting document', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to request document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Request all export documents at once (bulk request)
   * POST /api/exporter/documents/request-all
   */
  async requestAllDocuments(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;
      const { contractId, shipmentDetails } = req.body;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter ID not found in token',
        });
        return;
      }

      const pool = getPool();

      // Define all documents to request
      const documentsToRequest = [
        { networkMemberCode: 'MOA', documentType: 'PHYTOSANITARY_CERTIFICATE' },
        { networkMemberCode: 'MOH', documentType: 'HEALTH_CERTIFICATE' },
        { networkMemberCode: 'MOA', documentType: 'FUMIGATION_CERTIFICATE' },
        { networkMemberCode: 'ECX', documentType: 'QUALITY_CERTIFICATE' },
        { networkMemberCode: 'ECTA', documentType: 'CERTIFICATE_OF_ORIGIN' },
        { networkMemberCode: 'BANK', documentType: 'BANK_GUARANTEE' },
        { networkMemberCode: 'SHIPPING', documentType: 'SHIPPING_BOOKING' },
        { networkMemberCode: 'ERCA', documentType: 'CUSTOMS_CLEARANCE' },
      ];

      const insertedRequests = [];

      for (const doc of documentsToRequest) {
        const insertQuery = `
          INSERT INTO document_requests (
            exporter_id, network_member_code, document_type, 
            request_notes, request_status, requested_at
          )
          VALUES ($1, $2, $3, $4, 'PENDING', NOW())
          RETURNING *
        `;

        const requestNotes = `Bulk request for contract ${contractId || 'N/A'}. ${shipmentDetails ? JSON.stringify(shipmentDetails) : ''}`;
        
        const result = await pool.query(insertQuery, [
          exporterId,
          doc.networkMemberCode,
          doc.documentType,
          requestNotes,
        ]);

        insertedRequests.push(result.rows[0]);
      }

      res.status(201).json({
        success: true,
        message: `Successfully requested ${insertedRequests.length} documents`,
        data: insertedRequests,
      });
    } catch (error) {
      logger.error('Error requesting all documents', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to request all documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get pending document requests for network members to issue
   * GET /api/document-issuance/document-requests/pending
   * This endpoint is for network members (ECTA, MOA, MOH, etc.) to see pending requests
   */
  async getPendingRequestsForIssuance(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const networkMemberCode = user?.organizationCode || user?.org; // Network member code (ECTA, MOA, etc.)

      logger.info('Getting pending requests for issuance', { 
        networkMemberCode, 
        userId: user?.id,
        org: user?.org 
      });

      const pool = getPool();

      // Get pending document requests for this network member
      const query = `
        SELECT 
          dr.request_id,
          dr.exporter_id,
          dr.document_type,
          dr.request_status as status,
          dr.request_notes as request_notes,
          dr.requested_at,
          dr.priority,
          dr.contract_reference as ecta_reference_number,
          dr.required_data,
          dr.issuer_agency,
          ep.business_name as exporter_name,
          ep.tin as exporter_tin,
          ep.email as exporter_email,
          ep.contact_person as exporter_contact_person,
          ep.phone as exporter_phone,
          ep.status as profile_status
        FROM document_requests dr
        LEFT JOIN exporter_profiles ep ON dr.exporter_id = ep.exporter_id
        WHERE dr.request_status = 'PENDING'
        ORDER BY 
          CASE dr.priority
            WHEN 'URGENT' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            WHEN 'LOW' THEN 4
            ELSE 5
          END,
          dr.requested_at ASC
      `;

      const result = await pool.query(query);

      logger.info('Database query executed', { rowCount: result.rows.length });
      
      // Log first row for debugging
      if (result.rows.length > 0) {
        logger.info('First row sample', { 
          request_id: result.rows[0].request_id,
          exporter_name: result.rows[0].exporter_name,
          document_type: result.rows[0].document_type,
          status: result.rows[0].status
        });
      }

      // Format the response with exporter qualification
      const requests = result.rows.map(row => ({
        request_id: row.request_id,
        exporter_id: row.exporter_id,
        exporter_name: row.exporter_name || 'Unknown Exporter',
        exporter_tin: row.exporter_tin || 'N/A',
        exporter_email: row.exporter_email || 'N/A',
        exporter_contact_person: row.exporter_contact_person,
        exporter_phone: row.exporter_phone,
        document_type: row.document_type,
        priority: row.priority || 'MEDIUM',
        request_status: row.status,
        request_notes: row.request_notes,
        requested_at: row.requested_at,
        ecta_reference_number: row.ecta_reference_number,
        required_data: row.required_data,
        issuer_agency: row.issuer_agency,
        exporter_qualification: {
          profile_status: row.profile_status || 'PENDING_APPROVAL',
          license_status: 'UNKNOWN',
          competence_status: 'UNKNOWN',
          laboratory_status: 'UNKNOWN',
          taster_status: 'UNKNOWN',
        },
      }));

      logger.info('Returning pending requests', { count: requests.length });

      res.json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (error) {
      logger.error('Error fetching pending requests for issuance', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch pending document requests',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Issue a document (for network members)
   * POST /api/document-issuance/documents/issue
   */
  async issueDocument(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const networkMemberCode = user?.organizationCode || user?.org || 'ECTA';
      const issuedBy = user?.username || user?.email || 'system';
      const {
        requestId,
        exporterId,
        documentType,
        documentNumber,
        documentMetadata,
        expiryDate,
      } = req.body;

      if (!requestId || !exporterId || !documentType || !documentNumber) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: requestId, exporterId, documentType, documentNumber',
        });
        return;
      }

      const pool = getPool();

      // Generate document hash
      const crypto = require('crypto');
      const documentContent = JSON.stringify({
        documentNumber,
        documentType,
        exporterId,
        issuedAt: new Date().toISOString(),
        metadata: documentMetadata,
      });
      const documentHash = crypto.createHash('sha256').update(documentContent).digest('hex');

      // Update the document request status
      const updateRequestQuery = `
        UPDATE document_requests
        SET status = 'COMPLETED',
            completed_at = NOW()
        WHERE request_id = $1 AND exporter_id = $2
        RETURNING *
      `;

      await pool.query(updateRequestQuery, [requestId, exporterId]);

      // Insert the issued document
      const insertDocumentQuery = `
        INSERT INTO issued_documents (
          request_id,
          exporter_id,
          document_type,
          document_number,
          document_hash,
          issuer_member_code,
          issued_by,
          status,
          issued_at,
          expiry_date,
          document_metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE', NOW(), $8, $9)
        RETURNING *
      `;

      const documentResult = await pool.query(insertDocumentQuery, [
        requestId,
        exporterId,
        documentType,
        documentNumber,
        documentHash,
        networkMemberCode,
        issuedBy,
        expiryDate || null,
        JSON.stringify(documentMetadata || {}),
      ]);

      logger.info('Document issued successfully', {
        documentNumber,
        documentType,
        exporterId,
        requestId,
        documentHash,
      });

      res.status(201).json({
        success: true,
        message: 'Document issued successfully',
        data: documentResult.rows[0],
      });
    } catch (error) {
      logger.error('Error issuing document', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to issue document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Reject a document request (for network members)
   * POST /api/document-issuance/document-requests/:requestId/reject
   */
  async rejectDocumentRequest(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const { requestId } = req.params;
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required',
        });
        return;
      }

      const pool = getPool();

      const updateQuery = `
        UPDATE document_requests
        SET status = 'REJECTED',
            rejection_reason = $1,
            completed_at = NOW()
        WHERE request_id = $2
        RETURNING *
      `;

      const result = await pool.query(updateQuery, [rejectionReason, requestId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Document request not found',
        });
        return;
      }

      logger.info('Document request rejected', { requestId, rejectionReason });

      res.json({
        success: true,
        message: 'Document request rejected successfully',
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error rejecting document request', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to reject document request',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all document requests for the logged-in exporter
   * GET /api/exporter/documents/requests
   */
  async getDocumentRequests(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;
      const { status } = req.query;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter ID not found in token',
        });
        return;
      }

      const pool = getPool();

      let query = `
        SELECT 
          dr.*,
          nm.member_name as issuer_name
        FROM document_requests dr
        LEFT JOIN network_members nm ON dr.network_member_code = nm.member_code
        WHERE dr.exporter_id = $1
      `;

      const params: any[] = [exporterId];

      if (status) {
        query += ` AND dr.request_status = $2`;
        params.push(status);
      }

      query += ` ORDER BY dr.requested_at DESC`;

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      logger.error('Error fetching document requests', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch document requests',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get registered contracts for document requests
   * GET /api/exporter/documents/registered-contracts
   */
  async getRegisteredContracts(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter ID not found in token',
        });
        return;
      }

      const pool = getPool();

      // Get registered sales contracts for this exporter
      const query = `
        SELECT 
          contract_id,
          reference_number,
          buyer_name,
          coffee_type,
          quantity,
          unit_price,
          total_value,
          destination_country,
          status,
          created_at,
          updated_at
        FROM sales_contracts
        WHERE exporter_id = $1
          AND status IN ('REGISTERED', 'APPROVED', 'ACTIVE')
        ORDER BY created_at DESC
      `;

      const result = await pool.query(query, [exporterId]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      logger.error('Error fetching registered contracts', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch registered contracts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get issued documents for the logged-in exporter
   * GET /api/exporter/documents
   */
  async getIssuedDocuments(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter ID not found in token',
        });
        return;
      }

      const pool = getPool();

      const query = `
        SELECT 
          id.*,
          nm.name as issuer_name
        FROM issued_documents id
        LEFT JOIN network_members nm ON id.issuer_member_code = nm.code
        WHERE id.exporter_id = $1
        ORDER BY id.issued_at DESC
      `;

      const result = await pool.query(query, [exporterId]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      logger.error('Error fetching issued documents', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch issued documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get documents for a specific submission
   * GET /api/exporter/documents/by-submission/:submissionId
   */
  async getDocumentsBySubmission(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;
      const { submissionId } = req.params;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter ID not found in token',
        });
        return;
      }

      const pool = getPool();

      const query = `
        SELECT 
          id.document_id,
          id.document_type,
          id.document_number,
          id.status,
          id.issued_at,
          id.expiry_date,
          nm.member_name as issuer_name
        FROM issued_documents id
        LEFT JOIN network_members nm ON id.issuer_member_code = nm.member_code
        WHERE id.exporter_id = $1
        ORDER BY id.issued_at DESC
      `;

      const result = await pool.query(query, [exporterId]);

      res.json({
        success: true,
        data: result.rows,
        count: result.rows.length,
      });
    } catch (error) {
      logger.error('Error fetching documents by submission', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents by submission',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Download an issued document
   * GET /api/exporter/documents/:documentId/download
   */
  async downloadDocument(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      const exporterId = user?.exporterId || user?.id;
      const { documentId } = req.params;

      if (!exporterId) {
        res.status(401).json({
          success: false,
          message: 'Exporter ID not found in token',
        });
        return;
      }

      const pool = getPool();

      const query = `
        SELECT document_url, document_number, document_type
        FROM issued_documents
        WHERE document_id = $1 AND exporter_id = $2
      `;

      const result = await pool.query(query, [documentId, exporterId]);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Document not found',
        });
        return;
      }

      const document = result.rows[0];

      if (!document.document_url) {
        res.status(404).json({
          success: false,
          message: 'Document file not available',
        });
        return;
      }

      // For now, return the document URL
      // In production, you would fetch from S3 or storage service
      res.json({
        success: true,
        data: {
          documentUrl: document.document_url,
          documentNumber: document.document_number,
          documentType: document.document_type,
        },
      });
    } catch (error) {
      logger.error('Error downloading document', { error });
      res.status(500).json({
        success: false,
        message: 'Failed to download document',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
