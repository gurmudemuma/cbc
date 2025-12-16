/**
 * Unified Export Validation Schema
 * Single source of truth for export validation across Frontend and Backend
 */

import { z } from 'zod';
// import { EXPORT_STATUS } from '../constants/status.constants';

// Base export data schema
export const BaseExportSchema = z.object({
  exportId: z.string().min(1, 'Export ID is required').max(50),
  exporterName: z.string().min(1, 'Exporter name is required').max(255),
  exporterTIN: z.string().min(10, 'Valid TIN is required').max(20),
  coffeeType: z.enum(['Arabica', 'Robusta', 'Liberica']),
  quantity: z.number().positive('Quantity must be positive'),
  destinationCountry: z.string().min(1, 'Destination country is required').max(100),
  estimatedValue: z.number().positive('Estimated value must be positive'),
});

// Create export schema (with pre-existing documents)
export const CreateExportSchema = BaseExportSchema.extend({
  exportLicenseNumber: z.string().min(1, 'Export license number is required'),
  competenceCertificateNumber: z.string().min(1, 'Competence certificate number is required'),
  ecxLotNumber: z.string().min(1, 'ECX lot number is required'),
  warehouseReceiptNumber: z.string().min(1, 'Warehouse receipt number is required'),
  qualityCertificateNumber: z.string().min(1, 'Quality certificate number is required'),
  salesContractNumber: z.string().min(1, 'Sales contract number is required'),
  exportPermitNumber: z.string().min(1, 'Export permit number is required'),
  originCertificateNumber: z.string().min(1, 'Origin certificate number is required'),
  qualityGrade: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Update export schema (partial)
export const UpdateExportSchema = z.object({
  coffeeType: z.enum(['Arabica', 'Robusta', 'Liberica']).optional(),
  quantity: z.number().positive().optional(),
  destinationCountry: z.string().max(100).optional(),
  estimatedValue: z.number().positive().optional(),
});

// Reinspection request schema
export const ReinspectionRequestSchema = z.object({
  notes: z.string().max(1000).optional(),
});

// Status transition schema
export const StatusTransitionSchema = z.object({
  currentStatus: z.string(),
  newStatus: z.string(),
  reason: z.string().optional(),
});

// Approval schema
export const ApprovalSchema = z.object({
  approvedBy: z.string().min(1, 'Approver name is required'),
  notes: z.string().max(1000).optional(),
  documentCIDs: z.array(z.string()).optional(),
});

// Rejection schema
export const RejectionSchema = z.object({
  reason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
  rejectedBy: z.string().min(1, 'Rejector name is required'),
  category: z.enum(['QUALITY', 'DOCUMENTATION', 'COMPLIANCE', 'OTHER']).optional(),
});

// Quality certification schema
export const QualityCertificationSchema = z.object({
  qualityGrade: z.enum(['A', 'B', 'C', 'D']),
  moistureContent: z.number().min(0).max(100).optional(),
  defectCount: z.number().min(0).optional(),
  certifiedBy: z.string().min(1, 'Certifier name is required'),
  documentCIDs: z.array(z.string()).optional(),
});

// FX approval schema
export const FXApprovalSchema = z.object({
  fxApprovalID: z.string().min(1, 'FX approval ID is required'),
  approvedBy: z.string().min(1, 'Approver name is required'),
  fxRate: z.number().positive().optional(),
  documentCIDs: z.array(z.string()).optional(),
});

// Customs clearance schema
export const CustomsClearanceSchema = z.object({
  declarationNumber: z.string().min(1, 'Declaration number is required'),
  clearedBy: z.string().min(1, 'Clearance officer name is required'),
  documentCIDs: z.array(z.string()).optional(),
});

// Shipment schema
export const ShipmentSchema = z.object({
  transportIdentifier: z.string().min(1, 'Transport identifier is required'),
  departureDate: z.string().datetime('Invalid departure date'),
  arrivalDate: z.string().datetime('Invalid arrival date'),
  transportMode: z.enum(['SEA', 'AIR', 'RAIL', 'ROAD']),
  documentCIDs: z.array(z.string()).optional(),
});

// Payment confirmation schema
export const PaymentConfirmationSchema = z.object({
  paymentMethod: z.enum(['LC', 'TT', 'DP', 'DA', 'CAD']),
  paymentAmount: z.number().positive('Payment amount must be positive'),
  paymentDate: z.string().datetime('Invalid payment date'),
  confirmedBy: z.string().min(1, 'Confirmer name is required'),
});

// Type exports for TypeScript
export type BaseExport = z.infer<typeof BaseExportSchema>;
export type CreateExportDTO = z.infer<typeof CreateExportSchema>;
export type UpdateExportDTO = z.infer<typeof UpdateExportSchema>;
export type ReinspectionRequest = z.infer<typeof ReinspectionRequestSchema>;
export type StatusTransition = z.infer<typeof StatusTransitionSchema>;
export type ApprovalData = z.infer<typeof ApprovalSchema>;
export type RejectionData = z.infer<typeof RejectionSchema>;
export type QualityCertification = z.infer<typeof QualityCertificationSchema>;
export type FXApproval = z.infer<typeof FXApprovalSchema>;
export type CustomsClearance = z.infer<typeof CustomsClearanceSchema>;
export type Shipment = z.infer<typeof ShipmentSchema>;
export type PaymentConfirmation = z.infer<typeof PaymentConfirmationSchema>;

// Validation helper functions
export function validateCreateExport(data: unknown): CreateExportDTO {
  return CreateExportSchema.parse(data);
}

export function validateUpdateExport(data: unknown): UpdateExportDTO {
  return UpdateExportSchema.parse(data);
}

export function validateReinspectionRequest(data: unknown): ReinspectionRequest {
  return ReinspectionRequestSchema.parse(data);
}

export function validateApproval(data: unknown): ApprovalData {
  return ApprovalSchema.parse(data);
}

export function validateRejection(data: unknown): RejectionData {
  return RejectionSchema.parse(data);
}

export function validateQualityCertification(data: unknown): QualityCertification {
  return QualityCertificationSchema.parse(data);
}

export function validateFXApproval(data: unknown): FXApproval {
  return FXApprovalSchema.parse(data);
}

export function validateCustomsClearance(data: unknown): CustomsClearance {
  return CustomsClearanceSchema.parse(data);
}

export function validateShipment(data: unknown): Shipment {
  return ShipmentSchema.parse(data);
}

export function validatePaymentConfirmation(data: unknown): PaymentConfirmation {
  return PaymentConfirmationSchema.parse(data);
}

// Safe validation (returns error instead of throwing)
export function safeValidate<T>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; error?: string } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      return { success: false, error: messages };
    }
    return { success: false, error: 'Validation failed' };
  }
}
