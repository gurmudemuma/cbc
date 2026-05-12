/**
 * Qualification Check Middleware
 * Ensures exporters are FULLY_QUALIFIED before performing certain actions
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';

const logger = createLogger('QualificationCheckMiddleware');

interface QualificationStatus {
  isQualified: boolean;
  status: string;
  incompleteSteps: string[];
  completedSteps: string[];
}

/**
 * Check if exporter is fully qualified
 */
async function checkExporterQualification(exporterId: string): Promise<QualificationStatus> {
  try {
    const query = `
      SELECT 
        ep.status as profile_status,
        ep.business_name,
        (SELECT status FROM coffee_laboratories WHERE exporter_id = ep.exporter_id LIMIT 1) as laboratory_status,
        (SELECT status FROM coffee_tasters WHERE exporter_id = ep.exporter_id LIMIT 1) as taster_status,
        (SELECT status FROM competence_certificates WHERE exporter_id = ep.exporter_id LIMIT 1) as competence_status,
        (SELECT status FROM export_licenses WHERE exporter_id = ep.exporter_id LIMIT 1) as license_status
      FROM exporter_profiles ep
      WHERE ep.exporter_id = $1
    `;

    const result = await pool.query(query, [exporterId]);

    if (result.rows.length === 0) {
      return {
        isQualified: false,
        status: 'NO_PROFILE',
        incompleteSteps: ['Profile Registration'],
        completedSteps: [],
      };
    }

    const row = result.rows[0];
    const completedSteps: string[] = [];
    const incompleteSteps: string[] = [];

    // Check profile status
    if (row.profile_status === 'ACTIVE' || row.profile_status === 'FULLY_QUALIFIED') {
      completedSteps.push('Profile Registration');
    } else {
      incompleteSteps.push('Profile Registration');
    }

    // Check laboratory status
    if (row.laboratory_status === 'ACTIVE') {
      completedSteps.push('Laboratory Certification');
    } else {
      incompleteSteps.push('Laboratory Certification');
    }

    // Check taster status
    if (row.taster_status === 'ACTIVE') {
      completedSteps.push('Taster Verification');
    } else {
      incompleteSteps.push('Taster Verification');
    }

    // Check competence certificate status
    if (row.competence_status === 'ACTIVE') {
      completedSteps.push('Competence Certificate');
    } else {
      incompleteSteps.push('Competence Certificate');
    }

    // Check export license status
    if (row.license_status === 'ACTIVE') {
      completedSteps.push('Export License');
    } else {
      incompleteSteps.push('Export License');
    }

    const isQualified = row.profile_status === 'FULLY_QUALIFIED' && incompleteSteps.length === 0;

    return {
      isQualified,
      status: row.profile_status,
      incompleteSteps,
      completedSteps,
    };
  } catch (error) {
    logger.error('Error checking exporter qualification', { exporterId, error });
    throw error;
  }
}

/**
 * Middleware: Require exporter to be FULLY_QUALIFIED
 * Use this middleware on endpoints that should only be accessible to fully qualified exporters
 */
export const requireFullyQualified = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;

    logger.info('requireFullyQualified middleware called', { 
      hasUser: !!user, 
      userId: user?.id,
      exporterId: user?.exporterId,
      url: (req as any).url 
    });

    if (!user) {
      logger.warn('No user in request');
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    // Get exporter ID from user
    const exporterId = user.exporterId;

    logger.info('Checking exporterId', { exporterId, userObject: user });

    if (!exporterId) {
      logger.warn('No exporterId found in user token', { user });
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_EXPORTER_PROFILE',
          message: 'You must complete your exporter profile registration first',
        },
      });
      return;
    }

    // Check qualification status
    const qualificationStatus = await checkExporterQualification(exporterId);

    logger.info('Qualification status checked', { 
      exporterId, 
      isQualified: qualificationStatus.isQualified,
      status: qualificationStatus.status,
      completedSteps: qualificationStatus.completedSteps,
      incompleteSteps: qualificationStatus.incompleteSteps
    });

    if (!qualificationStatus.isQualified) {
      logger.warn('Exporter not fully qualified', {
        exporterId,
        status: qualificationStatus.status,
        incompleteSteps: qualificationStatus.incompleteSteps,
      });

      res.status(403).json({
        success: false,
        error: {
          code: 'NOT_FULLY_QUALIFIED',
          message: 'You must complete all qualification steps before accessing this feature',
          details: {
            currentStatus: qualificationStatus.status,
            completedSteps: qualificationStatus.completedSteps,
            incompleteSteps: qualificationStatus.incompleteSteps,
            totalSteps: 5,
            completedCount: qualificationStatus.completedSteps.length,
            progressPercentage: (qualificationStatus.completedSteps.length / 5) * 100,
          },
        },
      });
      return;
    }

    // Exporter is fully qualified, proceed
    logger.info('Exporter qualification verified', { exporterId });
    next();
  } catch (error) {
    logger.error('Error in requireFullyQualified middleware', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to verify qualification status',
      },
    });
  }
};

/**
 * Middleware: Get qualification status (non-blocking)
 * Adds qualification status to request object but doesn't block access
 */
export const getQualificationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (user && user.exporterId) {
      const qualificationStatus = await checkExporterQualification(user.exporterId);
      (req as any).qualificationStatus = qualificationStatus;
    }

    next();
  } catch (error) {
    logger.error('Error in getQualificationStatus middleware', { error });
    // Don't block request, just log error
    next();
  }
};

/**
 * API endpoint to check qualification status
 */
export const checkQualificationStatusEndpoint = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = (req as any).user;

    if (!user || !user.exporterId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'NO_EXPORTER_PROFILE',
          message: 'No exporter profile found',
        },
      });
      return;
    }

    const qualificationStatus = await checkExporterQualification(user.exporterId);

    res.status(200).json({
      success: true,
      data: {
        isQualified: qualificationStatus.isQualified,
        status: qualificationStatus.status,
        completedSteps: qualificationStatus.completedSteps,
        incompleteSteps: qualificationStatus.incompleteSteps,
        totalSteps: 5,
        completedCount: qualificationStatus.completedSteps.length,
        progressPercentage: (qualificationStatus.completedSteps.length / 5) * 100,
        canCreateContracts: qualificationStatus.isQualified,
        canAccessBuyers: qualificationStatus.isQualified,
      },
    });
  } catch (error) {
    logger.error('Error checking qualification status', { error });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check qualification status',
      },
    });
  }
};
