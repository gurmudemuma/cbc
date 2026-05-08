import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pool } from 'pg';
import { ContractService } from '../../services/contract.service';
import { ValidationService } from '../../services/validation.service';
import { NotificationService } from '../../services/notification.service';

describe('Contract Creation Workflow - Integration Tests', () => {
  let contractService: ContractService;
  let validationService: ValidationService;
  let notificationService: NotificationService;
  let mockPool: any;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
      connect: vi.fn(),
      end: vi.fn(),
    };
    contractService = new ContractService(mockPool);
    validationService = new ValidationService();
    notificationService = new NotificationService(mockPool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('End-to-end contract creation', () => {
    it('should create contract with valid form data', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        buyerName: 'ABC Coffee Imports',
        buyerEmail: 'buyer@abc.com',
        coffeeType: 'Arabica Grade 1',
        quantity: 150,
        unitPrice: 4.5,
        currency: 'USD',
        paymentTerms: 'Net 30',
        deliveryDate: futureDate.toISOString(),
        portOfDischarge: 'Port of Hamburg',
      };

      // Step 1: Validate form data
      const validationResult = validationService.validateContractTerms({
        quantity: formData.quantity,
        unit_price: formData.unitPrice,
        delivery_date: formData.deliveryDate,
        payment_terms: formData.paymentTerms,
        currency: formData.currency,
        coffee_type: formData.coffeeType,
        port_of_discharge: formData.portOfDischarge,
        buyer_email: formData.buyerEmail,
      });

      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);

      // Step 2: Create contract
      const mockCreatedContract = {
        draft_id: 'draft-123',
        exporter_id: 'exp-123',
        ...formData,
        status: 'DRAFT',
        created_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockCreatedContract] });

      const createdContract = await contractService.createContract({
        exporter_id: 'exp-123',
        buyer_name: formData.buyerName,
        buyer_email: formData.buyerEmail,
        coffee_type: formData.coffeeType,
        quantity: formData.quantity,
        unit_price: formData.unitPrice,
        currency: formData.currency,
        payment_terms: formData.paymentTerms,
        delivery_date: formData.deliveryDate,
        port_of_discharge: formData.portOfDischarge,
      });

      expect(createdContract).toBeDefined();
      expect(createdContract.draft_id).toBe('draft-123');
      expect(createdContract.status).toBe('DRAFT');

      // Step 3: Create history entry
      mockPool.query.mockResolvedValueOnce({
        rows: [{ id: 'hist-123', action: 'CREATED' }],
      });

      const history = await contractService.createContractHistory({
        contract_id: createdContract.draft_id,
        action: 'CREATED',
        actor: 'EXPORTER',
        changes: {},
      });

      expect(history).toBeDefined();
      expect(history.action).toBe('CREATED');
    });

    it('should reject contract with invalid delivery date', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const formData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: pastDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'buyer@abc.com',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('delivery'))).toBe(true);
    });

    it('should reject contract with invalid quantity', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 0,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'buyer@abc.com',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('quantity'))).toBe(true);
    });

    it('should reject contract with invalid unit price', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 150,
        unit_price: -1,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'buyer@abc.com',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('price'))).toBe(true);
    });

    it('should reject contract with invalid payment terms', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Invalid Terms',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'buyer@abc.com',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('payment'))).toBe(true);
    });

    it('should reject contract with invalid currency', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'INVALID',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'buyer@abc.com',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('currency'))).toBe(true);
    });

    it('should reject contract with invalid coffee type', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Unknown Type',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'buyer@abc.com',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('coffee'))).toBe(true);
    });

    it('should reject contract with invalid delivery location', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Invalid Location',
        buyer_email: 'buyer@abc.com',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('location'))).toBe(true);
    });

    it('should reject contract with invalid email', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'invalid.email',
      };

      const validationResult = validationService.validateContractTerms(formData);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors.some(e => e.includes('email'))).toBe(true);
    });

    it('should persist contract to database', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const contractData = {
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        currency: 'USD',
        payment_terms: 'Net 30',
        delivery_date: futureDate.toISOString(),
        port_of_discharge: 'Port of Hamburg',
      };

      mockPool.query.mockResolvedValueOnce({
        rows: [{ draft_id: 'draft-123', ...contractData, status: 'DRAFT' }],
      });

      const result = await contractService.createContract(contractData);

      expect(mockPool.query).toHaveBeenCalled();
      expect(result.draft_id).toBe('draft-123');
    });

    it('should return created contract with all fields', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const contractData = {
        exporter_id: 'exp-123',
        buyer_name: 'ABC Coffee Imports',
        buyer_email: 'buyer@abc.com',
        coffee_type: 'Arabica Grade 1',
        quantity: 150,
        unit_price: 4.5,
        currency: 'USD',
        payment_terms: 'Net 30',
        delivery_date: futureDate.toISOString(),
        port_of_discharge: 'Port of Hamburg',
      };

      const mockContract = {
        draft_id: 'draft-123',
        ...contractData,
        status: 'DRAFT',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPool.query.mockResolvedValueOnce({ rows: [mockContract] });

      const result = await contractService.createContract(contractData);

      expect(result).toHaveProperty('draft_id');
      expect(result).toHaveProperty('exporter_id');
      expect(result).toHaveProperty('buyer_name');
      expect(result).toHaveProperty('buyer_email');
      expect(result).toHaveProperty('coffee_type');
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('unit_price');
      expect(result).toHaveProperty('currency');
      expect(result).toHaveProperty('payment_terms');
      expect(result).toHaveProperty('delivery_date');
      expect(result).toHaveProperty('port_of_discharge');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('created_at');
    });
  });

  describe('Form validation and submission', () => {
    it('should validate all fields before submission', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const formData = {
        quantity: 150,
        unit_price: 4.5,
        delivery_date: futureDate.toISOString(),
        payment_terms: 'Net 30',
        currency: 'USD',
        coffee_type: 'Arabica Grade 1',
        port_of_discharge: 'Port of Hamburg',
        buyer_email: 'buyer@abc.com',
      };

      const result = validationService.validateContractTerms(formData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should collect all validation errors', async () => {
      const formData = {
        quantity: 0,
        unit_price: -1,
        delivery_date: '2020-01-01',
        payment_terms: 'Invalid',
        currency: 'INVALID',
        coffee_type: 'Unknown',
        port_of_discharge: 'Invalid',
        buyer_email: 'invalid',
      };

      const result = validationService.validateContractTerms(formData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(5);
    });
  });
});
