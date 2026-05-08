import { Request, Response, NextFunction } from 'express';
interface RequestWithUser extends Request {
    user?: {
        id: string;
        username: string;
        organizationId: string;
        role: string;
    };
}
/**
 * Middleware to track API response times and errors
 */
export declare const monitoringMiddleware: (req: RequestWithUser, res: Response, next: NextFunction) => void;
/**
 * Middleware to track errors
 */
export declare const errorMonitoringMiddleware: (err: Error, req: Request, _res: Response, next: NextFunction) => void;
export {};
//# sourceMappingURL=monitoring.middleware.d.ts.map