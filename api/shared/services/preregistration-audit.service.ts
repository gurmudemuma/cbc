/**
 * Pre-Registration Audit Service
 * Enhanced audit trail for compliance and regulatory tracking
 */

import pool from '../database/db.config';
import { v4 as uuidv4 } from 'uuid';

export interface AuditEvent {
  auditId: string;
  eventType: AuditEventType;
  entityType: EntityType;
  entityId: string;
  userId: string;
  userRole: string;
  organizationId: string;
  action: string;
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: string;
  severity: AuditSeverity;
  complianceRelevant: boolean;
}

export type AuditEventType = 
  | 'PROFILE_CREATED' | 'PROFILE_UPDATED' | 'PROFILE_APPROVED' | 'PROFILE_REJECTED'
  | 'LABORATORY_REGISTERED' | 'LABORATORY_CERTIFIED' | 'LABORATORY_REJECTED'
  | 'TASTER_REGISTERED' | 'TASTER_VERIFIED' | 'TASTER_REJECTED'
  | 'COMPETENCE_APPLIED' | 'COMPETENCE_ISSUED' | 'COMPETENCE_REJECTED' | 'COMPETENCE_RENEWED'
  | 'LICENSE_APPLIED' | 'LICENSE_ISSUED' | 'LICENSE_REJECTED' | 'LICENSE_RENEWED' | 'LICENSE_SUSPENDED'
  | 'DOCUMENT_UPLOADED' | 'DOCUMENT_VERIFIED' | 'DOCUMENT_REJECTED'
  | 'VALIDATION_PERFORMED' | 'EXPORT_BLOCKED' | 'EXPORT_ALLOWED'
  | 'SYSTEM_ACCESS' | 'UNAUTHORIZED_ACCESS' | 'DATA_EXPORT' | 'CONFIGURATION_CHANGE';

export type EntityType = 
  | 'exporter_profile' | 'laboratory' | 'taster' | 'competence_certificate' 
  | 'export_license' | 'document' | 'export_request' | 'system';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditQuery {
  entityType?: EntityType;
  entityId?: string;
  eventType?: AuditEventType;
  userId?: string;
  organizationId?: string;
  startDate?: string;
  endDate?: string;
  severity?: AuditSeverity;
  complianceRelevant?: boolean;
  limit?: number;
  offset?: number;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  generatedBy: string;
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalEvents: number;
    criticalEvents: number;
    complianceEvents: number;
    uniqueUsers: number;
    uniqueExporters: number;
  };
  eventsByType: Record<AuditEventType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  topUsers: Array<{ userId: string; eventCount: number }>;
  suspiciousActivities: AuditEvent[];
}

export class PreRegistrationAuditService {
  
  /**
   * Log an audit event
   */
  async logEvent(event: Omit<AuditEvent, 'auditId' | 'timestamp'>): Promise<string> {
    const auditId = uuidv4();
    const timestamp = new Date().toISOString();
    
    const query = `
      INSERT INTO preregistration_audit_log (
        audit_id, event_type, entity_type, entity_id, user_id, user_role, 
        organization_id, action, description, old_values, new_values, 
        metadata, ip_address, user_agent, session_id, timestamp, 
        severity, compliance_relevant
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING audit_id
    `;
    
    const values = [
      auditId, event.eventType, event.entityType, event.entityId,
      event.userId, event.userRole, event.organizationId, event.action,
      event.description, JSON.stringify(event.oldValues || {}),
      JSON.stringify(event.newValues || {}), JSON.stringify(event.metadata || {}),
      event.ipAddress, event.userAgent, event.sessionId, timestamp,
      event.severity, event.complianceRelevant
    ];
    
    await pool.query(query, values);
    
    // Log critical events immediately
    if (event.severity === 'CRITICAL') {
      console.error(`🚨 CRITICAL AUDIT EVENT: ${event.eventType} - ${event.description}`);
    }
    
    return auditId;
  }

  /**
   * Log exporter profile events
   */
  async logProfileEvent(
    eventType: Extract<AuditEventType, 'PROFILE_CREATED' | 'PROFILE_UPDATED' | 'PROFILE_APPROVED' | 'PROFILE_REJECTED'>,
    exporterId: string,
    userId: string,
    userRole: string,
    organizationId: string,
    oldValues?: any,
    newValues?: any,
    metadata?: any
  ): Promise<string> {
    return this.logEvent({
      eventType,
      entityType: 'exporter_profile',
      entityId: exporterId,
      userId,
      userRole,
      organizationId,
      action: this.getActionFromEventType(eventType),
      description: this.getDescriptionFromEventType(eventType, exporterId),
      oldValues,
      newValues,
      metadata,
      severity: this.getSeverityFromEventType(eventType),
      complianceRelevant: true
    });
  }

  /**
   * Log license/certificate events
   */
  async logLicenseEvent(
    eventType: Extract<AuditEventType, 'LICENSE_APPLIED' | 'LICENSE_ISSUED' | 'LICENSE_REJECTED' | 'LICENSE_RENEWED' | 'LICENSE_SUSPENDED'>,
    licenseId: string,
    exporterId: string,
    userId: string,
    userRole: string,
    organizationId: string,
    metadata?: any
  ): Promise<string> {
    return this.logEvent({
      eventType,
      entityType: 'export_license',
      entityId: licenseId,
      userId,
      userRole,
      organizationId,
      action: this.getActionFromEventType(eventType),
      description: `${eventType.replace('_', ' ').toLowerCase()} for exporter ${exporterId}`,
      metadata: { ...metadata, exporterId },
      severity: eventType === 'LICENSE_SUSPENDED' ? 'CRITICAL' : 'HIGH',
      complianceRelevant: true
    });
  }

  /**
   * Log document events
   */
  async logDocumentEvent(
    eventType: Extract<AuditEventType, 'DOCUMENT_UPLOADED' | 'DOCUMENT_VERIFIED' | 'DOCUMENT_REJECTED'>,
    documentId: string,
    entityType: EntityType,
    entityId: string,
    userId: string,
    userRole: string,
    organizationId: string,
    metadata?: any
  ): Promise<string> {
    return this.logEvent({
      eventType,
      entityType: 'document',
      entityId: documentId,
      userId,
      userRole,
      organizationId,
      action: this.getActionFromEventType(eventType),
      description: `Document ${eventType.toLowerCase()} for ${entityType} ${entityId}`,
      metadata: { ...metadata, relatedEntityType: entityType, relatedEntityId: entityId },
      severity: 'MEDIUM',
      complianceRelevant: true
    });
  }

  /**
   * Log validation events
   */
  async logValidationEvent(
    eventType: Extract<AuditEventType, 'VALIDATION_PERFORMED' | 'EXPORT_BLOCKED' | 'EXPORT_ALLOWED'>,
    exporterId: string,
    userId: string,
    userRole: string,
    organizationId: string,
    validationResult: any,
    metadata?: any
  ): Promise<string> {
    return this.logEvent({
      eventType,
      entityType: 'exporter_profile',
      entityId: exporterId,
      userId,
      userRole,
      organizationId,
      action: this.getActionFromEventType(eventType),
      description: `Export validation: ${eventType === 'EXPORT_ALLOWED' ? 'PASSED' : 'FAILED'}`,
      newValues: validationResult,
      metadata,
      severity: eventType === 'EXPORT_BLOCKED' ? 'HIGH' : 'MEDIUM',
      complianceRelevant: true
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    eventType: Extract<AuditEventType, 'SYSTEM_ACCESS' | 'UNAUTHORIZED_ACCESS' | 'DATA_EXPORT'>,
    userId: string,
    userRole: string,
    organizationId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: any
  ): Promise<string> {
    return this.logEvent({
      eventType,
      entityType: 'system',
      entityId: 'system',
      userId,
      userRole,
      organizationId,
      action: this.getActionFromEventType(eventType),
      description: this.getDescriptionFromEventType(eventType, userId),
      ipAddress,
      userAgent,
      metadata,
      severity: eventType === 'UNAUTHORIZED_ACCESS' ? 'CRITICAL' : 'LOW',
      complianceRelevant: eventType !== 'SYSTEM_ACCESS'
    });
  }

  /**
   * Query audit events
   */
  async queryEvents(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    let whereClause = 'WHERE 1=1';
    const values: any[] = [];
    let paramIndex = 1;

    if (query.entityType) {
      whereClause += ` AND entity_type = $${paramIndex}`;
      values.push(query.entityType);
      paramIndex++;
    }

    if (query.entityId) {
      whereClause += ` AND entity_id = $${paramIndex}`;
      values.push(query.entityId);
      paramIndex++;
    }

    if (query.eventType) {
      whereClause += ` AND event_type = $${paramIndex}`;
      values.push(query.eventType);
      paramIndex++;
    }

    if (query.userId) {
      whereClause += ` AND user_id = $${paramIndex}`;
      values.push(query.userId);
      paramIndex++;
    }

    if (query.organizationId) {
      whereClause += ` AND organization_id = $${paramIndex}`;
      values.push(query.organizationId);
      paramIndex++;
    }

    if (query.startDate) {
      whereClause += ` AND timestamp >= $${paramIndex}`;
      values.push(query.startDate);
      paramIndex++;
    }

    if (query.endDate) {
      whereClause += ` AND timestamp <= $${paramIndex}`;
      values.push(query.endDate);
      paramIndex++;
    }

    if (query.severity) {
      whereClause += ` AND severity = $${paramIndex}`;
      values.push(query.severity);
      paramIndex++;
    }

    if (query.complianceRelevant !== undefined) {
      whereClause += ` AND compliance_relevant = $${paramIndex}`;
      values.push(query.complianceRelevant);
      paramIndex++;
    }

    // Count query
    const countQuery = `SELECT COUNT(*) FROM preregistration_audit_log ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Data query
    const limit = query.limit || 100;
    const offset = query.offset || 0;
    
    const dataQuery = `
      SELECT * FROM preregistration_audit_log 
      ${whereClause} 
      ORDER BY timestamp DESC 
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const dataResult = await pool.query(dataQuery, [...values, limit, offset]);
    
    const events: AuditEvent[] = dataResult.rows.map(row => ({
      auditId: row.audit_id,
      eventType: row.event_type,
      entityType: row.entity_type,
      entityId: row.entity_id,
      userId: row.user_id,
      userRole: row.user_role,
      organizationId: row.organization_id,
      action: row.action,
      description: row.description,
      oldValues: row.old_values,
      newValues: row.new_values,
      metadata: row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      sessionId: row.session_id,
      timestamp: row.timestamp,
      severity: row.severity,
      complianceRelevant: row.compliance_relevant
    }));

    return { events, total };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    startDate: string,
    endDate: string,
    generatedBy: string
  ): Promise<ComplianceReport> {
    const reportId = uuidv4();
    
    // Get all events in period
    const { events } = await this.queryEvents({
      startDate,
      endDate,
      complianceRelevant: true,
      limit: 10000
    });

    // Calculate summary statistics
    const summary = {
      totalEvents: events.length,
      criticalEvents: events.filter(e => e.severity === 'CRITICAL').length,
      complianceEvents: events.filter(e => e.complianceRelevant).length,
      uniqueUsers: new Set(events.map(e => e.userId)).size,
      uniqueExporters: new Set(
        events
          .filter(e => e.entityType === 'exporter_profile')
          .map(e => e.entityId)
      ).size
    };

    // Events by type
    const eventsByType: Record<string, number> = {};
    events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
    });

    // Events by severity
    const eventsBySeverity: Record<string, number> = {};
    events.forEach(event => {
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
    });

    // Top users by activity
    const userActivity: Record<string, number> = {};
    events.forEach(event => {
      userActivity[event.userId] = (userActivity[event.userId] || 0) + 1;
    });
    
    const topUsers = Object.entries(userActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, eventCount]) => ({ userId, eventCount }));

    // Suspicious activities (multiple failures, unauthorized access, etc.)
    const suspiciousActivities = events.filter(event => 
      event.severity === 'CRITICAL' ||
      event.eventType === 'UNAUTHORIZED_ACCESS' ||
      (event.eventType.includes('REJECTED') && event.severity === 'HIGH')
    );

    const report: ComplianceReport = {
      reportId,
      generatedAt: new Date().toISOString(),
      generatedBy,
      period: { startDate, endDate },
      summary,
      eventsByType: eventsByType as Record<AuditEventType, number>,
      eventsBySeverity: eventsBySeverity as Record<AuditSeverity, number>,
      topUsers,
      suspiciousActivities
    };

    // Log report generation
    await this.logEvent({
      eventType: 'DATA_EXPORT',
      entityType: 'system',
      entityId: reportId,
      userId: generatedBy,
      userRole: 'administrator',
      organizationId: 'ecta',
      action: 'GENERATE_COMPLIANCE_REPORT',
      description: `Compliance report generated for period ${startDate} to ${endDate}`,
      metadata: { reportId, eventCount: events.length },
      severity: 'MEDIUM',
      complianceRelevant: true
    });

    return report;
  }

  /**
   * Helper methods
   */
  private getActionFromEventType(eventType: AuditEventType): string {
    const actionMap: Record<AuditEventType, string> = {
      'PROFILE_CREATED': 'CREATE',
      'PROFILE_UPDATED': 'UPDATE',
      'PROFILE_APPROVED': 'APPROVE',
      'PROFILE_REJECTED': 'REJECT',
      'LABORATORY_REGISTERED': 'REGISTER',
      'LABORATORY_CERTIFIED': 'CERTIFY',
      'LABORATORY_REJECTED': 'REJECT',
      'TASTER_REGISTERED': 'REGISTER',
      'TASTER_VERIFIED': 'VERIFY',
      'TASTER_REJECTED': 'REJECT',
      'COMPETENCE_APPLIED': 'APPLY',
      'COMPETENCE_ISSUED': 'ISSUE',
      'COMPETENCE_REJECTED': 'REJECT',
      'COMPETENCE_RENEWED': 'RENEW',
      'LICENSE_APPLIED': 'APPLY',
      'LICENSE_ISSUED': 'ISSUE',
      'LICENSE_REJECTED': 'REJECT',
      'LICENSE_RENEWED': 'RENEW',
      'LICENSE_SUSPENDED': 'SUSPEND',
      'DOCUMENT_UPLOADED': 'UPLOAD',
      'DOCUMENT_VERIFIED': 'VERIFY',
      'DOCUMENT_REJECTED': 'REJECT',
      'VALIDATION_PERFORMED': 'VALIDATE',
      'EXPORT_BLOCKED': 'BLOCK',
      'EXPORT_ALLOWED': 'ALLOW',
      'SYSTEM_ACCESS': 'ACCESS',
      'UNAUTHORIZED_ACCESS': 'UNAUTHORIZED_ACCESS',
      'DATA_EXPORT': 'EXPORT',
      'CONFIGURATION_CHANGE': 'CONFIGURE'
    };
    
    return actionMap[eventType] || eventType;
  }

  private getDescriptionFromEventType(eventType: AuditEventType, entityId: string): string {
    const descriptionMap: Record<AuditEventType, string> = {
      'PROFILE_CREATED': `Exporter profile created for ${entityId}`,
      'PROFILE_UPDATED': `Exporter profile updated for ${entityId}`,
      'PROFILE_APPROVED': `Exporter profile approved for ${entityId}`,
      'PROFILE_REJECTED': `Exporter profile rejected for ${entityId}`,
      'LABORATORY_REGISTERED': `Laboratory registered for ${entityId}`,
      'LABORATORY_CERTIFIED': `Laboratory certified for ${entityId}`,
      'LABORATORY_REJECTED': `Laboratory rejected for ${entityId}`,
      'TASTER_REGISTERED': `Taster registered for ${entityId}`,
      'TASTER_VERIFIED': `Taster verified for ${entityId}`,
      'TASTER_REJECTED': `Taster rejected for ${entityId}`,
      'COMPETENCE_APPLIED': `Competence applied for ${entityId}`,
      'COMPETENCE_ISSUED': `Competence issued for ${entityId}`,
      'COMPETENCE_REJECTED': `Competence rejected for ${entityId}`,
      'COMPETENCE_RENEWED': `Competence renewed for ${entityId}`,
      'LICENSE_APPLIED': `License applied for ${entityId}`,
      'LICENSE_ISSUED': `License issued for ${entityId}`,
      'LICENSE_REJECTED': `License rejected for ${entityId}`,
      'LICENSE_RENEWED': `License renewed for ${entityId}`,
      'LICENSE_SUSPENDED': `License suspended for ${entityId}`,
      'DOCUMENT_UPLOADED': `Document uploaded for ${entityId}`,
      'DOCUMENT_VERIFIED': `Document verified for ${entityId}`,
      'DOCUMENT_REJECTED': `Document rejected for ${entityId}`,
      'VALIDATION_PERFORMED': `Validation performed for ${entityId}`,
      'EXPORT_BLOCKED': `Export blocked for ${entityId}`,
      'EXPORT_ALLOWED': `Export allowed for ${entityId}`,
      'SYSTEM_ACCESS': `User ${entityId} accessed the system`,
      'UNAUTHORIZED_ACCESS': `Unauthorized access attempt by ${entityId}`,
      'DATA_EXPORT': `Data exported by user ${entityId}`,
      'CONFIGURATION_CHANGE': `Configuration changed by ${entityId}`
    };
    
    return descriptionMap[eventType] || `${eventType} for ${entityId}`;
  }

  private getSeverityFromEventType(eventType: AuditEventType): AuditSeverity {
    const severityMap: Record<AuditEventType, AuditSeverity> = {
      'PROFILE_CREATED': 'MEDIUM',
      'PROFILE_UPDATED': 'LOW',
      'PROFILE_APPROVED': 'HIGH',
      'PROFILE_REJECTED': 'HIGH',
      'LABORATORY_REGISTERED': 'MEDIUM',
      'LABORATORY_CERTIFIED': 'HIGH',
      'LABORATORY_REJECTED': 'HIGH',
      'TASTER_REGISTERED': 'MEDIUM',
      'TASTER_VERIFIED': 'MEDIUM',
      'TASTER_REJECTED': 'HIGH',
      'COMPETENCE_APPLIED': 'MEDIUM',
      'COMPETENCE_ISSUED': 'HIGH',
      'COMPETENCE_REJECTED': 'HIGH',
      'COMPETENCE_RENEWED': 'MEDIUM',
      'LICENSE_APPLIED': 'MEDIUM',
      'LICENSE_ISSUED': 'HIGH',
      'LICENSE_REJECTED': 'HIGH',
      'LICENSE_RENEWED': 'MEDIUM',
      'LICENSE_SUSPENDED': 'CRITICAL',
      'DOCUMENT_UPLOADED': 'MEDIUM',
      'DOCUMENT_VERIFIED': 'MEDIUM',
      'DOCUMENT_REJECTED': 'HIGH',
      'VALIDATION_PERFORMED': 'MEDIUM',
      'EXPORT_BLOCKED': 'HIGH',
      'EXPORT_ALLOWED': 'MEDIUM',
      'SYSTEM_ACCESS': 'LOW',
      'UNAUTHORIZED_ACCESS': 'CRITICAL',
      'DATA_EXPORT': 'HIGH',
      'CONFIGURATION_CHANGE': 'CRITICAL'
    };
    
    return severityMap[eventType] || 'MEDIUM';
  }
}

// Singleton instance
let preRegistrationAuditService: PreRegistrationAuditService | null = null;

export const getPreRegistrationAuditService = (): PreRegistrationAuditService => {
  if (!preRegistrationAuditService) {
    preRegistrationAuditService = new PreRegistrationAuditService();
  }
  return preRegistrationAuditService;
};
