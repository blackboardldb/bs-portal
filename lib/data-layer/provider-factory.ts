// DataProvider factory system for environment-based provider selection
// This enables seamless switching between Mock and Prisma providers

import { DataProvider, ProviderConfig, TransactionProvider } from "./types";
import { MockDataProvider } from "./providers/mock-provider";
import { PrismaDataProvider } from "./providers/prisma-provider";
import { InternalError } from "../errors/types";

// Provider types
export type ProviderType = "mock" | "prisma";

// Configuration interface
export interface DataProviderFactoryConfig {
  type: ProviderType;
  connectionString?: string;
  options?: Record<string, any>;
  enableLogging?: boolean;
  enableTransactions?: boolean;
}

// Factory class for creating data providers
export class DataProviderFactory {
  private static instance: DataProvider | null = null;
  private static config: DataProviderFactoryConfig | null = null;

  // Create a data provider based on configuration
  static create(config?: DataProviderFactoryConfig): DataProvider {
    const finalConfig = config || this.getDefaultConfig();

    // Cache the provider instance for performance
    if (this.instance && this.configMatches(finalConfig)) {
      return this.instance;
    }

    this.config = finalConfig;
    this.instance = this.createProvider(finalConfig);

    return this.instance;
  }

  // Create provider instance based on type
  private static createProvider(
    config: DataProviderFactoryConfig
  ): DataProvider {
    switch (config.type) {
      case "mock":
        return new MockDataProvider(config);

      case "prisma":
        return new PrismaDataProvider(config);

      default:
        throw new InternalError(`Unsupported provider type: ${config.type}`);
    }
  }

  // Get default configuration from environment
  private static getDefaultConfig(): DataProviderFactoryConfig {
    const providerType = (process.env.DATA_PROVIDER as ProviderType) || "mock";

    return {
      type: providerType,
      connectionString: process.env.DATABASE_URL,
      enableLogging: process.env.NODE_ENV === "development",
      enableTransactions: true,
      options: {
        // Mock-specific options
        generateClasses: process.env.GENERATE_MOCK_CLASSES !== "false",

        // Prisma-specific options
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || "5000"),
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || "3"),
      },
    };
  }

  // Check if current config matches the new one
  private static configMatches(newConfig: DataProviderFactoryConfig): boolean {
    if (!this.config) return false;

    return (
      this.config.type === newConfig.type &&
      this.config.connectionString === newConfig.connectionString &&
      this.config.enableLogging === newConfig.enableLogging &&
      this.config.enableTransactions === newConfig.enableTransactions
    );
  }

  // Reset the factory (useful for testing)
  static reset(): void {
    this.instance = null;
    this.config = null;
  }

  // Get current provider type
  static getCurrentProviderType(): ProviderType | null {
    return this.config?.type || null;
  }

  // Check if current provider supports transactions
  static supportsTransactions(): boolean {
    if (!this.instance) return false;
    return (
      "supportsTransactions" in this.instance &&
      (this.instance as any).supportsTransactions === true
    );
  }

  // Validate configuration
  static validateConfig(config: DataProviderFactoryConfig): void {
    if (!config.type) {
      throw new InternalError("Provider type is required");
    }

    if (!["mock", "prisma"].includes(config.type)) {
      throw new InternalError(`Invalid provider type: ${config.type}`);
    }

    if (config.type === "prisma" && !config.connectionString) {
      throw new InternalError(
        "Connection string is required for Prisma provider"
      );
    }

    // Validate options if present
    if (config.options) {
      this.validateProviderOptions(config.type, config.options);
    }
  }

  // Validate provider-specific options
  private static validateProviderOptions(
    type: ProviderType,
    options: Record<string, any>
  ): void {
    switch (type) {
      case "prisma":
        if (
          options.connectionLimit &&
          (typeof options.connectionLimit !== "number" ||
            options.connectionLimit < 1)
        ) {
          throw new InternalError("Connection limit must be a positive number");
        }

        if (
          options.queryTimeout &&
          (typeof options.queryTimeout !== "number" ||
            options.queryTimeout < 1000)
        ) {
          throw new InternalError("Query timeout must be at least 1000ms");
        }

        if (
          options.retryAttempts &&
          (typeof options.retryAttempts !== "number" ||
            options.retryAttempts < 0)
        ) {
          throw new InternalError(
            "Retry attempts must be a non-negative number"
          );
        }
        break;

      case "mock":
        if (
          options.generateClasses &&
          typeof options.generateClasses !== "boolean"
        ) {
          throw new InternalError("Generate classes option must be a boolean");
        }
        break;
    }
  }

  // Create provider with custom configuration
  static createWithConfig(config: DataProviderFactoryConfig): DataProvider {
    this.validateConfig(config);
    return this.createProvider(config);
  }

  // Get provider health status
  static async getProviderHealth(): Promise<{
    type: ProviderType;
    status: "healthy" | "unhealthy" | "unknown";
    details?: Record<string, any>;
  }> {
    if (!this.instance || !this.config) {
      return {
        type: "mock",
        status: "unknown",
        details: { error: "No provider instance available" },
      };
    }

    try {
      // Check if provider has health check method
      if (
        "healthCheck" in this.instance &&
        typeof (this.instance as any).healthCheck === "function"
      ) {
        const health = await (this.instance as any).healthCheck();
        return {
          type: this.config.type,
          status: health.status,
          details: health.details,
        };
      }

      // Basic health check - try to access a repository
      await this.instance.users.count();

      return {
        type: this.config.type,
        status: "healthy",
        details: { message: "Provider is responding" },
      };
    } catch (error) {
      return {
        type: this.config.type,
        status: "unhealthy",
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // Switch provider at runtime (useful for testing)
  static async switchProvider(newType: ProviderType): Promise<DataProvider> {
    const currentConfig = this.config || this.getDefaultConfig();
    const newConfig: DataProviderFactoryConfig = {
      ...currentConfig,
      type: newType,
    };

    // Validate the new configuration
    this.validateConfig(newConfig);

    // Close current provider if it supports cleanup
    if (
      this.instance &&
      "cleanup" in this.instance &&
      typeof (this.instance as any).cleanup === "function"
    ) {
      await (this.instance as any).cleanup();
    }

    // Create new provider
    this.reset();
    return this.create(newConfig);
  }

  // Get provider statistics
  static getProviderStats(): {
    type: ProviderType | null;
    instanceCreated: boolean;
    configSet: boolean;
    supportsTransactions: boolean;
  } {
    return {
      type: this.getCurrentProviderType(),
      instanceCreated: this.instance !== null,
      configSet: this.config !== null,
      supportsTransactions: this.supportsTransactions(),
    };
  }
}

// Convenience function to get the current data provider
export function getDataProvider(): DataProvider {
  return DataProviderFactory.create();
}

// Convenience function to get provider with transaction support
export function getTransactionProvider(): TransactionProvider & DataProvider {
  const provider = DataProviderFactory.create();

  if (!("$transaction" in provider)) {
    throw new InternalError("Current provider does not support transactions");
  }

  return provider as TransactionProvider & DataProvider;
}

// Environment configuration helpers
export const ProviderConfig = {
  // Development configuration
  development: (): DataProviderFactoryConfig => ({
    type: "mock",
    enableLogging: true,
    enableTransactions: false,
    options: {
      generateClasses: true,
    },
  }),

  // Testing configuration
  testing: (): DataProviderFactoryConfig => ({
    type: "mock",
    enableLogging: false,
    enableTransactions: false,
    options: {
      generateClasses: false,
    },
  }),

  // Production configuration
  production: (): DataProviderFactoryConfig => ({
    type: "prisma",
    connectionString: process.env.DATABASE_URL,
    enableLogging: false,
    enableTransactions: true,
    options: {
      connectionLimit: 20,
      queryTimeout: 10000,
      retryAttempts: 3,
    },
  }),

  // Staging configuration
  staging: (): DataProviderFactoryConfig => ({
    type: "prisma",
    connectionString: process.env.DATABASE_URL,
    enableLogging: true,
    enableTransactions: true,
    options: {
      connectionLimit: 10,
      queryTimeout: 5000,
      retryAttempts: 2,
    },
  }),
};

// Type guards
export function isMockProvider(
  provider: DataProvider
): provider is MockDataProvider {
  return provider.constructor.name === "MockDataProvider";
}

export function isPrismaProvider(
  provider: DataProvider
): provider is PrismaDataProvider {
  return provider.constructor.name === "PrismaDataProvider";
}

// Provider initialization helper
export async function initializeProvider(
  config?: DataProviderFactoryConfig
): Promise<DataProvider> {
  const provider = DataProviderFactory.create(config);

  // Initialize provider if it has an init method
  if (
    "initialize" in provider &&
    typeof (provider as any).initialize === "function"
  ) {
    await (provider as any).initialize();
  }

  return provider;
}

// Cleanup helper
export async function cleanupProvider(): Promise<void> {
  const provider = DataProviderFactory.create();

  if (
    "cleanup" in provider &&
    typeof (provider as any).cleanup === "function"
  ) {
    await (provider as any).cleanup();
  }

  DataProviderFactory.reset();
}
