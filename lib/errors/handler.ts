// Centralized error handling logic

import { NextResponse } from "next/server";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  InternalError,
  ContextualError,
  MonitoredError,
  ErrorSeverity,
  ErrorContext,
} from "./types";
import { ApiError, ApiErrorCode, createErrorResponse } from "../api/types";

// Main error handler class
export class ErrorHandler {
  // Convert any error to standardized API error
  static handle(error: unknown, context?: ErrorContext): ApiError {
    // Handle AppError instances
    if (AppError.isAppError(error)) {
      return this.handleAppError(error, context);
    }

    // Handle validation errors from Zod or other libraries
    if (this.isZodError(error)) {
      return this.handleZodError(error);
    }

    // Handle Prisma errors (for future use)
    if (this.isPrismaError(error)) {
      return this.handlePrismaError(error);
    }

    // Handle generic JavaScript errors
    if (error instanceof Error) {
      return this.handleGenericError(error, context);
    }

    // Handle unknown error types
    return this.handleUnknownError(error, context);
  }

  // Handle AppError instances
  private static handleAppError(
    error: AppError,
    context?: ErrorContext
  ): ApiError {
    // Log error with appropriate level
    this.logError(error, context);

    // Return API error format
    return error.toApiError();
  }

  // Handle Zod validation errors
  private static handleZodError(error: any): ApiError {
    const firstError = error.errors?.[0];
    const field = firstError?.path?.join(".") || undefined;
    const message = firstError?.message || "Validation failed";

    return {
      code: ApiErrorCode.VALIDATION_ERROR,
      message,
      field,
      details: {
        validationErrors: error.errors,
      },
    };
  }

  // Handle Prisma errors (for future database integration)
  private static handlePrismaError(error: any): ApiError {
    // Common Prisma error codes
    switch (error.code) {
      case "P2002": // Unique constraint violation
        return {
          code: ApiErrorCode.CONFLICT,
          message: "A record with this information already exists",
          details: {
            constraint: error.meta?.target,
          },
        };

      case "P2025": // Record not found
        return {
          code: ApiErrorCode.NOT_FOUND,
          message: "Record not found",
          details: {
            cause: error.meta?.cause,
          },
        };

      case "P2003": // Foreign key constraint violation
        return {
          code: ApiErrorCode.BAD_REQUEST,
          message: "Invalid reference to related record",
          details: {
            field: error.meta?.field_name,
          },
        };

      default:
        return {
          code: ApiErrorCode.INTERNAL_ERROR,
          message: "Database operation failed",
          details: {
            prismaCode: error.code,
          },
        };
    }
  }

  // Handle generic JavaScript errors
  private static handleGenericError(
    error: Error,
    context?: ErrorContext
  ): ApiError {
    // Log the error for debugging
    console.error("Unhandled error:", error, context);

    return {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
      details: {
        originalMessage: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
    };
  }

  // Handle completely unknown errors
  private static handleUnknownError(
    error: unknown,
    context?: ErrorContext
  ): ApiError {
    console.error("Unknown error type:", error, context);

    return {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
      details: {
        errorType: typeof error,
        errorValue: String(error),
      },
    };
  }

  // Log errors with appropriate level
  private static logError(error: AppError, context?: ErrorContext): void {
    const logData = {
      error: {
        name: error.name,
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        field: error.field,
        timestamp: error.timestamp,
        stack: error.stack,
      },
      context,
    };

    // Determine log level based on error type and severity
    if (error instanceof MonitoredError) {
      switch (error.severity) {
        case ErrorSeverity.CRITICAL:
          console.error("[CRITICAL ERROR]", logData);
          break;
        case ErrorSeverity.HIGH:
          console.error("[HIGH ERROR]", logData);
          break;
        case ErrorSeverity.MEDIUM:
          console.warn("[MEDIUM ERROR]", logData);
          break;
        case ErrorSeverity.LOW:
          console.info("[LOW ERROR]", logData);
          break;
      }
    } else if (error.statusCode >= 500) {
      console.error("[SERVER ERROR]", logData);
    } else if (error.statusCode >= 400) {
      console.warn("[CLIENT ERROR]", logData);
    } else {
      console.info("[ERROR]", logData);
    }
  }

  // Type guards for error detection
  private static isZodError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      (error as any).name === "ZodError"
    );
  }

  private static isPrismaError(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as any).code === "string" &&
      (error as any).code.startsWith("P")
    );
  }

  // Create Next.js response from error
  static createResponse(error: unknown, context?: ErrorContext): NextResponse {
    const apiError = this.handle(error, context);
    const statusCode = this.getStatusCodeFromError(apiError);

    return NextResponse.json(createErrorResponse(apiError), {
      status: statusCode,
    });
  }

  // Get HTTP status code from API error
  private static getStatusCodeFromError(apiError: ApiError): number {
    const statusCodes = {
      [ApiErrorCode.VALIDATION_ERROR]: 400,
      [ApiErrorCode.BAD_REQUEST]: 400,
      [ApiErrorCode.UNAUTHORIZED]: 401,
      [ApiErrorCode.FORBIDDEN]: 403,
      [ApiErrorCode.NOT_FOUND]: 404,
      [ApiErrorCode.CONFLICT]: 409,
      [ApiErrorCode.RATE_LIMITED]: 429,
      [ApiErrorCode.INTERNAL_ERROR]: 500,
      [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
    };

    return statusCodes[apiError.code as ApiErrorCode] || 500;
  }
}

// Utility functions for common error scenarios
export function throwNotFound(resource: string, identifier?: string): never {
  throw new NotFoundError(resource, identifier);
}

export function throwValidation(
  message: string,
  field?: string,
  details?: Record<string, any>
): never {
  throw new ValidationError(message, field, details);
}

export function throwUnauthorized(message?: string): never {
  throw new UnauthorizedError(message);
}

export function throwForbidden(message?: string): never {
  throw new ForbiddenError(message);
}

export function throwConflict(
  message: string,
  details?: Record<string, any>
): never {
  throw new ConflictError(message, details);
}

export function throwInternal(message?: string, cause?: Error): never {
  throw new InternalError(message, cause);
}

// Async error wrapper for better error handling in async functions
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (context && AppError.isAppError(error)) {
      throw ContextualError.fromError(error, context);
    }
    throw error;
  }
}

// Error boundary utility (to be implemented in React components)
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ComponentType<{ error: Error }>;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Helper function to create error boundary class (for use in React components)
export function getErrorBoundaryMethods() {
  return {
    getDerivedStateFromError: (error: Error): ErrorBoundaryState => {
      return { hasError: true, error };
    },

    componentDidCatch: (error: Error, errorInfo: any) => {
      console.error("React Error Boundary caught an error:", error, errorInfo);
    },
  };
}
