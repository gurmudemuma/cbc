/**
 * Database Utility Functions
 * Common query helpers and database operations
 */

import { Pool } from 'pg';
import type { PoolClient } from 'pg';
import { createLogger } from '../logger';

const logger = createLogger('DatabaseUtils');

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Query builder for common operations
 */
export class QueryBuilder {
  private table: string;
  private selectColumns: string[] = ['*'];
  private whereConditions: string[] = [];
  private whereValues: any[] = [];
  private orderByColumns: string[] = [];
  private limitValue?: number;
  private offsetValue?: number;
  private joinClauses: string[] = [];

  constructor(table: string) {
    this.table = table;
  }

  /**
   * Select specific columns
   */
  select(...columns: string[]): this {
    this.selectColumns = columns;
    return this;
  }

  /**
   * Add a WHERE condition
   */
  where(condition: string, ...values: any[]): this {
    this.whereConditions.push(condition);
    this.whereValues.push(...values);
    return this;
  }

  /**
   * Add a JOIN clause
   */
  join(joinClause: string): this {
    this.joinClauses.push(joinClause);
    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderByColumns.push(`${column} ${direction}`);
    return this;
  }

  /**
   * Set LIMIT
   */
  limit(limit: number): this {
    this.limitValue = limit;
    return this;
  }

  /**
   * Set OFFSET
   */
  offset(offset: number): this {
    this.offsetValue = offset;
    return this;
  }

  /**
   * Build the SELECT query
   */
  buildSelect(): { text: string; values: any[] } {
    let query = `SELECT ${this.selectColumns.join(', ')} FROM ${this.table}`;

    // Add JOINs
    if (this.joinClauses.length > 0) {
      query += ' ' + this.joinClauses.join(' ');
    }

    // Add WHERE conditions
    if (this.whereConditions.length > 0) {
      query += ' WHERE ' + this.whereConditions.join(' AND ');
    }

    // Add ORDER BY
    if (this.orderByColumns.length > 0) {
      query += ' ORDER BY ' + this.orderByColumns.join(', ');
    }

    // Add LIMIT
    if (this.limitValue !== undefined) {
      query += ` LIMIT ${this.limitValue}`;
    }

    // Add OFFSET
    if (this.offsetValue !== undefined) {
      query += ` OFFSET ${this.offsetValue}`;
    }

    return { text: query, values: this.whereValues };
  }

  /**
   * Build the COUNT query
   */
  buildCount(): { text: string; values: any[] } {
    let query = `SELECT COUNT(*) as count FROM ${this.table}`;

    // Add JOINs
    if (this.joinClauses.length > 0) {
      query += ' ' + this.joinClauses.join(' ');
    }

    // Add WHERE conditions
    if (this.whereConditions.length > 0) {
      query += ' WHERE ' + this.whereConditions.join(' AND ');
    }

    return { text: query, values: this.whereValues };
  }

  /**
   * Execute the SELECT query
   */
  async execute(client: Pool | PoolClient): Promise<any[]> {
    const { text, values } = this.buildSelect();
    const result = await client.query(text, values);
    return result.rows;
  }

  /**
   * Execute the COUNT query
   */
  async count(client: Pool | PoolClient): Promise<number> {
    const { text, values } = this.buildCount();
    const result = await client.query(text, values);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Execute with pagination
   */
  async paginate(
    client: Pool | PoolClient,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<any>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = options.offset || (page - 1) * limit;

    // Get total count
    const total = await this.count(client);

    // Get paginated data
    this.limit(limit).offset(offset);
    const data = await this.execute(client);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}

/**
 * Build a paginated query
 * 
 * @param table - Table name
 * @param options - Pagination options
 * @returns Query builder instance
 */
export function buildPaginatedQuery(
  table: string,
  options: PaginationOptions = {}
): QueryBuilder {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const offset = options.offset || (page - 1) * limit;

  return new QueryBuilder(table).limit(limit).offset(offset);
}

/**
 * Insert multiple rows
 * 
 * @param client - Database client
 * @param table - Table name
 * @param rows - Array of row objects
 * @returns Array of inserted rows
 */
export async function insertMany(
  client: Pool | PoolClient,
  table: string,
  rows: any[]
): Promise<any[]> {
  if (rows.length === 0) {
    return [];
  }

  const columns = Object.keys(rows[0]);
  const placeholders = rows
    .map((_, i) => {
      const start = i * columns.length + 1;
      const end = start + columns.length;
      return `(${Array.from({ length: columns.length }, (_, j) => `$${start + j}`).join(', ')})`;
    })
    .join(', ');

  const values = rows.flatMap((row) => columns.map((col) => row[col]));

  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders}
    RETURNING *
  `;

  const result = await client.query(query, values);
  return result.rows;
}

/**
 * Update multiple rows
 * 
 * @param client - Database client
 * @param table - Table name
 * @param updates - Object with column: value pairs
 * @param whereCondition - WHERE clause condition
 * @param whereValues - WHERE clause values
 * @returns Number of updated rows
 */
export async function updateMany(
  client: Pool | PoolClient,
  table: string,
  updates: Record<string, any>,
  whereCondition: string,
  whereValues: any[] = []
): Promise<number> {
  const columns = Object.keys(updates);
  const setClause = columns
    .map((col, i) => `${col} = $${i + 1}`)
    .join(', ');

  const values = [...Object.values(updates), ...whereValues];

  const query = `
    UPDATE ${table}
    SET ${setClause}
    WHERE ${whereCondition}
  `;

  const result = await client.query(query, values);
  return result.rowCount || 0;
}

/**
 * Delete multiple rows
 * 
 * @param client - Database client
 * @param table - Table name
 * @param whereCondition - WHERE clause condition
 * @param whereValues - WHERE clause values
 * @returns Number of deleted rows
 */
export async function deleteMany(
  client: Pool | PoolClient,
  table: string,
  whereCondition: string,
  whereValues: any[] = []
): Promise<number> {
  const query = `DELETE FROM ${table} WHERE ${whereCondition}`;
  const result = await client.query(query, whereValues);
  return result.rowCount || 0;
}

/**
 * Upsert (insert or update) a row
 * 
 * @param client - Database client
 * @param table - Table name
 * @param row - Row object
 * @param conflictColumns - Columns that define the conflict
 * @param updateColumns - Columns to update on conflict
 * @returns Upserted row
 */
export async function upsert(
  client: Pool | PoolClient,
  table: string,
  row: any,
  conflictColumns: string[],
  updateColumns: string[]
): Promise<any> {
  const columns = Object.keys(row);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const updateSet = updateColumns
    .map((col, i) => `${col} = $${columns.length + i + 1}`)
    .join(', ');

  const values = [
    ...Object.values(row),
    ...updateColumns.map((col) => row[col]),
  ];

  const query = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${conflictColumns.join(', ')})
    DO UPDATE SET ${updateSet}
    RETURNING *
  `;

  const result = await client.query(query, values);
  return result.rows[0];
}

/**
 * Get a row by ID
 * 
 * @param client - Database client
 * @param table - Table name
 * @param id - Row ID
 * @param idColumn - ID column name (default: 'id')
 * @returns Row or null
 */
export async function getById(
  client: Pool | PoolClient,
  table: string,
  id: any,
  idColumn: string = 'id'
): Promise<any | null> {
  const query = `SELECT * FROM ${table} WHERE ${idColumn} = $1`;
  const result = await client.query(query, [id]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Delete a row by ID
 * 
 * @param client - Database client
 * @param table - Table name
 * @param id - Row ID
 * @param idColumn - ID column name (default: 'id')
 * @returns true if deleted, false if not found
 */
export async function deleteById(
  client: Pool | PoolClient,
  table: string,
  id: any,
  idColumn: string = 'id'
): Promise<boolean> {
  const query = `DELETE FROM ${table} WHERE ${idColumn} = $1`;
  const result = await client.query(query, [id]);
  return (result.rowCount || 0) > 0;
}

/**
 * Check if a row exists by ID
 * 
 * @param client - Database client
 * @param table - Table name
 * @param id - Row ID
 * @param idColumn - ID column name (default: 'id')
 * @returns true if exists, false otherwise
 */
export async function existsById(
  client: Pool | PoolClient,
  table: string,
  id: any,
  idColumn: string = 'id'
): Promise<boolean> {
  const query = `SELECT 1 FROM ${table} WHERE ${idColumn} = $1 LIMIT 1`;
  const result = await client.query(query, [id]);
  return result.rows.length > 0;
}

/**
 * Get all rows from a table
 * 
 * @param client - Database client
 * @param table - Table name
 * @param orderBy - ORDER BY clause (optional)
 * @returns Array of rows
 */
export async function getAll(
  client: Pool | PoolClient,
  table: string,
  orderBy?: string
): Promise<any[]> {
  let query = `SELECT * FROM ${table}`;
  if (orderBy) {
    query += ` ORDER BY ${orderBy}`;
  }
  const result = await client.query(query);
  return result.rows;
}

/**
 * Count rows in a table
 * 
 * @param client - Database client
 * @param table - Table name
 * @param whereCondition - WHERE clause (optional)
 * @param whereValues - WHERE clause values
 * @returns Number of rows
 */
export async function count(
  client: Pool | PoolClient,
  table: string,
  whereCondition?: string,
  whereValues: any[] = []
): Promise<number> {
  let query = `SELECT COUNT(*) as count FROM ${table}`;
  if (whereCondition) {
    query += ` WHERE ${whereCondition}`;
  }
  const result = await client.query(query, whereValues);
  return parseInt(result.rows[0].count, 10);
}

/**
 * Truncate a table (delete all rows)
 * WARNING: This is destructive and cannot be undone
 * 
 * @param client - Database client
 * @param table - Table name
 * @param cascade - Whether to cascade delete (default: false)
 */
export async function truncate(
  client: Pool | PoolClient,
  table: string,
  cascade: boolean = false
): Promise<void> {
  const cascadeClause = cascade ? ' CASCADE' : '';
  const query = `TRUNCATE TABLE ${table}${cascadeClause}`;
  await client.query(query);
  logger.warn(`Table ${table} truncated`);
}

/**
 * Get table schema information
 * 
 * @param client - Database client
 * @param table - Table name
 * @returns Array of column information
 */
export async function getTableSchema(
  client: Pool | PoolClient,
  table: string
): Promise<any[]> {
  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `;
  const result = await client.query(query, [table]);
  return result.rows;
}

/**
 * Get table indexes
 * 
 * @param client - Database client
 * @param table - Table name
 * @returns Array of index information
 */
export async function getTableIndexes(
  client: Pool | PoolClient,
  table: string
): Promise<any[]> {
  const query = `
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes
    WHERE tablename = $1
  `;
  const result = await client.query(query, [table]);
  return result.rows;
}

/**
 * Get table constraints
 * 
 * @param client - Database client
 * @param table - Table name
 * @returns Array of constraint information
 */
export async function getTableConstraints(
  client: Pool | PoolClient,
  table: string
): Promise<any[]> {
  const query = `
    SELECT 
      constraint_name,
      constraint_type
    FROM information_schema.table_constraints
    WHERE table_name = $1
  `;
  const result = await client.query(query, [table]);
  return result.rows;
}

/**
 * Analyze table for query optimization
 * 
 * @param client - Database client
 * @param table - Table name
 */
export async function analyzeTable(
  client: Pool | PoolClient,
  table: string
): Promise<void> {
  const query = `ANALYZE ${table}`;
  await client.query(query);
  logger.info(`Table ${table} analyzed`);
}

/**
 * Vacuum table for maintenance
 * 
 * @param client - Database client
 * @param table - Table name
 * @param full - Whether to do a full vacuum (default: false)
 */
export async function vacuumTable(
  client: Pool | PoolClient,
  table: string,
  full: boolean = false
): Promise<void> {
  const fullClause = full ? ' FULL' : '';
  const query = `VACUUM${fullClause} ${table}`;
  await client.query(query);
  logger.info(`Table ${table} vacuumed`);
}
