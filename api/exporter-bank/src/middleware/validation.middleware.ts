import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { PasswordValidator } from "../../../shared/password.validator";

export const validateExportRequest = [
  body("exporterName")
    .notEmpty()
    .withMessage("Exporter name is required")
    .trim()
    .escape()
    .isLength({ max: 200 })
    .withMessage("Exporter name must not exceed 200 characters"),

  body("coffeeType")
    .notEmpty()
    .withMessage("Coffee type is required")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Coffee type must be between 3 and 100 characters"),

  body("quantity")
    .isFloat({ min: 0.1, max: 1000000 })
    .withMessage("Quantity must be between 0.1 and 1,000,000 kg"),

  body("destinationCountry")
    .notEmpty()
    .withMessage("Destination country is required")
    .trim()
    .escape()
    .isLength({ min: 2, max: 100 })
    .withMessage("Destination country must be between 2 and 100 characters"),

  body("estimatedValue")
    .isFloat({ min: 0.01, max: 100000000 })
    .withMessage("Estimated value must be between $0.01 and $100,000,000"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateLogin = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .escape(),

  body("password").notEmpty().withMessage("Password is required"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];

export const validateRegister = [
  body("username")
    .notEmpty()
    .withMessage("Username is required")
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),

  // Use enhanced password validator
  PasswordValidator.validatePassword(),

  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail()
    .trim(),

  body("organizationId")
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage("Organization ID must not exceed 100 characters"),

  body("role")
    .optional()
    .trim()
    .escape()
    .isIn(["admin", "user", "exporter", "bank", "customs", "shipper"])
    .withMessage("Invalid role"),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }
    next();
  },
];
