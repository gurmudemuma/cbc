import { Router } from "express";
import { FXController } from "../controllers/fx.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateFXApproval,
  validateFXRejection,
} from "../middleware/validation.middleware";

const router = Router();
const fxController = new FXController();

// All routes require authentication
router.use(authMiddleware);

// Get all pending exports
router.get("/pending", fxController.getPendingExports);

// Get all exports
router.get("/exports", fxController.getAllExports);

// Get export by ID
router.get("/exports/:exportId", fxController.getExportById);

// Approve FX for an export
router.post("/approve", validateFXApproval, fxController.approveFX);

// Reject FX for an export
router.post("/reject", validateFXRejection, fxController.rejectFX);

export default router;
