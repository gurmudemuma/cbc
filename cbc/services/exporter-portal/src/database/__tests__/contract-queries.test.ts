/**
 * Contract Queries Tests
 */

import { v4 as uuidv4 } from 'uuid';
import {
  queryContractById,
  queryContractsByExporter,
  queryContractsByBuyer,
  contractExists,
  countContractsByStatus,
  getContractStatistics,
} from '../contract-queries';
import { getContractPool } from '../connection';

describe('Contract Queries', () => {
  const testDraftId = uuidv4();
  const testExporterId = uuidv4();
  const testBuyerEmail = 'testbuyer@example.com';
  
  beforeAll(async () => {
    // Create test contracts
    const pool = getContractPool();
    
    // Contract 1: DRAFT
    await pool.query(`
      INSERT INTO contract_drafts (
        draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
        quantity_bags, unit_price, currency, payment_terms,
        delivery_location, delivery_date, status, created_at, last_modified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      testDraftId,
      testExporterId,
      testBuyerEmail,
      'Test Buyer',
      'Arabica',
      100,
      50.00,
      'USD',
      'Letter of Credit',
      'Addis Ababa',
      new Date('2025-12-31'),
      'DRAFT',
      new Date(),
      new Date(),
    ]);
    
    // Contract 2: FINALIZED
    await pool.query(`
      INSERT INTO contract_drafts (
        draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
        quantity_bags, unit_price, currency, payment_terms,
        delivery_location, delivery_date, status, created_at, last_modified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      uuidv4(),
      testExporterId,
      testBuyerEmail,
      'Test Buyer',
      'Robusta',
      200,
      40.00,
      'USD',
      'Letter of Credit',
      'Addis Ababa',
      new Date('2025-12-31'),
      'FINALIZED',
      new Date(),
      new Date(),
    ]);
  });
  
  afterAll(async () => {
    // Clean up test contracts
    const pool = getContractPool();
    await pool.query('DELETE FROM contract_drafts WHERE exporter_id = $1', [testExporterId]);
  });
  
  describe('queryContractById', () => {
    it('should return contract by ID', async () => {
      const contract = await queryContractById(testDraftId);
      
      expect(contract).toBeDefined();
      expect(contract.draft_id).toBe(testDraftId);
      expect(contract.exporter_id).toBe(testExporterId);
    });
    
    it('should return null for non-existent contract', async () => {
      const contract = await queryContractById(uuidv4());
      
      expect(contract).toBeNull();
    });
  });
  
  describe('queryContractsByExporter', () => {
    it('should return all contracts for exporter', async () => {
      const result = await queryContractsByExporter(testExporterId);
      
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.total).toBeGreaterThan(0);
      expect(result.page).toBe(1);
    });
    
    it('should filter contracts by status', async () => {
      const result = await queryContractsByExporter(testExporterId, 'DRAFT');
      
      expect(result.data).toBeDefined();
      expect(result.data.every((c: any) => c.status === 'DRAFT')).toBe(true);
    });
    
    it('should paginate results', async () => {
      const result = await queryContractsByExporter(
        testExporterId,
        undefined,
        { page: 1, limit: 1 }
      );
      
      expect(result.data).toHaveLength(1);
      expect(result.limit).toBe(1);
    });
  });
  
  describe('queryContractsByBuyer', () => {
    it('should return all contracts for buyer', async () => {
      const result = await queryContractsByBuyer(testBuyerEmail);
      
      expect(result.data).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every((c: any) => c.buyer_email === testBuyerEmail)).toBe(true);
    });
    
    it('should filter contracts by status', async () => {
      const result = await queryContractsByBuyer(testBuyerEmail, 'FINALIZED');
      
      expect(result.data).toBeDefined();
      expect(result.data.every((c: any) => c.status === 'FINALIZED')).toBe(true);
    });
  });
  
  describe('contractExists', () => {
    it('should return true for existing contract', async () => {
      const exists = await contractExists(testDraftId);
      
      expect(exists).toBe(true);
    });
    
    it('should return false for non-existent contract', async () => {
      const exists = await contractExists(uuidv4());
      
      expect(exists).toBe(false);
    });
  });
  
  describe('countContractsByStatus', () => {
    it('should return counts by status', async () => {
      const counts = await countContractsByStatus(testExporterId);
      
      expect(counts).toBeDefined();
      expect(counts.DRAFT).toBeGreaterThan(0);
      expect(counts.FINALIZED).toBeGreaterThan(0);
    });
  });
  
  describe('getContractStatistics', () => {
    it('should return contract statistics', async () => {
      const stats = await getContractStatistics(testExporterId);
      
      expect(stats).toBeDefined();
      expect(stats.totalContracts).toBeGreaterThan(0);
      expect(stats.draftContracts).toBeGreaterThan(0);
      expect(stats.finalizedContracts).toBeGreaterThan(0);
      expect(stats.totalValue).toBeGreaterThan(0);
      expect(stats.averageValue).toBeGreaterThan(0);
    });
  });
});
