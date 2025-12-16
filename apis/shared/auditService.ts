import { v4 as uuidv4 } from 'uuid';
import { ExportStatus } from './exportService';

/**
 * Audit Log Entry
 */
export interface AuditLog {
  auditId: string;
  exportId: string;
  userId: string;
  organizationId: string;
  action: AuditAction;
  actionType: 'APPROVAL' | 'REJECTION' | 'SUBMISSION' | 'UPDATE' | 'CANCELLATION' | 'CREATION';
  previousStatus: ExportStatus | null;
  newStatus: ExportStatus;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  blockchainTransactionId?: string;
  blockchainBlockNumber?: number;
  status: 'PENDING' | 'RECORDED' | 'VERIFIED';
}

/**
 * Audit Actions
 */
export type AuditAction =
  | 'CREATE_EXPORT'
  | 'SUBMIT_TO_ECX'
  | 'VERIFY_LOT'
  | 'REJECT_LOT'
  | 'SUBMIT_TO_ECTA'
  | 'APPROVE_LICENSE'
  | 'REJECT_LICENSE'
  | 'APPROVE_QUALITY'
  | 'REJECT_QUALITY'
  | 'APPROVE_ORIGIN'
  | 'REJECT_ORIGIN'
  | 'APPROVE_CONTRACT'
  | 'REJECT_CONTRACT'
  | 'VERIFY_BANKING'
  | 'REJECT_BANKING'
  | 'APPROVE_FX'
  | 'REJECT_FX'
  | 'CLEAR_CUSTOMS'
  | 'REJECT_CUSTOMS'
  | 'SCHEDULE_SHIPMENT'
  | 'MARK_SHIPPED'
  | 'NOTIFY_ARRIVAL'
  | 'MARK_ARRIVED'
  | 'CONFIRM_DELIVERY'
  | 'CONFIRM_PAYMENT'
  | 'CONFIRM_FX_REPATRIATION'
  | 'CANCEL_EXPORT'
  | 'UPDATE_EXPORT';

/**
 * Audit Report
 */
export interface AuditReport {
  startDate: Date;
  endDate: Date;
  organizationId?: string;
  totalActions: number;
  actionBreakdown: Array<{
    action: AuditAction;
    count: number;
    unique_users: number;
    unique_exports: number;
  }>;
  generatedAt: Date;
}

/**
 * In-Memory Audit Service
 * Stores audit logs in memory (can be extended to use database)
 */
export class AuditService {
  private auditLogs: Map<string, AuditLog> = new Map();
  private exportAuditIndex: Map<string, string[]> = new Map();
  private userAuditIndex: Map<string, string[]> = new Map();

  /**
   * Log an action
   */
  async logAction(
    exportId: string,
    userId: string,
    organizationId: string,
    action: AuditAction,
    actionType: 'APPROVAL' | 'REJECTION' | 'SUBMISSION' | 'UPDATE' | 'CANCELLATION' | 'CREATION',
    previousStatus: ExportStatus | null,
    newStatus: ExportStatus,
    details: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const auditId = uuidv4();
    const timestamp = new Date();

    const auditLog: AuditLog = {
      auditId,
      exportId,
      userId,
      organizationId,
      action,
      actionType,
      previousStatus,
      newStatus,
      timestamp,
      ipAddress: ipAddress || 'UNKNOWN',
      userAgent: userAgent || 'UNKNOWN',
      details,
      status: 'PENDING',
    };

    // Store in memory
    this.auditLogs.set(auditId, auditLog);

    // Update indexes
    if (!this.exportAuditIndex.has(exportId)) {
      this.exportAuditIndex.set(exportId, []);
    }
    this.exportAuditIndex.get(exportId)!.push(auditId);

    if (!this.userAuditIndex.has(userId)) {
      this.userAuditIndex.set(userId, []);
    }
    this.userAuditIndex.get(userId)!.push(auditId);

    return auditLog;
  }

  /**
   * Update audit log with blockchain reference
   */
  async updateBlockchainReference(
    auditId: string,
    transactionId: string,
    blockNumber: number
  ): Promise<void> {
    const auditLog = this.auditLogs.get(auditId);
    if (auditLog) {
      auditLog.blockchainTransactionId = transactionId;
      auditLog.blockchainBlockNumber = blockNumber;
      auditLog.status = 'RECORDED';
    }
  }

  /**
   * Get audit logs for an export
   */
  async getExportAuditLogs(exportId: string): Promise<AuditLog[]> {
    const auditIds = this.exportAuditIndex.get(exportId) || [];
    const logs = auditIds
      .map((id) => this.auditLogs.get(id))
      .filter((log): log is AuditLog => log !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return logs;
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: string, limit: number = 100): Promise<AuditLog[]> {
    const auditIds = this.userAuditIndex.get(userId) || [];
    const logs = auditIds
      .map((id) => this.auditLogs.get(id))
      .filter((log): log is AuditLog => log !== undefined)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return logs;
  }

  /**
   * Get audit logs for an organization
   */
  async getOrganizationAuditLogs(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 1000
  ): Promise<AuditLog[]> {
    let logs = Array.from(this.auditLogs.values()).filter(
      (log) => log.organizationId === organizationId
    );

    if (startDate) {
      logs = logs.filter((log) => log.timestamp >= startDate);
    }

    if (endDate) {
      logs = logs.filter((log) => log.timestamp <= endDate);
    }

    logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return logs.slice(0, limit);
  }

  /**
   * Get audit logs by action
   */
  async getAuditLogsByAction(action: AuditAction, limit: number = 100): Promise<AuditLog[]> {
    const logs = Array.from(this.auditLogs.values())
      .filter((log) => log.action === action)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
    return logs;
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(
    startDate: Date,
    endDate: Date,
    organizationId?: string
  ): Promise<AuditReport> {
    let logs = Array.from(this.auditLogs.values()).filter(
      (log) => log.timestamp >= startDate && log.timestamp <= endDate
    );

    if (organizationId) {
      logs = logs.filter((log) => log.organizationId === organizationId);
    }

    // Group by action
    const actionMap = new Map<
      AuditAction,
      { count: number; users: Set<string>; exports: Set<string> }
    >();

    logs.forEach((log) => {
      if (!actionMap.has(log.action)) {
        actionMap.set(log.action, { count: 0, users: new Set(), exports: new Set() });
      }
      const entry = actionMap.get(log.action)!;
      entry.count++;
      entry.users.add(log.userId);
      entry.exports.add(log.exportId);
    });

    const actionBreakdown = Array.from(actionMap.entries())
      .map(([action, data]) => ({
        action,
        count: data.count,
        unique_users: data.users.size,
        unique_exports: data.exports.size,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      startDate,
      endDate,
      organizationId,
      totalActions: logs.length,
      actionBreakdown,
      generatedAt: new Date(),
    };
  }

  /**
   * Verify audit log integrity
   */
  async verifyAuditLogIntegrity(auditId: string): Promise<boolean> {
    const log = this.auditLogs.get(auditId);
    if (!log) return false;

    // Verify blockchain reference if available
    if (log.blockchainTransactionId) {
      return log.status === 'RECORDED';
    }

    return log.status === 'PENDING' || log.status === 'RECORDED';
  }

  /**
   * Get audit log by ID
   */
  async getAuditLog(auditId: string): Promise<AuditLog | null> {
    return this.auditLogs.get(auditId) || null;
  }

  /**
   * Get all audit logs (for admin purposes)
   */
  async getAllAuditLogs(limit: number = 10000): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear old audit logs (for maintenance)
   */
  async clearOldAuditLogs(beforeDate: Date): Promise<number> {
    let count = 0;
    const idsToDelete: string[] = [];

    this.auditLogs.forEach((log, id) => {
      if (log.timestamp < beforeDate) {
        idsToDelete.push(id);
        count++;
      }
    });

    idsToDelete.forEach((id) => {
      this.auditLogs.delete(id);
    });

    return count;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalLogs: number;
    totalExports: number;
    totalUsers: number;
    dateRange: { earliest: Date | null; latest: Date | null };
  }> {
    const logs = Array.from(this.auditLogs.values());
    const exports = new Set(logs.map((l) => l.exportId));
    const users = new Set(logs.map((l) => l.userId));

    const timestamps = logs.map((l) => l.timestamp.getTime());
    const earliest = timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null;
    const latest = timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null;

    return {
      totalLogs: logs.length,
      totalExports: exports.size,
      totalUsers: users.size,
      dateRange: { earliest, latest },
    };
  }
}

/**
 * Singleton instance
 */
let auditServiceInstance: AuditService | null = null;

/**
 * Get or create audit service instance
 */
export function getAuditService(): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService();
  }
  return auditServiceInstance;
}

/**
 * Export for use in other modules
 */
export default AuditService;
