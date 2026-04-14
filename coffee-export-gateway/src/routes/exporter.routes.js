const express = require('express');
const router = express.Router();
const fabricService = require('../services');
const postgresService = require('../services/postgres');
const { Pool } = require('pg');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { createUser } = require('./auth.routes');
const { 
  generateCompetenceCertificate, 
  generateExportLicense, 
  generateLaboratoryCertificate, 
  generateTasterCertificate 
} = require('../utils/certificate-pdf-compact');

// Database pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'coffee_export_db',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

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
 * Get exporter dashboard data
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id || req.user.username;
    const user = req.user;
    
    console.log(`[Dashboard] Fetching dashboard for exporter: ${exporterId}`);
    
    // HYBRID MODE: Get data from PostgreSQL first (primary source)
    let profile = null;
    let preRegData = null;
    
    try {
      // Get exporter profile from PostgreSQL
      const profileQuery = `
        SELECT 
          ep.*,
          u.email as user_email,
          u.username
        FROM exporter_profiles ep
        LEFT JOIN users u ON ep.user_id = u.username
        WHERE ep.user_id = $1 OR u.username = $1
        LIMIT 1
      `;
      const profileResult = await postgresService.query(profileQuery, [exporterId]);
      
      if (profileResult.rows.length > 0) {
        const row = profileResult.rows[0];
        profile = {
          exporterId: row.user_id,
          companyName: row.business_name,
          tin: row.tin,
          registrationNumber: row.registration_number || row.tin,
          businessType: row.business_type,
          capitalETB: row.minimum_capital,
          contactPerson: row.contact_person,
          email: row.email || row.user_email,
          phone: row.phone,
          address: row.office_address,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        
        console.log(`[Dashboard] Profile found in PostgreSQL for ${exporterId}`);
      }
      
      // Get qualification status from related tables
      const qualificationQuery = `
        SELECT 
          ep.exporter_id,
          ep.user_id,
          ep.business_name,
          ep.tin,
          ep.status as profile_status,
          cl.status as laboratory_status,
          cl.certification_number as laboratory_cert_number,
          ct.status as taster_status,
          ct.proficiency_certificate_number as taster_cert_number,
          cc.status as competence_status,
          cc.certificate_number as competence_cert_number,
          el.status as license_status,
          el.license_number,
          el.expiry_date as license_expiry_date
        FROM exporter_profiles ep
        LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
        LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
        LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
        LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE'
        WHERE ep.user_id = $1
      `;
      const qualificationResult = await postgresService.query(qualificationQuery, [exporterId]);
      
      if (qualificationResult.rows.length > 0) {
        const qual = qualificationResult.rows[0];
        preRegData = {
          exporter_id: qual.user_id,
          laboratory_status: qual.laboratory_status || 'PENDING',
          laboratory_cert_number: qual.laboratory_cert_number,
          taster_status: qual.taster_status || 'PENDING',
          taster_cert_number: qual.taster_cert_number,
          competence_status: qual.competence_status || 'PENDING',
          competence_cert_number: qual.competence_cert_number,
          license_status: qual.license_status || 'PENDING',
          license_number: qual.license_number,
          created_at: qual.created_at,
          updated_at: qual.updated_at
        };
        console.log(`[Dashboard] Qualification data found for ${exporterId}`);
      }
    } catch (pgError) {
      console.error('[Dashboard] PostgreSQL error:', pgError.message);
    }
    
    // If no profile in PostgreSQL, fetch from users table
    if (!profile) {
      console.log(`[Dashboard] No exporter profile found, checking users table for ${exporterId}`);
      
      try {
        const userQuery = `
          SELECT u.*, ep.business_name, ep.tin, ep.phone, ep.office_address, ep.contact_person
          FROM users u
          LEFT JOIN exporter_profiles ep ON u.username = ep.user_id
          WHERE u.username = $1
          LIMIT 1
        `;
        const userResult = await postgresService.query(userQuery, [exporterId]);
        
        if (userResult.rows.length > 0) {
          const userData = userResult.rows[0];
          
          return res.json({
            identity: {
              exporterId: exporterId,
              businessName: userData.business_name || user?.companyName || 'N/A',
              tin: userData.tin || 'N/A',
              registrationNumber: userData.tin || exporterId,
              businessType: 'PRIVATE_EXPORTER'
            },
            contact: {
              contactPerson: userData.contact_person || 'N/A',
              email: userData.email || 'N/A',
              phone: userData.phone || 'N/A',
              officeAddress: userData.office_address || 'N/A',
              city: 'N/A',
              region: 'N/A'
            },
            compliance: {
              profileStatus: 'APPROVED',
              profileApproved: true,
              capitalVerified: true,
              laboratoryStatus: 'MISSING',
              laboratoryApproved: false,
              tasterStatus: 'MISSING',
              tasterApproved: false,
              competenceStatus: 'MISSING',
              competenceApproved: false,
              licenseStatus: 'MISSING',
              licenseApproved: false,
              isFullyQualified: false
            },
            documents: {
              registrationNumber: userData.tin || exporterId,
              laboratoryCertificationNumber: null,
              tasterCertificateNumber: null,
              competenceCertificateNumber: null,
              competenceCertificateId: null,
              exportLicenseNumber: null,
              exportLicenseId: null,
              eicRegistrationNumber: null
            },
            validation: {
              isValid: false,
              issues: ['Complete laboratory registration', 'Complete taster registration', 'Apply for competence certificate', 'Apply for export license'],
              requiredActions: ['Register laboratory to continue qualification process']
            },
            metadata: {
              lastUpdated: new Date().toISOString(),
              createdAt: userData.created_at || new Date().toISOString()
            }
          });
        }
      } catch (userError) {
        console.error('[Dashboard] Error fetching user data:', userError.message);
      }
      
      // If still no data, return minimal dashboard
      console.log(`[Dashboard] No data found for ${exporterId}, returning minimal dashboard`);
      return res.json({
        identity: {
          exporterId: exporterId,
          businessName: user?.companyName || 'N/A',
          tin: 'N/A',
          registrationNumber: exporterId,
          businessType: 'PRIVATE_EXPORTER'
        },
        contact: {
          contactPerson: 'N/A',
          email: 'N/A',
          phone: 'N/A',
          officeAddress: 'N/A',
          city: 'N/A',
          region: 'N/A'
        },
        compliance: {
          profileStatus: 'APPROVED',
          profileApproved: true,
          capitalVerified: true,
          laboratoryStatus: 'MISSING',
          laboratoryApproved: false,
          tasterStatus: 'MISSING',
          tasterApproved: false,
          competenceStatus: 'MISSING',
          competenceApproved: false,
          licenseStatus: 'MISSING',
          licenseApproved: false,
          isFullyQualified: false
        },
        documents: {
          registrationNumber: exporterId,
          laboratoryCertificationNumber: null,
          tasterCertificateNumber: null,
          competenceCertificateNumber: null,
          competenceCertificateId: null,
          exportLicenseNumber: null,
          exportLicenseId: null,
          eicRegistrationNumber: null
        },
        validation: {
          isValid: false,
          issues: ['Complete laboratory registration', 'Complete taster registration', 'Apply for competence certificate', 'Apply for export license'],
          requiredActions: ['Register laboratory to continue qualification process']
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }
      });
    }
    
    // Parse address to extract city and region if available
    let city = 'N/A';
    let region = 'N/A';
    if (profile.address) {
      const addressParts = profile.address.split(',').map(p => p.trim());
      if (addressParts.length >= 2) {
        city = addressParts[addressParts.length - 2] || 'N/A';
        region = addressParts[addressParts.length - 1] || 'N/A';
      } else if (addressParts.length === 1) {
        city = addressParts[0];
      }
    }
    
    // Get exporter UUID for querying qualification tables
    const exporterUuidQuery = `SELECT exporter_id FROM exporter_profiles WHERE user_id = $1 LIMIT 1`;
    const exporterUuidResult = await postgresService.query(exporterUuidQuery, [exporterId]);
    
    let exporterUuid = null;
    if (exporterUuidResult.rows.length > 0) {
      exporterUuid = exporterUuidResult.rows[0].exporter_id;
      console.log(`[Dashboard] Exporter UUID: ${exporterUuid}`);
    }
    
    // Query actual qualification tables by UUID
    let laboratoryStatus = 'MISSING';
    let laboratoryApproved = false;
    let laboratoryCertNumber = null;
    
    let tasterStatus = 'MISSING';
    let tasterApproved = false;
    let tasterCertNumber = null;
    
    let competenceStatus = 'MISSING';
    let competenceApproved = false;
    let competenceCertNumber = null;
    let competenceCertId = null;
    
    let licenseStatus = 'MISSING';
    let licenseApproved = false;
    let licenseNumber = null;
    let licenseId = null;
    
    if (exporterUuid) {
      // Check laboratory
      const labQuery = `SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`;
      const labResult = await postgresService.query(labQuery, [exporterUuid]);
      if (labResult.rows.length > 0) {
        laboratoryStatus = 'APPROVED';
        laboratoryApproved = true;
        laboratoryCertNumber = labResult.rows[0].certification_number;
        console.log(`[Dashboard] Laboratory: ACTIVE (${laboratoryCertNumber})`);
      }
      
      // Check taster
      const tasterQuery = `SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`;
      const tasterResult = await postgresService.query(tasterQuery, [exporterUuid]);
      if (tasterResult.rows.length > 0) {
        tasterStatus = 'APPROVED';
        tasterApproved = true;
        tasterCertNumber = tasterResult.rows[0].proficiency_certificate_number;
        console.log(`[Dashboard] Taster: ACTIVE (${tasterCertNumber})`);
      }
      
      // Check competence certificate
      const compQuery = `SELECT * FROM competence_certificates WHERE exporter_id = $1 AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`;
      const compResult = await postgresService.query(compQuery, [exporterUuid]);
      if (compResult.rows.length > 0) {
        competenceStatus = 'APPROVED';
        competenceApproved = true;
        competenceCertNumber = compResult.rows[0].certificate_number;
        competenceCertId = compResult.rows[0].certificate_id;
        console.log(`[Dashboard] Competence: ACTIVE (${competenceCertNumber})`);
      }
      
      // Check export license
      const licenseQuery = `SELECT * FROM export_licenses WHERE exporter_id = $1 AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1`;
      const licenseResult = await postgresService.query(licenseQuery, [exporterUuid]);
      if (licenseResult.rows.length > 0) {
        licenseStatus = 'APPROVED';
        licenseApproved = true;
        licenseNumber = licenseResult.rows[0].license_number;
        licenseId = licenseResult.rows[0].license_id;
        console.log(`[Dashboard] License: ACTIVE (${licenseNumber})`);
      }
    }
    
    // Build dashboard from actual qualification data
    const profileApproved = profile.status === 'ACTIVE' || profile.status === 'active';
    
    // Calculate required actions based on sequential workflow
    const requiredActions = [];
    if (!profileApproved) {
      requiredActions.push('Wait for profile approval');
    } else if (!laboratoryApproved) {
      requiredActions.push('Register laboratory to continue qualification process');
    } else if (!tasterApproved) {
      requiredActions.push('Register taster to continue qualification process');
    } else if (!competenceApproved) {
      requiredActions.push('Apply for competence certificate');
    } else if (!licenseApproved) {
      requiredActions.push('Apply for export license to complete qualification');
    }
    
    // AUTO-APPROVE USER ACCOUNT: If all qualifications are met, ensure user account is approved
    const isFullyQualified = profileApproved && laboratoryApproved && tasterApproved && competenceApproved && licenseApproved;
    if (isFullyQualified) {
      try {
        const userCheckQuery = `SELECT is_active, status FROM users WHERE username = $1`;
        const userCheck = await postgresService.query(userCheckQuery, [exporterId]);
        
        if (userCheck.rows.length > 0 && (!userCheck.rows[0].is_active || userCheck.rows[0].status !== 'approved')) {
          const userUpdateQuery = `
            UPDATE users 
            SET is_active = true, 
                status = 'approved',
                updated_at = CURRENT_TIMESTAMP
            WHERE username = $1
            RETURNING username, is_active, status
          `;
          const userResult = await postgresService.query(userUpdateQuery, [exporterId]);
          console.log('[Dashboard] User account AUTO-APPROVED (all qualifications met):', userResult.rows[0]);
        }
      } catch (autoApproveError) {
        console.error('[Dashboard] Auto-approve check failed (non-critical):', autoApproveError.message);
      }
    }
    
    const dashboardData = {
      identity: {
        exporterId: profile.exporterId,
        businessName: profile.companyName,
        tin: profile.tin,
        registrationNumber: profile.registrationNumber,
        businessType: profile.businessType
      },
      contact: {
        contactPerson: profile.contactPerson || 'N/A',
        email: profile.email,
        phone: profile.phone || 'N/A',
        officeAddress: profile.address || 'N/A',
        city: preRegData?.city || city,
        region: preRegData?.region || region
      },
      compliance: {
        profileStatus: profileApproved ? 'APPROVED' : 'PENDING',
        profileApproved: profileApproved,
        capitalVerified: true,
        laboratoryStatus: laboratoryStatus.toUpperCase(),
        laboratoryApproved: laboratoryApproved,
        tasterStatus: tasterStatus.toUpperCase(),
        tasterApproved: tasterApproved,
        competenceStatus: competenceStatus.toUpperCase(),
        competenceApproved: competenceApproved,
        licenseStatus: licenseStatus.toUpperCase(),
        licenseApproved: licenseApproved,
        isFullyQualified: profileApproved && laboratoryApproved && tasterApproved && competenceApproved && licenseApproved
      },
      documents: {
        registrationNumber: profile.registrationNumber,
        laboratoryCertificationNumber: laboratoryCertNumber,
        tasterCertificateNumber: tasterCertNumber,
        competenceCertificateNumber: competenceCertNumber,
        competenceCertificateId: competenceCertId,
        exportLicenseNumber: licenseNumber,
        exportLicenseId: licenseId,
        eicRegistrationNumber: preRegData?.eic_registration_number || null
      },
      validation: {
        isValid: requiredActions.length === 0,
        issues: requiredActions,
        requiredActions: requiredActions
      },
      metadata: {
        lastUpdated: profile.updatedAt || new Date().toISOString(),
        createdAt: profile.createdAt || new Date().toISOString()
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
 * Get network submission prefill data
 * Returns exporter qualification data for pre-filling network submission form
 */
router.get('/network-prefill', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id || req.user.username;
    
    console.log(`[Network Prefill] Fetching data for exporter: ${exporterId}`);
    
    // Get exporter profile from PostgreSQL
    const profileQuery = `
      SELECT 
        ep.*,
        u.email as user_email,
        u.username
      FROM exporter_profiles ep
      LEFT JOIN users u ON ep.user_id = u.username
      WHERE ep.user_id = $1 OR u.username = $1
      LIMIT 1
    `;
    const profileResult = await postgresService.query(profileQuery, [exporterId]);
    
    if (profileResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Exporter profile not found. Please complete pre-registration first.',
        data: null
      });
    }
    
    const profile = profileResult.rows[0];
    const exporterUuid = profile.exporter_id;
    
    // Get qualification data
    const qualificationQuery = `
      SELECT 
        ep.exporter_id,
        ep.user_id,
        ep.business_name,
        ep.tin,
        ep.registration_number,
        ep.business_type,
        ep.minimum_capital,
        ep.contact_person,
        ep.email,
        ep.phone,
        ep.office_address,
        ep.status as profile_status,
        cl.status as laboratory_status,
        cl.certification_number as laboratory_cert_number,
        cl.laboratory_name,
        ct.status as taster_status,
        ct.proficiency_certificate_number as taster_cert_number,
        ct.full_name as taster_name,
        cc.status as competence_status,
        cc.certificate_number as competence_cert_number,
        cc.certificate_id as competence_cert_id,
        el.status as license_status,
        el.license_number,
        el.license_id,
        el.expiry_date as license_expiry_date
      FROM exporter_profiles ep
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
      LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id AND el.status = 'ACTIVE'
      WHERE ep.user_id = $1
    `;
    const qualResult = await postgresService.query(qualificationQuery, [exporterId]);
    
    if (qualResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Qualification data not found',
        data: null
      });
    }
    
    const qual = qualResult.rows[0];
    
    // Check if fully qualified (all stages approved)
    const isFullyQualified = 
      qual.profile_status === 'ACTIVE' &&
      qual.laboratory_status === 'ACTIVE' &&
      qual.taster_status === 'ACTIVE' &&
      qual.competence_status === 'ACTIVE' &&
      qual.license_status === 'ACTIVE';
    
    // Build prefill data structure
    const prefillData = {
      isQualified: isFullyQualified,
      exporterInfo: {
        businessName: qual.business_name,
        tin: qual.tin,
        registrationNumber: qual.registration_number || qual.tin,
        businessType: qual.business_type || 'PRIVATE_EXPORTER',
        contactPerson: qual.contact_person,
        email: qual.email || qual.user_email,
        phone: qual.phone,
        address: qual.office_address
      },
      licenseInfo: qual.license_status === 'ACTIVE' ? {
        licenseNumber: qual.license_number,
        licenseId: qual.license_id,
        expiryDate: qual.license_expiry_date,
        status: 'ACTIVE'
      } : null,
      competenceInfo: qual.competence_status === 'ACTIVE' ? {
        certificateNumber: qual.competence_cert_number,
        certificateId: qual.competence_cert_id,
        status: 'ACTIVE'
      } : null,
      laboratoryInfo: qual.laboratory_status === 'ACTIVE' ? {
        laboratoryName: qual.laboratory_name || `${qual.business_name} Laboratory`,
        certificationNumber: qual.laboratory_cert_number,
        status: 'ACTIVE'
      } : null,
      tasterInfo: qual.taster_status === 'ACTIVE' ? {
        tasterName: qual.taster_name || 'Certified Taster',
        certificateNumber: qual.taster_cert_number,
        status: 'ACTIVE'
      } : null
    };
    
    console.log(`[Network Prefill] Returning data for ${exporterId}, isQualified: ${isFullyQualified}`);
    
    res.json({
      success: true,
      message: isFullyQualified 
        ? 'Exporter is fully qualified' 
        : 'Exporter qualification incomplete',
      data: prefillData
    });
  } catch (error) {
    console.error('[Network Prefill] Error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch prefill data', 
      details: error.message 
    });
  }
});

/**
 * Get exporter applications
 */
router.get('/applications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get exporter profile from PostgreSQL
    const profileQuery = `
      SELECT 
        exporter_id,
        business_name,
        status,
        created_at,
        updated_at
      FROM exporter_profiles 
      WHERE user_id = $1
    `;
    
    const profileResult = await pool.query(profileQuery, [userId]);
    
    if (profileResult.rows.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const profile = profileResult.rows[0];
    const applications = [];
    
    // Add profile registration application
    applications.push({
      id: `profile-${profile.exporter_id}`,
      type: 'Profile Registration',
      status: profile.status === 'ACTIVE' ? 'APPROVED' : 'PENDING',
      submittedDate: new Date(profile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      reviewedDate: profile.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) : null,
      progress: profile.status === 'ACTIVE' ? 100 : 50,
      reviewer: 'ECTA',
      documents: ['Business License', 'TIN Certificate', 'Trade License'],
      comments: profile.status === 'ACTIVE' ? 'Profile approved and active' : 'Under review',
      certificateType: null,
      certificateId: null,
      filePath: null
    });
    
    // Check for issued certificates/licenses
    const certsQuery = `
      SELECT 
        document_id,
        document_type,
        status,
        issued_at,
        expiry_date,
        issuer_member_code
      FROM issued_documents
      WHERE exporter_id = $1 AND status = 'ACTIVE'
      ORDER BY issued_at DESC
    `;
    
    const certsResult = await pool.query(certsQuery, [profile.exporter_id]);
    
    // Map issuer codes to readable names
    const issuerNameMap = {
      'ECTA': 'ECTA',
      'BANK': 'Commercial Bank',
      'NBE': 'National Bank of Ethiopia',
      'CUSTOMS': 'Customs Authority',
      'SHIPPING': 'Shipping Line',
      'ECX': 'Ethiopia Commodity Exchange',
      'MOA': 'Ministry of Agriculture',
      'MOH': 'Ministry of Health'
    };
    
    // Add certificate applications
    certsResult.rows.forEach(cert => {
      const certType = cert.document_type.replace(/_/g, ' ').toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      const reviewerName = issuerNameMap[cert.issuer_member_code] || cert.issuer_member_code;
      
      applications.push({
        id: cert.document_id,
        type: certType,
        status: 'APPROVED',
        submittedDate: new Date(cert.issued_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        reviewedDate: new Date(cert.issued_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        progress: 100,
        reviewer: reviewerName,
        documents: [certType],
        comments: `${certType} issued successfully`,
        certificateType: cert.document_type.toLowerCase().includes('license') ? 'license' : 'competence',
        certificateId: cert.document_id,
        filePath: `/documents/${cert.document_id}`
      });
    });
    
    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Applications error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Get qualification status (Exporter Portal)
 * Returns the current status of all qualification steps
 */
router.get('/qualification-status', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
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
      // Try to get exporter profile from blockchain
      const profileResult = await fabricService.evaluateTransaction(
        exporterId,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterProfile',
        exporterId
      );
      
      const profile = JSON.parse(profileResult);
      
      // Update status based on profile data
      if (profile) {
        status.profile.complete = true;
        status.profile.status = profile.status || 'pending';
        
        // Check pre-registration status
        if (profile.preRegistrationStatus) {
          const preReg = profile.preRegistrationStatus;
          
          // Laboratory status
          if (preReg.laboratory) {
            status.laboratory.registered = true;
            status.laboratory.certified = preReg.laboratory.status === 'approved';
            status.laboratory.certificationNumber = preReg.laboratory.certificateNumber;
            status.laboratory.expiryDate = preReg.laboratory.validUntil;
          }
          
          // Taster status
          if (preReg.taster) {
            status.taster.registered = true;
            status.taster.verified = preReg.taster.status === 'approved';
            status.taster.verificationNumber = preReg.taster.certificateNumber;
          }
          
          // Competence certificate status
          if (preReg.competenceCertificate) {
            status.competenceCertificate.applied = true;
            status.competenceCertificate.valid = preReg.competenceCertificate.status === 'approved';
            status.competenceCertificate.certificateNumber = preReg.competenceCertificate.certificateNumber;
            status.competenceCertificate.certificate_id = preReg.competenceCertificate.certificateNumber;
            status.competenceCertificate.issueDate = preReg.competenceCertificate.approvedAt;
            status.competenceCertificate.expiryDate = preReg.competenceCertificate.validUntil;
          }
          
          // Export license status
          if (preReg.exportLicense) {
            status.exportLicense.applied = true;
            status.exportLicense.valid = preReg.exportLicense.status === 'issued' || preReg.exportLicense.status === 'approved';
            status.exportLicense.licenseNumber = preReg.exportLicense.licenseNumber || profile.licenseNumber;
            status.exportLicense.license_id = preReg.exportLicense.licenseNumber;
            status.exportLicense.issueDate = preReg.exportLicense.issuedAt || profile.licenseIssuedDate;
            status.exportLicense.expiryDate = preReg.exportLicense.expiryDate || profile.licenseExpiryDate;
          }
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
      }
    } catch (error) {
      // Profile doesn't exist yet - return default status
      console.log('No profile found for exporter:', exporterId);
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
    
    // Get exporter profile ID
    const profileQuery = await postgresService.query(
      `SELECT exporter_id FROM exporter_profiles WHERE user_id = $1`,
      [exporterId]
    );
    
    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterProfileId = profileQuery.rows[0].exporter_id;
    
    // Insert or update laboratory record with AUTO-APPROVED status
    const upsertQuery = `
      INSERT INTO coffee_laboratories (
        exporter_id, laboratory_name, address, certification_number,
        certified_date, expiry_date, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (exporter_id, status) 
      DO UPDATE SET 
        certification_number = EXCLUDED.certification_number,
        certified_date = EXCLUDED.certified_date,
        expiry_date = EXCLUDED.expiry_date,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await postgresService.query(upsertQuery, [
      exporterProfileId,
      `${exporterId} Laboratory`,
      'Auto-registered',
      certificateNumber
    ]);
    
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
    
    // NEW WORKFLOW: Check if exporter profile exists
    const profileQuery = await postgresService.query(
      `SELECT exporter_id FROM exporter_profiles WHERE user_id = $1`,
      [exporterId]
    );
    
    if (profileQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found. Please complete registration first.' });
    }
    
    const exporterProfileId = profileQuery.rows[0].exporter_id;
    
    // Check prerequisites: Laboratory must be approved (if required for business type)
    // For now, we'll allow taster registration without lab prerequisite
    // This can be adjusted based on business rules
    
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
    
    // Insert or update taster record with AUTO-APPROVED status
    const upsertQuery = `
      INSERT INTO coffee_tasters (
        exporter_id, full_name, proficiency_certificate_number,
        certificate_issue_date, certificate_expiry_date, employment_start_date,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', CURRENT_DATE, 'ACTIVE', NOW(), NOW())
      ON CONFLICT (exporter_id, status) 
      DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        proficiency_certificate_number = EXCLUDED.proficiency_certificate_number,
        certificate_issue_date = EXCLUDED.certificate_issue_date,
        certificate_expiry_date = EXCLUDED.certificate_expiry_date,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await postgresService.query(upsertQuery, [
      exporterProfileId,
      req.body.tasterName || `${exporterId} Taster`,
      certificateNumber
    ]);
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
    
    // Check prerequisites: Laboratory and Taster must be approved
    const checkQuery = `
      SELECT 
        ep.exporter_id,
        cl.status as laboratory_status,
        ct.status as taster_status
      FROM exporter_profiles ep
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
      WHERE ep.user_id = $1
    `;
    const checkResult = await postgresService.query(checkQuery, [exporterId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterProfileId = checkResult.rows[0].exporter_id;
    const { laboratory_status, taster_status } = checkResult.rows[0];
    
    // NEW WORKFLOW: Make prerequisites optional for now
    // Business rules can be adjusted later based on requirements
    // For now, allow competence application without strict prerequisites
    
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
    
    // Insert or update competence certificate with AUTO-APPROVED status
    const upsertQuery = `
      INSERT INTO competence_certificates (
        exporter_id, certificate_number, issued_date, expiry_date,
        inspection_passed, status, created_at, updated_at
      ) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', TRUE, 'ACTIVE', NOW(), NOW())
      ON CONFLICT (certificate_number) 
      DO UPDATE SET 
        issued_date = EXCLUDED.issued_date,
        expiry_date = EXCLUDED.expiry_date,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await postgresService.query(upsertQuery, [exporterProfileId, certificateNumber]);
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
    
    // Check prerequisites: All previous stages must be approved
    const checkQuery = `
      SELECT 
        ep.exporter_id,
        cl.status as laboratory_status,
        ct.status as taster_status,
        cc.status as competence_status,
        cc.certificate_id as competence_cert_id
      FROM exporter_profiles ep
      LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id AND cl.status = 'ACTIVE'
      LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id AND ct.status = 'ACTIVE'
      LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id AND cc.status = 'ACTIVE'
      WHERE ep.user_id = $1
    `;
    const checkResult = await postgresService.query(checkQuery, [exporterId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterProfileId = checkResult.rows[0].exporter_id;
    const { laboratory_status, taster_status, competence_status, competence_cert_id } = checkResult.rows[0];
    
    // NEW WORKFLOW: Make prerequisites optional for now
    // Business rules can be adjusted later based on requirements
    // For now, allow license application without strict prerequisites
    
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
    
    // Insert or update export license with AUTO-APPROVED status
    const upsertQuery = `
      INSERT INTO export_licenses (
        exporter_id, license_number, issued_date, expiry_date,
        competence_certificate_id, eic_registration_number,
        approved_by, approved_at, status, created_at, updated_at
      ) VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', $3, $4, 'AUTO-SYSTEM', NOW(), 'ACTIVE', NOW(), NOW())
      ON CONFLICT (license_number) 
      DO UPDATE SET 
        issued_date = EXCLUDED.issued_date,
        expiry_date = EXCLUDED.expiry_date,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await postgresService.query(upsertQuery, [
      exporterProfileId,
      licenseNumber,
      competence_cert_id,
      req.body.eicNumber || `EIC-${timestamp}`
    ]);
    console.log('[License Application] AUTO-APPROVED:', result.rows[0]);
    
    // AUTO-APPROVE USER ACCOUNT: When all qualifications are met, activate the user account
    try {
      const userUpdateQuery = `
        UPDATE users 
        SET is_active = true, 
            status = 'approved',
            updated_at = CURRENT_TIMESTAMP
        WHERE username = $1 AND role = 'exporter'
        RETURNING username, is_active, status
      `;
      const userResult = await postgresService.query(userUpdateQuery, [exporterId]);
      
      if (userResult.rows.length > 0) {
        console.log('[License Application] User account AUTO-APPROVED:', userResult.rows[0]);
      }
    } catch (userUpdateError) {
      console.error('[License Application] User account update failed (non-critical):', userUpdateError.message);
    }
    
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
      message: 'Export license auto-approved successfully. Your account is now fully qualified!',
      status: 'approved',
      licenseNumber,
      licenseId,
      accountStatus: 'approved',
      fullyQualified: true,
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

/**
 * GET /api/exporter/documents/:documentId/download
 * Download an issued document
 */
router.get('/documents/:documentId/download', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;
    const { documentId } = req.params;

    console.log(`[Document Download] Request for document ${documentId} by user ${userId}`);

    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await postgresService.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Get document details and verify ownership
    const docQuery = `
      SELECT 
        id.*,
        ep.business_name,
        ep.tin,
        ep.registration_number,
        ep.office_address as address,
        ep.contact_person,
        ep.phone,
        ep.email
      FROM issued_documents id
      JOIN exporter_profiles ep ON id.exporter_id = ep.exporter_id
      WHERE id.document_id = $1 AND id.exporter_id = $2
    `;
    const docResult = await postgresService.query(docQuery, [documentId, exporterUuid]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or you do not have access to this document'
      });
    }

    const document = docResult.rows[0];

    // Check if document is active
    if (document.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        error: `Document is ${document.status.toLowerCase()} and cannot be downloaded`
      });
    }

    console.log(`[Document Download] Found document ${documentId}, type: ${document.document_type}`);

    // Check if we have a stored PDF file
    if (document.document_url) {
      const fs = require('fs');
      const path = require('path');
      const filePath = document.document_url.replace('/storage/documents/', '');
      const fullPath = path.join(process.env.DOCUMENT_STORAGE_PATH || '/app/storage/documents', filePath);

      if (fs.existsSync(fullPath)) {
        // Serve the stored PDF file
        const filename = `${document.document_type}_${document.document_number}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        const fileStream = fs.createReadStream(fullPath);
        fileStream.pipe(res);

        console.log(`[Document Download] Served stored PDF: ${filename}`);
        return;
      }
    }

    // If no stored file, generate PDF on-the-fly
    console.log(`[Document Download] No stored file, generating PDF for ${documentId}`);
    const { generateDocumentPDF } = require('../utils/document-pdf-generator');

    // Prepare document data for PDF generation
    const documentData = {
      documentNumber: document.document_number,
      document_type: document.document_type,
      documentType: document.document_type,
      exporterId: document.exporter_id,
      issuedAt: document.issued_at,
      expiryDate: document.expiry_date,
      issuedBy: document.issued_by,
      document_metadata: document.document_metadata || {}
    };

    const exporterData = {
      business_name: document.business_name,
      tin: document.tin,
      registration_number: document.registration_number,
      address: document.address,
      contact_person: document.contact_person,
      phone: document.phone,
      email: document.email
    };

    // Generate signed PDF
    const pdfBuffer = await generateDocumentPDF(documentData, exporterData);

    // Set response headers for PDF download
    const filename = `${document.document_type}_${document.document_number}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);

    console.log(`[Document Download] Successfully generated and sent ${filename}`);

  } catch (error) {
    console.error('[Document Download] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download document',
      details: error.message
    });
  }
});

/**
 * GET /api/exporter/documents/collection-status
 * Get document collection status for the exporter
 */
router.get('/documents/collection-status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user.username;
    
    // Get exporter UUID
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await postgresService.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterUuid = exporterResult.rows[0].exporter_id;

    // Define required documents
    const requiredDocuments = [
      { type: 'EXPORT_LICENSE', issuer: 'ECTA', required: true },
      { type: 'PHYTOSANITARY_CERTIFICATE', issuer: 'MOA', required: true },
      { type: 'HEALTH_CERTIFICATE', issuer: 'MOH', required: true },
      { type: 'QUALITY_CERTIFICATE', issuer: 'ECX', required: true },
      { type: 'CERTIFICATE_OF_ORIGIN', issuer: 'ECTA', required: true },
      { type: 'BANK_GUARANTEE', issuer: 'BANK', required: true },
      { type: 'SHIPPING_BOOKING', issuer: 'SHIPPING', required: true },
      { type: 'CUSTOMS_CLEARANCE', issuer: 'ERCA', required: true },
      { type: 'FUMIGATION_CERTIFICATE', issuer: 'MOA', required: false }
    ];

    // Get all document requests and issued documents for this exporter
    const query = `
      SELECT 
        dr.document_type,
        dr.network_member_code,
        dr.request_status,
        dr.requested_at,
        dr.request_id,
        id.document_id,
        id.document_number,
        id.issued_at,
        id.expiry_date,
        id.status as document_status
      FROM document_requests dr
      LEFT JOIN issued_documents id ON dr.request_id = id.request_id
      WHERE dr.exporter_id = $1
      ORDER BY dr.requested_at DESC
    `;

    const result = await postgresService.query(query, [exporterUuid]);
    const requestsMap = new Map();

    // Build a map of document types to their latest status
    result.rows.forEach(row => {
      const key = `${row.document_type}_${row.network_member_code}`;
      if (!requestsMap.has(key) || new Date(row.requested_at) > new Date(requestsMap.get(key).requested_at)) {
        requestsMap.set(key, row);
      }
    });

    // Build response for each required document
    const documents = requiredDocuments.map(reqDoc => {
      const key = `${reqDoc.type}_${reqDoc.issuer}`;
      const docData = requestsMap.get(key);

      if (!docData) {
        return {
          documentType: reqDoc.type,
          issuer: reqDoc.issuer,
          required: reqDoc.required,
          status: 'NOT_REQUESTED'
        };
      }

      if (docData.document_id && docData.document_status === 'ACTIVE') {
        return {
          documentType: reqDoc.type,
          issuer: reqDoc.issuer,
          required: reqDoc.required,
          status: 'ISSUED',
          documentId: docData.document_id,
          documentNumber: docData.document_number,
          issuedAt: docData.issued_at,
          expiryDate: docData.expiry_date
        };
      }

      if (docData.request_status === 'REJECTED') {
        return {
          documentType: reqDoc.type,
          issuer: reqDoc.issuer,
          required: reqDoc.required,
          status: 'REJECTED',
          requestId: docData.request_id,
          requestedAt: docData.requested_at
        };
      }

      return {
        documentType: reqDoc.type,
        issuer: reqDoc.issuer,
        required: reqDoc.required,
        status: 'PENDING',
        requestId: docData.request_id,
        requestedAt: docData.requested_at,
        requestStatus: docData.request_status
      };
    });

    // Calculate completion
    const requiredDocs = documents.filter(d => d.required);
    const issuedDocs = requiredDocs.filter(d => d.status === 'ISSUED');
    const isComplete = issuedDocs.length === requiredDocs.length;

    res.json({
      success: true,
      data: {
        isComplete,
        requiredDocuments: requiredDocs.length,
        issuedDocuments: issuedDocs.length,
        pendingDocuments: requiredDocs.filter(d => d.status === 'PENDING').length,
        canSubmitToNetwork: isComplete,
        documents
      }
    });
  } catch (error) {
    console.error('[Document Collection Status] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch document collection status',
      details: error.message
    });
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get laboratory data from actual qualification table
    const labResult = await postgresService.query(
      'SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [exporterUuid, 'ACTIVE']
    );
    
    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratory certificate not found or not approved' });
    }
    
    const laboratoryData = {
      certificateNumber: labResult.rows[0].certification_number,
      issuedAt: labResult.rows[0].certification_date || new Date(),
      expiryDate: labResult.rows[0].certification_expiry || new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get taster data from actual qualification table
    const tasterResult = await postgresService.query(
      'SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [exporterUuid, 'ACTIVE']
    );
    
    if (tasterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Taster certificate not found or not approved' });
    }
    
    const tasterData = {
      certificateNumber: tasterResult.rows[0].proficiency_certificate_number,
      issuedAt: tasterResult.rows[0].proficiency_certificate_date || new Date(),
      expiryDate: tasterResult.rows[0].proficiency_certificate_expiry || new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get competence data from actual qualification table
    const compResult = await postgresService.query(
      'SELECT * FROM competence_certificates WHERE exporter_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [exporterUuid, 'ACTIVE']
    );
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Competence certificate not found or not approved' });
    }
    
    const competenceData = {
      certificateId: compResult.rows[0].certificate_id,
      certificateNumber: compResult.rows[0].certificate_number,
      issuedAt: compResult.rows[0].issue_date || new Date(),
      expiryDate: compResult.rows[0].expiry_date || new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get license data from actual qualification table
    const licenseResult = await postgresService.query(
      'SELECT * FROM export_licenses WHERE exporter_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 1',
      [exporterUuid, 'ACTIVE']
    );
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Export license not found or not approved' });
    }
    
    const licenseData = {
      licenseId: licenseResult.rows[0].license_id,
      licenseNumber: licenseResult.rows[0].license_number,
      issuedAt: licenseResult.rows[0].issue_date || new Date(),
      expiryDate: licenseResult.rows[0].expiry_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get laboratory data from actual qualification table by certificate number
    const labResult = await postgresService.query(
      'SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND certification_number = $2 AND status = $3',
      [exporterUuid, certificateNumber, 'ACTIVE']
    );
    
    if (labResult.rows.length === 0) {
      return res.status(404).json({ error: 'Laboratory certificate not found or not approved' });
    }
    
    const laboratoryData = {
      certificateNumber: labResult.rows[0].certification_number,
      issuedAt: labResult.rows[0].certification_date || new Date(),
      expiryDate: labResult.rows[0].certification_expiry || new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get taster data from actual qualification table by certificate number
    const tasterResult = await postgresService.query(
      'SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND proficiency_certificate_number = $2 AND status = $3',
      [exporterUuid, certificateNumber, 'ACTIVE']
    );
    
    if (tasterResult.rows.length === 0) {
      return res.status(404).json({ error: 'Taster certificate not found or not approved' });
    }
    
    const tasterData = {
      certificateNumber: tasterResult.rows[0].proficiency_certificate_number,
      issuedAt: tasterResult.rows[0].proficiency_certificate_date || new Date(),
      expiryDate: tasterResult.rows[0].proficiency_certificate_expiry || new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000)
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
 * Download competence certificate by certificate ID
 * GET /api/preregistration/competence/:certificateId/download
 */
router.get('/competence/:certificateId/download', authenticateToken, async (req, res) => {
  try {
    const { certificateId } = req.params;
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get competence data from actual qualification table - check both certificate_id and certificate_number
    const compResult = await postgresService.query(
      'SELECT * FROM competence_certificates WHERE exporter_id = $1 AND (certificate_id::text = $2 OR certificate_number = $2) AND status = $3',
      [exporterUuid, certificateId, 'ACTIVE']
    );
    
    if (compResult.rows.length === 0) {
      return res.status(404).json({ error: 'Competence certificate not found or not approved' });
    }
    
    const competenceData = {
      certificateId: compResult.rows[0].certificate_id,
      certificateNumber: compResult.rows[0].certificate_number,
      issuedAt: compResult.rows[0].issue_date || new Date(),
      expiryDate: compResult.rows[0].expiry_date || new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000)
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get license data from actual qualification table - check both license_id and license_number
    const licenseResult = await postgresService.query(
      'SELECT * FROM export_licenses WHERE exporter_id = $1 AND (license_id::text = $2 OR license_number = $2) AND status = $3',
      [exporterUuid, licenseId, 'ACTIVE']
    );
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Export license not found or not approved' });
    }
    
    const licenseData = {
      licenseNumber: licenseResult.rows[0].license_number,
      licenseId: licenseResult.rows[0].license_id,
      issuedAt: licenseResult.rows[0].issue_date || new Date(),
      expiryDate: licenseResult.rows[0].expiry_date || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)
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
    
    // Get exporter UUID
    const uuidQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const uuidResult = await postgresService.query(uuidQuery, [exporterId]);
    
    if (uuidResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter profile not found' });
    }
    
    const exporterUuid = uuidResult.rows[0].exporter_id;
    
    // Get license data from actual qualification table - check both license_id and license_number
    const licenseResult = await postgresService.query(
      'SELECT * FROM export_licenses WHERE exporter_id = $1 AND (license_id::text = $2 OR license_number = $2) AND status = $3',
      [exporterUuid, licenseId, 'ACTIVE']
    );
    
    if (licenseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Export license not found or not approved' });
    }
    
    const licenseData = {
      licenseNumber: licenseResult.rows[0].license_number,
      licenseId: licenseResult.rows[0].license_id,
      issuedAt: licenseResult.rows[0].issue_date || new Date(),
      expiryDate: licenseResult.rows[0].expiry_date || new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000)
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
 * POST /api/exporter/documents/packing-list/generate
 * Generate packing list for a sales contract
 */
router.post('/documents/packing-list/generate', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    const { contractId, items, shipmentDetails } = req.body;

    if (!contractId || !items || !shipmentDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, items, and shipmentDetails are required'
      });
    }

    // Get exporter profile
    const exporterQuery = 'SELECT * FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterData = exporterResult.rows[0];

    // Generate packing list number
    const packingListNumber = `PL-${Date.now()}-${exporterData.exporter_id}`;

    // Prepare document data
    const documentData = {
      documentNumber: packingListNumber,
      document_type: 'PACKING_LIST',
      exporterId: exporterData.exporter_id,
      issuedAt: new Date().toISOString(),
      document_metadata: {
        contractId,
        items,
        ...shipmentDetails,
        totalPackages: items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0),
        totalWeight: items.reduce((sum, item) => sum + parseFloat(item.weight || 0), 0)
      }
    };

    // Generate PDF
    const { generatePackingListPDF } = require('../utils/document-pdf-generator');
    const pdfBuffer = await generatePackingListPDF(documentData, exporterData);

    // Save to database
    const insertQuery = `
      INSERT INTO issued_documents (
        exporter_id,
        issuer_member_code,
        document_type,
        document_number,
        document_hash,
        document_url,
        document_metadata,
        issued_by,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
      RETURNING document_id
    `;

    const documentHash = require('crypto').createHash('sha256').update(pdfBuffer).digest('hex');
    const documentUrl = `/storage/documents/${packingListNumber}.pdf`;

    const result = await client.query(insertQuery, [
      exporterData.exporter_id,
      'EXPORTER',
      'PACKING_LIST',
      packingListNumber,
      documentHash,
      documentUrl,
      JSON.stringify(documentData.document_metadata),
      userId
    ]);

    // Save PDF file
    const fs = require('fs').promises;
    const path = require('path');
    const storagePath = path.join(__dirname, '../../storage/documents');
    await fs.mkdir(storagePath, { recursive: true });
    await fs.writeFile(path.join(storagePath, `${packingListNumber}.pdf`), pdfBuffer);

    res.json({
      success: true,
      message: 'Packing list generated successfully',
      data: {
        documentId: result.rows[0].document_id,
        documentNumber: packingListNumber,
        downloadUrl: `/api/exporter/documents/${result.rows[0].document_id}/download`
      }
    });

  } catch (error) {
    console.error('[Generate Packing List] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate packing list',
      details: error.message
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/exporter/documents/commercial-invoice/generate
 * Generate commercial invoice for a sales contract
 */
router.post('/documents/commercial-invoice/generate', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id || req.user.username;
    const { contractId, items, buyerDetails, paymentTerms } = req.body;

    if (!contractId || !items || !buyerDetails) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: contractId, items, and buyerDetails are required'
      });
    }

    // Get exporter profile
    const exporterQuery = 'SELECT * FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await client.query(exporterQuery, [userId]);

    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }

    const exporterData = exporterResult.rows[0];

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${exporterData.exporter_id}`;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.unitPrice) * parseFloat(item.quantity));
    }, 0);

    // Prepare document data
    const documentData = {
      documentNumber: invoiceNumber,
      document_type: 'COMMERCIAL_INVOICE',
      exporterId: exporterData.exporter_id,
      issuedAt: new Date().toISOString(),
      document_metadata: {
        contractId,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unitPrice).toFixed(2),
          amount: (parseFloat(item.unitPrice) * parseFloat(item.quantity)).toFixed(2)
        })),
        ...buyerDetails,
        ...paymentTerms,
        subtotal: subtotal.toFixed(2),
        currency: paymentTerms?.currency || 'USD'
      }
    };

    // Generate PDF
    const { generateCommercialInvoicePDF } = require('../utils/document-pdf-generator');
    const pdfBuffer = await generateCommercialInvoicePDF(documentData, exporterData);

    // Save to database
    const insertQuery = `
      INSERT INTO issued_documents (
        exporter_id,
        issuer_member_code,
        document_type,
        document_number,
        document_hash,
        document_url,
        document_metadata,
        issued_by,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
      RETURNING document_id
    `;

    const documentHash = require('crypto').createHash('sha256').update(pdfBuffer).digest('hex');
    const documentUrl = `/storage/documents/${invoiceNumber}.pdf`;

    const result = await client.query(insertQuery, [
      exporterData.exporter_id,
      'EXPORTER',
      'COMMERCIAL_INVOICE',
      invoiceNumber,
      documentHash,
      documentUrl,
      JSON.stringify(documentData.document_metadata),
      userId
    ]);

    // Save PDF file
    const fs = require('fs').promises;
    const path = require('path');
    const storagePath = path.join(__dirname, '../../storage/documents');
    await fs.mkdir(storagePath, { recursive: true });
    await fs.writeFile(path.join(storagePath, `${invoiceNumber}.pdf`), pdfBuffer);

    res.json({
      success: true,
      message: 'Commercial invoice generated successfully',
      data: {
        documentId: result.rows[0].document_id,
        documentNumber: invoiceNumber,
        downloadUrl: `/api/exporter/documents/${result.rows[0].document_id}/download`
      }
    });

  } catch (error) {
    console.error('[Generate Commercial Invoice] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate commercial invoice',
      details: error.message
    });
  } finally {
    client.release();
  }
});


/**
 * GET /api/exporter/documents/collection-status
 * Get document collection status for network submission
 */
router.get('/documents/collection-status', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id || req.user.username;
    
    // Get exporter UUID from postgres
    const exporterQuery = 'SELECT exporter_id FROM exporter_profiles WHERE user_id = $1';
    const exporterResult = await postgresService.query(exporterQuery, [exporterId]);
    
    if (exporterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }
    
    const exporterUuid = exporterResult.rows[0].exporter_id;
    
    // Get all issued documents for this exporter
    const documentsQuery = `
      SELECT 
        document_type,
        document_number,
        issued_at,
        expiry_date,
        status
      FROM issued_documents
      WHERE exporter_id = $1 AND status = 'ACTIVE'
      ORDER BY issued_at DESC
    `;
    
    const documentsResult = await postgresService.query(documentsQuery, [exporterUuid]);
    
    // Categorize documents
    const requiredDocuments = [
      'EXPORT_LICENSE',
      'PHYTOSANITARY_CERTIFICATE',
      'HEALTH_CERTIFICATE',
      'QUALITY_CERTIFICATE',
      'CERTIFICATE_OF_ORIGIN'
    ];
    
    const collectionStatus = {
      totalRequired: requiredDocuments.length,
      collected: 0,
      missing: [],
      documents: {}
    };
    
    // Check which documents are collected
    requiredDocuments.forEach(docType => {
      const doc = documentsResult.rows.find(d => d.document_type === docType);
      if (doc) {
        collectionStatus.collected++;
        collectionStatus.documents[docType] = {
          collected: true,
          documentNumber: doc.document_number,
          issuedAt: doc.issued_at,
          expiryDate: doc.expiry_date
        };
      } else {
        collectionStatus.missing.push(docType);
        collectionStatus.documents[docType] = {
          collected: false
        };
      }
    });
    
    collectionStatus.isComplete = collectionStatus.collected === collectionStatus.totalRequired;
    collectionStatus.completionPercentage = Math.round((collectionStatus.collected / collectionStatus.totalRequired) * 100);
    
    res.json({
      success: true,
      data: collectionStatus
    });
  } catch (error) {
    console.error('[Collection Status] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch collection status',
      details: error.message
    });
  }
});

/**
 * GET /api/exporter/network-prefill
 * Get prefill data for network submission
 */
router.get('/network-prefill', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id || req.user.username;
    
    // Get exporter profile from postgres
    const profileQuery = `
      SELECT 
        exporter_id,
        business_name,
        tin,
        registration_number,
        office_address,
        city,
        region,
        contact_person,
        email,
        phone
      FROM exporter_profiles
      WHERE user_id = $1
    `;
    
    const profileResult = await postgresService.query(profileQuery, [exporterId]);
    
    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Exporter profile not found'
      });
    }
    
    const profile = profileResult.rows[0];
    
    // Get latest finalized sales contract
    const contractQuery = `
      SELECT 
        draft_id,
        buyer_name,
        buyer_country,
        coffee_type,
        quantity_kg,
        price_per_kg,
        total_value,
        currency,
        incoterms,
        port_of_loading,
        port_of_discharge
      FROM contract_drafts
      WHERE exporter_id = $1 AND status = 'FINALIZED'
      ORDER BY updated_at DESC
      LIMIT 1
    `;
    
    const contractResult = await postgresService.query(contractQuery, [profile.exporter_id]);
    
    const prefillData = {
      exporter: {
        exporterId: profile.exporter_id,
        businessName: profile.business_name,
        tin: profile.tin,
        registrationNumber: profile.registration_number,
        address: profile.office_address,
        city: profile.city,
        region: profile.region,
        contactPerson: profile.contact_person,
        email: profile.email,
        phone: profile.phone
      },
      contract: contractResult.rows.length > 0 ? {
        contractId: contractResult.rows[0].draft_id,
        buyerName: contractResult.rows[0].buyer_name,
        buyerCountry: contractResult.rows[0].buyer_country,
        coffeeType: contractResult.rows[0].coffee_type,
        quantityKg: contractResult.rows[0].quantity_kg,
        pricePerKg: contractResult.rows[0].price_per_kg,
        totalValue: contractResult.rows[0].total_value,
        currency: contractResult.rows[0].currency,
        incoterms: contractResult.rows[0].incoterms,
        portOfLoading: contractResult.rows[0].port_of_loading,
        portOfDischarge: contractResult.rows[0].port_of_discharge
      } : null
    };
    
    res.json({
      success: true,
      data: prefillData
    });
  } catch (error) {
    console.error('[Network Prefill] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prefill data',
      details: error.message
    });
  }
});
