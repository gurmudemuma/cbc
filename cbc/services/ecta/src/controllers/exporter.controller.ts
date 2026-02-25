import { Request, Response, NextFunction } from 'express';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('ExporterController');

interface RequestWithUser extends Request {
    user?: {
        id: string;
        username: string;
        organizationId: string;
        role: string;
    };
}

export class ExporterController {
    /**
     * Get exporter qualification status
     * Aggregates status from all steps of the pre-registration process
     */
    public getQualificationStatus = async (
        req: RequestWithUser,
        res: Response,
        _next: NextFunction
    ): Promise<void> => {
        try {
            const user = req.user!;

            // If user is an exporter, specific logic might be needed to find their exporter_id
            // Assuming organizationId is the exporter_id for now, or we look it up via user_id
            let exporterId = user.organizationId;

            // If not found in token, try to find in exporter_profiles by user_id
            // (This depends on how users are linked to exporters, assuming a link exists)

            // Detailed query to get all statuses
            // Note: rejected_at column appears to be missing in some tables, using updated_at or omitting
            const query = `
        SELECT 
          ep.exporter_id, ep.business_name, ep.tin, ep.status as profile_status, ep.rejection_reason as profile_rejection_reason, ep.updated_at as profile_updated_at,
          cl.laboratory_id, cl.laboratory_name, cl.status as lab_status, cl.updated_at as lab_updated_at,
          ct.taster_id, ct.full_name as taster_name, ct.status as taster_status, ct.updated_at as taster_updated_at,
          cc.certificate_id, cc.certificate_number as competence_number, cc.status as competence_status, cc.rejection_reason as competence_rejection_reason, cc.updated_at as competence_updated_at,
          el.license_id, el.license_number, el.status as license_status, el.updated_at as license_updated_at
        FROM exporter_profiles ep
        LEFT JOIN coffee_laboratories cl ON ep.exporter_id = cl.exporter_id
        LEFT JOIN coffee_tasters ct ON ep.exporter_id = ct.exporter_id
        LEFT JOIN competence_certificates cc ON ep.exporter_id = cc.exporter_id
        LEFT JOIN export_licenses el ON ep.exporter_id = el.exporter_id
        WHERE ep.tin = $1 OR ep.exporter_id = $2
      `;

            // We might need to look up by TIN if organizationId is not the exporter_id
            // For now, let's try to query by organizationId acting as exporter_id or TIN

            const result = await pool.query(query, [user.organizationId, user.organizationId]);

            if (result.rows.length === 0) {
                // No profile found, return empty state
                res.json({
                    success: true,
                    data: {
                        profile: null,
                        laboratory: null,
                        taster: null,
                        competenceCertificate: null,
                        exportLicense: null
                    }
                });
                return;
            }

            const row = result.rows[0];

            // Construct the response object matching the frontend expectations
            const statusData = {
                profile: {
                    exporter_id: row.exporter_id,
                    business_name: row.business_name,
                    tin: row.tin,
                    status: row.profile_status,
                    rejection_reason: row.profile_rejection_reason,
                    rejected_at: row.profile_status === 'REJECTED' ? row.profile_updated_at : null
                },
                laboratory: row.laboratory_id ? {
                    laboratory_id: row.laboratory_id,
                    laboratory_name: row.laboratory_name,
                    status: row.lab_status,
                    certified: row.lab_status === 'ACTIVE',
                    rejection_reason: null, // Column missing in DB
                } : null,
                taster: row.taster_id ? {
                    taster_id: row.taster_id,
                    taster_name: row.taster_name,
                    status: row.taster_status,
                    verified: row.taster_status === 'ACTIVE',
                    rejection_reason: null, // Column missing in DB
                } : null,
                competenceCertificate: row.certificate_id ? {
                    certificate_id: row.certificate_id,
                    certificate_number: row.competence_number,
                    status: row.competence_status,
                    valid: row.competence_status === 'ACTIVE',
                    rejection_reason: row.competence_rejection_reason,
                    rejected_at: row.competence_status === 'REJECTED' ? row.competence_updated_at : null
                } : null,
                exportLicense: row.license_id ? {
                    license_id: row.license_id,
                    license_number: row.license_number,
                    status: row.license_status,
                    valid: row.license_status === 'ACTIVE',
                    rejection_reason: null, // Column missing in DB
                } : null,
            };

            res.json({
                success: true,
                data: statusData
            });

        } catch (error: any) {
            logger.error('Failed to get qualification status', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to get qualification status',
                error: error.message,
            });
        }
    };
}
