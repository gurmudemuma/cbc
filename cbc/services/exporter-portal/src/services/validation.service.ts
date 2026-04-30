/**
 * Validation Service
 * Validates contract terms compliance with international standards
 */

import { createLogger } from '../../../shared/logger';
import {
  CreateContractDraftRequest,
  UpdateContractDraftRequest,
  ValidationResult,
  ValidationError,
  PaymentTerms,
} from '../types/contract.types';

const logger = createLogger('ValidationService');

// Supported coffee types
const SUPPORTED_COFFEE_TYPES = [
  'Arabica',
  'Robusta',
  'Liberica',
  'Excelsa',
  'Ethiopian Yirgacheffe',
  'Ethiopian Sidamo',
  'Ethiopian Harrar',
  'Kenyan AA',
  'Kenyan AB',
  'Colombian Geisha',
  'Brazilian Santos',
  'Tanzanian Peaberry',
];

// Valid ISO 4217 currency codes (common ones)
const VALID_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'CNY', 'INR', 'MXN', 'BRL', 'ZAR', 'SGD', 'HKD', 'ETB',
];

// Valid delivery locations (ports and major cities)
const VALID_DELIVERY_LOCATIONS = [
  'Addis Ababa',
  'Djibouti Port',
  'Port Said',
  'Suez',
  'Rotterdam',
  'Hamburg',
  'Singapore',
  'Hong Kong',
  'Shanghai',
  'Los Angeles',
  'New York',
  'Santos',
  'Antwerp',
  'Dubai',
  'Bangkok',
];

// Approved payment terms
const APPROVED_PAYMENT_TERMS = Object.values(PaymentTerms);

export class ValidationService {
  /**
   * Validate contract creation request
   */
  validateCreateRequest(request: CreateContractDraftRequest): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate buyer name
    if (!request.buyer_name || request.buyer_name.trim().length === 0) {
      errors.push({
        field: 'buyer_name',
        message: 'Buyer name is required',
      });
    }

    // Validate buyer email
    if (!request.buyer_email || !this.isValidEmail(request.buyer_email)) {
      errors.push({
        field: 'buyer_email',
        message: 'Valid buyer email is required',
      });
    }

    // Validate coffee type
    if (!request.coffee_type || !SUPPORTED_COFFEE_TYPES.includes(request.coffee_type)) {
      errors.push({
        field: 'coffee_type',
        message: `Coffee type must be one of: ${SUPPORTED_COFFEE_TYPES.join(', ')}`,
      });
    }

    // Validate quantity
    if (!Number.isInteger(request.quantity_bags) || request.quantity_bags < 1) {
      errors.push({
        field: 'quantity_bags',
        message: 'Quantity must be at least 1 bag',
        value: request.quantity_bags,
      });
    }

    // Validate unit price
    if (typeof request.unit_price !== 'number' || request.unit_price <= 0) {
      errors.push({
        field: 'unit_price',
        message: 'Unit price must be greater than zero',
        value: request.unit_price,
      });
    }

    // Validate currency
    if (!request.currency || !VALID_CURRENCIES.includes(request.currency)) {
      errors.push({
        field: 'currency',
        message: `Currency must be a valid ISO 4217 code. Valid options: ${VALID_CURRENCIES.join(', ')}`,
      });
    }

    // Validate payment terms
    if (!request.payment_terms || !APPROVED_PAYMENT_TERMS.includes(request.payment_terms)) {
      errors.push({
        field: 'payment_terms',
        message: `Payment terms must be one of: ${APPROVED_PAYMENT_TERMS.join(', ')}`,
      });
    }

    // Validate delivery location
    if (!request.delivery_location || !this.isValidDeliveryLocation(request.delivery_location)) {
      errors.push({
        field: 'delivery_location',
        message: `Delivery location must be one of: ${VALID_DELIVERY_LOCATIONS.join(', ')}`,
      });
    }

    // Validate delivery date
    if (!request.delivery_date || !this.isValidFutureDate(request.delivery_date)) {
      errors.push({
        field: 'delivery_date',
        message: 'Delivery date must be in the future',
        value: request.delivery_date,
      });
    }

    if (errors.length > 0) {
      logger.warn(`Validation failed for create request: ${JSON.stringify(errors)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate contract update request
   */
  validateUpdateRequest(request: UpdateContractDraftRequest): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate buyer name if provided
    if (request.buyer_name !== undefined && request.buyer_name.trim().length === 0) {
      errors.push({
        field: 'buyer_name',
        message: 'Buyer name cannot be empty',
      });
    }

    // Validate buyer email if provided
    if (request.buyer_email !== undefined && !this.isValidEmail(request.buyer_email)) {
      errors.push({
        field: 'buyer_email',
        message: 'Valid buyer email is required',
      });
    }

    // Validate coffee type if provided
    if (request.coffee_type !== undefined && !SUPPORTED_COFFEE_TYPES.includes(request.coffee_type)) {
      errors.push({
        field: 'coffee_type',
        message: `Coffee type must be one of: ${SUPPORTED_COFFEE_TYPES.join(', ')}`,
      });
    }

    // Validate quantity if provided
    if (request.quantity_bags !== undefined && (!Number.isInteger(request.quantity_bags) || request.quantity_bags < 1)) {
      errors.push({
        field: 'quantity_bags',
        message: 'Quantity must be at least 1 bag',
        value: request.quantity_bags,
      });
    }

    // Validate unit price if provided
    if (request.unit_price !== undefined && (typeof request.unit_price !== 'number' || request.unit_price <= 0)) {
      errors.push({
        field: 'unit_price',
        message: 'Unit price must be greater than zero',
        value: request.unit_price,
      });
    }

    // Validate currency if provided
    if (request.currency !== undefined && !VALID_CURRENCIES.includes(request.currency)) {
      errors.push({
        field: 'currency',
        message: `Currency must be a valid ISO 4217 code. Valid options: ${VALID_CURRENCIES.join(', ')}`,
      });
    }

    // Validate payment terms if provided
    if (request.payment_terms !== undefined && !APPROVED_PAYMENT_TERMS.includes(request.payment_terms)) {
      errors.push({
        field: 'payment_terms',
        message: `Payment terms must be one of: ${APPROVED_PAYMENT_TERMS.join(', ')}`,
      });
    }

    // Validate delivery location if provided
    if (request.delivery_location !== undefined && !this.isValidDeliveryLocation(request.delivery_location)) {
      errors.push({
        field: 'delivery_location',
        message: `Delivery location must be one of: ${VALID_DELIVERY_LOCATIONS.join(', ')}`,
      });
    }

    // Validate delivery date if provided
    if (request.delivery_date !== undefined && !this.isValidFutureDate(request.delivery_date)) {
      errors.push({
        field: 'delivery_date',
        message: 'Delivery date must be in the future',
        value: request.delivery_date,
      });
    }

    if (errors.length > 0) {
      logger.warn(`Validation failed for update request: ${JSON.stringify(errors)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate finalization requirements
   */
  validateFinalizationRequirements(contract: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Check all required fields are populated
    const requiredFields = [
      'buyer_name',
      'buyer_email',
      'coffee_type',
      'quantity_bags',
      'unit_price',
      'currency',
      'payment_terms',
      'delivery_location',
      'delivery_date',
    ];

    for (const field of requiredFields) {
      if (!contract[field]) {
        errors.push({
          field,
          message: `${field} is required for finalization`,
        });
      }
    }

    // Verify status is ACCEPTED
    if (contract.status !== 'ACCEPTED') {
      errors.push({
        field: 'status',
        message: 'Contract must be ACCEPTED before finalization',
        value: contract.status,
      });
    }

    if (errors.length > 0) {
      logger.warn(`Finalization validation failed: ${JSON.stringify(errors)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate counter-offer modifications
   */
  validateCounterOfferModifications(modifications: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate buyer email if provided
    if (modifications.buyer_email !== undefined && !this.isValidEmail(modifications.buyer_email)) {
      errors.push({
        field: 'buyer_email',
        message: 'Valid buyer email is required',
      });
    }

    // Validate coffee type if provided
    if (modifications.coffee_type !== undefined && !SUPPORTED_COFFEE_TYPES.includes(modifications.coffee_type)) {
      errors.push({
        field: 'coffee_type',
        message: `Coffee type must be one of: ${SUPPORTED_COFFEE_TYPES.join(', ')}`,
      });
    }

    // Validate quantity if provided
    if (modifications.quantity_bags !== undefined && (!Number.isInteger(modifications.quantity_bags) || modifications.quantity_bags < 1)) {
      errors.push({
        field: 'quantity_bags',
        message: 'Quantity must be at least 1 bag',
        value: modifications.quantity_bags,
      });
    }

    // Validate unit price if provided
    if (modifications.unit_price !== undefined && (typeof modifications.unit_price !== 'number' || modifications.unit_price <= 0)) {
      errors.push({
        field: 'unit_price',
        message: 'Unit price must be greater than zero',
        value: modifications.unit_price,
      });
    }

    // Validate currency if provided
    if (modifications.currency !== undefined && !VALID_CURRENCIES.includes(modifications.currency)) {
      errors.push({
        field: 'currency',
        message: `Currency must be a valid ISO 4217 code. Valid options: ${VALID_CURRENCIES.join(', ')}`,
      });
    }

    // Validate payment terms if provided
    if (modifications.payment_terms !== undefined && !APPROVED_PAYMENT_TERMS.includes(modifications.payment_terms)) {
      errors.push({
        field: 'payment_terms',
        message: `Payment terms must be one of: ${APPROVED_PAYMENT_TERMS.join(', ')}`,
      });
    }

    // Validate delivery location if provided
    if (modifications.delivery_location !== undefined && !this.isValidDeliveryLocation(modifications.delivery_location)) {
      errors.push({
        field: 'delivery_location',
        message: `Delivery location must be one of: ${VALID_DELIVERY_LOCATIONS.join(', ')}`,
      });
    }

    // Validate delivery date if provided
    if (modifications.delivery_date !== undefined && !this.isValidFutureDate(new Date(modifications.delivery_date))) {
      errors.push({
        field: 'delivery_date',
        message: 'Delivery date must be in the future',
        value: modifications.delivery_date,
      });
    }

    if (errors.length > 0) {
      logger.warn(`Counter-offer modifications validation failed: ${JSON.stringify(errors)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get supported coffee types
   */
  getSupportedCoffeeTypes(): string[] {
    return SUPPORTED_COFFEE_TYPES;
  }

  /**
   * Get valid currencies
   */
  getValidCurrencies(): string[] {
    return VALID_CURRENCIES;
  }

  /**
   * Get valid delivery locations
   */
  getValidDeliveryLocations(): string[] {
    return VALID_DELIVERY_LOCATIONS;
  }

  /**
   * Get approved payment terms
   */
  getApprovedPaymentTerms(): string[] {
    return APPROVED_PAYMENT_TERMS;
  }

  /**
   * Private helper methods
   */

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidFutureDate(date: Date | string): boolean {
    const deliveryDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return deliveryDate > today;
  }

  private isValidDeliveryLocation(location: string): boolean {
    // Allow exact matches or partial matches (case-insensitive)
    return VALID_DELIVERY_LOCATIONS.some(
      (validLocation) => validLocation.toLowerCase() === location.toLowerCase()
    );
  }
}
