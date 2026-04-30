import { describe, it, expect } from 'vitest';
import { ValidationService } from '../services/validation.service';

describe('ValidationService', () => {
  const validationService = new ValidationService();

  describe('validateDeliveryDate', () => {
    it('should accept future delivery dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const result = validationService.validateDeliveryDate(futureDate.toISOString());
      expect(result.valid).toBe(true);
    });

    it('should reject past delivery dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const result = validationService.validateDeliveryDate(pastDate.toISOString());
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject today as delivery date', () => {
      const today = new Date().toISOString();
      const result = validationService.validateDeliveryDate(today);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateQuantity', () => {
    it('should accept valid quantities', () => {
      const result = validationService.validateQuantity(150);
      expect(result.valid).toBe(true);
    });

    it('should reject zero quantity', () => {
      const result = validationService.validateQuantity(0);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject negative quantity', () => {
      const result = validationService.validateQuantity(-50);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject fractional quantities', () => {
      const result = validationService.validateQuantity(150.5);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateUnitPrice', () => {
    it('should accept valid unit prices', () => {
      const result = validationService.validateUnitPrice(4.5);
      expect(result.valid).toBe(true);
    });

    it('should reject zero price', () => {
      const result = validationService.validateUnitPrice(0);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject negative price', () => {
      const result = validationService.validateUnitPrice(-1.5);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept decimal prices', () => {
      const result = validationService.validateUnitPrice(4.99);
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePaymentTerms', () => {
    it('should accept approved payment terms', () => {
      const approvedTerms = ['Net 30', 'Net 60', 'Net 90', 'Immediate'];
      approvedTerms.forEach(term => {
        const result = validationService.validatePaymentTerms(term);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject unapproved payment terms', () => {
      const result = validationService.validatePaymentTerms('Custom Terms');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should be case-insensitive', () => {
      const result = validationService.validatePaymentTerms('net 30');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCurrency', () => {
    it('should accept valid ISO 4217 currency codes', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'ETB'];
      validCurrencies.forEach(currency => {
        const result = validationService.validateCurrency(currency);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid currency codes', () => {
      const result = validationService.validateCurrency('INVALID');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should be case-insensitive', () => {
      const result = validationService.validateCurrency('usd');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCoffeeType', () => {
    it('should accept supported coffee types', () => {
      const supportedTypes = [
        'Arabica Grade 1',
        'Arabica Grade 2',
        'Robusta Grade 1',
        'Robusta Grade 2',
        'Specialty Coffee',
        'Organic Arabica',
        'Yirgacheffe',
      ];
      supportedTypes.forEach(type => {
        const result = validationService.validateCoffeeType(type);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject unsupported coffee types', () => {
      const result = validationService.validateCoffeeType('Unknown Type');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateDeliveryLocation', () => {
    it('should accept valid ports and cities', () => {
      const validLocations = [
        'Port of Djibouti',
        'Port of Hamburg',
        'Port of Rotterdam',
        'Port of Singapore',
      ];
      validLocations.forEach(location => {
        const result = validationService.validateDeliveryLocation(location);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid locations', () => {
      const result = validationService.validateDeliveryLocation('Invalid Location');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should be case-insensitive', () => {
      const result = validationService.validateDeliveryLocation('port of hamburg');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'buyer@company.com',
        'test.email@domain.co.uk',
        'user+tag@example.com',
      ];
      validEmails.forEach(email => {
        const result = validationService.validateEmail(email);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid.email',
        '@nodomain.com',
        'user@',
        'user name@domain.com',
      ];
      invalidEmails.forEach(email => {
        const result = validationService.validateEmail(email);
        expect(result.valid).toBe(false);
      });
    });
  });

  describe('validateContractTerms', () => {
    it('should validate all contract terms together', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const contractData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        delivery_location: 'Port of Hamburg',
        buyer_email: 'buyer@company.com',
      };

      const result = validationService.validateContractTerms(contractData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect multiple validation errors', () => {
      const contractData = {
        quantity: 0, // Invalid
        unit_price: -1, // Invalid
        delivery_date: '2020-01-01', // Invalid
        payment_terms: 'Invalid Terms', // Invalid
        currency: 'INVALID', // Invalid
        coffee_type: 'Unknown', // Invalid
        delivery_location: 'Invalid Location', // Invalid
        buyer_email: 'invalid.email', // Invalid
      };

      const result = validationService.validateContractTerms(contractData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should return specific error messages', () => {
      const contractData = {
        quantity: 0,
        unit_price: 4.5,
        delivery_date: '2026-06-01',
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        delivery_location: 'Port of Hamburg',
        buyer_email: 'buyer@company.com',
      };

      const result = validationService.validateContractTerms(contractData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('quantity'))).toBe(true);
    });
  });

  describe('getValidationErrorMessage', () => {
    it('should return appropriate error messages', () => {
      const message1 = validationService.getValidationErrorMessage('quantity', 'Quantity must be at least 1 bag');
      expect(message1).toContain('quantity');

      const message2 = validationService.getValidationErrorMessage('unit_price', 'Unit price must be greater than 0');
      expect(message2).toContain('unit_price');
    });
  });
});
