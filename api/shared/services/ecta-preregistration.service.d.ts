/**
 * ECTA Pre-Registration Service
 * Handles exporter qualification and validation
 */
import { ExporterValidation, BusinessType } from '../models/ecta-preregistration.model';
export declare class EctaPreRegistrationService {
    private static instance;
    private repository;
    private constructor();
    static getInstance(): EctaPreRegistrationService;
    /**
     * Get minimum capital requirement based on business type
     * Based on Directive 1106/2025
     */
    getMinimumCapitalRequirement(businessType: BusinessType): number;
    /**
     * Validate if exporter meets all requirements to create export requests
     */
    validateExporter(exporterId: string): Promise<ExporterValidation>;
    /**
     * Check if exporter can create export request
     */
    canCreateExportRequest(exporterId: string): Promise<{
        allowed: boolean;
        reason?: string;
        requiredActions?: string[];
    }>;
    /**
     * Validate export permit requirements
     */
    validateExportPermitRequirements(data: {
        exporterId: string;
        lotId: string;
        contractId: string;
        inspectionId: string;
    }): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    private getExporterProfile;
    private getExporterLaboratory;
    private getExporterTaster;
    private getCompetenceCertificate;
    private getExportLicense;
    private getCoffeeLot;
    private getSalesContract;
    private getQualityInspection;
}
export declare const ectaPreRegistrationService: EctaPreRegistrationService;
//# sourceMappingURL=ecta-preregistration.service.d.ts.map