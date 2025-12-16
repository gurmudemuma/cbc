import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

/**
 * ECTA Compliance Repository
 * Handles all compliance-related database operations
 */
export class ECTAComplianceRepository {
  constructor(private pool: Pool) {}

  // ============================================================================
  // QUARTERLY REPORTS
  // ============================================================================

  /**
   * Submit quarterly report
   */
  async submitQuarterlyReport(
    exporterId: string,
    quarter: number,
    year: number,
    totalExports: number,
    destinationCountries: string[],
    averagePrices: number,
    qualityMetrics: any,
    issues: string,
    submittedBy: string
  ): Promise<any> {
    const reportId = uuidv4();
    const query = `
      INSERT INTO quarterly_reports (
        report_id, exporter_id, quarter, year, total_exports,
        destination_countries, average_prices, quality_metrics,
        issues, submitted_by, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      reportId,
      exporterId,
      quarter,
      year,
      totalExports,
      destinationCountries,
      averagePrices,
      JSON.stringify(qualityMetrics),
      issues,
      submittedBy,
    ]);

    return result.rows[0];
  }

  /**
   * Get quarterly reports for exporter
   */
  async getQuarterlyReports(exporterId: string): Promise<any[]> {
    const query = `
      SELECT * FROM quarterly_reports
      WHERE exporter_id = $1
      ORDER BY year DESC, quarter DESC;
    `;

    const result = await this.pool.query(query, [exporterId]);
    return result.rows;
  }

  /**
   * Get quarterly report by ID
   */
  async getQuarterlyReportById(reportId: string): Promise<any> {
    const query = `
      SELECT * FROM quarterly_reports
      WHERE report_id = $1;
    `;

    const result = await this.pool.query(query, [reportId]);
    return result.rows[0];
  }

  // ============================================================================
  // ANNUAL AUDITS
  // ============================================================================

  /**
   * Schedule annual audit
   */
  async scheduleAnnualAudit(
    exporterId: string,
    auditYear: number,
    scheduledDate: Date,
    scheduledBy: string
  ): Promise<any> {
    const auditId = uuidv4();
    const query = `
      INSERT INTO annual_audits (
        audit_id, exporter_id, audit_year, scheduled_date,
        status, scheduled_by, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      auditId,
      exporterId,
      auditYear,
      scheduledDate,
      'SCHEDULED',
      scheduledBy,
    ]);

    return result.rows[0];
  }

  /**
   * Complete annual audit
   */
  async completeAnnualAudit(
    auditId: string,
    completedDate: Date,
    completedBy: string,
    findings: any
  ): Promise<any> {
    const query = `
      UPDATE annual_audits
      SET status = $1, completed_date = $2, completed_by = $3,
          findings = $4, completed_at = NOW(), updated_at = NOW()
      WHERE audit_id = $5
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      'COMPLETED',
      completedDate,
      completedBy,
      JSON.stringify(findings),
      auditId,
    ]);

    return result.rows[0];
  }

  /**
   * Get annual audits for exporter
   */
  async getAnnualAudits(exporterId: string): Promise<any[]> {
    const query = `
      SELECT * FROM annual_audits
      WHERE exporter_id = $1
      ORDER BY audit_year DESC;
    `;

    const result = await this.pool.query(query, [exporterId]);
    return result.rows;
  }

  /**
   * Get annual audit by ID
   */
  async getAnnualAuditById(auditId: string): Promise<any> {
    const query = `
      SELECT * FROM annual_audits
      WHERE audit_id = $1;
    `;

    const result = await this.pool.query(query, [auditId]);
    return result.rows[0];
  }

  // ============================================================================
  // COMPLIANCE VIOLATIONS
  // ============================================================================

  /**
   * Record compliance violation
   */
  async recordViolation(
    exporterId: string,
    category: string,
    description: string,
    penaltyAmount: number,
    recordedBy: string
  ): Promise<any> {
    const violationId = uuidv4();
    const query = `
      INSERT INTO compliance_violations (
        violation_id, exporter_id, category, description,
        penalty_amount, status, recorded_by, recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      violationId,
      exporterId,
      category,
      description,
      penaltyAmount,
      'ACTIVE',
      recordedBy,
    ]);

    return result.rows[0];
  }

  /**
   * Resolve violation
   */
  async resolveViolation(violationId: string, resolvedBy: string): Promise<any> {
    const query = `
      UPDATE compliance_violations
      SET status = $1, resolved_by = $2, resolved_at = NOW(),
          updated_at = NOW()
      WHERE violation_id = $3
      RETURNING *;
    `;

    const result = await this.pool.query(query, ['RESOLVED', resolvedBy, violationId]);

    return result.rows[0];
  }

  /**
   * Get violations for exporter
   */
  async getViolations(exporterId: string): Promise<any[]> {
    const query = `
      SELECT * FROM compliance_violations
      WHERE exporter_id = $1
      ORDER BY recorded_at DESC;
    `;

    const result = await this.pool.query(query, [exporterId]);
    return result.rows;
  }

  /**
   * Get violations by category
   */
  async getViolationsByCategory(exporterId: string, category: string): Promise<any[]> {
    const query = `
      SELECT * FROM compliance_violations
      WHERE exporter_id = $1 AND category = $2
      ORDER BY recorded_at DESC;
    `;

    const result = await this.pool.query(query, [exporterId, category]);
    return result.rows;
  }

  /**
   * Get active violations
   */
  async getActiveViolations(exporterId: string): Promise<any[]> {
    const query = `
      SELECT * FROM compliance_violations
      WHERE exporter_id = $1 AND status = $2
      ORDER BY recorded_at DESC;
    `;

    const result = await this.pool.query(query, [exporterId, 'ACTIVE']);
    return result.rows;
  }

  // ============================================================================
  // FACILITY INSPECTIONS
  // ============================================================================

  /**
   * Create facility inspection record
   */
  async createFacilityInspection(
    exporterId: string,
    stage: number,
    inspectionDate: Date,
    inspectorName: string,
    warehouseLocation: string,
    storageCapacity: number
  ): Promise<any> {
    const inspectionId = uuidv4();
    const query = `
      INSERT INTO facility_inspections (
        inspection_id, exporter_id, inspection_stage, inspection_date,
        inspector_name, warehouse_location, storage_capacity, scheduled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      inspectionId,
      exporterId,
      stage,
      inspectionDate,
      inspectorName,
      warehouseLocation,
      storageCapacity,
    ]);

    return result.rows[0];
  }

  /**
   * Complete facility inspection
   */
  async completeFacilityInspection(
    inspectionId: string,
    result: string,
    inspectionReportCid: string,
    findings: any
  ): Promise<any> {
    const query = `
      UPDATE facility_inspections
      SET inspection_result = $1, inspection_report_cid = $2,
          findings = $3, completed_at = NOW(), updated_at = NOW()
      WHERE inspection_id = $4
      RETURNING *;
    `;

    const dbResult = await this.pool.query(query, [
      result,
      inspectionReportCid,
      JSON.stringify(findings),
      inspectionId,
    ]);

    return dbResult.rows[0];
  }

  /**
   * Get facility inspections for exporter
   */
  async getFacilityInspections(exporterId: string): Promise<any[]> {
    const query = `
      SELECT * FROM facility_inspections
      WHERE exporter_id = $1
      ORDER BY inspection_date DESC;
    `;

    const result = await this.pool.query(query, [exporterId]);
    return result.rows;
  }

  /**
   * Get facility inspections by stage
   */
  async getFacilityInspectionsByStage(exporterId: string, stage: number): Promise<any[]> {
    const query = `
      SELECT * FROM facility_inspections
      WHERE exporter_id = $1 AND inspection_stage = $2
      ORDER BY inspection_date DESC;
    `;

    const result = await this.pool.query(query, [exporterId, stage]);
    return result.rows;
  }

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  /**
   * Log action to audit trail
   */
  async logAction(
    exporterId: string,
    action: string,
    stage: number | null,
    oldStatus: string | null,
    newStatus: string | null,
    actor: string,
    actorRole: string,
    details: any
  ): Promise<any> {
    const logId = uuidv4();
    const query = `
      INSERT INTO ecta_audit_log (
        log_id, exporter_id, action, stage, old_status, new_status,
        actor, actor_role, details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      logId,
      exporterId,
      action,
      stage,
      oldStatus,
      newStatus,
      actor,
      actorRole,
      JSON.stringify(details),
    ]);

    return result.rows[0];
  }

  /**
   * Get audit log for exporter
   */
  async getAuditLog(exporterId: string): Promise<any[]> {
    const query = `
      SELECT * FROM ecta_audit_log
      WHERE exporter_id = $1
      ORDER BY created_at DESC;
    `;

    const result = await this.pool.query(query, [exporterId]);
    return result.rows;
  }

  /**
   * Get audit log by action
   */
  async getAuditLogByAction(exporterId: string, action: string): Promise<any[]> {
    const query = `
      SELECT * FROM ecta_audit_log
      WHERE exporter_id = $1 AND action = $2
      ORDER BY created_at DESC;
    `;

    const result = await this.pool.query(query, [exporterId, action]);
    return result.rows;
  }
}
