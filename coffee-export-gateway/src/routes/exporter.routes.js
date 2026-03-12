const express = require('express');
const router = express.Router();
const fabricService = require('../services');
const postgresService = require('../services/postgres');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
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
      
      // Get pre-registration data from PostgreSQL
      const preRegQuery = `
        SELECT * FROM ecta_pre_registration
        WHERE exporter_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `;
      const preRegResult = await postgresService.query(preRegQuery, [exporterId]);
      
      if (preRegResult.rows.length > 0) {
        preRegData = preRegResult.rows[0];
        console.log(`[Dashboard] Pre-registration data found for ${exporterId}`);
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
    
    // Build dashboard from PostgreSQL data
    const profileApproved = profile.status === 'ACTIVE' || profile.status === 'active';
    const laboratoryStatus = preRegData?.laboratory_status || 'MISSING';
    const laboratoryApproved = laboratoryStatus === 'APPROVED' || laboratoryStatus === 'approved';
    const tasterStatus = preRegData?.taster_status || 'MISSING';
    const tasterApproved = tasterStatus === 'APPROVED' || tasterStatus === 'approved';
    const competenceStatus = preRegData?.competence_status || 'MISSING';
    const competenceApproved = competenceStatus === 'APPROVED' || competenceStatus === 'approved';
    const licenseStatus = preRegData?.license_status || 'MISSING';
    const licenseApproved = licenseStatus === 'APPROVED' || licenseStatus === 'approved';
    
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
        laboratoryCertificationNumber: preRegData?.laboratory_cert_number || null,
        tasterCertificateNumber: preRegData?.taster_cert_number || null,
        competenceCertificateNumber: preRegData?.competence_cert_number || null,
        competenceCertificateId: preRegData?.competence_cert_id || null,
        exportLicenseNumber: preRegData?.license_number || null,
        exportLicenseId: preRegData?.license_id || null,
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
    
    // Update PostgreSQL with AUTO-APPROVED status
    const updateQuery = `
      UPDATE ecta_pre_registration 
      SET laboratory_status = 'APPROVED',
          laboratory_cert_number = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE exporter_id = $2
      RETURNING *
    `;
    
    const result = await postgresService.query(updateQuery, [certificateNumber, exporterId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter pre-registration record not found' });
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
    
    // Check prerequisites: Laboratory must be approved
    const checkQuery = `
      SELECT laboratory_status 
      FROM ecta_pre_registration 
      WHERE exporter_id = $1
    `;
    const checkResult = await postgresService.query(checkQuery, [exporterId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter pre-registration record not found' });
    }
    
    const labStatus = checkResult.rows[0].laboratory_status;
    if (labStatus !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Laboratory must be approved before registering taster',
        requiredStep: 'laboratory_approval',
        currentStatus: labStatus
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
    
    // Update PostgreSQL with AUTO-APPROVED status
    const updateQuery = `
      UPDATE ecta_pre_registration 
      SET taster_status = 'APPROVED',
          taster_cert_number = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE exporter_id = $2
      RETURNING *
    `;
    
    const result = await postgresService.query(updateQuery, [certificateNumber, exporterId]);
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
      SELECT laboratory_status, taster_status 
      FROM ecta_pre_registration 
      WHERE exporter_id = $1
    `;
    const checkResult = await postgresService.query(checkQuery, [exporterId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter pre-registration record not found' });
    }
    
    const { laboratory_status, taster_status } = checkResult.rows[0];
    
    if (laboratory_status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Laboratory must be approved before applying for competence certificate',
        requiredStep: 'laboratory_approval',
        currentStatus: laboratory_status
      });
    }
    
    if (taster_status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Taster must be approved before applying for competence certificate',
        requiredStep: 'taster_approval',
        currentStatus: taster_status
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
    
    // Update PostgreSQL with AUTO-APPROVED status
    const updateQuery = `
      UPDATE ecta_pre_registration 
      SET competence_status = 'APPROVED',
          competence_cert_number = $1,
          competence_cert_id = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE exporter_id = $3
      RETURNING *
    `;
    
    const result = await postgresService.query(updateQuery, [certificateNumber, certificateId, exporterId]);
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
      SELECT laboratory_status, taster_status, competence_status 
      FROM ecta_pre_registration 
      WHERE exporter_id = $1
    `;
    const checkResult = await postgresService.query(checkQuery, [exporterId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Exporter pre-registration record not found' });
    }
    
    const { laboratory_status, taster_status, competence_status } = checkResult.rows[0];
    
    if (laboratory_status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Laboratory must be approved before applying for export license',
        requiredStep: 'laboratory_approval',
        currentStatus: laboratory_status
      });
    }
    
    if (taster_status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Taster must be approved before applying for export license',
        requiredStep: 'taster_approval',
        currentStatus: taster_status
      });
    }
    
    if (competence_status !== 'APPROVED') {
      return res.status(400).json({ 
        error: 'Competence certificate must be approved before applying for export license',
        requiredStep: 'competence_approval',
        currentStatus: competence_status
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
    
    // Update PostgreSQL with AUTO-APPROVED status
    const updateQuery = `
      UPDATE ecta_pre_registration 
      SET license_status = 'APPROVED',
          license_number = $1,
          license_id = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE exporter_id = $3
      RETURNING *
    `;
    
    const result = await postgresService.query(updateQuery, [licenseNumber, licenseId, exporterId]);
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
    
    // Get laboratory data
    const labResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (labResult.rows.length === 0 || labResult.rows[0].laboratory_status !== 'APPROVED') {
      return res.status(404).json({ error: 'Laboratory certificate not found or not approved' });
    }
    
    const laboratoryData = {
      certificateNumber: labResult.rows[0].laboratory_cert_number,
      issuedAt: new Date(),
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
    
    // Get taster data
    const tasterResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (tasterResult.rows.length === 0 || tasterResult.rows[0].taster_status !== 'APPROVED') {
      return res.status(404).json({ error: 'Taster certificate not found or not approved' });
    }
    
    const tasterData = {
      certificateNumber: tasterResult.rows[0].taster_cert_number,
      issuedAt: new Date(),
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
    
    // Get competence data
    const compResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (compResult.rows.length === 0 || compResult.rows[0].competence_status !== 'APPROVED') {
      return res.status(404).json({ error: 'Competence certificate not found or not approved' });
    }
    
    const competenceData = {
      certificateId: compResult.rows[0].competence_cert_id,
      certificateNumber: compResult.rows[0].competence_cert_number,
      issuedAt: new Date(),
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
    
    // Get license data
    const licenseResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1',
      [exporterId]
    );
    
    if (licenseResult.rows.length === 0 || licenseResult.rows[0].license_status !== 'APPROVED') {
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
    
    // Get laboratory data
    const labResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1 AND laboratory_cert_number = $2',
      [exporterId, certificateNumber]
    );
    
    if (labResult.rows.length === 0 || labResult.rows[0].laboratory_status !== 'APPROVED') {
      return res.status(404).json({ error: 'Laboratory certificate not found or not approved' });
    }
    
    const { generateLaboratoryCertificatePDF } = require('../utils/certificate-pdf');
    
    const laboratoryData = {
      certificateNumber: labResult.rows[0].laboratory_cert_number,
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
    
    // Get taster data
    const tasterResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1 AND taster_cert_number = $2',
      [exporterId, certificateNumber]
    );
    
    if (tasterResult.rows.length === 0 || tasterResult.rows[0].taster_status !== 'APPROVED') {
      return res.status(404).json({ error: 'Taster certificate not found or not approved' });
    }
    
    const { generateTasterCertificatePDF } = require('../utils/certificate-pdf');
    
    const tasterData = {
      certificateNumber: tasterResult.rows[0].taster_cert_number,
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
    
    // Get competence data - check both cert_id and cert_number
    const compResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1 AND (competence_cert_id = $2 OR competence_cert_number = $2)',
      [exporterId, certificateId]
    );
    
    if (compResult.rows.length === 0 || compResult.rows[0].competence_status !== 'APPROVED') {
      return res.status(404).json({ error: 'Competence certificate not found or not approved' });
    }
    
    const { generateCompetenceCertificatePDF } = require('../utils/certificate-pdf');
    
    const competenceData = {
      certificateNumber: compResult.rows[0].competence_cert_number,
      certificateId: compResult.rows[0].competence_cert_id
    };
    
    const { filepath, filename } = await generateCompetenceCertificatePDF(exporterData, competenceData);
    
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
    
    // Get license data - check both license_id and license_number
    const licenseResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1 AND (license_id = $2 OR license_number = $2)',
      [exporterId, licenseId]
    );
    
    if (licenseResult.rows.length === 0 || licenseResult.rows[0].license_status !== 'APPROVED') {
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
    
    // Get license data - check both license_id and license_number
    const licenseResult = await postgresService.query(
      'SELECT * FROM ecta_pre_registration WHERE exporter_id = $1 AND (license_id = $2 OR license_number = $2)',
      [exporterId, licenseId]
    );
    
    if (licenseResult.rows.length === 0 || licenseResult.rows[0].license_status !== 'APPROVED') {
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

