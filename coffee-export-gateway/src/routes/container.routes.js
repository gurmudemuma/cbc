const express = require('express');
const router = express.Router();
const fabricService = require('../services/fabric-chaincode');

/**
 * Phase 4: Container Routes
 * Handles container assignment, tracking, and sealing
 */

// Assign container to shipment
router.post('/assign', async (req, res) => {
    try {
        const result = await fabricService.assignContainer(req.body);
        res.json(result);
    } catch (error) {
        console.error('Error assigning container:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update container status
router.put('/:containerId/status', async (req, res) => {
    try {
        const { containerId } = req.params;
        const result = await fabricService.updateContainerStatus(containerId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error updating container status:', error);
        res.status(500).json({ error: error.message });
    }
});

// Seal container
router.post('/:containerId/seal', async (req, res) => {
    try {
        const { containerId } = req.params;
        const result = await fabricService.sealContainer(containerId, req.body);
        res.json(result);
    } catch (error) {
        console.error('Error sealing container:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get container details
router.get('/:containerId', async (req, res) => {
    try {
        const { containerId } = req.params;
        const result = await fabricService.getContainer(containerId);
        res.json(result);
    } catch (error) {
        console.error('Error getting container:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get containers by shipment
router.get('/shipment/:shipmentId', async (req, res) => {
    try {
        const { shipmentId } = req.params;
        const result = await fabricService.getContainersByShipment(shipmentId);
        res.json(result);
    } catch (error) {
        console.error('Error getting containers by shipment:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
