/**
 * Contract Validation Middleware
 * Validates contract fields and enforces business rules
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@shared/logger';
import { ValidationService } from '../services/validation.service';

const logger = createLogger('ContractValidationMiddleware');
const validationService = new ValidationService();

/**
 * Validate contract creation request
 */
export function validateContractCreation(req: Request, res: Response, next: NextFunction): void {
  try {
    const validation = validationService.validateCreateRequest(req.body);

    if (!validation.isValid) {
      logger.warn('Contract creation validation failed', { errors: validation.errors });
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Contract validation failed',
        errors: validation.errors,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error in contract creation validation', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate contract update request
 */
export function validateContractUpdate(req: Request, res: Response, next: NextFunction): void {
  try {
    const validation = validationService.validateUpdateRequest(req.body);

    if (!validation.isValid) {
      logger.warn('Contract update validation failed', { errors: validation.errors });
      res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Contract validation failed',
        errors: validation.errors,
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error in contract update validation', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate delivery date is in future
 */
export function validateDeliveryDate(req: Request, res: Response, next: NextFunction) {
  try {
    const { delivery_date } = req.body;

    if (!delivery_date) {
      return next();
    }

    const deliveryDate = new Date(delivery_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (deliveryDate <= today) {
      logger.warn('Delivery date validation failed', { delivery_date });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Delivery date must be in the future',
        errors: [
          {
            field: 'delivery_date',
            message: 'Delivery date must be in the future',
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating delivery date', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate quantity is positive
 */
export function validateQuantity(req: Request, res: Response, next: NextFunction) {
  try {
    const { quantity_bags } = req.body;

    if (quantity_bags === undefined || quantity_bags === null) {
      return next();
    }

    const quantity = parseInt(quantity_bags, 10);

    if (isNaN(quantity) || quantity < 1) {
      logger.warn('Quantity validation failed', { quantity_bags });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Quantity must be at least 1 bag',
        errors: [
          {
            field: 'quantity_bags',
            message: 'Quantity must be at least 1 bag',
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating quantity', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate unit price is positive
 */
export function validateUnitPrice(req: Request, res: Response, next: NextFunction) {
  try {
    const { unit_price } = req.body;

    if (unit_price === undefined || unit_price === null) {
      return next();
    }

    const price = parseFloat(unit_price);

    if (isNaN(price) || price <= 0) {
      logger.warn('Unit price validation failed', { unit_price });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Unit price must be greater than zero',
        errors: [
          {
            field: 'unit_price',
            message: 'Unit price must be greater than zero',
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating unit price', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate payment terms
 */
export function validatePaymentTerms(req: Request, res: Response, next: NextFunction) {
  try {
    const { payment_terms } = req.body;

    if (!payment_terms) {
      return next();
    }

    const approvedTerms = validationService.getApprovedPaymentTerms();

    if (!approvedTerms.includes(payment_terms)) {
      logger.warn('Payment terms validation failed', { payment_terms });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid payment terms',
        errors: [
          {
            field: 'payment_terms',
            message: `Payment terms must be one of: ${approvedTerms.join(', ')}`,
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating payment terms', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate currency
 */
export function validateCurrency(req: Request, res: Response, next: NextFunction) {
  try {
    const { currency } = req.body;

    if (!currency) {
      return next();
    }

    // ISO 4217 currency code format: 3 uppercase letters
    const currencyRegex = /^[A-Z]{3}$/;

    if (!currencyRegex.test(currency)) {
      logger.warn('Currency validation failed', { currency });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid currency code',
        errors: [
          {
            field: 'currency',
            message: 'Currency must be a valid ISO 4217 code (e.g., USD, EUR, GBP)',
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating currency', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate coffee type
 */
export function validateCoffeeType(req: Request, res: Response, next: NextFunction) {
  try {
    const { coffee_type } = req.body;

    if (!coffee_type) {
      return next();
    }

    const supportedTypes = validationService.getSupportedCoffeeTypes();

    if (!supportedTypes.includes(coffee_type)) {
      logger.warn('Coffee type validation failed', { coffee_type });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid coffee type',
        errors: [
          {
            field: 'coffee_type',
            message: `Coffee type must be one of: ${supportedTypes.join(', ')}`,
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating coffee type', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate delivery location
 */
export function validateDeliveryLocation(req: Request, res: Response, next: NextFunction) {
  try {
    const { delivery_location } = req.body;

    if (!delivery_location) {
      return next();
    }

    const validLocations = validationService.getValidDeliveryLocations();

    if (!validLocations.includes(delivery_location)) {
      logger.warn('Delivery location validation failed', { delivery_location });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid delivery location',
        errors: [
          {
            field: 'delivery_location',
            message: `Delivery location must be one of: ${validLocations.join(', ')}`,
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating delivery location', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Validate email format
 */
export function validateEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { buyer_email } = req.body;

    if (!buyer_email) {
      return next();
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(buyer_email)) {
      logger.warn('Email validation failed', { buyer_email });
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'Invalid email address',
        errors: [
          {
            field: 'buyer_email',
            message: 'Please provide a valid email address',
          },
        ],
      });
    }

    next();
  } catch (error) {
    logger.error('Error validating email', { error });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Validation error',
    });
  }
}

/**
 * Combine all validation middleware
 */
export function validateContractFields(req: Request, res: Response, next: NextFunction) {
  // Run all validators in sequence
  const validators = [
    validateEmail,
    validateDeliveryDate,
    validateQuantity,
    validateUnitPrice,
    validatePaymentTerms,
    validateCurrency,
    validateCoffeeType,
    validateDeliveryLocation,
  ];

  let index = 0;

  const runNext = () => {
    if (index < validators.length) {
      const validator = validators[index++];
      validator(req, res, runNext);
    } else {
      next();
    }
  };

  runNext();
}
