import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './rbac.middleware';
import { logger } from '../utils/logger';

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  method: string;
  path: string;
  statusCode: number;
  changes?: Record<string, any>;
  ipAddress: string;
  timestamp: Date;
  success: boolean;
}

// In-memory audit log store (in production, use database)
const auditLogs: AuditLog[] = [];

/**
 * Middleware to capture request details for audit logging
 */
export const captureAuditDetails = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Capture original send function
    const originalSend = res.send;

    // Override send to capture response
    res.send = function (data: any) {
      // Store audit details in request
      (req as any).auditDetails = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        timestamp: new Date(),
        userId: req.user?.id || 'anonymous',
        userEmail: req.user?.email || 'anonymous',
      };

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  } catch (err) {
    logger.error('Error capturing audit details:', err);
    next();
  }
};

/**
 * Middleware to log contract modifications
 */
export const logContractModification = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { draftId } = req.params;
    const method = req.method;
    const userId = req.user?.id || 'anonymous';
    const userEmail = req.user?.email || 'anonymous';
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    let action = '';
    switch (method) {
      case 'POST':
        action = 'CREATE';
        break;
      case 'PUT':
        action = 'UPDATE';
        break;
      case 'DELETE':
        action = 'DELETE';
        break;
      case 'GET':
        action = 'READ';
        break;
      default:
        action = method;
    }

    const auditLog: AuditLog = {
      id: `${Date.now()}-${Math.random()}`,
      userId,
      userEmail,
      action,
      resource: 'CONTRACT',
      resourceId: draftId || 'unknown',
      method,
      path: req.path,
      statusCode: res.statusCode,
      changes: req.body,
      ipAddress,
      timestamp: new Date(),
      success: res.statusCode >= 200 && res.statusCode < 300,
    };

    // Store audit log
    auditLogs.push(auditLog);

    // Log to console
    logger.info(
      `Audit: ${action} ${auditLog.resource} ${auditLog.resourceId} by ${userEmail} (${userId}) - Status: ${res.statusCode}`
    );

    next();
  } catch (err) {
    logger.error('Error logging contract modification:', err);
    next();
  }
};

/**
 * Middleware to log access attempts
 */
export const logAccessAttempt = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id || 'anonymous';
    const userEmail = req.user?.email || 'anonymous';
    const method = req.method;
    const path = req.path;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    logger.info(
      `Access: ${method} ${path} by ${userEmail} (${userId}) from ${ipAddress}`
    );

    next();
  } catch (err) {
    logger.error('Error logging access attempt:', err);
    next();
  }
};

/**
 * Middleware to log authorization failures
 */
export const logAuthorizationFailure = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const originalSend = res.send;

    res.send = function (data: any) {
      if (res.statusCode === 403) {
        const userId = req.user?.id || 'anonymous';
        const userEmail = req.user?.email || 'anonymous';
        const method = req.method;
        const path = req.path;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

        logger.warn(
          `Authorization failure: ${method} ${path} by ${userEmail} (${userId}) from ${ipAddress}`
        );
      }

      return originalSend.call(this, data);
    };

    next();
  } catch (err) {
    logger.error('Error logging authorization failure:', err);
    next();
  }
};

/**
 * Get all audit logs
 */
export const getAuditLogs = (): AuditLog[] => {
  return auditLogs;
};

/**
 * Get audit logs for specific user
 */
export const getAuditLogsForUser = (userId: string): AuditLog[] => {
  return auditLogs.filter(log => log.userId === userId);
};

/**
 * Get audit logs for specific resource
 */
export const getAuditLogsForResource = (resourceId: string): AuditLog[] => {
  return auditLogs.filter(log => log.resourceId === resourceId);
};

/**
 * Get audit logs for specific action
 */
export const getAuditLogsForAction = (action: string): AuditLog[] => {
  return auditLogs.filter(log => log.action === action);
};

/**
 * Get audit logs within date range
 */
export const getAuditLogsInDateRange = (startDate: Date, endDate: Date): AuditLog[] => {
  return auditLogs.filter(
    log => log.timestamp >= startDate && log.timestamp <= endDate
  );
};

/**
 * Export audit logs to CSV
 */
export const exportAuditLogsToCSV = (): string => {
  const headers = [
    'ID',
    'User ID',
    'User Email',
    'Action',
    'Resource',
    'Resource ID',
    'Method',
    'Path',
    'Status Code',
    'IP Address',
    'Timestamp',
    'Success',
  ];

  const rows = auditLogs.map(log => [
    log.id,
    log.userId,
    log.userEmail,
    log.action,
    log.resource,
    log.resourceId,
    log.method,
    log.path,
    log.statusCode,
    log.ipAddress,
    log.timestamp.toISOString(),
    log.success ? 'Yes' : 'No',
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  return csv;
};

/**
 * Endpoint to get audit logs
 */
export const getAuditLogsEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { userId, resourceId, action, startDate, endDate, format } = req.query;

    let logs = auditLogs;

    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }

    if (resourceId) {
      logs = logs.filter(log => log.resourceId === resourceId);
    }

    if (action) {
      logs = logs.filter(log => log.action === action);
    }

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      logs = logs.filter(log => log.timestamp >= start && log.timestamp <= end);
    }

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
      return res.send(exportAuditLogsToCSV());
    }

    res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (err) {
    logger.error('Error retrieving audit logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Endpoint to get audit log metrics
 */
export const getAuditMetricsEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const totalLogs = auditLogs.length;
    const successfulLogs = auditLogs.filter(log => log.success).length;
    const failedLogs = auditLogs.filter(log => !log.success).length;

    const actionCounts = auditLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userCounts = auditLogs.reduce((acc, log) => {
      acc[log.userEmail] = (acc[log.userEmail] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      metrics: {
        totalLogs,
        successfulLogs,
        failedLogs,
        successRate: ((successfulLogs / totalLogs) * 100).toFixed(2) + '%',
        actionCounts,
        userCounts,
      },
    });
  } catch (err) {
    logger.error('Error retrieving audit metrics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
