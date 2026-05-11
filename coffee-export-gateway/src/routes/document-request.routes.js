const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { Pool } = require('pg');

// Database pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

/**
 * GET /api/document-requests/registered-contracts
 * Get all registered contracts for the current exporter
 */
router.get('/registered-contracts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id, business_name, tin FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await pool.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Get registered contracts
    const query = `
      SELECT 
        ecs.submission_id,
        ecs.draft_id,
        ecs.ecta_reference_number,
        ecs.submission_status,
        ecs.submitted_at,
        ecs.registered_at,
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
        br.company_name as buyer_name,
        br.country as buyer_country
      FROM ecta_contract_submissions ecs
      JOIN contract_drafts cd ON ecs.draft_id = cd.draft_id
      JOIN buyer_registry br ON ecs.buyer_id = br.buyer_id
      WHERE ecs.exporter_id = $1
        AND ecs.submission_status IN ('REGISTERED', 'PENDING_REGISTRATION')
      ORDER BY ecs.registered_at DESC, ecs.submitted_at DESC
    `;

    const result = await pool.query(query, [exporterUuid]);

    res.json({
      success: true,
      count: result.rows.length,
      registeredContracts: result.rows
    });

  } catch (error) {
    console.error('[Registered Contracts] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/document-requests/from-contract
 * Create document requests from a registered sales contract
 * This fetches contract details and creates document requests for all required documents
 */
router.post('/from-contract', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { contractId, ectaReferenceNumber } = req.body;
    const userId = req.user.id || req.user.username;

    console.log('[Document Request] Creating from contract:', { contractId, ectaReferenceNumber, userId });

    // Get exporter profile
    const exporterQuery = 'SELECT exporter_id, business_name, tin FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;
    const exporterData = exporterResult.rows[0];

    // Get contract details from ecta_contract_submissions
    const contractQuery = `
      SELECT 
        ecs.submission_id,
        ecs.draft_id,
        ecs.ecta_reference_number,
        ecs.exporter_id,
        ecs.buyer_id,
        ecs.contract_data,
        cd.coffee_type,
        cd.origin_region,
        cd.quantity,
        cd.total_value,
        cd.currency,
        cd.delivery_date,
        cd.port_of_loading,
        cd.port_of_discharge,
        br.company_name as buyer_name,
        br.country as buyer_country
      FROM ecta_contract_submissions ecs
      JOIN contract_drafts cd ON ecs.draft_id = cd.draft_id
      JOIN buyer_registry br ON ecs.buyer_id = br.buyer_id
      WHERE (ecs.draft_id = $1 OR ecs.ecta_reference_number = $2)
        AND ecs.exporter_id = $3
        AND ecs.submission_status IN ('REGISTERED', 'PENDING_REGISTRATION')
    `;
    
    const contractResult = await client.query(contractQuery, [contractId, ectaReferenceNumber, exporterUuid]);

    if (contractResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found or not registered'
      });
    }

    const contract = contractResult.rows[0];

    // Define required documents based on contract type
    const requiredDocuments = [
      {
        documentType: 'EXPORT_LICENSE',
        issuerAgency: 'ECTA',
        description: 'Export License for coffee export',
        priority: 'HIGH',
        requiredData: {
          coffeeType: contract.coffee_type,
          quantity: contract.quantity,
          destination: contract.buyer_country
        }
      },
      {
        documentType: 'PHYTOSANITARY_CERTIFICATE',
        issuerAgency: 'MOA',
        description: 'Phytosanitary Certificate',
        priority: 'HIGH',
        requiredData: {
          productType: contract.coffee_type,
          quantity: contract.quantity,
          destination: contract.buyer_country
        }
      },
      {
        documentType: 'HEALTH_CERTIFICATE',
        issuerAgency: 'MOH',
        description: 'Health Certificate',
        priority: 'HIGH',
        requiredData: {
          productType: contract.coffee_type,
          quantity: contract.quantity
        }
      },
      {
        documentType: 'QUALITY_CERTIFICATE',
        issuerAgency: 'ECX',
        description: 'Quality Certificate',
        priority: 'HIGH',
        requiredData: {
          coffeeType: contract.coffee_type,
          quantity: contract.quantity,
          originRegion: contract.origin_region
        }
      },
      {
        documentType: 'CERTIFICATE_OF_ORIGIN',
        issuerAgency: 'ECTA',
        description: 'Certificate of Origin',
        priority: 'MEDIUM',
        requiredData: {
          productType: contract.coffee_type,
          originRegion: contract.origin_region,
          destination: contract.buyer_country
        }
      },
      {
        documentType: 'BANK_GUARANTEE',
        issuerAgency: 'BANK',
        description: 'Bank Guarantee / LC Confirmation',
        priority: 'HIGH',
        requiredData: {
          contractValue: contract.total_value,
          currency: contract.currency,
          buyer: contract.buyer_name
        }
      },
      {
        documentType: 'SHIPPING_BOOKING',
        issuerAgency: 'SHIPPING',
        description: 'Shipping Booking Confirmation',
        priority: 'MEDIUM',
        requiredData: {
          portOfLoading: contract.port_of_loading,
          portOfDischarge: contract.port_of_discharge,
          estimatedDeparture: contract.delivery_date
        }
      },
      {
        documentType: 'CUSTOMS_CLEARANCE',
        issuerAgency: 'CUSTOMS',
        description: 'Customs Clearance Document',
        priority: 'HIGH',
        requiredData: {
          exportValue: contract.total_value,
          currency: contract.currency,
          destination: contract.buyer_country
        }
      }
    ];

    await client.query('BEGIN');

    // Create document request batch
    const batchId = `DOCREQ-${Date.now()}`;
    const batchQuery = `
      INSERT INTO document_request_batches (
        batch_id,
        exporter_id,
        contract_reference,
        ecta_reference_number,
        total_documents,
        status,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, 'PENDING', CURRENT_TIMESTAMP)
      RETURNING *
    `;

    await client.query(batchQuery, [
      batchId,
      exporterUuid,
      contract.draft_id,
      contract.ecta_reference_number,
      requiredDocuments.length
    ]);

    // Create individual document requests
    const createdRequests = [];
    for (const doc of requiredDocuments) {
      const requestId = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const requestQuery = `
        INSERT INTO document_requests (
          request_id,
          batch_id,
          exporter_id,
          document_type,
          issuer_agency,
          description,
          priority,
          required_data,
          contract_reference,
          status,
          requested_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await client.query(requestQuery, [
        requestId,
        batchId,
        exporterUuid,
        doc.documentType,
        doc.issuerAgency,
        doc.description,
        doc.priority,
        JSON.stringify(doc.requiredData),
        contract.draft_id
      ]);

      createdRequests.push(result.rows[0]);
    }

    await client.query('COMMIT');

    console.log(`[Document Request] Created batch ${batchId} with ${createdRequests.length} requests`);

    res.json({
      success: true,
      message: 'Document requests created successfully',
      data: {
        batchId,
        contractReference: contract.ecta_reference_number,
        totalRequests: createdRequests.length,
        requests: createdRequests.map(req => ({
          requestId: req.request_id,
          documentType: req.document_type,
          issuerAgency: req.issuer_agency,
          description: req.description,
          priority: req.priority,
          status: req.status,
          requestedAt: req.requested_at
        })),
        contractDetails: {
          ectaReference: contract.ecta_reference_number,
          buyer: contract.buyer_name,
          destination: contract.buyer_country,
          coffeeType: contract.coffee_type,
          quantity: contract.quantity,
          value: contract.total_value,
          currency: contract.currency
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Document Request] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create document requests',
      message: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/document-requests/my-requests
 * Get all document requests for the current exporter
 */
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;
    const { status, batchId } = req.query;

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await pool.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    let query = `
      SELECT 
        dr.*,
        drb.ecta_reference_number,
        drb.total_documents,
        drb.completed_documents,
        id.document_id,
        id.document_number,
        id.issued_at as document_issued_at,
        id.status as document_status
      FROM document_requests dr
      JOIN document_request_batches drb ON dr.batch_id = drb.batch_id
      LEFT JOIN issued_documents id ON dr.issued_document_id = id.document_id
      WHERE dr.exporter_id = $1
    `;

    const params = [exporterUuid];
    let paramCount = 2;

    if (status) {
      query += ` AND dr.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (batchId) {
      query += ` AND dr.batch_id = $${paramCount}`;
      params.push(batchId);
      paramCount++;
    }

    query += ' ORDER BY dr.requested_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      requests: result.rows
    });

  } catch (error) {
    console.error('[Document Requests] Error fetching:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/document-requests/batches
 * Get all document request batches for the current exporter
 */
router.get('/batches', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await pool.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    const query = `
      SELECT 
        drb.*,
        COUNT(dr.request_id) as total_requests,
        COUNT(dr.request_id) FILTER (WHERE dr.status = 'COMPLETED') as completed_requests,
        COUNT(dr.request_id) FILTER (WHERE dr.status = 'PENDING') as pending_requests,
        COUNT(dr.request_id) FILTER (WHERE dr.status = 'IN_PROGRESS') as in_progress_requests
      FROM document_request_batches drb
      LEFT JOIN document_requests dr ON drb.batch_id = dr.batch_id
      WHERE drb.exporter_id = $1
      GROUP BY drb.batch_id
      ORDER BY drb.created_at DESC
    `;

    const result = await pool.query(query, [exporterUuid]);

    res.json({
      success: true,
      count: result.rows.length,
      batches: result.rows
    });

  } catch (error) {
    console.error('[Document Request Batches] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/document-requests/:requestId
 * Get details of a specific document request
 */
router.get('/:requestId', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id || req.user.username;

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await pool.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    const query = `
      SELECT 
        dr.*,
        drb.ecta_reference_number,
        id.document_id,
        id.document_number,
        id.document_hash,
        id.issued_at as document_issued_at,
        id.expiry_date as document_expiry_date,
        id.status as document_status,
        id.document_url,
        id.document_metadata
      FROM document_requests dr
      JOIN document_request_batches drb ON dr.batch_id = drb.batch_id
      LEFT JOIN issued_documents id ON dr.issued_document_id = id.document_id
      WHERE dr.request_id = $1 AND dr.exporter_id = $2
    `;

    const result = await pool.query(query, [requestId, exporterUuid]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document request not found'
      });
    }

    res.json({
      success: true,
      request: result.rows[0]
    });

  } catch (error) {
    console.error('[Document Request Detail] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
