import { Router, Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    organizationId: string;
    role: string;
  };
}

const router = Router();

// Exporter routes are public for frontend compatibility
// Authentication is optional - can be added via Bearer token if available

// ============================================================================
// EXPORTER ENDPOINTS (Frontend compatibility)
// ============================================================================

// Get qualification status - proxy to preregistration
router.get(
  '/qualification-status',
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    // This endpoint provides compatibility with frontend expectations
    // It returns the overall qualification status for an exporter
    try {
      const userId = req.user?.id;
      
      const { Pool } = await import('pg');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      
      // Check exporter profile
      const profileResult = await pool.query(
        'SELECT * FROM preregistration_applications WHERE user_id = $1 AND status = $2',
        [userId, 'approved']
      );
      
      // Check licenses
      const licenseResult = await pool.query(
        'SELECT * FROM license_applications WHERE exporter_id = $1 AND status = $2 AND expires_at > NOW()',
        [userId, 'active']
      );
      
      // Check certificates
      const certResult = await pool.query(
        'SELECT * FROM certificates WHERE exporter_id = $1 AND status = $2 AND expires_at > NOW()',
        [userId, 'valid']
      );
      
      await pool.end();
      
      const hasProfile = profileResult.rows.length > 0;
      const hasLicense = licenseResult.rows.length > 0;
      const hasCertificate = certResult.rows.length > 0;
      const isQualified = hasProfile && hasLicense && hasCertificate;
      
      const requiredActions = [];
      if (!hasProfile) requiredActions.push('Complete exporter profile registration');
      if (!hasCertificate) requiredActions.push('Apply for competence certificate');
      if (!hasLicense) requiredActions.push('Apply for export license');
      
      res.json({
        success: true,
        data: {
          isQualified,
          hasProfile,
          hasLaboratory: hasCertificate,
          hasTaster: hasCertificate,
          hasCompetenceCertificate: hasCertificate,
          hasExportLicense: hasLicense,
          canCreateExportRequest: isQualified,
          nextStep: requiredActions[0] || 'All requirements met',
          requiredActions,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get qualification status',
        error: error.message,
      });
    }
  }
);

// Apply for export license
router.post('/license/apply', async (req: AuthRequest, res: Response) => {
  try {
    const {
      licenseType,
      eicRegistrationNumber,
      exportDestinations,
      annualExportVolume,
      businessPlan,
    } = req.body;

    // Validate required fields
    if (!licenseType || !eicRegistrationNumber || !exportDestinations || !businessPlan) {
      res.status(400).json({
        success: false,
        message:
          'Missing required fields: licenseType, eicRegistrationNumber, exportDestinations, businessPlan',
      });
      return;
    }

    const userId = req.user?.id;
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Generate application ID
    const applicationId = `LIC-${Date.now()}`;
    
    // Insert license application
    const result = await pool.query(
      `INSERT INTO license_applications 
       (application_id, exporter_id, license_type, eic_registration_number, 
        export_destinations, annual_export_volume, business_plan, status, applied_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [
        applicationId,
        userId,
        licenseType,
        eicRegistrationNumber,
        JSON.stringify(exportDestinations),
        annualExportVolume,
        businessPlan,
        'PENDING_REVIEW',
      ]
    );
    
    await pool.end();

    res.json({
      success: true,
      data: {
        applicationId,
        licenseType,
        eicRegistrationNumber,
        exportDestinations,
        annualExportVolume,
        status: 'PENDING_REVIEW',
        appliedAt: result.rows[0].applied_at,
        message:
          'Export license application submitted successfully. Your application is under review by ECTA.',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply for export license',
      error: error.message,
    });
  }
});

export default router;
