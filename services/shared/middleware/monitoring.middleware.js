"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMonitoringMiddleware = exports.monitoringMiddleware = void 0;
const monitoring_service_1 = require("../monitoring.service");
const audit_service_1 = require("../audit.service");
/**
 * Middleware to track API response times and errors
 */
const monitoringMiddleware = (req, res, next) => {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.path}`;
    // Track when response finishes
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        // Track response time
        monitoring_service_1.monitoringService.trackAPIResponseTime(endpoint, duration);
        // Log to audit if it's a state-changing operation
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
            const userId = req.user?.id || 'anonymous';
            const success = res.statusCode < 400;
            // Determine action based on endpoint
            const action = getAuditAction(req.method, req.path);
            if (action) {
                audit_service_1.auditService.log({
                    timestamp: new Date().toISOString(),
                    action,
                    userId,
                    username: req.user?.username,
                    organizationId: req.user?.organizationId,
                    role: req.user?.role,
                    resourceType: getResourceType(req.path),
                    resourceId: getResourceId(req.path, req.body),
                    details: {
                        method: req.method,
                        path: req.path,
                        statusCode: res.statusCode,
                        duration,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                    success,
                });
            }
        }
    });
    next();
};
exports.monitoringMiddleware = monitoringMiddleware;
/**
 * Middleware to track errors
 */
const errorMonitoringMiddleware = (err, req, _res, next) => {
    const endpoint = `${req.method} ${req.path}`;
    // Log error to monitoring
    monitoring_service_1.monitoringService.createAlert({
        level: monitoring_service_1.AlertLevel.ERROR,
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
exports.errorMonitoringMiddleware = errorMonitoringMiddleware;
/**
 * Helper to determine audit action from request
 */
function getAuditAction(method, path) {
    if (path.includes('/exports') && method === 'POST') {
        return audit_service_1.AuditAction.EXPORT_CREATED;
    }
    if (path.includes('/approve-fx')) {
        return audit_service_1.AuditAction.FX_APPROVED;
    }
    if (path.includes('/reject-fx')) {
        return audit_service_1.AuditAction.FX_REJECTED;
    }
    if (path.includes('/approve-banking')) {
        return audit_service_1.AuditAction.BANKING_APPROVED;
    }
    if (path.includes('/reject-banking')) {
        return audit_service_1.AuditAction.BANKING_REJECTED;
    }
    if (path.includes('/approve-quality') || path.includes('/quality-certificate')) {
        return audit_service_1.AuditAction.QUALITY_APPROVED;
    }
    if (path.includes('/reject-quality')) {
        return audit_service_1.AuditAction.QUALITY_REJECTED;
    }
    if (path.includes('/clear-customs')) {
        return audit_service_1.AuditAction.CUSTOMS_CLEARED;
    }
    if (path.includes('/reject-customs')) {
        return audit_service_1.AuditAction.CUSTOMS_REJECTED;
    }
    if (path.includes('/confirm-payment')) {
        return audit_service_1.AuditAction.PAYMENT_CONFIRMED;
    }
    if (path.includes('/confirm-repatriation') || path.includes('/fx-repatriation')) {
        return audit_service_1.AuditAction.FX_REPATRIATED;
    }
    if (path.includes('/upload') || path.includes('/documents')) {
        return audit_service_1.AuditAction.DOCUMENT_UPLOADED;
    }
    if (path.includes('/login')) {
        return audit_service_1.AuditAction.USER_LOGIN;
    }
    if (path.includes('/logout')) {
        return audit_service_1.AuditAction.USER_LOGOUT;
    }
    return null;
}
/**
 * Helper to get resource type from path
 */
function getResourceType(path) {
    if (path.includes('/exports'))
        return 'export';
    if (path.includes('/documents'))
        return 'document';
    if (path.includes('/users'))
        return 'user';
    if (path.includes('/auth'))
        return 'authentication';
    return 'unknown';
}
/**
 * Helper to extract resource ID from path or body
 */
function getResourceId(path, body) {
    // Try to extract from path params
    const match = path.match(/\/([A-Z]+-[0-9]+)/);
    if (match && match[1])
        return match[1];
    // Try to extract from body
    if (body?.exportId)
        return body.exportId;
    if (body?.id)
        return body.id;
    return 'unknown';
}
//# sourceMappingURL=monitoring.middleware.js.map