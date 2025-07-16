// System Health API Endpoint
// Provides health status of all system components

import { NextRequest, NextResponse } from "next/server";
import {
  healthChecker,
  getSystemHealth,
  getQuickHealth,
} from "@/lib/monitoring/health-checks";
import { performanceMonitor } from "@/lib/monitoring/performance-monitor";
import { logger } from "@/lib/monitoring/logger";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/types";
import { ErrorHandler } from "@/lib/errors/handler";

// Get comprehensive system health
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quick = searchParams.get("quick") === "true";
    const includeMetrics = searchParams.get("metrics") === "true";
    const includeLogs = searchParams.get("logs") === "true";

    if (quick) {
      // Quick health check for load balancers/monitoring systems
      const quickHealth = await getQuickHealth();

      return NextResponse.json(
        createSuccessResponse({
          status: quickHealth.status,
          message: quickHealth.message,
          timestamp: new Date().toISOString(),
          uptime: healthChecker.getUptime(),
        }),
        {
          status: quickHealth.status === "healthy" ? 200 : 503,
        }
      );
    }

    // Comprehensive health check
    const healthReport = await getSystemHealth();

    // Add additional data if requested
    const responseData: any = {
      ...healthReport,
      uptime: healthChecker.getUptime(),
    };

    if (includeMetrics) {
      responseData.performanceMetrics =
        performanceMonitor.getPerformanceSummary();
      responseData.providerComparison =
        performanceMonitor.getProviderComparison();
    }

    if (includeLogs) {
      responseData.recentLogs = logger.getRecentLogs(50);
      responseData.logStats = logger.getLogStats();
    }

    const httpStatus =
      healthReport.overall === "healthy"
        ? 200
        : healthReport.overall === "degraded"
        ? 200
        : 503;

    return NextResponse.json(createSuccessResponse(responseData), {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    logger.error(
      "Health check API failed",
      {
        operation: "healthCheckAPI",
        resource: "system",
      },
      error as Error
    );

    return ErrorHandler.createResponse(error, {
      operation: "getSystemHealth",
      resource: "system",
    });
  }
}

// Trigger manual health check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "refresh":
        // Force a new health check
        const healthReport = await healthChecker.performHealthCheck();

        return NextResponse.json(
          createSuccessResponse({
            message: "Health check refreshed",
            report: healthReport,
          })
        );

      case "clear_metrics":
        // Clear performance metrics
        performanceMonitor.clear();

        return NextResponse.json(
          createSuccessResponse({
            message: "Performance metrics cleared",
          })
        );

      case "clear_logs":
        // Clear log buffer
        logger.clearBuffer();

        return NextResponse.json(
          createSuccessResponse({
            message: "Log buffer cleared",
          })
        );

      case "export_metrics":
        // Export performance metrics
        const exportData = performanceMonitor.exportMetrics();

        return NextResponse.json(
          createSuccessResponse({
            message: "Metrics exported",
            data: exportData,
          })
        );

      default:
        return NextResponse.json(
          createErrorResponse({
            code: "INVALID_ACTION",
            message: `Invalid action: ${action}. Supported actions: refresh, clear_metrics, clear_logs, export_metrics`,
          }),
          { status: 400 }
        );
    }
  } catch (error) {
    return ErrorHandler.createResponse(error, {
      operation: "healthCheckAction",
      resource: "system",
    });
  }
}
