/**
 * Buyers Routes
 * Public buyer information endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '@shared/logger';
import { getPool } from '@shared/database/pool';
import { handleDatabaseError, formatErrorResponse } from '@shared/database/errors';

const router = Router();
const logger = createLogger('BuyersRoutes');

/**
 * GET /:buyerId
 * Get buyer details (PUBLIC - no auth required)
 */
router.get('/:buyerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { buyerId } = req.params;

    const query = `
      SELECT 
        buyer_id,
        company_name,
        country,
        email,
        phone,
        website,
        verification_status,
        risk_level,
        reputation_score,
        total_contracts,
        successful_contracts,
        failed_contracts,
        average_payment_days
      FROM buyer_registry
      WHERE buyer_id = $1
    `;

    const result = await pool.query(query, [buyerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Buyer not found',
        code: 'NOT_FOUND',
      });
    }

    logger.info('Retrieved buyer details', { buyerId });

    res.json({
      success: true,
      buyer: result.rows[0],
    });
  } catch (error) {
    logger.error('Error retrieving buyer details', { error, buyerId: req.params.buyerId });
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(errorResponse.status).json({
      success: false,
      error: errorResponse.message,
      code: errorResponse.code,
    });
  }
});

export default router;
