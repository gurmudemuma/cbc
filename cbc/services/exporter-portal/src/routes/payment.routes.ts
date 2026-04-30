import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Exporter/CBE Routes - Initiate and submit documents
router.post('/initiate', authenticateToken, paymentController.initiatePayment);
router.get('/', authenticateToken, paymentController.getPayments);
router.get('/:paymentId', authenticateToken, paymentController.getPaymentDetails);
router.post('/:paymentId/documents', authenticateToken, paymentController.submitDocuments);
router.get('/statistics', authenticateToken, paymentController.getPaymentStatistics);

// Importer Bank Routes - Review and approve documents
router.get('/bank/pending-review', authenticateToken, paymentController.getPendingReview);
router.post('/bank/:paymentId/documents/review', authenticateToken, paymentController.reviewDocument);
router.post('/bank/:paymentId/approve', authenticateToken, paymentController.approvePayment);
router.post('/bank/:paymentId/reject', authenticateToken, paymentController.rejectPayment);
router.post('/bank/:paymentId/complete', authenticateToken, paymentController.completePayment);

// Universal Dashboard - All parties can view
router.get('/dashboard/all', authenticateToken, paymentController.getAllPaymentsDashboard);
router.get('/dashboard/ledger/:paymentId', authenticateToken, paymentController.getPaymentLedger);

export default router;
