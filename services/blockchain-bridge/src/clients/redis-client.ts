/**
 * Redis Client
 * For caching and distributed locking
 */

import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class RedisClient {
  private static client: Redis;

  static async connect(): Promise<void> {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    this.client.on('connect', () => {
      logger.info('Redis connected');
    });
  }

  static async get(key: string): Promise<any> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.client.setex(key, ttl, serialized);
    } else {
      await this.client.set(key, serialized);
    }
  }

  static async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  static async ping(): Promise<void> {
    await this.client.ping();
  }

  static async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Redis disconnected');
  }
}
