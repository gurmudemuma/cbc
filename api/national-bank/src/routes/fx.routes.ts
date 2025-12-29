/**
 * FX Routes for National Bank
 * With Zod validation middleware
 */

import { Router } from 'express';
import { FXController } from '../controllers/fx.controller';
<<<<<<< HEAD
import { authMiddleware } from '@shared/middleware/auth.middleware';
import { validateRequest, ApproveFXSchema, RejectSchema } from '@shared/validation.schemas';
=======
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { validateRequest, ApproveFXSchema, RejectSchema } from '../../../shared/validation.schemas';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665

const router = Router();
const fxController = new FXController();

// Get all exports
router.get('/exports', authMiddleware, fxController.getAllExports);

// Get single export
router.get('/exports/:exportId', authMiddleware, fxController.getExport);

// Get pending FX approvals
router.get('/fx/pending', authMiddleware, fxController.getPendingFXApprovals);

// Get exports by status
router.get('/exports/status/:status', authMiddleware, fxController.getExportsByStatus);

// Approve FX
router.post(
  '/fx/:exportId/approve',
  authMiddleware,
  validateRequest(ApproveFXSchema),
  fxController.approveFX
);

// Reject FX
router.post(
  '/fx/:exportId/reject',
  authMiddleware,
  validateRequest(RejectSchema),
  fxController.rejectFX
);

export default router;
