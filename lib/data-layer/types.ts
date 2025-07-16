// Core data layer interfaces and types
// This file defines the contracts for all data operations

export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Query parameter types
export interface FindManyParams {
  where?: Record<string, any>;
  orderBy?: Record<string, "asc" | "desc">;
  skip?: number;
  take?: number;
  page?: number;
  limit?: number;
}

export interface FindUniqueParams {
  where: {
    id?: string;
    email?: string;
    [key: string]: any;
  };
}

export interface CountParams {
  where?: Record<string, any>;
}

// Result types
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Create and Update data types
export type CreateData<T> = Omit<T, "id" | "createdAt" | "updatedAt">;
export type UpdateData<T> = Partial<Omit<T, "id" | "createdAt" | "updatedAt">>;

// Base Repository interface
export interface Repository<T extends BaseEntity> {
  findMany(params?: FindManyParams): Promise<PaginatedResult<T>>;
  findUnique(params: FindUniqueParams): Promise<T | null>;
  create(data: CreateData<T>): Promise<T>;
  update(id: string, data: UpdateData<T>): Promise<T>;
  delete(id: string): Promise<T>;
  count(params?: CountParams): Promise<number>;
}

// Specific repository interfaces
export interface UserRepository
  extends Repository<import("../types").FitCenterUserProfile> {
  findByEmail(
    email: string
  ): Promise<import("../types").FitCenterUserProfile | null>;
  findByRole(role: string): Promise<import("../types").FitCenterUserProfile[]>;
  findByMembershipStatus(
    status: string
  ): Promise<import("../types").FitCenterUserProfile[]>;
}

export interface ClassRepository
  extends Repository<import("../types").ClassSession> {
  findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<import("../types").ClassSession[]>;
  findByDiscipline(
    disciplineId: string
  ): Promise<import("../types").ClassSession[]>;
  findByInstructor(
    instructorId: string
  ): Promise<import("../types").ClassSession[]>;
  findByStatus(status: string): Promise<import("../types").ClassSession[]>;
}

export interface DisciplineRepository
  extends Repository<import("../types").Discipline> {
  findActive(): Promise<import("../types").Discipline[]>;
  findByName(name: string): Promise<import("../types").Discipline | null>;
}

export interface InstructorRepository
  extends Repository<import("../types").Instructor> {
  findActive(): Promise<import("../types").Instructor[]>;
  findBySpecialty(
    disciplineId: string
  ): Promise<import("../types").Instructor[]>;
}

export interface PlanRepository
  extends Repository<import("../types").MembershipPlan> {
  findActive(): Promise<import("../types").MembershipPlan[]>;
  findByOrganization(
    organizationId: string
  ): Promise<import("../types").MembershipPlan[]>;
}

export interface OrganizationRepository
  extends Repository<import("../types").Organization> {
  findByType(type: string): Promise<import("../types").Organization[]>;
}

// Main DataProvider interface that aggregates all repositories
export interface DataProvider {
  users: UserRepository;
  classes: ClassRepository;
  disciplines: DisciplineRepository;
  instructors: InstructorRepository;
  plans: PlanRepository;
  organizations: OrganizationRepository;
}

// Transaction support for providers that support it
export interface TransactionProvider {
  $transaction<T>(fn: (provider: DataProvider) => Promise<T>): Promise<T>;
}

// Provider configuration
export interface ProviderConfig {
  type: "mock" | "prisma";
  connectionString?: string;
  options?: Record<string, any>;
}
