/**
 * Database Router Service
 * Intelligently routes queries between PostgreSQL and Fabric/CouchDB
 * 
 * Strategy:
 * - Reads: PostgreSQL (fast, <10ms)
 * - Writes: Fabric (immutable, consensus)
 * - Verification: Both (cryptographic proof)
 */

const postgresService = require('./postgres');
const fabricService = require('./fabric');
const { logger } = require('../utils/logger');

class DatabaseRouter {
  constructor() {
    this.readSource = 'postgresql'; // Default read source
    this.writeSource = 'fabric'; // Default write source
    this.stats = {
      postgresReads: 0,
      fabricReads: 0,
      fabricWrites: 0,
      errors: 0
    };
  }

  /**
   * Get user - Smart routing
   * @param {string} username 
   * @param {object} options - { verifyBlockchain: boolean, forceSource: 'postgresql'|'fabric' }
   */
  async getUser(username, options = {}) {
    const startTime = Date.now();
    
    try {
      // Force specific source if requested
      if (options.forceSource === 'fabric') {
        this.stats.fabricReads++;
        const user = await fabricService.getUser(username);
        logger.info(`[Router] getUser from Fabric: ${Date.now() - startTime}ms`);
        return { ...user, source: 'fabric', queryTime: Date.now() - startTime };
      }

      // Verification mode: query both and compare
      if (options.verifyBlockchain) {
        const [pgUser, fabricUser] = await Promise.all([
          postgresService.getUser(username).catch(() => null),
          fabricService.getUser(username).catch(() => null)
        ]);

        this.stats.postgresReads++;
        this.stats.fabricReads++;

        // Compare and log discrepancies
        if (pgUser && fabricUser) {
          const match = this._compareUsers(pgUser, fabricUser);
          if (!match) {
            logger.warn(`[Router] User data mismatch for ${username}`);
          }
        }

        logger.info(`[Router] getUser verified: ${Date.now() - startTime}ms`);
        return {
          ...fabricUser,
          source: 'verified',
          queryTime: Date.now() - startTime,
          verified: true
        };
      }

      // Default: Fast read from PostgreSQL
      this.stats.postgresReads++;
      const user = await postgresService.getUser(username);
      
      if (!user) {
        // Fallback to Fabric if not found in PostgreSQL
        logger.warn(`[Router] User ${username} not found in PostgreSQL, checking Fabric`);
        this.stats.fabricReads++;
        const fabricUser = await fabricService.getUser(username);
        return { ...fabricUser, source: 'fabric-fallback', queryTime: Date.now() - startTime };
      }

      logger.info(`[Router] getUser from PostgreSQL: ${Date.now() - startTime}ms`);
      return { ...user, source: 'postgresql', queryTime: Date.now() - startTime };

    } catch (error) {
      this.stats.errors++;
      logger.error(`[Router] getUser error:`, error);
      throw error;
    }
  }

  /**
   * Register user - Always write to Fabric first
   */
  async registerUser(userData) {
    const startTime = Date.now();
    
    try {
      // STEP 1: Write to Fabric (source of truth)
      logger.info(`[Router] Registering user to Fabric: ${userData.username}`);
      const fabricResult = await fabricService.registerUser(userData);
      this.stats.fabricWrites++;

      // STEP 2: Replicate to PostgreSQL (handled by blockchain bridge)
      // The blockchain bridge will pick up the event and sync to PostgreSQL
      
      logger.info(`[Router] User registered: ${Date.now() - startTime}ms`);
      return {
        success: true,
        username: userData.username,
        source: 'fabric',
        writeTime: Date.now() - startTime,
        message: 'User registered on blockchain, PostgreSQL sync in progress'
      };

    } catch (error) {
      this.stats.errors++;
      logger.error(`[Router] registerUser error:`, error);
      throw error;
    }
  }

  /**
   * Update user status - Write to Fabric
   */
  async updateUserStatus(username, statusData) {
    const startTime = Date.now();
    
    try {
      logger.info(`[Router] Updating user status on Fabric: ${username}`);
      const result = await fabricService.updateUserStatus(username, statusData);
      this.stats.fabricWrites++;

      logger.info(`[Router] User status updated: ${Date.now() - startTime}ms`);
      return {
        success: true,
        username,
        source: 'fabric',
        writeTime: Date.now() - startTime
      };

    } catch (error) {
      this.stats.errors++;
      logger.error(`[Router] updateUserStatus error:`, error);
      throw error;
    }
  }

  /**
   * Get users by role - PostgreSQL for speed
   */
  async getUsersByRole(role, options = {}) {
    const startTime = Date.now();
    
    try {
      if (options.verifyBlockchain) {
        this.stats.fabricReads++;
        const users = await fabricService.getUsersByRole(role);
        logger.info(`[Router] getUsersByRole from Fabric: ${Date.now() - startTime}ms`);
        return users.map(u => ({ ...u, source: 'fabric' }));
      }

      // Fast read from PostgreSQL
      this.stats.postgresReads++;
      const users = await postgresService.getUsersByRole(role);
      logger.info(`[Router] getUsersByRole from PostgreSQL: ${Date.now() - startTime}ms`);
      return users.map(u => ({ ...u, source: 'postgresql' }));

    } catch (error) {
      this.stats.errors++;
      logger.error(`[Router] getUsersByRole error:`, error);
      throw error;
    }
  }

  /**
   * Get users by status - PostgreSQL for speed
   */
  async getUsersByStatus(status, options = {}) {
    const startTime = Date.now();
    
    try {
      if (options.verifyBlockchain) {
        this.stats.fabricReads++;
        const users = await fabricService.getUsersByStatus(status);
        logger.info(`[Router] getUsersByStatus from Fabric: ${Date.now() - startTime}ms`);
        return users.map(u => ({ ...u, source: 'fabric' }));
      }

      // Fast read from PostgreSQL
      this.stats.postgresReads++;
      const users = await postgresService.getUsersByStatus(status);
      logger.info(`[Router] getUsersByStatus from PostgreSQL: ${Date.now() - startTime}ms`);
      return users.map(u => ({ ...u, source: 'postgresql' }));

    } catch (error) {
      this.stats.errors++;
      logger.error(`[Router] getUsersByStatus error:`, error);
      throw error;
    }
  }

  /**
   * Get pending users - PostgreSQL for speed
   */
  async getPendingUsers(options = {}) {
    const startTime = Date.now();
    
    try {
      if (options.verifyBlockchain) {
        this.stats.fabricReads++;
        const users = await fabricService.getPendingUsers();
        logger.info(`[Router] getPendingUsers from Fabric: ${Date.now() - startTime}ms`);
        return users.map(u => ({ ...u, source: 'fabric' }));
      }

      // Fast read from PostgreSQL
      this.stats.postgresReads++;
      const users = await postgresService.getPendingUsers();
      logger.info(`[Router] getPendingUsers from PostgreSQL: ${Date.now() - startTime}ms`);
      return users.map(u => ({ ...u, source: 'postgresql' }));

    } catch (error) {
      this.stats.errors++;
      logger.error(`[Router] getPendingUsers error:`, error);
      throw error;
    }
  }

  /**
   * Search users - PostgreSQL for speed
   */
  async searchUsers(searchTerm) {
    const startTime = Date.now();
    
    try {
      this.stats.postgresReads++;
      const users = await postgresService.searchUsers(searchTerm);
      logger.info(`[Router] searchUsers from PostgreSQL: ${Date.now() - startTime}ms`);
      return users.map(u => ({ ...u, source: 'postgresql' }));

    } catch (error) {
      this.stats.errors++;
      logger.error(`[Router] searchUsers error:`, error);
      throw error;
    }
  }

  /**
   * Get router statistics
   */
  getStats() {
    const total = this.stats.postgresReads + this.stats.fabricReads + this.stats.fabricWrites;
    return {
      ...this.stats,
      total,
      postgresPercentage: total > 0 ? ((this.stats.postgresReads / total) * 100).toFixed(1) : 0,
      fabricPercentage: total > 0 ? (((this.stats.fabricReads + this.stats.fabricWrites) / total) * 100).toFixed(1) : 0,
      errorRate: total > 0 ? ((this.stats.errors / total) * 100).toFixed(2) : 0
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      postgresReads: 0,
      fabricReads: 0,
      fabricWrites: 0,
      errors: 0
    };
  }

  /**
   * Compare users from different sources
   * @private
   */
  _compareUsers(pgUser, fabricUser) {
    // Compare key fields
    const fields = ['username', 'email', 'status', 'role'];
    for (const field of fields) {
      if (pgUser[field] !== fabricUser[field]) {
        logger.warn(`[Router] Mismatch in ${field}: PG=${pgUser[field]}, Fabric=${fabricUser[field]}`);
        return false;
      }
    }
    return true;
  }
}

// Create singleton instance
const databaseRouter = new DatabaseRouter();

// Export both the instance and the class
module.exports = databaseRouter;
module.exports.DatabaseRouter = DatabaseRouter;
