/**
 * Marketplace Routes
 * Handles buyer opportunities discovery and matching
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createLogger } from '@shared/logger';
import { getPool } from '@shared/database/pool';
import { handleDatabaseError, formatErrorResponse } from '@shared/database/errors';
import authMiddleware from '@shared/middleware/auth.middleware';

const router = Router();
const logger = createLogger('MarketplaceRoutes');

/**
 * GET /api/marketplace/opportunities
 * Get all verified buyers from buyer_registry (PUBLIC - no auth required)
 */
router.get('/opportunities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { coffeeType, country, minQuantity, maxPrice, page = 1, limit = 20 } = req.query;

    // Fetch directly from buyer_registry - all verified buyers are potential opportunities
    let query = `
      SELECT 
        b.buyer_id as opportunity_id,
        b.buyer_id,
        CONCAT('Coffee Supply Opportunity - ', b.company_name) as title,
        CONCAT(b.company_name, ' is seeking quality Ethiopian coffee. Contact us to discuss supply opportunities.') as description,
        'ARABICA' as coffee_type,
        ARRAY['Yirgacheffe', 'Sidamo', 'Harrar', 'Limu'] as origin_preferences,
        'Grade 1' as quality_grade_min,
        1000 as quantity_min,
        5000 as quantity_max,
        'MONTHLY' as frequency,
        12 as contract_duration_months,
        ARRAY['LC_AT_SIGHT', 'LC_DEFERRED_30'] as preferred_payment_terms,
        ARRAY['FOB', 'CIF'] as preferred_incoterms,
        3.50 as target_price_min,
        6.00 as target_price_max,
        'USD' as currency,
        ARRAY['Fair Trade', 'Organic'] as certifications_required,
        b.country as destination_country,
        'Main Port' as destination_port,
        CURRENT_DATE + INTERVAL '180 days' as valid_until,
        'OPEN' as status,
        b.company_name as buyer_company_name,
        b.country as buyer_country,
        b.verification_status,
        b.risk_level,
        b.reputation_score
      FROM buyer_registry b
      WHERE b.verification_status = 'VERIFIED'
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (country) {
      query += ` AND b.country ILIKE $${paramIndex}`;
      params.push(`%${country}%`);
      paramIndex++;
    }

    // Add ordering - prioritize by reputation score
    query += ` ORDER BY b.reputation_score DESC, b.company_name ASC`;

    // Add pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limitNum, offset);

    // Execute query
    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM buyer_registry b
      WHERE b.verification_status = 'VERIFIED'
    `;

    const countParams: any[] = [];
    let countParamIndex = 1;

    if (country) {
      countQuery += ` AND b.country ILIKE $${countParamIndex}`;
      countParams.push(`%${country}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total, 10);
    const totalPages = Math.ceil(total / limitNum);

    logger.info('Retrieved marketplace opportunities from buyer_registry', {
      count: result.rows.length,
      total,
      filters: { country },
    });

    res.json({
      success: true,
      opportunities: result.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error('Error retrieving marketplace opportunities', { error });
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(errorResponse.status).json({
      success: false,
      error: errorResponse.message,
      code: errorResponse.code,
    });
  }
});

/**
 * GET /api/marketplace/opportunities/:opportunityId
 * Get details of a specific buyer (PUBLIC - no auth required)
 */
router.get('/opportunities/:opportunityId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { opportunityId } = req.params;

    const query = `
      SELECT 
        b.buyer_id as opportunity_id,
        b.buyer_id,
        CONCAT('Coffee Supply Opportunity - ', b.company_name) as title,
        CONCAT(b.company_name, ' is seeking quality Ethiopian coffee. We value reliable suppliers and long-term partnerships.') as description,
        'ARABICA' as coffee_type,
        ARRAY['Yirgacheffe', 'Sidamo', 'Harrar', 'Limu'] as origin_preferences,
        'Grade 1' as quality_grade_min,
        1000 as quantity_min,
        5000 as quantity_max,
        'MONTHLY' as frequency,
        12 as contract_duration_months,
        ARRAY['LC_AT_SIGHT', 'LC_DEFERRED_30'] as preferred_payment_terms,
        ARRAY['FOB', 'CIF'] as preferred_incoterms,
        3.50 as target_price_min,
        6.00 as target_price_max,
        'USD' as currency,
        ARRAY['Fair Trade', 'Organic'] as certifications_required,
        b.country as destination_country,
        'Main Port' as destination_port,
        CURRENT_DATE + INTERVAL '180 days' as valid_until,
        'OPEN' as status,
        b.company_name as buyer_company_name,
        b.country as buyer_country,
        b.email as buyer_email,
        b.phone as buyer_phone,
        b.verification_status,
        b.risk_level,
        b.reputation_score,
        b.total_contracts,
        b.successful_contracts
      FROM buyer_registry b
      WHERE b.buyer_id = $1 AND b.verification_status = 'VERIFIED'
    `;

    const result = await pool.query(query, [opportunityId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Buyer not found',
        code: 'NOT_FOUND',
      });
    }

    logger.info('Retrieved buyer details', { opportunityId });

    res.json({
      success: true,
      opportunity: result.rows[0],
    });
  } catch (error) {
    logger.error('Error retrieving buyer details', { error, opportunityId: req.params.opportunityId });
    const dbError = handleDatabaseError(error);
    const errorResponse = formatErrorResponse(dbError);
    res.status(errorResponse.status).json({
      success: false,
      error: errorResponse.message,
      code: errorResponse.code,
    });
  }
});

/**
 * POST /api/marketplace/opportunities/:opportunityId/express-interest
 * Express interest in a buyer (creates a contract draft)
 */
router.post('/opportunities/:opportunityId/express-interest', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pool = getPool();
    const { opportunityId } = req.params;
    const exporterId = (req as any).user?.id;
    const exporterEmail = (req as any).user?.email;

    if (!exporterId || !exporterEmail) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    // Get buyer details
    const buyerQuery = `
      SELECT 
        b.buyer_id,
        b.company_name as buyer_company_name,
        b.email as buyer_email,
        b.country
      FROM buyer_registry b
      WHERE b.buyer_id = $1 AND b.verification_status = 'VERIFIED'
    `;

    const buyerResult = await pool.query(buyerQuery, [opportunityId]);

    if (buyerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Buyer not found or not verified',
        code: 'NOT_FOUND',
      });
    }

    const buyer = buyerResult.rows[0];

    logger.info('Exporter expressed interest in buyer', {
      opportunityId,
      exporterId,
      buyerName: buyer.buyer_company_name,
    });

    res.json({
      success: true,
      message: 'Interest recorded successfully. You can now create a contract draft.',
      data: {
        buyer,
      },
    });
  } catch (error) {
    logger.error('Error expressing interest in buyer', { error, opportunityId: req.params.opportunityId });
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
