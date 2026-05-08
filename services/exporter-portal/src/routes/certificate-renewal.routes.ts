/**
 * Exporter Portal - Certificate Renewal Routes
 * Allows exporters to submit and manage renewal requests
 */

import { Router } from 'express';
import ExporterCertificateRenewalController from '../controllers/certificate-renewal.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const controller = new ExporterCertificateRenewalController();

// All routes require authentication
router.use(authenticateToken);

// Submit a renewal request
router.post('/request', controller.submitRenewalRequest);

// Get my renewal requests
router.get('/my-requests', controller.getMyRenewalRequests);

// Cancel a pending request
router.post('/:requestId/cancel', controller.cancelRenewalRequest);

export default router;
