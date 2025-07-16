// Provider configuration utilities
// Centralized configuration management for data providers

import {
  DataProviderFactoryConfig,
  ProviderType,
} from "../data-layer/provider-factory";

export interface EnvironmentConfig {
  provider: ProviderType;
  database?: {
    url: string;
    connectionLimit?: number;
    queryTimeout?: number;
    retryAttempts?: number;
  };
  mock?: {
    generateClasses?: boolean;
  };
  logging?: {
    enabled: boolean;
    level: string;
  };
}

export class ProviderConfigManager {
  // Get configuration for current environment
  static getCurrentConfig(): DataProviderFactoryConfig {
    const env = process.env.NODE_ENV || "development";

    switch (env) {
      case "development":
        return this.getDevelopmentConfig();
      case "test":
        return this.getTestConfig();
      case "staging":
        return this.getStagingConfig();
      case "production":
        return this.getProductionConfig();
      default:
        return this.getDevelopmentConfig();
    }
  }

  // Development configuration
  private static getDevelopmentConfig(): DataProviderFactoryConfig {
    const providerType = (process.env.DATA_PROVIDER as ProviderType) || "mock";

    const baseConfig: DataProviderFactoryConfig = {
      type: providerType,
      enableLogging: true,
      enableTransactions: providerType === "prisma",
    };

    if (providerType === "prisma") {
      baseConfig.connectionString = process.env.DATABASE_URL;
      baseConfig.options = {
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "5"),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || "5000"),
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || "2"),
      };
    } else {
      baseConfig.options = {
        generateClasses: process.env.GENERATE_MOCK_CLASSES !== "false",
      };
    }

    return baseConfig;
  }

  // Test configuration
  private static getTestConfig(): DataProviderFactoryConfig {
    return {
      type: "mock",
      enableLogging: false,
      enableTransactions: false,
      options: {
        generateClasses: false,
      },
    };
  }

  // Staging configuration
  private static getStagingConfig(): DataProviderFactoryConfig {
    return {
      type: "prisma",
      connectionString: process.env.DATABASE_URL,
      enableLogging: true,
      enableTransactions: true,
      options: {
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "10"),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || "8000"),
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || "3"),
      },
    };
  }

  // Production configuration
  private static getProductionConfig(): DataProviderFactoryConfig {
    return {
      type: "prisma",
      connectionString: process.env.DATABASE_URL,
      enableLogging: false,
      enableTransactions: true,
      options: {
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || "20"),
        queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || "10000"),
        retryAttempts: parseInt(process.env.DB_RETRY_ATTEMPTS || "3"),
      },
    };
  }

  // Validate environment configuration
  static validateEnvironmentConfig(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const env = process.env.NODE_ENV || "development";
    const providerType = process.env.DATA_PROVIDER as ProviderType;

    // Validate provider type
    if (providerType && !["mock", "prisma"].includes(providerType)) {
      errors.push(
        `Invalid DATA_PROVIDER: ${providerType}. Must be 'mock' or 'prisma'`
      );
    }

    // Environment-specific validation
    switch (env) {
      case "production":
        if (!providerType || providerType === "mock") {
          warnings.push("Using mock provider in production is not recommended");
        }
        if (providerType === "prisma" && !process.env.DATABASE_URL) {
          errors.push("DATABASE_URL is required in production");
        }
        break;

      case "staging":
        if (providerType === "prisma" && !process.env.DATABASE_URL) {
          errors.push("DATABASE_URL is required in staging");
        }
        break;

      case "development":
        if (!providerType) {
          warnings.push("DATA_PROVIDER not set, defaulting to mock");
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Get recommended configuration for environment
  static getRecommendedConfig(environment: string): EnvironmentConfig {
    switch (environment) {
      case "development":
        return {
          provider: "mock",
          mock: {
            generateClasses: true,
          },
          logging: {
            enabled: true,
            level: "debug",
          },
        };

      case "test":
        return {
          provider: "mock",
          mock: {
            generateClasses: false,
          },
          logging: {
            enabled: false,
            level: "error",
          },
        };

      case "staging":
        return {
          provider: "prisma",
          database: {
            url: "postgresql://user:pass@localhost:5432/staging_db",
            connectionLimit: 10,
            queryTimeout: 8000,
            retryAttempts: 3,
          },
          logging: {
            enabled: true,
            level: "info",
          },
        };

      case "production":
        return {
          provider: "prisma",
          database: {
            url: "postgresql://user:pass@localhost:5432/production_db",
            connectionLimit: 20,
            queryTimeout: 10000,
            retryAttempts: 3,
          },
          logging: {
            enabled: false,
            level: "error",
          },
        };

      default:
        return this.getRecommendedConfig("development");
    }
  }

  // Generate environment file content
  static generateEnvFile(config: EnvironmentConfig): string {
    const lines: string[] = [
      "# Data Provider Configuration",
      `DATA_PROVIDER=${config.provider}`,
      "",
    ];

    if (config.provider === "prisma" && config.database) {
      lines.push(
        "# Database Configuration",
        `DATABASE_URL="${config.database.url}"`,
        ""
      );

      if (config.database.connectionLimit) {
        lines.push(`DB_CONNECTION_LIMIT=${config.database.connectionLimit}`);
      }
      if (config.database.queryTimeout) {
        lines.push(`DB_QUERY_TIMEOUT=${config.database.queryTimeout}`);
      }
      if (config.database.retryAttempts) {
        lines.push(`DB_RETRY_ATTEMPTS=${config.database.retryAttempts}`);
      }
      lines.push("");
    }

    if (config.provider === "mock" && config.mock) {
      lines.push(
        "# Mock Provider Configuration",
        `GENERATE_MOCK_CLASSES=${config.mock.generateClasses}`,
        ""
      );
    }

    if (config.logging) {
      lines.push(
        "# Logging Configuration",
        `LOG_LEVEL=${config.logging.level}`,
        `LOG_PROVIDER_OPERATIONS=${config.logging.enabled}`,
        ""
      );
    }

    return lines.join("\n");
  }
}

// Utility functions
export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV === "development" || !process.env.NODE_ENV;
}

export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === "test";
}

export function getCurrentProviderType(): ProviderType {
  return (process.env.DATA_PROVIDER as ProviderType) || "mock";
}

export function shouldUsePrismaProvider(): boolean {
  const env = process.env.NODE_ENV;
  const provider = process.env.DATA_PROVIDER as ProviderType;

  // Use Prisma in production/staging by default
  if (env === "production" || env === "staging") {
    return provider !== "mock";
  }

  // Use explicit provider setting in other environments
  return provider === "prisma";
}
