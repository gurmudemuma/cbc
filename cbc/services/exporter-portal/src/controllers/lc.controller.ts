/**
 * Letter of Credit (LC) Controller
 * Handles HTTP requests for LC operations
 */

import { Response } from 'express';
import { LCService, CreateLCRequest } from '../services/lc.service';
import { AuthenticatedRequest } from '../../../shared/middleware/auth.middleware';
import { ApiResponse, ApiErrorCode } from '../../../shared/types/api-response.types';
import { getPool } from '../../../shared/database/pool';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('LCController');

export class LCController {
  /**
   * Create new LC record
   * Only Bank/CBE users can create LCs (as they receive MT700 from issuing bank)
   */
  static async createLC(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Authorization: Only Bank/CBE can create LCs
      const userRole = req.user?.role?.toLowerCase();
      const userOrg = req.user?.organization?.toLowerCase();
      
      const isBank = userRole === 'bank' || userRole === 'banker' || 
                     userOrg === 'bank' || userOrg === 'commercial-bank' || 
                     userOrg === 'commercialbank' || userOrg === 'cbe';
      
      if (!isBank) {
        res.status(403).json(
          ApiResponse.error(
            'Access denied',
            ApiErrorCode.INSUFFICIENT_PERMISSIONS,
            'Only bank users can create LC records. LCs are issued by the buyer\'s bank and advised by CBE.'
          )
        );
        return;
      }

      const pool = getPool();
      const lcService = new LCService(pool);

      let contractId = req.body.contractId;
      
      // If contractId looks like an ECTA reference number (ECTA-YYYY-XXXXXX), look up the draft_id
      if (contractId && /^ECTA-\d{4}-\d{6}$/.test(contractId)) {
        logger.info('Looking up contract by ECTA reference number', { ectaRef: contractId });
        
        const lookupQuery = `
          SELECT draft_id 
          FROM contract_drafts 
          WHERE ecta_reference_number = $1
        `;
        
        const lookupResult = await pool.query(lookupQuery, [contractId]);
        
        if (lookupResult.rows.length === 0) {
          res.status(404).json(
            ApiResponse.error(
              'Contract not found',
              ApiErrorCode.RESOURCE_NOT_FOUND,
              `No contract found with ECTA reference number: ${contractId}`
            )
          );
          return;
        }
        
        contractId = lookupResult.rows[0].draft_id;
        logger.info('Found contract by ECTA reference', { ectaRef: req.body.contractId, draftId: contractId });
      }

      const lcData: CreateLCRequest = {
        contractId: contractId,
        exporterId: req.body.exporterId,
        lcNumber: req.body.lcNumber,
        lcType: req.body.lcType,
        issuingBankName: req.body.issuingBankName,
        issuingBankSwiftCode: req.body.issuingBankSwiftCode,
        issuingBankCountry: req.body.issuingBankCountry,
        beneficiaryName: req.body.beneficiaryName,
        beneficiaryAddress: req.body.beneficiaryAddress,
        applicantName: req.body.applicantName,
        applicantAddress: req.body.applicantAddress,
        applicantCountry: req.body.applicantCountry,
        lcAmount: parseFloat(req.body.lcAmount),
        lcCurrency: req.body.lcCurrency || 'USD',
        issueDate: new Date(req.body.issueDate),
        expiryDate: new Date(req.body.expiryDate),
        latestShipmentDate: req.body.latestShipmentDate ? new Date(req.body.latestShipmentDate) : undefined,
        paymentTerms: req.body.paymentTerms,
        incoterms: req.body.incoterms,
        portOfLoading: req.body.portOfLoading,
        portOfDischarge: req.body.portOfDischarge,
        goodsDescription: req.body.goodsDescription,
        requiredDocuments: req.body.requiredDocuments,
        mt700Message: req.body.mt700Message,
      };

      // Validate required fields
      if (!lcData.contractId || !lcData.exporterId || !lcData.lcNumber) {
        res.status(400).json(
          ApiResponse.error(
            'Missing required fields',
            ApiErrorCode.VALIDATION_ERROR,
            'contractId, exporterId, and lcNumber are required'
          )
        );
        return;
      }

      const lc = await lcService.createLC(lcData);

      logger.info('LC created successfully', { lcId: lc.lcId, contractId: lcData.contractId });

      res.status(201).json(
        ApiResponse.success(lc, 'LC created successfully')
      );
    } catch (error: any) {
      logger.error('Error creating LC', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to create LC',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Get LC by contract ID
   */
  static async getLCByContractId(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { contractId } = req.params;
      const pool = getPool();
      const lcService = new LCService(pool);

      const lc = await lcService.getLCByContractId(contractId);

      if (!lc) {
        res.status(404).json(
          ApiResponse.error(
            'LC not found',
            ApiErrorCode.RESOURCE_NOT_FOUND,
            `No LC found for contract ${contractId}`
          )
        );
        return;
      }

      // Authorization check: only allow exporter to view their own LC
      if (req.user?.exporterId && lc.exporterId !== req.user.exporterId) {
        res.status(403).json(
          ApiResponse.error(
            'Access denied',
            ApiErrorCode.INSUFFICIENT_PERMISSIONS,
            'You can only view your own LCs'
          )
        );
        return;
      }

      res.status(200).json(
        ApiResponse.success(lc, 'LC retrieved successfully')
      );
    } catch (error: any) {
      logger.error('Error getting LC by contract ID', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to retrieve LC',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Get LC by ID
   */
  static async getLCById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const pool = getPool();
      const lcService = new LCService(pool);

      const lc = await lcService.getLCById(lcId);

      if (!lc) {
        res.status(404).json(
          ApiResponse.error(
            'LC not found',
            ApiErrorCode.RESOURCE_NOT_FOUND,
            `No LC found with ID ${lcId}`
          )
        );
        return;
      }

      // Authorization check: only allow exporter to view their own LC
      if (req.user?.exporterId && lc.exporterId !== req.user.exporterId) {
        res.status(403).json(
          ApiResponse.error(
            'Access denied',
            ApiErrorCode.INSUFFICIENT_PERMISSIONS,
            'You can only view your own LCs'
          )
        );
        return;
      }

      res.status(200).json(
        ApiResponse.success(lc, 'LC retrieved successfully')
      );
    } catch (error: any) {
      logger.error('Error getting LC by ID', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to retrieve LC',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Exporter accepts LC terms
   */
  static async acceptLC(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const { notes } = req.body;
      const exporterId = req.user?.exporterId;

      if (!exporterId) {
        res.status(400).json(
          ApiResponse.error(
            'Exporter ID not found',
            ApiErrorCode.VALIDATION_ERROR,
            'User must be an exporter to accept LC'
          )
        );
        return;
      }

      const pool = getPool();
      const lcService = new LCService(pool);

      const lc = await lcService.acceptLC(lcId, exporterId, notes);

      logger.info('LC accepted by exporter', { lcId, exporterId });

      res.status(200).json(
        ApiResponse.success(lc, 'LC accepted successfully')
      );
    } catch (error: any) {
      logger.error('Error accepting LC', { error: error.message });
      
      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        res.status(404).json(
          ApiResponse.error(
            'LC not found or unauthorized',
            ApiErrorCode.RESOURCE_NOT_FOUND,
            error.message
          )
        );
        return;
      }

      res.status(500).json(
        ApiResponse.error(
          'Failed to accept LC',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Exporter rejects LC terms
   */
  static async rejectLC(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const { reason } = req.body;
      const exporterId = req.user?.exporterId;

      if (!exporterId) {
        res.status(400).json(
          ApiResponse.error(
            'Exporter ID not found',
            ApiErrorCode.VALIDATION_ERROR,
            'User must be an exporter to reject LC'
          )
        );
        return;
      }

      if (!reason) {
        res.status(400).json(
          ApiResponse.error(
            'Rejection reason required',
            ApiErrorCode.VALIDATION_ERROR,
            'Please provide a reason for rejecting the LC'
          )
        );
        return;
      }

      const pool = getPool();
      const lcService = new LCService(pool);

      const lc = await lcService.rejectLC(lcId, exporterId, reason);

      logger.info('LC rejected by exporter', { lcId, exporterId, reason });

      res.status(200).json(
        ApiResponse.success(lc, 'LC rejected successfully')
      );
    } catch (error: any) {
      logger.error('Error rejecting LC', { error: error.message });
      
      if (error.message.includes('not found') || error.message.includes('unauthorized')) {
        res.status(404).json(
          ApiResponse.error(
            'LC not found or unauthorized',
            ApiErrorCode.RESOURCE_NOT_FOUND,
            error.message
          )
        );
        return;
      }

      res.status(500).json(
        ApiResponse.error(
          'Failed to reject LC',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Request NBE forex approval
   */
  static async requestNBEApproval(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const pool = getPool();
      const lcService = new LCService(pool);

      await lcService.requestNBEApproval(lcId);

      logger.info('NBE approval requested', { lcId });

      res.status(200).json(
        ApiResponse.success(null, 'NBE approval requested successfully')
      );
    } catch (error: any) {
      logger.error('Error requesting NBE approval', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to request NBE approval',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Record NBE approval decision
   */
  static async recordNBEDecision(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const { approved, reference, approvedBy, rejectionReason } = req.body;

      // Check if user has NBE role
      if (req.user?.role !== 'nbe' && req.user?.organization !== 'NBE') {
        res.status(403).json(
          ApiResponse.error(
            'Access denied',
            ApiErrorCode.INSUFFICIENT_PERMISSIONS,
            'Only NBE users can record approval decisions'
          )
        );
        return;
      }

      if (typeof approved !== 'boolean') {
        res.status(400).json(
          ApiResponse.error(
            'Invalid approval status',
            ApiErrorCode.VALIDATION_ERROR,
            'approved field must be a boolean'
          )
        );
        return;
      }

      const pool = getPool();
      const lcService = new LCService(pool);

      await lcService.recordNBEApproval(lcId, approved, reference, approvedBy, rejectionReason);

      logger.info('NBE decision recorded', { lcId, approved });

      res.status(200).json(
        ApiResponse.success(null, `LC ${approved ? 'approved' : 'rejected'} by NBE`)
      );
    } catch (error: any) {
      logger.error('Error recording NBE decision', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to record NBE decision',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Present documents against LC
   */
  static async presentDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const { documents } = req.body;
      const exporterId = req.user?.exporterId;

      if (!exporterId) {
        res.status(400).json(
          ApiResponse.error(
            'Exporter ID not found',
            ApiErrorCode.VALIDATION_ERROR,
            'User must be an exporter to present documents'
          )
        );
        return;
      }

      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        res.status(400).json(
          ApiResponse.error(
            'Documents required',
            ApiErrorCode.VALIDATION_ERROR,
            'Please provide at least one document'
          )
        );
        return;
      }

      const pool = getPool();
      const lcService = new LCService(pool);

      const presentationId = await lcService.presentDocuments(lcId, exporterId, documents);

      logger.info('Documents presented against LC', { lcId, presentationId, documentCount: documents.length });

      res.status(200).json(
        ApiResponse.success(
          { presentationId, lcId, documentCount: documents.length },
          'Documents presented successfully'
        )
      );
    } catch (error: any) {
      logger.error('Error presenting documents', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to present documents',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Record LC payment
   */
  static async recordPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const { amount, reference, swiftMessage } = req.body;

      // Check if user has bank role
      if (req.user?.role !== 'bank' && req.user?.organization !== 'BANK') {
        res.status(403).json(
          ApiResponse.error(
            'Access denied',
            ApiErrorCode.INSUFFICIENT_PERMISSIONS,
            'Only bank users can record payments'
          )
        );
        return;
      }

      if (!amount || !reference) {
        res.status(400).json(
          ApiResponse.error(
            'Missing required fields',
            ApiErrorCode.VALIDATION_ERROR,
            'amount and reference are required'
          )
        );
        return;
      }

      const pool = getPool();
      const lcService = new LCService(pool);

      await lcService.recordPayment(lcId, parseFloat(amount), reference, swiftMessage);

      logger.info('LC payment recorded', { lcId, amount, reference });

      res.status(200).json(
        ApiResponse.success(null, 'Payment recorded successfully')
      );
    } catch (error: any) {
      logger.error('Error recording payment', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to record payment',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Get LC history
   */
  static async getLCHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { lcId } = req.params;
      const pool = getPool();
      const lcService = new LCService(pool);

      const history = await lcService.getLCHistory(lcId);

      res.status(200).json(
        ApiResponse.success(history, 'LC history retrieved successfully')
      );
    } catch (error: any) {
      logger.error('Error getting LC history', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to retrieve LC history',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Get LCs by exporter ID
   */
  static async getLCsByExporter(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { exporterId } = req.params;
      const { status } = req.query;

      // Authorization check: only allow exporter to view their own LCs
      if (req.user?.exporterId && exporterId !== req.user.exporterId) {
        res.status(403).json(
          ApiResponse.error(
            'Access denied',
            ApiErrorCode.INSUFFICIENT_PERMISSIONS,
            'You can only view your own LCs'
          )
        );
        return;
      }

      const pool = getPool();
      const lcService = new LCService(pool);

      const lcs = await lcService.getLCsByExporter(exporterId, status as string);

      res.status(200).json(
        ApiResponse.success(lcs, 'LCs retrieved successfully')
      );
    } catch (error: any) {
      logger.error('Error getting LCs by exporter', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to retrieve LCs',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }

  /**
   * Get all LCs for authenticated user
   * - Exporters: see their own LCs
   * - Bank/CBE: see all LCs
   */
  static async getMyLCs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const exporterId = req.user?.exporterId;
      const userRole = req.user?.role?.toLowerCase();
      const { status } = req.query;

      const pool = getPool();
      const lcService = new LCService(pool);

      // Bank/CBE users can see all LCs
      const isBank = userRole === 'bank' || userRole === 'banker' || 
                     userRole === 'cbe' || userRole === 'nbe';

      if (isBank) {
        // Get all LCs for bank users
        const query = `
          SELECT 
            lc_id, contract_id, exporter_id, lc_number, lc_type,
            issuing_bank_name, beneficiary_name, applicant_name,
            lc_amount, lc_currency, issue_date, expiry_date,
            status, nbe_approval_status, exporter_response,
            created_at, updated_at
          FROM letter_of_credit
          ${status ? 'WHERE status = $1' : ''}
          ORDER BY created_at DESC
        `;

        const result = status 
          ? await pool.query(query, [status])
          : await pool.query(query);

        res.status(200).json(
          ApiResponse.success(result.rows, 'LCs retrieved successfully')
        );
        return;
      }

      // Exporter users see only their own LCs
      if (!exporterId) {
        res.status(400).json(
          ApiResponse.error(
            'Exporter ID not found',
            ApiErrorCode.VALIDATION_ERROR,
            'User must be an exporter to view LCs'
          )
        );
        return;
      }

      const lcs = await lcService.getLCsByExporter(exporterId, status as string);

      res.status(200).json(
        ApiResponse.success(lcs, 'LCs retrieved successfully')
      );
    } catch (error: any) {
      logger.error('Error getting my LCs', { error: error.message });
      res.status(500).json(
        ApiResponse.error(
          'Failed to retrieve LCs',
          ApiErrorCode.INTERNAL_SERVER_ERROR,
          error.message
        )
      );
    }
  }
}
