import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  validateScheduleShipment,
  validateConfirmShipment,
} from '../middleware/validation.middleware';

const router = Router();
const shipmentController = new ShipmentController();

// All routes require authentication
router.use(authMiddleware as any);

// Get exports ready for shipment
router.get('/ready', shipmentController.getReadyExports as any);

// Get all exports
router.get('/exports', shipmentController.getAllExports as any);

// Get export by ID
router.get('/exports/:exportId', shipmentController.getExportById as any);

// Schedule shipment
router.post('/schedule', validateScheduleShipment, shipmentController.scheduleShipment as any);

// Confirm shipment
router.post('/confirm', validateConfirmShipment, shipmentController.confirmShipment as any);

// Reject shipment
router.post('/reject', shipmentController.rejectShipment as any);

// Notify arrival at destination
router.post('/notify-arrival', shipmentController.notifyArrival as any);

export default router;
