/**
 * Hybrid Data Service
 * Implements dual-write pattern for PostgreSQL + Blockchain
 * Ensures data consistency across both systems
 */

const postgresService = require('./postgres');
const fabricService = require('./index'); // Use service loader for consistent Fabric implementation
const { logger } = require('../utils/logger');

class HybridDataService {
  constructor() {
    this.writeMode = process.env.HYBRID_WRITE_MODE || 'dual'; // 'dual', 'postgres-only', 'blockchain-only'
    this.readSource = process.env.HYBRID_READ_SOURCE || 'postgres'; // 'postgres', 'blockchain', 'both'
    this.syncEnabled = process.env.HYBRID_SYNC_ENABLED !== 'false';
    
    this.stats = {
      dualWrites: 0,
      postgresWrites: 0,
      blockchainWrites: 0,
      postgresReads: 0,
      blockchainReads: 0,
      syncOperations: 0,
      errors: 0
    };
    
    console.log('[Hybrid] Initialized with mode:', {
      writeMode: this.writeMode,
      readSource: this.readSource,
      syncEnabled: this.syncEnabled
    });
  }

  /**
   * Dual-write: Write to both PostgreSQL and Blockchain
   */
  async writeUser(userData) {
    const results = { postgres: null, blockchain: null, errors: [] };

    try {
      // Write to PostgreSQL first (primary store)
      if (this.writeMode === 'dual' || this.writeMode === 'postgres-only') {
        try {
          console.log('[Hybrid] Attempting PostgreSQL write for user:', userData.username);
          results.postgres = await this._writeToPostgres('users', userData);
          console.log('[Hybrid] PostgreSQL write succeeded:', results.postgres ? 'YES' : 'NO');
          this.stats.postgresWrites++;
        } catch (error) {
          console.error('[Hybrid] PostgreSQL write error:', error.message);
          console.error('[Hybrid] Error stack:', error.stack);
          results.errors.push({ source: 'postgres', error: error.message });
          this.stats.errors++;
          if (this.writeMode === 'postgres-only') throw error;
        }
      }

      // Write to Blockchain (audit trail)
      if (this.writeMode === 'dual' || this.writeMode === 'blockchain-only') {
        try {
          results.blockchain = await fabricService.registerUser(userData);
          this.stats.blockchainWrites++;
        } catch (error) {
          results.errors.push({ source: 'blockchain', error: error.message });
          this.stats.errors++;
          // Don't throw - blockchain is secondary
          console.warn('[Hybrid] Blockchain write failed, data saved to PostgreSQL:', error.message);
        }
      }

      if (this.writeMode === 'dual') this.stats.dualWrites++;

      return results;
    } catch (error) {
      console.error('[Hybrid] Write operation failed:', error);
      throw error;
    }
  }

  /**
   * Smart read: Read from PostgreSQL for speed, optionally verify with blockchain
   */
  async readUser(username) {
    try {
      let data = null;

      // Read from PostgreSQL (fast)
      if (this.readSource === 'postgres' || this.readSource === 'both') {
        data = await this._readFromPostgres('users', { username });
        this.stats.postgresReads++;
      }

      // Optionally verify with blockchain
      if (this.readSource === 'blockchain' || this.readSource === 'both') {
        try {
          const blockchainData = await fabricService.getUser(username);
          this.stats.blockchainReads++;
          
          if (this.readSource === 'both' && data) {
            // Compare and log discrepancies
            this._compareData(data, blockchainData, 'user', username);
          } else if (this.readSource === 'blockchain') {
            data = blockchainData;
          }
        } catch (error) {
          console.warn('[Hybrid] Blockchain read failed, using PostgreSQL data:', error.message);
        }
      }

      return data;
    } catch (error) {
      console.error('[Hybrid] Read operation failed:', error);
      throw error;
    }
  }

  /**
   * Write contract to both systems
   */
  async writeContract(contractData) {
    const results = { postgres: null, blockchain: null, errors: [] };

    try {
      // Write to PostgreSQL
      if (this.writeMode === 'dual' || this.writeMode === 'postgres-only') {
        try {
          results.postgres = await this._writeToPostgres('contract_drafts', contractData);
          this.stats.postgresWrites++;
        } catch (error) {
          results.errors.push({ source: 'postgres', error: error.message });
          this.stats.errors++;
          if (this.writeMode === 'postgres-only') throw error;
        }
      }

      // Write to Blockchain
      if (this.writeMode === 'dual' || this.writeMode === 'blockchain-only') {
        try {
          results.blockchain = await fabricService.submitTransaction(
            'system',
            'ecta',
            'CreateContract',
            JSON.stringify(contractData)
          );
          this.stats.blockchainWrites++;
        } catch (error) {
          results.errors.push({ source: 'blockchain', error: error.message });
          this.stats.errors++;
          console.warn('[Hybrid] Blockchain write failed for contract:', error.message);
        }
      }

      if (this.writeMode === 'dual') this.stats.dualWrites++;

      return results;
    } catch (error) {
      console.error('[Hybrid] Contract write failed:', error);
      throw error;
    }
  }

  /**
   * Background sync: Sync missing records from PostgreSQL to Blockchain
   */
  async syncMissingRecords(entityType = 'users') {
    if (!this.syncEnabled) {
      console.log('[Hybrid] Sync disabled');
      return { synced: 0, skipped: 0, failed: 0 };
    }

    console.log(`[Hybrid] Starting background sync for ${entityType}...`);
    const results = { synced: 0, skipped: 0, failed: 0 };

    try {
      // Get all records from PostgreSQL
      const pgRecords = await this._getAllFromPostgres(entityType);
      
      for (const record of pgRecords) {
        try {
          // Check if exists on blockchain
          const exists = await this._existsOnBlockchain(entityType, record);
          
          if (!exists) {
            // Sync to blockchain
            await this._syncToBlockchain(entityType, record);
            results.synced++;
            this.stats.syncOperations++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          console.error(`[Hybrid] Sync failed for ${entityType}:`, record.id || record.username, error.message);
          results.failed++;
        }
      }

      console.log(`[Hybrid] Sync complete:`, results);
      return results;
    } catch (error) {
      console.error('[Hybrid] Background sync failed:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      config: {
        writeMode: this.writeMode,
        readSource: this.readSource,
        syncEnabled: this.syncEnabled
      }
    };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  async _writeToPostgres(table, data) {
    switch (table) {
      case 'users':
        // Determine if user should be active based on status
        const isActive = (data.status === 'approved');
        
        const userResult = await postgresService.query(
          `INSERT INTO users (username, email, phone, password_hash, role, is_active, organization_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
           ON CONFLICT (username) DO UPDATE SET
           email = EXCLUDED.email, phone = EXCLUDED.phone, is_active = EXCLUDED.is_active
           RETURNING *`,
          [data.username, data.email, data.phone || '', data.passwordHash, data.role, isActive, data.role.toUpperCase()]
        );
        return userResult.rows[0];

      case 'contract_drafts':
        const contractResult = await postgresService.query(
          `INSERT INTO contract_drafts (
            draft_id, exporter_id, buyer_id, coffee_type, quantity, 
            unit_price, total_value, currency, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *`,
          [
            data.draftId || data.contractId,
            data.exporterId,
            data.buyerId,
            data.coffeeType,
            data.quantity,
            data.unitPrice,
            data.totalValue,
            data.currency || 'USD',
            data.status || 'DRAFT'
          ]
        );
        return contractResult.rows[0];

      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  async _readFromPostgres(table, criteria) {
    switch (table) {
      case 'users':
        const userResult = await postgresService.query(
          'SELECT * FROM users WHERE username = $1',
          [criteria.username]
        );
        return userResult.rows[0];

      case 'contract_drafts':
        const contractResult = await postgresService.query(
          'SELECT * FROM contract_drafts WHERE draft_id = $1',
          [criteria.draftId]
        );
        return contractResult.rows[0];

      default:
        throw new Error(`Unknown table: ${table}`);
    }
  }

  async _getAllFromPostgres(entityType) {
    switch (entityType) {
      case 'users':
        const usersResult = await postgresService.query(
          'SELECT * FROM users WHERE status = $1 ORDER BY created_at',
          ['active']
        );
        return usersResult.rows;

      case 'contracts':
        const contractsResult = await postgresService.query(
          'SELECT * FROM contract_drafts WHERE status = $1 ORDER BY created_at',
          ['FINALIZED']
        );
        return contractsResult.rows;

      default:
        return [];
    }
  }

  async _existsOnBlockchain(entityType, record) {
    try {
      switch (entityType) {
        case 'users':
          await fabricService.getUser(record.username);
          return true;

        case 'contracts':
          // Check if contract exists on blockchain
          const contract = await fabricService.queryChaincode(
            'ecta',
            'GetContract',
            record.draft_id || record.finalized_contract_id
          );
          return !!contract;

        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  async _syncToBlockchain(entityType, record) {
    switch (entityType) {
      case 'users':
        const userData = {
          username: record.username,
          email: record.email,
          phone: record.phone,
          role: record.role,
          status: record.status,
          passwordHash: record.password_hash,
          registeredAt: record.created_at
        };
        await fabricService.registerUser(JSON.stringify(userData));
        break;

      case 'contracts':
        const contractData = {
          contractId: record.finalized_contract_id || record.draft_id,
          exporterId: record.exporter_id,
          buyerId: record.buyer_id,
          coffeeType: record.coffee_type,
          quantity: record.quantity,
          unitPrice: record.unit_price,
          totalValue: record.total_value,
          currency: record.currency,
          status: record.status
        };
        await fabricService.submitTransaction(
          'system',
          'ecta',
          'CreateContract',
          JSON.stringify(contractData)
        );
        break;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  _compareData(pgData, bcData, type, id) {
    // Simple comparison - log if data differs
    const pgJson = JSON.stringify(pgData);
    const bcJson = JSON.stringify(bcData);
    
    if (pgJson !== bcJson) {
      console.warn(`[Hybrid] Data mismatch detected for ${type}:${id}`);
      console.warn('PostgreSQL:', pgData);
      console.warn('Blockchain:', bcData);
    }
  }
}

// Singleton instance
const hybridDataService = new HybridDataService();

module.exports = hybridDataService;
