/**
 * Contract Transaction Tests
 */

import { v4 as uuidv4 } from 'uuid';
import {
  executeContractTransaction,
  executeContractCreationTransaction,
  executeContractUpdateTransaction,
  lockContractForUpdate,
  isContractLocked,
} from '../contract-transaction';
import { getContractPool } from '../connection';

describe('Contract Transaction', () => {
  const testDraftId = uuidv4();
  const testExporterId = uuidv4();
  
  beforeAll(async () => {
    // Create a test contract
    const pool = getContractPool();
    await pool.query(`
      INSERT INTO contract_drafts (
        draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
        quantity_bags, unit_price, currency, payment_terms,
        delivery_location, delivery_date, status, created_at, last_modified_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      testDraftId,
      testExporterId,
      'buyer@example.com',
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
  });
  
  afterAll(async () => {
    // Clean up test contract
    const pool = getContractPool();
    await pool.query('DELETE FROM contract_drafts WHERE draft_id = $1', [testDraftId]);
  });
  
  describe('executeContractTransaction', () => {
    it('should execute transaction and commit on success', async () => {
      const result = await executeContractTransaction(async (client) => {
        const queryResult = await client.query(
          'SELECT * FROM contract_drafts WHERE draft_id = $1',
          [testDraftId]
        );
        return queryResult.rows[0];
      });
      
      expect(result).toBeDefined();
      expect(result.draft_id).toBe(testDraftId);
    });
    
    it('should rollback transaction on error', async () => {
      const newDraftId = uuidv4();
      
      await expect(
        executeContractTransaction(async (client) => {
          await client.query(`
            INSERT INTO contract_drafts (
              draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
              quantity_bags, unit_price, currency, payment_terms,
              delivery_location, delivery_date, status, created_at, last_modified_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          `, [
            newDraftId,
            testExporterId,
            'test@example.com',
            'Test',
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
          
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
      
      // Verify rollback
      const pool = getContractPool();
      const result = await pool.query(
        'SELECT * FROM contract_drafts WHERE draft_id = $1',
        [newDraftId]
      );
      expect(result.rows).toHaveLength(0);
    });
  });
  
  describe('executeContractCreationTransaction', () => {
    it('should create contract with history entry', async () => {
      const newDraftId = uuidv4();
      
      const contract = await executeContractCreationTransaction(async (client) => {
        const result = await client.query(`
          INSERT INTO contract_drafts (
            draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
            quantity_bags, unit_price, currency, payment_terms,
            delivery_location, delivery_date, status, created_at, last_modified_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *
        `, [
          newDraftId,
          testExporterId,
          'new@example.com',
          'New Buyer',
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
        
        await client.query(`
          INSERT INTO contract_history (
            history_id, draft_id, version_number, status, actor_type, actor_id, action, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          uuidv4(),
          newDraftId,
          1,
          'DRAFT',
          'EXPORTER',
          testExporterId,
          'CREATED',
          new Date(),
        ]);
        
        return result.rows[0];
      });
      
      expect(contract).toBeDefined();
      expect(contract.draft_id).toBe(newDraftId);
      
      // Verify history entry
      const pool = getContractPool();
      const historyResult = await pool.query(
        'SELECT * FROM contract_history WHERE draft_id = $1',
        [newDraftId]
      );
      expect(historyResult.rows).toHaveLength(1);
      
      // Clean up
      await pool.query('DELETE FROM contract_history WHERE draft_id = $1', [newDraftId]);
      await pool.query('DELETE FROM contract_drafts WHERE draft_id = $1', [newDraftId]);
    });
  });
  
  describe('executeContractUpdateTransaction', () => {
    it('should update contract and create history entry', async () => {
      const updateDraftId = uuidv4();
      const pool = getContractPool();
      
      // Create test contract
      await pool.query(`
        INSERT INTO contract_drafts (
          draft_id, exporter_id, buyer_email, buyer_name, coffee_type,
          quantity_bags, unit_price, currency, payment_terms,
          delivery_location, delivery_date, status, created_at, last_modified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        updateDraftId,
        testExporterId,
        'update@example.com',
        'Update Test',
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
      
      const updatedContract = await executeContractUpdateTransaction(async (client) => {
        const result = await client.query(`
          UPDATE contract_drafts
          SET quantity_bags = $1, last_modified_at = $2
          WHERE draft_id = $3
          RETURNING *
        `, [200, new Date(), updateDraftId]);
        
        await client.query(`
          INSERT INTO contract_history (
            history_id, draft_id, version_number, status, actor_type, actor_id, action, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          uuidv4(),
          updateDraftId,
          2,
          'DRAFT',
          'EXPORTER',
          testExporterId,
          'MODIFIED',
          new Date(),
        ]);
        
        return result.rows[0];
      });
      
      expect(updatedContract).toBeDefined();
      expect(updatedContract.quantity_bags).toBe(200);
      
      // Clean up
      await pool.query('DELETE FROM contract_history WHERE draft_id = $1', [updateDraftId]);
      await pool.query('DELETE FROM contract_drafts WHERE draft_id = $1', [updateDraftId]);
    });
  });
  
  describe('lockContractForUpdate', () => {
    it('should lock contract for update', async () => {
      await executeContractTransaction(async (client) => {
        const contract = await lockContractForUpdate(client, testDraftId);
        
        expect(contract).toBeDefined();
        expect(contract.draft_id).toBe(testDraftId);
      });
    });
    
    it('should return null for non-existent contract', async () => {
      await executeContractTransaction(async (client) => {
        const contract = await lockContractForUpdate(client, uuidv4());
        
        expect(contract).toBeNull();
      });
    });
  });
  
  describe('isContractLocked', () => {
    it('should detect unlocked contract', async () => {
      await executeContractTransaction(async (client) => {
        const isLocked = await isContractLocked(client, testDraftId);
        
        expect(isLocked).toBe(false);
      });
    });
  });
});
