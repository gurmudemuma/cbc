/**
 * Database Migration Runner
 * Executes SQL migration files in order
 */

import * as fs from 'fs';
import * as path from 'path';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('MigrationRunner');

interface MigrationFile {
  name: string;
  path: string;
  version: number;
  isRollback: boolean;
}

/**
 * Parse migration filename to extract version and type
 */
function parseMigrationFile(filename: string): MigrationFile | null {
  // Match pattern: NNN_name.sql or NNN_rollback_name.sql
  const match = filename.match(/^(\d+)(_rollback)?_(.+)\.sql$/);
  if (!match) return null;

  const [, versionStr, rollbackStr, name] = match;
  return {
    name: filename,
    path: filename,
    version: parseInt(versionStr, 10),
    isRollback: !!rollbackStr,
  };
}

/**
 * Get all migration files from migrations directory
 */
function getMigrationFiles(migrationsDir: string): MigrationFile[] {
  try {
    const files = fs.readdirSync(migrationsDir);
    const migrations = files
      .map(file => parseMigrationFile(file))
      .filter((m): m is MigrationFile => m !== null)
      .sort((a, b) => {
        // Sort by version, then rollbacks last
        if (a.version !== b.version) return a.version - b.version;
        return a.isRollback ? 1 : -1;
      });

    return migrations;
  } catch (error) {
    logger.error('Error reading migration files', { error });
    return [];
  }
}

/**
 * Read migration file content
 */
function readMigrationFile(migrationsDir: string, filename: string): string {
  const filePath = path.join(migrationsDir, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Run all pending migrations
 */
export async function runMigrations(migrationsDir: string): Promise<void> {
  const pool = getPool();
  
  try {
    // Create migrations tracking table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version INTEGER NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Schema migrations table ready');

    // Get all migration files
    const migrations = getMigrationFiles(migrationsDir);
    logger.info(`Found ${migrations.length} migration files`);

    // Get executed migrations
    const result = await pool.query(
      'SELECT version FROM schema_migrations ORDER BY version'
    );
    const executedVersions = new Set(result.rows.map(r => r.version));

    // Run pending migrations (non-rollback only)
    const pendingMigrations = migrations.filter(
      m => !m.isRollback && !executedVersions.has(m.version)
    );

    if (pendingMigrations.length === 0) {
      logger.info('No pending migrations to run');
      return;
    }

    logger.info(`Running ${pendingMigrations.length} pending migrations`);

    for (const migration of pendingMigrations) {
      try {
        const sql = readMigrationFile(migrationsDir, migration.name);
        
        logger.info(`Executing migration: ${migration.name}`);
        await pool.query(sql);

        // Record migration as executed
        await pool.query(
          'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
          [migration.version, migration.name]
        );

        logger.info(`✅ Migration completed: ${migration.name}`);
      } catch (error) {
        logger.error(`❌ Migration failed: ${migration.name}`, { error });
        throw error;
      }
    }

    logger.info('✅ All migrations completed successfully');
  } catch (error) {
    logger.error('Migration runner error', { error });
    throw error;
  }
}

/**
 * Rollback migrations to a specific version
 */
export async function rollbackMigrations(
  migrationsDir: string,
  targetVersion: number
): Promise<void> {
  const pool = getPool();

  try {
    // Get executed migrations
    const result = await pool.query(
      'SELECT version FROM schema_migrations WHERE version > $1 ORDER BY version DESC',
      [targetVersion]
    );

    const versionsToRollback = result.rows.map(r => r.version);

    if (versionsToRollback.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    logger.info(`Rolling back ${versionsToRollback.length} migrations`);

    // Get all migration files
    const migrations = getMigrationFiles(migrationsDir);

    for (const version of versionsToRollback) {
      const rollbackMigration = migrations.find(
        m => m.version === version && m.isRollback
      );

      if (!rollbackMigration) {
        logger.warn(`No rollback migration found for version ${version}`);
        continue;
      }

      try {
        const sql = readMigrationFile(migrationsDir, rollbackMigration.name);

        logger.info(`Executing rollback: ${rollbackMigration.name}`);
        await pool.query(sql);

        // Remove migration record
        await pool.query(
          'DELETE FROM schema_migrations WHERE version = $1',
          [version]
        );

        logger.info(`✅ Rollback completed: ${rollbackMigration.name}`);
      } catch (error) {
        logger.error(`❌ Rollback failed: ${rollbackMigration.name}`, { error });
        throw error;
      }
    }

    logger.info('✅ All rollbacks completed successfully');
  } catch (error) {
    logger.error('Rollback error', { error });
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(migrationsDir: string): Promise<void> {
  const pool = getPool();

  try {
    // Get executed migrations
    const result = await pool.query(
      'SELECT version, name, executed_at FROM schema_migrations ORDER BY version'
    );

    const executedVersions = new Set(result.rows.map(r => r.version));

    // Get all migration files
    const migrations = getMigrationFiles(migrationsDir);

    logger.info('Migration Status:');
    logger.info('================');

    for (const migration of migrations) {
      if (migration.isRollback) continue;

      const isExecuted = executedVersions.has(migration.version);
      const status = isExecuted ? '✅ EXECUTED' : '⏳ PENDING';

      logger.info(`${status} - v${migration.version}: ${migration.name}`);
    }
  } catch (error) {
    logger.error('Error getting migration status', { error });
    throw error;
  }
}
