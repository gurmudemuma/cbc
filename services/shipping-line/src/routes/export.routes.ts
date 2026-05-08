import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

// Get all exports
router.get('/exports', authMiddleware, exportController.getAllExports);

// Get single export
router.get('/exports/:exportId', authMiddleware, exportController.getExportById);

// Get exports ready for shipment
router.get('/exports/ready-for-shipment', authMiddleware, exportController.getReadyExports);

// Schedule shipment
router.post('/exports/:exportId/shipment/schedule', authMiddleware, exportController.scheduleShipment);

// Confirm shipment
router.post('/exports/:exportId/shipment/confirm', authMiddleware, exportController.confirmShipment);

// Mark as arrived
router.post('/exports/:exportId/shipment/arrived', authMiddleware, exportController.markAsArrived);

// Confirm delivery
router.post('/exports/:exportId/delivery/confirm', authMiddleware, exportController.confirmDelivery);

export default router;
