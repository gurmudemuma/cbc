/**
 * Redis Cache Service
 * Provides caching functionality for frequently accessed blockchain data
 */

import { createClient, RedisClientType } from 'redis';
import { createLogger } from './logger';

const logger = createLogger('CacheService');

export class CacheService {
  private static instance: CacheService;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private readonly defaultTTL: number = 300; // 5 minutes

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Connect to Redis
   */
  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.warn('Redis client already connected');
      return;
    }

    try {
      const redisUrl = process.env['REDIS_URL'] || 'redis://localhost:6379';
      const redisPassword = process.env['REDIS_PASSWORD'];

      this.client = createClient({
        url: redisUrl,
        password: redisPassword,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              logger.error('Redis reconnection failed after 10 attempts');
              return new Error('Redis reconnection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err: Error) => {
        logger.error('Redis client error', { error: err });
      });

      this.client.on('connect', () => {
        logger.info('Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis client reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      logger.info('Redis client disconnected');
    }
  }

  /**
   * Check if cache is available
   */
  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get value from cache
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      logger.debug('Cache not available, skipping get');
      return null;
    }

    try {
      const value = await this.client!.get(key);
      if (value) {
        logger.debug('Cache hit', { key });
        return JSON.parse(value) as T;
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  public async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      logger.debug('Cache not available, skipping set');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const expiryTime = ttl || this.defaultTTL;

      await this.client!.setEx(key, expiryTime, serialized);
      logger.debug('Cache set', { key, ttl: expiryTime });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  public async delete(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.del(key);
      logger.debug('Cache deleted', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  public async deletePattern(pattern: string): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(keys);
        logger.debug('Cache pattern deleted', { pattern, count: keys.length });
        return keys.length;
      }
      return 0;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  public async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute fetch function
    const value = await fetchFn();

    // Cache the result
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Increment a counter
   */
  public async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      const result = await this.client!.incrBy(key, amount);
      return result;
    } catch (error) {
      logger.error('Cache increment error', { key, error });
      return 0;
    }
  }

  /**
   * Set expiry on a key
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Cache expire error', { key, error });
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  public async getStats(): Promise<any> {
    if (!this.isAvailable()) {
      return { available: false };
    }

    try {
      const info = await this.client!.info('stats');
      const dbSize = await this.client!.dbSize();

      return {
        available: true,
        connected: this.isConnected,
        dbSize,
        info,
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return { available: false, error };
    }
  }

  /**
   * Flush all cache
   */
  public async flushAll(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.client!.flushAll();
      logger.warn('Cache flushed - all keys deleted');
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error });
      return false;
    }
  }
}

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
  export: (exportId: string) => `export:${exportId}`,
  exportsByStatus: (status: string) => `exports:status:${status}`,
  exportHistory: (exportId: string) => `export:${exportId}:history`,
  userProfile: (userId: string) => `user:${userId}`,
  allExports: () => 'exports:all',
};

/**
 * Cache TTL constants (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 900, // 15 minutes
  HOUR: 3600, // 1 hour
  DAY: 86400, // 24 hours
};

export default CacheService;
