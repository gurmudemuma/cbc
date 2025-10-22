import { Router } from "express";
import { ExportController } from "../controllers/export.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateExportRequest } from "../middleware/validation.middleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const exportController = new ExportController();

// All routes require authentication
router.use(authMiddleware);

// Create new export request
router.post("/", validateExportRequest, exportController.createExport);

// Get all exports
router.get("/", exportController.getAllExports);

// Get exports by status (must come before /:exportId to avoid route conflict)
router.get("/status/:status", exportController.getExportsByStatus);

// Get export by ID
router.get("/:exportId", exportController.getExportById);

// Get export history
router.get("/:exportId/history", exportController.getExportHistory);

// Complete export
router.put("/:exportId/complete", exportController.completeExport);

// Update rejected export (edit and reset to DRAFT)
router.put("/:exportId/update-rejected", exportController.updateRejectedExport);

// Resubmit rejected export without changes (reset to DRAFT)
router.put(
  "/:exportId/resubmit-rejected",
  exportController.resubmitRejectedExport,
);

// Cancel export
router.put("/:exportId/cancel", exportController.cancelExport);

// Add document to export
router.post(
  "/:exportId/documents",
  upload.single("file"),
  exportController.addDocument,
);

// Delete document from export
router.delete(
  "/:exportId/documents/:docType/:version",
  exportController.deleteDocument,
);

export default router;
