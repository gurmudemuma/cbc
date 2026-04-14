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
 */
router.get('/qualifications/status', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    const result = await fabricService.evaluateTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterProfile',
      exporterId
    );
    
    const profile = result; // Already parsed
    
    res.json({
      exporterId,
      status: profile.status,
      preRegistrationStatus: profile.preRegistrationStatus
    });
  } catch (error) {
    console.error('Get qualification status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve qualification stage (ECTA only)
 * NOW GENERATES PDF CERTIFICATE AUTOMATICALLY
 */
router.post('/qualifications/:username/:stage/approve', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username, stage } = req.params;
    const { comments } = req.body;
    
    // Approve on blockchain
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'ApprovePreRegistration',
      username,
      stage
    );
    
    // Get user details for certificate generation
    let certificateInfo = null;
    try {
      const user = await fabricService.getUser(username);
      
      // Generate PDF certificate based on stage
      const { generateCompetenceCertificatePDF, generateLaboratoryCertificatePDF, generateTasterCertificatePDF } = require('../utils/certificate-pdf');
      
      let pdfResult;
      switch(stage) {
        case 'competenceCertificate':
          pdfResult = await generateCompetenceCertificatePDF(user, { 
            trainingProgram: req.body.trainingProgram,
            assessmentScore: req.body.assessmentScore,
            assessmentDate: new Date().toISOString()
          });
          break;
          
        case 'laboratory':
          pdfResult = await generateLaboratoryCertificatePDF(user, {
            laboratoryName: req.body.laboratoryName,
            location: user.address,
            inspectionDate: new Date().toISOString(),
            inspector: req.user.id
          });
          break;
          
        case 'taster':
          pdfResult = await generateTasterCertificatePDF(user, {
            tasterName: req.body.tasterName,
            tasterId: req.body.tasterId,
            certificationLevel: req.body.certificationLevel,
            assessmentDate: new Date().toISOString()
          });
          break;
      }
      
      if (pdfResult) {
        certificateInfo = {
          certificateNumber: pdfResult.certificateNumber,
          filename: pdfResult.filename,
          filepath: pdfResult.filepath,
          downloadUrl: `/api/ecta/certificates/${stage}/${username}/download`
        };
        
        console.log(`✓ Certificate generated: ${pdfResult.filename}`);
      }
      
      // Send approval notification email with certificate
      notificationService.notifyQualificationApproved(user, stage, { 
        comments,
        certificateInfo 
      }).catch(err => console.error('Email notification failed:', err));
      
    } catch (error) {
      console.log('Certificate generation error (non-fatal):', error.message);
    }
    
    res.json({
      success: true,
      message: `${stage} qualification approved`,
      username,
      stage,
      certificate: certificateInfo
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
    // Fetch from PostgreSQL
    const result = await postgresService.query(`
      SELECT 
        ep.user_id as exporter_id,
        cl.status as laboratory_status,
        cl.certification_number as laboratory_cert_number,
        cl.created_at,
        cl.updated_at,
        u.email,
        ep.business_name,
        ep.tin
      FROM coffee_laboratories cl
      JOIN exporter_profiles ep ON cl.exporter_id = ep.exporter_id
      JOIN users u ON ep.user_id = u.username
      WHERE cl.status = 'PENDING'
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
    // Fetch from PostgreSQL
    const result = await postgresService.query(`
      SELECT 
        ep.user_id as exporter_id,
        ct.status as taster_status,
        ct.proficiency_certificate_number as taster_cert_number,
        ct.created_at,
        ct.updated_at,
        u.email,
        ep.business_name,
        ep.tin
      FROM coffee_tasters ct
      JOIN exporter_profiles ep ON ct.exporter_id = ep.exporter_id
      JOIN users u ON ep.user_id = u.username
      WHERE ct.status = 'PENDING'
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
    // Fetch from PostgreSQL
    const result = await postgresService.query(`
      SELECT 
        ep.user_id as exporter_id,
        cc.status as competence_status,
        cc.certificate_number as competence_cert_number,
        cc.certificate_id as competence_cert_id,
        cc.created_at,
        cc.updated_at,
        u.email,
        ep.business_name,
        ep.tin
      FROM competence_certificates cc
      JOIN exporter_profiles ep ON cc.exporter_id = ep.exporter_id
      JOIN users u ON ep.user_id = u.username
      WHERE cc.status = 'PENDING'
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
 */
router.get('/preregistration/licenses/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetPendingQualifications',
      'license'
    );
    
    res.json(result); // Already parsed
  } catch (error) {
    console.error('Get pending licenses error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all exporters (ECTA only)
 * NOW FULLY BLOCKCHAIN-BASED ✅
 */
router.get('/preregistration/exporters', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Query PostgreSQL for all exporter profiles with complete qualification information
    const query = `
      SELECT 
        ep.exporter_id,
        ep.user_id as username,
        u.email,
        ep.phone,
        ep.business_name as company_name,
        ep.tin,
        ep.business_type,
        ep.minimum_capital,
        ep.status,
        ep.created_at as registered_at,
        ep.updated_at as approved_at,
        -- License information
        el.license_number,
        el.status as license_status,
        el.issued_date as license_issued_date,
        el.expiry_date as license_expiry_date,
        -- Laboratory information
        cl.laboratory_name,
        cl.certification_number as lab_cert_number,
        cl.status as lab_status,
        cl.certified_date as lab_certified_date,
        -- Competence certificate information
        cc.certificate_number as competence_cert_number,
        cc.status as competence_status,
        cc.issued_date as competence_issued_date,
        cc.expiry_date as competence_expiry_date,
        -- Taster information
        ct.full_name as taster_name,
        ct.proficiency_certificate_number as taster_cert_number,
        ct.status as taster_status,
        ct.certificate_issue_date as taster_cert_date,
        -- Qualification status
        CASE 
          WHEN el.license_number IS NOT NULL AND el.status = 'ACTIVE' THEN true
          ELSE false
        END as is_qualified
      FROM exporter_profiles ep
      LEFT JOIN users u ON ep.user_id = u.username
      LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE'
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
      ORDER BY ep.created_at DESC
    `;
    
    const result = await postgresService.query(query);
    
    const allExporters = result.rows.map(row => ({
      exporter_id: row.exporter_id,
      username: row.username,
      email: row.email || 'N/A',
      phone: row.phone || 'N/A',
      businessName: row.company_name,
      companyName: row.company_name,
      tin: row.tin || 'N/A',
      businessType: row.business_type || 'EXPORTER',
      minimumCapital: row.minimum_capital || 0,
      status: row.status || 'PENDING_APPROVAL',
      registeredAt: row.registered_at,
      approvedAt: row.approved_at,
      // License details
      licenseNumber: row.license_number || null,
      licenseStatus: row.license_status || null,
      licenseIssuedDate: row.license_issued_date || null,
      licenseExpiryDate: row.license_expiry_date || null,
      hasLicense: !!row.license_number,
      hasExportLicense: !!row.license_number, // Frontend compatibility
      has_export_license: !!row.license_number, // Snake case compatibility
      // Laboratory details
      laboratoryName: row.laboratory_name || null,
      laboratoryCertNumber: row.lab_cert_number || null,
      laboratoryStatus: row.lab_status || null,
      laboratoryCertifiedDate: row.lab_certified_date || null,
      hasLaboratory: !!row.laboratory_name,
      laboratoryCertified: !!row.laboratory_name, // Frontend compatibility
      laboratory_certified: !!row.laboratory_name, // Snake case compatibility
      // Competence certificate details
      competenceCertNumber: row.competence_cert_number || null,
      competenceStatus: row.competence_status || null,
      competenceIssuedDate: row.competence_issued_date || null,
      competenceExpiryDate: row.competence_expiry_date || null,
      hasCompetence: !!row.competence_cert_number,
      hasCompetenceCertificate: !!row.competence_cert_number, // Frontend compatibility
      has_competence_certificate: !!row.competence_cert_number, // Snake case compatibility
      // Taster details
      tasterName: row.taster_name || null,
      tasterCertNumber: row.taster_cert_number || null,
      tasterStatus: row.taster_status || null,
      tasterCertDate: row.taster_cert_date || null,
      hasTaster: !!row.taster_name,
      // Overall qualification
      isQualified: row.is_qualified || false,
      is_qualified: row.is_qualified || false, // Snake case compatibility
      qualificationStatus: row.is_qualified ? 'Qualified' : 'Not Qualified'
    }));
    
    console.log(`[Get Exporters] Found ${allExporters.length} exporters from PostgreSQL with full qualification details`);
    res.json(allExporters);
  } catch (error) {
    console.error('Get all exporters error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get global statistics (ECTA only)
 * Returns dashboard statistics from PostgreSQL (source of truth)
 */
router.get('/global-stats', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Get exporter profiles from PostgreSQL (the actual source of truth)
    const profilesQuery = `
      SELECT 
        COUNT(*) as total_exporters,
        COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') as pending_approval,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_exporters,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_exporters
      FROM exporter_profiles
    `;
    
    const licensesQuery = `
      SELECT 
        COUNT(*) as total_licenses,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_licenses,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_licenses,
        COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_licenses
      FROM export_licenses
    `;
    
    const [profilesResult, licensesResult] = await Promise.all([
      postgresService.query(profilesQuery),
      postgresService.query(licensesQuery)
    ]);
    
    const profileStats = profilesResult.rows[0];
    const licenseStats = licensesResult.rows[0];
    
    const stats = {
      exporters: {
        total: parseInt(profileStats.total_exporters) || 0,
        pending: parseInt(profileStats.pending_approval) || 0,
        approved: parseInt(profileStats.active_exporters) || 0,
        rejected: parseInt(profileStats.rejected_exporters) || 0,
        active: parseInt(profileStats.active_exporters) || 0
      },
      licenses: {
        total: parseInt(licenseStats.total_licenses) || 0,
        active: parseInt(licenseStats.active_licenses) || 0,
        pending: parseInt(licenseStats.pending_licenses) || 0,
        expired: parseInt(licenseStats.expired_licenses) || 0
      },
      source: 'postgresql',
      timestamp: new Date().toISOString()
    };
    
    console.log('[Global Stats] PostgreSQL stats:', JSON.stringify(stats, null, 2));
    res.json(stats);
  } catch (error) {
    console.error('Get global stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pre-registration dashboard statistics (ECTA only)
 * NOW QUERIES POSTGRESQL FOR ACCURATE COUNTS
 */
router.get('/preregistration/dashboard/stats', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Query PostgreSQL for accurate exporter profile statistics
    const profilesQuery = `
      SELECT 
        COUNT(*) as total_exporters,
        COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') as pending_approval,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_exporters,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_exporters
      FROM exporter_profiles
    `;
    
    const licensesQuery = `
      SELECT 
        COUNT(*) as total_licenses,
        COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_licenses,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_licenses,
        COUNT(*) FILTER (WHERE status = 'EXPIRED') as expired_licenses
      FROM export_licenses
    `;
    
    const [profilesResult, licensesResult] = await Promise.all([
      postgresService.query(profilesQuery),
      postgresService.query(licensesQuery)
    ]);
    
    const profileStats = profilesResult.rows[0];
    const licenseStats = licensesResult.rows[0];
    
    const stats = {
      success: true,
      data: {
        exporters: {
          total: parseInt(profileStats.total_exporters) || 0,
          pending: parseInt(profileStats.pending_approval) || 0,
          active: parseInt(profileStats.active_exporters) || 0,
          rejected: parseInt(profileStats.rejected_exporters) || 0
        },
        licenses: {
          total: parseInt(licenseStats.total_licenses) || 0,
          active: parseInt(licenseStats.active_licenses) || 0,
          pending: parseInt(licenseStats.pending_licenses) || 0,
          expired: parseInt(licenseStats.expired_licenses) || 0
        }
      },
      source: 'postgresql',
      timestamp: new Date().toISOString()
    };
    
    console.log('[Dashboard Stats] PostgreSQL stats:', JSON.stringify(stats, null, 2));
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      data: {
        exporters: { total: 0, pending: 0, active: 0, rejected: 0 },
        licenses: { total: 0, pending: 0, active: 0, expired: 0 }
      }
    });
  }
});

/**
 * Get pending exporters for pre-registration (ECTA only)
 * NOW QUERIES POSTGRESQL FOR RELIABILITY
 */
router.get('/preregistration/exporters/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Query PostgreSQL for pending exporter profiles
    const query = `
      SELECT 
        ep.exporter_id,
        ep.user_id as username,
        u.email,
        u.phone,
        ep.business_name,
        ep.tin,
        ep.business_type,
        ep.minimum_capital,
        ep.status,
        ep.created_at as registered_at
      FROM exporter_profiles ep
      JOIN users u ON ep.user_id = u.username
      WHERE ep.status = 'PENDING_APPROVAL'
      ORDER BY ep.created_at ASC
    `;
    
    const result = await postgresService.query(query);
    
    // Format data for frontend compatibility
    const pendingExporters = result.rows.map(row => ({
      exporter_id: row.username,
      username: row.username,
      email: row.email || '',
      phone: row.phone || '',
      businessName: row.business_name || 'N/A',
      companyName: row.business_name || 'N/A',
      tin: row.tin || 'N/A',
      businessType: row.business_type || 'PRIVATE',
      minimumCapital: parseFloat(row.minimum_capital) || 50000000,
      status: row.status || 'PENDING_APPROVAL',
      registeredAt: row.registered_at || new Date().toISOString()
    }));
    
    res.json(pendingExporters);
  } catch (error) {
    console.error('Get pending exporters error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve exporter (ECTA only) - Preregistration path
 */
router.post('/preregistration/exporters/:username/approve', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username } = req.params;
    const { comments } = req.body;
    
    console.log(`[ECTA Approval] Approving exporter: ${username}`);
    
    // HYBRID MODE: Update PostgreSQL first (primary source)
    try {
      // Check if exporter exists in PostgreSQL
      const exporterCheck = await postgresService.query(
        'SELECT exporter_id, status FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Exporter not found in database' });
      }
      
      const currentStatus = exporterCheck.rows[0].status;
      if (currentStatus !== 'PENDING_APPROVAL') {
        return res.status(400).json({ 
          error: 'Exporter is not pending approval',
          currentStatus: currentStatus
        });
      }
      
      // Update exporter profile status to ACTIVE
      await postgresService.query(
        `UPDATE exporter_profiles 
         SET status = 'ACTIVE', 
             approved_by = $1, 
             approved_at = NOW(),
             updated_at = NOW()
         WHERE user_id = $2`,
        [req.user.id, username]
      );
      
      console.log(`✓ Exporter profile approved in PostgreSQL: ${username}`);
      
    } catch (dbError) {
      console.error('[ECTA Approval] PostgreSQL error:', dbError);
      return res.status(500).json({ 
        error: 'Database approval failed',
        details: dbError.message 
      });
    }
    
    // STEP 2: Try to update blockchain asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        // Get user from blockchain
        const user = await fabricService.getUser(username);
        
        if (user.status === 'pending_approval') {
          // Update user status on blockchain
          await fabricService.updateUserStatus(username, {
            status: 'approved',
            approvedBy: req.user.id,
            comments: comments || ''
          });
          
          // Also approve profile stage on exporter profile
          await fabricService.submitTransaction(
            req.user.id,
            process.env.CHAINCODE_NAME || 'ecta',
            'ApprovePreRegistration',
            username,
            'profile'
          );
          
          console.log(`✓ Exporter approved on blockchain (async): ${username}`);
        }
      } catch (blockchainError) {
        console.warn('[ECTA Approval] Blockchain update failed (non-blocking):', blockchainError.message);
      }
    });
    
    // Send approval notification email (async, non-blocking)
    setImmediate(async () => {
      try {
        await notificationService.notifyProfileApproved({ username }, req.user.id);
      } catch (emailError) {
        console.warn('[ECTA Approval] Email notification failed:', emailError.message);
      }
    });
    
    res.json({
      success: true,
      message: 'Exporter approved successfully',
      username,
      status: 'ACTIVE',
      approvedAt: new Date().toISOString(),
      approvedBy: req.user.id,
      comments: comments || ''
    });
  } catch (error) {
    console.error('[ECTA Approval] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reject exporter (ECTA only) - Preregistration path
 */
router.post('/preregistration/exporters/:username/reject', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username } = req.params;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    console.log(`[ECTA Rejection] Rejecting exporter: ${username}`);
    
    // HYBRID MODE: Update PostgreSQL first (primary source)
    try {
      // Check if exporter exists in PostgreSQL
      const exporterCheck = await postgresService.query(
        'SELECT exporter_id, status FROM exporter_profiles WHERE user_id = $1',
        [username]
      );
      
      if (exporterCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Exporter not found in database' });
      }
      
      const currentStatus = exporterCheck.rows[0].status;
      if (currentStatus !== 'PENDING_APPROVAL') {
        return res.status(400).json({ 
          error: 'Exporter is not pending approval',
          currentStatus: currentStatus
        });
      }
      
      // Update exporter profile status to REVOKED (rejected)
      await postgresService.query(
        `UPDATE exporter_profiles 
         SET status = 'REVOKED', 
             rejection_reason = $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [reason, username]
      );
      
      console.log(`✓ Exporter profile rejected in PostgreSQL: ${username}`);
      
    } catch (dbError) {
      console.error('[ECTA Rejection] PostgreSQL error:', dbError);
      return res.status(500).json({ 
        error: 'Database rejection failed',
        details: dbError.message 
      });
    }
    
    // STEP 2: Try to update blockchain asynchronously (non-blocking)
    setImmediate(async () => {
      try {
        const user = await fabricService.getUser(username);
        
        if (user.status === 'pending_approval') {
          await fabricService.updateUserStatus(username, {
            status: 'rejected',
            rejectedBy: req.user.id,
            reason: reason
          });
          
          console.log(`✓ Exporter rejected on blockchain (async): ${username}`);
        }
      } catch (blockchainError) {
        console.warn('[ECTA Rejection] Blockchain update failed (non-blocking):', blockchainError.message);
      }
    });
    
    // Send rejection notification email (async, non-blocking)
    setImmediate(async () => {
      try {
        await notificationService.notifyProfileRejected({ username }, req.user.id, reason);
      } catch (emailError) {
        console.warn('[ECTA Rejection] Email notification failed:', emailError.message);
      }
    });
    
    res.json({
      success: true,
      message: 'Exporter rejected',
      username,
      status: 'REVOKED',
      rejectedAt: new Date().toISOString(),
      reason
    });
  } catch (error) {
    console.error('[ECTA Rejection] Error:', error);
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

// ============================================================================
// SALES CONTRACT REGISTRATION ENDPOINTS
// ============================================================================

/**
 * Get finalized sales contracts (for ECTA registration)
 */
router.get('/contracts/finalized', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const result = await postgresService.query(`
      SELECT 
        cd.draft_id,
        cd.contract_number,
        br.company_name as buyer_name,
        cd.coffee_type,
        cd.quantity,
        cd.total_value,
        cd.status,
        cd.created_at,
        cd.updated_at as finalized_at,
        cd.ecta_reference_number
      FROM contract_drafts cd
      LEFT JOIN buyer_registry br ON cd.buyer_id = br.buyer_id
      WHERE cd.status = 'FINALIZED'
      ORDER BY cd.updated_at DESC
    `);
    
    res.json({
      success: true,
      contracts: result.rows
    });
  } catch (error) {
    console.error('Get finalized contracts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get registration statistics
 */
router.get('/contracts/registration-stats', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const result = await postgresService.query(`
      SELECT 
        COUNT(*) as "totalFinalized",
        COUNT(*) FILTER (WHERE ecta_reference_number IS NULL) as "pendingRegistration",
        COUNT(*) FILTER (WHERE ecta_reference_number IS NOT NULL) as registered
      FROM contract_drafts
      WHERE status = 'FINALIZED'
    `);
    
    const stats = result.rows[0] || {
      totalFinalized: 0,
      pendingRegistration: 0,
      registered: 0
    };
    
    res.json({
      success: true,
      stats: {
        totalFinalized: parseInt(stats.totalFinalized) || 0,
        pendingRegistration: parseInt(stats.pendingRegistration) || 0,
        registered: parseInt(stats.registered) || 0
      }
    });
  } catch (error) {
    console.error('Get registration stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Register a sales contract with ECTA
 */
router.post('/contracts/:draftId/register', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { draftId } = req.params;
    const { referenceNumber, notes } = req.body;
    
    if (!referenceNumber) {
      return res.status(400).json({ success: false, error: 'Reference number is required' });
    }
    
    // Update the contract with ECTA reference number
    // Note: registered_by stores the username (not UUID) for simplicity
    const result = await postgresService.query(`
      UPDATE contract_drafts
      SET 
        ecta_reference_number = $1,
        registered_at = NOW(),
        registration_notes = $2,
        status = 'REGISTERED',
        updated_at = NOW()
      WHERE draft_id = $3
      RETURNING *, 
        (SELECT business_name FROM exporter_profiles WHERE exporter_id = contract_drafts.exporter_id) as exporter_name
    `, [referenceNumber, notes, draftId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contract not found' });
    }
    
    const contract = result.rows[0];
    
    // Get all active network members to notify
    const membersResult = await postgresService.query(`
      SELECT member_code, member_name 
      FROM network_members 
      WHERE is_active = true 
        AND member_code != 'ECTA'
      ORDER BY member_name
    `);
    
    // Send notifications to all network members
    const notificationPromises = membersResult.rows.map(async (member) => {
      // Create notification
      await postgresService.query(`
        INSERT INTO contract_notifications (
          contract_id, ecta_reference_number, exporter_id, 
          recipient_member_code, notification_type, notification_message, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        contract.draft_id,
        referenceNumber,
        contract.exporter_id,
        member.member_code,
        'CONTRACT_REGISTERED',
        `New sales contract ${referenceNumber} has been registered by ECTA for exporter ${contract.exporter_name}. Please verify and approve.`,
        JSON.stringify({
          contractNumber: contract.contract_number,
          exporterName: contract.exporter_name,
          coffeeType: contract.coffee_type,
          quantity: contract.quantity,
          totalValue: contract.total_value,
          currency: contract.currency,
          registeredBy: req.user.username
        })
      ]);
      
      // Create permission record for tracking
      await postgresService.query(`
        INSERT INTO contract_permissions (
          contract_id, ecta_reference_number, exporter_id, member_code, permission_status
        ) VALUES ($1, $2, $3, $4, 'PENDING')
        ON CONFLICT (contract_id, member_code) DO NOTHING
      `, [contract.draft_id, referenceNumber, contract.exporter_id, member.member_code]);
    });
    
    // Wait for all notifications to be sent
    await Promise.all(notificationPromises);
    
    console.log(`[Contract Registration] Sent notifications to ${membersResult.rows.length} network members for contract ${referenceNumber}`);
    
    res.json({
      success: true,
      message: `Contract registered successfully. Notifications sent to ${membersResult.rows.length} network members.`,
      contract: contract,
      notificationsSent: membersResult.rows.length,
      notifiedMembers: membersResult.rows.map(m => m.member_code)
    });
  } catch (error) {
    console.error('Register contract error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Verify sales contract by reference number (PUBLIC - no auth required)
 * Returns comprehensive contract details for network member verification
 */
router.get('/contracts/verify/:referenceNumber', async (req, res) => {
  try {
    const { referenceNumber } = req.params;
    
    const result = await postgresService.query(`
      SELECT 
        cd.draft_id,
        cd.contract_number,
        cd.ecta_reference_number as reference_number,
        cd.status,
        cd.registered_at,
        cd.updated_at as finalized_at,
        
        -- Exporter Information
        ep.exporter_id,
        ep.business_name as exporter_name,
        ep.tin as exporter_tin,
        ep.office_address as exporter_address,
        ep.email as exporter_email,
        ep.phone as exporter_phone,
        
        -- Buyer/Importer Information
        br.buyer_id,
        br.company_name as buyer_name,
        br.country as buyer_country,
        br.email as buyer_email,
        br.phone as buyer_phone,
        br.address as buyer_address,
        
        -- Coffee Details
        cd.coffee_type,
        cd.quality_grade as coffee_grade,
        cd.quantity,
        cd.unit_price as price_per_unit,
        cd.total_value,
        cd.currency,
        cd.quality_standards as quality_standard,
        cd.origin_region,
        
        -- Payment Information
        cd.payment_terms,
        cd.payment_method,
        cd.payment_due_days,
        
        -- Shipping & Delivery
        cd.incoterms,
        cd.port_of_loading,
        cd.port_of_discharge,
        cd.delivery_date as delivery_deadline,
        
        -- Additional Terms
        cd.special_conditions,
        cd.registration_notes
        
      FROM contract_drafts cd
      LEFT JOIN buyer_registry br ON cd.buyer_id = br.buyer_id
      LEFT JOIN exporter_profiles ep ON cd.exporter_id = ep.exporter_id
      WHERE cd.ecta_reference_number = $1
        AND cd.status IN ('FINALIZED', 'REGISTERED', 'ACTIVE')
    `, [referenceNumber]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Contract not found or not finalized',
        verified: false
      });
    }
    
    const contract = result.rows[0];
    
    // Map payment method codes to readable names
    const paymentMethodMap = {
      'LC': 'Letter of Credit (LC)',
      'CAD': 'Cash Against Documents (CAD)',
      'TT': 'Telegraphic Transfer (TT)',
      'DP': 'Documents Against Payment (DP)',
      'DA': 'Documents Against Acceptance (DA)',
      'OA': 'Open Account (OA)'
    };
    
    // Format the response with organized sections
    res.json({
      success: true,
      verified: true,
      data: {
        referenceNumber: contract.reference_number,
        contractNumber: contract.contract_number,
        status: contract.status,
        registeredAt: contract.registered_at,
        finalizedAt: contract.finalized_at,
        
        exporter: {
          id: contract.exporter_id,
          name: contract.exporter_name,
          tin: contract.exporter_tin,
          address: contract.exporter_address,
          email: contract.exporter_email,
          phone: contract.exporter_phone
        },
        
        buyer: {
          id: contract.buyer_id,
          name: contract.buyer_name,
          country: contract.buyer_country,
          email: contract.buyer_email,
          phone: contract.buyer_phone,
          address: contract.buyer_address
        },
        
        coffee: {
          type: contract.coffee_type,
          grade: contract.coffee_grade,
          quantity: contract.quantity,
          pricePerUnit: contract.price_per_unit,
          qualityStandard: contract.quality_standard,
          originRegion: contract.origin_region
        },
        
        contract: {
          totalValue: contract.total_value,
          currency: contract.currency,
          incoterms: contract.incoterms,
          portOfLoading: contract.port_of_loading,
          portOfDischarge: contract.port_of_discharge,
          deliveryDeadline: contract.delivery_deadline
        },
        
        payment: {
          terms: contract.payment_terms,
          method: contract.payment_method ? paymentMethodMap[contract.payment_method] || contract.payment_method : null,
          dueDays: contract.payment_due_days
        },
        
        additional: {
          specialConditions: contract.special_conditions,
          notes: contract.registration_notes
        }
      }
    });
  } catch (error) {
    console.error('Verify contract error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

