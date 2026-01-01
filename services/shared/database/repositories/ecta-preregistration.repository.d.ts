/**
 * ECTA Pre-Registration Repository
 * Database access layer for ECTA pre-registration system
 */
import { Pool } from 'pg';
import { ExporterProfile, CoffeeLaboratory, CoffeeTaster, CompetenceCertificate, ExportLicense, CoffeeLot, QualityInspection, SalesContract } from '../../models/ecta-preregistration.model';
export declare class EctaPreRegistrationRepository {
    private pool;
    constructor(pool: Pool);
    createExporterProfile(profile: Omit<ExporterProfile, 'exporterId' | 'createdAt' | 'updatedAt'>): Promise<ExporterProfile>;
    getExporterProfileById(exporterId: string): Promise<ExporterProfile | null>;
    getExporterProfileByUserId(userId: string): Promise<ExporterProfile | null>;
    getAllExporterProfiles(): Promise<ExporterProfile[]>;
    getPendingExporterProfiles(): Promise<ExporterProfile[]>;
    updateExporterProfileStatus(exporterId: string, status: string, approvedBy?: string, rejectionReason?: string): Promise<void>;
    createLaboratory(laboratory: Omit<CoffeeLaboratory, 'laboratoryId' | 'createdAt' | 'updatedAt'>): Promise<CoffeeLaboratory>;
    getLaboratoryByExporterId(exporterId: string): Promise<CoffeeLaboratory | null>;
    getPendingLaboratories(): Promise<CoffeeLaboratory[]>;
    certifyLaboratory(laboratoryId: string, certificationNumber: string, certifiedDate: string, expiryDate: string, inspectedBy: string): Promise<void>;
    createTaster(taster: Omit<CoffeeTaster, 'tasterId' | 'createdAt' | 'updatedAt'>): Promise<CoffeeTaster>;
    getTasterByExporterId(exporterId: string): Promise<CoffeeTaster | null>;
    createCompetenceCertificate(certificate: Omit<CompetenceCertificate, 'certificateId' | 'createdAt' | 'updatedAt'>): Promise<CompetenceCertificate>;
    getCompetenceCertificateByExporterId(exporterId: string): Promise<CompetenceCertificate | null>;
    getPendingCompetenceCertificates(): Promise<CompetenceCertificate[]>;
    createLicenseApplication(application: {
        exporterId: string;
        eicRegistrationNumber: string;
        requestedCoffeeTypes: string[];
        requestedOrigins: string[];
        status: string;
        applicationDate: string;
        applicantUserId: string;
    }): Promise<any>;
    createExportLicense(license: Omit<ExportLicense, 'licenseId' | 'createdAt' | 'updatedAt'>): Promise<ExportLicense>;
    getExportLicenseByExporterId(exporterId: string): Promise<ExportLicense | null>;
    getPendingExportLicenses(): Promise<ExportLicense[]>;
    createCoffeeLot(lot: Omit<CoffeeLot, 'lotId' | 'createdAt' | 'updatedAt'>): Promise<CoffeeLot>;
    getCoffeeLotById(lotId: string): Promise<CoffeeLot | null>;
    getCoffeeLotByEcxNumber(ecxLotNumber: string): Promise<CoffeeLot | null>;
    createQualityInspection(inspection: Omit<QualityInspection, 'inspectionId' | 'createdAt' | 'updatedAt'>): Promise<QualityInspection>;
    getQualityInspectionById(inspectionId: string): Promise<QualityInspection | null>;
    createSalesContract(contract: Omit<SalesContract, 'contractId' | 'createdAt' | 'updatedAt'>): Promise<SalesContract>;
    getSalesContractById(contractId: string): Promise<SalesContract | null>;
    private mapExporterProfile;
    private mapLaboratory;
    private mapTaster;
    private mapCompetenceCertificate;
    private mapExportLicense;
    private mapCoffeeLot;
    private mapQualityInspection;
    private mapSalesContract;
}
//# sourceMappingURL=ecta-preregistration.repository.d.ts.map