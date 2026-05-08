/**
 * ECTA Pre-Registration Service
 * Handles exporter qualification and validation
 */

import {
  ExporterProfile,
  CoffeeLaboratory,
  CoffeeTaster,
  CompetenceCertificate,
  ExportLicense,
  ExporterValidation,
  BusinessType,
} from '../models/ecta-preregistration.model';
import { EctaPreRegistrationRepository } from '../database/repositories/ecta-preregistration.repository';
import { getPool } from '../database/pool';

const pool = getPool();

export class EctaPreRegistrationService {
  private static instance: EctaPreRegistrationService;
  private repository: EctaPreRegistrationRepository;

  private constructor() {
    this.repository = new EctaPreRegistrationRepository(pool);
  }

  public static getInstance(): EctaPreRegistrationService {
    if (!EctaPreRegistrationService.instance) {
      EctaPreRegistrationService.instance = new EctaPreRegistrationService();
    }
    return EctaPreRegistrationService.instance;
  }

  /**
   * Get minimum capital requirement based on business type
   * Based on Directive 1106/2025
   */
  public getMinimumCapitalRequirement(businessType: BusinessType): number {
    const requirements: Record<BusinessType, number> = {
      PRIVATE: 15_000_000, // ETB 15 million
      TRADE_ASSOCIATION: 20_000_000, // ETB 20 million
      JOINT_STOCK: 20_000_000, // ETB 20 million
      LLC: 20_000_000, // ETB 20 million
      FARMER: 0, // Exempt
    };

    return requirements[businessType];
  }

  /**
   * Validate if exporter meets all requirements to create export requests
   */
  public async validateExporter(exporterId: string): Promise<ExporterValidation> {
    const validation: ExporterValidation = {
      isValid: false,
      exporterId,
      hasValidProfile: false,
      hasMinimumCapital: false,
      hasCertifiedLaboratory: false,
      hasQualifiedTaster: false,
      hasCompetenceCertificate: false,
      hasExportLicense: false,
      issues: [],
      requiredActions: [],
    };

    // Check 1: Exporter Profile
    const profile = await this.getExporterProfile(exporterId);
    if (!profile) {
      validation.issues.push('Exporter profile not found');
      validation.requiredActions.push('Complete exporter registration');
      return validation;
    }

    validation.profile = profile;
    // Auto-validation system handles profile approval and capital verification automatically
    // Profile is valid if status is ACTIVE or FULLY_QUALIFIED
    validation.hasValidProfile = profile.status === 'ACTIVE' || profile.status === 'FULLY_QUALIFIED';

    // Check 2: Minimum Capital
    // Auto-validation system automatically verifies capital when amount meets requirement
    const requiredCapital = this.getMinimumCapitalRequirement(profile.businessType);
    validation.hasMinimumCapital = 
      profile.businessType === 'FARMER' || 
      (profile.capitalVerified && profile.minimumCapital >= requiredCapital);

    // Check 3: ECTA-Certified Laboratory (not required for farmer-exporters)
    if (profile.businessType !== 'FARMER') {
      const laboratory = await this.getExporterLaboratory(exporterId);
      if (!laboratory) {
        validation.issues.push('No ECTA-certified laboratory found');
        validation.requiredActions.push('Establish and certify coffee laboratory with ECTA');
      } else {
        validation.laboratory = laboratory;
        const labValid = laboratory.status === 'ACTIVE' && 
                        new Date(laboratory.expiryDate) > new Date();
        validation.hasCertifiedLaboratory = labValid;

        if (!labValid) {
          validation.issues.push(`Laboratory certification ${laboratory.status.toLowerCase()}`);
          validation.requiredActions.push('Renew laboratory certification with ECTA');
        }
      }
    } else {
      validation.hasCertifiedLaboratory = true; // Exempt for farmers
    }

    // Check 4: Qualified Taster (not required for farmer-exporters)
    if (profile.businessType !== 'FARMER') {
      const taster = await this.getExporterTaster(exporterId);
      if (!taster) {
        validation.issues.push('No qualified coffee taster found');
        validation.requiredActions.push('Hire qualified taster with valid proficiency certificate');
      } else {
        validation.taster = taster;
        const tasterValid = taster.status === 'ACTIVE' && 
                           new Date(taster.certificateExpiryDate) > new Date() &&
                           taster.isExclusiveEmployee;
        validation.hasQualifiedTaster = tasterValid;

        if (!tasterValid) {
          validation.issues.push('Taster qualification invalid or expired');
          validation.requiredActions.push('Ensure taster has valid proficiency certificate');
        }
      }
    } else {
      validation.hasQualifiedTaster = true; // Exempt for farmers
    }

    // Check 5: Competence Certificate
    const competenceCert = await this.getCompetenceCertificate(exporterId);
    if (!competenceCert) {
      validation.issues.push('No competence certificate found');
      validation.requiredActions.push('Apply for competence certificate from ECTA');
    } else {
      validation.competenceCertificate = competenceCert;
      const certValid = competenceCert.status === 'ACTIVE' && 
                       new Date(competenceCert.expiryDate) > new Date();
      validation.hasCompetenceCertificate = certValid;

      if (!certValid) {
        validation.issues.push(`Competence certificate ${competenceCert.status.toLowerCase()}`);
        validation.requiredActions.push('Renew competence certificate with ECTA');
      }
    }

    // Check 6: Export License
    const exportLicense = await this.getExportLicense(exporterId);
    if (!exportLicense) {
      validation.issues.push('No export license found');
      validation.requiredActions.push('Apply for export license from ECTA');
    } else {
      validation.exportLicense = exportLicense;
      const licenseValid = exportLicense.status === 'ACTIVE' && 
                          new Date(exportLicense.expiryDate) > new Date();
      validation.hasExportLicense = licenseValid;

      if (!licenseValid) {
        validation.issues.push(`Export license ${exportLicense.status.toLowerCase()}`);
        validation.requiredActions.push('Renew export license with ECTA');
      }
    }

    // Final validation
    validation.isValid = 
      validation.hasValidProfile &&
      validation.hasMinimumCapital &&
      validation.hasCertifiedLaboratory &&
      validation.hasQualifiedTaster &&
      validation.hasCompetenceCertificate &&
      validation.hasExportLicense;

    // Auto-update exporter status to "Fully Qualified" if all requirements are met
    if (validation.isValid && profile.status !== 'FULLY_QUALIFIED') {
      try {
        await this.updateExporterStatus(exporterId, 'FULLY_QUALIFIED');
        // Update the profile object to reflect the new status
        validation.profile = { ...profile, status: 'FULLY_QUALIFIED' };
      } catch (error) {
        console.error('Failed to update exporter status to FULLY_QUALIFIED:', error);
      }
    }

    return validation;
  }

  /**
   * Check if exporter can create export request
   */
  public async canCreateExportRequest(exporterId: string): Promise<{
    allowed: boolean;
    reason?: string;
    requiredActions?: string[];
  }> {
    const validation = await this.validateExporter(exporterId);

    if (validation.isValid) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: validation.issues.join('; '),
      requiredActions: validation.requiredActions,
    };
  }

  /**
   * Validate export permit requirements
   */
  public async validateExportPermitRequirements(data: {
    exporterId: string;
    lotId: string;
    contractId: string;
    inspectionId: string;
  }): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check exporter qualification
    const exporterValidation = await this.validateExporter(data.exporterId);
    if (!exporterValidation.isValid) {
      issues.push(...exporterValidation.issues);
    }

    // Check lot exists and belongs to exporter
    const lot = await this.getCoffeeLot(data.lotId);
    if (!lot) {
      issues.push('Coffee lot not found');
    } else if (lot.purchasedBy !== data.exporterId) {
      issues.push('Coffee lot does not belong to this exporter');
    } else if (lot.status !== 'INSPECTED') {
      issues.push('Coffee lot must be inspected before export permit');
    }

    // Check contract is approved
    const contract = await this.getSalesContract(data.contractId);
    if (!contract) {
      issues.push('Sales contract not found');
    } else if (contract.exporterId !== data.exporterId) {
      issues.push('Sales contract does not belong to this exporter');
    } else if (contract.status !== 'APPROVED') {
      issues.push('Sales contract must be approved by ECTA');
    }

    // Check quality inspection passed
    const inspection = await this.getQualityInspection(data.inspectionId);
    if (!inspection) {
      issues.push('Quality inspection not found');
    } else if (inspection.exporterId !== data.exporterId) {
      issues.push('Quality inspection does not belong to this exporter');
    } else if (!inspection.passed) {
      issues.push('Quality inspection did not pass');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  // Database methods using repository
  private async getExporterProfile(exporterId: string): Promise<ExporterProfile | null> {
    return await this.repository.getExporterProfileById(exporterId);
  }

  private async getExporterLaboratory(exporterId: string): Promise<CoffeeLaboratory | null> {
    return await this.repository.getLaboratoryByExporterId(exporterId);
  }

  private async getExporterTaster(exporterId: string): Promise<CoffeeTaster | null> {
    return await this.repository.getTasterByExporterId(exporterId);
  }

  private async getCompetenceCertificate(exporterId: string): Promise<CompetenceCertificate | null> {
    return await this.repository.getCompetenceCertificateByExporterId(exporterId);
  }

  private async getExportLicense(exporterId: string): Promise<ExportLicense | null> {
    return await this.repository.getExportLicenseByExporterId(exporterId);
  }

  private async getCoffeeLot(lotId: string): Promise<any> {
    return await this.repository.getCoffeeLotById(lotId);
  }

  private async getSalesContract(contractId: string): Promise<any> {
    return await this.repository.getSalesContractById(contractId);
  }

  private async getQualityInspection(inspectionId: string): Promise<any> {
    return await this.repository.getQualityInspectionById(inspectionId);
  }

  /**
   * Update exporter status
   */
  private async updateExporterStatus(exporterId: string, status: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE exporter_profiles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE exporter_id = $2',
        [status, exporterId]
      );
    } finally {
      client.release();
    }
  }
}

export const ectaPreRegistrationService = EctaPreRegistrationService.getInstance();
