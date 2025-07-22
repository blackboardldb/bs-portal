// Standardized API response types
// This ensures consistent API responses across all endpoints

import { PaginationMeta } from "../data-layer/types";

// Base API response structure
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: ApiError;
  meta?: ResponseMeta;
}

// Paginated API response for list endpoints
export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// Error structure for API responses
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string; // For validation errors
}

// Additional metadata for responses
export interface ResponseMeta {
  timestamp: string;
  requestId?: string;
  version?: string;
  processingTime?: number;
}

// Success response helper
export function createSuccessResponse<T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> {
  return {
    data,
    success: true,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

// Paginated success response helper
export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationMeta,
  meta?: ResponseMeta
): PaginatedApiResponse<T> {
  return {
    data: items,
    success: true,
    pagination,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

// Error response helper
export function createErrorResponse<T = null>(
  error: ApiError,
  meta?: ResponseMeta
): ApiResponse<T> {
  return {
    data: null as T,
    success: false,
    error,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

// Type guards for API responses
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: true } {
  return response.success === true;
}

export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiResponse<T> & { success: false; error: ApiError } {
  return response.success === false && !!response.error;
}

export function isPaginatedResponse<T>(
  response: ApiResponse<T[] | T>
): response is PaginatedApiResponse<T> {
  return "pagination" in response;
}

// Validation utilities for API responses
export function validateApiResponse<T>(
  response: unknown
): response is ApiResponse<T> {
  if (typeof response !== "object" || response === null) {
    return false;
  }

  const obj = response as Record<string, unknown>;

  return "data" in obj && "success" in obj && typeof obj.success === "boolean";
}

export function validatePaginatedResponse<T>(
  response: unknown
): response is PaginatedApiResponse<T> {
  if (!validateApiResponse(response)) {
    return false;
  }

  const obj = response as unknown as Record<string, unknown>;

  return (
    "pagination" in obj &&
    typeof obj.pagination === "object" &&
    obj.pagination !== null
  );
}

// Common API error codes
export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  CONFLICT = "CONFLICT",
  RATE_LIMITED = "RATE_LIMITED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  BAD_REQUEST = "BAD_REQUEST",
}

// HTTP status code mapping
export const HTTP_STATUS_CODES = {
  [ApiErrorCode.VALIDATION_ERROR]: 400,
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.RATE_LIMITED]: 429,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
  [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
} as const;

// Specific API response types for each entity
export type UserApiResponse = ApiResponse<
  import("../types").FitCenterUserProfile
>;
export type UserListApiResponse = PaginatedApiResponse<
  import("../types").FitCenterUserProfile
>;

export type ClassApiResponse = ApiResponse<import("../types").ClassSession>;
export type ClassListApiResponse = PaginatedApiResponse<
  import("../types").ClassSession
>;

export type DisciplineApiResponse = ApiResponse<import("../types").Discipline>;
export type DisciplineListApiResponse = PaginatedApiResponse<
  import("../types").Discipline
>;

export type InstructorApiResponse = ApiResponse<import("../types").Instructor>;
export type InstructorListApiResponse = PaginatedApiResponse<
  import("../types").Instructor
>;

export type PlanApiResponse = ApiResponse<import("../types").MembershipPlan>;
export type PlanListApiResponse = PaginatedApiResponse<
  import("../types").MembershipPlan
>;

export type OrganizationApiResponse = ApiResponse<
  import("../types").Organization
>;
export type OrganizationListApiResponse = PaginatedApiResponse<
  import("../types").Organization
>;
