/**
 * Prometheus Metrics Service
 * Provides application and blockchain metrics for monitoring
 */

import { createLogger } from './logger';

const logger = createLogger('MetricsService');

// Mock types until prom-client is installed
type Counter = any;
type Histogram = any;
type Gauge = any;
type Registry = any;

// Mock prom-client until installed
const mockRegister = {
  metrics: () => '',
  contentType: 'text/plain',
};

const mockCounter = (_config: any) => ({
  inc: (_labels?: any, _value?: number) => {},
  labels: (_labels: any) => ({ inc: (_value?: number) => {} }),
});

const mockHistogram = (_config: any) => ({
  observe: (_labels: any, _value: number) => {},
  labels: (_labels: any) => ({ observe: (_value: number) => {} }),
});

const mockGauge = (_config: any) => ({
  set: (_labels: any, _value: number) => {},
  inc: (_labels?: any, _value?: number) => {},
  dec: (_labels?: any, _value?: number) => {},
  labels: (_labels: any) => ({ set: (_value: number) => {} }),
});

export class MetricsService {
  private static instance: MetricsService;
  private register: Registry;
  
  // HTTP Metrics
  private httpRequestsTotal: Counter;
  private httpRequestDuration: Histogram;
  private httpRequestSize: Histogram;
  private httpResponseSize: Histogram;
  
  // Blockchain Metrics
  private blockchainOperationsTotal: Counter;
  private blockchainOperationDuration: Histogram;
  private blockchainConnectionStatus: Gauge;
  
  // Application Metrics
  private activeConnections: Gauge;
  private cacheHitRate: Gauge;
  private errorRate: Counter;
  
  // Business Metrics
  private exportsCreated: Counter;
  private exportsCompleted: Counter;
  private exportsByStatus: Gauge;

  private constructor() {
    this.register = mockRegister;
    this.initializeMetrics();
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private initializeMetrics(): void {
    try {
      // HTTP Metrics
      this.httpRequestsTotal = mockCounter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code', 'service'],
      });

      this.httpRequestDuration = mockHistogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code', 'service'],
        buckets: [0.1, 0.5, 1, 2, 5, 10],
      });

      this.httpRequestSize = mockHistogram({
        name: 'http_request_size_bytes',
        help: 'Size of HTTP requests in bytes',
        labelNames: ['method', 'route', 'service'],
        buckets: [100, 1000, 10000, 100000, 1000000],
      });

      this.httpResponseSize = mockHistogram({
        name: 'http_response_size_bytes',
        help: 'Size of HTTP responses in bytes',
        labelNames: ['method', 'route', 'service'],
        buckets: [100, 1000, 10000, 100000, 1000000],
      });

      // Blockchain Metrics
      this.blockchainOperationsTotal = mockCounter({
        name: 'blockchain_operations_total',
        help: 'Total number of blockchain operations',
        labelNames: ['operation', 'status', 'service'],
      });

      this.blockchainOperationDuration = mockHistogram({
        name: 'blockchain_operation_duration_seconds',
        help: 'Duration of blockchain operations in seconds',
        labelNames: ['operation', 'service'],
        buckets: [0.5, 1, 2, 5, 10, 30],
      });

      this.blockchainConnectionStatus = mockGauge({
        name: 'blockchain_connection_status',
        help: 'Blockchain connection status (1 = connected, 0 = disconnected)',
        labelNames: ['service'],
      });

      // Application Metrics
      this.activeConnections = mockGauge({
        name: 'active_connections',
        help: 'Number of active connections',
        labelNames: ['type', 'service'],
      });

      this.cacheHitRate = mockGauge({
        name: 'cache_hit_rate',
        help: 'Cache hit rate percentage',
        labelNames: ['service'],
      });

      this.errorRate = mockCounter({
        name: 'errors_total',
        help: 'Total number of errors',
        labelNames: ['type', 'service'],
      });

      // Business Metrics
      this.exportsCreated = mockCounter({
        name: 'exports_created_total',
        help: 'Total number of exports created',
        labelNames: ['service'],
      });

      this.exportsCompleted = mockCounter({
        name: 'exports_completed_total',
        help: 'Total number of exports completed',
        labelNames: ['service'],
      });

      this.exportsByStatus = mockGauge({
        name: 'exports_by_status',
        help: 'Number of exports by status',
        labelNames: ['status', 'service'],
      });

      logger.info('Metrics initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize metrics', { error });
    }
  }

  /**
   * Record HTTP request metrics
   */
  public recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number,
    requestSize: number,
    responseSize: number,
    service: string
  ): void {
    try {
      this.httpRequestsTotal.labels(method, route, statusCode.toString(), service).inc();
      this.httpRequestDuration.labels(method, route, statusCode.toString(), service).observe(duration);
      this.httpRequestSize.labels(method, route, service).observe(requestSize);
      this.httpResponseSize.labels(method, route, service).observe(responseSize);
    } catch (error) {
      logger.error('Failed to record HTTP metrics', { error });
    }
  }

  /**
   * Record blockchain operation metrics
   */
  public recordBlockchainOperation(
    operation: string,
    status: 'success' | 'failure',
    duration: number,
    service: string
  ): void {
    try {
      this.blockchainOperationsTotal.labels(operation, status, service).inc();
      this.blockchainOperationDuration.labels(operation, service).observe(duration);
    } catch (error) {
      logger.error('Failed to record blockchain metrics', { error });
    }
  }

  /**
   * Set blockchain connection status
   */
  public setBlockchainConnectionStatus(connected: boolean, service: string): void {
    try {
      this.blockchainConnectionStatus.labels(service).set(connected ? 1 : 0);
    } catch (error) {
      logger.error('Failed to set blockchain connection status', { error });
    }
  }

  /**
   * Record active connections
   */
  public setActiveConnections(count: number, type: string, service: string): void {
    try {
      this.activeConnections.labels(type, service).set(count);
    } catch (error) {
      logger.error('Failed to set active connections', { error });
    }
  }

  /**
   * Record cache hit rate
   */
  public setCacheHitRate(rate: number, service: string): void {
    try {
      this.cacheHitRate.labels(service).set(rate);
    } catch (error) {
      logger.error('Failed to set cache hit rate', { error });
    }
  }

  /**
   * Record error
   */
  public recordError(type: string, service: string): void {
    try {
      this.errorRate.labels(type, service).inc();
    } catch (error) {
      logger.error('Failed to record error', { error });
    }
  }

  /**
   * Record export created
   */
  public recordExportCreated(service: string): void {
    try {
      this.exportsCreated.labels(service).inc();
    } catch (error) {
      logger.error('Failed to record export created', { error });
    }
  }

  /**
   * Record export completed
   */
  public recordExportCompleted(service: string): void {
    try {
      this.exportsCompleted.labels(service).inc();
    } catch (error) {
      logger.error('Failed to record export completed', { error });
    }
  }

  /**
   * Set exports by status
   */
  public setExportsByStatus(status: string, count: number, service: string): void {
    try {
      this.exportsByStatus.labels(status, service).set(count);
    } catch (error) {
      logger.error('Failed to set exports by status', { error });
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  public getMetrics(): string {
    try {
      return this.register.metrics();
    } catch (error) {
      logger.error('Failed to get metrics', { error });
      return '';
    }
  }

  /**
   * Get content type for metrics endpoint
   */
  public getContentType(): string {
    return this.register.contentType;
  }

  /**
   * Express middleware for automatic HTTP metrics collection
   */
  public middleware(serviceName: string) {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      const requestSize = parseInt(req.get('content-length') || '0', 10);

      res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const responseSize = parseInt(res.get('content-length') || '0', 10);
        
        this.recordHttpRequest(
          req.method,
          req.route?.path || req.path,
          res.statusCode,
          duration,
          requestSize,
          responseSize,
          serviceName
        );
      });

      next();
    };
  }
}

export default MetricsService;
