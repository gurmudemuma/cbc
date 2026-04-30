/**
 * Common Contract Database Queries
 * Reusable query functions for contract operations
 */

import { Pool } from 'pg';
import { createLogger } from '@shared/logger';

// PoolClient type workaround for pg@8.x
type PoolClient = any;
import { QueryBuilder, PaginationOptions, PaginatedResult } from '@shared/database/utils';
import { getContractPool } from './connection';
import { executeWithRetry } from './contract-transaction';

const logger = createLogger('ContractQueries');

/**
 * Query a single contract by ID
 * 
 * @param draftId - Contract draft ID
 * @param client - Optional database client (for use within transactions)
 * @returns Contract row or null
 */
export async function queryContractById(
  draftId: string,
  client?: PoolClient
): Promise<any | null> {
  const executor = client || getContractPool();
  
  const query = 'SELECT * FROM contract_drafts WHERE draft_id = $1';
  const result = await executor.query(query, [draftId]);
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Query contracts by exporter ID
 * 
 * @param exporterId - Exporter ID
 * @param status - Optional status filter
 * @param pagination - Pagination options
 * @param client - Optional database client
 * @returns Paginated contract results
 */
export async function queryContractsByExporter(
  exporterId: string,
  status?: string,
  pagination?: PaginationOptions,
  client?: PoolClient
): Promise<PaginatedResult<any>> {
  const executor = client || getContractPool();
  const builder = new QueryBuilder('contract_drafts');
  
  builder.where('exporter_id = $1', exporterId);
  
  if (status) {
    builder.where('status = $2', status);
  }
  
  builder.orderBy('created_at', 'DESC');
  
  return builder.paginate(executor, pagination);
}

/**
 * Query contracts by buyer email
 * 
 * @param buyerEmail - Buyer email address
 * @param status - Optional status filter
 * @param pagination - Pagination options
 * @param client - Optional database client
 * @returns Paginated contract results
 */
export async function queryContractsByBuyer(
  buyerEmail: string,
  status?: string,
  pagination?: PaginationOptions,
  client?: PoolClient
): Promise<PaginatedResult<any>> {
  const executor = client || getContractPool();
  const builder = new QueryBuilder('contract_drafts');
  
  builder.where('buyer_email = $1', buyerEmail);
  
  if (status) {
    builder.where('status = $2', status);
  }
  
  builder.orderBy('created_at', 'DESC');
  
  return builder.paginate(executor, pagination);
}

/**
 * Query contract by ECTA reference number
 * 
 * @param referenceNumber - ECTA reference number
 * @param client - Optional database client
 * @returns Contract row or null
 */
export async function queryContractByEctaReference(
  referenceNumber: string,
  client?: PoolClient
): Promise<any | null> {
  const executor = client || getContractPool();
  
  // Use contract_number as the reference (LC Number is the contract reference)
  const query = 'SELECT * FROM contract_drafts WHERE contract_number = $1';
  const result = await executor.query(query, [referenceNumber]);
  
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Query contract history
 * 
 * @param draftId - Contract draft ID
 * @param client - Optional database client
 * @returns Array of history entries
 */
export async function queryContractHistory(
  draftId: string,
  client?: PoolClient
): Promise<any[]> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT * FROM contract_history
    WHERE draft_id = $1
    ORDER BY version_number ASC
  `;
  
  const result = await executor.query(query, [draftId]);
  return result.rows;
}

/**
 * Query latest contract history entry
 * 
 * @param draftId - Contract draft ID
 * @param client - Optional database client
 * @returns Latest history entry or null
 */
export async function queryLatestContractHistory(
  draftId: string,
  client?: PoolClient
): Promise<any | null> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT * FROM contract_history
    WHERE draft_id = $1
    ORDER BY version_number DESC
    LIMIT 1
  `;
  
  const result = await executor.query(query, [draftId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Query contract notifications
 * 
 * @param draftId - Contract draft ID
 * @param client - Optional database client
 * @returns Array of notifications
 */
export async function queryContractNotifications(
  draftId: string,
  client?: PoolClient
): Promise<any[]> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT * FROM contract_notifications
    WHERE draft_id = $1
    ORDER BY sent_at DESC
  `;
  
  const result = await executor.query(query, [draftId]);
  return result.rows;
}

/**
 * Query user notifications
 * 
 * @param userId - User ID
 * @param unreadOnly - Filter for unread notifications only
 * @param pagination - Pagination options
 * @param client - Optional database client
 * @returns Paginated notification results
 */
export async function queryUserNotifications(
  userId: string,
  unreadOnly: boolean = false,
  pagination?: PaginationOptions,
  client?: PoolClient
): Promise<PaginatedResult<any>> {
  const executor = client || getContractPool();
  const builder = new QueryBuilder('contract_notifications');
  
  builder.where('recipient_id = $1', userId);
  
  if (unreadOnly) {
    builder.where('is_read = $2', false);
  }
  
  builder.orderBy('sent_at', 'DESC');
  
  return builder.paginate(executor, pagination);
}

/**
 * Query contract permissions
 * 
 * @param draftId - Contract draft ID
 * @param client - Optional database client
 * @returns Array of permissions
 */
export async function queryContractPermissions(
  draftId: string,
  client?: PoolClient
): Promise<any[]> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT * FROM contract_permissions
    WHERE draft_id = $1
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY granted_at DESC
  `;
  
  const result = await executor.query(query, [draftId]);
  return result.rows;
}

/**
 * Query user permission for a contract
 * 
 * @param draftId - Contract draft ID
 * @param userId - User ID
 * @param client - Optional database client
 * @returns Permission row or null
 */
export async function queryUserContractPermission(
  draftId: string,
  userId: string,
  client?: PoolClient
): Promise<any | null> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT * FROM contract_permissions
    WHERE draft_id = $1
    AND user_id = $2
    AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY granted_at DESC
    LIMIT 1
  `;
  
  const result = await executor.query(query, [draftId, userId]);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Count contracts by status
 * 
 * @param exporterId - Exporter ID
 * @param client - Optional database client
 * @returns Object with counts by status
 */
export async function countContractsByStatus(
  exporterId: string,
  client?: PoolClient
): Promise<Record<string, number>> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT status, COUNT(*) as count
    FROM contract_drafts
    WHERE exporter_id = $1
    GROUP BY status
  `;
  
  const result = await executor.query(query, [exporterId]);
  
  const counts: Record<string, number> = {};
  result.rows.forEach((row) => {
    counts[row.status] = parseInt(row.count, 10);
  });
  
  return counts;
}

/**
 * Check if contract exists
 * 
 * @param draftId - Contract draft ID
 * @param client - Optional database client
 * @returns true if exists, false otherwise
 */
export async function contractExists(
  draftId: string,
  client?: PoolClient
): Promise<boolean> {
  const executor = client || getContractPool();
  
  const query = 'SELECT 1 FROM contract_drafts WHERE draft_id = $1 LIMIT 1';
  const result = await executor.query(query, [draftId]);
  
  return result.rows.length > 0;
}

/**
 * Check if ECTA reference number exists
 * 
 * @param referenceNumber - ECTA reference number
 * @param client - Optional database client
 * @returns true if exists, false otherwise
 */
export async function ectaReferenceExists(
  referenceNumber: string,
  client?: PoolClient
): Promise<boolean> {
  const executor = client || getContractPool();
  
  // Use contract_number as the reference (LC Number is the contract reference)
  const query = 'SELECT 1 FROM contract_drafts WHERE contract_number = $1 LIMIT 1';
  const result = await executor.query(query, [referenceNumber]);
  
  return result.rows.length > 0;
}

/**
 * Get next version number for contract history
 * 
 * @param draftId - Contract draft ID
 * @param client - Database client (required for transaction context)
 * @returns Next version number
 */
export async function getNextVersionNumber(
  draftId: string,
  client: PoolClient
): Promise<number> {
  const query = `
    SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
    FROM contract_history
    WHERE draft_id = $1
  `;
  
  const result = await client.query(query, [draftId]);
  return result.rows[0].next_version;
}

/**
 * Search contracts by multiple criteria
 * 
 * @param criteria - Search criteria
 * @param pagination - Pagination options
 * @param client - Optional database client
 * @returns Paginated contract results
 */
export async function searchContracts(
  criteria: {
    exporterId?: string;
    buyerEmail?: string;
    status?: string;
    coffeeType?: string;
    minQuantity?: number;
    maxQuantity?: number;
    minPrice?: number;
    maxPrice?: number;
    dateFrom?: Date;
    dateTo?: Date;
  },
  pagination?: PaginationOptions,
  client?: PoolClient
): Promise<PaginatedResult<any>> {
  const executor = client || getContractPool();
  const builder = new QueryBuilder('contract_drafts');
  
  const values: any[] = [];
  let paramIndex = 1;
  
  if (criteria.exporterId) {
    builder.where(`exporter_id = ${paramIndex++}`, criteria.exporterId);
  }
  
  if (criteria.buyerEmail) {
    builder.where(`buyer_email = ${paramIndex++}`, criteria.buyerEmail);
  }
  
  if (criteria.status) {
    builder.where(`status = ${paramIndex++}`, criteria.status);
  }
  
  if (criteria.coffeeType) {
    builder.where(`coffee_type = ${paramIndex++}`, criteria.coffeeType);
  }
  
  if (criteria.minQuantity !== undefined) {
    builder.where(`quantity_bags >= ${paramIndex++}`, criteria.minQuantity);
  }
  
  if (criteria.maxQuantity !== undefined) {
    builder.where(`quantity_bags <= ${paramIndex++}`, criteria.maxQuantity);
  }
  
  if (criteria.minPrice !== undefined) {
    builder.where(`unit_price >= ${paramIndex++}`, criteria.minPrice);
  }
  
  if (criteria.maxPrice !== undefined) {
    builder.where(`unit_price <= ${paramIndex++}`, criteria.maxPrice);
  }
  
  if (criteria.dateFrom) {
    builder.where(`created_at >= ${paramIndex++}`, criteria.dateFrom);
  }
  
  if (criteria.dateTo) {
    builder.where(`created_at <= ${paramIndex++}`, criteria.dateTo);
  }
  
  builder.orderBy('created_at', 'DESC');
  
  return builder.paginate(executor, pagination);
}

/**
 * Get contract statistics for an exporter
 * 
 * @param exporterId - Exporter ID
 * @param client - Optional database client
 * @returns Contract statistics
 */
export async function getContractStatistics(
  exporterId: string,
  client?: PoolClient
): Promise<{
  totalContracts: number;
  draftContracts: number;
  negotiationContracts: number;
  finalizedContracts: number;
  rejectedContracts: number;
  totalValue: number;
  averageValue: number;
}> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT
      COUNT(*) as total_contracts,
      COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_contracts,
      COUNT(*) FILTER (WHERE status IN ('COUNTERED', 'ACCEPTED')) as negotiation_contracts,
      COUNT(*) FILTER (WHERE status = 'FINALIZED') as finalized_contracts,
      COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_contracts,
      COALESCE(SUM(unit_price * quantity_bags), 0) as total_value,
      COALESCE(AVG(unit_price * quantity_bags), 0) as average_value
    FROM contract_drafts
    WHERE exporter_id = $1
  `;
  
  const result = await executor.query(query, [exporterId]);
  const row = result.rows[0];
  
  return {
    totalContracts: parseInt(row.total_contracts, 10),
    draftContracts: parseInt(row.draft_contracts, 10),
    negotiationContracts: parseInt(row.negotiation_contracts, 10),
    finalizedContracts: parseInt(row.finalized_contracts, 10),
    rejectedContracts: parseInt(row.rejected_contracts, 10),
    totalValue: parseFloat(row.total_value),
    averageValue: parseFloat(row.average_value),
  };
}

/**
 * Get contracts expiring soon (delivery date approaching)
 * 
 * @param exporterId - Exporter ID
 * @param daysThreshold - Number of days threshold
 * @param client - Optional database client
 * @returns Array of contracts
 */
export async function getContractsExpiringSoon(
  exporterId: string,
  daysThreshold: number = 30,
  client?: PoolClient
): Promise<any[]> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT * FROM contract_drafts
    WHERE exporter_id = $1
    AND status = 'FINALIZED'
    AND delivery_date BETWEEN NOW() AND NOW() + INTERVAL '${daysThreshold} days'
    ORDER BY delivery_date ASC
  `;
  
  const result = await executor.query(query, [exporterId]);
  return result.rows;
}

/**
 * Get recent contract activity
 * 
 * @param exporterId - Exporter ID
 * @param limit - Number of recent activities to retrieve
 * @param client - Optional database client
 * @returns Array of recent history entries
 */
export async function getRecentContractActivity(
  exporterId: string,
  limit: number = 10,
  client?: PoolClient
): Promise<any[]> {
  const executor = client || getContractPool();
  
  const query = `
    SELECT h.*, c.buyer_email, c.coffee_type
    FROM contract_history h
    JOIN contract_drafts c ON h.draft_id = c.draft_id
    WHERE c.exporter_id = $1
    ORDER BY h.created_at DESC
    LIMIT $2
  `;
  
  const result = await executor.query(query, [exporterId, limit]);
  return result.rows;
}
