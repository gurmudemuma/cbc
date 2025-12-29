/**
 * Error handling middleware for Express applications
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Custom error class with status code
 */
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
}
/**
 * Global error handler middleware
 */
export declare const errorHandler: (err: any, req: Request, res: Response, _next: NextFunction) => void;
/**
 * 404 Not Found handler
 */
export declare const notFoundHandler: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Async handler wrapper to catch errors in async route handlers
 */
export declare const asyncHandler: (fn: Function) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=error.middleware.d.ts.map