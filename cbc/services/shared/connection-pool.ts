/**
 * Connection Pool Manager
 * Manages resource pooling for Fabric Gateway connections and other resources
 */

export interface PoolConfig {
  min: number;
  max: number;
  idleTimeoutMs: number;
  acquireTimeoutMs: number;
  testOnBorrow?: boolean;
}

export interface PooledResource<T> {
  resource: T;
  id: string;
  createdAt: Date;
  lastUsedAt: Date;
  inUse: boolean;
}

export class ResourcePool<T> {
  private resources: PooledResource<T>[] = [];
  private config: PoolConfig;
  private factory: () => Promise<T>;
  private destroyer: (resource: T) => Promise<void>;
  private validator?: (resource: T) => Promise<boolean>;
  private waitQueue: Array<{
    resolve: (resource: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private cleanupInterval?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(
    factory: () => Promise<T>,
    destroyer: (resource: T) => Promise<void>,
    config: Partial<PoolConfig> = {},
    validator?: (resource: T) => Promise<boolean>
  ) {
    this.factory = factory;
    this.destroyer = destroyer;
    this.validator = validator;
    this.config = {
      min: config.min ?? 2,
      max: config.max ?? 10,
      idleTimeoutMs: config.idleTimeoutMs ?? 30000,
      acquireTimeoutMs: config.acquireTimeoutMs ?? 10000,
      testOnBorrow: config.testOnBorrow ?? true,
    };

    // Initialize minimum resources
    this.initialize();

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Initialize minimum number of resources
   */
  private async initialize(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (let i = 0; i < this.config.min; i++) {
      promises.push(this.createResource());
    }
    await Promise.all(promises);
  }

  /**
   * Create a new resource
   */
  private async createResource(): Promise<void> {
    try {
      const resource = await this.factory();
      const pooledResource: PooledResource<T> = {
        resource,
        id: this.generateId(),
        createdAt: new Date(),
        lastUsedAt: new Date(),
        inUse: false,
      };
      this.resources.push(pooledResource);
    } catch (error) {
      console.error('Failed to create resource:', error);
      throw error;
    }
  }

  /**
   * Acquire a resource from the pool
   */
  public async acquire(): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Pool is shutting down');
    }

    // Try to get an available resource
    const available = this.resources.find((r) => !r.inUse);
    
    if (available) {
      // Validate resource if needed
      if (this.config.testOnBorrow && this.validator) {
        const isValid = await this.validator(available.resource);
        if (!isValid) {
          // Remove invalid resource and create a new one
          await this.removeResource(available);
          return this.acquire(); // Retry
        }
      }

      available.inUse = true;
      available.lastUsedAt = new Date();
      return available.resource;
    }

    // If we can create more resources, do so
    if (this.resources.length < this.config.max) {
      await this.createResource();
      return this.acquire();
    }

    // Wait for a resource to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex((w) => w.resolve === resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Resource acquisition timeout'));
      }, this.config.acquireTimeoutMs);

      this.waitQueue.push({ resolve, reject, timeout });
    });
  }

  /**
   * Release a resource back to the pool
   */
  public async release(resource: T): Promise<void> {
    const pooledResource = this.resources.find((r) => r.resource === resource);
    
    if (!pooledResource) {
      console.warn('Attempted to release resource not in pool');
      return;
    }

    pooledResource.inUse = false;
    pooledResource.lastUsedAt = new Date();

    // If there are waiting requests, fulfill them
    if (this.waitQueue.length > 0) {
      const waiter = this.waitQueue.shift();
      if (waiter) {
        clearTimeout(waiter.timeout);
        pooledResource.inUse = true;
        waiter.resolve(resource);
      }
    }
  }

  /**
   * Execute a function with an acquired resource
   */
  public async withResource<R>(fn: (resource: T) => Promise<R>): Promise<R> {
    const resource = await this.acquire();
    try {
      return await fn(resource);
    } finally {
      await this.release(resource);
    }
  }

  /**
   * Remove a resource from the pool
   */
  private async removeResource(pooledResource: PooledResource<T>): Promise<void> {
    const index = this.resources.indexOf(pooledResource);
    if (index !== -1) {
      this.resources.splice(index, 1);
      try {
        await this.destroyer(pooledResource.resource);
      } catch (error) {
        console.error('Error destroying resource:', error);
      }
    }
  }

  /**
   * Start cleanup interval for idle resources
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.idleTimeoutMs);
  }

  /**
   * Clean up idle resources
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const resourcesToRemove: PooledResource<T>[] = [];

    for (const resource of this.resources) {
      // Skip resources in use
      if (resource.inUse) continue;

      // Keep minimum number of resources
      if (this.resources.length - resourcesToRemove.length <= this.config.min) {
        break;
      }

      // Check if resource is idle
      const idleTime = now - resource.lastUsedAt.getTime();
      if (idleTime > this.config.idleTimeoutMs) {
        resourcesToRemove.push(resource);
      }
    }

    // Remove idle resources
    for (const resource of resourcesToRemove) {
      await this.removeResource(resource);
    }
  }

  /**
   * Drain the pool (release all resources)
   */
  public async drain(): Promise<void> {
    this.isShuttingDown = true;

    // Reject all waiting requests
    for (const waiter of this.waitQueue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool is draining'));
    }
    this.waitQueue = [];

    // Stop cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Wait for all resources to be released (with timeout)
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();

    while (this.resources.some((r) => r.inUse)) {
      if (Date.now() - startTime > maxWaitTime) {
        console.warn('Timeout waiting for resources to be released');
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Destroy all resources
    const destroyPromises = this.resources.map((r) => this.removeResource(r));
    await Promise.all(destroyPromises);

    this.resources = [];
  }

  /**
   * Get pool statistics
   */
  public getStats() {
    return {
      total: this.resources.length,
      inUse: this.resources.filter((r) => r.inUse).length,
      available: this.resources.filter((r) => !r.inUse).length,
      waiting: this.waitQueue.length,
      config: this.config,
    };
  }

  /**
   * Generate unique ID for resource
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Simple cache with TTL
 */
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expiresAt: number }>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private ttlMs: number = 60000, cleanupIntervalMs: number = 10000) {
    this.startCleanup(cleanupIntervalMs);
  }

  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  has(key: K): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: K): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private startCleanup(intervalMs: number): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
        }
      }
    }, intervalMs);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      ttlMs: this.ttlMs,
    };
  }
}

/**
 * Circuit Breaker for fault tolerance
 */
export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private nextAttempt = Date.now();

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Operation timeout')), this.config.timeout)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
  }
}

export default {
  ResourcePool,
  TTLCache,
  CircuitBreaker,
  CircuitState,
};
