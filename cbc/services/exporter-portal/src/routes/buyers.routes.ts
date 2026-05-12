/**
 * Buyers Routes
 * Buyer selection and management endpoints
 * Uses hardcoded buyer list for testing
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireFullyQualified } from '../middleware/qualification-check.middleware';
import { HARDCODED_BUYERS, getBuyerById, searchBuyers, getAllCountries, getAllCoffeeTypes, getAllPaymentTerms } from '@shared/data/hardcoded-buyers';
import { createLogger } from '@shared/logger';

const router = Router();
const logger = createLogger('BuyersRoutes');

/**
 * GET /
 * Get all available buyers (requires FULLY_QUALIFIED)
 */
router.get('/', authenticateToken, requireFullyQualified, (req, res) => {
  try {
    logger.info('Fetching all buyers', { userId: (req as any).user.id });

    res.status(200).json({
      success: true,
      data: {
        buyers: HARDCODED_BUYERS,
        total: HARDCODED_BUYERS.length,
      },
    });
  } catch (error) {
    logger.error('Error fetching buyers', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch buyers',
      },
    });
  }
});

/**
 * GET /:buyerId
 * Get buyer by ID (requires FULLY_QUALIFIED)
 */
router.get('/:buyerId', authenticateToken, requireFullyQualified, (req, res) => {
  try {
    const { buyerId } = req.params;
    const buyer = getBuyerById(buyerId);

    if (!buyer) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BUYER_NOT_FOUND',
          message: 'Buyer not found',
        },
      });
      return;
    }

    logger.info('Fetching buyer details', { buyerId, userId: (req as any).user.id });

    res.status(200).json({
      success: true,
      data: buyer,
    });
  } catch (error) {
    logger.error('Error fetching buyer', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch buyer',
      },
    });
  }
});

/**
 * POST /search
 * Search buyers by criteria (requires FULLY_QUALIFIED)
 */
router.post('/search', authenticateToken, requireFullyQualified, (req, res) => {
  try {
    const { country, coffeeType, paymentTerm, minOrderBags } = req.body;

    logger.info('Searching buyers', {
      criteria: { country, coffeeType, paymentTerm, minOrderBags },
      userId: (req as any).user.id,
    });

    const results = searchBuyers({
      country,
      coffeeType,
      paymentTerm,
      minOrderBags,
    });

    res.status(200).json({
      success: true,
      data: {
        buyers: results,
        total: results.length,
        criteria: { country, coffeeType, paymentTerm, minOrderBags },
      },
    });
  } catch (error) {
    logger.error('Error searching buyers', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search buyers',
      },
    });
  }
});

/**
 * GET /filters/countries
 * Get all unique countries (requires FULLY_QUALIFIED)
 */
router.get('/filters/countries', authenticateToken, requireFullyQualified, (req, res) => {
  try {
    const countries = getAllCountries();

    res.status(200).json({
      success: true,
      data: countries,
    });
  } catch (error) {
    logger.error('Error fetching countries', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch countries',
      },
    });
  }
});

/**
 * GET /filters/coffee-types
 * Get all unique coffee types (requires FULLY_QUALIFIED)
 */
router.get('/filters/coffee-types', authenticateToken, requireFullyQualified, (req, res) => {
  try {
    const coffeeTypes = getAllCoffeeTypes();

    res.status(200).json({
      success: true,
      data: coffeeTypes,
    });
  } catch (error) {
    logger.error('Error fetching coffee types', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch coffee types',
      },
    });
  }
});

/**
 * GET /filters/payment-terms
 * Get all unique payment terms (requires FULLY_QUALIFIED)
 */
router.get('/filters/payment-terms', authenticateToken, requireFullyQualified, (req, res) => {
  try {
    const paymentTerms = getAllPaymentTerms();

    res.status(200).json({
      success: true,
      data: paymentTerms,
    });
  } catch (error) {
    logger.error('Error fetching payment terms', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch payment terms',
      },
    });
  }
});

export default router;
