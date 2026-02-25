import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

export enum AuditAction {
  // Export lifecycle
  EXPORT_CREATED = 'EXPORT_CREATED',
  EXPORT_UPDATED = 'EXPORT_UPDATED',
  EXPORT_CANCELLED = 'EXPORT_CANCELLED',
  
  // Approvals
  FX_APPROVED = 'FX_APPROVED',
  FX_REJECTED = 'FX_REJECTED',
  BANKING_APPROVED = 'BANKING_APPROVED',
  BANKING_REJECTED = 'BANKING_REJECTED',
  QUALITY_APPROVED = 'QUALITY_APPROVED',
  QUALITY_REJECTED = 'QUALITY_REJECTED',
  CUSTOMS_CLEARED = 'CUSTOMS_CLEARED',
  CUSTOMS_REJECTED = 'CUSTOMS_REJECTED',
  
  // Financial
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  FX_REPATRIATED = 'FX_REPATRIATED',
  
  // Documents
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_DELETED = 'DOCUMENT_DELETED',
  
  // Authentication
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  
  // Authorization
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_VIOLATION = 'PERMISSION_VIOLATION',
}

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  userId: string;
  username?: string;
  organizationId?: string;
  role?: string;
  resourceType: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
}

export class AuditService {
  private logger: winston.Logger;
  private static instance: AuditService;

  private constructor() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs', 'audit');

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'audit-service' },
      transports: [
        // Write all audit logs to daily rotating files
        new DailyRotateFile({
          filename: path.join(logsDir, 'audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d', // Keep 90 days for compliance
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
        // Separate file for security-critical events
        new DailyRotateFile({
          filename: path.join(logsDir, 'security-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '365d', // Keep 1 year for security events
          level: 'warn',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    });

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    }
  }

  public static getInstance(): AuditService {
    if (!AuditService.instance) {
      AuditService.instance = new AuditService();
    }
    return AuditService.instance;
  }

  /**
   * Log an audit event
   */
  public log(entry: AuditLogEntry): void {
    const logEntry = {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    };

    // Use appropriate log level based on action
    const level = this.getLogLevel(entry.action, entry.success);
    
    this.logger.log(level, 'Audit Event', logEntry);
  }

  /**
   * Log export creation
   */
  public logExportCreation(
    userId: string,
    exportId: string,
    data: Record<string, any>,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: AuditAction.EXPORT_CREATED,
      userId,
      resourceType: 'export',
      resourceId: exportId,
      details: {
        exporterName: data.exporterName,
        coffeeType: data.coffeeType,
        quantity: data.quantity,
        destinationCountry: data.destinationCountry,
        estimatedValue: data.estimatedValue,
      },
      success: true,
      ...metadata,
    });
  }

  /**
   * Log status change
   */
  public logStatusChange(
    userId: string,
    exportId: string,
    oldStatus: string,
    newStatus: string,
    action: AuditAction,
    metadata?: { ipAddress?: string; userAgent?: string; reason?: string }
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action,
      userId,
      resourceType: 'export',
      resourceId: exportId,
      details: {
        oldStatus,
        newStatus,
        reason: metadata?.reason,
      },
      success: true,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log FX approval
   */
  public logFXApproval(
    userId: string,
    username: string,
    organizationId: string,
    exportId: string,
    approved: boolean,
    reason?: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: approved ? AuditAction.FX_APPROVED : AuditAction.FX_REJECTED,
      userId,
      username,
      organizationId,
      resourceType: 'export',
      resourceId: exportId,
      details: {
        approved,
        reason,
      },
      success: true,
      ...metadata,
    });
  }

  /**
   * Log payment confirmation
   */
  public logPaymentConfirmation(
    userId: string,
    exportId: string,
    paymentMethod: string,
    amount: number,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: AuditAction.PAYMENT_CONFIRMED,
      userId,
      resourceType: 'export',
      resourceId: exportId,
      details: {
        paymentMethod,
        amount,
      },
      success: true,
      ...metadata,
    });
  }

  /**
   * Log authentication events
   */
  public logAuthentication(
    userId: string,
    username: string,
    success: boolean,
    metadata?: { ipAddress?: string; userAgent?: string; errorMessage?: string }
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: success ? AuditAction.USER_LOGIN : AuditAction.LOGIN_FAILED,
      userId,
      username,
      resourceType: 'authentication',
      resourceId: userId,
      details: {},
      success,
      errorMessage: metadata?.errorMessage,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Log access denial
   */
  public logAccessDenied(
    userId: string,
    resourceType: string,
    resourceId: string,
    requiredPermission: string,
    metadata?: { ipAddress?: string; userAgent?: string }
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: AuditAction.ACCESS_DENIED,
      userId,
      resourceType,
      resourceId,
      details: {
        requiredPermission,
      },
      success: false,
      ...metadata,
    });
  }

  /**
   * Log document operations
   */
  public logDocumentOperation(
    userId: string,
    exportId: string,
    documentId: string,
    operation: 'upload' | 'delete',
    metadata?: { ipAddress?: string; userAgent?: string; fileName?: string }
  ): void {
    this.log({
      timestamp: new Date().toISOString(),
      action: operation === 'upload' ? AuditAction.DOCUMENT_UPLOADED : AuditAction.DOCUMENT_DELETED,
      userId,
      resourceType: 'document',
      resourceId: documentId,
      details: {
        exportId,
        fileName: metadata?.fileName,
      },
      success: true,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });
  }

  /**
   * Query audit logs (for compliance reporting)
   */
  public async queryLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: AuditAction;
    resourceId?: string;
  }): Promise<AuditLogEntry[]> {
    // This is a placeholder - in production, you'd query from a database
    // or use a log aggregation service like ELK, Splunk, or CloudWatch
    console.log('Querying audit logs with filters:', filters);
    return [];
  }

  /**
   * Generate compliance report
   */
  public async generateComplianceReport(
    _startDate: Date,
    _endDate: Date
  ): Promise<{
    totalEvents: number;
    eventsByAction: Record<string, number>;
    failedActions: number;
    securityEvents: number;
  }> {
    // Placeholder for compliance reporting
    // In production, aggregate from audit logs
    return {
      totalEvents: 0,
      eventsByAction: {},
      failedActions: 0,
      securityEvents: 0,
    };
  }

  /**
   * Determine log level based on action and success
   */
  private getLogLevel(action: AuditAction, success: boolean): string {
    // Security-critical events
    const criticalActions = [
      AuditAction.LOGIN_FAILED,
      AuditAction.ACCESS_DENIED,
      AuditAction.PERMISSION_VIOLATION,
    ];

    if (criticalActions.includes(action) || !success) {
      return 'warn';
    }

    return 'info';
  }
}

// Export singleton instance
export const auditService = AuditService.getInstance();
