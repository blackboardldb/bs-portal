// API route for provider management
// Allows switching between mock and prisma providers

import { NextRequest, NextResponse } from "next/server";
import { DataProviderFactory } from "@/lib/data-layer/provider-factory";
import { createSuccessResponse, createErrorResponse } from "@/lib/api/types";
import { ErrorHandler } from "@/lib/errors/handler";
import { ProviderValidator } from "@/lib/middleware/provider-validation";

// Get current provider info
export async function GET(request: NextRequest) {
  try {
    // Validate current provider configuration
    const validation = await ProviderValidator.validateCurrentProvider();

    // Get provider health status
    const health = await DataProviderFactory.getProviderHealth();

    // Get provider stats
    const stats = DataProviderFactory.getProviderStats();

    // Get configuration summary
    const configSummary = ProviderValidator.getProviderConfigSummary();

    return NextResponse.json(
      createSuccessResponse({
        health,
        stats,
        validation,
        configuration: configSummary,
        currentProvider: stats.type,
        availableProviders: ["mock", "prisma"],
      })
    );
  } catch (error) {
    return ErrorHandler.createResponse(error, {
      operation: "getProviderInfo",
      resource: "system",
    });
  }
}

// Switch provider
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    if (!provider || !["mock", "prisma"].includes(provider)) {
      return NextResponse.json(
        createErrorResponse({
          code: "VALIDATION_ERROR",
          message: 'Invalid provider type. Must be "mock" or "prisma".',
        }),
        { status: 400 }
      );
    }

    // Validate provider switch
    const validation = await ProviderValidator.validateProviderSwitch(provider);

    if (!validation.isValid) {
      return NextResponse.json(
        createErrorResponse({
          code: "PROVIDER_CONFIGURATION_ERROR",
          message: "Cannot switch to provider due to configuration errors",
          details: {
            errors: validation.errors,
            warnings: validation.warnings,
          },
        }),
        { status: 400 }
      );
    }

    // Switch provider
    await DataProviderFactory.switchProvider(provider);

    // Get updated provider info
    const health = await DataProviderFactory.getProviderHealth();
    const stats = DataProviderFactory.getProviderStats();

    return NextResponse.json(
      createSuccessResponse({
        message: `Provider switched to ${provider}`,
        health,
        stats,
        validation,
      })
    );
  } catch (error) {
    return ErrorHandler.createResponse(error, {
      operation: "switchProvider",
      resource: "system",
    });
  }
}
