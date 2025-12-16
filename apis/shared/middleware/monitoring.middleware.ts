import { Request, Response, NextFunction } from 'express';
import { monitoringService, AlertLevel } from '../monitoring.service';
import { getAuditService, AuditAction } from '../auditService';
const auditService = getAuditService();

interface RequestWithUser extends Request {
  user?: {
    id: string;
    username: string;
    organizationId: string;
    role: string;
  };
}

/**
 * Middleware to track API response times and errors
 */
export const monitoringMiddleware = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const endpoint = `${req.method} ${req.path}`;

  // Track when response finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Track response time
    monitoringService.trackAPIResponseTime(endpoint, duration);

    // Log to audit if it's a state-changing operation
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const userId = req.user?.id || 'anonymous';
      const success = res.statusCode < 400;

      // Determine action based on endpoint
      const action = getAuditAction(req.method, req.path);

      if (action) {
        // Audit logging would go here
        // auditService.logAction(...) can be called if needed
      }
    }
  });

  next();
};

/**
 * Middleware to track errors
 */
export const errorMonitoringMiddleware = (
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const endpoint = `${req.method} ${req.path}`;

  // Log error to monitoring
  monitoringService.createAlert({
    level: AlertLevel.ERROR,
    title: 'API Error',
    message: err.message,
    timestamp: new Date(),
    source: endpoint,
    metadata: {
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
  });

  next(err);
};

/**
 * Helper to determine audit action from request
 */
function getAuditAction(method: string, path: string): AuditAction | null {
  if (path.includes('/exports') && method === 'POST') {
    return 'CREATE_EXPORT';
  }
  if (path.includes('/approve-fx')) {
    return 'APPROVE_FX';
  }
  if (path.includes('/reject-fx')) {
    return 'REJECT_FX';
  }
  if (path.includes('/approve-banking')) {
    return 'VERIFY_BANKING';
  }
  if (path.includes('/reject-banking')) {
    return 'REJECT_BANKING';
  }
  if (path.includes('/approve-quality') || path.includes('/quality-certificate')) {
    return 'APPROVE_QUALITY';
  }
  if (path.includes('/reject-quality')) {
    return 'REJECT_QUALITY';
  }
  if (path.includes('/clear-customs')) {
    return 'CLEAR_CUSTOMS';
  }
  if (path.includes('/reject-customs')) {
    return 'REJECT_CUSTOMS';
  }
  if (path.includes('/confirm-payment')) {
    return 'CONFIRM_PAYMENT';
  }
  if (path.includes('/confirm-repatriation') || path.includes('/fx-repatriation')) {
    return 'CONFIRM_FX_REPATRIATION';
  }
  if (path.includes('/upload') || path.includes('/documents')) {
    return 'UPDATE_EXPORT';
  }
  if (path.includes('/login')) {
    return 'CREATE_EXPORT';
  }
  if (path.includes('/logout')) {
    return 'CANCEL_EXPORT';
  }

  return null;
}

/**
 * Helper to get resource type from path
 */
function getResourceType(path: string): string {
  if (path.includes('/exports')) return 'export';
  if (path.includes('/documents')) return 'document';
  if (path.includes('/users')) return 'user';
  if (path.includes('/auth')) return 'authentication';
  return 'unknown';
}

/**
 * Helper to extract resource ID from path or body
 */
function getResourceId(path: string, body: any): string {
  // Try to extract from path params
  const match = path.match(/\/([A-Z]+-[0-9]+)/);
  if (match && match[1]) return match[1];

  // Try to extract from body
  if (body?.exportId) return body.exportId;
  if (body?.id) return body.id;

  return 'unknown';
}
