const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabric');

/**
 * POST /invoke
 * Invoke a chaincode function
 * Body: { fcn: string, args: string[] }
 */
router.post('/invoke', async (req, res) => {
  try {
    const { fcn, args } = req.body;

    if (!fcn) {
      return res.status(400).json({ error: 'Function name (fcn) is required' });
    }

    if (!Array.isArray(args)) {
      return res.status(400).json({ error: 'Arguments (args) must be an array' });
    }

    console.log(`[Blockchain] Invoking function: ${fcn}`);
    console.log(`[Blockchain] Arguments:`, args);

    const chaincodeName = process.env.CHAINCODE_NAME || 'ecta';
    const result = await fabricService.submitTransaction('admin', chaincodeName, fcn, ...args);

    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('[Blockchain] Invoke error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to invoke chaincode'
    });
  }
});

/**
 * POST /query
 * Query a chaincode function
 * Body: { fcn: string, args: string[] }
 */
router.post('/query', async (req, res) => {
  try {
    const { fcn, args } = req.body;

    if (!fcn) {
      return res.status(400).json({ error: 'Function name (fcn) is required' });
    }

    if (!Array.isArray(args)) {
      return res.status(400).json({ error: 'Arguments (args) must be an array' });
    }

    console.log(`[Blockchain] Querying function: ${fcn}`);
    console.log(`[Blockchain] Arguments:`, args);

    const chaincodeName = process.env.CHAINCODE_NAME || 'ecta';
    const result = await fabricService.evaluateTransaction('admin', chaincodeName, fcn, ...args);

    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('[Blockchain] Query error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to query chaincode'
    });
  }
});

module.exports = router;
