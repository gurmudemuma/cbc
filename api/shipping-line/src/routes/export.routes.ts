import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

// Get all exports
router.get('/exports', authMiddleware, exportController.getAllExports);

// Get single export
router.get('/exports/:exportId', authMiddleware, exportController.getExport);

// Get exports ready for shipment
router.get('/exports/ready-for-shipment', authMiddleware, exportController.getReadyForShipment);

// Schedule shipment
router.post('/exports/:exportId/shipment/schedule', authMiddleware, exportController.scheduleShipment);

// Mark as shipped
router.post('/exports/:exportId/shipment/shipped', authMiddleware, exportController.markAsShipped);

// Mark as arrived
router.post('/exports/:exportId/shipment/arrived', authMiddleware, exportController.markAsArrived);

// Confirm delivery
router.post('/exports/:exportId/delivery/confirm', authMiddleware, exportController.confirmDelivery);

export default router;
