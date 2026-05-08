/**
 * ECTA Certificate Renewal Routes
 * Handles all certificate renewal requests
 */

import { Router } from 'express';
import ECTACertificateRenewalController from '../controllers/certificate-renewal.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const controller = new ECTACertificateRenewalController();

// All routes require authentication
router.use(authMiddleware);

// Get pending renewal requests
router.get('/pending', controller.getPendingRenewals);

// Get renewal history
router.get('/history', controller.getRenewalHistory);

// Get expiring certificates
router.get('/expiring', controller.getExpiringCertificates);

// Approve a renewal request
router.post('/:requestId/approve', controller.approveRenewal);

// Reject a renewal request
router.post('/:requestId/reject', controller.rejectRenewal);

export default router;
