import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateQualityCertificate = [
  body('exportId').notEmpty().withMessage('Export ID is required'),
  body('qualityGrade').notEmpty().withMessage('Quality grade is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateQualityRejection = [
  body('exportId').notEmpty().withMessage('Export ID is required'),
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateLogin = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateRegister = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('email').isEmail().withMessage('Valid email is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateQualityApproval = [
  body('qualityGrade')
    .notEmpty()
    .withMessage('Quality grade is required')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Quality grade must be A, B, C, or D'),
  body('certifiedBy').notEmpty().withMessage('Certified by is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateLicenseApproval = [
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('approvedBy').notEmpty().withMessage('Approved by is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateContractApproval = [
  body('contractNumber').notEmpty().withMessage('Contract number is required'),
  body('approvedBy').notEmpty().withMessage('Approved by is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateRejection = [
  body('reason').notEmpty().withMessage('Rejection reason is required'),
  body('rejectedBy').notEmpty().withMessage('Rejected by is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];
