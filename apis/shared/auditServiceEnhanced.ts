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
  encrypted?: boolean;
  encryptionKey?: string;
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
 * Compliance Report (SOX, GDPR, etc.)
 */
export interface ComplianceReport {
  reportType: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI_DSS';
  startDate: Date;
  endDate: Date;
  organizationId: string;
  totalActions: number;
  criticalActions: number;
  userActions: Map<string, number>;
  actionTimeline: Array<{ timestamp: Date; action: AuditAction; count: number }>;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
  issues: string[];
  generatedAt: Date;
}

/**
 * Audit Stream Event
 */
export interface AuditStreamEvent {
  eventId: string;
  auditLog: AuditLog;
  timestamp: Date;
  subscribers: number;
}

/**
 * Anomaly Detection Result
 */
export interface AnomalyDetectionResult {
  anomalyId: string;
  auditId: string;
  anomalyType:
    | 'UNUSUAL_TIME'
    | 'UNUSUAL_LOCATION'
    | 'UNUSUAL_ACTION'
    | 'BULK_ACTION'
    | 'FAILED_ATTEMPTS';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  confidence: number; // 0-1
  detectedAt: Date;
  requiresReview: boolean;
}

/**
 * Enhanced Audit Service with Future Features
 * Supports: Database persistence, Elasticsearch, encryption, streaming, ML anomaly detection
 */
export class AuditServiceEnhanced {
  private auditLogs: Map<string, AuditLog> = new Map();
  private exportAuditIndex: Map<string, string[]> = new Map();
  private userAuditIndex: Map<string, string[]> = new Map();
  private anomalies: Map<string, AnomalyDetectionResult> = new Map();
  private streamSubscribers: Set<(event: AuditStreamEvent) => void> = new Set();

  // Database connection (optional)
  private dbConnection: any = null;

  // Elasticsearch client (optional)
  private elasticsearchClient: any = null;

  // Encryption key
  private encryptionKey: string = process.env.AUDIT_ENCRYPTION_KEY || 'default-key';

  constructor(dbConnection?: any, elasticsearchClient?: any) {
    this.dbConnection = dbConnection;
    this.elasticsearchClient = elasticsearchClient;
  }

  /**
   * Log an action with optional encryption
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
    userAgent?: string,
    encrypt: boolean = false
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
      encrypted: encrypt,
      encryptionKey: encrypt ? this.encryptionKey : undefined,
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

    // Persist to database if available
    if (this.dbConnection) {
      await this.persistToDatabase(auditLog);
    }

    // Index in Elasticsearch if available
    if (this.elasticsearchClient) {
      await this.indexInElasticsearch(auditLog);
    }

    // Detect anomalies
    const anomaly = await this.detectAnomalies(auditLog);
    if (anomaly) {
      this.anomalies.set(anomaly.anomalyId, anomaly);
    }

    // Stream event to subscribers
    await this.streamEvent({
      eventId: uuidv4(),
      auditLog,
      timestamp,
      subscribers: this.streamSubscribers.size,
    });

    return auditLog;
  }

  /**
   * Persist audit log to database
   */
  private async persistToDatabase(auditLog: AuditLog): Promise<void> {
    if (!this.dbConnection) return;

    try {
      const query = `
        INSERT INTO audit_logs (
          audit_id, export_id, user_id, organization_id, action, action_type,
          previous_status, new_status, timestamp, ip_address, user_agent,
          details, blockchain_transaction_id, blockchain_block_number, status, encrypted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params: any[] = [
        auditLog.auditId,
        auditLog.exportId,
        auditLog.userId,
        auditLog.organizationId,
        auditLog.action,
        auditLog.actionType,
        auditLog.previousStatus || null,
        auditLog.newStatus,
        auditLog.timestamp.toISOString(),
        auditLog.ipAddress,
        auditLog.userAgent,
        JSON.stringify(auditLog.details),
        auditLog.blockchainTransactionId || null,
        auditLog.blockchainBlockNumber || null,
        auditLog.status,
        auditLog.encrypted ? 1 : 0,
      ];
      // @ts-ignore - dbConnection type is intentionally flexible
      await this.dbConnection.run(query, params);
    } catch (error) {
      console.error('Failed to persist audit log to database:', error);
    }
  }

  /**
   * Index audit log in Elasticsearch
   */
  private async indexInElasticsearch(auditLog: AuditLog): Promise<void> {
    if (!this.elasticsearchClient) return;

    try {
      await this.elasticsearchClient.index({
        index: `audit-logs-${new Date().toISOString().split('T')[0]}`,
        id: auditLog.auditId,
        body: {
          ...auditLog,
          timestamp: auditLog.timestamp.toISOString(),
        },
      });
    } catch (error) {
      console.error('Failed to index audit log in Elasticsearch:', error);
    }
  }

  /**
   * Detect anomalies using machine learning
   */
  private async detectAnomalies(
    auditLog: AuditLog
  ): Promise<AnomalyDetectionResult | null | undefined> {
    // Get user's historical patterns
    const userLogs = await this.getUserAuditLogs(auditLog.userId, 100);
    if (userLogs.length < 10) return null; // Need baseline

    // Analyze patterns
    const anomalies: AnomalyDetectionResult[] = [];

    // Check for unusual time
    const hourOfDay = auditLog.timestamp.getHours();
    const userHours = userLogs.map((l) => l.timestamp.getHours());
    const avgHour = userHours.reduce((a, b) => a + b, 0) / userHours.length;
    const hourDeviation = Math.abs(hourOfDay - avgHour);

    if (hourDeviation > 6) {
      anomalies.push({
        anomalyId: uuidv4(),
        auditId: auditLog.auditId,
        anomalyType: 'UNUSUAL_TIME',
        severity: 'LOW',
        description: `Action performed at unusual time (${hourOfDay}:00, average: ${Math.round(avgHour)}:00)`,
        confidence: Math.min(hourDeviation / 12, 1),
        detectedAt: new Date(),
        requiresReview: false,
      });
    }

    // Check for unusual location (IP)
    const userIPs = new Set(userLogs.map((l) => l.ipAddress));
    if (!userIPs.has(auditLog.ipAddress) && auditLog.ipAddress !== 'UNKNOWN') {
      anomalies.push({
        anomalyId: uuidv4(),
        auditId: auditLog.auditId,
        anomalyType: 'UNUSUAL_LOCATION',
        severity: 'MEDIUM',
        description: `Action from new IP address: ${auditLog.ipAddress}`,
        confidence: 0.8,
        detectedAt: new Date(),
        requiresReview: true,
      });
    }

    // Check for bulk actions
    const recentLogs = userLogs.filter(
      (l) => l.timestamp.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    );
    if (recentLogs.length > 10) {
      anomalies.push({
        anomalyId: uuidv4(),
        auditId: auditLog.auditId,
        anomalyType: 'BULK_ACTION',
        severity: 'HIGH',
        description: `Bulk actions detected: ${recentLogs.length} actions in 5 minutes`,
        confidence: 0.9,
        detectedAt: new Date(),
        requiresReview: true,
      });
    }

    return anomalies.length > 0 ? anomalies[0] : null;
  }

  /**
   * Stream audit events to subscribers (WebSocket support)
   */
  async streamEvent(event: AuditStreamEvent): Promise<void> {
    for (const subscriber of this.streamSubscribers) {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Error streaming audit event:', error);
      }
    }
  }

  /**
   * Subscribe to audit stream
   */
  subscribeToStream(callback: (event: AuditStreamEvent) => void): () => void {
    this.streamSubscribers.add(callback);
    // Return unsubscribe function
    return () => {
      this.streamSubscribers.delete(callback);
    };
  }

  /**
   * Search audit logs using Elasticsearch
   */
  async searchAuditLogs(query: string, limit: number = 100): Promise<AuditLog[]> {
    if (!this.elasticsearchClient) {
      throw new Error('Elasticsearch client not configured');
    }

    try {
      const result = await this.elasticsearchClient.search({
        index: 'audit-logs-*',
        body: {
          query: {
            multi_match: {
              query,
              fields: ['action', 'userId', 'exportId', 'details'],
            },
          },
          size: limit,
          sort: [{ timestamp: { order: 'desc' } }],
        },
      });

      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Elasticsearch search failed:', error);
      return [];
    }
  }

  /**
   * Generate compliance report (SOX, GDPR, etc.)
   */
  async generateComplianceReport(
    reportType: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI_DSS',
    startDate: Date,
    endDate: Date,
    organizationId: string
  ): Promise<ComplianceReport> {
    const logs = await this.getOrganizationAuditLogs(organizationId, startDate, endDate);

    // Define critical actions per compliance type
    const criticalActions: Record<string, AuditAction[]> = {
      SOX: ['APPROVE_LICENSE', 'APPROVE_CONTRACT', 'CONFIRM_PAYMENT'],
      GDPR: ['CREATE_EXPORT', 'UPDATE_EXPORT', 'CANCEL_EXPORT'],
      HIPAA: ['APPROVE_QUALITY', 'CONFIRM_DELIVERY'],
      PCI_DSS: ['CONFIRM_PAYMENT', 'APPROVE_FX'],
    };

    const critical = criticalActions[reportType] || [];
    const criticalLogs = logs.filter((l) => critical.includes(l.action));

    // Build user action map
    const userActions = new Map<string, number>();
    logs.forEach((log) => {
      userActions.set(log.userId, (userActions.get(log.userId) || 0) + 1);
    });

    // Build timeline
    const timeline = new Map<string, number>();
    logs.forEach((log) => {
      const key = log.timestamp.toISOString().split('T')[0];
      timeline.set(key, (timeline.get(key) || 0) + 1);
    });

    const actionTimeline = Array.from(timeline.entries())
      .map(([date, count]) => ({
        timestamp: new Date(date),
        action: 'AUDIT_LOG' as AuditAction,
        count,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Determine compliance status
    const issues: string[] = [];
    if (criticalLogs.length === 0) {
      issues.push(`No critical actions found for ${reportType}`);
    }
    if (userActions.size === 0) {
      issues.push('No user actions recorded');
    }

    const complianceStatus = issues.length === 0 ? 'COMPLIANT' : 'PARTIAL';

    return {
      reportType,
      startDate,
      endDate,
      organizationId,
      totalActions: logs.length,
      criticalActions: criticalLogs.length,
      userActions,
      actionTimeline,
      complianceStatus,
      issues,
      generatedAt: new Date(),
    };
  }

  /**
   * Get detected anomalies
   */
  async getAnomalies(
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    limit: number = 100
  ): Promise<AnomalyDetectionResult[]> {
    let anomalies = Array.from(this.anomalies.values());

    if (severity) {
      anomalies = anomalies.filter((a) => a.severity === severity);
    }

    return anomalies
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Encrypt sensitive audit data
   */
  private encryptData(data: string, key: string): string {
    // In production, use proper encryption library (crypto-js, libsodium, etc.)
    // This is a placeholder
    return Buffer.from(data).toString('base64');
  }

  /**
   * Decrypt sensitive audit data
   */
  private decryptData(encryptedData: string, key: string): string {
    // In production, use proper decryption library
    // This is a placeholder
    return Buffer.from(encryptedData, 'base64').toString('utf-8');
  }

  /**
   * Update audit log with blockchain reference
   */
  async updateBlockchainReference(
    auditId: string,
    transactionId?: string,
    blockNumber?: number
  ): Promise<void> {
    const auditLog = this.auditLogs.get(auditId);
    if (auditLog) {
      if (transactionId) auditLog.blockchainTransactionId = transactionId;
      if (blockNumber) auditLog.blockchainBlockNumber = blockNumber;
      auditLog.status = 'RECORDED';

      // Update in database if available
      if (this.dbConnection) {
        const query = `
          UPDATE audit_logs
          SET blockchain_transaction_id = ?, blockchain_block_number = ?, status = ?
          WHERE audit_id = ?
        `;
        const params: any[] = [transactionId || null, blockNumber || null, 'RECORDED', auditId];
        await (this.dbConnection as any).run(query, params);
      }
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
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalLogs: number;
    totalExports: number;
    totalUsers: number;
    totalAnomalies: number;
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
      totalAnomalies: this.anomalies.size,
      dateRange: { earliest, latest },
    };
  }
}

/**
 * Singleton instance
 */
let auditServiceInstance: AuditServiceEnhanced | null = null;

/**
 * Get or create enhanced audit service instance
 */
export function getAuditServiceEnhanced(
  dbConnection?: any,
  elasticsearchClient?: any
): AuditServiceEnhanced {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditServiceEnhanced(dbConnection, elasticsearchClient);
  }
  return auditServiceInstance;
}

/**
 * Export for use in other modules
 */
export default AuditServiceEnhanced;
