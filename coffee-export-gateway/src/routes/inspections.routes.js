const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const fabricService = require('../services');

router.post('/schedule', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { exporterId, inspectionType, scheduledDate, inspector, notes } = req.body;
    if (!exporterId || !inspectionType || !scheduledDate) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const inspectionData = {
      inspectionId: 'INS-' + Date.now(),
      exporterId, inspectionType, scheduledDate,
      inspector: inspector || req.user.id,
      scheduledBy: req.user.id,
      status: 'scheduled',
      notes: notes || '',
      createdAt: new Date().toISOString()
    };
    await fabricService.submitTransaction(req.user.id, process.env.CHAINCODE_NAME || 'ecta', 'UpdateExporterProfile', exporterId, JSON.stringify({ pendingInspection: inspectionData }));
    res.json({ success: true, message: 'Inspection scheduled', inspection: inspectionData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:inspectionId/report', authenticateToken, requireRole('ecta', 'admin'), async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { exporterId, passed, findings, recommendations } = req.body;
    if (!exporterId || typeof passed !== 'boolean') {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const reportData = {
      inspectionId, exporterId, passed,
      findings: findings || '',
      recommendations: recommendations || '',
      inspectedBy: req.user.id,
      inspectedAt: new Date().toISOString(),
      status: passed ? 'passed' : 'failed'
    };
    await fabricService.submitTransaction(req.user.id, process.env.CHAINCODE_NAME || 'ecta', 'UpdateExporterProfile', exporterId, JSON.stringify({ inspectionReport: reportData }));
    res.json({ success: true, message: 'Inspection ' + (passed ? 'passed' : 'failed'), report: reportData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/exporter/:exporterId', authenticateToken, async (req, res) => {
  try {
    const { exporterId } = req.params;
    if (req.user.id !== exporterId && req.user.role !== 'ecta' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const profileResult = await fabricService.evaluateTransaction(req.user.id, process.env.CHAINCODE_NAME || 'ecta', 'GetExporterProfile', exporterId);
    const profile = JSON.parse(profileResult);
    res.json(profile.inspections || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
