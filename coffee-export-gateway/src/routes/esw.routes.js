const express = require('express');
const router = express.Router();
const { submitTransaction, evaluateTransaction } = require('../services');
const { authenticateToken } = require('../middleware/auth');

/**
 * Submit ESW (Export Single Window) request
 */
router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const eswData = {
      exporterId: req.user.id,
      companyName: req.user.companyName,
      ...req.body,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };

    // Validate required fields
    const required = ['productType', 'quantity', 'destinationCountry', 'estimatedValue'];
    for (const field of required) {
      if (!eswData[field]) {
        return res.status(400).json({ error: `Missing required field: ${field}` });
      }
    }

    const result = await submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'SubmitESWRequest',
      JSON.stringify(eswData)
    );

    res.json({
      success: true,
      message: 'ESW request submitted',
      requestId: result
    });
  } catch (error) {
    console.error('ESW submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all ESW submissions for current exporter
 */
router.get('/my-submissions', authenticateToken, async (req, res) => {
  try {
    const result = await evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetMyESWSubmissions',
      req.user.id
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('ESW fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific ESW submission by ID
 */
router.get('/:requestId', authenticateToken, async (req, res) => {
  try {
    const result = await evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetESWRequest',
      req.params.requestId
    );

    const eswRequest = JSON.parse(result);
    
    // Verify ownership
    if (eswRequest.exporterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(eswRequest);
  } catch (error) {
    console.error('ESW fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ESW approval status
 */
router.get('/:requestId/status', authenticateToken, async (req, res) => {
  try {
    const result = await evaluateTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'GetESWApprovalStatus',
      req.params.requestId
    );

    res.json(JSON.parse(result));
  } catch (error) {
    console.error('Status fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Approve ESW request (for authorized agencies)
 */
router.post('/:requestId/approve', authenticateToken, async (req, res) => {
  try {
    const { agency, comments } = req.body;

    if (!agency) {
      return res.status(400).json({ error: 'Agency name required' });
    }

    const approvalData = {
      requestId: req.params.requestId,
      agency,
      approver: req.user.id,
      comments: comments || '',
      approvedAt: new Date().toISOString()
    };

    const result = await submitTransaction(
      req.user.id,
      process.env.CHAINCODE_NAME || 'ecta',
      'ApproveESWRequest',
      JSON.stringify(approvalData)
    );

    res.json({
      success: true,
      message: 'ESW request approved',
      txResult: result
    });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ESW statistics
 */
router.get('/statistics', authenticateToken, async (req, res) => {
  try {
    // Try to get statistics from blockchain
    try {
      const result = await evaluateTransaction(
        req.user.id,
        process.env.CHAINCODE_NAME || 'ecta',
        'GetESWStatistics'
      );
      res.json(JSON.parse(result));
    } catch (error) {
      // If chaincode function doesn't exist, return default stats
      console.log('ESW statistics not available from chaincode, returning defaults');
      res.json({
        totalSubmissions: 0,
        pendingApprovals: 0,
        approved: 0,
        rejected: 0,
        byAgency: {}
      });
    }
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get ESW submissions with filters
 */
router.get('/submissions', authenticateToken, async (req, res) => {
  try {
    const { status, agency } = req.query;
    
    // Try to get submissions from blockchain
    try {
      let result;
      if (req.user.role === 'exporter') {
        // Exporters see only their submissions
        result = await evaluateTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'GetMyESWSubmissions',
          req.user.id
        );
      } else {
        // Agencies see all submissions
        result = await evaluateTransaction(
          req.user.id,
          process.env.CHAINCODE_NAME || 'ecta',
          'GetAllESWSubmissions'
        );
      }
      
      let submissions = JSON.parse(result);
      
      // Apply filters
      if (status) {
        submissions = submissions.filter(s => s.record.status === status);
      }
      if (agency) {
        submissions = submissions.filter(s => 
          s.record.approvals && s.record.approvals.some(a => a.agency === agency)
        );
      }
      
      res.json(submissions);
    } catch (error) {
      // If chaincode function doesn't exist, return empty array
      console.log('ESW submissions not available from chaincode, returning empty array');
      res.json([]);
    }
  } catch (error) {
    console.error('Submissions fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get agencies for current user
 */
router.get('/agencies/my/list', authenticateToken, async (req, res) => {
  try {
    // Return list of agencies based on user role
    const agencies = [];
    
    if (req.user.role === 'admin' || req.user.role === 'ecta') {
      agencies.push({ id: 'ECTA', name: 'Ethiopian Coffee & Tea Authority' });
    }
    
    if (req.user.role === 'admin' || req.user.role === 'customs') {
      agencies.push({ id: 'ERCA', name: 'Ethiopian Revenues and Customs Authority' });
    }
    
    if (req.user.role === 'admin' || req.user.role === 'nbe') {
      agencies.push({ id: 'NBE', name: 'National Bank of Ethiopia' });
    }
    
    if (req.user.role === 'admin' || req.user.role === 'ecx') {
      agencies.push({ id: 'ECX', name: 'Ethiopian Commodity Exchange' });
    }
    
    // Add government agencies
    const govAgencies = [
      { id: 'MOT', name: 'Ministry of Trade' },
      { id: 'MOA', name: 'Ministry of Agriculture' },
      { id: 'MOH', name: 'Ministry of Health' },
      { id: 'EIC', name: 'Ethiopian Investment Commission' },
      { id: 'EPA', name: 'Environment Protection Authority' },
      { id: 'MOFED', name: 'Ministry of Finance and Economic Development' },
      { id: 'MOTI', name: 'Ministry of Transport and Infrastructure' },
      { id: 'MIDROC', name: 'Ministry of Industry' },
      { id: 'QSAE', name: 'Quality and Standards Authority' },
      { id: 'FDRE_CUSTOMS', name: 'Federal Democratic Republic Customs' },
      { id: 'TRADE_REMEDY', name: 'Trade Remedy Commission' }
    ];
    
    if (req.user.role === 'admin' || req.user.role === 'agency') {
      agencies.push(...govAgencies);
    }
    
    res.json(agencies);
  } catch (error) {
    console.error('Agencies fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
