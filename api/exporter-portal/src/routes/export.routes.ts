import { Router } from "express";
import { ExportController } from "../controllers/export.controller";
import { authenticateToken, requireRole } from "../middleware/auth.middleware";
import multer from "multer";
import path from "path";

const router = Router();
const exportController = new ExportController();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || "./uploads";
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || "20") * 1024 * 1024, // Convert MB to bytes
    files: parseInt(process.env.MAX_FILES_PER_REQUEST || "5"),
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(",") || [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

// All routes require authentication as exporter portal user
router.use(authenticateToken);
router.use(requireRole(["exporter-portal", "exporter"]));

/**
 * @route GET /api/exports
 * @desc Get all export requests for the authenticated user
 * @access Private (Exporter Portal Users)
 */
router.get("/", exportController.getExportRequests);

/**
 * @route POST /api/exports
 * @desc Create a new export request (draft)
 * @access Private (Exporter Portal Users)
 */
router.post("/", exportController.createExportRequest);

/**
 * @route GET /api/exports/:id
 * @desc Get specific export request details
 * @access Private (Exporter Portal Users - own requests only)
 */
router.get("/:id", exportController.getExportRequestById);

/**
 * @route PUT /api/exports/:id
 * @desc Update export request (only drafts can be updated)
 * @access Private (Exporter Portal Users - own requests only)
 */
router.put("/:id", exportController.updateExportRequest);

/**
 * @route DELETE /api/exports/:id
 * @desc Delete export request (only drafts can be deleted)
 * @access Private (Exporter Portal Users - own requests only)
 */
router.delete("/:id", exportController.deleteExportRequest);

/**
 * @route POST /api/exports/:id/submit
 * @desc Submit export request to consortium for processing
 * @access Private (Exporter Portal Users - own requests only)
 */
router.post("/:id/submit", exportController.submitExportRequest);

/**
 * @route POST /api/exports/:id/cancel
 * @desc Cancel export request
 * @access Private (Exporter Portal Users - own requests only)
 */
router.post("/:id/cancel", exportController.cancelExportRequest);

/**
 * @route POST /api/exports/:id/documents
 * @desc Upload documents for export request
 * @access Private (Exporter Portal Users - own requests only)
 */
router.post(
  "/:id/documents",
  upload.array("documents", 5),
  exportController.uploadDocuments,
);

/**
 * @route GET /api/exports/:id/documents
 * @desc Get documents for export request
 * @access Private (Exporter Portal Users - own requests only)
 */
router.get("/:id/documents", exportController.getDocuments);

/**
 * @route DELETE /api/exports/:id/documents/:documentId
 * @desc Delete a specific document
 * @access Private (Exporter Portal Users - own requests only)
 */
router.delete("/:id/documents/:documentId", exportController.deleteDocument);

/**
 * @route GET /api/exports/:id/documents/:documentId/download
 * @desc Download a specific document
 * @access Private (Exporter Portal Users - own requests only)
 */
router.get(
  "/:id/documents/:documentId/download",
  exportController.downloadDocument,
);

/**
 * @route GET /api/exports/:id/status
 * @desc Get detailed status and processing history of export request
 * @access Private (Exporter Portal Users - own requests only)
 */
router.get("/:id/status", exportController.getExportRequestStatus);

/**
 * @route GET /api/exports/requirements/:coffeeType/:destinationCountry
 * @desc Get document requirements for specific coffee type and destination
 * @access Private (Exporter Portal Users)
 */
router.get(
  "/requirements/:coffeeType/:destinationCountry",
  exportController.getDocumentRequirements,
);

/**
 * @route POST /api/exports/:id/validate
 * @desc Validate export request before submission
 * @access Private (Exporter Portal Users - own requests only)
 */
router.post("/:id/validate", exportController.validateExportRequest);

export default router;
