/**
 * Unit Tests for Validation Schemas
 * Best Practice: Comprehensive test coverage
 */

import { describe, it, expect } from '@jest/globals';
import {
  CreateExportSchema,
  ApproveQualitySchema,
  RejectSchema,
  BusinessRuleValidator,
} from '../validation.schemas';

describe('CreateExportSchema', () => {
  it('should validate correct export data', () => {
    const validData = {
      exporterName: 'ABC Coffee Exporters',
      coffeeType: 'Arabica Premium',
      quantity: 1000,
      destinationCountry: 'United States',
      estimatedValue: 50000,
      exportLicenseNumber: 'ET123456',
    };

    const result = CreateExportSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid exporter name', () => {
    const invalidData = {
      exporterName: 'AB', // Too short
      coffeeType: 'Arabica',
      quantity: 1000,
      destinationCountry: 'USA',
      estimatedValue: 50000,
    };

    const result = CreateExportSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject negative quantity', () => {
    const invalidData = {
      exporterName: 'ABC Coffee',
      coffeeType: 'Arabica',
      quantity: -100,
      destinationCountry: 'USA',
      estimatedValue: 50000,
    };

    const result = CreateExportSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject quantity exceeding maximum', () => {
    const invalidData = {
      exporterName: 'ABC Coffee',
      coffeeType: 'Arabica',
      quantity: 2000000, // Exceeds max
      destinationCountry: 'USA',
      estimatedValue: 50000,
    };

    const result = CreateExportSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid characters in coffee type', () => {
    const invalidData = {
      exporterName: 'ABC Coffee',
      coffeeType: 'Arabica<script>alert("xss")</script>',
      quantity: 1000,
      destinationCountry: 'USA',
      estimatedValue: 50000,
    };

    const result = CreateExportSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('ApproveQualitySchema', () => {
  it('should validate correct quality approval', () => {
    const validData = {
      qualityGrade: 'Grade A',
      certifiedBy: 'John Inspector',
      documentCIDs: ['QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'],
    };

    const result = ApproveQualitySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid quality grade', () => {
    const invalidData = {
      qualityGrade: 'Grade Z', // Invalid grade
      certifiedBy: 'John Inspector',
    };

    const result = ApproveQualitySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid IPFS CID format', () => {
    const invalidData = {
      qualityGrade: 'Grade A',
      certifiedBy: 'John Inspector',
      documentCIDs: ['invalid-cid-format'],
    };

    const result = ApproveQualitySchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('RejectSchema', () => {
  it('should validate correct rejection', () => {
    const validData = {
      reason: 'Quality does not meet standards due to high defect rate',
      rejectedBy: 'Jane Inspector',
    };

    const result = RejectSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject short rejection reason', () => {
    const invalidData = {
      reason: 'Bad', // Too short
      rejectedBy: 'Jane Inspector',
    };

    const result = RejectSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject excessively long rejection reason', () => {
    const invalidData = {
      reason: 'A'.repeat(600), // Exceeds max length
      rejectedBy: 'Jane Inspector',
    };

    const result = RejectSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('BusinessRuleValidator', () => {
  describe('validateMinimumQuantity', () => {
    it('should accept quantity meeting minimum for Arabica Premium', () => {
      const result = BusinessRuleValidator.validateMinimumQuantity(150, 'Arabica Premium');
      expect(result).toBe(true);
    });

    it('should reject quantity below minimum for Arabica Premium', () => {
      const result = BusinessRuleValidator.validateMinimumQuantity(50, 'Arabica Premium');
      expect(result).toBe(false);
    });

    it('should use default minimum for unknown coffee type', () => {
      const result = BusinessRuleValidator.validateMinimumQuantity(15, 'Unknown Type');
      expect(result).toBe(true);
    });
  });

  describe('validateEstimatedValue', () => {
    it('should accept valid price per kg', () => {
      const result = BusinessRuleValidator.validateEstimatedValue(1000, 10000); // $10/kg
      expect(result).toBe(true);
    });

    it('should reject price below minimum', () => {
      const result = BusinessRuleValidator.validateEstimatedValue(1000, 1000); // $1/kg
      expect(result).toBe(false);
    });

    it('should reject price above maximum', () => {
      const result = BusinessRuleValidator.validateEstimatedValue(1000, 60000); // $60/kg
      expect(result).toBe(false);
    });
  });

  describe('validateDestinationCountry', () => {
    it('should accept allowed destination country', async () => {
      const result = await BusinessRuleValidator.validateDestinationCountry('United States');
      expect(result).toBe(true);
    });

    it('should reject disallowed destination country', async () => {
      const result = await BusinessRuleValidator.validateDestinationCountry('North Korea');
      expect(result).toBe(false);
    });
  });

  describe('validateExportLicense', () => {
    it('should accept valid license format', async () => {
      const result = await BusinessRuleValidator.validateExportLicense('ET123456');
      expect(result).toBe(true);
    });

    it('should reject invalid license format', async () => {
      const result = await BusinessRuleValidator.validateExportLicense('invalid');
      expect(result).toBe(false);
    });
  });
});
