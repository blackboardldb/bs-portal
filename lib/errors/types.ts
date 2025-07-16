// Error types and classes for consistent error handling

import { ApiErrorCode } from "../api/types";

// Base application error class
export class AppError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly field?: string;
  public readonly timestamp: string;

  constructor(
    code: ApiErrorCode,
    message: string,
    options?: {
      statusCode?: number;
      details?: Record<string, any>;
      field?: string;
      cause?: Error;
    }
  ) {
    super(message);

    this.name = "AppError";
    this.code = code;
    this.statusCode = options?.statusCode || this.getDefaultStatusCode(code);
    this.details = options?.details;
    this.field = options?.field;
    this.timestamp = new Date().toISOString();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    // Set the cause if provided
    if (options?.cause) {
      this.cause = options.cause;
    }
  }

  private getDefaultStatusCode(code: ApiErrorCode): number {
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

    return statusCodes[code] || 500;
  }

  // Convert to API error format
  toApiError() {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      field: this.field,
    };
  }

  // Check if error is of specific type
  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

// Specific error classes for common scenarios
export class ValidationError extends AppError {
  constructor(message: string, field?: string, details?: Record<string, any>) {
    super(ApiErrorCode.VALIDATION_ERROR, message, {
      field,
      details,
      statusCode: 400,
    });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;

    super(ApiErrorCode.NOT_FOUND, message, {
      statusCode: 404,
      details: { resource, identifier },
    });
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(ApiErrorCode.UNAUTHORIZED, message, {
      statusCode: 401,
    });
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied") {
    super(ApiErrorCode.FORBIDDEN, message, {
      statusCode: 403,
    });
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(ApiErrorCode.CONFLICT, message, {
      statusCode: 409,
      details,
    });
    this.name = "ConflictError";
  }
}

export class InternalError extends AppError {
  constructor(message: string = "Internal server error", cause?: Error) {
    super(ApiErrorCode.INTERNAL_ERROR, message, {
      statusCode: 500,
      cause,
    });
    this.name = "InternalError";
  }
}

// Error context for better debugging
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  operation?: string;
  resource?: string;
  metadata?: Record<string, any>;
}

// Enhanced error with context
export class ContextualError extends AppError {
  public readonly context: ErrorContext;

  constructor(
    code: ApiErrorCode,
    message: string,
    context: ErrorContext,
    options?: {
      statusCode?: number;
      details?: Record<string, any>;
      field?: string;
      cause?: Error;
    }
  ) {
    super(code, message, options);
    this.context = context;
    this.name = "ContextualError";
  }

  // Create contextual error from regular error
  static fromError(error: AppError, context: ErrorContext): ContextualError {
    return new ContextualError(error.code, error.message, context, {
      statusCode: error.statusCode,
      details: error.details,
      field: error.field,
      cause: error.cause as Error,
    });
  }
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Error with severity for monitoring
export class MonitoredError extends AppError {
  public readonly severity: ErrorSeverity;

  constructor(
    code: ApiErrorCode,
    message: string,
    severity: ErrorSeverity,
    options?: {
      statusCode?: number;
      details?: Record<string, any>;
      field?: string;
      cause?: Error;
    }
  ) {
    super(code, message, options);
    this.severity = severity;
    this.name = "MonitoredError";
  }
}

// Type guards for error checking
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isUnauthorizedError(
  error: unknown
): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export function isForbiddenError(error: unknown): error is ForbiddenError {
  return error instanceof ForbiddenError;
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}

export function isInternalError(error: unknown): error is InternalError {
  return error instanceof InternalError;
}
