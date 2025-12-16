/**
 * Authentication and Authorization Types
 * Provides type-safe access to authenticated request data
 */

import { Request } from 'express';

export interface AuthUser {
  id: string;
  username?: string;
  email: string;
  role: string;
  organization: string;
  permissions?: string[];
  organizationId?: string;
  isActive?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  requestId?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  organization: string;
  organizationId?: string;
  permissions?: string[];
  iat?: number;
  exp?: number;
}
