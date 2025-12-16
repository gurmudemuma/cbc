/**
 * Resilience Service - Retry Logic & Circuit Breaker
 * Best Practice: Prevent cascading failures and improve system resilience
 */

import { createLogger } from './logger';

const logger = createLogger('ResilienceService');

/**
 * Circuit Breaker States
 */
enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

/**
 * Circuit Breaker Configuration
 */
interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time in ms before attempting half-open
  monitoringPeriod: number; // Time window for failure counting
}

/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests to failing services
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private _lastFailureTime: number = 0; // Tracked for monitoring, prefixed with _ to indicate intentionally unused
  private nextAttemptTime: number = 0;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config?: Partial<CircuitBreakerConfig>) {
    this.name = name;
    this.config = {
      failureThreshold: config?.failureThreshold || 5,
      successThreshold: config?.successThreshold || 2,
      timeout: config?.timeout || 60000, // 1 minute
      monitoringPeriod: config?.monitoringPeriod || 60000,
    };
  }

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        const error = new Error(`Circuit breaker '${this.name}' is OPEN`);
        logger.warn('Circuit breaker open, rejecting request', {
          name: this.name,
          nextAttempt: new Date(this.nextAttemptTime).toISOString(),
        });
        throw error;
      }

      // Transition to half-open to test
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      logger.info('Circuit breaker transitioning to HALF_OPEN', { name: this.name });
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        logger.info('Circuit breaker closed after successful recovery', {
          name: this.name,
        });
      }
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.failureCount++;
    this._lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
      return;
    }

    if (this.failureCount >= this.config.failureThreshold) {
      this.open();
    }
  }

  /**
   * Open the circuit breaker
   */
  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttemptTime = Date.now() + this.config.timeout;

    logger.error('Circuit breaker opened due to failures', {
      name: this.name,
      failureCount: this.failureCount,
      nextAttempt: new Date(this.nextAttemptTime).toISOString(),
    });
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this._lastFailureTime = 0;
    this.nextAttemptTime = 0;
    logger.info('Circuit breaker manually reset', { name: this.name });
  }

  /**
   * Get last failure time (for monitoring/debugging)
   */
  getLastFailureTime(): number {
    return this._lastFailureTime;
  }
}

/**
 * Retry Policy Configuration
 */
interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
}

/**
 * Retry Policy with Exponential Backoff
 * Automatically retries failed operations with increasing delays
 */
export class RetryPolicy {
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = {
      maxRetries: config?.maxRetries || 3,
      initialDelayMs: config?.initialDelayMs || 1000,
      maxDelayMs: config?.maxDelayMs || 30000,
      backoffMultiplier: config?.backoffMultiplier || 2,
      retryableErrors: config?.retryableErrors || [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ECONNRESET',
        'EPIPE',
        'EHOSTUNREACH',
      ],
    };
  }

  /**
   * Execute operation with retry logic
   */
  async execute<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        if (attempt > 0) {
          logger.info('Retrying operation', {
            context,
            attempt,
            maxRetries: this.config.maxRetries,
          });
        }

        return await operation();
      } catch (error: any) {
        lastError = error;
        attempt++;

        // Check if error is retryable
        if (!this.isRetryable(error)) {
          logger.warn('Non-retryable error encountered', {
            context,
            error: error.message,
            code: error.code,
          });
          throw error;
        }

        // Check if we've exhausted retries
        if (attempt > this.config.maxRetries) {
          logger.error('Max retries exceeded', {
            context,
            attempts: attempt,
            error: error.message,
          });
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt);

        logger.warn('Operation failed, will retry', {
          context,
          attempt,
          maxRetries: this.config.maxRetries,
          delayMs: delay,
          error: error.message,
        });

        await this.sleep(delay);
      }
    }

    throw lastError || new Error('Operation failed after retries');
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: any): boolean {
    if (!error) return false;

    // Check error code
    if (error.code && this.config.retryableErrors?.includes(error.code)) {
      return true;
    }

    // Check for network errors
    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      return true;
    }

    // Check for temporary blockchain errors
    if (error.message?.includes('MVCC_READ_CONFLICT')) {
      return true;
    }

    return false;
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(attempt: number): number {
    const exponentialDelay =
      this.config.initialDelayMs * Math.pow(this.config.backoffMultiplier, attempt - 1);

    // Cap at max delay
    const cappedDelay = Math.min(exponentialDelay, this.config.maxDelayMs);

    // Add jitter (±25% randomness)
    const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

    return Math.floor(cappedDelay + jitter);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Resilient Blockchain Service
 * Combines circuit breaker and retry logic for blockchain operations
 */
export class ResilientBlockchainService {
  private circuitBreaker: CircuitBreaker;
  private retryPolicy: RetryPolicy;

  constructor(serviceName: string = 'blockchain') {
    this.circuitBreaker = new CircuitBreaker(serviceName, {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000,
    });

    this.retryPolicy = new RetryPolicy({
      maxRetries: 3,
      initialDelayMs: 1000,
      maxDelayMs: 10000,
    });
  }

  /**
   * Execute blockchain transaction with resilience
   */
  async executeTransaction<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      return this.retryPolicy.execute(operation, context);
    });
  }

  /**
   * Execute blockchain query with resilience (read-only)
   */
  async executeQuery<T>(operation: () => Promise<T>, context?: string): Promise<T> {
    // Queries can be more aggressive with retries
    const queryRetryPolicy = new RetryPolicy({
      maxRetries: 5,
      initialDelayMs: 500,
      maxDelayMs: 5000,
    });

    return this.circuitBreaker.execute(async () => {
      return queryRetryPolicy.execute(operation, context);
    });
  }

  /**
   * Get circuit breaker stats
   */
  getStats() {
    return this.circuitBreaker.getStats();
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.circuitBreaker.reset();
  }
}

/**
 * Timeout wrapper
 * Ensures operations don't hang indefinitely
 */
export class TimeoutService {
  /**
   * Execute operation with timeout
   */
  static async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    errorMessage: string = 'Operation timed out'
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
    ]);
  }
}

/**
 * Bulkhead Pattern
 * Limits concurrent operations to prevent resource exhaustion
 */
export class Bulkhead {
  private maxConcurrent: number;
  private currentCount: number = 0;
  private queue: Array<() => void> = [];
  private name: string;

  constructor(name: string, maxConcurrent: number = 10) {
    this.name = name;
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Execute operation with concurrency limit
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Wait for slot if at capacity
    if (this.currentCount >= this.maxConcurrent) {
      await this.waitForSlot();
    }

    this.currentCount++;

    try {
      return await operation();
    } finally {
      this.currentCount--;
      this.releaseSlot();
    }
  }

  /**
   * Wait for available slot
   */
  private waitForSlot(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Release slot and notify waiting operations
   */
  private releaseSlot(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    }
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      name: this.name,
      currentCount: this.currentCount,
      maxConcurrent: this.maxConcurrent,
      queueLength: this.queue.length,
    };
  }
}

/**
 * Global resilience manager
 */
export class ResilienceManager {
  private static instance: ResilienceManager;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private bulkheads: Map<string, Bulkhead> = new Map();

  private constructor() {}

  static getInstance(): ResilienceManager {
    if (!ResilienceManager.instance) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }

  /**
   * Get or create circuit breaker
   */
  getCircuitBreaker(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(name, new CircuitBreaker(name, config));
    }
    return this.circuitBreakers.get(name)!;
  }

  /**
   * Get or create bulkhead
   */
  getBulkhead(name: string, maxConcurrent: number = 10): Bulkhead {
    if (!this.bulkheads.has(name)) {
      this.bulkheads.set(name, new Bulkhead(name, maxConcurrent));
    }
    return this.bulkheads.get(name)!;
  }

  /**
   * Get all stats
   */
  getAllStats() {
    return {
      circuitBreakers: Array.from(this.circuitBreakers.values()).map((cb) => cb.getStats()),
      bulkheads: Array.from(this.bulkheads.values()).map((bh) => bh.getStats()),
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.circuitBreakers.forEach((cb) => cb.reset());
    logger.info('All circuit breakers reset');
  }
}

export default {
  CircuitBreaker,
  RetryPolicy,
  ResilientBlockchainService,
  TimeoutService,
  Bulkhead,
  ResilienceManager,
};
