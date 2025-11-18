/**
 * ECX Routes
 */

import { Router } from 'express';
import { ecxController } from '../controllers/ecx.controller';

const router = Router();

/**
 * @swagger
 * /api/ecx/verify-lot:
 *   post:
 *     summary: Verify ECX lot number
 *     tags: [ECX]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lotNumber
 *               - warehouseReceiptNumber
 *             properties:
 *               lotNumber:
 *                 type: string
 *               warehouseReceiptNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lot verified successfully
 *       404:
 *         description: Lot not found
 */
router.post('/verify-lot', ecxController.verifyLot.bind(ecxController));

/**
 * @swagger
 * /api/ecx/verify-receipt:
 *   post:
 *     summary: Verify warehouse receipt
 *     tags: [ECX]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - receiptNumber
 *             properties:
 *               receiptNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Receipt verified successfully
 *       404:
 *         description: Receipt not found
 */
router.post('/verify-receipt', ecxController.verifyReceipt.bind(ecxController));

/**
 * @swagger
 * /api/ecx/verify-and-create:
 *   post:
 *     summary: Verify ECX lot and create blockchain record
 *     tags: [ECX]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exportId
 *               - lotNumber
 *               - warehouseReceiptNumber
 *               - exporterName
 *               - exporterTIN
 *               - requestedQuantity
 *             properties:
 *               exportId:
 *                 type: string
 *               lotNumber:
 *                 type: string
 *               warehouseReceiptNumber:
 *                 type: string
 *               exporterName:
 *                 type: string
 *               exporterTIN:
 *                 type: string
 *               requestedQuantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Verification successful
 *       400:
 *         description: Verification failed
 */
router.post('/verify-and-create', ecxController.verifyAndCreateExport.bind(ecxController));

/**
 * @swagger
 * /api/ecx/create-export:
 *   post:
 *     summary: Create export request on blockchain
 *     tags: [ECX]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exportId
 *               - commercialbankId
 *               - exporterName
 *               - exporterTIN
 *               - exportLicenseNumber
 *               - coffeeType
 *               - quantity
 *               - destinationCountry
 *               - estimatedValue
 *               - ecxLotNumber
 *               - warehouseLocation
 *               - warehouseReceiptNumber
 *     responses:
 *       201:
 *         description: Export created successfully
 *       400:
 *         description: Invalid request
 */
router.post('/create-export', ecxController.createExport.bind(ecxController));

/**
 * @swagger
 * /api/ecx/exports/{exportId}:
 *   get:
 *     summary: Get export request by ID
 *     tags: [ECX]
 *     parameters:
 *       - in: path
 *         name: exportId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Export request retrieved
 *       404:
 *         description: Export not found
 */
router.get('/exports/:exportId', ecxController.getExport.bind(ecxController));

/**
 * @swagger
 * /api/ecx/exports/status/{status}:
 *   get:
 *     summary: Get exports by status
 *     tags: [ECX]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Exports retrieved
 */
router.get('/exports/status/:status', ecxController.getExportsByStatus.bind(ecxController));

/**
 * @swagger
 * /api/ecx/reject:
 *   post:
 *     summary: Reject ECX verification
 *     tags: [ECX]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - exportId
 *               - reason
 *             properties:
 *               exportId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification rejected
 */
router.post('/reject', ecxController.rejectVerification.bind(ecxController));

export default router;
