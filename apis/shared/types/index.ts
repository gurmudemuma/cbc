/**
 * Shared Type Definitions
 * Central export point for all shared types
 */

// Export from the new standardized types
export * from './api-response';
export * from './auth.types';

// Also export from legacy types for backward compatibility
export * from './api-response.types';

// Explicit exports for clarity
export { ApiResponse, ApiErrorDetail, ApiResponseBuilder } from './api-response';
export { AuthUser, AuthenticatedRequest, TokenPayload } from './auth.types';
