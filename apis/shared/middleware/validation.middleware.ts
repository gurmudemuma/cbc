import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

/**
 * Comprehensive Input Validation Middleware
 * Implements OWASP input validation best practices
 */

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const validateExportId = () =>
  param('exportId')
    .trim()
    .notEmpty()
    .withMessage('Export ID is required')
    .matches(/^[A-Z0-9\-]{10,50}$/)
    .withMessage('Invalid export ID format');

export const validateLicenseNumber = () =>
  body('licenseNumber')
    .trim()
    .notEmpty()
    .withMessage('License number is required')
    .matches(/^[A-Z0-9\-]{5,50}$/)
    .withMessage('Invalid license number format');

export const validateTIN = () =>
  body('tin')
    .trim()
    .notEmpty()
    .withMessage('TIN is required')
    .matches(/^[0-9]{10}$/)
    .withMessage('TIN must be 10 digits');

export const validateEmail = () =>
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail();

export const validatePhone = () =>
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format (E.164)');

export const validateBusinessName = () =>
  body('businessName')
    .trim()
    .notEmpty()
    .withMessage('Business name is required')
    .isLength({ min: 3, max: 500 })
    .withMessage('Business name must be 3-500 characters')
    .matches(/^[a-zA-Z0-9\s\-&.,()]+$/)
    .withMessage('Business name contains invalid characters');

export const validateCoffeeType = () =>
  body('coffeeType')
    .trim()
    .notEmpty()
    .withMessage('Coffee type is required')
    .isIn(['ARABICA', 'ROBUSTA', 'SPECIALTY', 'ORGANIC', 'FAIR_TRADE'])
    .withMessage('Invalid coffee type');

export const validateQuantity = () =>
  body('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isFloat({ min: 0.1, max: 1000000 })
    .withMessage('Quantity must be between 0.1 and 1,000,000 kg');

export const validateEstimatedValue = () =>
  body('estimatedValue')
    .notEmpty()
    .withMessage('Estimated value is required')
    .isFloat({ min: 0, max: 999999999 })
    .withMessage('Estimated value must be between 0 and 999,999,999');

export const validateDestinationCountry = () =>
  body('destinationCountry')
    .trim()
    .notEmpty()
    .withMessage('Destination country is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Invalid country name');

export const validateQualityGrade = () =>
  body('qualityGrade')
    .trim()
    .notEmpty()
    .withMessage('Quality grade is required')
    .isIn(['GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5'])
    .withMessage('Invalid quality grade');

export const validateMoistureContent = () =>
  body('moistureContent')
    .optional()
    .isFloat({ min: 0, max: 20 })
    .withMessage('Moisture content must be between 0 and 20%');

export const validateDefectCount = () =>
  body('defectCount')
    .optional()
    .isInt({ min: 0, max: 1000 })
    .withMessage('Defect count must be between 0 and 1000');

export const validateReason = () =>
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Reason must be 10-2000 characters');

export const validateNotes = () =>
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters');

export const validateApprovedBy = () =>
  body('approvedBy')
    .trim()
    .notEmpty()
    .withMessage('Approved by is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Invalid approver name');

export const validateRejectedBy = () =>
  body('rejectedBy')
    .trim()
    .notEmpty()
    .withMessage('Rejected by is required')
    .isLength({ min: 3, max: 255 })
    .withMessage('Invalid rejector name');

export const validateContractNumber = () =>
  body('contractNumber')
    .trim()
    .notEmpty()
    .withMessage('Contract number is required')
    .matches(/^[A-Z0-9\-]{5,50}$/)
    .withMessage('Invalid contract number format');

export const validateOriginCertificateNumber = () =>
  body('originCertificateNumber')
    .optional()
    .trim()
    .matches(/^[A-Z0-9\-]{5,50}$/)
    .withMessage('Invalid origin certificate number format');

export const validateDocumentCIDs = () =>
  body('documentCIDs')
    .optional()
    .isArray()
    .withMessage('Document CIDs must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every((cid) => typeof cid === 'string' && cid.match(/^Qm[a-zA-Z0-9]{44}$/));
      }
      return false;
    })
    .withMessage('Invalid IPFS CID format');

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

/**
 * Handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err: any) => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/**
 * Sanitize request body
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous fields
  const dangerousFields = ['__proto__', 'constructor', 'prototype'];
  dangerousFields.forEach((field) => {
    delete req.body[field];
  });

  // Sanitize string fields
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        // Remove null bytes
        req.body[key] = req.body[key].replace(/\0/g, '');
        // Trim whitespace
        req.body[key] = req.body[key].trim();
      }
    });
  }

  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = () => [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .matches(/^[a-zA-Z_]+:(asc|desc)$/)
    .withMessage('Invalid sort format'),
];

/**
 * Validate status filter
 */
export const validateStatusFilter = () =>
  query('status')
    .optional()
    .isIn([
      'DRAFT',
      'ECX_PENDING',
      'ECX_VERIFIED',
      'ECX_REJECTED',
      'ECTA_LICENSE_PENDING',
      'ECTA_LICENSE_APPROVED',
      'ECTA_LICENSE_REJECTED',
      'ECTA_QUALITY_PENDING',
      'ECTA_QUALITY_APPROVED',
      'ECTA_QUALITY_REJECTED',
      'ECTA_ORIGIN_PENDING',
      'ECTA_ORIGIN_ISSUED',
      'ECTA_CONTRACT_PENDING',
      'ECTA_CONTRACT_APPROVED',
      'ECTA_CONTRACT_REJECTED',
      'BANK_DOCUMENT_PENDING',
      'BANK_DOCUMENT_VERIFIED',
      'BANK_DOCUMENT_REJECTED',
      'FX_APPLICATION_PENDING',
      'FX_APPROVED',
      'FX_REJECTED',
      'CUSTOMS_PENDING',
      'CUSTOMS_CLEARED',
      'CUSTOMS_REJECTED',
      'SHIPMENT_SCHEDULED',
      'SHIPPED',
      'ARRIVED',
      'IMPORT_CUSTOMS_PENDING',
      'IMPORT_CUSTOMS_CLEARED',
      'IMPORT_CUSTOMS_REJECTED',
      'DELIVERED',
      'PAYMENT_PENDING',
      'PAYMENT_RECEIVED',
      'FX_REPATRIATED',
      'COMPLETED',
      'CANCELLED',
    ])
    .withMessage('Invalid status');

/**
 * Validate date range
 */
export const validateDateRange = (startField: string, endField: string) => {
  return body().custom((value, { req }) => {
    const start = new Date(req.body[startField]);
    const end = new Date(req.body[endField]);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format');
    }

    if (start >= end) {
      throw new Error(`${startField} must be before ${endField}`);
    }

    return true;
  });
};

/**
 * Validate file upload
 */
export const validateFileUpload = (maxSizeMB: number = 10, allowedMimes: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File is required',
      });
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (req.file.size > maxSizeBytes) {
      return res.status(400).json({
        success: false,
        message: `File size must not exceed ${maxSizeMB}MB`,
      });
    }

    if (allowedMimes.length > 0 && !allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `File type must be one of: ${allowedMimes.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Validate request size
 */
export const validateRequestSize = (maxSizeMB: number = 10) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Request size must not exceed ${maxSizeMB}MB`,
      });
    }

    next();
  };
};

/**
 * Validate JSON structure
 */
export const validateJSONStructure = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate against schema if provided
      if (schema && typeof schema === 'object') {
        const requiredFields = Object.keys(schema);
        const missingFields = requiredFields.filter((field) => !(field in req.body));

        if (missingFields.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields',
            missingFields,
          });
        }
      }

      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Invalid JSON structure',
      });
    }
  };
};
