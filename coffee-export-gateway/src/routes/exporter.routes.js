const express = require('express');
const router = express.Router();
const fabricService = require('../services');
const postgresService = require('../services/postgres');
const { authenticateToken, requireAdmin, requireRole } = require('../middleware/auth');
const { createUser } = require('./auth.routes');
const { 
  generateCompetenceCertificate, 
  generateExportLicense, 
  generateLaboratoryCertificate, 
  generateTasterCertificate 
} = require('../utils/certificate-pdf-compact');

/**
 * Register new exporter (ADMIN ONLY)
 */
router.post('/register', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, companyName, tin, capitalETB, licenseNumber } = req.body;

    if (!username || !password || !companyName || !tin) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Register with Fabric CA
    await fabricService.registerExporter(username, { companyName, tin });

    // Create user in local system
    await createUser(username, password, companyName, 'exporter');

    // Submit pre-registration to chaincode
    const preRegData = {
      exporterId: username,
      companyName,
      tin,
      capitalETB: capitalETB || 0,
      licenseNumber: licenseNumber || '',
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    const result = await fabricService.submitTransaction(
      'admin',
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitPreRegistration',
      JSON.stringify(preRegData)
    );

    res.json({
      success: true,
      message: 'Exporter registered successfully',
      exporterId: username,
      txResult: result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get exporter profile (with or without exporterId parameter)
 */
router.get('/profile/:exporterId?', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.params.exporterId || req.user.id;
    
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterProfile',
      exporterId
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update exporter profile (with or without exporterId parameter)
 */
router.put('/profile/:exporterId?', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.params.exporterId || req.user.id;
    const updates = req.body;
    
    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'UpdateExporterProfile',
      exporterId,
      JSON.stringify(updates)
    );

    res.json({
      success: true,
      message: 'Profile updated',
      txResult: result
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit pre-registration
 */
router.post('/pre-registration', authenticateToken, async (req, res) => {
  try {
    const preRegData = {
      exporterId: req.body.exporterId || req.user.id,
      companyName: req.body.companyName,
      tin: req.body.tin,
      capitalETB: req.body.capitalETB || 0,
      licenseNumber: req.body.licenseNumber || '',
      licenseType: req.body.licenseType || 'export',
      licenseIssuedDate: req.body.licenseIssuedDate || null,
      licenseExpiryDate: req.body.licenseExpiryDate || null,
      address: req.body.address || '',
      contactPerson: req.body.contactPerson || '',
      phone: req.body.phone || '',
      email: req.body.email || ''
    };

    const result = await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitPreRegistration',
      JSON.stringify(preRegData)
    );

    res.json({
      success: true,
      message: 'Pre-registration submitted',
      result: JSON.parse(result)
    });
  } catch (error) {
    console.error('Pre-registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Check license expiry
 */
router.get('/license/expiry/:exporterId', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.params.exporterId;
    
    try {
      const result = await fabricService.evaluateTransaction(
        req.user.id,
        process.env.CHAINCODE_NAME || 'ecta',
        'CheckLicenseExpiry',
        exporterId
      );

      res.json(JSON.parse(result));
    } catch (error) {
      // If exporter doesn't exist, return default status
      if (error.message.includes('does not exist')) {
        res.json({
          status: 'no_profile',
          message: 'Exporter profile not found. Please complete pre-registration.',
          daysUntilExpiry: null
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('License expiry check error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get exporter statistics
 */
router.get('/statistics/:exporterId', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.params.exporterId;
    
    // Get all exports for this exporter
    const exportsResult = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetExporterExports',
      exporterId
    );
    
    const exports = JSON.parse(exportsResult);
    
    // Calculate statistics
    const stats = {
      totalExports: exports.length,
      activeExports: exports.filter(e => e.record.status !== 'completed' && e.record.status !== 'rejected').length,
      completedExports: exports.filter(e => e.record.status === 'completed').length,
      totalValue: exports.reduce((sum, e) => sum + (e.record.estimatedValue || 0), 0)
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get exporter dashboard data - FIXED VERSION
 * Uses proper SQL JOINs and filters by ACTIVE status
 */
router.get('/dashboard', authenticateToken, requireRole('exporter', 'admin'), async (req, res) => {
  try {
    const exporterId = req.user.id || req.user.username;
    
    console.log(`[Dashboard] Fetching dashboard for exporter: ${exporterId}`);
    
    // Single comprehensive query with proper JOINs
    const dashboardQuery = `
      SELECT 
        ep.exporter_id,
        ep.user_id,
        ep.business_name,
        ep.tin,
        ep.registration_number,
        ep.business_type,
        ep.minimum_capital,
        ep.office_address,
        ep.city,
        ep.region,
        ep.contact_person,
        ep.email,
        ep.phone,
        ep.status as profile_status,
        ep.created_at,
        ep.updated_at,
        u.email as user_email,
        cl.laboratory_id,
        cl.laboratory_name,
        cl.certification_number as lab_cert_number,
        cl.status as lab_status,
        ct.taster_id,
        ct.full_name as taster_name,
        ct.proficiency_certificate_number as taster_cert_number,
        ct.status as taster_status,
        cc.certificate_id as competence_cert_id,
        cc.certificate_number as competence_cert_number,
        cc.status as competence_status,
        cc.issued_date as competence_issued_date,
        cc.expiry_date as competence_expiry_date,
        el.license_id,
        el.license_number,
        el.status as license_status,
        el.issued_date as license_issued_date,
        el.expiry_date as license_expiry_date
      FROM exporter_profiles ep
      LEFT JOIN users u ON ep.user_id = u.username
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
      LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE'
      WHERE ep.user_id = $1 OR u.username = $1
      LIMIT 1
    `;
    
    const result = await postgresService.query(dashboardQuery, [exporterId]);
    
    if (result.rows.length === 0) {
      console.log(`[Dashboard] No exporter profile found for ${exporterId}`);
      return res.status(404).json({ 
        error: 'Exporter profile not found',
        exporterId: exporterId
      });
    }
    
    const row = result.rows[0];
    
    // Validate profile is ACTIVE
    if (row.profile_status !== 'ACTIVE') {
      console.log(`[Dashboard] Profile status is ${row.profile_status}, not ACTIVE`);
    }
    
    // Build comprehensive dashboard response
    const dashboardData = {
      identity: {
        exporterId: row.user_id,
        businessName: row.business_name,
        tin: row.tin,
        registrationNumber: row.registration_number,
        businessType: row.business_type,
        createdAt: row.created_at
      },
      contact: {
        contactPerson: row.contact_person,
        email: row.email || row.user_email,
        phone: row.phone,
        officeAddress: row.office_address,
        city: row.city,
        region: row.region
      },
      compliance: {
        profileStatus: row.profile_status,
        profileApproved: row.profile_status === 'ACTIVE',
        capitalVerified: row.profile_status === 'ACTIVE',
        capitalAmount: row.minimum_capital,
        
        // Laboratory
        laboratoryStatus: row.lab_status || 'MISSING',
        laboratoryApproved: row.lab_status === 'ACTIVE',
        laboratoryCertNumber: row.lab_cert_number,
        laboratoryId: row.laboratory_id,
        laboratoryName: row.laboratory_name,
        
        // Taster
        tasterStatus: row.taster_status || 'MISSING',
        tasterApproved: row.taster_status === 'ACTIVE',
        tasterCertNumber: row.taster_cert_number,
        tasterId: row.taster_id,
        tasterName: row.taster_name,
        
        // Competence Certificate
        competenceStatus: row.competence_status || 'MISSING',
        competenceApproved: row.competence_status === 'ACTIVE',
        competenceCertNumber: row.competence_cert_number,
        competenceCertId: row.competence_cert_id,
        competenceIssuedDate: row.competence_issued_date,
        competenceExpiryDate: row.competence_expiry_date,
        
        // Export License
        licenseStatus: row.license_status || 'MISSING',
        licenseApproved: row.license_status === 'ACTIVE',
        licenseNumber: row.license_number,
        licenseId: row.license_id,
        licenseIssuedDate: row.license_issued_date,
        licenseExpiryDate: row.license_expiry_date,
        
        // Overall qualification status
        isFullyQualified: row.profile_status === 'ACTIVE' && 
                         row.lab_status === 'ACTIVE' && 
                         row.taster_status === 'ACTIVE' && 
                         row.competence_status === 'ACTIVE' && 
                         row.license_status === 'ACTIVE'
      },
      documents: {
        registrationNumber: row.registration_number,
        laboratoryCertificationNumber: row.lab_cert_number || null,
        tasterCertificateNumber: row.taster_cert_number || null,
        competenceCertificateNumber: row.competence_cert_number || null,
        competenceCertificateId: row.competence_cert_id || null,
        exportLicenseNumber: row.license_number || null,
        exportLicenseId: row.license_id || null,
        eicRegistrationNumber: null
      },
      validation: {
        isValid: row.profile_status === 'ACTIVE' && row.lab_status === 'ACTIVE' && row.taster_status === 'ACTIVE' && row.competence_status === 'ACTIVE' && row.license_status === 'ACTIVE',
        issues: [],
        requiredActions: []
      },
      metadata: {
        lastUpdated: row.updated_at || new Date().toISOString(),
        createdAt: row.created_at || new Date().toISOString()
      },
      qualificationProgress: {
        profileComplete: row.profile_status === 'ACTIVE',
        laboratoryComplete: row.lab_status === 'ACTIVE',
        tasterComplete: row.taster_status === 'ACTIVE',
        competenceComplete: row.competence_status === 'ACTIVE',
        licenseComplete: row.license_status === 'ACTIVE',
        overallProgress: calculateProgress(row)
      }
    };
    
    console.log(`[Dashboard] Successfully fetched dashboard for ${exporterId}`);
    res.json(dashboardData);
    
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data', 
      details: error.message 
    });
  }
});

/**
 * Calculate overall qualification progress
 */
function calculateProgress(row) {
  let completed = 0;
  const total = 5;
  
  if (row.profile_status === 'ACTIVE') completed++;
  if (row.lab_status === 'ACTIVE') completed++;
  if (row.taster_status === 'ACTIVE') completed++;
  if (row.competence_status === 'ACTIVE') completed++;
  if (row.license_status === 'ACTIVE') completed++;
  
  return Math.round((completed / total) * 100);
}

/**
        metadata: {
          lastUpdated: profile.updatedAt || new Date().toISOString(),
          createdAt: profile.createdAt || new Date().toISOString(),
          profileStatus: profile.status,
          approvalDate: profileApproved ? profile.updatedAt : null
        }
      };

    console.log(`[Dashboard] Returning dashboard data for ${exporterId}`);
    res.json(dashboardData);
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data', details: error.message });
  }
});

/**
 * Get exporter applications
 */
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Helper function to extract status string
    const getStatusString = (status) => {
      if (!status) return 'pending';
      if (typeof status === 'string') return status;
      if (typeof status === 'object' && status.status) return status.status;
      return 'pending';
    };
    
    // Get exporter profile to check application status
    let applications = [];
    try {
      const profileResult = await fabricService.evaluateTransaction(
        exporterId,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterProfile',
        exporterId
      );
      const profile = JSON.parse(profileResult);
      
      // Build applications list from profile
      if (profile.preRegistrationStatus) {
        const preReg = profile.preRegistrationStatus;
        
        if (preReg.profile) {
          applications.push({
            id: 'profile',
            type: 'Profile Registration',
            status: getStatusString(preReg.profile),
            submittedAt: profile.submittedAt || new Date().toISOString()
          });
        }
        
        if (preReg.laboratory) {
          applications.push({
            id: 'laboratory',
            type: 'Laboratory Registration',
            status: getStatusString(preReg.laboratory),
            submittedAt: profile.submittedAt || new Date().toISOString()
          });
        }
        
        if (preReg.taster) {
          applications.push({
            id: 'taster',
            type: 'Taster Registration',
            status: getStatusString(preReg.taster),
            submittedAt: profile.submittedAt || new Date().toISOString()
          });
        }
        
        if (preReg.competenceCertificate) {
          applications.push({
            id: 'competence',
            type: 'Competence Certificate',
            status: getStatusString(preReg.competenceCertificate),
            submittedAt: profile.submittedAt || new Date().toISOString()
          });
        }
        
        if (preReg.license) {
          applications.push({
            id: 'license',
            type: 'Export License',
            status: getStatusString(preReg.license),
            submittedAt: profile.submittedAt || new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.log('No profile found for exporter:', exporterId);
    }
    
    res.json(applications);
  } catch (error) {
    console.error('Applications error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get qualification status (Exporter Portal)
 * Returns the current status of all qualification steps
 */
router.get('/qualification-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Initialize default status
    const status = {
      profile: {
        complete: false,
        status: 'pending'
      },
      laboratory: {
        registered: false,
        certified: false,
        certificationNumber: null,
        expiryDate: null
      },
      taster: {
        registered: false,
        verified: false,
        verificationNumber: null
      },
      competenceCertificate: {
        applied: false,
        valid: false,
        certificateNumber: null,
        certificate_id: null,
        issueDate: null,
        expiryDate: null
      },
      exportLicense: {
        applied: false,
        valid: false,
        licenseNumber: null,
        license_id: null,
        issueDate: null,
        expiryDate: null
      },
      overallStatus: 'incomplete'
    };
    
    try {
      // Get exporter profile from PostgreSQL
      const profileResult = await postgresService.query(
        'SELECT * FROM exporter_profiles WHERE user_id = $1',
        [userId]
      );
      
      if (profileResult.rows.length === 0) {
        return res.json(status);
      }
      
      const profile = profileResult.rows[0];
      const exporterId = profile.exporter_id;
      
      status.profile.complete = true;
      status.profile.status = profile.status.toLowerCase();
      
      // Get laboratory status
      const labResult = await postgresService.query(
        'SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND status = $2 LIMIT 1',
        [exporterId, 'ACTIVE']
      );
      
      if (labResult.rows.length > 0) {
        const lab = labResult.rows[0];
        status.laboratory.registered = true;
        status.laboratory.certified = true;
        status.laboratory.certificationNumber = lab.certification_number;
        status.laboratory.expiryDate = lab.expiry_date;
      }
      
      // Get taster status
      const tasterResult = await postgresService.query(
        'SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND status = $2 LIMIT 1',
        [exporterId, 'ACTIVE']
      );
      
      if (tasterResult.rows.length > 0) {
        const taster = tasterResult.rows[0];
        status.taster.registered = true;
        status.taster.verified = true;
        status.taster.verificationNumber = taster.proficiency_certificate_number;
      }
      
      // Get competence certificate status
      const certResult = await postgresService.query(
        'SELECT * FROM competence_certificates WHERE exporter_id = $1 AND status = $2 LIMIT 1',
        [exporterId, 'ACTIVE']
      );
      
      if (certResult.rows.length > 0) {
        const cert = certResult.rows[0];
        status.competenceCertificate.applied = true;
        status.competenceCertificate.valid = true;
        status.competenceCertificate.certificateNumber = cert.certificate_number;
        status.competenceCertificate.certificate_id = cert.certificate_id;
        status.competenceCertificate.issueDate = cert.issued_date;
        status.competenceCertificate.expiryDate = cert.expiry_date;
      }
      
      // Get export license status
      const licenseResult = await postgresService.query(
        'SELECT * FROM export_licenses WHERE exporter_id = $1 AND status = $2 LIMIT 1',
        [exporterId, 'ACTIVE']
      );
      
      if (licenseResult.rows.length > 0) {
        const license = licenseResult.rows[0];
        status.exportLicense.applied = true;
        status.exportLicense.valid = true;
        status.exportLicense.licenseNumber = license.license_number;
        status.exportLicense.license_id = license.license_id;
        status.exportLicense.issueDate = license.issued_date;
        status.exportLicense.expiryDate = license.expiry_date;
      }
      
      // Determine overall status
      if (status.exportLicense.valid) {
        status.overallStatus = 'qualified';
      } else if (status.competenceCertificate.valid) {
        status.overallStatus = 'competence_certified';
      } else if (status.laboratory.certified && status.taster.verified) {
        status.overallStatus = 'ready_for_competence';
      } else if (status.laboratory.registered || status.taster.registered) {
        status.overallStatus = 'in_progress';
      } else {
        status.overallStatus = 'profile_complete';
      }
    } catch (error) {
      console.error('Error fetching qualification status:', error);
      // Return default status on error
    }
    
    res.json(status);
  } catch (error) {
    console.error('Qualification status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register laboratory (Exporter Portal)
 * AUTO-APPROVES immediately upon submission
 */
router.post('/laboratory/register', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Auto-generate certificate info for auto-approval
    const timestamp = Date.now();
    const certificateNumber = `LAB-${timestamp}`;
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    const laboratoryData = {
      exporterId,
      ...req.body,
      certificateNumber,
      validUntil: oneYearLater.toISOString(),
      submittedAt: new Date().toISOString()
    };
    
    console.log('[Laboratory Registration] Request:', { exporterId, certificateNumber });
    
    // Get exporter UUID from username
    const exporterQuery = `SELECT exporter_id FROM exporter_profiles WHERE user_id = $1`;
    const exporterResult = await postgresService.query(exporterQuery, [exporterId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUUID = exporterResult.rows[0].exporter_id;
    
    // Insert into coffee_laboratories table
    const insertQuery = `
      INSERT INTO coffee_laboratories (
        exporter_id, certificate_number, status, created_at, updated_at
      ) VALUES ($1, $2, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (exporter_id) DO UPDATE
      SET certificate_number = $2, status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await postgresService.query(insertQuery, [exporterUUID, certificateNumber]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Failed to register laboratory' });
    }
    
    console.log('[Laboratory Registration] AUTO-APPROVED:', result.rows[0]);
    
    // Optionally sync to blockchain if enabled
    if (process.env.BLOCKCHAIN_SYNC === 'true') {
      try {
        await fabricService.invokeChaincode(
          'SubmitQualificationDocument',
          JSON.stringify({ ...laboratoryData, stage: 'laboratory', status: 'approved' })
        );
        console.log('[Laboratory Registration] Blockchain sync successful');
      } catch (blockchainError) {
        console.error('[Laboratory Registration] Blockchain sync failed (non-critical):', blockchainError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Laboratory registration auto-approved successfully',
      status: 'approved',
      certificateNumber,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Laboratory registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register taster (Exporter Portal)
 * Requires: Laboratory approved
 * AUTO-APPROVES immediately upon submission
 */
router.post('/taster/register', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter UUID from username
    const exporterQuery = `SELECT exporter_id FROM exporter_profiles WHERE user_id = $1`;
    const exporterResult = await postgresService.query(exporterQuery, [exporterId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUUID = exporterResult.rows[0].exporter_id;
    
    // Check prerequisites: Laboratory must be approved
    const checkQuery = `SELECT * FROM coffee_laboratories WHERE exporter_id = $1`;
    const checkResult = await postgresService.query(checkQuery, [exporterUUID]);
    
    if (checkResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Laboratory must be registered before registering taster',
        requiredStep: 'laboratory_registration'
      });
    }
    
    // Auto-generate certificate info
    const timestamp = Date.now();
    const certificateNumber = `TASTER-${timestamp}`;
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    const tasterData = {
      exporterId,
      ...req.body,
      certificateNumber,
      validUntil: oneYearLater.toISOString(),
      submittedAt: new Date().toISOString()
    };
    
    console.log('[Taster Registration] Request:', { exporterId, certificateNumber });
    
    // Insert into coffee_tasters table
    const insertQuery = `
      INSERT INTO coffee_tasters (
        exporter_id, certificate_number, status, created_at, updated_at
      ) VALUES ($1, $2, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (exporter_id) DO UPDATE
      SET certificate_number = $2, status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await postgresService.query(insertQuery, [exporterUUID, certificateNumber]);
    console.log('[Taster Registration] AUTO-APPROVED:', result.rows[0]);
    
    // Optionally sync to blockchain
    if (process.env.BLOCKCHAIN_SYNC === 'true') {
      try {
        await fabricService.invokeChaincode(
          'SubmitQualificationDocument',
          JSON.stringify({ ...tasterData, stage: 'taster', status: 'approved' })
        );
        console.log('[Taster Registration] Blockchain sync successful');
      } catch (blockchainError) {
        console.error('[Taster Registration] Blockchain sync failed (non-critical):', blockchainError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Taster registration auto-approved successfully',
      status: 'approved',
      certificateNumber,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Taster registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Apply for competence certificate (Exporter Portal)
 * Requires: Laboratory and Taster approved
 * AUTO-APPROVES immediately upon submission
 */
router.post('/competence/apply', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter UUID from username
    const exporterQuery = `SELECT exporter_id FROM exporter_profiles WHERE user_id = $1`;
    const exporterResult = await postgresService.query(exporterQuery, [exporterId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUUID = exporterResult.rows[0].exporter_id;
    
    // Check prerequisites: Laboratory and Taster must be registered
    const labQuery = `SELECT * FROM coffee_laboratories WHERE exporter_id = $1`;
    const labResult = await postgresService.query(labQuery, [exporterUUID]);
    
    const tasterQuery = `SELECT * FROM coffee_tasters WHERE exporter_id = $1`;
    const tasterResult = await postgresService.query(tasterQuery, [exporterUUID]);
    
    if (labResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Laboratory must be registered before applying for competence certificate',
        requiredStep: 'laboratory_registration'
      });
    }
    
    if (tasterResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Taster must be registered before applying for competence certificate',
        requiredStep: 'taster_registration'
      });
    }
    
    // Auto-generate certificate info
    const timestamp = Date.now();
    const certificateNumber = `COMP-${timestamp}`;
    const certificateId = `COMP-ID-${timestamp}`;
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    const competenceData = {
      exporterId,
      ...req.body,
      certificateNumber,
      certificateId,
      validUntil: oneYearLater.toISOString(),
      submittedAt: new Date().toISOString()
    };
    
    console.log('[Competence Application] Request:', { exporterId, certificateNumber });
    
    // Insert into competence_certificates table
    const insertQuery = `
      INSERT INTO competence_certificates (
        exporter_id, certificate_number, certificate_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (exporter_id) DO UPDATE
      SET certificate_number = $2, certificate_id = $3, status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await postgresService.query(insertQuery, [exporterUUID, certificateNumber, certificateId]);
    console.log('[Competence Application] AUTO-APPROVED:', result.rows[0]);
    
    // Optionally sync to blockchain
    if (process.env.BLOCKCHAIN_SYNC === 'true') {
      try {
        await fabricService.invokeChaincode(
          'SubmitQualificationDocument',
          JSON.stringify({ ...competenceData, stage: 'competenceCertificate', status: 'approved' })
        );
        console.log('[Competence Application] Blockchain sync successful');
      } catch (blockchainError) {
        console.error('[Competence Application] Blockchain sync failed (non-critical):', blockchainError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Competence certificate auto-approved successfully',
      status: 'approved',
      certificateNumber,
      certificateId,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Competence certificate application error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Apply for export license (Exporter Portal)
 * Requires: Laboratory, Taster, and Competence approved
 * AUTO-APPROVES immediately upon submission
 */
router.post('/license/apply', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter UUID from username
    const exporterQuery = `SELECT exporter_id FROM exporter_profiles WHERE user_id = $1`;
    const exporterResult = await postgresService.query(exporterQuery, [exporterId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUUID = exporterResult.rows[0].exporter_id;
    
    // Check prerequisites: All previous stages must be registered
    const labQuery = `SELECT * FROM coffee_laboratories WHERE exporter_id = $1`;
    const labResult = await postgresService.query(labQuery, [exporterUUID]);
    
    const tasterQuery = `SELECT * FROM coffee_tasters WHERE exporter_id = $1`;
    const tasterResult = await postgresService.query(tasterQuery, [exporterUUID]);
    
    const compQuery = `SELECT * FROM competence_certificates WHERE exporter_id = $1`;
    const compResult = await postgresService.query(compQuery, [exporterUUID]);
    
    if (labResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Laboratory must be registered before applying for export license',
        requiredStep: 'laboratory_registration'
      });
    }
    
    if (tasterResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Taster must be registered before applying for export license',
        requiredStep: 'taster_registration'
      });
    }
    
    if (compResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Competence certificate must be obtained before applying for export license',
        requiredStep: 'competence_certificate'
      });
    }
    
    // Auto-generate license info
    const timestamp = Date.now();
    const licenseNumber = `LIC-${timestamp}`;
    const licenseId = `LIC-ID-${timestamp}`;
    const oneYearLater = new Date();
    oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
    
    const licenseData = {
      exporterId,
      ...req.body,
      licenseNumber,
      licenseId,
      validUntil: oneYearLater.toISOString(),
      submittedAt: new Date().toISOString()
    };
    
    console.log('[License Application] Request:', { exporterId, licenseNumber });
    
    // Insert into export_licenses table
    const insertQuery = `
      INSERT INTO export_licenses (
        exporter_id, license_number, license_id, status, created_at, updated_at
      ) VALUES ($1, $2, $3, 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (exporter_id) DO UPDATE
      SET license_number = $2, license_id = $3, status = 'APPROVED', updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await postgresService.query(insertQuery, [exporterUUID, licenseNumber, licenseId]);
    console.log('[License Application] AUTO-APPROVED:', result.rows[0]);
    
    // Optionally sync to blockchain
    if (process.env.BLOCKCHAIN_SYNC === 'true') {
      try {
        await fabricService.invokeChaincode(
          'SubmitQualificationDocument',
          JSON.stringify({ ...licenseData, stage: 'license', status: 'approved' })
        );
        console.log('[License Application] Blockchain sync successful');
      } catch (blockchainError) {
        console.error('[License Application] Blockchain sync failed (non-critical):', blockchainError.message);
      }
    }
    
    res.json({
      success: true,
      message: 'Export license auto-approved successfully',
      status: 'approved',
      licenseNumber,
      licenseId,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Export license application error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit pre-registration stage (laboratory, taster, competence, license)
 * Smart contract will auto-approve/reject based on validation rules
 */
router.post('/pre-registration/stage/:stage', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    const { stage } = req.params;
    const data = req.body;
    
    // Validate stage
    const validStages = ['laboratory', 'taster', 'competenceCertificate', 'exportLicense'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }
    
    console.log(`[Stage Submission] ${exporterId} submitting ${stage}:`, data);
    
    // Submit to blockchain - smart contract will validate and auto-approve/reject
    const result = await fabricService.submitTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitPreRegistrationStage',
      exporterId,
      stage,
      JSON.stringify(data)
    );
    
    // Result is an object with {success, output}, not a JSON string
    console.log(`[Stage Submission] Result:`, result);
    
    // Extract the actual response from the output
    let response;
    if (typeof result === 'string') {
      response = JSON.parse(result);
    } else if (result.output) {
      // Parse the output to get the chaincode response
      const lines = result.output.trim().split('\n');
      const jsonLine = lines[lines.length - 1];
      response = JSON.parse(jsonLine);
    } else {
      response = result;
    }
    
    console.log(`[Stage Submission] Parsed response:`, response);
    
    res.json({
      success: true,
      stage,
      status: response.status,
      autoProcessed: response.autoProcessed,
      message: response.message
    });
  } catch (error) {
    console.error('[Stage Submission] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


// ============================================================================
// CERTIFICATE DOWNLOAD ENDPOINTS
// ============================================================================

/**
 * Download laboratory certificate PDF
 */
router.get('/certificates/laboratory/download', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get laboratory data from correct table
    const exporterUUID = exporterData.exporter_id;
    const labResult = await postgresService.query(
      'SELECT * FROM coffee_laboratories WHERE exporter_id = $1',
      [exporterUUID]
    );
    
    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratory certificate not found or not approved' });
    }
    
    const laboratoryData = {
      certificateNumber: labResult.rows[0].certificate_number,
      issuedAt: labResult.rows[0].created_at || new Date(),
      expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000) // 3 years
    };
    
    const { filepath, filename } = await generateLaboratoryCertificate(laboratoryData, exporterData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Laboratory certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download taster certificate PDF
 */
router.get('/certificates/taster/download', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get taster data from correct table
    const exporterUUID = exporterData.exporter_id;
    const tasterResult = await postgresService.query(
      'SELECT * FROM coffee_tasters WHERE exporter_id = $1',
      [exporterUUID]
    );
    
    if (tasterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Taster certificate not found or not approved' });
    }
    
    const tasterData = {
      certificateNumber: tasterResult.rows[0].certificate_number,
      issuedAt: tasterResult.rows[0].created_at || new Date(),
      expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000) // 2 years
    };
    
    const { filepath, filename } = await generateTasterCertificate(tasterData, exporterData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Taster certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download competence certificate PDF
 */
router.get('/certificates/competence/download', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get competence data from correct table
    const exporterUUID = exporterData.exporter_id;
    const compResult = await postgresService.query(
      'SELECT * FROM competence_certificates WHERE exporter_id = $1',
      [exporterUUID]
    );
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Competence certificate not found or not approved' });
    }
    
    const competenceData = {
      certificateId: compResult.rows[0].certificate_id,
      certificateNumber: compResult.rows[0].certificate_number,
      issuedAt: compResult.rows[0].created_at || new Date(),
      expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000) // 3 years
    };
    
    const { filepath, filename } = await generateCompetenceCertificate(competenceData, exporterData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Competence certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download export license PDF
 */
router.get('/certificates/license/download', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get license data from correct table
    const exporterUUID = exporterData.exporter_id;
    const licenseResult = await postgresService.query(
      'SELECT * FROM export_licenses WHERE exporter_id = $1',
      [exporterUUID]
    );
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Export license not found or not approved' });
    }
    
    const licenseData = {
      licenseId: licenseResult.rows[0].license_id,
      licenseNumber: licenseResult.rows[0].license_number,
      issuedAt: new Date(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
    
    const { filepath, filename } = await generateExportLicense(licenseData, exporterData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Export license download error:', error);
    res.status(500).json({ error: error.message });
  }
});


// ============================================================================
// ALTERNATIVE CERTIFICATE DOWNLOAD ENDPOINTS (Frontend Compatible)
// ============================================================================

/**
 * Download laboratory certificate by certificate number
 * GET /api/preregistration/laboratory/:certificateNumber/download
 */
router.get('/laboratory/:certificateNumber/download', authenticateToken, async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get laboratory data from correct table
    const exporterUUID = exporterData.exporter_id;
    const labResult = await postgresService.query(
      'SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND certificate_number = $2',
      [exporterUUID, certificateNumber]
    );
    
    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratory certificate not found or not approved' });
    }
    
    const { generateLaboratoryCertificatePDF } = require('../utils/certificate-pdf');
    
    const laboratoryData = {
      certificateNumber: labResult.rows[0].certificate_number,
      laboratoryName: exporterData.business_name,
      location: exporterData.office_address
    };
    
    const { filepath, filename } = await generateLaboratoryCertificatePDF(exporterData, laboratoryData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Laboratory certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download taster certificate by certificate number
 * GET /api/preregistration/taster/:certificateNumber/download
 */
router.get('/taster/:certificateNumber/download', authenticateToken, async (req, res) => {
  try {
    const { certificateNumber } = req.params;
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get taster data from correct table
    const exporterUUID = exporterData.exporter_id;
    const tasterResult = await postgresService.query(
      'SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND certificate_number = $2',
      [exporterUUID, certificateNumber]
    );
    
    if (tasterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Taster certificate not found or not approved' });
    }
    
    const { generateTasterCertificatePDF } = require('../utils/certificate-pdf');
    
    const tasterData = {
      certificateNumber: tasterResult.rows[0].certificate_number,
      tasterName: exporterData.contact_person || exporterData.business_name,
      tasterId: exporterId
    };
    
    const { filepath, filename } = await generateTasterCertificatePDF(exporterData, tasterData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Taster certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download competence certificate by certificate ID
 * GET /api/preregistration/competence/:certificateId/download
 */
router.get('/competence/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
    const userId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get competence data from correct table - use CAST to handle UUID comparison
    const exporterUUID = exporterData.exporter_id;
    const compResult = await postgresService.query(
      'SELECT * FROM competence_certificates WHERE exporter_id = $1 AND (certificate_id::text = $2 OR certificate_number = $2)',
      [exporterUUID, certificateId]
    );
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Competence certificate not found or not approved' });
    }
    
    const { generateCompetenceCertificate } = require('../utils/certificate-pdf-compact');
    
    const competenceData = compResult.rows[0];
    
    const { filepath, filename } = await generateCompetenceCertificate(exporterData, competenceData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download certificate' });
        }
      }
    });
  } catch (error) {
    console.error('Competence certificate download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download export license by license ID
 * GET /api/preregistration/license/:licenseId/download
 */
router.get('/license/:licenseId/download', authenticateToken, async (req, res) => {
  try {
    const { licenseId } = req.params;
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get license data from correct table
    const exporterUUID = exporterData.exporter_id;
    const licenseResult = await postgresService.query(
      'SELECT * FROM export_licenses WHERE exporter_id = $1 AND (license_id = $2 OR license_number = $2)',
      [exporterUUID, licenseId]
    );
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Export license not found or not approved' });
    }
    
    
    
    const licenseData = {
      licenseNumber: licenseResult.rows[0].license_number,
      licenseId: licenseResult.rows[0].license_id
    };
    
    const { filepath, filename } = await generateExportLicense(licenseData, exporterData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Export license download error:', error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * Download export license by license ID (plural version for frontend compatibility)
 * GET /api/preregistration/licenses/:licenseId/download
 */
router.get('/licenses/:licenseId/download', authenticateToken, async (req, res) => {
  try {
    const { licenseId } = req.params;
    const exporterId = req.user.id;
    
    // Get exporter data from PostgreSQL
    const userResult = await postgresService.query(
      'SELECT u.*, ep.* FROM users u LEFT JOIN exporter_profiles ep ON u.username = ep.user_id WHERE u.username = $1',
      [exporterId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    const exporterData = userResult.rows[0];
    
    // Get license data from correct table
    const exporterUUID = exporterData.exporter_id;
    const licenseResult = await postgresService.query(
      'SELECT * FROM export_licenses WHERE exporter_id = $1 AND (license_id = $2 OR license_number = $2)',
      [exporterUUID, licenseId]
    );
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Export license not found or not approved' });
    }
    
    
    
    const licenseData = {
      licenseNumber: licenseResult.rows[0].license_number,
      licenseId: licenseResult.rows[0].license_id
    };
    
    const { filepath, filename } = await generateExportLicense(licenseData, exporterData);
    
    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        res.status(500).json({ error: 'Failed to download certificate' });
      }
    });
  } catch (error) {
    console.error('Export license download error:', error);
    res.status(500).json({ error: error.message });
  }
});

