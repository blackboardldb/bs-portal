// Provider validation middleware
// Ensures that the selected provider is properly configured and available

import {
  DataProviderFactory,
  ProviderType,
} from "../data-layer/provider-factory";
import { InternalError, ValidationError } from "../errors/types";

export interface ProviderValidationResult {
  isValid: boolean;
  provider: ProviderType;
  errors: string[];
  warnings: string[];
}

export class ProviderValidator {
  // Validate current provider configuration
  static async validateCurrentProvider(): Promise<ProviderValidationResult> {
    const result: ProviderValidationResult = {
      isValid: true,
      provider: "mock",
      errors: [],
      warnings: [],
    };

    try {
      // Get current provider type from environment
      const envProvider = process.env.DATA_PROVIDER as ProviderType;

      if (!envProvider) {
        result.warnings.push("DATA_PROVIDER not set, defaulting to mock");
        result.provider = "mock";
      } else if (!["mock", "prisma"].includes(envProvider)) {
        result.errors.push(
          `Invalid DATA_PROVIDER value: ${envProvider}. Must be 'mock' or 'prisma'`
        );
        result.isValid = false;
        return result;
      } else {
        result.provider = envProvider;
      }

      // Validate provider-specific configuration
      await this.validateProviderSpecificConfig(result);

      // Test provider health
      await this.testProviderHealth(result);
    } catch (error) {
      result.errors.push(
        `Provider validation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      result.isValid = false;
    }

    return result;
  }

  // Validate provider-specific configuration
  private static async validateProviderSpecificConfig(
    result: ProviderValidationResult
  ): Promise<void> {
    switch (result.provider) {
      case "prisma":
        await this.validatePrismaConfig(result);
        break;
      case "mock":
        await this.validateMockConfig(result);
        break;
    }
  }

  // Validate Prisma provider configuration
  private static async validatePrismaConfig(
    result: ProviderValidationResult
  ): Promise<void> {
    // Check DATABASE_URL
    if (!process.env.DATABASE_URL) {
      result.errors.push("DATABASE_URL is required when using Prisma provider");
      result.isValid = false;
      return;
    }

    // Validate DATABASE_URL format
    try {
      new URL(process.env.DATABASE_URL);
    } catch {
      result.errors.push("DATABASE_URL is not a valid URL");
      result.isValid = false;
      return;
    }

    // Check optional configuration
    const connectionLimit = process.env.DB_CONNECTION_LIMIT;
    if (
      connectionLimit &&
      (isNaN(Number(connectionLimit)) || Number(connectionLimit) < 1)
    ) {
      result.warnings.push(
        "DB_CONNECTION_LIMIT should be a positive number, using default"
      );
    }

    const queryTimeout = process.env.DB_QUERY_TIMEOUT;
    if (
      queryTimeout &&
      (isNaN(Number(queryTimeout)) || Number(queryTimeout) < 1000)
    ) {
      result.warnings.push(
        "DB_QUERY_TIMEOUT should be at least 1000ms, using default"
      );
    }

    const retryAttempts = process.env.DB_RETRY_ATTEMPTS;
    if (
      retryAttempts &&
      (isNaN(Number(retryAttempts)) || Number(retryAttempts) < 0)
    ) {
      result.warnings.push(
        "DB_RETRY_ATTEMPTS should be a non-negative number, using default"
      );
    }
  }

  // Validate Mock provider configuration
  private static async validateMockConfig(
    result: ProviderValidationResult
  ): Promise<void> {
    // Check optional configuration
    const generateClasses = process.env.GENERATE_MOCK_CLASSES;
    if (
      generateClasses &&
      !["true", "false"].includes(generateClasses.toLowerCase())
    ) {
      result.warnings.push(
        "GENERATE_MOCK_CLASSES should be true or false, using default"
      );
    }

    // Mock provider is generally always available
    result.warnings.push(
      "Using mock provider - data will not persist between restarts"
    );
  }

  // Test provider health
  private static async testProviderHealth(
    result: ProviderValidationResult
  ): Promise<void> {
    try {
      const health = await DataProviderFactory.getProviderHealth();

      if (health.status === "unhealthy") {
        result.errors.push(
          `Provider health check failed: ${
            health.details?.error || "Unknown error"
          }`
        );
        result.isValid = false;
      } else if (health.status === "unknown") {
        result.warnings.push("Provider health status is unknown");
      }
    } catch (error) {
      result.warnings.push(
        `Could not perform health check: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Validate provider switch request
  static async validateProviderSwitch(
    targetProvider: ProviderType
  ): Promise<ProviderValidationResult> {
    const result: ProviderValidationResult = {
      isValid: true,
      provider: targetProvider,
      errors: [],
      warnings: [],
    };

    // Validate target provider type
    if (!["mock", "prisma"].includes(targetProvider)) {
      result.errors.push(
        `Invalid target provider: ${targetProvider}. Must be 'mock' or 'prisma'`
      );
      result.isValid = false;
      return result;
    }

    // Check if switching to the same provider
    const currentProvider = DataProviderFactory.getCurrentProviderType();
    if (currentProvider === targetProvider) {
      result.warnings.push(`Already using ${targetProvider} provider`);
      return result;
    }

    // Validate target provider configuration
    const originalProvider = process.env.DATA_PROVIDER;
    process.env.DATA_PROVIDER = targetProvider;

    try {
      await this.validateProviderSpecificConfig(result);
    } finally {
      // Restore original provider
      if (originalProvider) {
        process.env.DATA_PROVIDER = originalProvider;
      } else {
        delete process.env.DATA_PROVIDER;
      }
    }

    return result;
  }

  // Get provider configuration summary
  static getProviderConfigSummary(): {
    currentProvider: ProviderType | null;
    environment: string;
    configuration: Record<string, any>;
  } {
    const currentProvider =
      (process.env.DATA_PROVIDER as ProviderType) || "mock";
    const environment = process.env.NODE_ENV || "development";

    const configuration: Record<string, any> = {
      DATA_PROVIDER: currentProvider,
      NODE_ENV: environment,
    };

    // Add provider-specific configuration
    if (currentProvider === "prisma") {
      configuration.DATABASE_URL = process.env.DATABASE_URL
        ? "[CONFIGURED]"
        : "[NOT SET]";
      configuration.DB_CONNECTION_LIMIT =
        process.env.DB_CONNECTION_LIMIT || "[DEFAULT]";
      configuration.DB_QUERY_TIMEOUT =
        process.env.DB_QUERY_TIMEOUT || "[DEFAULT]";
      configuration.DB_RETRY_ATTEMPTS =
        process.env.DB_RETRY_ATTEMPTS || "[DEFAULT]";
    } else {
      configuration.GENERATE_MOCK_CLASSES =
        process.env.GENERATE_MOCK_CLASSES || "[DEFAULT]";
    }

    return {
      currentProvider,
      environment,
      configuration,
    };
  }
}

// Middleware function for Next.js API routes
export async function validateProviderMiddleware(
  req: any,
  res: any,
  next: () => void
): Promise<void> {
  try {
    const validation = await ProviderValidator.validateCurrentProvider();

    if (!validation.isValid) {
      res.status(500).json({
        success: false,
        error: {
          code: "PROVIDER_CONFIGURATION_ERROR",
          message: "Data provider is not properly configured",
          details: {
            provider: validation.provider,
            errors: validation.errors,
            warnings: validation.warnings,
          },
        },
      });
      return;
    }

    // Add validation warnings to response headers for debugging
    if (validation.warnings.length > 0) {
      res.setHeader("X-Provider-Warnings", validation.warnings.join("; "));
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: "PROVIDER_VALIDATION_ERROR",
        message: "Failed to validate provider configuration",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
    });
  }
}
