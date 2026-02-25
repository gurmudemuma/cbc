const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabric-chaincode');

/**
 * Phase 4: Customs Routes
 * Handles customs declarations and clearance
 */

// Create customs declaration
router.post('/declaration', async (req, res) => {
    try {
        const result = await fabricService.createCustomsDeclaration(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error creating customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit customs declaration
router.post('/declaration/:declarationId/submit', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.submitCustomsDeclaration(declarationId);
        res.json(result);
    } catch (error) {
        console.error('Error submitting customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Review customs declaration (Customs officer only)
router.post('/declaration/:declarationId/review', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.reviewCustomsDeclaration(declarationId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error reviewing customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Clear customs (Customs officer only)
router.post('/declaration/:declarationId/clear', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.clearCustoms(declarationId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error clearing customs:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get customs declaration
router.get('/declaration/:declarationId', async (req, res) => {
    try {
        const { declarationId } = req.params;
        const result = await fabricService.getCustomsDeclaration(declarationId);
        res.json(result);
    } catch (error) {
        console.error('Error getting customs declaration:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
