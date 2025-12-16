import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

/**
 * Comprehensive Audit Logging Service
 * Tracks all system operations for compliance and security
 */

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  username: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  statusCode: number;
  errorMessage?: string;
  ipAddress: string;
  userAgent: string;
  organizationId: string;
  mspId: string;
}

export interface AuditFilter {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  status?: 'SUCCESS' | 'FAILURE';
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Log an audit entry
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = uuidv4();
    const timestamp = new Date();

    const query = `
      INSERT INTO audit_logs (
        id, timestamp, user_id, username, action, resource_type, resource_id,
        changes, status, status_code, error_message, ip_address, user_agent,
        organization_id, msp_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING id;
    `;

    const values = [
      id,
      timestamp,
      entry.userId,
      entry.username,
      entry.action,
      entry.resourceType,
      entry.resourceId,
      JSON.stringify(entry.changes),
      entry.status,
      entry.statusCode,
      entry.errorMessage || null,
      entry.ipAddress,
      entry.userAgent,
      entry.organizationId,
      entry.mspId,
    ];

    try {
      const result = await this.pool.query(query, values);
      return result.rows[0].id;
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      throw error;
    }
  }

  /**
   * Log export creation
   */
  async logExportCreation(
    userId: string,
    username: string,
    exportId: string,
    exportData: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: 'EXPORT_CREATED',
      resourceType: 'EXPORT',
      resourceId: exportId,
      changes: exportData,
      status: 'SUCCESS',
      statusCode: 201,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Log export status change
   */
  async logExportStatusChange(
    userId: string,
    username: string,
    exportId: string,
    oldStatus: string,
    newStatus: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: 'EXPORT_STATUS_CHANGED',
      resourceType: 'EXPORT',
      resourceId: exportId,
      changes: {
        oldStatus,
        newStatus,
        reason,
      },
      status: 'SUCCESS',
      statusCode: 200,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Log export approval
   */
  async logExportApproval(
    userId: string,
    username: string,
    exportId: string,
    approvalType: string,
    notes: string,
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: `EXPORT_${approvalType}_APPROVED`,
      resourceType: 'EXPORT',
      resourceId: exportId,
      changes: {
        approvalType,
        notes,
      },
      status: 'SUCCESS',
      statusCode: 200,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Log export rejection
   */
  async logExportRejection(
    userId: string,
    username: string,
    exportId: string,
    rejectionType: string,
    reason: string,
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: `EXPORT_${rejectionType}_REJECTED`,
      resourceType: 'EXPORT',
      resourceId: exportId,
      changes: {
        rejectionType,
        reason,
      },
      status: 'SUCCESS',
      statusCode: 200,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Log user authentication
   */
  async logAuthentication(
    userId: string,
    username: string,
    success: boolean,
    reason?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: success ? 'USER_LOGIN' : 'USER_LOGIN_FAILED',
      resourceType: 'USER',
      resourceId: userId,
      changes: { reason },
      status: success ? 'SUCCESS' : 'FAILURE',
      statusCode: success ? 200 : 401,
      errorMessage: reason,
      ipAddress: ipAddress || 'UNKNOWN',
      userAgent: userAgent || 'UNKNOWN',
      organizationId: 'SYSTEM',
      mspId: 'SYSTEM',
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    username: string,
    resourceType: string,
    resourceId: string,
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: 'DATA_ACCESSED',
      resourceType,
      resourceId,
      changes: {},
      status: 'SUCCESS',
      statusCode: 200,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Log data modification
   */
  async logDataModification(
    userId: string,
    username: string,
    resourceType: string,
    resourceId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    const changes: Record<string, any> = {};

    Object.keys(newData).forEach((key) => {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    });

    return this.log({
      userId,
      username,
      action: 'DATA_MODIFIED',
      resourceType,
      resourceId,
      changes,
      status: 'SUCCESS',
      statusCode: 200,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Log data deletion
   */
  async logDataDeletion(
    userId: string,
    username: string,
    resourceType: string,
    resourceId: string,
    deletedData: Record<string, any>,
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: 'DATA_DELETED',
      resourceType,
      resourceId,
      changes: { deletedData },
      status: 'SUCCESS',
      statusCode: 200,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    userId: string,
    username: string,
    eventType: string,
    details: Record<string, any>,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    ipAddress: string,
    userAgent: string,
    organizationId: string,
    mspId: string
  ): Promise<string> {
    return this.log({
      userId,
      username,
      action: `SECURITY_${eventType}`,
      resourceType: 'SECURITY',
      resourceId: `${severity}_${Date.now()}`,
      changes: { ...details, severity },
      status: 'SUCCESS',
      statusCode: 200,
      ipAddress,
      userAgent,
      organizationId,
      mspId,
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(filter: AuditFilter): Promise<AuditLogEntry[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filter.userId) {
      query += ` AND user_id = $${paramCount}`;
      values.push(filter.userId);
      paramCount++;
    }

    if (filter.action) {
      query += ` AND action = $${paramCount}`;
      values.push(filter.action);
      paramCount++;
    }

    if (filter.resourceType) {
      query += ` AND resource_type = $${paramCount}`;
      values.push(filter.resourceType);
      paramCount++;
    }

    if (filter.resourceId) {
      query += ` AND resource_id = $${paramCount}`;
      values.push(filter.resourceId);
      paramCount++;
    }

    if (filter.status) {
      query += ` AND status = $${paramCount}`;
      values.push(filter.status);
      paramCount++;
    }

    if (filter.startDate) {
      query += ` AND timestamp >= $${paramCount}`;
      values.push(filter.startDate);
      paramCount++;
    }

    if (filter.endDate) {
      query += ` AND timestamp <= $${paramCount}`;
      values.push(filter.endDate);
      paramCount++;
    }

    query += ' ORDER BY timestamp DESC';

    if (filter.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filter.limit);
      paramCount++;
    }

    if (filter.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(filter.offset);
    }

    try {
      const result = await this.pool.query(query, values);
      return result.rows.map((row) => ({
        ...row,
        changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
      }));
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit log by ID
   */
  async getLogById(id: string): Promise<AuditLogEntry | null> {
    const query = 'SELECT * FROM audit_logs WHERE id = $1';

    try {
      const result = await this.pool.query(query, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        changes: typeof row.changes === 'string' ? JSON.parse(row.changes) : row.changes,
      };
    } catch (error) {
      console.error('Failed to get audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for export
   */
  async getExportAuditTrail(exportId: string): Promise<AuditLogEntry[]> {
    return this.queryLogs({
      resourceType: 'EXPORT',
      resourceId: exportId,
    });
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId: string, days: number = 30): Promise<AuditLogEntry[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.queryLogs({
      userId,
      startDate,
    });
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    filters?: Partial<AuditFilter>
  ): Promise<{
    totalEntries: number;
    successCount: number;
    failureCount: number;
    byAction: Record<string, number>;
    byUser: Record<string, number>;
    entries: AuditLogEntry[];
  }> {
    const logs = await this.queryLogs({
      ...filters,
      startDate,
      endDate,
      limit: 10000,
    });

    const byAction: Record<string, number> = {};
    const byUser: Record<string, number> = {};
    let successCount = 0;
    let failureCount = 0;

    logs.forEach((log) => {
      byAction[log.action] = (byAction[log.action] || 0) + 1;
      byUser[log.username] = (byUser[log.username] || 0) + 1;

      if (log.status === 'SUCCESS') {
        successCount++;
      } else {
        failureCount++;
      }
    });

    return {
      totalEntries: logs.length,
      successCount,
      failureCount,
      byAction,
      byUser,
      entries: logs,
    };
  }

  /**
   * Archive old audit logs
   */
  async archiveOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const query = `
      DELETE FROM audit_logs
      WHERE timestamp < $1
      RETURNING id;
    `;

    try {
      const result = await this.pool.query(query, [cutoffDate]);
      return result.rowCount || 0;
    } catch (error) {
      console.error('Failed to archive audit logs:', error);
      throw error;
    }
  }
}

/**
 * Factory function to create AuditService instance
 */
export function createAuditService(pool: Pool): AuditService {
  return new AuditService(pool);
}
