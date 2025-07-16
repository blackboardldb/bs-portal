# Implementation Plan - Data Layer Refactor

## Task Overview

Este plan implementa la refactorización de la capa de datos en 5 fases incrementales, cada una construyendo sobre la anterior. Cada tarea está diseñada para ser ejecutada por un agente de código sin romper la funcionalidad existente.

## Phase 1: Infrastructure Setup

- [x] 1. Create core data layer interfaces and types

  - Create `lib/data-layer/types.ts` with Repository and DataProvider interfaces
  - Define base interfaces for all repository operations (findMany, findUnique, create, update, delete)
  - Create PaginatedResult and FindManyParams types for consistent query patterns
  - _Requirements: 2.1, 2.3_

- [x] 2. Implement API response type system

  - Create `lib/api/types.ts` with standardized ApiResponse interfaces
  - Define PaginatedApiResponse, ApiError, and ResponseMeta types
  - Create type guards and validation utilities for API responses
  - _Requirements: 3.1, 3.2_

- [x] 3. Create error handling framework

  - Create `lib/errors/types.ts` with AppError class and ErrorCode enum
  - Implement `lib/errors/handler.ts` with centralized error handling logic
  - Create error boundary utilities for consistent error processing
  - _Requirements: 4.1, 4.2_

- [x] 4. Set up type generation utilities
  - Create `lib/types/generator.ts` with schema generation functions
  - Implement utilities to auto-generate Zod schemas from TypeScript interfaces
  - Create validation helpers that work with generated schemas
  - _Requirements: 1.1, 1.2_

## Phase 2: Repository Layer Implementation

- [x] 5. Create base repository classes

  - Implement `lib/data-layer/repositories/base-repository.ts` with common repository logic
  - Create abstract Repository class with standard CRUD operations
  - Add query building utilities and parameter validation
  - _Requirements: 2.2, 5.1_

- [x] 6. Extract and implement UserRepository

  - Create `lib/data-layer/repositories/user-repository.ts` with UserRepository interface
  - Implement MockUserRepository by extracting logic from current mock-database
  - Create PrismaUserRepository skeleton with same interface
  - Add comprehensive unit tests for repository operations
  - _Requirements: 2.1, 5.2_

- [x] 7. Extract and implement ClassRepository

  - Create `lib/data-layer/repositories/class-repository.ts` with ClassRepository interface
  - Implement MockClassRepository with current class session logic
  - Create PrismaClassRepository skeleton matching the interface
  - Add tests for class-specific operations like date filtering
  - _Requirements: 2.1, 5.2_

- [x] 8. Extract and implement remaining repositories
  - Create DisciplineRepository, InstructorRepository, and PlanRepository interfaces
  - Implement Mock versions of each repository with current logic
  - Create Prisma skeleton implementations for all repositories
  - Add comprehensive test coverage for all repository operations
  - _Requirements: 2.1, 5.2_

## Phase 3: Data Provider Implementation

- [x] 9. Create DataProvider factory system

  - Implement `lib/data-layer/provider-factory.ts` with environment-based provider selection
  - Create DataProvider interface that aggregates all repositories
  - Add configuration system for switching between mock and real providers
  - _Requirements: 2.2, 5.1_

- [x] 10. Implement MockDataProvider

  - Create `lib/data-layer/providers/mock-provider.ts` using existing mock repositories
  - Integrate all Mock repositories into a single provider class
  - Ensure MockDataProvider maintains current functionality exactly
  - Add integration tests to verify provider works correctly
  - _Requirements: 2.3, 8.1_

- [x] 11. Create PrismaDataProvider skeleton
  - Implement `lib/data-layer/providers/prisma-provider.ts` with Prisma repositories
  - Create database connection management and transaction support
  - Add environment configuration for database connection
  - Implement error handling specific to database operations
  - _Requirements: 5.1, 5.3_

## Phase 4: Service Layer Enhancement

- [x] 12. Create enhanced base service class

  - Implement `lib/services/base-service.ts` with DataProvider integration
  - Add standardized error handling and response formatting
  - Create common service operations that work with any provider
  - Add logging and monitoring hooks for service operations
  - _Requirements: 4.1, 7.1_

- [x] 13. Refactor UserService to use new architecture

  - Update `lib/services/user-service.ts` to extend BaseService
  - Replace direct store access with DataProvider calls
  - Maintain existing public API while using new internal architecture
  - Add comprehensive tests to ensure no breaking changes
  - _Requirements: 8.1, 8.2_

- [x] 14. Update validation service integration
  - Modify `lib/validation-service.ts` to work with new data layer
  - Ensure validation logic works with both Mock and Prisma providers
  - Add provider-agnostic validation that doesn't depend on implementation details
  - Test validation with both data sources to ensure consistency
  - _Requirements: 6.3, 8.1_

## Phase 5: Store and API Integration

- [x] 15. Update Zustand store to use services

  - Modify `lib/blacksheep-store.ts` to use enhanced services instead of direct API calls
  - Replace fetch calls with service method calls
  - Maintain existing store API to avoid breaking frontend components
  - Add error handling that integrates with new error system
  - _Requirements: 8.1, 8.2, 4.3_

- [x] 16. Standardize API route responses

  - Update `app/api/users/route.ts` to use new response types and error handling
  - Modify `app/api/classes/route.ts` to follow standardized response format
  - Update all other API routes to use consistent response structure
  - Add API-level error handling that works with new error system
  - _Requirements: 3.1, 3.3, 4.4_

- [x] 17. Implement provider switching mechanism
  - Add environment variable configuration for DATA_PROVIDER selection
  - Create runtime provider switching that works in development and production
  - Add validation to ensure selected provider is properly configured
  - Test switching between providers without application restart
  - _Requirements: 5.2, 5.3_

## Phase 6: Testing and Validation

- [x] 18. Create comprehensive repository tests

  - Write unit tests for all repository implementations (Mock and Prisma)
  - Create integration tests that verify both providers return compatible data
  - Add performance tests to ensure new architecture doesn't degrade performance
  - Create migration tests that validate switching between providers
  - _Requirements: 7.1, 7.2_

- [x] 19. Add API compatibility tests

  - Create tests that verify API responses match expected schemas
  - Add tests that validate error responses follow standard format
  - Create end-to-end tests that work with both data providers
  - Add regression tests to ensure frontend compatibility is maintained
  - _Requirements: 3.4, 8.3, 8.4_

- [x] 20. Implement monitoring and logging
  - Add structured logging throughout the data layer
  - Create performance monitoring for database operations
  - Add health checks that work with both Mock and Prisma providers
  - Implement error tracking and alerting for production issues
  - _Requirements: 4.2, 7.3_

## Phase 7: Documentation and Migration Preparation

- [x] 21. Create migration documentation

  - Document the process for switching from Mock to Prisma provider
  - Create environment setup guides for both development and production
  - Add troubleshooting guide for common migration issues
  - Document rollback procedures in case of migration problems
  - _Requirements: 5.4_

- [x] 22. Prepare Prisma schema and migrations

  - Create Prisma schema file that matches existing TypeScript interfaces
  - Generate initial migration files for database setup
  - Create seed scripts that populate database with test data
  - Add database backup and restore procedures
  - _Requirements: 5.1, 5.3_

- [x] 23. Final integration testing
  - Run full application test suite with Mock provider to ensure no regressions
  - Test complete user workflows to validate end-to-end functionality
  - Perform load testing to ensure performance requirements are met
  - Validate that all existing frontend functionality works unchanged
  - _Requirements: 7.4, 8.1, 8.2_

## Success Criteria

Upon completion of all tasks:

1. Application works identically with Mock and Prisma providers
2. Migration between providers requires only environment variable change
3. All existing frontend components work without modification
4. Performance is maintained or improved
5. Error handling is consistent and user-friendly
6. Full test coverage ensures reliability
7. Documentation enables smooth production deployment
