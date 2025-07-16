// Enhanced UserService using new data layer architecture
// Maintains existing API while using new provider-based architecture

import { BaseService } from "./base-service";
import { FitCenterUserProfile } from "../types";
import { UserRepository } from "../data-layer/types";
import { ApiResponse, PaginatedApiResponse } from "../api/types";
import { generatedSchemas, validateWithSchema } from "../types/generator";
import { ValidationError, NotFoundError } from "../errors/types";

export class UserService extends BaseService<FitCenterUserProfile> {
  protected repositoryName = "users" as const;

  // Get the typed user repository
  private get userRepository(): UserRepository {
    return this.repository as UserRepository;
  }

  // Enhanced methods using new architecture

  // Get users with pagination and filtering
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<PaginatedApiResponse<FitCenterUserProfile>> {
    const findParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 10,
    };

    // Build where clause
    const where: any = {};

    if (params?.role) {
      where.role = params.role;
    }

    if (params?.status) {
      where.membership = { status: params.status };
    }

    if (params?.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (Object.keys(where).length > 0) {
      findParams.where = where;
    }

    return this.findMany(findParams);
  }

  // Get user by ID (enhanced with API response)
  async getUserById(
    id: string
  ): Promise<ApiResponse<FitCenterUserProfile | null>> {
    return this.findById(id);
  }

  // Get user by email
  async getUserByEmail(
    email: string
  ): Promise<ApiResponse<FitCenterUserProfile | null>> {
    return this.withCache(`user_email_${email}`, async () => {
      const user = await this.userRepository.findByEmail(email);
      return this.createSuccessResponse(user);
    });
  }

  // Create user with validation
  async createUser(userData: any): Promise<ApiResponse<FitCenterUserProfile>> {
    return this.create(userData);
  }

  // Update user
  async updateUser(
    id: string,
    userData: any
  ): Promise<ApiResponse<FitCenterUserProfile>> {
    return this.update(id, userData);
  }

  // Delete user
  async deleteUser(id: string): Promise<ApiResponse<FitCenterUserProfile>> {
    return this.delete(id);
  }

  // User-specific methods

  // Get users with membership
  async getUsersWithMembership(): Promise<
    PaginatedApiResponse<FitCenterUserProfile>
  > {
    return this.findMany({
      where: {
        membership: {
          NOT: null,
        },
      },
    });
  }

  // Get active users
  async getActiveUsers(): Promise<PaginatedApiResponse<FitCenterUserProfile>> {
    return this.findMany({
      where: {
        membership: {
          status: "active",
        },
      },
    });
  }

  // Get users by membership status
  async getUsersByMembershipStatus(
    status: string
  ): Promise<PaginatedApiResponse<FitCenterUserProfile>> {
    return this.findMany({
      where: {
        membership: {
          status,
        },
      },
    });
  }

  // Search users
  async searchUsers(
    query: string
  ): Promise<PaginatedApiResponse<FitCenterUserProfile>> {
    return this.search(query, ["firstName", "lastName", "email"]);
  }

  // Get pending users (for admin approval)
  async getPendingUsers(): Promise<PaginatedApiResponse<FitCenterUserProfile>> {
    return this.findMany({
      where: {
        membership: {
          status: "pending",
        },
      },
    });
  }

  // Get expired users
  async getExpiredUsers(): Promise<PaginatedApiResponse<FitCenterUserProfile>> {
    return this.findMany({
      where: {
        membership: {
          status: "expired",
        },
      },
    });
  }

  // Get users with expiring memberships
  async getUsersWithExpiringMemberships(
    days: number = 7
  ): Promise<ApiResponse<FitCenterUserProfile[]>> {
    return this.withErrorHandling(async () => {
      const users = await this.userRepository.findMany();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + days);
      const cutoffString = cutoffDate.toISOString().split("T")[0];

      const expiringUsers = users.items.filter((user) => {
        if (!user.membership || user.membership.status !== "active") {
          return false;
        }
        return user.membership.currentPeriodEnd <= cutoffString;
      });

      return this.createSuccessResponse(expiringUsers);
    });
  }

  // Approve pending user
  async approveUser(
    userId: string
  ): Promise<ApiResponse<FitCenterUserProfile>> {
    return this.withErrorHandling(async () => {
      const user = await this.userRepository.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundError("User", userId);
      }

      if (!user.membership || user.membership.status !== "pending") {
        throw new ValidationError("User is not pending approval");
      }

      const updatedUser = await this.userRepository.update(userId, {
        membership: {
          ...user.membership,
          status: "active",
        },
      });

      await this.afterUserApproval(updatedUser);

      return this.createSuccessResponse(updatedUser);
    });
  }

  // Reject pending user
  async rejectUser(
    userId: string,
    reason: string,
    rejectedBy: string
  ): Promise<ApiResponse<FitCenterUserProfile>> {
    return this.withErrorHandling(async () => {
      const user = await this.userRepository.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundError("User", userId);
      }

      if (!user.membership || user.membership.status !== "pending") {
        throw new ValidationError("User is not pending approval");
      }

      const updatedUser = await this.userRepository.update(userId, {
        membership: {
          ...user.membership,
          status: "inactive",
        },
        rejectionInfo: {
          rejectedAt: new Date().toISOString(),
          reason,
          rejectedBy,
        },
      });

      await this.afterUserRejection(updatedUser, reason);

      return this.createSuccessResponse(updatedUser);
    });
  }

  // Update membership status
  async updateMembershipStatus(
    userId: string,
    status: string
  ): Promise<ApiResponse<FitCenterUserProfile>> {
    return this.withErrorHandling(async () => {
      const user = await this.userRepository.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundError("User", userId);
      }

      if (!user.membership) {
        throw new ValidationError("User has no membership to update");
      }

      const updatedUser = await this.userRepository.update(userId, {
        membership: {
          ...user.membership,
          status: status as any,
        },
      });

      return this.createSuccessResponse(updatedUser);
    });
  }

  // Get user statistics
  async getUserStats(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      pending: number;
      expired: number;
      inactive: number;
      frozen: number;
    }>
  > {
    return this.withCache(
      "user_stats",
      async () => {
        const users = await this.userRepository.findMany();

        const stats = {
          total: users.items.length,
          active: users.items.filter((u) => u.membership?.status === "active")
            .length,
          pending: users.items.filter((u) => u.membership?.status === "pending")
            .length,
          expired: users.items.filter((u) => u.membership?.status === "expired")
            .length,
          inactive: users.items.filter(
            (u) => u.membership?.status === "inactive"
          ).length,
          frozen: users.items.filter((u) => u.membership?.status === "frozen")
            .length,
        };

        return this.createSuccessResponse(stats);
      },
      2 * 60 * 1000 // Cache for 2 minutes
    );
  }

  // Validation hooks

  protected async validateCreateData(data: any): Promise<void> {
    // Validate using generated schema
    validateWithSchema(generatedSchemas.user, data);

    // Additional business validation
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new ValidationError("Email already exists", "email");
      }
    }
  }

  protected async validateUpdateData(
    id: string,
    data: any,
    existingRecord: FitCenterUserProfile
  ): Promise<void> {
    // Validate using generated schema (partial)
    const updateSchema = generatedSchemas.user.partial();
    validateWithSchema(updateSchema, data);

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingRecord.email) {
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser && existingUser.id !== id) {
        throw new ValidationError("Email already exists", "email");
      }
    }
  }

  protected async validateDelete(
    id: string,
    existingRecord: FitCenterUserProfile
  ): Promise<void> {
    // Check if user has active classes or other dependencies
    // This would require checking with other services/repositories

    if (existingRecord.membership?.status === "active") {
      throw new ValidationError(
        "Cannot delete user with active membership. Please deactivate first."
      );
    }
  }

  // Lifecycle hooks

  protected async afterCreate(record: FitCenterUserProfile): Promise<void> {
    // Clear cache
    this.clearCache();

    // Log user creation
    console.log(`[UserService] User created: ${record.id} (${record.email})`);

    // Send welcome email, create audit log, etc.
    await this.afterUserCreation(record);
  }

  protected async afterUpdate(
    updatedRecord: FitCenterUserProfile,
    previousRecord: FitCenterUserProfile
  ): Promise<void> {
    // Clear cache
    this.clearCache();
    this.clearCache(`user_email_${updatedRecord.email}`);

    // Log significant changes
    if (
      previousRecord.membership?.status !== updatedRecord.membership?.status
    ) {
      console.log(
        `[UserService] User membership status changed: ${updatedRecord.id} (${previousRecord.membership?.status} -> ${updatedRecord.membership?.status})`
      );
    }

    await this.afterUserUpdate(updatedRecord, previousRecord);
  }

  protected async afterDelete(
    deletedRecord: FitCenterUserProfile
  ): Promise<void> {
    // Clear cache
    this.clearCache();
    this.clearCache(`user_email_${deletedRecord.email}`);

    console.log(
      `[UserService] User deleted: ${deletedRecord.id} (${deletedRecord.email})`
    );

    await this.afterUserDeletion(deletedRecord);
  }

  // Business logic hooks (can be overridden or extended)

  protected async afterUserCreation(user: FitCenterUserProfile): Promise<void> {
    // Override in subclasses or extend for specific business logic
    // e.g., send welcome email, create audit log, etc.
  }

  protected async afterUserUpdate(
    updatedUser: FitCenterUserProfile,
    previousUser: FitCenterUserProfile
  ): Promise<void> {
    // Override in subclasses or extend for specific business logic
    // e.g., send notification emails, update related records, etc.
  }

  protected async afterUserDeletion(
    deletedUser: FitCenterUserProfile
  ): Promise<void> {
    // Override in subclasses or extend for specific business logic
    // e.g., cleanup related data, send notifications, etc.
  }

  protected async afterUserApproval(user: FitCenterUserProfile): Promise<void> {
    // Send approval email, create audit log, etc.
    console.log(`[UserService] User approved: ${user.id} (${user.email})`);
  }

  protected async afterUserRejection(
    user: FitCenterUserProfile,
    reason: string
  ): Promise<void> {
    // Send rejection email, create audit log, etc.
    console.log(
      `[UserService] User rejected: ${user.id} (${user.email}) - Reason: ${reason}`
    );
  }

  // Helper methods

  private async withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error("[UserService] Operation failed:", error);
      throw error;
    }
  }

  private createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        processingTime: this.getProcessingTime(),
      },
    };
  }
}

// Export singleton instance
export const userService = new UserService();
