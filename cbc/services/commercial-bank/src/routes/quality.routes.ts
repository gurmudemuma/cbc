import { Router } from "express";
import { QualityController } from "../controllers/quality.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateQualityCertificate,
  validateQualityRejection,
} from "../middleware/validation.middleware";

const router = Router();
const qualityController = new QualityController();

// All routes require authentication
router.use(authMiddleware);

// Get exports awaiting quality certification
router.get("/pending", qualityController.getPendingExports);

// Get all exports
router.get("/exports", qualityController.getAllExports);

// Get export by ID
router.get("/exports/:exportId", qualityController.getExportById);

// Issue quality certificate
router.post(
  "/certify",
  validateQualityCertificate,
  qualityController.issueQualityCertificate,
);

// Reject quality
router.post(
  "/reject",
  validateQualityRejection,
  qualityController.rejectQuality,
);

export default router;
