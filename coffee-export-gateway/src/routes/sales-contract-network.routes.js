const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const fabricService = require('../services'); // Use service loader for consistent Fabric implementation
const postgresService = require('../services/postgres');

// Test route to verify router is loaded
router.get('/test-sales-contract-routes', (req, res) => {
  res.json({ message: 'Sales contract routes are loaded!' });
});

// ============================================================================
// ECTA PENDING REGISTRATIONS DASHBOARD
// ============================================================================

/**
 * GET /api/ecta/contracts/pending-registration
 * Get all contracts pending ECTA registration with full details
 */
router.get('/ecta/contracts/pending-registration', 
  authenticateToken, 
  requireRole('ecta'), 
  async (req, res) => {
    try {
      const query = `
        SELECT 
          ecs.submission_id,
          ecs.draft_id,
          ecs.ecta_reference_number,
          ecs.submission_status,
          ecs.submitted_at,
          ecs.contract_data,
          cd.contract_number,
          cd.coffee_type,
          cd.origin_region,
          cd.quantity,
          cd.unit_price,
          cd.total_value,
          cd.currency,
          cd.quality_grade,
          cd.payment_method,
          cd.payment_terms,
          cd.incoterms,
          cd.delivery_date,
          cd.port_of_loading,
          cd.port_of_discharge,
          cd.governing_law,
          cd.arbitration_location,
          cd.arbitration_rules,
          cd.special_conditions,
          cd.certifications_required,
          ep.business_name as exporter_name,
          ep.tin as exporter_tin,
          ep.contact_person as exporter_contact,
          ep.email as exporter_email,
          ep.phone as exporter_phone,
          br.company_name as buyer_name,
          br.country as buyer_country,
          br.address as buyer_address,
          br.email as buyer_email,
          br.phone as buyer_phone,
          br.tax_id as buyer_tax_id
        FROM ecta_contract_submissions ecs
        JOIN contract_drafts cd ON ecs.draft_id = cd.draft_id
        JOIN exporter_profiles ep ON ecs.exporter_id = ep.exporter_id
        JOIN buyer_registry br ON ecs.buyer_id = br.buyer_id
        WHERE ecs.submission_status = 'PENDING_REGISTRATION'
        ORDER BY ecs.submitted_at DESC
      `;
      
      const result = await postgresService.query(query);
      
      res.json({
        success: true,
        count: result.rows.length,
        pendingRegistrations: result.rows.map(row => ({
          submissionId: row.submission_id,
          draftId: row.draft_id,
          ectaReferenceNumber: row.ecta_reference_number,
          contractNumber: row.contract_number,
          submittedAt: row.submitted_at,
          exporter: {
            name: row.exporter_name,
            tin: row.exporter_tin,
            contact: row.exporter_contact,
            email: row.exporter_email,
            phone: row.exporter_phone
          },
          buyer: {
            name: row.buyer_name,
            country: row.buyer_country,
            address: row.buyer_address,
            email: row.buyer_email,
            phone: row.buyer_phone,
            taxId: row.buyer_tax_id
          },
          contract: {
            coffeeType: row.coffee_type,
            originRegion: row.origin_region,
            quantity: row.quantity,
            unitPrice: row.unit_price,
            totalValue: row.total_value,
            currency: row.currency,
            qualityGrade: row.quality_grade,
            paymentMethod: row.payment_method,
            paymentTerms: row.payment_terms,
            incoterms: row.incoterms,
            deliveryDate: row.delivery_date,
            portOfLoading: row.port_of_loading,
            portOfDischarge: row.port_of_discharge,
            governingLaw: row.governing_law,
            arbitrationLocation: row.arbitration_location,
            arbitrationRules: row.arbitration_rules,
            specialConditions: row.special_conditions,
            certificationsRequired: row.certifications_required
          }
        }))
      });
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
      res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ecta/contracts/registered
 * Get all registered contracts with full details
 */
router.get('/ecta/contracts/registered', 
  authenticateToken, 
  requireRole('ecta'), 
  async (req, res) => {
    try {
      const query = `
        SELECT 
          ecs.submission_id,
          ecs.draft_id,
          ecs.ecta_reference_number,
          ecs.lc_number,
          ecs.submission_status,
          ecs.submitted_at,
          ecs.registered_at,
          ecs.registered_by,
          ecs.registration_notes,
          cd.contract_number,
          cd.coffee_type,
          cd.origin_region,
          cd.quantity,
          cd.unit_price,
          cd.total_value,
          cd.currency,
          cd.quality_grade,
          cd.payment_method,
          cd.payment_terms,
          cd.incoterms,
          cd.delivery_date,
          cd.port_of_loading,
          cd.port_of_discharge,
          ep.business_name as exporter_name,
          ep.tin as exporter_tin,
          br.company_name as buyer_name,
          br.country as buyer_country
        FROM ecta_contract_submissions ecs
        JOIN contract_drafts cd ON ecs.draft_id = cd.draft_id
        JOIN exporter_profiles ep ON ecs.exporter_id = ep.exporter_id
        JOIN buyer_registry br ON ecs.buyer_id = br.buyer_id
        WHERE ecs.submission_status = 'REGISTERED'
        ORDER BY ecs.registered_at DESC
      `;
      
      const result = await postgresService.query(query);
      
      res.json({
        success: true,
        count: result.rows.length,
        registeredContracts: result.rows.map(row => ({
          submissionId: row.submission_id,
          draftId: row.draft_id,
          ectaReferenceNumber: row.ecta_reference_number,
          lcNumber: row.lc_number,
          contractNumber: row.contract_number,
          submittedAt: row.submitted_at,
          registeredAt: row.registered_at,
          registeredBy: row.registered_by,
          registrationNotes: row.registration_notes,
          exporter: {
            name: row.exporter_name,
            tin: row.exporter_tin
          },
          buyer: {
            name: row.buyer_name,
            country: row.buyer_country
          },
          contract: {
            coffeeType: row.coffee_type,
            originRegion: row.origin_region,
            quantity: row.quantity,
            unitPrice: row.unit_price,
            totalValue: row.total_value,
            currency: row.currency,
            qualityGrade: row.quality_grade,
            paymentMethod: row.payment_method,
            paymentTerms: row.payment_terms,
            incoterms: row.incoterms,
            deliveryDate: row.delivery_date,
            portOfLoading: row.port_of_loading,
            portOfDischarge: row.port_of_discharge
          }
        }))
      });
    } catch (error) {
      console.error('Error fetching registered contracts:', error);
      res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/sales-contracts/:contractId
 * Get sales contract details by ID (draft_id or lc_number)
 */
router.get('/sales-contracts/:contractId', authenticateToken, async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Try to find by draft_id or lc_number
    const query = `
      SELECT 
        cd.*,
        ep.business_name as exporter_name,
        br.company_name as buyer_name,
        br.country as buyer_country
      FROM contract_drafts cd
      LEFT JOIN exporter_profiles ep ON cd.exporter_id = ep.exporter_id
      LEFT JOIN buyer_registry br ON cd.buyer_id = br.buyer_id
      WHERE cd.draft_id = $1 OR cd.lc_number = $1
    `;
    
    const result = await postgresService.query(query, [contractId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Sales contract not found'
      });
    }
    
    const contract = result.rows[0];
    
    // Map database fields to expected format
    // LC Number is the primary identifier for registered contracts
    const contractData = {
      contract_id: contract.draft_id,
      lc_number: contract.lc_number,
      reference_number: contract.lc_number, // Alias for backward compatibility
      exporter_id: contract.exporter_id,
      exporter_name: contract.exporter_name,
      buyer_id: contract.buyer_id,
      buyer_name: contract.buyer_name,
      buyer_country: contract.buyer_country,
      coffee_type: contract.coffee_type,
      quantity: contract.quantity,
      unit_price: contract.unit_price,
      total_amount: contract.total_value,
      amount: contract.total_value,
      currency: contract.currency,
      payment_method: contract.payment_method,
      payment_terms: contract.payment_terms,
      issuing_bank: contract.issuing_bank,
      lc_issuing_bank: contract.issuing_bank,
      advising_bank: contract.advising_bank,
      lc_advising_bank: contract.advising_bank,
      lc_expiry_date: contract.lc_expiry_date,
      status: contract.status,
      created_at: contract.created_at,
      updated_at: contract.updated_at
    };
    
    res.json({
      success: true,
      contract: contractData,
      data: contractData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Sales contract fetch error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ECTA REGISTRATION
// ============================================================================

/**
 * POST /api/ecta/contracts/:draftId/register
 * ECTA registers sales contract and generates reference number
 */
router.post('/ecta/contracts/:draftId/register', 
  authenticateToken, 
  requireRole('ecta'), 
  async (req, res) => {
    try {
      const { draftId } = req.params;
      const { notes } = req.body;
      
      // Get contract from database - JOIN with users to get username for blockchain
      const contractResult = await postgresService.query(
        `SELECT cd.*, 
                ep.business_name, ep.registration_number, ep.exporter_id, ep.user_id,
                u.username as exporter_username,
                br.company_name as buyer_name, br.country as buyer_country
         FROM contract_drafts cd
         JOIN exporter_profiles ep ON cd.exporter_id = ep.exporter_id
         JOIN users u ON ep.user_id = u.username
         JOIN buyer_registry br ON cd.buyer_id = br.buyer_id
         WHERE cd.draft_id = $1 AND cd.status IN ('ACCEPTED', 'FINALIZED')`,
        [draftId]
      );
      
      if (contractResult.rows.length === 0) {
        return res.status(404).json({ error: 'Contract not found or not in a registrable state (must be ACCEPTED or FINALIZED)' });
      }
      
      const contract = contractResult.rows[0];
      
      // Prepare contract for blockchain
      // IMPORTANT: Use USER_{username} as exporterId because blockchain stores users with key USER_{username}
      const contractData = {
        draftId: contract.draft_id,
        exporterId: `USER_${contract.exporter_username}`,
        buyerId: contract.buyer_id,
        buyerName: contract.buyer_name,
        buyerCountry: contract.buyer_country,
        coffeeType: contract.coffee_type,
        originRegion: contract.origin_region,
        quantity: contract.quantity,
        unitPrice: contract.unit_price,
        totalValue: contract.total_value,
        currency: contract.currency,
        qualityGrade: contract.quality_grade,
        paymentMethod: contract.payment_method,
        paymentTerms: contract.payment_terms,
        incoterms: contract.incoterms,
        portOfLoading: contract.port_of_loading,
        portOfDischarge: contract.port_of_discharge,
        deliveryDate: contract.delivery_date,
        governingLaw: contract.governing_law || 'CISG',
        arbitrationRules: contract.arbitration_rules || 'ICC',
        arbitrationLocation: contract.arbitration_location,
        ectaOfficer: req.user.id
      };
      
      // Register on blockchain (3-peer endorsement handled by fabricService)
      await fabricService.submitTransaction(
        'system',
        'ecta',
        'RegisterSalesContractWithReference',
        JSON.stringify(contractData)
      );
      
      // Query the registered contract using draft ID to get the LC number
      // The chaincode creates an index: draft~reference -> [draftId, lcNumber]
      const queryResult = await fabricService.evaluateTransaction(
        'system',
        'ecta',
        'GetReferenceByDraftId',
        draftId
      );
      
      const response = typeof queryResult === 'string' ? JSON.parse(queryResult) : queryResult;
      const lcNumber = response.referenceNumber || response.lcNumber;
      
      // Update database with LC Number
      await postgresService.query(
        `UPDATE contract_drafts 
         SET status = 'FINALIZED',
             lc_number = $1,
             registered_at = CURRENT_TIMESTAMP,
             registered_by = $2,
             registration_notes = $3
         WHERE draft_id = $4`,
        [lcNumber, req.user.id, notes, draftId]
      );
      
      // Update ECTA submission status
      await postgresService.query(
        `UPDATE ecta_contract_submissions
         SET submission_status = 'REGISTERED',
             registered_at = CURRENT_TIMESTAMP,
             registered_by = $1,
             lc_number = $2,
             registration_notes = $3
         WHERE draft_id = $4 AND submission_status = 'PENDING_REGISTRATION'`,
        [req.user.id, lcNumber, notes, draftId]
      );
      
      res.json({ 
        success: true, 
        lcNumber,
        referenceNumber: lcNumber, // Alias for backward compatibility
        message: 'Sales contract registered successfully with LC Number: ' + lcNumber
      });
      
    } catch (error) {
      console.error('Error registering contract:', error);
      res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// NETWORK SUBMISSION
// ============================================================================

/**
 * POST /api/exporter/submit-to-network
 * Exporter submits export to network for approvals
 */
router.post('/exporter/submit-to-network',
  authenticateToken,
  requireRole('exporter'),
  async (req, res) => {
    try {
      const { referenceNumber, documents } = req.body;
      const username = req.user.id; // JWT contains username as id
      
      // Get exporter_id and user UUID from exporter_profiles
      const exporterResult = await postgresService.query(
        `SELECT ep.exporter_id, u.id as user_id
         FROM exporter_profiles ep
         JOIN users u ON ep.user_id = u.username
         WHERE u.username = $1`,
        [username]
      );
      
      if (exporterResult.rows.length === 0) {
        return res.status(404).json({ error: 'Exporter profile not found' });
      }
      
      const exporterId = exporterResult.rows[0].exporter_id;
      const userId = exporterResult.rows[0].user_id;
      
      // Verify contract exists and belongs to exporter
      const contractResult = await postgresService.query(
        `SELECT draft_id, status FROM contract_drafts 
         WHERE ecta_reference_number = $1 AND exporter_id = $2 
         AND status IN ('FINALIZED', 'REGISTERED')`,
        [referenceNumber, exporterId]
      );
      
      if (contractResult.rows.length === 0) {
        return res.status(404).json({ error: 'Contract not found or not registered' });
      }
      
      const draftId = contractResult.rows[0].draft_id;
      
      // Submit to blockchain
      const submissionData = {
        referenceNumber,
        exporterId,
        documents: documents || []
      };
      
      // Submit to blockchain (3-peer endorsement handled by fabricService)
      const blockchainResult = await fabricService.submitTransaction(
        'system',
        'ecta',
        'SubmitToNetwork',
        JSON.stringify(submissionData)
      );
      
      // Parse blockchain response
      const bcResponse = JSON.parse(blockchainResult);
      
      // Create Network Submission record
      const eswResult = await postgresService.query(
        `INSERT INTO network_submissions 
         (reference_number, contract_id, exporter_id, documents, submitted_by, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING submission_id`,
        [
          referenceNumber, 
          draftId, 
          exporterId, 
          JSON.stringify(documents), 
          exporterId,
          bcResponse.status || 'SUBMITTED_TO_NETWORK'
        ]
      );
      
      // Update contract with Network Submission ID and status
      await postgresService.query(
        `UPDATE contract_drafts 
         SET network_submission_id = $1, status = $2
         WHERE draft_id = $3`,
        [eswResult.rows[0].submission_id, bcResponse.status || 'SUBMITTED_TO_NETWORK', draftId]
      );
      
      res.json({
        success: true,
        submissionId: eswResult.rows[0].submission_id,
        status: bcResponse.status,
        autoApproved: bcResponse.autoApproved || false,
        approvalResults: bcResponse.approvalResults || null,
        message: bcResponse.autoApproved 
          ? 'Export automatically approved by smart contract - all validations passed!'
          : bcResponse.status === 'EXPORT_REJECTED'
          ? 'Export rejected by smart contract - validation failures detected'
          : 'Export submitted to network successfully'
      });
      
    } catch (error) {
      console.error('Error submitting to network:', error);
      res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// ORGANIZATION APPROVALS
// ============================================================================

/**
 * POST /api/approvals/:referenceNumber
 * Organization approves/rejects export
 * Organizations: BANK, NBE, CUSTOMS, SHIPPING
 */
router.post('/approvals/:referenceNumber',
  authenticateToken,
  async (req, res) => {
    try {
      const { referenceNumber } = req.params;
      const { status, notes, ...orgData } = req.body;
      
      // Determine organization from user role
      const orgMap = {
        'bank': 'BANK',
        'nbe': 'NBE',
        'customs': 'CUSTOMS',
        'shipping': 'SHIPPING'
      };
      
      const organization = orgMap[req.user.role];
      if (!organization) {
        return res.status(403).json({ error: 'Invalid organization role' });
      }
      
      // Prepare approval data
      const approvalData = {
        status: status || 'APPROVED',
        approvedBy: req.user.id,
        notes: notes || '',
        ...orgData
      };
      
      // Update blockchain (3-peer endorsement handled by fabricService)
      const result = await fabricService.submitTransaction(
        'system',
        'ecta',
        'UpdateOrganizationApproval',
        referenceNumber,
        organization,
        JSON.stringify(approvalData)
      );
      
      const response = JSON.parse(result);
      
      // Update database
      const orgColumn = organization.toLowerCase();
      
      // Check if this is a rejection
      const isRejection = status === 'REJECTED';
      
      if (isRejection) {
        // If rejected, mark the entire submission as rejected
        await postgresService.query(
          `UPDATE network_submissions 
           SET ${orgColumn}_status = $1,
               ${orgColumn}_approved_at = CURRENT_TIMESTAMP,
               ${orgColumn}_approved_by = $2,
               ${orgColumn}_notes = $3,
               status = 'EXPORT_REJECTED',
               updated_at = CURRENT_TIMESTAMP
           WHERE reference_number = $4`,
          [status, req.user.id, notes, referenceNumber]
        );
      } else {
        // If approved, check if all organizations have approved
        await postgresService.query(
          `UPDATE network_submissions 
           SET ${orgColumn}_status = $1,
               ${orgColumn}_approved_at = CURRENT_TIMESTAMP,
               ${orgColumn}_approved_by = $2,
               ${orgColumn}_notes = $3,
               status = CASE 
                 WHEN (
                   bank_status = 'APPROVED' AND 
                   nbe_status = 'APPROVED' AND 
                   customs_status = 'APPROVED' AND 
                   shipping_status = 'APPROVED'
                 ) THEN 'EXPORT_APPROVED' 
                 ELSE status 
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE reference_number = $4`,
          [status, req.user.id, notes, referenceNumber]
        );
      }
      
      res.json({
        success: true,
        organization,
        allApproved: response.allApproved,
        message: `${organization} approval recorded successfully`
      });
      
    } catch (error) {
      console.error('Error updating approval:', error);
      res.status(500).json({ error: error.message });
    }
});

// ============================================================================
// QUERY ENDPOINTS
// ============================================================================

/**
 * GET /api/contracts/:referenceNumber
 * Get contract by reference number
 */
router.get('/contracts/:referenceNumber',
  authenticateToken,
  async (req, res) => {
    try {
      const { referenceNumber } = req.params;
      
      const result = await fabricService.evaluateTransaction(
        'system',
        'ecta',
        'GetContractByReference',
        referenceNumber
      );
      
      res.json(JSON.parse(result));
      
    } catch (error) {
      console.error('Error getting contract:', error);
      res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/contracts/:referenceNumber/status
 * Get approval status for contract
 */
router.get('/contracts/:referenceNumber/status',
  authenticateToken,
  async (req, res) => {
    try {
      const { referenceNumber } = req.params;
      
      const result = await fabricService.evaluateTransaction(
        'system',
        'ecta',
        'GetApprovalStatus',
        referenceNumber
      );
      
      // Handle both string and object responses
      const statusData = typeof result === 'string' ? JSON.parse(result) : result;
      res.json(statusData);
      
    } catch (error) {
      console.error('Error getting approval status:', error);
      res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/contracts/exporter/:exporterId
 * Get all contracts for exporter
 */
router.get('/contracts/exporter/:exporterId',
  authenticateToken,
  async (req, res) => {
    try {
      const { exporterId } = req.params;
      
      const result = await fabricService.evaluateTransaction(
        'system',
        'ecta',
        'QueryContractsByExporter',
        exporterId
      );
      
      res.json(JSON.parse(result));
      
    } catch (error) {
      console.error('Error querying contracts:', error);
      res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/contracts/status/:status
 * Query contracts by status
 */
router.get('/contracts/status/:status',
  authenticateToken,
  async (req, res) => {
    try {
      const { status } = req.params;
      
      const result = await fabricService.evaluateTransaction(
        'system',
        'ecta',
        'QueryContractsByStatus',
        status
      );
      
      res.json(JSON.parse(result));
      
    } catch (error) {
      console.error('Error querying contracts:', error);
      res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/contracts/draft/:draftId/reference
 * Get reference number by draft ID
 */
router.get('/contracts/draft/:draftId/reference',
  authenticateToken,
  async (req, res) => {
    try {
      const { draftId } = req.params;
      
      const result = await fabricService.evaluateTransaction(
        'system',
        'ecta',
        'GetReferenceByDraftId',
        draftId
      );
      
      res.json(JSON.parse(result));
      
    } catch (error) {
      console.error('Error getting reference:', error);
      res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ecta/contracts/verify/:referenceNumber
 * Verify sales contract by ECTA reference number (accessible by all network members)
 */
router.get('/ecta/contracts/verify/:referenceNumber',
  authenticateToken,
  async (req, res) => {
    try {
      const { referenceNumber } = req.params;
      
      // Query database for contract
      const contractResult = await postgresService.query(
        `SELECT cd.*, 
                ep.business_name as exporter_name, 
                ep.registration_number as exporter_registration,
                ep.tin as exporter_tin,
                br.company_name as buyer_name, 
                br.country as buyer_country,
                br.registration_number as buyer_registration
         FROM contract_drafts cd
         JOIN exporter_profiles ep ON cd.exporter_id = ep.exporter_id
         JOIN buyer_registry br ON cd.buyer_id = br.buyer_id
         WHERE cd.ecta_reference_number = $1`,
        [referenceNumber]
      );
      
      if (contractResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'Sales contract not found with this reference number' 
        });
      }
      
      const contract = contractResult.rows[0];
      
      // Verify on blockchain
      let blockchainVerification = null;
      try {
        const blockchainResult = await fabricService.evaluateTransaction(
          'system',
          'ecta',
          'GetSalesContractByReference',
          referenceNumber
        );
        blockchainVerification = typeof blockchainResult === 'string' 
          ? JSON.parse(blockchainResult) 
          : blockchainResult;
      } catch (error) {
        console.error('Blockchain verification error:', error);
        blockchainVerification = { error: 'Blockchain verification failed' };
      }
      
      res.json({
        success: true,
        data: {
          referenceNumber: contract.ecta_reference_number,
          status: contract.status,
          registeredAt: contract.registered_at,
          registeredBy: contract.registered_by,
          
          // Exporter details
          exporter: {
            id: contract.exporter_id,
            name: contract.exporter_name,
            registration: contract.exporter_registration,
            tin: contract.exporter_tin
          },
          
          // Buyer details
          buyer: {
            id: contract.buyer_id,
            name: contract.buyer_name,
            country: contract.buyer_country,
            registration: contract.buyer_registration
          },
          
          // Contract details
          contract: {
            draftId: contract.draft_id,
            coffeeType: contract.coffee_type,
            originRegion: contract.origin_region,
            quantity: contract.quantity,
            unitPrice: contract.unit_price,
            totalValue: contract.total_value,
            currency: contract.currency,
            qualityGrade: contract.quality_grade,
            paymentMethod: contract.payment_method,
            paymentTerms: contract.payment_terms,
            incoterms: contract.incoterms,
            portOfLoading: contract.port_of_loading,
            portOfDischarge: contract.port_of_discharge,
            deliveryDate: contract.delivery_date,
            governingLaw: contract.governing_law,
            arbitrationRules: contract.arbitration_rules,
            arbitrationLocation: contract.arbitration_location
          },
          
          // Blockchain verification
          blockchainVerification: blockchainVerification
        }
      });
      
    } catch (error) {
      console.error('Error verifying sales contract:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to verify sales contract',
        details: error.message 
      });
    }
  }
);

module.exports = router;
