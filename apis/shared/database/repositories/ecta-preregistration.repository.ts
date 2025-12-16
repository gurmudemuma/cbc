/**
 * ECTA Pre-Registration Repository
 * Database access layer for ECTA pre-registration system
 */

import { Pool } from 'pg';
import {
  ExporterProfile,
  CoffeeLaboratory,
  CoffeeTaster,
  CompetenceCertificate,
  ExportLicense,
  CoffeeLot,
  QualityInspection,
  SalesContract,
} from '../../models/ecta-preregistration.model';

export class EctaPreRegistrationRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  // ============================================================================
  // EXPORTER PROFILES
  // ============================================================================

  async createExporterProfile(
    profile: Omit<ExporterProfile, 'exporterId' | 'createdAt' | 'updatedAt'>
  ): Promise<ExporterProfile> {
    const query = `
      INSERT INTO exporter_profiles (
        user_id, business_name, tin, registration_number, business_type,
        minimum_capital, capital_verified, capital_verification_date, capital_proof_document,
        office_address, city, region, contact_person, email, phone, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const values = [
      profile.userId,
      profile.businessName,
      profile.tin,
      profile.registrationNumber,
      profile.businessType,
      profile.minimumCapital,
      profile.capitalVerified,
      profile.capitalVerificationDate,
      profile.capitalProofDocument,
      profile.officeAddress,
      profile.city,
      profile.region,
      profile.contactPerson,
      profile.email,
      profile.phone,
      profile.status,
    ];

    const result = await this.pool.query(query, values);
    return this.mapExporterProfile(result.rows[0]);
  }

  async getExporterProfileById(exporterId: string): Promise<ExporterProfile | null> {
    const query = 'SELECT * FROM exporter_profiles WHERE exporter_id = $1';
    const result = await this.pool.query(query, [exporterId]);
    return result.rows[0] ? this.mapExporterProfile(result.rows[0]) : null;
  }

  async getExporterProfileByUserId(userId: string): Promise<ExporterProfile | null> {
    const query = 'SELECT * FROM exporter_profiles WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    return result.rows[0] ? this.mapExporterProfile(result.rows[0]) : null;
  }

  async getAllExporterProfiles(): Promise<ExporterProfile[]> {
    const query = 'SELECT * FROM exporter_profiles ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows.map((row) => this.mapExporterProfile(row));
  }

  async getPendingExporterProfiles(): Promise<ExporterProfile[]> {
    const query = 'SELECT * FROM exporter_profiles WHERE status = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, ['PENDING_APPROVAL']);
    return result.rows.map((row) => this.mapExporterProfile(row));
  }

  async updateExporterProfileStatus(
    exporterId: string,
    status: string,
    approvedBy?: string,
    rejectionReason?: string
  ): Promise<void> {
    const query = `
      UPDATE exporter_profiles 
      SET status = $1, approved_by = $2, approved_at = $3, rejection_reason = $4
      WHERE exporter_id = $5
    `;
    await this.pool.query(query, [
      status,
      approvedBy,
      status === 'ACTIVE' ? new Date().toISOString() : null,
      rejectionReason,
      exporterId,
    ]);
  }

  // ============================================================================
  // COFFEE LABORATORIES
  // ============================================================================

  async createLaboratory(
    laboratory: Omit<CoffeeLaboratory, 'laboratoryId' | 'createdAt' | 'updatedAt'>
  ): Promise<CoffeeLaboratory> {
    const query = `
      INSERT INTO coffee_laboratories (
        exporter_id, laboratory_name, address, certification_number, certified_date, expiry_date,
        status, equipment, has_roasting_facility, has_cupping_room, has_sample_storage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      laboratory.exporterId,
      laboratory.laboratoryName,
      laboratory.address,
      laboratory.certificationNumber,
      laboratory.certifiedDate,
      laboratory.expiryDate,
      laboratory.status,
      JSON.stringify(laboratory.equipment),
      laboratory.hasRoastingFacility,
      laboratory.hasCuppingRoom,
      laboratory.hasSampleStorage,
    ];

    const result = await this.pool.query(query, values);
    return this.mapLaboratory(result.rows[0]);
  }

  async getLaboratoryByExporterId(exporterId: string): Promise<CoffeeLaboratory | null> {
    const query = 'SELECT * FROM coffee_laboratories WHERE exporter_id = $1 AND status = $2';
    const result = await this.pool.query(query, [exporterId, 'ACTIVE']);
    return result.rows[0] ? this.mapLaboratory(result.rows[0]) : null;
  }

  async getPendingLaboratories(): Promise<CoffeeLaboratory[]> {
    const query = 'SELECT * FROM coffee_laboratories WHERE status = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, ['PENDING']);
    return result.rows.map((row) => this.mapLaboratory(row));
  }

  async certifyLaboratory(
    laboratoryId: string,
    certificationNumber: string,
    certifiedDate: string,
    expiryDate: string,
    inspectedBy: string
  ): Promise<void> {
    const query = `
      UPDATE coffee_laboratories 
      SET certification_number = $1, certified_date = $2, expiry_date = $3, 
          status = $4, inspected_by = $5, last_inspection_date = $6
      WHERE laboratory_id = $7
    `;
    await this.pool.query(query, [
      certificationNumber,
      certifiedDate,
      expiryDate,
      'ACTIVE',
      inspectedBy,
      new Date().toISOString(),
      laboratoryId,
    ]);
  }

  // ============================================================================
  // COFFEE TASTERS
  // ============================================================================

  async createTaster(
    taster: Omit<CoffeeTaster, 'tasterId' | 'createdAt' | 'updatedAt'>
  ): Promise<CoffeeTaster> {
    const query = `
      INSERT INTO coffee_tasters (
        exporter_id, full_name, date_of_birth, national_id, qualification_level,
        qualification_document, proficiency_certificate_number, certificate_issue_date,
        certificate_expiry_date, employment_start_date, employment_contract,
        is_exclusive_employee, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      taster.exporterId,
      taster.fullName,
      taster.dateOfBirth,
      taster.nationalId,
      taster.qualificationLevel,
      taster.qualificationDocument,
      taster.proficiencyCertificateNumber,
      taster.certificateIssueDate,
      taster.certificateExpiryDate,
      taster.employmentStartDate,
      taster.employmentContract,
      taster.isExclusiveEmployee,
      taster.status,
    ];

    const result = await this.pool.query(query, values);
    return this.mapTaster(result.rows[0]);
  }

  async getTasterByExporterId(exporterId: string): Promise<CoffeeTaster | null> {
    const query = 'SELECT * FROM coffee_tasters WHERE exporter_id = $1 AND status = $2';
    const result = await this.pool.query(query, [exporterId, 'ACTIVE']);
    return result.rows[0] ? this.mapTaster(result.rows[0]) : null;
  }

  // ============================================================================
  // COMPETENCE CERTIFICATES
  // ============================================================================

  async createCompetenceCertificate(
    certificate: Omit<CompetenceCertificate, 'certificateId' | 'createdAt' | 'updatedAt'>
  ): Promise<CompetenceCertificate> {
    const query = `
      INSERT INTO competence_certificates (
        exporter_id, certificate_number, issued_date, expiry_date, status,
        laboratory_id, taster_id, facility_inspection_date, inspection_report,
        inspected_by, inspection_passed, has_quality_management_system,
        qms_documentation, storage_capacity, storage_conditions, approved_by, approved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      certificate.exporterId,
      certificate.certificateNumber,
      certificate.issuedDate,
      certificate.expiryDate,
      certificate.status,
      certificate.laboratoryId,
      certificate.tasterId,
      certificate.facilityInspectionDate,
      certificate.inspectionReport,
      certificate.inspectedBy,
      certificate.inspectionPassed,
      certificate.hasQualityManagementSystem,
      certificate.qmsDocumentation,
      certificate.storageCapacity,
      certificate.storageConditions,
      certificate.approvedBy,
      certificate.approvedAt,
    ];

    const result = await this.pool.query(query, values);
    return this.mapCompetenceCertificate(result.rows[0]);
  }

  async getCompetenceCertificateByExporterId(
    exporterId: string
  ): Promise<CompetenceCertificate | null> {
    const query = 'SELECT * FROM competence_certificates WHERE exporter_id = $1 AND status = $2';
    const result = await this.pool.query(query, [exporterId, 'ACTIVE']);
    return result.rows[0] ? this.mapCompetenceCertificate(result.rows[0]) : null;
  }

  async getPendingCompetenceCertificates(): Promise<CompetenceCertificate[]> {
    const query =
      'SELECT * FROM competence_certificates WHERE status = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, ['PENDING']);
    return result.rows.map((row) => this.mapCompetenceCertificate(row));
  }

  // ============================================================================
  // LICENSE APPLICATIONS
  // ============================================================================

  async createLicenseApplication(application: {
    exporterId: string;
    eicRegistrationNumber: string;
    requestedCoffeeTypes: string[];
    requestedOrigins: string[];
    status: string;
    applicationDate: string;
    applicantUserId: string;
  }): Promise<any> {
    const query = `
      INSERT INTO license_applications (
        exporter_id, eic_registration_number, requested_coffee_types,
        requested_origins, status, application_date, applicant_user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      application.exporterId,
      application.eicRegistrationNumber,
      JSON.stringify(application.requestedCoffeeTypes),
      JSON.stringify(application.requestedOrigins),
      application.status,
      application.applicationDate,
      application.applicantUserId,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // ============================================================================
  // EXPORT LICENSES
  // ============================================================================

  async createExportLicense(
    license: Omit<ExportLicense, 'licenseId' | 'createdAt' | 'updatedAt'>
  ): Promise<ExportLicense> {
    const query = `
      INSERT INTO export_licenses (
        exporter_id, license_number, issued_date, expiry_date, status,
        competence_certificate_id, eic_registration_number, authorized_coffee_types,
        authorized_origins, annual_quota, approved_by, approved_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      license.exporterId,
      license.licenseNumber,
      license.issuedDate,
      license.expiryDate,
      license.status,
      license.competenceCertificateId,
      license.eicRegistrationNumber,
      JSON.stringify(license.authorizedCoffeeTypes),
      JSON.stringify(license.authorizedOrigins),
      license.annualQuota,
      license.approvedBy,
      license.approvedAt,
    ];

    const result = await this.pool.query(query, values);
    return this.mapExportLicense(result.rows[0]);
  }

  async getExportLicenseByExporterId(exporterId: string): Promise<ExportLicense | null> {
    const query = 'SELECT * FROM export_licenses WHERE exporter_id = $1 AND status = $2';
    const result = await this.pool.query(query, [exporterId, 'ACTIVE']);
    return result.rows[0] ? this.mapExportLicense(result.rows[0]) : null;
  }

  async getPendingExportLicenses(): Promise<ExportLicense[]> {
    const query = 'SELECT * FROM export_licenses WHERE status = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, ['PENDING']);
    return result.rows.map((row) => this.mapExportLicense(row));
  }

  // ============================================================================
  // COFFEE LOTS
  // ============================================================================

  async createCoffeeLot(
    lot: Omit<CoffeeLot, 'lotId' | 'createdAt' | 'updatedAt'>
  ): Promise<CoffeeLot> {
    const query = `
      INSERT INTO coffee_lots (
        ecx_lot_number, warehouse_receipt_number, warehouse_location, warehouse_name,
        coffee_type, origin_region, processing_method, quantity, preliminary_grade,
        purchase_date, purchased_by, purchase_price, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      lot.ecxLotNumber,
      lot.warehouseReceiptNumber,
      lot.warehouseLocation,
      lot.warehouseName,
      lot.coffeeType,
      lot.originRegion,
      lot.processingMethod,
      lot.quantity,
      lot.preliminaryGrade,
      lot.purchaseDate,
      lot.purchasedBy,
      lot.purchasePrice,
      lot.status,
    ];

    const result = await this.pool.query(query, values);
    return this.mapCoffeeLot(result.rows[0]);
  }

  async getCoffeeLotById(lotId: string): Promise<CoffeeLot | null> {
    const query = 'SELECT * FROM coffee_lots WHERE lot_id = $1';
    const result = await this.pool.query(query, [lotId]);
    return result.rows[0] ? this.mapCoffeeLot(result.rows[0]) : null;
  }

  async getCoffeeLotByEcxNumber(ecxLotNumber: string): Promise<CoffeeLot | null> {
    const query = 'SELECT * FROM coffee_lots WHERE ecx_lot_number = $1';
    const result = await this.pool.query(query, [ecxLotNumber]);
    return result.rows[0] ? this.mapCoffeeLot(result.rows[0]) : null;
  }

  // ============================================================================
  // QUALITY INSPECTIONS
  // ============================================================================

  async createQualityInspection(
    inspection: Omit<QualityInspection, 'inspectionId' | 'createdAt' | 'updatedAt'>
  ): Promise<QualityInspection> {
    const query = `
      INSERT INTO quality_inspections (
        lot_id, exporter_id, inspection_date, inspection_center, inspector,
        bean_size, moisture_content, defect_count, primary_defects, secondary_defects,
        foreign_matter, cupping_score, flavor_profile, aroma_score, acidity_score,
        body_score, balance_score, clean_cup_score, sweetness_score, uniformity_score,
        final_grade, quality_certificate_number, passed, remarks, inspection_report, cupping_form
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      RETURNING *
    `;

    const values = [
      inspection.lotId,
      inspection.exporterId,
      inspection.inspectionDate,
      inspection.inspectionCenter,
      inspection.inspector,
      inspection.beanSize,
      inspection.moistureContent,
      inspection.defectCount,
      inspection.primaryDefects,
      inspection.secondaryDefects,
      inspection.foreignMatter,
      inspection.cuppingScore,
      inspection.flavorProfile,
      inspection.aromaScore,
      inspection.acidityScore,
      inspection.bodyScore,
      inspection.balanceScore,
      inspection.cleanCupScore,
      inspection.sweetnessScore,
      inspection.uniformityScore,
      inspection.finalGrade,
      inspection.qualityCertificateNumber,
      inspection.passed,
      inspection.remarks,
      inspection.inspectionReport,
      inspection.cuppingForm,
    ];

    const result = await this.pool.query(query, values);
    return this.mapQualityInspection(result.rows[0]);
  }

  async getQualityInspectionById(inspectionId: string): Promise<QualityInspection | null> {
    const query = 'SELECT * FROM quality_inspections WHERE inspection_id = $1';
    const result = await this.pool.query(query, [inspectionId]);
    return result.rows[0] ? this.mapQualityInspection(result.rows[0]) : null;
  }

  // ============================================================================
  // SALES CONTRACTS
  // ============================================================================

  async createSalesContract(
    contract: Omit<SalesContract, 'contractId' | 'createdAt' | 'updatedAt'>
  ): Promise<SalesContract> {
    const query = `
      INSERT INTO sales_contracts (
        exporter_id, contract_number, buyer_name, buyer_country, buyer_address,
        buyer_email, buyer_phone, coffee_type, origin_region, quantity,
        contract_value, price_per_kg, payment_terms, incoterms, delivery_date,
        port_of_loading, port_of_discharge, registration_date, status,
        contract_document, buyer_proof_of_business
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const values = [
      contract.exporterId,
      contract.contractNumber,
      contract.buyerName,
      contract.buyerCountry,
      contract.buyerAddress,
      contract.buyerEmail,
      contract.buyerPhone,
      contract.coffeeType,
      contract.originRegion,
      contract.quantity,
      contract.contractValue,
      contract.pricePerKg,
      contract.paymentTerms,
      contract.incoterms,
      contract.deliveryDate,
      contract.portOfLoading,
      contract.portOfDischarge,
      contract.registrationDate,
      contract.status,
      contract.contractDocument,
      contract.buyerProofOfBusiness,
    ];

    const result = await this.pool.query(query, values);
    return this.mapSalesContract(result.rows[0]);
  }

  async getSalesContractById(contractId: string): Promise<SalesContract | null> {
    const query = 'SELECT * FROM sales_contracts WHERE contract_id = $1';
    const result = await this.pool.query(query, [contractId]);
    return result.rows[0] ? this.mapSalesContract(result.rows[0]) : null;
  }

  // ============================================================================
  // HELPER METHODS - Map database rows to TypeScript models
  // ============================================================================

  private mapExporterProfile(row: any): ExporterProfile {
    return {
      exporterId: row.exporter_id,
      userId: row.user_id,
      businessName: row.business_name,
      tin: row.tin,
      registrationNumber: row.registration_number,
      businessType: row.business_type,
      minimumCapital: parseFloat(row.minimum_capital),
      capitalVerified: row.capital_verified,
      capitalVerificationDate: row.capital_verification_date,
      capitalProofDocument: row.capital_proof_document,
      officeAddress: row.office_address,
      city: row.city,
      region: row.region,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      status: row.status,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapLaboratory(row: any): CoffeeLaboratory {
    return {
      laboratoryId: row.laboratory_id,
      exporterId: row.exporter_id,
      laboratoryName: row.laboratory_name,
      address: row.address,
      certificationNumber: row.certification_number,
      certifiedDate: row.certified_date,
      expiryDate: row.expiry_date,
      status: row.status,
      equipment: row.equipment || [],
      hasRoastingFacility: row.has_roasting_facility,
      hasCuppingRoom: row.has_cupping_room,
      hasSampleStorage: row.has_sample_storage,
      lastInspectionDate: row.last_inspection_date,
      inspectionReports: row.inspection_reports || [],
      inspectedBy: row.inspected_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTaster(row: any): CoffeeTaster {
    return {
      tasterId: row.taster_id,
      exporterId: row.exporter_id,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      nationalId: row.national_id,
      qualificationLevel: row.qualification_level,
      qualificationDocument: row.qualification_document,
      proficiencyCertificateNumber: row.proficiency_certificate_number,
      certificateIssueDate: row.certificate_issue_date,
      certificateExpiryDate: row.certificate_expiry_date,
      lastRenewalDate: row.last_renewal_date,
      employmentStartDate: row.employment_start_date,
      employmentContract: row.employment_contract,
      isExclusiveEmployee: row.is_exclusive_employee,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapCompetenceCertificate(row: any): CompetenceCertificate {
    return {
      certificateId: row.certificate_id,
      exporterId: row.exporter_id,
      certificateNumber: row.certificate_number,
      issuedDate: row.issued_date,
      expiryDate: row.expiry_date,
      status: row.status,
      laboratoryId: row.laboratory_id,
      tasterId: row.taster_id,
      facilityInspectionDate: row.facility_inspection_date,
      inspectionReport: row.inspection_report,
      inspectedBy: row.inspected_by,
      inspectionPassed: row.inspection_passed,
      hasQualityManagementSystem: row.has_quality_management_system,
      qmsDocumentation: row.qms_documentation,
      storageCapacity: parseFloat(row.storage_capacity),
      storageConditions: row.storage_conditions,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectionReason: row.rejection_reason,
      renewalHistory: row.renewal_history || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapExportLicense(row: any): ExportLicense {
    return {
      licenseId: row.license_id,
      exporterId: row.exporter_id,
      licenseNumber: row.license_number,
      issuedDate: row.issued_date,
      expiryDate: row.expiry_date,
      status: row.status,
      competenceCertificateId: row.competence_certificate_id,
      eicRegistrationNumber: row.eic_registration_number,
      authorizedCoffeeTypes: row.authorized_coffee_types || [],
      authorizedOrigins: row.authorized_origins || [],
      annualQuota: row.annual_quota ? parseFloat(row.annual_quota) : 0,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectionReason: row.rejection_reason,
      renewalHistory: row.renewal_history || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapCoffeeLot(row: any): CoffeeLot {
    return {
      lotId: row.lot_id,
      ecxLotNumber: row.ecx_lot_number,
      warehouseReceiptNumber: row.warehouse_receipt_number,
      warehouseLocation: row.warehouse_location,
      warehouseName: row.warehouse_name,
      coffeeType: row.coffee_type,
      originRegion: row.origin_region,
      processingMethod: row.processing_method,
      quantity: parseFloat(row.quantity),
      preliminaryGrade: row.preliminary_grade,
      purchaseDate: row.purchase_date,
      purchasedBy: row.purchased_by,
      purchasePrice: row.purchase_price ? parseFloat(row.purchase_price) : 0,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapQualityInspection(row: any): QualityInspection {
    return {
      inspectionId: row.inspection_id,
      lotId: row.lot_id,
      exporterId: row.exporter_id,
      inspectionDate: row.inspection_date,
      inspectionCenter: row.inspection_center,
      inspector: row.inspector,
      beanSize: row.bean_size,
      moistureContent: parseFloat(row.moisture_content),
      defectCount: row.defect_count,
      primaryDefects: row.primary_defects,
      secondaryDefects: row.secondary_defects,
      foreignMatter: parseFloat(row.foreign_matter),
      cuppingScore: parseFloat(row.cupping_score),
      flavorProfile: row.flavor_profile,
      aromaScore: parseFloat(row.aroma_score),
      acidityScore: parseFloat(row.acidity_score),
      bodyScore: parseFloat(row.body_score),
      balanceScore: parseFloat(row.balance_score),
      cleanCupScore: parseFloat(row.clean_cup_score),
      sweetnessScore: parseFloat(row.sweetness_score),
      uniformityScore: parseFloat(row.uniformity_score),
      finalGrade: row.final_grade,
      qualityCertificateNumber: row.quality_certificate_number,
      passed: row.passed,
      remarks: row.remarks,
      inspectionReport: row.inspection_report,
      cuppingForm: row.cupping_form,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSalesContract(row: any): SalesContract {
    return {
      contractId: row.contract_id,
      exporterId: row.exporter_id,
      contractNumber: row.contract_number,
      buyerName: row.buyer_name,
      buyerCountry: row.buyer_country,
      buyerAddress: row.buyer_address,
      buyerEmail: row.buyer_email,
      buyerPhone: row.buyer_phone,
      coffeeType: row.coffee_type,
      originRegion: row.origin_region,
      quantity: parseFloat(row.quantity),
      contractValue: parseFloat(row.contract_value),
      pricePerKg: parseFloat(row.price_per_kg),
      paymentTerms: row.payment_terms,
      incoterms: row.incoterms,
      deliveryDate: row.delivery_date,
      portOfLoading: row.port_of_loading,
      portOfDischarge: row.port_of_discharge,
      registrationDate: row.registration_date,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      status: row.status,
      rejectionReason: row.rejection_reason,
      contractDocument: row.contract_document,
      buyerProofOfBusiness: row.buyer_proof_of_business,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
