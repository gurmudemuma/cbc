import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum MetricType {
  // Performance metrics
  TRANSACTION_DURATION = 'transaction_duration',
  API_RESPONSE_TIME = 'api_response_time',
  BLOCKCHAIN_QUERY_TIME = 'blockchain_query_time',
  
  // Business metrics
  EXPORTS_CREATED = 'exports_created',
  EXPORTS_APPROVED = 'exports_approved',
  EXPORTS_REJECTED = 'exports_rejected',
  PAYMENTS_CONFIRMED = 'payments_confirmed',
  
  // System health
  BLOCKCHAIN_CONNECTION_STATUS = 'blockchain_connection_status',
  DATABASE_CONNECTION_STATUS = 'database_connection_status',
  IPFS_CONNECTION_STATUS = 'ipfs_connection_status',
  
  // SLA metrics
  APPROVAL_TIME = 'approval_time',
  SLA_VIOLATION = 'sla_violation',
  
  // Error metrics
  API_ERROR_RATE = 'api_error_rate',
  BLOCKCHAIN_ERROR_RATE = 'blockchain_error_rate',
}

export interface Metric {
  type: MetricType;
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface Alert {
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface SLAConfig {
  fxApproval: number; // hours
  bankingApproval: number;
  qualityApproval: number;
  customsClearance: number;
  totalProcessing: number;
}

export class MonitoringService {
  private logger: winston.Logger;
  private static instance: MonitoringService;
  private metrics: Map<string, Metric[]> = new Map();
  private alerts: Alert[] = [];
  
  // SLA configuration (in hours)
  private slaConfig: SLAConfig = {
    fxApproval: 24,
    bankingApproval: 48,
    qualityApproval: 72,
    customsClearance: 48,
    totalProcessing: 240, // 10 days
  };

  private constructor() {
    const logsDir = path.join(process.cwd(), 'logs', 'monitoring');

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new DailyRotateFile({
          filename: path.join(logsDir, 'metrics-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
        new DailyRotateFile({
          filename: path.join(logsDir, 'alerts-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          level: 'warn',
        }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        })
      );
    }

    // Start periodic health checks
    this.startHealthChecks();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Record a metric
   */
  public recordMetric(metric: Metric): void {
    const key = `${metric.type}:${JSON.stringify(metric.tags || {})}`;
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metricList = this.metrics.get(key)!;
    metricList.push(metric);
    
    // Keep only last 1000 metrics per key
    if (metricList.length > 1000) {
      metricList.shift();
    }

    this.logger.info('Metric recorded', {
      type: metric.type,
      value: metric.value,
      tags: metric.tags,
      timestamp: metric.timestamp,
    });

    // Check for threshold violations
    this.checkThresholds(metric);
  }

  /**
   * Create an alert
   */
  public createAlert(alert: Alert): void {
    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }

    const logLevel = this.getLogLevel(alert.level);
    this.logger.log(logLevel, 'Alert created', {
      level: alert.level,
      title: alert.title,
      message: alert.message,
      source: alert.source,
      metadata: alert.metadata,
      timestamp: alert.timestamp,
    });

    // In production, send to alerting system (PagerDuty, Slack, etc.)
    this.sendAlertNotification(alert);
  }

  /**
   * Track API response time
   */
  public trackAPIResponseTime(endpoint: string, duration: number): void {
    this.recordMetric({
      type: MetricType.API_RESPONSE_TIME,
      value: duration,
      timestamp: new Date(),
      tags: { endpoint },
    });

    // Alert if response time is too slow
    if (duration > 5000) { // 5 seconds
      this.createAlert({
        level: AlertLevel.WARNING,
        title: 'Slow API Response',
        message: `Endpoint ${endpoint} took ${duration}ms to respond`,
        timestamp: new Date(),
        source: 'api-monitor',
        metadata: { endpoint, duration },
      });
    }
  }

  /**
   * Track blockchain transaction time
   */
  public trackBlockchainTransaction(
    operation: string,
    duration: number,
    success: boolean
  ): void {
    this.recordMetric({
      type: MetricType.TRANSACTION_DURATION,
      value: duration,
      timestamp: new Date(),
      tags: { operation, success: success.toString() },
    });

    if (!success) {
      this.createAlert({
        level: AlertLevel.ERROR,
        title: 'Blockchain Transaction Failed',
        message: `Operation ${operation} failed after ${duration}ms`,
        timestamp: new Date(),
        source: 'blockchain-monitor',
        metadata: { operation, duration },
      });
    }
  }

  /**
   * Check SLA compliance for export processing
   */
  public checkSLACompliance(
    exportId: string,
    stage: keyof SLAConfig,
    startTime: Date,
    endTime: Date
  ): boolean {
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    const slaLimit = this.slaConfig[stage];
    const violated = durationHours > slaLimit;

    this.recordMetric({
      type: MetricType.APPROVAL_TIME,
      value: durationHours,
      timestamp: new Date(),
      tags: { stage, exportId },
      metadata: { slaLimit, violated },
    });

    if (violated) {
      this.recordMetric({
        type: MetricType.SLA_VIOLATION,
        value: 1,
        timestamp: new Date(),
        tags: { stage, exportId },
      });

      this.createAlert({
        level: AlertLevel.WARNING,
        title: 'SLA Violation',
        message: `Export ${exportId} exceeded SLA for ${stage}: ${durationHours.toFixed(2)}h (limit: ${slaLimit}h)`,
        timestamp: new Date(),
        source: 'sla-monitor',
        metadata: { exportId, stage, durationHours, slaLimit },
      });
    }

    return !violated;
  }

  /**
   * Track export creation
   */
  public trackExportCreated(exportId: string, estimatedValue: number): void {
    this.recordMetric({
      type: MetricType.EXPORTS_CREATED,
      value: 1,
      timestamp: new Date(),
      tags: { exportId },
      metadata: { estimatedValue },
    });
  }

  /**
   * Track export approval/rejection
   */
  public trackExportDecision(
    exportId: string,
    stage: string,
    approved: boolean
  ): void {
    const metricType = approved
      ? MetricType.EXPORTS_APPROVED
      : MetricType.EXPORTS_REJECTED;

    this.recordMetric({
      type: metricType,
      value: 1,
      timestamp: new Date(),
      tags: { exportId, stage },
    });
  }

  /**
   * Monitor system health
   */
  public recordSystemHealth(
    component: 'blockchain' | 'database' | 'ipfs',
    healthy: boolean,
    responseTime?: number
  ): void {
    const metricType =
      component === 'blockchain'
        ? MetricType.BLOCKCHAIN_CONNECTION_STATUS
        : component === 'database'
        ? MetricType.DATABASE_CONNECTION_STATUS
        : MetricType.IPFS_CONNECTION_STATUS;

    this.recordMetric({
      type: metricType,
      value: healthy ? 1 : 0,
      timestamp: new Date(),
      tags: { component },
      metadata: { responseTime },
    });

    if (!healthy) {
      this.createAlert({
        level: AlertLevel.CRITICAL,
        title: `${component.toUpperCase()} Connection Failed`,
        message: `Unable to connect to ${component}`,
        timestamp: new Date(),
        source: 'health-check',
        metadata: { component, responseTime },
      });
    }
  }

  /**
   * Get metrics summary
   */
  public getMetricsSummary(
    type: MetricType,
    startTime?: Date,
    endTime?: Date
  ): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
  } {
    const allMetrics: Metric[] = [];
    
    for (const [key, metrics] of this.metrics.entries()) {
      if (key.startsWith(type)) {
        allMetrics.push(...metrics);
      }
    }

    let filteredMetrics = allMetrics;
    if (startTime || endTime) {
      filteredMetrics = allMetrics.filter((m) => {
        const time = m.timestamp.getTime();
        if (startTime && time < startTime.getTime()) return false;
        if (endTime && time > endTime.getTime()) return false;
        return true;
      });
    }

    if (filteredMetrics.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const values = filteredMetrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: values.length,
      average: sum / values.length,
      min: values[0]!,
      max: values[values.length - 1]!,
      p95: values[Math.floor(values.length * 0.95)]!,
      p99: values[Math.floor(values.length * 0.99)]!,
    };
  }

  /**
   * Get recent alerts
   */
  public getRecentAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Check system health every 5 minutes
    setInterval(() => {
      this.performHealthCheck();
    }, 5 * 60 * 1000);

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    // This is a placeholder - implement actual health checks
    // based on your infrastructure
    
    // Example: Check blockchain connection
    // const blockchainHealthy = await checkBlockchainConnection();
    // this.recordSystemHealth('blockchain', blockchainHealthy);
  }

  /**
   * Check metric thresholds
   */
  private checkThresholds(metric: Metric): void {
    // Define thresholds for different metrics
    const thresholds: Record<string, { warning: number; critical: number }> = {
      [MetricType.API_RESPONSE_TIME]: { warning: 3000, critical: 5000 },
      [MetricType.BLOCKCHAIN_QUERY_TIME]: { warning: 5000, critical: 10000 },
      [MetricType.API_ERROR_RATE]: { warning: 0.05, critical: 0.1 }, // 5% and 10%
    };

    const threshold = thresholds[metric.type];
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      this.createAlert({
        level: AlertLevel.CRITICAL,
        title: `Critical Threshold Exceeded: ${metric.type}`,
        message: `Value ${metric.value} exceeds critical threshold ${threshold.critical}`,
        timestamp: new Date(),
        source: 'threshold-monitor',
        metadata: { metric, threshold },
      });
    } else if (metric.value >= threshold.warning) {
      this.createAlert({
        level: AlertLevel.WARNING,
        title: `Warning Threshold Exceeded: ${metric.type}`,
        message: `Value ${metric.value} exceeds warning threshold ${threshold.warning}`,
        timestamp: new Date(),
        source: 'threshold-monitor',
        metadata: { metric, threshold },
      });
    }
  }

  /**
   * Send alert notification
   */
  private sendAlertNotification(_alert: Alert): void {
    // In production, integrate with:
    // - Email (nodemailer)
    // - SMS (Twilio)
    // - Slack
    // - PagerDuty
    // - Microsoft Teams
    
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Slack
      // await sendSlackNotification(alert);
      
      // Example: Send email for critical alerts
      // if (alert.level === AlertLevel.CRITICAL) {
      //   await sendEmailAlert(alert);
      // }
    }
  }

  /**
   * Get log level for alert
   */
  private getLogLevel(alertLevel: AlertLevel): string {
    switch (alertLevel) {
      case AlertLevel.CRITICAL:
      case AlertLevel.ERROR:
        return 'error';
      case AlertLevel.WARNING:
        return 'warn';
      default:
        return 'info';
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance();
