// Health Check System
// Provides comprehensive health monitoring for both Mock and Prisma providers

import {
  DataProviderFactory,
  ProviderType,
} from "../data-layer/provider-factory";
import { logger, LogContext } from "./logger";
import { performanceMonitor } from "./performance-monitor";

export interface HealthCheckResult {
  name: string;
  status: "healthy" | "unhealthy" | "degraded";
  message: string;
  duration: number;
  timestamp: string;
  details?: Record<string, any>;
}

export interface SystemHealthReport {
  overall: "healthy" | "unhealthy" | "degraded";
  provider: ProviderType;
  checks: HealthCheckResult[];
  summary: {
    healthy: number;
    unhealthy: number;
    degraded: number;
    total: number;
  };
  generatedAt: string;
  uptime: number;
}

export class HealthChecker {
  private static instance: HealthChecker;
  private startTime: number;
  private lastHealthCheck: SystemHealthReport | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.startTime = Date.now();
    this.startPeriodicHealthChecks();
  }

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  // Perform comprehensive health check
  async performHealthCheck(): Promise<SystemHealthReport> {
    const startTime = Date.now();
    const checks: HealthCheckResult[] = [];

    logger.info("Starting system health check");

    try {
      // Check data provider health
      checks.push(await this.checkDataProvider());

      // Check database connectivity
      checks.push(await this.checkDatabaseConnectivity());

      // Check repository operations
      checks.push(await this.checkRepositoryOperations());

      // Check service layer
      checks.push(await this.checkServiceLayer());

      // Check performance metrics
      checks.push(await this.checkPerformanceMetrics());

      // Check memory usage
      checks.push(await this.checkMemoryUsage());

      // Check cache functionality
      checks.push(await this.checkCacheFunctionality());
    } catch (error) {
      logger.error(
        "Health check failed",
        { operation: "healthCheck" },
        error as Error
      );

      checks.push({
        name: "health_check_system",
        status: "unhealthy",
        message: `Health check system failed: ${(error as Error).message}`,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate overall health
    const summary = this.calculateHealthSummary(checks);
    const overall = this.determineOverallHealth(summary);

    const report: SystemHealthReport = {
      overall,
      provider: DataProviderFactory.getCurrentProviderType() || "mock",
      checks,
      summary,
      generatedAt: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
    };

    this.lastHealthCheck = report;

    logger.info("Health check completed", {
      operation: "healthCheck",
      overall,
      duration: Date.now() - startTime,
      checksCount: checks.length,
    });

    return report;
  }

  // Check data provider health
  private async checkDataProvider(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const health = await DataProviderFactory.getProviderHealth();

      return {
        name: "data_provider",
        status: health.status === "healthy" ? "healthy" : "unhealthy",
        message: `Data provider (${health.type}) is ${health.status}`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: {
          providerType: health.type,
          providerDetails: health.details,
        },
      };
    } catch (error) {
      return {
        name: "data_provider",
        status: "unhealthy",
        message: `Data provider check failed: ${(error as Error).message}`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check database connectivity
  private async checkDatabaseConnectivity(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const provider = DataProviderFactory.create();

      // Try a simple count operation
      const userCount = await provider.users.count();

      return {
        name: "database_connectivity",
        status: "healthy",
        message: "Database connectivity is working",
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: {
          userCount,
          connectionTest: "passed",
        },
      };
    } catch (error) {
      return {
        name: "database_connectivity",
        status: "unhealthy",
        message: `Database connectivity failed: ${(error as Error).message}`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check repository operations
  private async checkRepositoryOperations(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const provider = DataProviderFactory.create();

      // Test basic repository operations
      const userResult = await provider.users.findMany({ take: 1 });
      const classResult = await provider.classes.findMany({ take: 1 });
      const disciplineResult = await provider.disciplines.findMany({ take: 1 });

      const allOperationsSuccessful =
        userResult && classResult && disciplineResult;

      return {
        name: "repository_operations",
        status: allOperationsSuccessful ? "healthy" : "degraded",
        message: allOperationsSuccessful
          ? "All repository operations are working"
          : "Some repository operations may be failing",
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: {
          userRepositoryWorking: !!userResult,
          classRepositoryWorking: !!classResult,
          disciplineRepositoryWorking: !!disciplineResult,
        },
      };
    } catch (error) {
      return {
        name: "repository_operations",
        status: "unhealthy",
        message: `Repository operations failed: ${(error as Error).message}`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check service layer
  private async checkServiceLayer(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Import services dynamically to avoid circular dependencies
      const { UserService } = await import("../services/user-service");
      const { ClassService } = await import("../services/class-service");

      const userService = new UserService();
      const classService = new ClassService();

      // Test service health checks
      const userServiceHealth = await userService.healthCheck();
      const classServiceHealth = await classService.healthCheck();

      const allServicesHealthy =
        userServiceHealth.success &&
        userServiceHealth.data.status === "healthy" &&
        classServiceHealth.success &&
        classServiceHealth.data.status === "healthy";

      return {
        name: "service_layer",
        status: allServicesHealthy ? "healthy" : "degraded",
        message: allServicesHealthy
          ? "All services are healthy"
          : "Some services may be experiencing issues",
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: {
          userServiceStatus: userServiceHealth.data?.status,
          classServiceStatus: classServiceHealth.data?.status,
        },
      };
    } catch (error) {
      return {
        name: "service_layer",
        status: "unhealthy",
        message: `Service layer check failed: ${(error as Error).message}`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check performance metrics
  private async checkPerformanceMetrics(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const performanceSummary = performanceMonitor.getPerformanceSummary();

      // Define thresholds
      const avgDurationThreshold = 500; // ms
      const successRateThreshold = 95; // %
      const slowOperationsThreshold = 10; // count

      const isHealthy =
        performanceSummary.averageDuration < avgDurationThreshold &&
        performanceSummary.successRate > successRateThreshold &&
        performanceSummary.slowOperations < slowOperationsThreshold;

      const isDegraded =
        performanceSummary.averageDuration < avgDurationThreshold * 2 &&
        performanceSummary.successRate > successRateThreshold - 10;

      const status = isHealthy
        ? "healthy"
        : isDegraded
        ? "degraded"
        : "unhealthy";

      return {
        name: "performance_metrics",
        status,
        message: `Performance metrics: ${performanceSummary.averageDuration.toFixed(
          1
        )}ms avg, ${performanceSummary.successRate.toFixed(1)}% success rate`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: {
          averageDuration: performanceSummary.averageDuration,
          successRate: performanceSummary.successRate,
          slowOperations: performanceSummary.slowOperations,
          totalOperations: performanceSummary.totalOperations,
          cacheHitRate: performanceSummary.cacheHitRate,
        },
      };
    } catch (error) {
      return {
        name: "performance_metrics",
        status: "unhealthy",
        message: `Performance metrics check failed: ${
          (error as Error).message
        }`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check memory usage
  private async checkMemoryUsage(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      };

      // Define thresholds (in MB)
      const heapUsedThreshold = 512;
      const heapUsedCriticalThreshold = 1024;

      const isHealthy = memoryUsageMB.heapUsed < heapUsedThreshold;
      const isDegraded = memoryUsageMB.heapUsed < heapUsedCriticalThreshold;

      const status = isHealthy
        ? "healthy"
        : isDegraded
        ? "degraded"
        : "unhealthy";

      return {
        name: "memory_usage",
        status,
        message: `Memory usage: ${memoryUsageMB.heapUsed}MB heap used`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: memoryUsageMB,
      };
    } catch (error) {
      return {
        name: "memory_usage",
        status: "unhealthy",
        message: `Memory usage check failed: ${(error as Error).message}`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Check cache functionality
  private async checkCacheFunctionality(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      // Test cache by calling a cached service method twice
      const { DisciplineService } = await import(
        "../services/discipline-service"
      );
      const disciplineService = new DisciplineService();

      // First call (cache miss)
      const start1 = Date.now();
      await disciplineService.getActiveDisciplines();
      const firstCallDuration = Date.now() - start1;

      // Second call (should be cache hit)
      const start2 = Date.now();
      await disciplineService.getActiveDisciplines();
      const secondCallDuration = Date.now() - start2;

      // Cache is working if second call is significantly faster
      const cacheWorking = secondCallDuration < firstCallDuration * 0.5;

      return {
        name: "cache_functionality",
        status: cacheWorking ? "healthy" : "degraded",
        message: cacheWorking
          ? "Cache is working properly"
          : "Cache may not be working optimally",
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: {
          firstCallDuration,
          secondCallDuration,
          cacheEffective: cacheWorking,
        },
      };
    } catch (error) {
      return {
        name: "cache_functionality",
        status: "unhealthy",
        message: `Cache functionality check failed: ${
          (error as Error).message
        }`,
        duration: Date.now() - start,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Calculate health summary
  private calculateHealthSummary(
    checks: HealthCheckResult[]
  ): SystemHealthReport["summary"] {
    const summary = {
      healthy: 0,
      unhealthy: 0,
      degraded: 0,
      total: checks.length,
    };

    checks.forEach((check) => {
      summary[check.status]++;
    });

    return summary;
  }

  // Determine overall health status
  private determineOverallHealth(
    summary: SystemHealthReport["summary"]
  ): "healthy" | "unhealthy" | "degraded" {
    if (summary.unhealthy > 0) {
      return "unhealthy";
    }
    if (summary.degraded > 0) {
      return "degraded";
    }
    return "healthy";
  }

  // Start periodic health checks
  private startPeriodicHealthChecks(): void {
    const intervalMs = parseInt(
      process.env.HEALTH_CHECK_INTERVAL_MS || "300000"
    ); // 5 minutes default

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        logger.error(
          "Periodic health check failed",
          { operation: "periodicHealthCheck" },
          error as Error
        );
      }
    }, intervalMs);

    logger.info("Periodic health checks started", {
      operation: "startPeriodicHealthChecks",
      intervalMs,
    });
  }

  // Stop periodic health checks
  stopPeriodicHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      logger.info("Periodic health checks stopped");
    }
  }

  // Get last health check result
  getLastHealthCheck(): SystemHealthReport | null {
    return this.lastHealthCheck;
  }

  // Get uptime in seconds
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // Quick health check (lightweight)
  async quickHealthCheck(): Promise<{
    status: "healthy" | "unhealthy";
    message: string;
  }> {
    try {
      const provider = DataProviderFactory.create();
      await provider.users.count();

      return {
        status: "healthy",
        message: "System is operational",
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: `System is experiencing issues: ${(error as Error).message}`,
      };
    }
  }
}

// Singleton instance
export const healthChecker = HealthChecker.getInstance();

// Convenience function for API endpoints
export async function getSystemHealth(): Promise<SystemHealthReport> {
  return healthChecker.performHealthCheck();
}

// Convenience function for quick checks
export async function getQuickHealth(): Promise<{
  status: "healthy" | "unhealthy";
  message: string;
}> {
  return healthChecker.quickHealthCheck();
}
