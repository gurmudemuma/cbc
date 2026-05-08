/**
 * Database Connection Tests
 */

import {
  getDatabaseConfig,
  getContractPool,
  testDatabaseConnection,
  checkDatabaseHealth,
  verifyContractTables,
  getDatabaseVersion,
} from '../connection';

describe('Database Connection', () => {
  describe('getDatabaseConfig', () => {
    it('should return database configuration from environment', () => {
      const config = getDatabaseConfig();
      
      expect(config).toHaveProperty('host');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('database');
      expect(config).toHaveProperty('user');
      expect(config).toHaveProperty('password');
      expect(config).toHaveProperty('ssl');
      expect(config).toHaveProperty('poolMin');
      expect(config).toHaveProperty('poolMax');
    });
    
    it('should use default values when environment variables are not set', () => {
      const originalEnv = process.env;
      process.env = {};
      
      const config = getDatabaseConfig();
      
      expect(config.host).toBe('localhost');
      expect(config.port).toBe(5432);
      expect(config.database).toBe('coffee_export_db');
      expect(config.user).toBe('postgres');
      
      process.env = originalEnv;
    });
  });
  
  describe('getContractPool', () => {
    it('should return a database pool', () => {
      const pool = getContractPool();
      
      expect(pool).toBeDefined();
      expect(pool.query).toBeDefined();
      expect(pool.connect).toBeDefined();
    });
  });
  
  describe('testDatabaseConnection', () => {
    it('should successfully connect to database', async () => {
      const isConnected = await testDatabaseConnection();
      
      expect(isConnected).toBe(true);
    });
  });
  
  describe('checkDatabaseHealth', () => {
    it('should return health information', async () => {
      const health = await checkDatabaseHealth();
      
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('responseTime');
      expect(health).toHaveProperty('poolStats');
      expect(health.healthy).toBe(true);
      expect(health.responseTime).toBeGreaterThan(0);
    });
  });
  
  describe('verifyContractTables', () => {
    it('should verify all contract tables exist', async () => {
      const result = await verifyContractTables();
      
      expect(result).toHaveProperty('allTablesExist');
      expect(result).toHaveProperty('existingTables');
      expect(result).toHaveProperty('missingTables');
      
      // After schema initialization, all tables should exist
      expect(result.allTablesExist).toBe(true);
      expect(result.existingTables).toContain('contract_drafts');
      expect(result.existingTables).toContain('contract_history');
      expect(result.existingTables).toContain('contract_notifications');
      expect(result.existingTables).toContain('contract_permissions');
      expect(result.missingTables).toHaveLength(0);
    });
  });
  
  describe('getDatabaseVersion', () => {
    it('should return database version information', async () => {
      const version = await getDatabaseVersion();
      
      expect(version).toHaveProperty('version');
      expect(version).toHaveProperty('majorVersion');
      expect(version.version).toContain('PostgreSQL');
      expect(version.majorVersion).toBeGreaterThan(0);
    });
  });
});
