const express = require('express');
const router = express.Router();
const fabricService = require('../services');
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
        exporterProfile = JSON.parse(profileResult);
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
    
    // Update user status on blockchain
    await fabricService.updateUserStatus(username, {
      status: 'approved',
      approvedBy: req.user.id,
      comments: comments || ''
    });

    // Also approve profile stage on exporter profile
    try {
      await fabricService.submitTransaction(
        req.user.id,
        process.env.CHAINCODE_NAME || 'ecta',
        'ApprovePreRegistration',
        username,
        'profile'
      );
    } catch (error) {
      console.log('Profile approval on exporter record:', error.message);
    }
    
    // Send approval notification email
    notificationService.notifyProfileApproved(user, req.user.id)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Registration approved successfully',
      username,
      status: 'approved',
      approvedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Reject exporter registration (ECTA only)
 * NOW FULLY BLOCKCHAIN-BASED ✅
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
    
    // Update user status on blockchain
    await fabricService.updateUserStatus(username, {
      status: 'rejected',
      rejectedBy: req.user.id,
      reason: reason
    });
    
    // Send rejection notification email
    notificationService.notifyProfileRejected(user, req.user.id, reason)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Registration rejected',
      username,
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      reason
    });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Submit qualification document (Exporter only - after approval)
 * NOW CHECKS BLOCKCHAIN FOR USER STATUS ✅
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
    
    const qualificationData = {
      exporterId,
      stage,
      ...req.body,
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
      stage
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
    
    const profile = JSON.parse(result);
    
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
 */
router.post('/qualifications/:username/:stage/approve', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { username, stage } = req.params;
    const { comments } = req.body;
    
    await fabricService.submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'ApprovePreRegistration',
      username,
      stage
    );
    
    // Get user details for notification
    try {
      const user = await fabricService.getUser(username);
      notificationService.notifyQualificationApproved(user, stage, { comments })
        .catch(err => console.error('Email notification failed:', err));
    } catch (error) {
      console.log('Could not send notification:', error.message);
    }
    
    res.json({
      success: true,
      message: `${stage} qualification approved`,
      username,
      stage
    });
  } catch (error) {
    console.error('Approve qualification error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Issue export license (ECTA only)
 */
router.post('/license/issue', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId, licenseNumber, expiryDate } = req.body;
    
    if (!exporterId || !licenseNumber || !expiryDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update user status to active
    const user = users.get(exporterId);
    if (user) {
      user.status = 'active';
      user.licenseNumber = licenseNumber;
      user.licenseIssuedAt = new Date().toISOString();
      user.licenseExpiryDate = expiryDate;
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
    
    res.json({
      success: true,
      message: 'Export license issued successfully',
      exporterId,
      licenseNumber,
      expiryDate
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
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetPendingQualifications',
      'laboratory'
    );
    
    const pending = JSON.parse(result);
    res.json(pending);
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
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetPendingQualifications',
      'taster'
    );
    
    const pending = JSON.parse(result);
    res.json(pending);
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
    const result = await fabricService.evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetPendingQualifications',
      'competenceCertificate'
    );
    
    const pending = JSON.parse(result);
    res.json(pending);
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
    
    const pending = JSON.parse(result);
    res.json(pending);
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
    // Query blockchain for all exporter users
    const exporterUsers = await fabricService.getUsersByRole('exporter');
    
    const allExporters = exporterUsers.map(item => {
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
        status: user.status.toUpperCase(),
        registeredAt: user.registeredAt,
        approvedAt: user.approvedAt,
        licenseNumber: user.licenseNumber
      };
    });
    
    res.json(allExporters);
  } catch (error) {
    console.error('Get all exporters error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get global statistics (ECTA only)
 * Returns dashboard statistics
 */
router.get('/global-stats', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Get all exporter users
    const exporterUsers = await fabricService.getUsersByRole('exporter');
    
    // Calculate statistics
    const stats = {
      exporters: {
        total: exporterUsers.length,
        pending: exporterUsers.filter(u => u.record.status === 'pending_approval').length,
        approved: exporterUsers.filter(u => u.record.status === 'approved').length,
        rejected: exporterUsers.filter(u => u.record.status === 'rejected').length,
        active: exporterUsers.filter(u => u.record.status === 'active').length
      },
      licenses: {
        total: exporterUsers.filter(u => u.record.licenseNumber).length,
        active: exporterUsers.filter(u => u.record.status === 'active' && u.record.licenseNumber).length,
        pending: 0, // To be implemented when license application tracking is added
        expired: 0  // To be implemented when expiry tracking is added
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
 */
router.get('/preregistration/dashboard/stats', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Get all exporter users
    let exporterUsers = [];
    try {
      exporterUsers = await fabricService.getUsersByRole('exporter');
    } catch (error) {
      console.log('No exporter users found or chaincode function not available:', error.message);
      // Return default stats if chaincode function doesn't exist yet
      return res.json({
        totalExporters: 0,
        pendingRegistrations: 0,
        approvedExporters: 0,
        rejectedApplications: 0,
        activeLicenses: 0
      });
    }
    
    // Ensure exporterUsers is an array
    if (!Array.isArray(exporterUsers)) {
      console.log('Exporter users is not an array:', exporterUsers);
      return res.json({
        totalExporters: 0,
        pendingRegistrations: 0,
        approvedExporters: 0,
        rejectedApplications: 0,
        activeLicenses: 0
      });
    }
    
    // Calculate statistics
    const stats = {
      totalExporters: exporterUsers.length,
      pendingRegistrations: exporterUsers.filter(u => u?.record?.status === 'pending_approval').length,
      approvedExporters: exporterUsers.filter(u => {
        const status = u?.record?.status;
        return status === 'approved' || status === 'active';
      }).length,
      rejectedApplications: exporterUsers.filter(u => u?.record?.status === 'rejected').length,
      activeLicenses: exporterUsers.filter(u => {
        const record = u?.record;
        return record?.status === 'active' && record?.licenseNumber;
      }).length
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending exporters for pre-registration (ECTA only)
 */
router.get('/preregistration/exporters/pending', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    // Query blockchain for pending users
    let pendingUsers = [];
    try {
      pendingUsers = await fabricService.getPendingUsers();
    } catch (error) {
      console.log('No pending users found or chaincode function not available:', error.message);
      // Return empty array if chaincode function doesn't exist yet
      return res.json([]);
    }
    
    // Ensure pendingUsers is an array
    if (!Array.isArray(pendingUsers)) {
      console.log('Pending users is not an array:', pendingUsers);
      return res.json([]);
    }
    
    // Format data for frontend compatibility
    const pendingExporters = pendingUsers.map(item => {
      const user = item?.record || item || {};
      return {
        exporter_id: user.username || 'unknown',
        username: user.username || 'unknown',
        email: user.email || '',
        phone: user.phone || '',
        businessName: user.companyName || user.businessName || 'N/A',
        companyName: user.companyName || user.businessName || 'N/A',
        tin: user.tin || 'N/A',
        businessType: user.businessType || 'EXPORTER',
        minimumCapital: user.capitalETB || user.minimumCapital || 50000000,
        status: user.status?.toUpperCase() || 'PENDING',
        registeredAt: user.registeredAt || new Date().toISOString(),
        blockchainData: user
      };
    }).filter(exporter => exporter.username !== 'unknown'); // Filter out invalid entries
    
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
    
    // Get user from blockchain
    let user;
    try {
      user = await fabricService.getUser(username);
    } catch (error) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    if (user.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Exporter is not pending approval' });
    }
    
    // Update user status on blockchain
    await fabricService.updateUserStatus(username, {
      status: 'approved',
      approvedBy: req.user.id,
      comments: comments || ''
    });

    // Also approve profile stage on exporter profile
    try {
      await fabricService.submitTransaction(
        req.user.id,
        process.env.CHAINCODE_NAME || 'ecta',
        'ApprovePreRegistration',
        username,
        'profile'
      );
    } catch (error) {
      console.log('Profile approval on exporter record:', error.message);
    }
    
    // Send approval notification email
    notificationService.notifyProfileApproved(user, req.user.id)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Exporter approved successfully',
      username,
      status: 'approved',
      approvedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Approve exporter error:', error);
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
    
    // Get user from blockchain
    let user;
    try {
      user = await fabricService.getUser(username);
    } catch (error) {
      return res.status(404).json({ error: 'Exporter not found' });
    }
    
    if (user.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Exporter is not pending approval' });
    }
    
    // Update user status on blockchain
    await fabricService.updateUserStatus(username, {
      status: 'rejected',
      rejectedBy: req.user.id,
      reason: reason
    });
    
    // Send rejection notification email
    notificationService.notifyProfileRejected(user, req.user.id, reason)
      .catch(err => console.error('Email notification failed:', err));
    
    res.json({
      success: true,
      message: 'Exporter rejected',
      username,
      status: 'rejected',
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
      profile = JSON.parse(profileResult);
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
        const profile = JSON.parse(profileResult);
        
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

    const profile = JSON.parse(profileResult);

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

module.exports = router;
