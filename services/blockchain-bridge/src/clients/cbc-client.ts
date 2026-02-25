/**
 * CBC Client
 * Wrapper for CBC PostgreSQL operations
 */

import axios from 'axios';
import pool from '../config/database';
import { logger } from '../utils/logger';

const ECTA_API_URL = process.env.ECTA_API_URL || 'http://localhost:3003';

export class CBCClient {
  static async healthCheck(): Promise<void> {
    const response = await axios.get(`${ECTA_API_URL}/health`);
    if (response.status !== 200) {
      throw new Error('CBC health check failed');
    }
  }

  static async createExporterProfile(data: any): Promise<void> {
    await pool.query(
      `INSERT INTO exporter_profiles (exporter_id, user_id, business_name, tin, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (exporter_id) DO NOTHING`,
      [data.exporterId, data.userId, data.businessName, data.tin, data.status, data.createdAt, data.createdAt]
    );
  }

  static async updateExporterProfile(exporterId: string, updates: any): Promise<void> {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(updates);
    
    await pool.query(
      `UPDATE exporter_profiles SET ${fields}, updated_at = $${values.length + 2} WHERE exporter_id = $1`,
      [exporterId, ...values, new Date()]
    );
  }

  static async getAllExporters(): Promise<any[]> {
    const result = await pool.query('SELECT * FROM exporter_profiles');
    return result.rows;
  }

  static async createLicense(data: any): Promise<void> {
    await pool.query(
      `INSERT INTO export_licenses (license_id, exporter_id, license_number, issue_date, expiry_date, status, issued_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [data.licenseId, data.exporterId, data.licenseNumber, data.issueDate, data.expiryDate, data.status, data.issuedBy, new Date()]
    );
  }

  static async updateLicenseStatus(licenseId: string, updates: any): Promise<void> {
    await pool.query(
      `UPDATE export_licenses SET status = $2, revoked_at = $3, revocation_reason = $4, updated_at = $5 WHERE license_id = $1`,
      [licenseId, updates.status, updates.revokedAt, updates.revocationReason, new Date()]
    );
  }

  static async getAllLicenses(): Promise<any[]> {
    const result = await pool.query('SELECT * FROM export_licenses');
    return result.rows;
  }

  static async createCertificateRequest(data: any): Promise<void> {
    await pool.query(
      `INSERT INTO quality_certificates (certificate_id, shipment_id, exporter_id, certificate_type, status, requested_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [data.certificateId, data.shipmentId, data.exporterId, data.certificateType, data.status, data.requestedAt, new Date()]
    );
  }

  static async updateCertificateStatus(certificateId: string, updates: any): Promise<void> {
    await pool.query(
      `UPDATE quality_certificates SET status = $2, certificate_number = $3, issued_at = $4, issued_by = $5, updated_at = $6 WHERE certificate_id = $1`,
      [certificateId, updates.status, updates.certificateNumber, updates.issuedAt, updates.issuedBy, new Date()]
    );
  }

  static async getAllCertificates(): Promise<any[]> {
    const result = await pool.query('SELECT * FROM quality_certificates');
    return result.rows;
  }

  static async createShipment(data: any): Promise<void> {
    await pool.query(
      `INSERT INTO shipments (shipment_id, exporter_id, status, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (shipment_id) DO NOTHING`,
      [data.shipmentId, data.exporterId, data.status, data.createdAt]
    );
  }

  static async updateShipmentStatus(shipmentId: string, updates: any): Promise<void> {
    const fields = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = Object.values(updates);
    
    await pool.query(
      `UPDATE shipments SET ${fields}, updated_at = $${values.length + 2} WHERE shipment_id = $1`,
      [shipmentId, ...values, new Date()]
    );
  }

  static async getAllShipments(): Promise<any[]> {
    const result = await pool.query('SELECT * FROM shipments');
    return result.rows;
  }

  static async createESWSubmission(data: any): Promise<void> {
    await pool.query(
      `INSERT INTO esw_submissions (submission_id, export_id, exporter_id, status, submitted_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [data.submissionId, data.exportId, data.exporterId, data.status, data.submittedAt, new Date()]
    );
  }

  static async updateESWStatus(submissionId: string, updates: any): Promise<void> {
    await pool.query(
      `UPDATE esw_submissions SET status = $2, approved_by = $3, approved_at = $4, updated_at = $5 WHERE submission_id = $1`,
      [submissionId, updates.status, updates.approvedBy, updates.approvedAt, new Date()]
    );
  }

  static async updateCustomsDeclaration(declarationId: string, updates: any): Promise<void> {
    await pool.query(
      `UPDATE customs_declarations SET status = $2, cleared_by = $3, cleared_at = $4, updated_at = $5 WHERE declaration_id = $1`,
      [declarationId, updates.status, updates.clearedBy, updates.clearedAt, new Date()]
    );
  }

  static async updateEntity(type: string, entityId: string, updates: any): Promise<void> {
    // Generic update method for reconciliation
    const tableMap: Record<string, string> = {
      'exporter_status': 'exporter_profiles',
      'license_status': 'export_licenses',
      'certificate_status': 'quality_certificates',
      'shipment_status': 'shipments'
    };

    const table = tableMap[type];
    if (!table) {
      throw new Error(`Unknown entity type: ${type}`);
    }

    const idColumn = type.includes('exporter') ? 'exporter_id' : 
                     type.includes('license') ? 'license_id' :
                     type.includes('certificate') ? 'certificate_id' : 'shipment_id';

    await pool.query(
      `UPDATE ${table} SET status = $2, updated_at = $3 WHERE ${idColumn} = $1`,
      [entityId, updates.status, new Date()]
    );
  }
}
