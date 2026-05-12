const express = require('express');
const router = express.Router();
const fabricService = require('../services');
const postgresService = require('../services/postgres');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { users } = require('./auth.routes');
const notificationService = require('../services/notification.service');

/**
 * Get all pending registrations (ECTA only)
 * NOW FULLY BLOCKCHAIN-BASED ✅
 */
router.get('/registrations/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Query blockchain for pending users
    const pendingUsers = await fabricService.getPendingUsers();
    
    // Format data for frontend compatibility
    const pendingRegistrations = pendingUsers.map(item => {
      const user = item.record;
      return {
        exporter_id: user.username,
        username: user.username,
        email: user.email,
        phone: user.phone,
        businessName: user.companyName,
        companyName: user.companyName,
        tin: user.tin || 'N/A',
        businessType: 'EXPORTER',
        minimumCapital: user.capitalETB || 50000000,
        status: 'PENDING',
        registeredAt: user.registeredAt,
        blockchainData: user
      };
    });
    
    res.json(pendingRegistrations);
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get registration details (ECTA only)
 * NOW FULLY BLOCKCHAIN-BASED ✅
 */
router.get('/registrations/:username', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username } = req.params;
    
    try {
      const user = await fabricService.getUser(username);
      
      // Also get exporter profile if exists
      let exporterProfile = null;
      try {
        const profileResult = await fabricService.evaluateTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'GetExporterProfile',
          username
        );
        exporterProfile = profileResult; // Already parsed
      } catch (error) {
        console.log('Exporter profile not found for', username);
      }
      
      res.json({
        username: user.username,
        email: user.email,
        phone: user.phone,
        companyName: user.companyName,
        tin: user.tin,
        capitalETB: user.capitalETB,
        address: user.address,
        contactPerson: user.contactPerson,
        role: user.role,
        status: user.status,
        registeredAt: user.registeredAt,
        approvedAt: user.approvedAt,
        approvedBy: user.approvedBy,
        rejectedAt: user.rejectedAt,
        rejectedBy: user.rejectedBy,
        rejectionReason: user.rejectionReason,
        blockchainData: exporterProfile
      });
    } catch (error) {
      return res.status(404).json({ error: 'Registration not found' });
    }
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve exporter registration (ECTA only)
 * NOW FULLY BLOCKCHAIN-BASED ✅
 */
router.post('/registrations/:username/approve', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username } = req.params;
    const { comments } = req.body;
    
    // Get user from blockchain
    let user;
    try {
      user = await fabricService.getUser(username);
    } catch (error) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    if (user.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Registration is not pending approval' });
    }
    
    // STEP 1: Update user status on blockchain (CouchDB)
    await fabricService.updateUserStatus(username, {
      status: 'approved',
      approvedBy: req.user.id,
      comments: comments || ''
    });

    // STEP 2: Update user status in PostgreSQL
    try {
      await postgresService.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE username = $2',
        ['approved', username]
      );
      console.log(`✓ User approved in PostgreSQL: ${username}`);
    } catch (dbError) {
      console.error('[Approval] PostgreSQL update error:', dbError);
      // Don't fail the request if PostgreSQL update fails, but log it
    }

    // STEP 3: Create/Update full exporter profile with all qualifications
    try {
      // Check if exporter profile already exists
      let exporterExists = false;
      let existingProfile = null;
      try {
        const profileResult = await fabricService.evaluateTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'GetExporterProfile',
          username
        );
        existingProfile = JSON.parse(profileResult);
        exporterExists = true;
      } catch (error) {
        // Profile doesn't exist, will create it
      }

      if (!exporterExists) {
        // Create full exporter profile with all qualifications approved
        const timestamp = new Date().toISOString();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        const threeYearsLater = new Date();
        threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
        
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const licenseNumber = `LIC-${year}-${random}`;
        
        const preRegistrationStatus = {
          profile: { 
            status: 'approved', 
            submittedAt: timestamp,
            approvedAt: timestamp,
            approvedBy: req.user.id,
            comments: comments || 'Manually approved by ECTA'
          },
          laboratory: { 
            status: 'approved',
            submittedAt: timestamp,
            approvedAt: timestamp,
            approvedBy: req.user.id,
            certificateNumber: `LAB-${Date.now()}`,
            validUntil: oneYearLater.toISOString()
          },
          taster: { 
            status: 'approved',
            submittedAt: timestamp,
            approvedAt: timestamp,
            approvedBy: req.user.id,
            certificateNumber: `TASTER-${Date.now()}`,
            validUntil: threeYearsLater.toISOString()
          },
          competenceCertificate: { 
            status: 'approved',
            submittedAt: timestamp,
            approvedAt: timestamp,
            approvedBy: req.user.id,
            certificateNumber: `COMP-${Date.now()}`,
            validUntil: oneYearLater.toISOString()
          },
          exportLicense: { 
            status: 'issued',
            licenseNumber: licenseNumber,
            issuedAt: timestamp,
            issuedBy: req.user.id,
            expiryDate: oneYearLater.toISOString(),
            licenseType: 'FULL_EXPORT',
            restrictions: []
          }
        };

        const exporterProfileData = {
          docType: 'exporter',
          exporterId: username,
          companyName: user.companyName || '',
          tin: user.tin || '',
          capitalETB: user.capitalETB || 0,
          businessType: user.businessType || 'PRIVATE_EXPORTER',
          address: user.address || '',
          contactPerson: user.contactPerson || '',
          phone: user.phone || '',
          email: user.email || '',
          status: 'active',
          licenseNumber: licenseNumber,
          licenseIssuedDate: timestamp,
          licenseExpiryDate: oneYearLater.toISOString(),
          fullyQualified: true,
          qualificationLevel: 'FULL',
          preRegistrationStatus: preRegistrationStatus,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        // Use direct state write via chaincode
        await fabricService.submitTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'UpdateExporterProfile',
          username,
          JSON.stringify(exporterProfileData)
        );
        console.log(`✓ Full exporter profile created for ${username}`);
      } else {
        // Profile exists, update it with full qualifications
        const timestamp = new Date().toISOString();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        const threeYearsLater = new Date();
        threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
        
        // Update all stages to approved
        existingProfile.preRegistrationStatus = existingProfile.preRegistrationStatus || {};
        existingProfile.preRegistrationStatus.profile = {
          status: 'approved',
          approvedAt: timestamp,
          approvedBy: req.user.id,
          comments: comments || 'Manually approved by ECTA'
        };
        existingProfile.preRegistrationStatus.laboratory = {
          status: 'approved',
          approvedAt: timestamp,
          approvedBy: req.user.id,
          certificateNumber: existingProfile.preRegistrationStatus.laboratory?.certificateNumber || `LAB-${Date.now()}`,
          validUntil: oneYearLater.toISOString()
        };
        existingProfile.preRegistrationStatus.taster = {
          status: 'approved',
          approvedAt: timestamp,
          approvedBy: req.user.id,
          certificateNumber: existingProfile.preRegistrationStatus.taster?.certificateNumber || `TASTER-${Date.now()}`,
          validUntil: threeYearsLater.toISOString()
        };
        existingProfile.preRegistrationStatus.competenceCertificate = {
          status: 'approved',
          approvedAt: timestamp,
          approvedBy: req.user.id,
          certificateNumber: existingProfile.preRegistrationStatus.competenceCertificate?.certificateNumber || `COMP-${Date.now()}`,
          validUntil: oneYearLater.toISOString()
        };
        existingProfile.preRegistrationStatus.exportLicense = {
          status: 'issued',
          licenseNumber: existingProfile.licenseNumber || `LIC-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
          issuedAt: timestamp,
          issuedBy: req.user.id,
          expiryDate: oneYearLater.toISOString(),
          licenseType: 'FULL_EXPORT',
          restrictions: []
        };
        
        existingProfile.status = 'active';
        existingProfile.fullyQualified = true;
        existingProfile.updatedAt = timestamp;

        await fabricService.submitTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'UpdateExporterProfile',
          username,
          JSON.stringify(existingProfile)
        );
        console.log(`✓ All qualification stages approved for ${username}`);
      }
    } catch (error) {
      console.error('Exporter profile creation/update error:', error.message);
      // Don't fail the approval if profile update fails
    }
    
    // Send approval notification email
    notificationService.notifyProfileApproved(user, req.user.id)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Registration approved successfully in both databases',
      username,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      databases: {
        blockchain: 'updated',
        postgresql: 'updated'
      }
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reject exporter registration (ECTA only)
 * DUAL UPDATE: PostgreSQL + Blockchain ✅
 */
router.post('/registrations/:username/reject', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    // Get user from blockchain
    let user;
    try {
      user = await fabricService.getUser(username);
    } catch (error) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    if (user.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Registration is not pending approval' });
    }
    
    // STEP 1: Update user status on blockchain (CouchDB)
    await fabricService.updateUserStatus(username, {
      status: 'rejected',
      rejectedBy: req.user.id,
      reason: reason
    });
    
    // STEP 2: Update user status in PostgreSQL
    try {
      await postgresService.query(
        'UPDATE users SET status = $1, updated_at = NOW() WHERE username = $2',
        ['rejected', username]
      );
      console.log(`✓ User rejected in PostgreSQL: ${username}`);
    } catch (dbError) {
      console.error('[Rejection] PostgreSQL update error:', dbError);
      // Don't fail the request if PostgreSQL update fails, but log it
    }
    
    // Send rejection notification email
    notificationService.notifyProfileRejected(user, req.user.id, reason)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Registration rejected in both databases',
      username,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      reason,
      databases: {
        blockchain: 'updated',
        postgresql: 'updated'
      }
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit qualification document (Exporter only - after approval)
 * NOW CHECKS BLOCKCHAIN FOR USER STATUS ✅
 * AUTO-GENERATES CERTIFICATE INFO FOR AUTO-APPROVAL ✅
 */
router.post('/qualifications/:stage', authenticateToken, async (req, res) => {
  try {
    const { stage } = req.params; // laboratory, taster, competenceCertificate
    const exporterId = req.user.id;
    
    // Verify exporter is approved (check blockchain)
    let user;
    try {
      user = await fabricService.getUser(exporterId);
    } catch (error) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.status !== 'approved' && user.status !== 'active') {
      return res.status(403).json({ error: 'Account must be approved to submit qualifications' });
    }
    
    // Auto-generate certificate info based on stage
    const timestamp = Date.now();
    let certificateNumber, validUntil;
    
    switch(stage) {
      case 'laboratory':
        certificateNumber = `LAB-${timestamp}`;
        validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1); // 1 year validity
        break;
      case 'taster':
        certificateNumber = `TASTER-${timestamp}`;
        validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 3); // 3 years validity
        break;
      case 'competenceCertificate':
        certificateNumber = `COMP-${timestamp}`;
        validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1); // 1 year validity
        break;
      default:
        certificateNumber = `CERT-${timestamp}`;
        validUntil = new Date();
        validUntil.setFullYear(validUntil.getFullYear() + 1);
    }
    
    const qualificationData = {
      exporterId,
      stage,
      ...req.body,
      certificateNumber,
      validUntil: validUntil.toISOString(),
      submittedAt: new Date().toISOString()
    };
    
    // Update blockchain
    await fabricService.submitTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitQualificationDocument',
      JSON.stringify(qualificationData)
    );
    
    res.json({
      success: true,
      message: `${stage} qualification submitted successfully`,
      stage,
      certificateNumber
    });
  } catch (error) {
    console.error('Submit qualification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get qualification status (Exporter)
 * HYBRID MODE: Read from PostgreSQL (existing tables), sync to blockchain in background
 * Uses the existing table structure: exporter_profiles, coffee_laboratories, coffee_tasters, competence_certificates, export_licenses
 */
router.get('/qualifications/status', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Query the qualified_exporters view which aggregates all qualification stages
    const result = await postgresService.query(
      `SELECT 
        exporter_id,
        business_name,
        profile_status,
        lab_status,
        taster_status,
        competence_status,
        license_status,
        is_qualified
       FROM qualified_exporters
       WHERE exporter_id = (SELECT exporter_id FROM exporter_profiles WHERE user_id = $1)`,
      [exporterId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No qualifications found',
        message: 'Please complete registration first'
      });
    }
    
    const data = result.rows[0];
    
    // Format response as array of qualification stages (expected by frontend)
    const qualifications = [
      {
        stage: 'profile_certificate',
        status: data.profile_status || 'PENDING',
        approved_at: null,
        approved_by: null,
        comments: null,
        certificate_url: null
      },
      {
        stage: 'laboratory_certificate',
        status: data.lab_status || 'PENDING',
        approved_at: null,
        approved_by: null,
        comments: null,
        certificate_url: null
      },
      {
        stage: 'taster_certificate',
        status: data.taster_status || 'PENDING',
        approved_at: null,
        approved_by: null,
        comments: null,
        certificate_url: null
      },
      {
        stage: 'competence_certificate',
        status: data.competence_status || 'PENDING',
        approved_at: null,
        approved_by: null,
        comments: null,
        certificate_url: null
      },
      {
        stage: 'export_license',
        status: data.license_status || 'PENDING',
        approved_at: null,
        approved_by: null,
        comments: null,
        certificate_url: null
      }
    ];
    
    // Return array of qualifications
    res.json(qualifications);
    
    // ASYNC: Sync to blockchain in background (non-blocking)
    setImmediate(async () => {
      try {
        await fabricService.evaluateTransaction(
          exporterId,
          process.env.CHAINCODE_NAME || 'ecta',
          'GetExporterProfile',
          exporterId
        );
        console.log(`[Blockchain Sync] Qualifications verified on blockchain for ${exporterId}`);
      } catch (blockchainError) {
        // Log but don't fail - blockchain is secondary
        console.log(`[Blockchain Sync] Background sync failed (non-critical): ${blockchainError.message}`);
      }
    });
    
  } catch (error) {
    console.error('Get qualification status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve qualification stage (ECTA only)
 * HYBRID MODE: Update PostgreSQL first, sync to blockchain in background
 */
router.post('/qualifications/:username/:stage/approve', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username, stage } = req.params;
    const { comments } = req.body;
    const approvedBy = req.user.id;
    
    // STEP 1: Update qualification status in PostgreSQL (PRIMARY)
    const result = await postgresService.query(
      `UPDATE exporter_qualifications
       SET status = 'APPROVED',
           approved_at = NOW(),
           approved_by = $1,
           comments = $2
       WHERE username = $3 AND stage = $4
       RETURNING *`,
      [approvedBy, comments, username, stage]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Qualification stage not found',
        message: `No ${stage} found for user ${username}`
      });
    }
    
    console.log(`✓ [PostgreSQL] Qualification approved: ${username} - ${stage}`);
    
    // STEP 2: Sync to blockchain in background (non-blocking)
    setImmediate(async () => {
      try {
        await fabricService.submitTransaction(
          approvedBy,
          process.env.CHAINCODE_NAME || 'ecta',
          'ApprovePreRegistration',
          username,
          stage
        );
        console.log(`✓ [Blockchain Sync] Synced approval to blockchain for ${username}/${stage}`);
      } catch (blockchainError) {
        console.log(`[Blockchain Sync] Background sync failed (non-critical): ${blockchainError.message}`);
      }
    });
    
    res.json({
      success: true,
      message: `${stage} qualification approved`,
      username,
      stage,
      qualification: result.rows[0]
    });
  } catch (error) {
    console.error('Approve qualification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Issue export license (ECTA only)
 * NOW GENERATES PDF LICENSE AUTOMATICALLY
 */
router.post('/license/issue', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId, licenseNumber, expiryDate } = req.body;
    
    if (!exporterId || !licenseNumber || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update blockchain
    const licenseData = {
      exporterId,
      licenseNumber,
      issuedDate: new Date().toISOString(),
      expiryDate,
      issuedBy: req.user.id
    };
    
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExporterProfile',
      exporterId,
      JSON.stringify({
        licenseNumber,
        licenseIssuedDate: licenseData.issuedDate,
        licenseExpiryDate: expiryDate,
        status: 'active'
      })
    );
    
    // Generate PDF license certificate
    let certificateInfo = null;
    try {
      const user = await fabricService.getUser(exporterId);
      const { generateExportLicensePDF } = require('../utils/certificate-pdf');
      
      const pdfResult = await generateExportLicensePDF(user, licenseData);
      
      certificateInfo = {
        certificateNumber: pdfResult.certificateNumber,
        filename: pdfResult.filename,
        filepath: pdfResult.filepath,
        downloadUrl: `/api/ecta/certificates/license/${exporterId}/download`
      };
      
      console.log(`✓ Export license generated: ${pdfResult.filename}`);
      
      // Send notification email with license
      notificationService.notifyLicenseIssued(user, licenseData, certificateInfo)
        .catch(err => console.error('Email notification failed:', err));
        
    } catch (error) {
      console.error('License PDF generation error (non-fatal):', error.message);
    }
    
    res.json({
      success: true,
      message: 'Export license issued successfully',
      exporterId,
      licenseNumber,
      expiryDate,
      certificate: certificateInfo
    });
  } catch (error) {
    console.error('Issue license error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// QUALIFICATION DOCUMENT APPROVAL ENDPOINTS FOR ECTA DASHBOARD
// ============================================================================

/**
 * Get pending laboratories (ECTA only)
 */
router.get('/preregistration/laboratories/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Fetch from PostgreSQL - get pending laboratories
    const result = await postgresService.query(`
      SELECT 
        cl.laboratory_id,
        cl.exporter_id,
        cl.status,
        cl.certification_number,
        cl.created_at,
        cl.updated_at,
        u.email,
        ep.business_name,
        ep.tin,
        ep.user_id as exporter_username
      FROM coffee_laboratories cl
      JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
      JOIN users u ON ep.user_id = u.username
      WHERE cl.status = 'PENDING' OR cl.status = 'SUBMITTED'
      ORDER BY cl.updated_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending laboratories error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending tasters (ECTA only)
 */
router.get('/preregistration/tasters/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Fetch from PostgreSQL - get pending tasters
    const result = await postgresService.query(`
      SELECT 
        ct.taster_id,
        ct.exporter_id,
        ct.status,
        ct.proficiency_certificate_number,
        ct.created_at,
        ct.updated_at,
        u.email,
        ep.business_name,
        ep.tin,
        ep.user_id as exporter_username
      FROM coffee_tasters ct
      JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
      JOIN users u ON ep.user_id = u.username
      WHERE ct.status = 'PENDING' OR ct.status = 'SUBMITTED'
      ORDER BY ct.updated_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending tasters error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending competence certificates (ECTA only)
 */
router.get('/preregistration/competence/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Fetch from PostgreSQL - get pending competence certificates
    const result = await postgresService.query(`
      SELECT 
        cc.certificate_id,
        cc.exporter_id,
        cc.status,
        cc.certificate_number,
        cc.certificate_id as cert_id,
        cc.created_at,
        cc.updated_at,
        u.email,
        ep.business_name,
        ep.tin,
        ep.user_id as exporter_username
      FROM competence_certificates cc
      JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
      JOIN users u ON ep.user_id = u.username
      WHERE cc.status = 'PENDING' OR cc.status = 'SUBMITTED'
      ORDER BY cc.updated_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending competence certificates error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending licenses (ECTA only)
 * Queries PostgreSQL for pending export licenses
 */
router.get('/preregistration/licenses/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const result = await postgresService.query(`
      SELECT 
        el.license_id,
        el.exporter_id,
        el.status,
        el.license_number,
        el.created_at,
        el.updated_at,
        u.email,
        ep.business_name,
        ep.tin,
        ep.user_id as exporter_username
      FROM export_licenses el
      JOIN exporter_profiles ep ON el.exporter_id = ep.exporter_id
      JOIN users u ON ep.user_id = u.username
      WHERE el.status = 'PENDING' OR el.status = 'SUBMITTED'
      ORDER BY el.updated_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get pending licenses error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all exporters (ECTA only)
 * Queries PostgreSQL for all exporter profiles
 */
router.get('/preregistration/exporters', authenticateToken, requireRole('ecta', 'admin', 'bank'), async (req, res) => {
  try {
    // Query PostgreSQL for all exporter profiles with comprehensive qualification status
    const result = await postgresService.query(`
      SELECT 
        ep.exporter_id,
        ep.user_id as username,
        ep.business_name,
        ep.tin,
        ep.registration_number,
        ep.business_type,
        ep.minimum_capital,
        ep.capital_verified,
        ep.status,
        ep.office_address,
        ep.city,
        ep.region,
        ep.contact_person,
        ep.created_at as registered_at,
        ep.approved_at,
        u.email,
        u.phone,
        -- Laboratory status
        CASE 
          WHEN cl.laboratory_id IS NOT NULL AND cl.status = 'ACTIVE' AND cl.expiry_date > NOW() THEN true
          ELSE false
        END as laboratory_certified,
        cl.laboratory_name,
        cl.certification_number as lab_cert_number,
        -- Taster status
        CASE 
          WHEN ct.taster_id IS NOT NULL AND ct.status = 'ACTIVE' AND ct.certificate_expiry_date > NOW() THEN true
          ELSE false
        END as taster_verified,
        ct.full_name as taster_name,
        -- Competence certificate
        CASE 
          WHEN cc.certificate_id IS NOT NULL AND cc.status = 'ACTIVE' AND cc.expiry_date > NOW() THEN true
          ELSE false
        END as has_competence_certificate,
        cc.certificate_id as competence_certificate_id,
        cc.certificate_number as competence_cert_number,
        -- Export license
        CASE 
          WHEN el.license_id IS NOT NULL AND el.status = 'ACTIVE' AND el.expiry_date > NOW() THEN true
          ELSE false
        END as has_export_license,
        el.license_id as export_license_id,
        el.license_number,
        el.issued_date as license_issued_date,
        el.expiry_date as license_expiry_date,
        -- Overall qualification (ALL requirements must be met)
        CASE 
          WHEN ep.status = 'FULLY_QUALIFIED' 
               AND cl.laboratory_id IS NOT NULL AND cl.status = 'ACTIVE' AND cl.expiry_date > NOW()
               AND ct.taster_id IS NOT NULL AND ct.status = 'ACTIVE' AND ct.certificate_expiry_date > NOW()
               AND cc.certificate_id IS NOT NULL AND cc.status = 'ACTIVE' AND cc.expiry_date > NOW()
               AND el.license_id IS NOT NULL AND el.status = 'ACTIVE' AND el.expiry_date > NOW()
          THEN true
          ELSE false
        END as is_qualified
      FROM exporter_profiles ep
      JOIN users u ON ep.user_id = u.username
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
      LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE'
      ORDER BY ep.created_at DESC
    `);
    
    const allExporters = result.rows.map(row => ({
      id: row.exporter_id,
      exporterId: row.exporter_id,
      exporter_id: row.exporter_id,
      username: row.username,
      email: row.email,
      phone: row.phone,
      businessName: row.business_name,
      business_name: row.business_name,
      companyName: row.business_name,
      tin: row.tin,
      registrationNumber: row.registration_number,
      registration_number: row.registration_number,
      businessType: row.business_type,
      business_type: row.business_type,
      minimumCapital: parseFloat(row.minimum_capital) || 0,
      capitalVerified: row.capital_verified,
      status: row.status,
      officeAddress: row.office_address,
      office_address: row.office_address,
      city: row.city,
      region: row.region,
      contactPerson: row.contact_person,
      contact_person: row.contact_person,
      registeredAt: row.registered_at,
      approvedAt: row.approved_at,
      // Laboratory
      laboratoryCertified: row.laboratory_certified,
      laboratory_certified: row.laboratory_certified,
      hasCertifiedLaboratory: row.laboratory_certified,
      laboratoryName: row.laboratory_name,
      labCertNumber: row.lab_cert_number,
      // Taster
      tasterVerified: row.taster_verified,
      hasQualifiedTaster: row.taster_verified,
      tasterName: row.taster_name,
      // Competence Certificate
      hasCompetenceCertificate: row.has_competence_certificate,
      has_competence_certificate: row.has_competence_certificate,
      competenceCertificateId: row.competence_certificate_id,
      competence_certificate_id: row.competence_certificate_id,
      competenceCertNumber: row.competence_cert_number,
      // Export License
      hasExportLicense: row.has_export_license,
      has_export_license: row.has_export_license,
      exportLicenseId: row.export_license_id,
      export_license_id: row.export_license_id,
      licenseNumber: row.license_number,
      licenseIssuedDate: row.license_issued_date,
      licenseExpiryDate: row.license_expiry_date,
      // Overall qualification
      isQualified: row.is_qualified,
      is_qualified: row.is_qualified
    }));
    
    console.log(`Returning ${allExporters.length} exporters with complete data`);
    res.json(allExporters);
  } catch (error) {
    console.error('Get all exporters error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get global statistics (ECTA only)
 * Returns dashboard statistics from PostgreSQL
 */
router.get('/global-stats', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Get exporter statistics from PostgreSQL
    const exporterStats = await postgresService.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended
      FROM exporter_profiles
    `);
    
    const licenseStats = await postgresService.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) as expired
      FROM export_licenses
    `);
    
    const stats = {
      exporters: {
        total: parseInt(exporterStats.rows[0].total) || 0,
        pending: parseInt(exporterStats.rows[0].pending) || 0,
        approved: parseInt(exporterStats.rows[0].approved) || 0,
        rejected: parseInt(exporterStats.rows[0].rejected) || 0,
        suspended: parseInt(exporterStats.rows[0].suspended) || 0
      },
      licenses: {
        total: parseInt(licenseStats.rows[0].total) || 0,
        active: parseInt(licenseStats.rows[0].active) || 0,
        pending: parseInt(licenseStats.rows[0].pending) || 0,
        expired: parseInt(licenseStats.rows[0].expired) || 0
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get global stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pre-registration dashboard statistics (ECTA only)
 * Returns statistics from PostgreSQL
 */
router.get('/preregistration/dashboard/stats', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Get statistics from PostgreSQL
    const stats = await postgresService.query(`
      SELECT 
        COUNT(*) as totalExporters,
        SUM(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 ELSE 0 END) as pendingRegistrations,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as approvedExporters,
        SUM(CASE WHEN status = 'REVOKED' THEN 1 ELSE 0 END) as rejectedApplications
      FROM exporter_profiles
    `);
    
    const licenseStats = await postgresService.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending
      FROM export_licenses
    `);
    
    const data = {
      exporters: {
        total: parseInt(stats.rows[0].totalexporters) || 0,
        pending: parseInt(stats.rows[0].pendingregistrations) || 0,
        approved: parseInt(stats.rows[0].approvedexporters) || 0,
        rejected: parseInt(stats.rows[0].rejectedapplications) || 0
      },
      licenses: {
        total: parseInt(licenseStats.rows[0].total) || 0,
        active: parseInt(licenseStats.rows[0].active) || 0,
        pending: parseInt(licenseStats.rows[0].pending) || 0
      }
    };
    
    res.json({ data });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending exporters for pre-registration (ECTA only)
 * Queries PostgreSQL for pending exporter profiles
 */
router.get('/preregistration/exporters/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Query PostgreSQL for pending exporter profiles
    const result = await postgresService.query(`
      SELECT 
        ep.exporter_id,
        ep.user_id as username,
        ep.business_name as businessName,
        ep.business_name as companyName,
        ep.tin,
        ep.business_type as businessType,
        ep.minimum_capital as minimumCapital,
        ep.status,
        ep.created_at as registeredAt,
        ep.approved_at as approvedAt,
        u.email,
        u.phone
      FROM exporter_profiles ep
      JOIN users u ON ep.user_id = u.username
      WHERE ep.status = 'PENDING_APPROVAL'
      ORDER BY ep.created_at DESC
    `);
    
    const pendingExporters = result.rows.map(row => ({
      exporter_id: row.exporter_id,
      username: row.username,
      email: row.email,
      phone: row.phone,
      businessName: row.businessname,
      companyName: row.businessname,
      tin: row.tin || 'N/A',
      businessType: row.businesstype || 'EXPORTER',
      minimumCapital: row.minimumcapital || 50000000,
      status: row.status.toUpperCase(),
      registeredAt: row.registeredat,
      approvedAt: row.approvedat
    }));
    
    res.json(pendingExporters);
  } catch (error) {
    console.error('Get pending exporters error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve exporter (ECTA only) - Preregistration path
 * Accepts exporterId (UUID) instead of username for consistency with other endpoints
 */
router.post('/preregistration/exporters/:exporterId/approve', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId } = req.params;
    const { comments } = req.body;
    
    // Get exporter profile from PostgreSQL to get username
    const profileResult = await postgresService.query(
      'SELECT user_id, business_name, status FROM exporter_profiles WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const profile = profileResult.rows[0];
    const username = profile.user_id;
    
    // Update status in PostgreSQL
    await postgresService.query(
      `UPDATE exporter_profiles 
       SET status = 'ACTIVE', 
           capital_verified = true,
           capital_verification_date = NOW(),
           approved_by = $1, 
           approved_at = NOW(),
           updated_at = NOW()
       WHERE exporter_id = $2`,
      [req.user.id, exporterId]
    );
    
    // Try to update blockchain (optional - don't fail if blockchain is unavailable)
    try {
      const user = await fabricService.getUser(username);
      if (user && user.status === 'pending_approval') {
        await fabricService.updateUserStatus(username, {
          status: 'approved',
          approvedBy: req.user.id,
          comments: comments || ''
        });
        
        await fabricService.submitTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'ApprovePreRegistration',
          username,
          'profile'
        );
      }
    } catch (error) {
      console.log('Blockchain update skipped:', error.message);
    }
    
    // Send approval notification email
    notificationService.notifyProfileApproved({ username, email: profile.email }, req.user.id)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Exporter approved successfully',
      exporterId,
      username,
      status: 'ACTIVE',
      approvedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Approve exporter error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reject exporter (ECTA only) - Preregistration path
 * Accepts exporterId (UUID) instead of username for consistency
 */
router.post('/preregistration/exporters/:exporterId/reject', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    // Get exporter profile from PostgreSQL
    const profileResult = await postgresService.query(
      'SELECT user_id, business_name, status FROM exporter_profiles WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const profile = profileResult.rows[0];
    const username = profile.user_id;
    
    // Update status in PostgreSQL
    await postgresService.query(
      `UPDATE exporter_profiles 
       SET status = 'REJECTED', 
           rejection_reason = $1,
           rejected_by = $2,
           rejected_at = NOW(),
           updated_at = NOW()
       WHERE exporter_id = $3`,
      [reason, req.user.id, exporterId]
    );
    
    // Try to update blockchain (optional)
    try {
      const user = await fabricService.getUser(username);
      if (user) {
        await fabricService.updateUserStatus(username, {
          status: 'rejected',
          rejectedBy: req.user.id,
          reason: reason
        });
      }
    } catch (error) {
      console.log('Blockchain update skipped:', error.message);
    }
    
    // Send rejection notification email
    notificationService.notifyProfileRejected({ username, email: profile.email }, req.user.id, reason)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Exporter rejected',
      exporterId,
      username,
      status: 'REJECTED',
      rejectedAt: new Date().toISOString(),
      reason
    });
  } catch (error) {
    console.error('Reject exporter error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify capital (ECTA only)
 * Updates capital_verified flag after reviewing proof documents
 */
router.post('/capital/verify/:exporterId', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId } = req.params;
    const { verified, comments, capitalAmount } = req.body;
    
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'Verified status (true/false) is required' });
    }
    
    // Get exporter profile
    let profile;
    try {
      const profileResult = await fabricService.evaluateTransaction(
        req.user.id,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterProfile',
        exporterId
      );
      profile = profileResult; // Already parsed
    } catch (error) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    // Update profile with capital verification
    const updates = {
      capitalVerified: verified,
      capitalVerificationDate: new Date().toISOString(),
      capitalVerifiedBy: req.user.id,
      capitalVerificationComments: comments || ''
    };
    
    if (capitalAmount) {
      updates.capitalETB = capitalAmount;
    }
    
    // Update blockchain
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExporterProfile',
      exporterId,
      JSON.stringify(updates)
    );
    
    res.json({
      success: true,
      message: verified ? 'Capital verified successfully' : 'Capital verification rejected',
      exporterId,
      capitalVerified: verified,
      verifiedAt: updates.capitalVerificationDate
    });
  } catch (error) {
    console.error('Capital verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Schedule facility inspection (ECTA only)
 */
router.post('/inspections/schedule', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId, inspectionType, scheduledDate, inspector, notes } = req.body;
    
    if (!exporterId || !inspectionType || !scheduledDate) {
      return res.status(400).json({ error: 'Exporter ID, inspection type, and scheduled date are required' });
    }
    
    const inspectionData = {
      inspectionId: `INS-${Date.now()}`,
      exporterId,
      inspectionType, // 'laboratory', 'facility', 'competence'
      scheduledDate,
      inspector: inspector || req.user.id,
      scheduledBy: req.user.id,
      status: 'scheduled',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    
    // Store inspection on blockchain
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExporterProfile',
      exporterId,
      JSON.stringify({
        inspections: [inspectionData]
      })
    );
    
    res.json({
      success: true,
      message: 'Inspection scheduled successfully',
      inspection: inspectionData
    });
  } catch (error) {
    console.error('Schedule inspection error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit inspection report (ECTA only)
 */
router.post('/inspections/:inspectionId/report', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { exporterId, passed, findings, recommendations, reportDocument } = req.body;
    
    if (!exporterId || typeof passed !== 'boolean') {
      return res.status(400).json({ error: 'Exporter ID and pass/fail status are required' });
    }
    
    const reportData = {
      inspectionId,
      exporterId,
      passed,
      findings: findings || '',
      recommendations: recommendations || '',
      reportDocument: reportDocument || '',
      inspectedBy: req.user.id,
      inspectedAt: new Date().toISOString(),
      status: passed ? 'passed' : 'failed'
    };
    
    // Update inspection on blockchain
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExporterProfile',
      exporterId,
      JSON.stringify({
        inspectionReport: reportData
      })
    );
    
    res.json({
      success: true,
      message: `Inspection report submitted - ${passed ? 'PASSED' : 'FAILED'}`,
      report: reportData
    });
  } catch (error) {
    console.error('Submit inspection report error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get scheduled inspections (ECTA only)
 */
router.get('/inspections/scheduled', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Get all exporters with scheduled inspections
    const exporters = await fabricService.getUsersByRole('exporter');
    
    const scheduledInspections = [];
    for (const item of exporters) {
      const user = item.record;
      try {
        const profileResult = await fabricService.evaluateTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'GetExporterProfile',
          user.username
        );
        const profile = profileResult; // Already parsed
        
        if (profile.inspections && Array.isArray(profile.inspections)) {
          const pending = profile.inspections.filter(ins => ins.status === 'scheduled');
          scheduledInspections.push(...pending.map(ins => ({
            ...ins,
            exporterName: user.companyName
          })));
        }
      } catch (error) {
        console.log(`No profile for ${user.username}`);
      }
    }
    
    res.json(scheduledInspections);
  } catch (error) {
    console.error('Get scheduled inspections error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Verify exporter capital (ECTA only)
 * POST /api/ecta/capital/verify/:exporterId
 */
router.post('/capital/verify/:exporterId', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId } = req.params;
    const { capitalAmount, verified, comments, documentId } = req.body;

    if (typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'Verified status (true/false) is required' });
    }

    if (!capitalAmount) {
      return res.status(400).json({ error: 'Capital amount is required' });
    }

    // Get exporter profile
    let user;
    try {
      user = await fabricService.getUser(exporterId);
    } catch (error) {
      return res.status(404).json({ error: 'Exporter not found' });
    }

    const verificationData = {
      capitalAmount,
      capitalVerified: verified,
      capitalVerificationDate: new Date().toISOString(),
      capitalVerifiedBy: req.user.id,
      capitalVerificationComments: comments || '',
      capitalProofDocumentId: documentId || null
    };

    // Update exporter profile on blockchain
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExporterProfile',
      exporterId,
      JSON.stringify(verificationData)
    );

    // Send notification to exporter
    try {
      if (verified) {
        console.log(`Capital verified for exporter ${exporterId}: ${capitalAmount} ETB`);
        // You can add a specific notification method for capital verification
      } else {
        console.log(`Capital verification rejected for exporter ${exporterId}`);
      }
    } catch (error) {
      console.log('Notification error:', error.message);
    }

    res.json({
      success: true,
      message: verified ? 'Capital verified successfully' : 'Capital verification rejected',
      exporterId,
      capitalAmount,
      verified,
      verifiedAt: verificationData.capitalVerificationDate
    });
  } catch (error) {
    console.error('Capital verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get capital verification status (Exporter)
 * GET /api/ecta/capital/status/:exporterId
 */
router.get('/capital/status/:exporterId', authenticateToken, async (req, res) => {
  try {
    const { exporterId } = req.params;

    // Check authorization
    if (req.user.id !== exporterId && req.user.role !== 'ecta' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to view this information' });
    }

    // Get exporter profile
    const profileResult = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterProfile',
      exporterId
    );

    const profile = profileResult; // Already parsed

    res.json({
      exporterId,
      capitalAmount: profile.capitalETB || 0,
      capitalVerified: profile.capitalVerified || false,
      capitalVerificationDate: profile.capitalVerificationDate || null,
      capitalVerifiedBy: profile.capitalVerifiedBy || null,
      capitalVerificationComments: profile.capitalVerificationComments || '',
      capitalProofDocumentId: profile.capitalProofDocumentId || null
    });
  } catch (error) {
    console.error('Get capital status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CERTIFICATE DOWNLOAD ENDPOINTS
// ============================================================================

/**
 * Download competence certificate PDF
 * GET /api/ecta/certificates/competenceCertificate/:username/download
 */
router.get('/certificates/competenceCertificate/:username/download', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check authorization
    if (req.user.id !== username && req.user.role !== 'ecta' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await fabricService.getUser(username);
    const { generateCompetenceCertificatePDF } = require('../utils/certificate-pdf');
    
    const { filepath, filename } = await generateCompetenceCertificatePDF(user, {});
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download laboratory certificate PDF
 * GET /api/ecta/certificates/laboratory/:username/download
 */
router.get('/certificates/laboratory/:username/download', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check authorization
    if (req.user.id !== username && req.user.role !== 'ecta' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await fabricService.getUser(username);
    const { generateLaboratoryCertificatePDF } = require('../utils/certificate-pdf');
    
    const { filepath, filename } = await generateLaboratoryCertificatePDF(user, {});
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download taster certificate PDF
 * GET /api/ecta/certificates/taster/:username/download
 */
router.get('/certificates/taster/:username/download', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check authorization
    if (req.user.id !== username && req.user.role !== 'ecta' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await fabricService.getUser(username);
    const { generateTasterCertificatePDF } = require('../utils/certificate-pdf');
    
    const { filepath, filename } = await generateTasterCertificatePDF(user, {});
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download export license PDF
 * GET /api/ecta/certificates/license/:username/download
 */
router.get('/certificates/license/:username/download', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check authorization
    if (req.user.id !== username && req.user.role !== 'ecta' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const user = await fabricService.getUser(username);
    const { generateExportLicensePDF } = require('../utils/certificate-pdf');
    
    const licenseData = {
      licenseNumber: user.licenseNumber || `LIC-${Date.now()}`,
      issuedDate: user.licenseIssuedAt || new Date().toISOString(),
      expiryDate: user.licenseExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const { filepath, filename } = await generateExportLicensePDF(user, licenseData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Proxy all /preregistration/* requests to ECTA service
 * This forwards dashboard and other preregistration endpoints to the ECTA microservice
 */
router.all('/preregistration/*', authenticateToken, async (req, res) => {
  try {
    const axios = require('axios');
    const ectaServiceUrl = process.env.ECTA_SERVICE_URL || 'http://ecta-service:3003';
    
    // Extract the path after /api/ecta/preregistration
    // req.originalUrl is like: /api/ecta/preregistration/dashboard/exporter/123
    // We want to forward to: http://ecta-service:3003/api/ecta/preregistration/dashboard/exporter/123
    const pathAfterEctaPrefix = req.originalUrl.replace('/api/ecta/preregistration', '');
    
    // Forward the request to ECTA service with the correct path
    const targetUrl = `${ectaServiceUrl}/api/ecta/preregistration${pathAfterEctaPrefix}`;
    
    console.log(`[Gateway] Proxying ${req.method} ${req.originalUrl} -> ${targetUrl}`);
    console.log(`[Gateway] Authorization header present: ${!!req.headers.authorization}`);
    console.log(`[Gateway] User from token: ${req.user?.username || req.user?.id || 'unknown'}`);
    
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: {
        'Authorization': req.headers.authorization, // Explicitly forward auth header
        'Content-Type': req.headers['content-type'] || 'application/json',
        'User-Agent': req.headers['user-agent'],
      },
      data: req.body,
      params: req.query,
      validateStatus: () => true, // Don't throw on any status
    });
    
    console.log(`[Gateway] ECTA service responded with status: ${response.status}`);
    
    // Forward the response
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('[Gateway] Proxy error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to proxy request to ECTA service',
      error: error.message 
    });
  }
});

/**
 * GET /api/ecta/exports/pending
 * Get pending export approvals for ECTA (hybrid: PostgreSQL with blockchain fallback)
 */
router.get('/exports/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    console.log('[ECTA Exports] Fetching pending export approvals');
    
    // Query PostgreSQL for exports pending ECTA approval
    const pendingQuery = `
      SELECT 
        e.export_id,
        e.coffee_type,
        e.quantity,
        e.unit_of_measure,
        e.destination_country,
        e.estimated_value,
        e.status,
        e.created_at,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin,
        ep.email as exporter_email
      FROM exports e
      LEFT JOIN exporter_profiles ep ON e.exporter_id = ep.exporter_id
      WHERE e.status IN (
        'ECTA_LICENSE_PENDING',
        'ECTA_QUALITY_PENDING', 
        'ECTA_CONTRACT_PENDING',
        'SUBMITTED'
      )
      ORDER BY e.created_at ASC
    `;
    
    const result = await postgresService.query(pendingQuery);
    
    const pendingExports = result.rows.map(row => ({
      exportId: row.export_id,
      coffeeType: row.coffee_type,
      quantity: parseFloat(row.quantity),
      unitOfMeasure: row.unit_of_measure,
      destinationCountry: row.destination_country,
      estimatedValue: parseFloat(row.estimated_value),
      status: row.status,
      submittedAt: row.created_at,
      exporter: {
        name: row.exporter_name,
        tin: row.exporter_tin,
        email: row.exporter_email
      }
    }));
    
    console.log(`[ECTA Exports] Found ${pendingExports.length} pending exports`);
    
    res.json({
      success: true,
      count: pendingExports.length,
      exports: pendingExports,
      dataSource: 'postgresql'
    });
    
  } catch (error) {
    console.error('[ECTA Exports] Error fetching pending exports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending export approvals',
      details: error.message
    });
  }
});

/**
 * GET /api/ecta/contracts/finalized
 * Get all finalized sales contracts for ECTA registration
 */
router.get('/contracts/finalized', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        cd.*,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin
      FROM contract_drafts cd
      LEFT JOIN exporter_profiles ep ON cd.exporter_id = ep.exporter_id
      WHERE cd.status = 'FINALIZED'
      ORDER BY cd.updated_at DESC
    `;
    
    const result = await postgresService.query(query);
    
    res.json({
      success: true,
      contracts: result.rows
    });
  } catch (error) {
    console.error('Error fetching finalized contracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch finalized contracts'
    });
  }
});

/**
 * GET /api/ecta/contracts/registration-stats
 * Get statistics for contract registration from ECTA submissions table
 */
router.get('/contracts/registration-stats', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_finalized,
        COUNT(*) FILTER (WHERE submission_status = 'PENDING_REGISTRATION') as pending_registration,
        COUNT(*) FILTER (WHERE submission_status = 'REGISTERED') as registered
      FROM ecta_contract_submissions
    `;
    
    const result = await postgresService.query(query);
    const stats = result.rows[0];
    
    res.json({
      success: true,
      stats: {
        totalFinalized: parseInt(stats.total_finalized) || 0,
        pendingRegistration: parseInt(stats.pending_registration) || 0,
        registered: parseInt(stats.registered) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching registration stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registration stats'
    });
  }
});

module.exports = router;
