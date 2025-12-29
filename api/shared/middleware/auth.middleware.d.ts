/**
 * Shared Authentication Middleware
 * Centralized JWT authentication for all CBC services
 */
import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        username: string;
        organization: string;
        mspId: string;
        role: string;
        permissions: string[];
    };
}
export interface JWTPayload {
    id: string;
    username: string;
    organization?: string;
    organizationId?: string;
    mspId?: string;
    role: string;
    permissions?: string[];
    iat: number;
    exp: number;
    iss?: string;
    aud?: string | string[];
}
/**
 * Centralized JWT authentication middleware
 */
export declare const authMiddleware: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
/**
 * Generate JWT token with standardized payload
 */
export declare const generateToken: (payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>) => string;
/**
 * Generate refresh token
 */
export declare const generateRefreshToken: (payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'aud'>) => string;
/**
 * Role-based authorization middleware
 */
export declare const requireRole: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Organization-based authorization middleware
 */
export declare const requireOrganization: (allowedOrganizations: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
/**
 * Action-based authorization middleware using role permissions
 */
export declare const requireAction: (action: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export default authMiddleware;
//# sourceMappingURL=auth.middleware.d.ts.map