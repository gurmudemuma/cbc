import { Request, Response, NextFunction, Router } from 'express';

/**
 * API Versioning Middleware
 * Supports multiple API versions with backward compatibility
 */

export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecatedAt?: Date;
  sunsetAt?: Date;
  description?: string;
}

export interface VersionedRequest extends Request {
  apiVersion?: string;
  isDeprecated?: boolean;
  deprecationWarning?: string;
  user?: any;
  id?: string;
}

/**
 * API Version Manager
 */
export class ApiVersionManager {
  private versions: Map<string, ApiVersion> = new Map();
  private currentVersion: string = 'v1';
  private supportedVersions: string[] = [];

  constructor() {
    this.registerVersion('v1', {
      version: 'v1',
      description: 'Initial API version',
    });
  }

  /**
   * Register API version
   */
  registerVersion(version: string, config: ApiVersion): void {
    this.versions.set(version, config);
    this.supportedVersions.push(version);
  }

  /**
   * Deprecate API version
   */
  deprecateVersion(version: string, sunsetDate: Date): void {
    const versionConfig = this.versions.get(version);
    if (versionConfig) {
      versionConfig.deprecated = true;
      versionConfig.deprecatedAt = new Date();
      versionConfig.sunsetAt = sunsetDate;
      this.versions.set(version, versionConfig);
    }
  }

  /**
   * Get version config
   */
  getVersion(version: string): ApiVersion | undefined {
    return this.versions.get(version);
  }

  /**
   * Get all versions
   */
  getAllVersions(): ApiVersion[] {
    return Array.from(this.versions.values());
  }

  /**
   * Get supported versions
   */
  getSupportedVersions(): string[] {
    return this.supportedVersions;
  }

  /**
   * Set current version
   */
  setCurrentVersion(version: string): void {
    if (this.versions.has(version)) {
      this.currentVersion = version;
    }
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Check if version is supported
   */
  isSupported(version: string): boolean {
    return this.versions.has(version);
  }

  /**
   * Check if version is deprecated
   */
  isDeprecated(version: string): boolean {
    const versionConfig = this.versions.get(version);
    return versionConfig?.deprecated || false;
  }

  /**
   * Get deprecation warning
   */
  getDeprecationWarning(version: string): string | undefined {
    const versionConfig = this.versions.get(version);
    if (versionConfig?.deprecated && versionConfig?.sunsetAt) {
      const daysUntilSunset = Math.ceil(
        (versionConfig.sunsetAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return `API version ${version} is deprecated and will be sunset on ${versionConfig.sunsetAt.toISOString()}. Please upgrade to ${this.currentVersion}. Days remaining: ${daysUntilSunset}`;
    }
    return undefined;
  }
}

/**
 * Global version manager instance
 */
const versionManager = new ApiVersionManager();

/**
 * API versioning middleware
 */
export const apiVersioning = (
  req: VersionedRequest,
  res: Response,
  next: NextFunction
): void | Response => {
  // Get version from header, query parameter, or URL path
  const headerVersion = req.get('api-version') as string | undefined;
  const queryVersion = Array.isArray(req.query.apiVersion)
    ? (req.query.apiVersion[0] as string)
    : (req.query.apiVersion as string | undefined);
  const pathVersion = extractVersionFromPath(req.path);

  let version: string = (headerVersion ||
    queryVersion ||
    pathVersion ||
    versionManager.getCurrentVersion()) as string;

  // Normalize version
  if (!version.startsWith('v')) {
    version = `v${version}`;
  }

  // Check if version is supported
  if (!versionManager.isSupported(version)) {
    return res.status(400).json({
      success: false,
      message: `API version ${version} is not supported`,
      supportedVersions: versionManager.getSupportedVersions(),
      currentVersion: versionManager.getCurrentVersion(),
    });
  }

  // Set version on request
  req.apiVersion = version;
  req.isDeprecated = versionManager.isDeprecated(version);

  // Add deprecation warning header if deprecated
  if (req.isDeprecated) {
    const warning = versionManager.getDeprecationWarning(version);
    if (warning) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', versionManager.getVersion(version)?.sunsetAt?.toISOString() || '');
      res.setHeader('Warning', `299 - "${warning}"`);
      req.deprecationWarning = warning;
    }
  }

  // Add version to response headers
  res.setHeader('API-Version', version);
  res.setHeader('API-Supported-Versions', versionManager.getSupportedVersions().join(', '));

  return next();
};

/**
 * Extract version from URL path
 */
function extractVersionFromPath(path: string): string | undefined {
  const match = path.match(/\/api\/(v\d+)\//);
  return match ? match[1] : undefined;
}

/**
 * Version-specific route handler
 */
export const versionedRoute = (
  version: string,
  handler: (req: VersionedRequest, res: Response, next: NextFunction) => void
) => {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    if (req.apiVersion === version) {
      return handler(req, res, next);
    }
    next();
  };
};

/**
 * Multiple version handler
 */
export const multiVersionHandler = (
  handlers: Record<string, (req: VersionedRequest, res: Response, next: NextFunction) => void>
) => {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    if (req.apiVersion) {
      const handler = handlers[req.apiVersion];
      if (handler) {
        return handler(req, res, next);
      }
    }
    next();
  };
};

/**
 * Version migration helper
 */
export const migrateVersion = (
  fromVersion: string,
  toVersion: string,
  transformer: (data: any) => any
) => {
  return (req: VersionedRequest, res: Response, next: NextFunction) => {
    if (req.apiVersion === fromVersion) {
      // Apply transformation
      const originalSend = res.send;
      res.send = function (data: any) {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          const transformed = transformer(parsed);
          return originalSend.call(this, JSON.stringify(transformed));
        } catch (error) {
          return originalSend.call(this, data);
        }
      };
    }
    next();
  };
};

/**
 * API version info endpoint
 */
export const versionInfoHandler = (req: Request, res: Response) => {
  res.json({
    success: true,
    currentVersion: versionManager.getCurrentVersion(),
    supportedVersions: versionManager.getAllVersions().map((v) => ({
      version: v.version,
      deprecated: v.deprecated,
      deprecatedAt: v.deprecatedAt,
      sunsetAt: v.sunsetAt,
      description: v.description,
    })),
  });
};

/**
 * Export version manager
 */
export function getVersionManager(): ApiVersionManager {
  return versionManager;
}

/**
 * Setup API versioning
 */
export function setupApiVersioning(router: Router): void {
  // Add version info endpoint
  router.get('/api/versions', versionInfoHandler);

  // Add versioning middleware
  router.use(apiVersioning);
}
