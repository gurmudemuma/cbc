import { Router } from "express";
import { ShipmentController } from "../controllers/shipment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateScheduleShipment,
  validateConfirmShipment,
} from "../middleware/validation.middleware";

const router = Router();
const shipmentController = new ShipmentController();

// All routes require authentication
router.use(authMiddleware);

// Get exports ready for shipment
router.get("/ready", shipmentController.getReadyExports);

// Get all exports
router.get("/exports", shipmentController.getAllExports);

// Get export by ID
router.get("/exports/:exportId", shipmentController.getExportById);

// Schedule shipment
router.post(
  "/schedule",
  validateScheduleShipment,
  shipmentController.scheduleShipment,
);

// Confirm shipment
router.post(
  "/confirm",
  validateConfirmShipment,
  shipmentController.confirmShipment,
);

// Reject shipment
router.post(
  "/reject",
  shipmentController.rejectShipment,
);

export default router;
