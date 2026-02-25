const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabric-chaincode');

/**
 * Phase 4: Shipping Routes
 * Handles shipping instructions, Bill of Lading, and fumigation
 */

// Create shipping instructions
router.post('/instructions', async (req, res) => {
    try {
        const result = await fabricService.createShippingInstructions(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error creating shipping instructions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Confirm shipping instructions (Shipping line only)
router.post('/instructions/:instructionId/confirm', async (req, res) => {
    try {
        const { instructionId } = req.params;
        const result = await fabricService.confirmShippingInstructions(instructionId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error confirming shipping instructions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate Bill of Lading
router.post('/bill-of-lading', async (req, res) => {
    try {
        const result = await fabricService.generateBillOfLading(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error generating Bill of Lading:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Bill of Lading
router.get('/bill-of-lading/:blNumber', async (req, res) => {
    try {
        const { blNumber } = req.params;
        const result = await fabricService.getBillOfLading(blNumber);
        res.json(result);
    } catch (error) {
        console.error('Error getting Bill of Lading:', error);
        res.status(500).json({ error: error.message });
    }
});

// Request fumigation
router.post('/fumigation/request', async (req, res) => {
    try {
        const result = await fabricService.requestFumigation(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error requesting fumigation:', error);
        res.status(500).json({ error: error.message });
    }
});

// Issue fumigation certificate
router.post('/fumigation/:fumigationId/issue', async (req, res) => {
    try {
        const { fumigationId } = req.params;
        const result = await fabricService.issueFumigationCertificate(fumigationId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error issuing fumigation certificate:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get fumigation certificate
router.get('/fumigation/:fumigationId', async (req, res) => {
    try {
        const { fumigationId } = req.params;
        const result = await fabricService.getFumigationCertificate(fumigationId);
        res.json(result);
    } catch (error) {
        console.error('Error getting fumigation certificate:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
