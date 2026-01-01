import { Request, Response, NextFunction } from 'express';
import { EctaPreRegistrationRepository } from '@shared/database/repositories/ecta-preregistration.repository';
import { ectaPreRegistrationService } from '@shared/services/ecta-preregistration.service';
import { getPool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const pool = getPool();
const logger = createLogger('DashboardController');

/**
 * Dashboard Controller
 * Provides unified 360-degree view of exporter data
 */
export class DashboardController {
    private repository: EctaPreRegistrationRepository;

    constructor() {
        this.repository = new EctaPreRegistrationRepository(pool);
    }

    /**
     * Get complete exporter dashboard (360-degree view)
     * Fetches all related entities in a single call
     */
    public getExporterDashboard = async (
        req: Request,
        res: Response,
        _next: NextFunction
    ): Promise<void> => {
        try {
            const { exporterId } = req.params;

            if (!exporterId) {
                res.status(400).json({
                    success: false,
                    message: 'Exporter ID is required',
                });
                return;
            }

            // Fetch all related data
            const profile = await this.repository.getExporterProfileById(exporterId);

            if (!profile) {
                res.status(404).json({
                    success: false,
                    message: 'Exporter profile not found',
                });
                return;
            }

            // Fetch all related entities
            const [laboratory, taster, competenceCertificate, exportLicense, validation] = await Promise.all([
                this.repository.getLaboratoryByExporterId(exporterId),
                this.repository.getTasterByExporterId(exporterId),
                this.repository.getCompetenceCertificateByExporterId(exporterId),
                this.repository.getExportLicenseByExporterId(exporterId),
                ectaPreRegistrationService.validateExporter(exporterId),
            ]);

            // Build 360-degree view
            const dashboard = {
                // Core Identity
                identity: {
                    exporterId: profile.exporterId,
                    businessName: profile.businessName,
                    tin: profile.tin,
                    registrationNumber: profile.registrationNumber,
                    businessType: profile.businessType,
                },

                // Contact Information
                contact: {
                    contactPerson: profile.contactPerson,
                    email: profile.email,
                    phone: profile.phone,
                    officeAddress: profile.officeAddress,
                    city: profile.city,
                    region: profile.region,
                },

                // Compliance Status (Professional View)
                compliance: {
                    profileStatus: profile.status,
                    profileApproved: profile.status === 'ACTIVE',
                    capitalVerified: profile.capitalVerified,

                    laboratoryStatus: laboratory?.status || 'MISSING',
                    laboratoryApproved: laboratory?.status === 'ACTIVE',

                    tasterStatus: taster?.status || 'MISSING',
                    tasterApproved: taster?.status === 'ACTIVE',

                    competenceStatus: competenceCertificate?.status || 'MISSING',
                    competenceApproved: competenceCertificate?.status === 'ACTIVE',

                    licenseStatus: exportLicense?.status || 'MISSING',
                    licenseApproved: exportLicense?.status === 'ACTIVE',

                    // Overall qualification
                    isFullyQualified: validation.isValid,
                },

                // Official Documents (System-Generated IDs)
                documents: {
                    registrationNumber: profile.registrationNumber,
                    laboratoryCertificationNumber: laboratory?.certificationNumber || null,
                    tasterCertificateNumber: taster?.proficiencyCertificateNumber || null,
                    competenceCertificateNumber: competenceCertificate?.certificateNumber || null,
                    exportLicenseNumber: exportLicense?.licenseNumber || null,
                    eicRegistrationNumber: exportLicense?.eicRegistrationNumber || null,
                },

                // Detailed Entities (for drill-down)
                details: {
                    profile,
                    laboratory,
                    taster,
                    competenceCertificate,
                    exportLicense,
                },

                // Validation & Required Actions
                validation: {
                    isValid: validation.isValid,
                    issues: validation.issues,
                    requiredActions: validation.requiredActions,
                },

                // Metadata
                metadata: {
                    lastUpdated: profile.updatedAt,
                    createdAt: profile.createdAt,
                },
            };

            logger.info('Dashboard fetched successfully', { exporterId });

            res.json({
                success: true,
                data: dashboard,
            });
        } catch (error: any) {
            logger.error('Failed to fetch dashboard', { error: error.message, exporterId: req.params.exporterId });
            res.status(500).json({
                success: false,
                message: 'Failed to fetch exporter dashboard',
                error: error.message,
            });
        }
    };

    /**
     * Get dashboard by TIN (alternative lookup)
     */
    public getExporterDashboardByTin = async (
        req: Request,
        res: Response,
        _next: NextFunction
    ): Promise<void> => {
        try {
            const { tin } = req.params;

            if (!tin) {
                res.status(400).json({
                    success: false,
                    message: 'TIN is required',
                });
                return;
            }

            // Find exporter by TIN
            const profile = await this.repository.getExporterProfileByTin(tin);

            if (!profile) {
                res.status(404).json({
                    success: false,
                    message: 'Exporter not found with provided TIN',
                });
                return;
            }

            // Redirect to main dashboard endpoint
            req.params.exporterId = profile.exporterId;
            return this.getExporterDashboard(req, res, _next);
        } catch (error: any) {
            logger.error('Failed to fetch dashboard by TIN', { error: error.message, tin: req.params.tin });
            res.status(500).json({
                success: false,
                message: 'Failed to fetch exporter dashboard',
                error: error.message,
            });
        }
    };

    /**
     * Get global statistics for ECTA officials
     * Aggregates key metrics across the system
     */
    public getGlobalStats = async (
        _req: Request,
        res: Response,
        _next: NextFunction
    ): Promise<void> => {
        try {
            // Run aggregations in parallel
            const queries = {
                exporters: `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'PENDING_APPROVAL' THEN 1 END) as pending
                    FROM exporter_profiles
                `,
                contracts: `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
                        COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN contract_value ELSE 0 END), 0) as active_value
                    FROM sales_contracts
                `,
                licenses: `
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending
                    FROM export_licenses
                `
            };

            const [exportersRes, contractsRes, licensesRes] = await Promise.all([
                pool.query(queries.exporters),
                pool.query(queries.contracts),
                pool.query(queries.licenses)
            ]);

            const stats = {
                exporters: {
                    total: parseInt(exportersRes.rows[0].total, 10),
                    pending: parseInt(exportersRes.rows[0].pending, 10)
                },
                contracts: {
                    total: parseInt(contractsRes.rows[0].total, 10),
                    pending: parseInt(contractsRes.rows[0].pending, 10),
                    activeValue: parseFloat(contractsRes.rows[0].active_value)
                },
                licenses: {
                    total: parseInt(licensesRes.rows[0].total, 10),
                    pending: parseInt(licensesRes.rows[0].pending, 10)
                }
            };

            res.json({
                success: true,
                data: stats,
            });
        } catch (error: any) {
            logger.error('Failed to fetch global dashboard stats', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats',
                error: error.message,
            });
        }
    };
}
