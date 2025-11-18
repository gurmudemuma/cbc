/**
 * Zod Validation Schemas
 * Centralized schema validation for all API endpoints
 * Best Practice: Type-safe validation with automatic TypeScript inference
 */

import { z } from 'zod';

/**
 * Export Request Schema
 */
export const CreateExportSchema = z.object({
  exporterName: z
    .string()
    .min(3, 'Exporter name must be at least 3 characters')
    .max(200, 'Exporter name must not exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s\-.,&()]+$/, 'Invalid characters in exporter name'),
  
  coffeeType: z
    .string()
    .min(3, 'Coffee type must be at least 3 characters')
    .max(100, 'Coffee type must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-]+$/, 'Invalid characters in coffee type'),
  
  quantity: z
    .number()
    .positive('Quantity must be positive')
    .min(0.1, 'Minimum quantity is 0.1 kg')
    .max(1000000, 'Maximum quantity is 1,000,000 kg')
    .refine((val) => Number.isFinite(val), 'Quantity must be a valid number'),
  
  destinationCountry: z
    .string()
    .min(2, 'Destination country must be at least 2 characters')
    .max(100, 'Destination country must not exceed 100 characters')
    .regex(/^[a-zA-Z\s\-]+$/, 'Invalid characters in destination country'),
  
  estimatedValue: z
    .number()
    .positive('Estimated value must be positive')
    .min(1, 'Minimum value is $1')
    .max(100000000, 'Maximum value is $100,000,000')
    .refine((val) => Number.isFinite(val), 'Value must be a valid number'),
  
  exportLicenseNumber: z
    .string()
    .min(5, 'License number must be at least 5 characters')
    .max(50, 'License number must not exceed 50 characters')
    .regex(/^[A-Z0-9\-]+$/, 'License number must be uppercase alphanumeric with hyphens')
    .optional(),
  
  ecxLotNumber: z
    .string()
    .max(50, 'ECX lot number must not exceed 50 characters')
    .optional(),
  
  warehouseLocation: z
    .string()
    .max(200, 'Warehouse location must not exceed 200 characters')
    .optional(),
});

// Infer TypeScript type from schema
export type CreateExportDTO = z.infer<typeof CreateExportSchema>;

/**
 * Quality Approval Schema
 */
export const ApproveQualitySchema = z.object({
  qualityGrade: z
    .enum(['Grade A', 'Grade B', 'Grade C', 'Premium', 'Standard'])
    .refine((val) => val !== undefined, { message: 'Invalid quality grade' }),
  
  certifiedBy: z
    .string()
    .min(3, 'Certifier name must be at least 3 characters')
    .max(100, 'Certifier name must not exceed 100 characters'),
  
  documentCIDs: z
    .array(z.string().regex(/^Qm[a-zA-Z0-9]{44}$/, 'Invalid IPFS CID format'))
    .optional(),
  
  originCertificateNumber: z
    .string()
    .max(50, 'Certificate number must not exceed 50 characters')
    .optional(),
});

export type ApproveQualityDTO = z.infer<typeof ApproveQualitySchema>;

/**
 * FX Approval Schema
 */
export const ApproveFXSchema = z.object({
  fxApprovalID: z
    .string()
    .min(5, 'FX approval ID must be at least 5 characters')
    .max(50, 'FX approval ID must not exceed 50 characters'),
  
  approvedBy: z
    .string()
    .min(3, 'Approver name must be at least 3 characters')
    .max(100, 'Approver name must not exceed 100 characters'),
  
  documentCIDs: z
    .array(z.string().regex(/^Qm[a-zA-Z0-9]{44}$/, 'Invalid IPFS CID format'))
    .optional(),
});

export type ApproveFXDTO = z.infer<typeof ApproveFXSchema>;

/**
 * Rejection Schema (for FX, Quality, Banking)
 */
export const RejectSchema = z.object({
  reason: z
    .string()
    .min(10, 'Rejection reason must be at least 10 characters')
    .max(500, 'Rejection reason must not exceed 500 characters'),
  
  rejectedBy: z
    .string()
    .min(3, 'Rejector name must be at least 3 characters')
    .max(100, 'Rejector name must not exceed 100 characters'),
});

export type RejectDTO = z.infer<typeof RejectSchema>;

/**
 * Customs Clearance Schema
 */
export const ClearCustomsSchema = z.object({
  declarationNumber: z
    .string()
    .min(5, 'Declaration number must be at least 5 characters')
    .max(50, 'Declaration number must not exceed 50 characters')
    .regex(/^[A-Z0-9\-]+$/, 'Invalid declaration number format'),
  
  clearedBy: z
    .string()
    .min(3, 'Officer name must be at least 3 characters')
    .max(100, 'Officer name must not exceed 100 characters'),
  
  documentCIDs: z
    .array(z.string().regex(/^Qm[a-zA-Z0-9]{44}$/, 'Invalid IPFS CID format'))
    .optional(),
});

export type ClearCustomsDTO = z.infer<typeof ClearCustomsSchema>;

/**
 * Shipment Schedule Schema
 */
export const ScheduleShipmentSchema = z.object({
  transportIdentifier: z
    .string()
    .min(3, 'Transport identifier must be at least 3 characters')
    .max(50, 'Transport identifier must not exceed 50 characters')
    .regex(/^[A-Z0-9\-\s]+$/, 'Invalid transport identifier format'),
  
  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const d = new Date(date);
      return d >= new Date();
    }, 'Departure date must be in the future'),
  
  arrivalDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  transportMode: z.enum(['SEA', 'AIR', 'RAIL']),
  
  documentCIDs: z
    .array(z.string().regex(/^Qm[a-zA-Z0-9]{44}$/, 'Invalid IPFS CID format'))
    .optional(),
}).refine(
  (data) => new Date(data.arrivalDate) > new Date(data.departureDate),
  {
    message: 'Arrival date must be after departure date',
    path: ['arrivalDate'],
  }
);

export type ScheduleShipmentDTO = z.infer<typeof ScheduleShipmentSchema>;

/**
 * Payment Confirmation Schema
 */
export const ConfirmPaymentSchema = z.object({
  paymentMethod: z.enum(['LC', 'TT', 'DP', 'DA', 'CAD']),
  
  amount: z
    .number()
    .positive('Amount must be positive')
    .min(1, 'Minimum amount is $1')
    .max(100000000, 'Maximum amount is $100,000,000'),
  
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

export type ConfirmPaymentDTO = z.infer<typeof ConfirmPaymentSchema>;

/**
 * User Registration Schema
 */
export const RegisterUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must not exceed 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/, 'Password must contain at least one special character'),
  
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must not exceed 255 characters'),
  
  organizationId: z
    .string()
    .min(3, 'Organization ID must be at least 3 characters')
    .max(50, 'Organization ID must not exceed 50 characters')
    .optional(),
  
  role: z
    .enum(['exporter', 'bank', 'admin', 'user', 'shipper', 'customs'])
    .optional(),
});

export type RegisterUserDTO = z.infer<typeof RegisterUserSchema>;

/**
 * Login Schema
 */
export const LoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required'),
  
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

/**
 * Pagination Schema
 */
export const PaginationSchema = z.object({
  page: z
    .number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),
  
  limit: z
    .number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .min(1, 'Minimum limit is 1')
    .max(100, 'Maximum limit is 100')
    .default(10),
  
  sortBy: z
    .string()
    .optional(),
  
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc'),
});

export type PaginationDTO = z.infer<typeof PaginationSchema>;

/**
 * Export Filter Schema
 */
export const ExportFilterSchema = z.object({
  status: z
    .enum([
      // Initial States
      'DRAFT',
      'PENDING',
      // ECX Stage
      'ECX_PENDING',
      'ECX_VERIFIED',
      'ECX_REJECTED',
      // ECTA Stage
      'ECTA_LICENSE_PENDING',
      'ECTA_LICENSE_APPROVED',
      'ECTA_LICENSE_REJECTED',
      'ECTA_QUALITY_PENDING',
      'ECTA_QUALITY_APPROVED',
      'ECTA_QUALITY_REJECTED',
      'ECTA_ORIGIN_PENDING',
      'ECTA_ORIGIN_APPROVED',
      'ECTA_ORIGIN_REJECTED',
      'ECTA_CONTRACT_PENDING',
      'ECTA_CONTRACT_APPROVED',
      'ECTA_CONTRACT_REJECTED',
      // Commercial Bank Stage
      'BANK_DOCUMENT_PENDING',
      'BANK_DOCUMENT_VERIFIED',
      'BANK_DOCUMENT_REJECTED',
      // NBE Stage
      'FX_APPLICATION_PENDING',
      'FX_APPROVED',
      'FX_REJECTED',
      // Customs Stage
      'CUSTOMS_PENDING',
      'CUSTOMS_CLEARED',
      'CUSTOMS_REJECTED',
      // Shipping Stage
      'SHIPMENT_PENDING',
      'SHIPMENT_SCHEDULED',
      'SHIPPED',
      'SHIPMENT_REJECTED',
      'ARRIVED',
      // Final States
      'DELIVERED',
      'PAYMENT_PENDING',
      'PAYMENT_RECEIVED',
      'FX_REPATRIATED',
      'COMPLETED',
      'CANCELLED',
    ])
    .optional(),
  
  exporterBankId: z
    .string()
    .optional(),
  
  destinationCountry: z
    .string()
    .optional(),
  
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  
  minValue: z
    .number()
    .positive()
    .optional(),
  
  maxValue: z
    .number()
    .positive()
    .optional(),
});

export type ExportFilterDTO = z.infer<typeof ExportFilterSchema>;

/**
 * Validation middleware factory
 * Usage: validateRequest(CreateExportSchema)
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      // Validate request body
      const validated = schema.parse(req.body);
      
      // Replace request body with validated data
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      // Convert string query params to appropriate types
      const query = { ...req.query };
      
      // Convert numeric strings to numbers
      Object.keys(query).forEach((key) => {
        if (!isNaN(Number(query[key]))) {
          query[key] = Number(query[key]);
        }
      });
      
      const validated = schema.parse(query);
      req.query = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Invalid query parameters',
          errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        message: 'Internal validation error',
      });
    }
  };
};

/**
 * Business rule validators
 */
export class BusinessRuleValidator {
  /**
   * Validate minimum quantity based on coffee type
   */
  static validateMinimumQuantity(quantity: number, coffeeType: string): boolean {
    const minimums: Record<string, number> = {
      'Arabica Premium': 100,
      'Arabica': 50,
      'Robusta': 50,
      'Specialty': 25,
    };
    
    const minimum = minimums[coffeeType] || 10;
    return quantity >= minimum;
  }
  
  /**
   * Validate estimated value matches quantity
   */
  static validateEstimatedValue(quantity: number, value: number): boolean {
    const minPricePerKg = 2; // $2/kg minimum
    const maxPricePerKg = 50; // $50/kg maximum
    
    const pricePerKg = value / quantity;
    return pricePerKg >= minPricePerKg && pricePerKg <= maxPricePerKg;
  }
  
  /**
   * Validate destination country is allowed
   */
  static async validateDestinationCountry(country: string): Promise<boolean> {
    // In production, this would check against a database or API
    const allowedCountries = [
      'United States',
      'Germany',
      'Japan',
      'Saudi Arabia',
      'Belgium',
      'Italy',
      'South Korea',
      'France',
      'United Kingdom',
      'Netherlands',
    ];
    
    return allowedCountries.includes(country);
  }
  
  /**
   * Validate export license is active
   */
  static async validateExportLicense(licenseNumber: string): Promise<boolean> {
    // In production, this would check against a license registry
    // For now, basic format validation
    return /^[A-Z]{2}\d{6}$/.test(licenseNumber);
  }
}

export default {
  CreateExportSchema,
  ApproveQualitySchema,
  ApproveFXSchema,
  RejectSchema,
  ClearCustomsSchema,
  ScheduleShipmentSchema,
  ConfirmPaymentSchema,
  RegisterUserSchema,
  LoginSchema,
  PaginationSchema,
  ExportFilterSchema,
  validateRequest,
  validateQuery,
  BusinessRuleValidator,
};
