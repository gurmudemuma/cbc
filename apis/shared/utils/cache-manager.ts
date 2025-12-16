/**
 * Unified Cache Manager
 * Handles caching to reduce blockchain and database latency
 */

import NodeCache from 'node-cache';

interface CacheConfig {
  stdTTL?: number; // Standard time to live in seconds
  checkperiod?: number; // Check period for auto delete in seconds
  useClones?: boolean; // Clone values on get
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache: NodeCache;
  private config: CacheConfig;

  constructor(config: CacheConfig = {}) {
    this.config = {
      stdTTL: config.stdTTL || 300, // 5 minutes default
      checkperiod: config.checkperiod || 60, // Check every minute
      useClones: config.useClones !== false,
    };

    this.cache = new NodeCache(this.config);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const value = this.cache.get<T>(key);
    return value || null;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const effectiveTtl = ttl ?? this.config.stdTTL ?? 0;
      this.cache.set(key, value, effectiveTtl);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    try {
      this.cache.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.flushAll();
  }

  /**
   * Get or set value (lazy loading)
   */
  async getOrSet<T>(key: string, loader: () => Promise<T>, ttl?: number): Promise<T> {
    // Try to get from cache
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }

    // Load from source
    const value = await loader();

    // Store in cache
    this.set(key, value, ttl);

    return value;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return this.cache.getStats();
  }

  /**
   * Get all keys
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Export cache keys
export const CACHE_KEYS = {
  // Export caches
  export: (exportId: string) => `export:${exportId}`,
  exportsByStatus: (status: string) => `exports:status:${status}`,
  exportsByExporter: (exporterId: string) => `exports:exporter:${exporterId}`,
  allExports: () => 'exports:all',

  // Profile caches
  exporterProfile: (exporterId: string) => `profile:exporter:${exporterId}`,
  userProfile: (userId: string) => `profile:user:${userId}`,

  // License caches
  exportLicense: (licenseId: string) => `license:${licenseId}`,
  exporterLicenses: (exporterId: string) => `licenses:exporter:${exporterId}`,

  // Document caches
  documentChecklist: (exportId: string) => `documents:checklist:${exportId}`,
  documentStatus: (exportId: string) => `documents:status:${exportId}`,

  // Qualification caches
  qualificationStatus: (exporterId: string) => `qualification:${exporterId}`,

  // Lot caches
  ecxLot: (lotId: string) => `lot:ecx:${lotId}`,
  ecxLotsByStatus: (status: string) => `lots:ecx:status:${status}`,

  // Quality caches
  qualityInspection: (inspectionId: string) => `quality:inspection:${inspectionId}`,
  qualityByExport: (exportId: string) => `quality:export:${exportId}`,
};

// Export cache TTLs
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  VERY_LONG: 3600, // 1 hour
};

// Create singleton instance
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    cacheManagerInstance = new CacheManager({
      stdTTL: CACHE_TTL.MEDIUM,
      checkperiod: 60,
    });
  }
  return cacheManagerInstance;
}

/**
 * Cache decorator for async functions
 */
export function Cacheable(
  keyGenerator: (...args: any[]) => string,
  ttl: number = CACHE_TTL.MEDIUM
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCacheManager();
      const key = keyGenerator(...args);

      // Try to get from cache
      const cached = cache.get(key);
      if (cached) {
        return cached;
      }

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cache.set(key, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Invalidate cache decorator
 */
export function InvalidateCache(keyPatterns: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = getCacheManager();

      // Call original method
      const result = await originalMethod.apply(this, args);

      // Invalidate cache
      const allKeys = cache.getKeys();
      for (const pattern of keyPatterns) {
        const regex = new RegExp(pattern);
        allKeys.forEach((key) => {
          if (regex.test(key)) {
            cache.delete(key);
          }
        });
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Batch cache operations
 */
export async function batchGetOrSet<T>(
  items: Array<{ key: string; loader: () => Promise<T> }>,
  ttl?: number
): Promise<T[]> {
  const cache = getCacheManager();
  const results: T[] = [];

  for (const item of items) {
    const result = await cache.getOrSet(item.key, item.loader, ttl);
    results.push(result);
  }

  return results;
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCacheByPattern(pattern: string): number {
  const cache = getCacheManager();
  const allKeys = cache.getKeys();
  const regex = new RegExp(pattern);
  let count = 0;

  allKeys.forEach((key) => {
    if (regex.test(key)) {
      cache.delete(key);
      count++;
    }
  });

  return count;
}

/**
 * Warm up cache
 */
export async function warmUpCache(
  items: Array<{ key: string; loader: () => Promise<any> }>,
  ttl?: number
): Promise<void> {
  const cache = getCacheManager();

  for (const item of items) {
    try {
      const data = await item.loader();
      cache.set(item.key, data, ttl);
    } catch (error) {
      console.error(`Failed to warm up cache for key ${item.key}:`, error);
    }
  }
}

export default getCacheManager;
