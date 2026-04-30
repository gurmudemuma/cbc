/**
 * Role-Based Access Control (RBAC) Middleware
 * Implements role-based authorization for API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@shared/logger';

const logger = createLogger('RBACMiddleware');

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    exporterId?: string;
  };
  body: any;
  params: any;
  headers: any;
  query: any;
  ip?: string;
  method?: string;
  path?: string;
  get?: (header: string) => string | undefined;
}

export type UserRole = 'EXPORTER' | 'BUYER' | 'ECTA' | 'ADMIN';

/**
 * Middleware to require authentication
 */
export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    logger.warn('Unauthorized access attempt', { ip: req.ip });
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }
  next();
};

/**
 * Middleware to require specific role
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn('Unauthorized access attempt', { ip: req.ip });
      res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      logger.warn('Forbidden access attempt', {
        userId: req.user.id,
        userRole: req.user.role,
        allowedRoles,
        ip: req.ip,
      });
      res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require EXPORTER role
 */
export const requireExporter = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'EXPORTER') {
    logger.warn('Non-exporter access attempt', {
      userId: req.user.id,
      userRole: req.user.role,
    });
    res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN',
      message: 'Only exporters can perform this action',
    });
    return;
  }

  next();
};

/**
 * Middleware to require BUYER role
 */
export const requireBuyer = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'BUYER') {
    logger.warn('Non-buyer access attempt', {
      userId: req.user.id,
      userRole: req.user.role,
    });
    res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN',
      message: 'Only buyers can perform this action',
    });
    return;
  }

  next();
};

/**
 * Middleware to require ADMIN role
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      status: 'error',
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.role !== 'ADMIN') {
    logger.warn('Non-admin access attempt', {
      userId: req.user.id,
      userRole: req.user.role,
    });
    res.status(403).json({
      status: 'error',
      code: 'FORBIDDEN',
      message: 'Only administrators can perform this action',
    });
    return;
  }

  next();
};

/**
 * Check if user has permission
 */
export const hasPermission = (userRole: string, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    EXPORTER: 1,
    BUYER: 1,
    ECTA: 2,
    ADMIN: 3,
  };

  const userLevel = roleHierarchy[userRole as UserRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
};

/**
 * Get user permissions based on role
 */
export const getPermissions = (role: UserRole): string[] => {
  const permissions: Record<UserRole, string[]> = {
    EXPORTER: [
      'create_contract',
      'edit_own_contract',
      'send_contract',
      'accept_counter',
      'reject_contract',
      'submit_counter',
      'finalize_contract',
      'download_certificate',
      'link_export',
      'view_own_contracts',
    ],
    BUYER: [
      'view_sent_contracts',
      'accept_contract',
      'reject_contract',
      'submit_counter',
      'view_contract_history',
    ],
    ECTA: [
      'register_contract',
      'generate_reference',
      'issue_certificate',
      'view_all_contracts',
    ],
    ADMIN: [
      'create_contract',
      'edit_any_contract',
      'delete_any_contract',
      'send_contract',
      'accept_counter',
      'reject_contract',
      'submit_counter',
      'finalize_contract',
      'download_certificate',
      'link_export',
      'view_all_contracts',
      'register_contract',
      'generate_reference',
      'issue_certificate',
      'view_audit_logs',
      'manage_users',
    ],
  };

  return permissions[role] || [];
};

/**
 * Check if user has specific permission
 */
export const hasPermissionFor = (userRole: string, permission: string): boolean => {
  const permissions = getPermissions(userRole as UserRole);
  return permissions.includes(permission);
};
