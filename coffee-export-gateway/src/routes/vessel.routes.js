const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabric-chaincode');

/**
 * Phase 4: Vessel Routes
 * Handles vessel creation, tracking, and status updates
 */

// Create vessel
router.post('/create', async (req, res) => {
    try {
        const result = await fabricService.createVessel(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error creating vessel:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update vessel location
router.put('/:vesselId/location', async (req, res) => {
    try {
        const { vesselId } = req.params;
        const result = await fabricService.updateVesselLocation(vesselId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error updating vessel location:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update vessel status
router.put('/:vesselId/status', async (req, res) => {
    try {
        const { vesselId } = req.params;
        const result = await fabricService.updateVesselStatus(vesselId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error updating vessel status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get vessel details
router.get('/:vesselId', async (req, res) => {
    try {
        const { vesselId } = req.params;
        const result = await fabricService.getVessel(vesselId);
        res.json(result);
    } catch (error) {
        console.error('Error getting vessel:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
