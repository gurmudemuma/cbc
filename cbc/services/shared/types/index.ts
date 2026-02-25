/**
 * Comprehensive TypeScript Type Definitions
 * Replaces generic 'any' types with specific interfaces
 */

import { Request, Response, NextFunction } from 'express';
import { Socket } from 'socket.io';

// ============================================================================
// Express Request/Response Extensions
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId: string;
    organizationName: string;
    permissions: string[];
  };
  organization?: {
    id: string;
    name: string;
    type: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
  path?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ============================================================================
// Middleware Types
// ============================================================================

export type ExpressMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type ErrorMiddleware = (
  err: Error,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => void;

export interface MiddlewareOptions {
  enableHelmet?: boolean;
  enableCors?: boolean;
  enableRateLimit?: boolean;
  enableCompression?: boolean;
}

// ============================================================================
// WebSocket Types
// ============================================================================

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  organization?: string;
  organizationId?: string;
  role?: string;
}

export interface WebSocketEvent {
  event: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

// ============================================================================
// Export/Document Types
// ============================================================================

export interface ExportRequest {
  id: string;
  exporterId: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  coffeeType: string;
  quantity: number;
  destination: string;
  estimatedValue: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Document {
  id: string;
  exportId: string;
  type: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  ipfsHash?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface DocumentUploadRequest {
  documentType: string;
  documentName: string;
  documentPath: string;
  fileSize: number;
  mimeType: string;
  ipfsHash?: string;
}

// ============================================================================
// User/Organization Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'OFFICER' | 'EXPORTER' | 'VIEWER';
  organizationId: string;
  organizationName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface Organization {
  id: string;
  name: string;
  type: 'EXPORTER' | 'BANK' | 'AUTHORITY' | 'EXCHANGE' | 'SHIPPING';
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
  expiresIn: number;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// Filter/Search Types
// ============================================================================

export interface FilterCriteria {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface SearchOptions {
  query?: string;
  filters?: FilterCriteria[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheOptions {
  ttl?: number;
  key: string;
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  expiresAt: Date;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
  path: string;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// ============================================================================
// Audit/Logging Types
// ============================================================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  changes?: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecurityAuditLog {
  id: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  userId?: string;
  ipAddress?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// Email Types
// ============================================================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  variables: Record<string, string>;
}

// ============================================================================
// Database Types
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  poolMin: number;
  poolMax: number;
}

export interface QueryOptions {
  timeout?: number;
  retries?: number;
  transaction?: boolean;
}

// ============================================================================
// Metrics Types
// ============================================================================

export interface MetricsData {
  timestamp: Date;
  metric: string;
  value: number;
  labels?: Record<string, string>;
}

export interface HealthCheckResult {
  status: 'UP' | 'DOWN' | 'DEGRADED';
  timestamp: Date;
  checks: {
    database: 'UP' | 'DOWN';
    redis: 'UP' | 'DOWN';
    ipfs?: 'UP' | 'DOWN';
  };
  uptime: number;
  version: string;
}

// ============================================================================
// Request/Response Handlers
// ============================================================================

export type RequestHandler<T = any> = (
  req: AuthenticatedRequest,
  res: Response<ApiResponse<T>>,
  next: NextFunction
) => Promise<void> | void;

export type ErrorHandler = (
  err: Error,
  req: AuthenticatedRequest,
  res: Response<ErrorResponse>,
  next: NextFunction
) => void;

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;
export type SyncFunction<T = void> = () => T;

export interface PagedRequest {
  page: number;
  limit: number;
  offset: number;
}

export interface SortRequest {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

// ============================================================================
// Form Types
// ============================================================================

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  label: string;
  required: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: Array<{ label: string; value: string }>;
}

export interface FormData {
  [key: string]: any;
}

// ============================================================================
// Status Types
// ============================================================================

export type ExportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
export type UserRole = 'ADMIN' | 'MANAGER' | 'OFFICER' | 'EXPORTER' | 'VIEWER';
export type OrganizationType = 'EXPORTER' | 'BANK' | 'AUTHORITY' | 'EXCHANGE' | 'SHIPPING';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';
export type Environment = 'development' | 'production' | 'test';
