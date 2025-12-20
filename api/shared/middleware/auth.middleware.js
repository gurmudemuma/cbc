"use strict";
/**
 * Shared Authentication Middleware
 * Centralized JWT authentication for all CBC services
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAction = exports.requireOrganization = exports.requireRole = exports.generateRefreshToken = exports.generateToken = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_config_1 = require("../auth/jwt.config");
const api_response_types_1 = require("../types/api-response.types");
// Validate JWT config on import
(0, jwt_config_1.validateJWTConfig)();
/**
 * Centralized JWT authentication middleware
 */
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json(api_response_types_1.ApiResponse.error('Access token is required', api_response_types_1.ApiErrorCode.UNAUTHORIZED, 'Authorization header must be provided with Bearer token format', undefined, req.headers['x-service-name'] || 'CBC-API'));
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        // Verify token with shared secret (without strict issuer/audience validation for backward compatibility)
        const decoded = jsonwebtoken_1.default.verify(token, jwt_config_1.JWT_CONFIG.SECRET, {
            algorithms: [jwt_config_1.JWT_CONFIG.ALGORITHM],
        });
        const payload = decoded;
        // Attach user info to request
        req.user = {
            id: payload.id,
            username: payload.username,
            organization: payload.organization || payload.organizationId || 'DEFAULT',
            mspId: payload.mspId || 'DEFAULT',
            role: payload.role,
            permissions: payload.permissions || [],
        };
        return next();
    }
    catch (error) {
        let errorCode = api_response_types_1.ApiErrorCode.INVALID_TOKEN;
        let message = 'Invalid access token';
        let details = 'Token verification failed';
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            errorCode = api_response_types_1.ApiErrorCode.TOKEN_EXPIRED;
            message = 'Access token has expired';
            details = 'Please refresh your token or login again';
        }
        else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            errorCode = api_response_types_1.ApiErrorCode.INVALID_TOKEN;
            message = 'Invalid access token';
            details = error.message;
        }
        return res.status(401).json(api_response_types_1.ApiResponse.error(message, errorCode, details, undefined, req.headers['x-service-name'] || 'CBC-API'));
    }
};
exports.authMiddleware = authMiddleware;
/**
 * Generate JWT token with standardized payload
 */
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.JWT_CONFIG.SECRET, {
        expiresIn: jwt_config_1.JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
        issuer: jwt_config_1.JWT_CONFIG.ISSUER,
        audience: jwt_config_1.JWT_CONFIG.AUDIENCE,
        algorithm: jwt_config_1.JWT_CONFIG.ALGORITHM,
    });
};
exports.generateToken = generateToken;
/**
 * Generate refresh token
 */
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, jwt_config_1.JWT_CONFIG.SECRET, {
        expiresIn: jwt_config_1.JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
        issuer: jwt_config_1.JWT_CONFIG.ISSUER,
        audience: jwt_config_1.JWT_CONFIG.AUDIENCE,
        algorithm: jwt_config_1.JWT_CONFIG.ALGORITHM,
    });
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Role-based authorization middleware
 */
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(api_response_types_1.ApiResponse.error('Authentication required', api_response_types_1.ApiErrorCode.UNAUTHORIZED, 'User must be authenticated to access this resource'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json(api_response_types_1.ApiResponse.error('Insufficient permissions', api_response_types_1.ApiErrorCode.INSUFFICIENT_PERMISSIONS, `Required roles: ${allowedRoles.join(', ')}. User role: ${req.user.role}`));
        }
        next();
        return;
    };
};
exports.requireRole = requireRole;
/**
 * Organization-based authorization middleware
 */
const requireOrganization = (allowedOrganizations) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(api_response_types_1.ApiResponse.error('Authentication required', api_response_types_1.ApiErrorCode.UNAUTHORIZED, 'User must be authenticated to access this resource'));
        }
        if (!allowedOrganizations.includes(req.user.organization)) {
            return res.status(403).json(api_response_types_1.ApiResponse.error('Organization access denied', api_response_types_1.ApiErrorCode.INSUFFICIENT_PERMISSIONS, `Required organizations: ${allowedOrganizations.join(', ')}. User organization: ${req.user.organization}`));
        }
        next();
        return;
    };
};
exports.requireOrganization = requireOrganization;
/**
 * Action-based authorization middleware using role permissions
 */
const requireAction = (action) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json(api_response_types_1.ApiResponse.error('Authentication required', api_response_types_1.ApiErrorCode.UNAUTHORIZED, 'User must be authenticated to access this resource'));
        }
        // Check if user has the required action in their permissions
        if (!req.user.permissions || !req.user.permissions.includes(action)) {
            return res.status(403).json(api_response_types_1.ApiResponse.error('Action not permitted', api_response_types_1.ApiErrorCode.INSUFFICIENT_PERMISSIONS, `Your organization (${req.user.organization}) is not authorized to perform this action (${action})`));
        }
        next();
        return;
    };
};
exports.requireAction = requireAction;
exports.default = exports.authMiddleware;
//# sourceMappingURL=auth.middleware.js.map