// Structured Logging System
// Provides consistent logging across the data layer with different levels and contexts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  operation?: string;
  resource?: string;
  provider?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private enableFile: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;

  private constructor() {
    this.logLevel = this.getLogLevelFromEnv();
    this.enableConsole = process.env.LOG_CONSOLE !== "false";
    this.enableFile = process.env.LOG_FILE === "true";
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case "DEBUG":
        return LogLevel.DEBUG;
      case "INFO":
        return LogLevel.INFO;
      case "WARN":
        return LogLevel.WARN;
      case "ERROR":
        return LogLevel.ERROR;
      case "FATAL":
        return LogLevel.FATAL;
      default:
        return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        environment: process.env.NODE_ENV || "development",
        version: process.env.APP_VERSION || "1.0.0",
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    // Add to buffer
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove oldest entry
    }

    // Console output
    if (this.enableConsole) {
      this.writeToConsole(entry);
    }

    // File output (in production, you might want to use a proper logging library)
    if (this.enableFile) {
      this.writeToFile(entry);
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const contextStr =
      Object.keys(entry.context).length > 0
        ? ` [${JSON.stringify(entry.context)}]`
        : "";

    const logMessage = `${entry.timestamp} [${levelName}] ${entry.message}${contextStr}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        if (entry.error) {
          console.error("Error details:", entry.error);
        }
        break;
    }
  }

  private writeToFile(entry: LogEntry): void {
    // In a real implementation, you would write to a file or send to a logging service
    // For now, we'll just store in memory buffer
    // You could integrate with services like Winston, Pino, or cloud logging services
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.writeLog(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.writeLog(this.createLogEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.writeLog(
        this.createLogEntry(LogLevel.WARN, message, context, error)
      );
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.writeLog(
        this.createLogEntry(LogLevel.ERROR, message, context, error)
      );
    }
  }

  fatal(message: string, context?: LogContext, error?: Error): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      this.writeLog(
        this.createLogEntry(LogLevel.FATAL, message, context, error)
      );
    }
  }

  // Performance logging
  logPerformance(
    operation: string,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`Performance: ${operation} completed`, {
      ...context,
      operation,
      duration,
      performance: true,
    });
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    recordCount?: number,
    context?: LogContext
  ): void {
    this.debug(`Database: ${operation} on ${table}`, {
      ...context,
      operation,
      resource: table,
      duration,
      recordCount,
      database: true,
    });
  }

  // Provider operation logging
  logProviderOperation(
    provider: string,
    operation: string,
    success: boolean,
    duration: number,
    context?: LogContext
  ): void {
    const level = success ? LogLevel.DEBUG : LogLevel.WARN;
    const message = `Provider: ${provider} ${operation} ${
      success ? "succeeded" : "failed"
    }`;

    if (this.shouldLog(level)) {
      this.writeLog(
        this.createLogEntry(level, message, {
          ...context,
          provider,
          operation,
          duration,
          success,
          providerOperation: true,
        })
      );
    }
  }

  // API request logging
  logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const message = `API: ${method} ${path} - ${statusCode}`;

    if (this.shouldLog(level)) {
      this.writeLog(
        this.createLogEntry(level, message, {
          ...context,
          method,
          path,
          statusCode,
          duration,
          api: true,
        })
      );
    }
  }

  // Get recent logs (for debugging)
  getRecentLogs(count: number = 100): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel, count: number = 100): LogEntry[] {
    return this.logBuffer
      .filter((entry) => entry.level === level)
      .slice(-count);
  }

  // Get logs by context
  getLogsByContext(
    contextKey: string,
    contextValue: any,
    count: number = 100
  ): LogEntry[] {
    return this.logBuffer
      .filter((entry) => entry.context[contextKey] === contextValue)
      .slice(-count);
  }

  // Clear log buffer
  clearBuffer(): void {
    this.logBuffer = [];
  }

  // Get log statistics
  getLogStats(): {
    total: number;
    byLevel: Record<string, number>;
    bufferSize: number;
    maxBufferSize: number;
  } {
    const byLevel: Record<string, number> = {};

    this.logBuffer.forEach((entry) => {
      const levelName = LogLevel[entry.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
    });

    return {
      total: this.logBuffer.length,
      byLevel,
      bufferSize: this.logBuffer.length,
      maxBufferSize: this.maxBufferSize,
    };
  }
}

// Singleton instance
export const logger = Logger.getInstance();

// Convenience functions
export const logDebug = (message: string, context?: LogContext) =>
  logger.debug(message, context);

export const logInfo = (message: string, context?: LogContext) =>
  logger.info(message, context);

export const logWarn = (message: string, context?: LogContext, error?: Error) =>
  logger.warn(message, context, error);

export const logError = (
  message: string,
  context?: LogContext,
  error?: Error
) => logger.error(message, context, error);

export const logFatal = (
  message: string,
  context?: LogContext,
  error?: Error
) => logger.fatal(message, context, error);

// Performance measurement decorator
export function logPerformance(
  target: any,
  propertyName: string,
  descriptor: PropertyDescriptor
) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const start = Date.now();
    const context: LogContext = {
      operation: `${target.constructor.name}.${propertyName}`,
      resource: target.repositoryName || target.entityName || "unknown",
    };

    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - start;

      logger.logPerformance(
        `${target.constructor.name}.${propertyName}`,
        duration,
        context
      );

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error(
        `${target.constructor.name}.${propertyName} failed`,
        { ...context, duration },
        error as Error
      );

      throw error;
    }
  };

  return descriptor;
}
