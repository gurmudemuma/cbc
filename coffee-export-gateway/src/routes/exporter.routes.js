const express = require('express');
const router = express.Router();
const fabricService = require('../services');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { createUser } = require('./auth.routes');

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
    const exporterId = req.user.id;
    const user = req.user;
    
    // Get exporter profile
    let profile = null;
    try {
      const profileResult = await fabricService.evaluateTransaction(
        exporterId,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterProfile',
        exporterId
      );
      profile = JSON.parse(profileResult);
    } catch (error) {
      console.log('No profile found for exporter:', exporterId);
    }
    
    // Get exports
    let exports = [];
    try {
      const exportsResult = await fabricService.evaluateTransaction(
        exporterId,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterExports',
        exporterId
      );
      exports = JSON.parse(exportsResult);
    } catch (error) {
      console.log('No exports found for exporter:', exporterId);
    }
    
    // Calculate statistics
    const stats = {
      totalExports: exports.length,
      activeExports: exports.filter(e => e?.record?.status !== 'completed' && e?.record?.status !== 'rejected').length,
      completedExports: exports.filter(e => e?.record?.status === 'completed').length,
      pendingApprovals: exports.filter(e => e?.record?.status === 'pending').length,
      totalValue: exports.reduce((sum, e) => sum + (e?.record?.estimatedValue || 0), 0)
    };
    
    // Transform to match ExporterDashboard component expectations
    const preRegStatus = profile?.preRegistrationStatus || {};
    
    // Helper function to extract status string
    const getStatusString = (status) => {
      if (!status) return 'pending';
      if (typeof status === 'string') return status;
      if (typeof status === 'object' && status.status) return status.status;
      return 'pending';
    };
    
    // Extract status strings
    const profileStatus = getStatusString(preRegStatus.profile);
    const laboratoryStatus = getStatusString(preRegStatus.laboratory);
    const tasterStatus = getStatusString(preRegStatus.taster);
    const competenceStatus = getStatusString(preRegStatus.competenceCertificate);
    const licenseStatus = getStatusString(preRegStatus.license);
    
    // Calculate required actions
    const requiredActions = [];
    if (profileStatus === 'pending') {
      requiredActions.push('Complete profile registration');
    }
    if (laboratoryStatus === 'pending') {
      requiredActions.push('Register and certify laboratory');
    }
    if (tasterStatus === 'pending') {
      requiredActions.push('Register and verify taster');
    }
    if (competenceStatus === 'pending') {
      requiredActions.push('Apply for competence certificate');
    }
    if (licenseStatus === 'pending') {
      requiredActions.push('Apply for export license');
    }
    
    const dashboardData = {
      identity: {
        exporterId: exporterId,
        businessName: profile?.companyName || user?.companyName || 'N/A',
        tin: profile?.tin || user?.tin || 'N/A',
        registrationNumber: profile?.registrationNumber || exporterId,
        businessType: profile?.businessType || 'EXPORTER'
      },
      contact: {
        contactPerson: profile?.contactPerson || user?.contactPerson || 'N/A',
        email: profile?.email || user?.email || 'N/A',
        phone: profile?.phone || user?.phone || 'N/A',
        officeAddress: profile?.address || profile?.officeAddress || 'N/A',
        city: profile?.city || 'N/A',
        region: profile?.region || 'N/A'
      },
      compliance: {
        profileStatus: profileStatus,
        profileApproved: profileStatus === 'approved',
        capitalVerified: profile?.capitalVerified || false,
        laboratoryStatus: laboratoryStatus,
        laboratoryApproved: laboratoryStatus === 'approved',
        tasterStatus: tasterStatus,
        tasterApproved: tasterStatus === 'approved',
        competenceStatus: competenceStatus,
        competenceApproved: competenceStatus === 'approved',
        licenseStatus: licenseStatus,
        licenseApproved: licenseStatus === 'approved',
        isFullyQualified: profile?.status === 'active' && profile?.licenseNumber
      },
      documents: {
        registrationNumber: profile?.registrationNumber || exporterId,
        laboratoryCertificationNumber: profile?.laboratoryCertificationNumber || null,
        tasterCertificateNumber: profile?.tasterVerificationNumber || null,
        competenceCertificateNumber: profile?.competenceCertificateNumber || null,
        competenceCertificateId: profile?.competenceCertificateId || null,
        exportLicenseNumber: profile?.licenseNumber || null,
        exportLicenseId: profile?.exportLicenseId || null,
        eicRegistrationNumber: profile?.eicRegistrationNumber || null
      },
      validation: {
        isValid: requiredActions.length === 0,
        issues: requiredActions,
        requiredActions: requiredActions
      },
      metadata: {
        lastUpdated: profile?.updatedAt || new Date().toISOString(),
        createdAt: profile?.createdAt || profile?.submittedAt || new Date().toISOString()
      },
      statistics: stats,
      recentExports: exports.slice(0, 5).map(e => {
        const record = e?.record || e || {};
        return {
          exportId: record.exportId || record.id || 'N/A',
          status: record.status || 'pending',
          productType: record.productType || 'N/A',
          quantity: record.quantity || 0,
          destination: record.destinationCountry || record.destination || 'N/A',
          estimatedValue: record.estimatedValue || 0,
          submittedAt: record.submittedAt || record.createdAt || new Date().toISOString()
        };
      }),
      profile: profile
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
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
            status.laboratory.certified = preReg.laboratory === 'approved';
            status.laboratory.certificationNumber = profile.laboratoryCertificationNumber;
            status.laboratory.expiryDate = profile.laboratoryCertificationExpiry;
          }
          
          // Taster status
          if (preReg.taster) {
            status.taster.registered = true;
            status.taster.verified = preReg.taster === 'approved';
            status.taster.verificationNumber = profile.tasterVerificationNumber;
          }
          
          // Competence certificate status
          if (preReg.competenceCertificate) {
            status.competenceCertificate.applied = true;
            status.competenceCertificate.valid = preReg.competenceCertificate === 'approved';
            status.competenceCertificate.certificateNumber = profile.competenceCertificateNumber;
            status.competenceCertificate.certificate_id = profile.competenceCertificateId;
            status.competenceCertificate.issueDate = profile.competenceCertificateIssueDate;
            status.competenceCertificate.expiryDate = profile.competenceCertificateExpiry;
          }
          
          // Export license status
          if (preReg.license) {
            status.exportLicense.applied = true;
            status.exportLicense.valid = preReg.license === 'approved';
            status.exportLicense.licenseNumber = profile.licenseNumber;
            status.exportLicense.license_id = profile.exportLicenseId;
            status.exportLicense.issueDate = profile.licenseIssuedDate;
            status.exportLicense.expiryDate = profile.licenseExpiryDate;
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
 */
router.post('/laboratory/register', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    const laboratoryData = {
      exporterId,
      ...req.body,
      submittedAt: new Date().toISOString()
    };
    
    // Submit to blockchain
    await fabricService.submitTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitQualificationDocument',
      JSON.stringify({ ...laboratoryData, stage: 'laboratory' })
    );
    
    res.json({
      success: true,
      message: 'Laboratory registration submitted successfully'
    });
  } catch (error) {
    console.error('Laboratory registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Register taster (Exporter Portal)
 * Requires: Profile approved
 */
router.post('/taster/register', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Check prerequisites: Profile must be approved
    try {
      const profileResult = await fabricService.evaluateTransaction(
        exporterId,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterProfile',
        exporterId
      );
      const profile = JSON.parse(profileResult);
      
      const profileStatus = profile?.preRegistrationStatus?.profile;
      const profileApproved = profileStatus === 'approved' || profileStatus === 'APPROVED';
      
      console.log('Taster registration - Profile check:', {
        exporterId,
        profileStatus,
        profileApproved,
        fullProfile: profile
      });
      
      if (!profileApproved) {
        return res.status(400).json({ 
          error: 'Profile must be approved before registering taster',
          requiredStep: 'profile_approval',
          currentStatus: profileStatus
        });
      }
    } catch (error) {
      console.log('Profile check error:', error.message);
      return res.status(400).json({ 
        error: 'Profile must be approved before registering taster. Please complete profile registration first.',
        requiredStep: 'profile_approval',
        details: error.message
      });
    }
    
    const tasterData = {
      exporterId,
      ...req.body,
      submittedAt: new Date().toISOString()
    };
    
    // Submit to blockchain
    await fabricService.submitTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitQualificationDocument',
      JSON.stringify({ ...tasterData, stage: 'taster' })
    );
    
    res.json({
      success: true,
      message: 'Taster registration submitted successfully'
    });
  } catch (error) {
    console.error('Taster registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Apply for competence certificate (Exporter Portal)
 * Requires: Profile, Laboratory, AND Taster approved
 */
router.post('/competence/apply', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Check prerequisites: Profile, Laboratory, AND Taster must be approved
    try {
      const profileResult = await fabricService.evaluateTransaction(
        exporterId,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterProfile',
        exporterId
      );
      const profile = JSON.parse(profileResult);
      
      const preReg = profile?.preRegistrationStatus || {};
      const profileApproved = preReg.profile === 'approved' || preReg.profile === 'APPROVED';
      const labApproved = preReg.laboratory === 'approved' || preReg.laboratory === 'APPROVED';
      const tasterApproved = preReg.taster === 'approved' || preReg.taster === 'APPROVED';
      
      if (!profileApproved) {
        return res.status(400).json({ 
          error: 'Profile must be approved before applying for competence certificate',
          requiredStep: 'profile_approval'
        });
      }
      
      if (!labApproved) {
        return res.status(400).json({ 
          error: 'Laboratory must be approved before applying for competence certificate',
          requiredStep: 'laboratory_approval'
        });
      }
      
      if (!tasterApproved) {
        return res.status(400).json({ 
          error: 'Taster must be approved before applying for competence certificate',
          requiredStep: 'taster_approval'
        });
      }
    } catch (error) {
      console.log('Prerequisites check error:', error.message);
      return res.status(400).json({ 
        error: 'Prerequisites not met. Profile, Laboratory, and Taster must be approved.',
        requiredStep: 'prerequisites'
      });
    }
    
    const competenceData = {
      exporterId,
      ...req.body,
      submittedAt: new Date().toISOString()
    };
    
    // Submit to blockchain
    await fabricService.submitTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitQualificationDocument',
      JSON.stringify({ ...competenceData, stage: 'competenceCertificate' })
    );
    
    res.json({
      success: true,
      message: 'Competence certificate application submitted successfully'
    });
  } catch (error) {
    console.error('Competence certificate application error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Apply for export license (Exporter Portal)
 * Requires: Profile, Laboratory, Taster, AND Competence approved
 */
router.post('/license/apply', authenticateToken, async (req, res) => {
  try {
    const exporterId = req.user.id;
    
    // Check prerequisites: All previous stages must be approved
    try {
      const profileResult = await fabricService.evaluateTransaction(
        exporterId,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetExporterProfile',
        exporterId
      );
      const profile = JSON.parse(profileResult);
      
      const preReg = profile?.preRegistrationStatus || {};
      const profileApproved = preReg.profile === 'approved' || preReg.profile === 'APPROVED';
      const labApproved = preReg.laboratory === 'approved' || preReg.laboratory === 'APPROVED';
      const tasterApproved = preReg.taster === 'approved' || preReg.taster === 'APPROVED';
      const competenceApproved = preReg.competenceCertificate === 'approved' || preReg.competenceCertificate === 'APPROVED';
      
      if (!profileApproved) {
        return res.status(403).json({ 
          error: 'Profile must be approved before applying for export license',
          requiredStep: 'profile_approval'
        });
      }
      
      if (!labApproved) {
        return res.status(403).json({ 
          error: 'Laboratory must be approved before applying for export license',
          requiredStep: 'laboratory_approval'
        });
      }
      
      if (!tasterApproved) {
        return res.status(403).json({ 
          error: 'Taster must be approved before applying for export license',
          requiredStep: 'taster_approval'
        });
      }
      
      if (!competenceApproved) {
        return res.status(403).json({ 
          error: 'Competence certificate must be approved before applying for export license',
          requiredStep: 'competence_approval'
        });
      }
    } catch (error) {
      console.log('Prerequisites check error:', error.message);
      return res.status(403).json({ 
        error: 'Prerequisites not met. All previous stages must be approved.',
        requiredStep: 'prerequisites'
      });
    }
    
    const licenseData = {
      exporterId,
      ...req.body,
      submittedAt: new Date().toISOString()
    };
    
    // Submit to blockchain
    await fabricService.submitTransaction(
      exporterId,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitQualificationDocument',
      JSON.stringify({ ...licenseData, stage: 'license' })
    );
    
    res.json({
      success: true,
      message: 'Export license application submitted successfully'
    });
  } catch (error) {
    console.error('Export license application error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
