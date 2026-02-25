/**
 * Agency Authorization Middleware
 * Validates that users belong to agencies and have proper permissions
 */

import { Request, Response, NextFunction } from 'express';
import { pool } from '@shared/database/pool';
import { createLogger } from '@shared/logger';
import { ApiResponse, ApiErrorCode } from '@shared/types/api-response.types';

const logger = createLogger('AgencyAuthMiddleware');

export interface AgencyUser {
    id: string;
    userId: string;
    agencyCode: string;
    agencyName: string;
    organizationId: string;
    role: string;
    permissions: string[];
    isActive: boolean;
}

export interface RequestWithAgency extends Request {
    user?: {
        id: string;
        username: string;
        organization: string;
        role: string;
    };
    agency?: AgencyUser;
    agencies?: AgencyUser[]; // All agencies user belongs to
}

/**
 * Get agency user information from database
 */
async function getAgencyUser(userId: string, agencyCode?: string): Promise<AgencyUser | null> {
    try {
        let query = `
      SELECT 
        au.id,
        au.user_id,
        au.agency_code,
        ea.agency_name,
        au.organization_id,
        au.role,
        au.permissions,
        au.is_active
      FROM agency_users au
      JOIN esw_agencies ea ON au.agency_code = ea.agency_code
      WHERE au.user_id = $1 AND au.is_active = true
    `;

        const params: any[] = [userId];

        if (agencyCode) {
            query += ' AND au.agency_code = $2';
            params.push(agencyCode);
        }

        query += ' LIMIT 1';

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return null;
        }

        const row = result.rows[0];
        return {
            id: row.id,
            userId: row.user_id,
            agencyCode: row.agency_code,
            agencyName: row.agency_name,
            organizationId: row.organization_id,
            role: row.role,
            permissions: Array.isArray(row.permissions) ? row.permissions : [],
            isActive: row.is_active,
        };
    } catch (error) {
        logger.error('Error fetching agency user', { error, userId, agencyCode });
        return null;
    }
}

/**
 * Get all agencies a user belongs to
 * Supports two methods:
 * 1. Explicit assignment via agency_users table
 * 2. Implicit assignment via user's organization_id matching agency_code
 */
async function getUserAgencies(userId: string): Promise<AgencyUser[]> {
    try {
        // First, try to get explicit agency assignments from agency_users table
        const explicitResult = await pool.query(
            `SELECT 
        au.id,
        au.user_id,
        au.agency_code,
        ea.agency_name,
        au.organization_id,
        au.role,
        au.permissions,
        au.is_active
      FROM agency_users au
      JOIN esw_agencies ea ON au.agency_code = ea.agency_code
      WHERE au.user_id = $1 AND au.is_active = true
      ORDER BY ea.agency_name`,
            [userId]
        );

        if (explicitResult.rows.length > 0) {
            return explicitResult.rows.map((row: any) => ({
                id: row.id,
                userId: row.user_id,
                agencyCode: row.agency_code,
                agencyName: row.agency_name,
                organizationId: row.organization_id,
                role: row.role,
                permissions: Array.isArray(row.permissions) ? row.permissions : [],
                isActive: row.is_active,
            }));
        }

        // If no explicit assignments, check if user's organization_id matches an agency_code
        const userResult = await pool.query(
            `SELECT id, organization_id, role
       FROM users
       WHERE id = $1 AND is_active = true`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return [];
        }

        const user = userResult.rows[0];
        const userOrgId = user.organization_id;

        if (!userOrgId) {
            return [];
        }

        // Check if user's organization_id matches an agency_code
        const agencyResult = await pool.query(
            `SELECT 
        agency_id as id,
        agency_code,
        agency_name,
        is_active
      FROM esw_agencies
      WHERE agency_code = $1 AND is_active = true`,
            [userOrgId]
        );

        if (agencyResult.rows.length === 0) {
            return [];
        }

        // Return implicit agency user with default permissions
        return agencyResult.rows.map((row: any) => ({
            id: row.id,
            userId: userId,
            agencyCode: row.agency_code,
            agencyName: row.agency_name,
            organizationId: userOrgId,
            role: user.role || 'APPROVER',
            permissions: ['approve_submissions', 'reject_submissions', 'view_submissions', 'add_notes'],
            isActive: row.is_active,
        }));
    } catch (error) {
        logger.error('Error fetching user agencies', { error, userId });
        return [];
    }
}

/**
 * Middleware: Require user to belong to ANY agency
 * Attaches all user's agencies to req.agencies
 */
export const requireAgencyUser = async (
    req: RequestWithAgency,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json(
                ApiResponse.error(
                    'Authentication required',
                    ApiErrorCode.UNAUTHORIZED,
                    'User must be authenticated to access this resource'
                )
            );
            return;
        }

        const agencies = await getUserAgencies(req.user.id);

        if (agencies.length === 0) {
            res.status(403).json(
                ApiResponse.error(
                    'Agency access required',
                    ApiErrorCode.INSUFFICIENT_PERMISSIONS,
                    'User is not associated with any agency'
                )
            );
            return;
        }

        // Attach all agencies to request
        req.agencies = agencies;

        // If user only belongs to one agency, also set req.agency for convenience
        if (agencies.length === 1) {
            req.agency = agencies[0];
        }

        next();
    } catch (error) {
        logger.error('Error in requireAgencyUser middleware', { error });
        res.status(500).json(
            ApiResponse.error(
                'Internal server error',
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'Failed to verify agency membership'
            )
        );
    }
};

/**
 * Middleware: Require user to belong to a SPECIFIC agency
 * Agency code can be provided as parameter or extracted from route params
 */
export const requireAgency = (agencyCodeParam?: string) => {
    return async (req: RequestWithAgency, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json(
                    ApiResponse.error(
                        'Authentication required',
                        ApiErrorCode.UNAUTHORIZED,
                        'User must be authenticated to access this resource'
                    )
                );
                return;
            }

            // Get agency code from parameter or route params
            const agencyCode = agencyCodeParam || (req.params.agencyCode as string);

            if (!agencyCode) {
                res.status(400).json(
                    ApiResponse.error(
                        'Agency code required',
                        ApiErrorCode.VALIDATION_ERROR,
                        'Agency code must be provided'
                    )
                );
                return;
            }

            // Check if user belongs to this specific agency
            const agencyUser = await getAgencyUser(req.user.id, agencyCode);

            if (!agencyUser) {
                res.status(403).json(
                    ApiResponse.error(
                        'Agency access denied',
                        ApiErrorCode.INSUFFICIENT_PERMISSIONS,
                        `User does not have access to agency: ${agencyCode}`
                    )
                );
                return;
            }

            // Attach agency info to request
            req.agency = agencyUser;

            next();
        } catch (error) {
            logger.error('Error in requireAgency middleware', { error, agencyCodeParam });
            res.status(500).json(
                ApiResponse.error(
                    'Internal server error',
                    ApiErrorCode.INTERNAL_SERVER_ERROR,
                    'Failed to verify agency access'
                )
            );
        }
    };
};

/**
 * Middleware: Require specific permission within an agency
 */
export const requireAgencyPermission = (permission: string) => {
    return async (req: RequestWithAgency, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.agency) {
                res.status(403).json(
                    ApiResponse.error(
                        'Agency context required',
                        ApiErrorCode.INSUFFICIENT_PERMISSIONS,
                        'Agency context must be established before checking permissions'
                    )
                );
                return;
            }

            // Check if user has the required permission
            if (!req.agency.permissions.includes(permission)) {
                res.status(403).json(
                    ApiResponse.error(
                        'Permission denied',
                        ApiErrorCode.INSUFFICIENT_PERMISSIONS,
                        `User does not have permission: ${permission} in agency: ${req.agency.agencyCode}`
                    )
                );
                return;
            }

            next();
        } catch (error) {
            logger.error('Error in requireAgencyPermission middleware', { error, permission });
            res.status(500).json(
                ApiResponse.error(
                    'Internal server error',
                    ApiErrorCode.INTERNAL_SERVER_ERROR,
                    'Failed to verify agency permission'
                )
            );
        }
    };
};

/**
 * Middleware: Require specific role within an agency
 */
export const requireAgencyRole = (allowedRoles: string[]) => {
    return async (req: RequestWithAgency, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.agency) {
                res.status(403).json(
                    ApiResponse.error(
                        'Agency context required',
                        ApiErrorCode.INSUFFICIENT_PERMISSIONS,
                        'Agency context must be established before checking roles'
                    )
                );
                return;
            }

            // Check if user has one of the allowed roles
            if (!allowedRoles.includes(req.agency.role)) {
                res.status(403).json(
                    ApiResponse.error(
                        'Role access denied',
                        ApiErrorCode.INSUFFICIENT_PERMISSIONS,
                        `Required roles: ${allowedRoles.join(', ')}. User role: ${req.agency.role}`
                    )
                );
                return;
            }

            next();
        } catch (error) {
            logger.error('Error in requireAgencyRole middleware', { error, allowedRoles });
            res.status(500).json(
                ApiResponse.error(
                    'Internal server error',
                    ApiErrorCode.INTERNAL_SERVER_ERROR,
                    'Failed to verify agency role'
                )
            );
        }
    };
};

/**
 * Helper: Validate agency access in controller
 */
export function validateAgencyAccess(userAgency: AgencyUser, requestedAgencyCode: string): void {
    if (userAgency.agencyCode !== requestedAgencyCode) {
        throw new Error(
            `Access denied. User belongs to ${userAgency.agencyCode}, cannot access ${requestedAgencyCode}`
        );
    }
}

export default {
    requireAgencyUser,
    requireAgency,
    requireAgencyPermission,
    requireAgencyRole,
    validateAgencyAccess,
};
