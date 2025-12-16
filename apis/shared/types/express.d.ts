/**
 * Express Type Extensions
 * Extends Express Request interface with custom properties
 */

declare global {
    namespace Express {
        interface Request {
            id?: string;
            user?: {
                id: string;
                username?: string;
                email?: string;
                role?: string;
                organizationId?: string;
                organization?: string;
                permissions?: string[];
                isActive?: boolean;
            };
            file?: any; // Multer file type
        }
    }
}

export { };
