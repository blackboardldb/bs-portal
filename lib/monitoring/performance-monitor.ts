// Performance Monitoring System
// Tracks and analyzes performance metrics for database operations and services

import { logger, LogContext } from "./logger";

export interface PerformanceMetric {
  operation: string;
  resource: string;
  provider: string;
  duration: number;
  timestamp: string;
  success: boolean;
  recordCount?: number;
  cacheHit?: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceStats {
  operation: string;
  resource: string;
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  successRate: number;
  lastExecuted: string;
}

export interface PerformanceAlert {
  type:
    | "SLOW_OPERATION"
    | "HIGH_ERROR_RATE"
    | "MEMORY_USAGE"
    | "CACHE_MISS_RATE";
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: string;
  context: LogContext;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private maxMetricsCount: number = 10000;
  private alertThresholds: Record<string, number> = {
    slowOperationMs: 1000,
    highErrorRatePercent: 10,
    cacheMissRatePercent: 50,
  };
  private alerts: PerformanceAlert[] = [];
  private maxAlertsCount: number = 1000;

  private constructor() {
    // Load thresholds from environment
    this.alertThresholds = {
      slowOperationMs: parseInt(process.env.PERF_SLOW_OPERATION_MS || "1000"),
      highErrorRatePercent: parseInt(
        process.env.PERF_HIGH_ERROR_RATE_PERCENT || "10"
      ),
      cacheMissRatePercent: parseInt(
        process.env.PERF_CACHE_MISS_RATE_PERCENT || "50"
      ),
    };

    // Start periodic cleanup
    this.startPeriodicCleanup();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Record a performance metric
  recordMetric(metric: Omit<PerformanceMetric, "timestamp">): void {
    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };

    this.metrics.push(fullMetric);

    // Trim metrics if we exceed max count
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics = this.metrics.slice(-this.maxMetricsCount);
    }

    // Check for performance issues
    this.checkPerformanceAlerts(fullMetric);

    // Log performance metric
    logger.logPerformance(
      `${metric.operation} on ${metric.resource}`,
      metric.duration,
      {
        operation: metric.operation,
        resource: metric.resource,
        provider: metric.provider,
        success: metric.success,
        recordCount: metric.recordCount,
        cacheHit: metric.cacheHit,
      }
    );
  }

  // Check for performance alerts
  private checkPerformanceAlerts(metric: PerformanceMetric): void {
    // Check for slow operations
    if (metric.duration > this.alertThresholds.slowOperationMs) {
      this.addAlert({
        type: "SLOW_OPERATION",
        message: `Slow operation detected: ${metric.operation} on ${metric.resource} took ${metric.duration}ms`,
        threshold: this.alertThresholds.slowOperationMs,
        currentValue: metric.duration,
        timestamp: new Date().toISOString(),
        context: {
          operation: metric.operation,
          resource: metric.resource,
          provider: metric.provider,
          duration: metric.duration,
        },
      });
    }

    // Check error rate for recent operations
    const recentMetrics = this.getRecentMetrics(
      metric.operation,
      metric.resource,
      100
    );
    if (recentMetrics.length >= 10) {
      const errorRate =
        (recentMetrics.filter((m) => !m.success).length /
          recentMetrics.length) *
        100;

      if (errorRate > this.alertThresholds.highErrorRatePercent) {
        this.addAlert({
          type: "HIGH_ERROR_RATE",
          message: `High error rate detected: ${errorRate.toFixed(1)}% for ${
            metric.operation
          } on ${metric.resource}`,
          threshold: this.alertThresholds.highErrorRatePercent,
          currentValue: errorRate,
          timestamp: new Date().toISOString(),
          context: {
            operation: metric.operation,
            resource: metric.resource,
            provider: metric.provider,
            errorRate,
          },
        });
      }
    }

    // Check cache miss rate
    const recentCacheMetrics = recentMetrics.filter(
      (m) => m.cacheHit !== undefined
    );
    if (recentCacheMetrics.length >= 10) {
      const cacheMissRate =
        (recentCacheMetrics.filter((m) => !m.cacheHit).length /
          recentCacheMetrics.length) *
        100;

      if (cacheMissRate > this.alertThresholds.cacheMissRatePercent) {
        this.addAlert({
          type: "CACHE_MISS_RATE",
          message: `High cache miss rate detected: ${cacheMissRate.toFixed(
            1
          )}% for ${metric.operation} on ${metric.resource}`,
          threshold: this.alertThresholds.cacheMissRatePercent,
          currentValue: cacheMissRate,
          timestamp: new Date().toISOString(),
          context: {
            operation: metric.operation,
            resource: metric.resource,
            provider: metric.provider,
            cacheMissRate,
          },
        });
      }
    }
  }

  // Add performance alert
  private addAlert(alert: PerformanceAlert): void {
    this.alerts.push(alert);

    // Trim alerts if we exceed max count
    if (this.alerts.length > this.maxAlertsCount) {
      this.alerts = this.alerts.slice(-this.maxAlertsCount);
    }

    // Log alert
    logger.warn(`Performance Alert: ${alert.message}`, alert.context);
  }

  // Get recent metrics for a specific operation
  private getRecentMetrics(
    operation: string,
    resource: string,
    count: number
  ): PerformanceMetric[] {
    return this.metrics
      .filter((m) => m.operation === operation && m.resource === resource)
      .slice(-count);
  }

  // Get performance statistics for an operation
  getOperationStats(operation: string, resource?: string): PerformanceStats[] {
    const filteredMetrics = this.metrics.filter(
      (m) => m.operation === operation && (!resource || m.resource === resource)
    );

    // Group by resource
    const groupedMetrics = filteredMetrics.reduce((acc, metric) => {
      const key = `${metric.operation}:${metric.resource}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    return Object.entries(groupedMetrics).map(([key, metrics]) => {
      const durations = metrics.map((m) => m.duration);
      const successCount = metrics.filter((m) => m.success).length;

      return {
        operation: metrics[0].operation,
        resource: metrics[0].resource,
        count: metrics.length,
        totalDuration: durations.reduce((sum, d) => sum + d, 0),
        averageDuration:
          durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        successRate: (successCount / metrics.length) * 100,
        lastExecuted: metrics[metrics.length - 1].timestamp,
      };
    });
  }

  // Get overall performance summary
  getPerformanceSummary(): {
    totalOperations: number;
    averageDuration: number;
    successRate: number;
    slowOperations: number;
    cacheHitRate: number;
    topSlowOperations: Array<{
      operation: string;
      resource: string;
      avgDuration: number;
    }>;
    recentAlerts: PerformanceAlert[];
  } {
    const totalOperations = this.metrics.length;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = this.metrics.filter((m) => m.success).length;
    const slowOperations = this.metrics.filter(
      (m) => m.duration > this.alertThresholds.slowOperationMs
    ).length;

    const cacheMetrics = this.metrics.filter((m) => m.cacheHit !== undefined);
    const cacheHits = cacheMetrics.filter((m) => m.cacheHit).length;
    const cacheHitRate =
      cacheMetrics.length > 0 ? (cacheHits / cacheMetrics.length) * 100 : 0;

    // Get top slow operations
    const operationStats = this.getOperationStats("");
    const topSlowOperations = operationStats
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10)
      .map((stat) => ({
        operation: stat.operation,
        resource: stat.resource,
        avgDuration: stat.averageDuration,
      }));

    return {
      totalOperations,
      averageDuration:
        totalOperations > 0 ? totalDuration / totalOperations : 0,
      successRate:
        totalOperations > 0 ? (successCount / totalOperations) * 100 : 0,
      slowOperations,
      cacheHitRate,
      topSlowOperations,
      recentAlerts: this.alerts.slice(-10),
    };
  }

  // Get metrics for a time range
  getMetricsInTimeRange(
    startTime: string,
    endTime: string
  ): PerformanceMetric[] {
    const start = new Date(startTime);
    const end = new Date(endTime);

    return this.metrics.filter((m) => {
      const metricTime = new Date(m.timestamp);
      return metricTime >= start && metricTime <= end;
    });
  }

  // Get provider comparison
  getProviderComparison(): Array<{
    provider: string;
    operationCount: number;
    averageDuration: number;
    successRate: number;
    cacheHitRate: number;
  }> {
    const providerMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.provider]) {
        acc[metric.provider] = [];
      }
      acc[metric.provider].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    return Object.entries(providerMetrics).map(([provider, metrics]) => {
      const successCount = metrics.filter((m) => m.success).length;
      const cacheMetrics = metrics.filter((m) => m.cacheHit !== undefined);
      const cacheHits = cacheMetrics.filter((m) => m.cacheHit).length;

      return {
        provider,
        operationCount: metrics.length,
        averageDuration:
          metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length,
        successRate: (successCount / metrics.length) * 100,
        cacheHitRate:
          cacheMetrics.length > 0 ? (cacheHits / cacheMetrics.length) * 100 : 0,
      };
    });
  }

  // Get recent alerts
  getRecentAlerts(count: number = 50): PerformanceAlert[] {
    return this.alerts.slice(-count);
  }

  // Clear old metrics and alerts
  private startPeriodicCleanup(): void {
    setInterval(() => {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      // Remove old metrics
      this.metrics = this.metrics.filter(
        (m) => new Date(m.timestamp) > cutoffTime
      );

      // Remove old alerts
      this.alerts = this.alerts.filter(
        (a) => new Date(a.timestamp) > cutoffTime
      );

      logger.debug("Performance monitor cleanup completed", {
        operation: "cleanup",
        metricsCount: this.metrics.length,
        alertsCount: this.alerts.length,
      });
    }, 60 * 60 * 1000); // Run every hour
  }

  // Export metrics for external analysis
  exportMetrics(): {
    metrics: PerformanceMetric[];
    alerts: PerformanceAlert[];
    summary: ReturnType<typeof this.getPerformanceSummary>;
    exportedAt: string;
  } {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      summary: this.getPerformanceSummary(),
      exportedAt: new Date().toISOString(),
    };
  }

  // Clear all metrics and alerts
  clear(): void {
    this.metrics = [];
    this.alerts = [];
    logger.info("Performance monitor data cleared");
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Decorator for automatic performance monitoring
export function monitorPerformance(operation?: string, resource?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const operationName =
      operation || `${target.constructor.name}.${propertyName}`;
    const resourceName =
      resource || target.repositoryName || target.entityName || "unknown";

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      let success = true;
      let recordCount: number | undefined;
      let cacheHit: boolean | undefined;

      try {
        const result = await method.apply(this, args);

        // Try to extract record count from result
        if (result && typeof result === "object") {
          if (Array.isArray(result)) {
            recordCount = result.length;
          } else if (result.items && Array.isArray(result.items)) {
            recordCount = result.items.length;
          } else if (result.data && Array.isArray(result.data)) {
            recordCount = result.data.length;
          }

          // Check for cache hit indicator
          if (result.fromCache !== undefined) {
            cacheHit = result.fromCache;
          }
        }

        return result;
      } catch (error) {
        success = false;
        throw error;
      } finally {
        const duration = Date.now() - start;

        performanceMonitor.recordMetric({
          operation: operationName,
          resource: resourceName,
          provider: this.providerType || "unknown",
          duration,
          success,
          recordCount,
          cacheHit,
        });
      }
    };

    return descriptor;
  };
}
