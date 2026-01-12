import { Router } from 'express';
import { ExporterController } from '../controllers/exporter.controller';
import { authMiddleware as authenticate } from '@shared/middleware/auth.middleware';

const router = Router();
const controller = new ExporterController();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// EXPORTER ENDPOINTS (Frontend compatibility)
// ============================================================================

// Get qualification status
router.get('/qualification-status', controller.getQualificationStatus);

export default router;
