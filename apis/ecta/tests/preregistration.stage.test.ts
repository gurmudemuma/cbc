import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PreRegistrationController } from '../src/controllers/preregistration.controller';
import { Request, Response, NextFunction } from 'express';

/**
 * ECTA Pre-Registration Stage Tests
 * Tests for 5-stage registration process
 */
describe('ECTA Pre-Registration - Stage Tests', () => {
  let controller: PreRegistrationController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new PreRegistrationController();

    mockRequest = {
      user: {
        id: 'user-001',
        username: 'ecta-officer-001',
        organizationId: 'ECTA',
        role: 'ecta-officer',
      },
      params: {},
      body: {},
    };

    mockResponse = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================================
  // STAGE 1: BUSINESS REGISTRATION VERIFICATION
  // ============================================================================

  describe('Stage 1: Business Registration Verification', () => {
    it('should submit Stage 1 application', async () => {
      mockRequest.body = {
        businessName: 'Ethiopian Coffee Exporters Ltd',
        tin: '0123456789',
        registrationNumber: 'REG-2024-001',
        businessType: 'PRIVATE',
        minimumCapital: 500000,
        capitalProofDocument: 'QmCapitalProof...',
      };

      await controller.submitStage1(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('Stage 1'),
        })
      );
    });

    it('should approve Stage 1 application', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };

      await controller.approveStage1(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('approved'),
          data: expect.objectContaining({
            status: 'STAGE_1_APPROVED',
          }),
        })
      );
    });

    it('should reject Stage 1 application with reason', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {
        reason: 'Insufficient capital documentation',
      };

      await controller.rejectStage1(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('rejected'),
          data: expect.objectContaining({
            status: 'STAGE_1_REJECTED',
            reason: 'Insufficient capital documentation',
          }),
        })
      );
    });

    it('should get pending Stage 1 applications', async () => {
      await controller.getPendingStage1(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          count: expect.any(Number),
        })
      );
    });

    it('should get Stage 1 details', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };

      await controller.getStage1Details(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            stage: 1,
          }),
        })
      );
    });
  });

  // ============================================================================
  // STAGE 2: FACILITY INSPECTION & VERIFICATION
  // ============================================================================

  describe('Stage 2: Facility Inspection & Verification', () => {
    it('should schedule Stage 2 inspection', async () => {
      mockRequest.body = {
        exporterId: 'EXP-001',
        warehouseLocation: '123 Coffee Street, Addis Ababa',
        storageCapacity: 100000,
        preferredDate: '2025-02-01',
      };

      await controller.scheduleStage2Inspection(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('scheduled'),
        })
      );
    });

    it('should approve Stage 2 inspection', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {
        inspectionReport: 'QmInspectionReport...',
      };

      await controller.approveStage2(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_2_APPROVED',
          }),
        })
      );
    });

    it('should reject Stage 2 inspection', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {
        reason: 'Warehouse not meeting standards',
      };

      await controller.rejectStage2(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_2_REJECTED',
          }),
        })
      );
    });
  });

  // ============================================================================
  // STAGE 3: LABORATORY CERTIFICATION
  // ============================================================================

  describe('Stage 3: Laboratory Certification', () => {
    it('should certify Stage 3 laboratory', async () => {
      mockRequest.params = { laboratoryId: 'LAB-001' };
      mockRequest.body = {
        certificationNumber: 'CERT-LAB-2025-001',
        inspectionPassed: true,
        validityYears: 2,
      };

      await controller.certifyStage3Laboratory(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_3_APPROVED',
            certificationNumber: 'CERT-LAB-2025-001',
          }),
        })
      );
    });

    it('should reject Stage 3 laboratory', async () => {
      mockRequest.params = { laboratoryId: 'LAB-001' };
      mockRequest.body = {
        reason: 'Equipment not meeting standards',
      };

      await controller.rejectStage3Laboratory(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_3_REJECTED',
          }),
        })
      );
    });
  });

  // ============================================================================
  // STAGE 4: COMPETENCE CERTIFICATE
  // ============================================================================

  describe('Stage 4: Competence Certificate', () => {
    it('should issue Stage 4 competence certificate', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {
        certificateNumber: 'COMP-2025-001',
        laboratoryId: 'LAB-001',
        tasterId: 'TASTER-001',
        facilityInspectionPassed: true,
        validityYears: 2,
      };

      await controller.issueStage4Competence(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_4_APPROVED',
          }),
        })
      );
    });

    it('should reject Stage 4 competence certificate', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {
        reason: 'Facility inspection failed',
      };

      await controller.rejectStage4Competence(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_4_REJECTED',
          }),
        })
      );
    });
  });

  // ============================================================================
  // STAGE 5: EXPORT LICENSE
  // ============================================================================

  describe('Stage 5: Export License', () => {
    it('should issue Stage 5 export license', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {
        licenseNumber: 'LIC-2025-001',
        competenceCertificateId: 'COMP-001',
        eicRegistrationNumber: 'EIC-2024-001',
        authorizedCoffeeTypes: ['Arabica', 'Robusta'],
        authorizedOrigins: ['Sidamo', 'Yirgacheffe'],
        annualQuota: 500000,
        validityYears: 1,
      };

      await controller.issueStage5License(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_5_APPROVED',
            licenseNumber: 'LIC-2025-001',
          }),
        })
      );
    });

    it('should reject Stage 5 export license', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {
        reason: 'Competence certificate not valid',
      };

      await controller.rejectStage5License(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'STAGE_5_REJECTED',
          }),
        })
      );
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing required fields in Stage 1', async () => {
      mockRequest.body = {
        businessName: 'Ethiopian Coffee Exporters Ltd',
        // Missing tin and registrationNumber
      };

      await controller.submitStage1(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should handle missing exporter ID in approval', async () => {
      mockRequest.params = {}; // Missing exporterId

      await controller.approveStage1(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        })
      );
    });

    it('should handle missing rejection reason', async () => {
      mockRequest.params = { exporterId: 'EXP-001' };
      mockRequest.body = {}; // Missing reason

      await controller.rejectStage1(mockRequest as any, mockResponse as any, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('required'),
        })
      );
    });
  });
});
