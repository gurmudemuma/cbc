import { Router } from 'express';
import { ExportController } from '../controllers/export.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const exportController = new ExportController();

// Get all exports
router.get('/exports', authMiddleware as any, exportController.getAllExports as any);

// Get single export
router.get('/exports/:exportId', authMiddleware as any, exportController.getExport as any);

// Get exports ready for shipment
router.get(
  '/exports/ready-for-shipment',
  authMiddleware as any,
  exportController.getReadyForShipment as any
);

// Schedule shipment
router.post(
  '/exports/:exportId/shipment/schedule',
  authMiddleware as any,
  exportController.scheduleShipment as any
);

// Mark as shipped
router.post(
  '/exports/:exportId/shipment/shipped',
  authMiddleware as any,
  exportController.markAsShipped as any
);

// Mark as arrived
router.post(
  '/exports/:exportId/shipment/arrived',
  authMiddleware as any,
  exportController.markAsArrived as any
);

// Confirm delivery
router.post(
  '/exports/:exportId/delivery/confirm',
  authMiddleware as any,
  exportController.confirmDelivery as any
);

export default router;
