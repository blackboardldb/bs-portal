// User repository implementation
// Extracted from mock-database.ts and enhanced with proper typing and error handling

import { BaseRepository } from "./base-repository";
import { UserRepository as IUserRepository } from "../types";
import { FitCenterUserProfile } from "../../types";
import { initialUsers } from "../../mock-data";
import { NotFoundError, ValidationError } from "../../errors/types";

// Mock implementation of UserRepository
export class MockUserRepository
  extends BaseRepository<FitCenterUserProfile>
  implements IUserRepository
{
  protected entityName = "User";
  protected data: FitCenterUserProfile[];

  constructor() {
    super();
    // Initialize with mock data
    this.data = [...initialUsers];
  }

  // Find user by email (specific to users)
  async findByEmail(email: string): Promise<FitCenterUserProfile | null> {
    try {
      const user = this.data.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      return user || null;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error}`);
    }
  }

  // Find users by role
  async findByRole(role: string): Promise<FitCenterUserProfile[]> {
    try {
      return this.data.filter((u) => u.role === role);
    } catch (error) {
      throw new Error(`Failed to find users by role: ${error}`);
    }
  }

  // Find users by membership status
  async findByMembershipStatus(
    status: string
  ): Promise<FitCenterUserProfile[]> {
    try {
      return this.data.filter((u) => u.membership?.status === status);
    } catch (error) {
      throw new Error(`Failed to find users by membership status: ${error}`);
    }
  }

  // Override the base findUnique to handle email searches
  async findUnique(params: {
    where: { id?: string; email?: string; [key: string]: any };
  }): Promise<FitCenterUserProfile | null> {
    try {
      if (params.where.email) {
        return this.findByEmail(params.where.email);
      }
      if (params.where.id) {
        return this.data.find((u) => u.id === params.where.id) || null;
      }

      // Handle other criteria
      const user = this.data.find((item) =>
        this.matchesCriteria(item, params.where)
      );
      return user || null;
    } catch (error) {
      throw new Error(`Failed to find user: ${error}`);
    }
  }

  // Enhanced filtering for complex user queries
  protected applyFilters(
    results: FitCenterUserProfile[],
    where: Record<string, any>
  ): FitCenterUserProfile[] {
    return results.filter((user) => {
      // Role filter
      if (where.role && user.role !== where.role) {
        return false;
      }

      // Membership status filter
      if (
        where.membership?.status &&
        user.membership?.status !== where.membership.status
      ) {
        return false;
      }

      // Search filter (OR conditions)
      if (where.OR && Array.isArray(where.OR)) {
        const matchesSearch = where.OR.some((condition: any) => {
          if (condition.firstName?.contains) {
            const searchTerm = condition.firstName.contains.toLowerCase();
            return user.firstName.toLowerCase().includes(searchTerm);
          }
          if (condition.lastName?.contains) {
            const searchTerm = condition.lastName.contains.toLowerCase();
            return user.lastName.toLowerCase().includes(searchTerm);
          }
          if (condition.email?.contains) {
            const searchTerm = condition.email.contains.toLowerCase();
            return user.email.toLowerCase().includes(searchTerm);
          }
          return false;
        });

        if (!matchesSearch) {
          return false;
        }
      }

      // Apply base filtering for other criteria
      return this.matchesCriteria(user, where);
    });
  }

  // Validate user record
  protected validateRecord(record: FitCenterUserProfile): void {
    super.validateRecord(record);

    if (!record.firstName?.trim()) {
      throw new ValidationError("First name is required", "firstName");
    }

    if (!record.lastName?.trim()) {
      throw new ValidationError("Last name is required", "lastName");
    }

    if (!record.email?.trim()) {
      throw new ValidationError("Email is required", "email");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email)) {
      throw new ValidationError("Invalid email format", "email");
    }

    // Check for duplicate email (excluding current record for updates)
    const existingUser = this.data.find(
      (u) =>
        u.email.toLowerCase() === record.email.toLowerCase() &&
        u.id !== record.id
    );
    if (existingUser) {
      throw new ValidationError("Email already exists", "email", {
        existingUserId: existingUser.id,
      });
    }

    // Validate membership if present
    if (record.membership) {
      this.validateMembership(record.membership);
    }
  }

  // Validate membership data
  private validateMembership(membership: any): void {
    if (!membership.organizationId) {
      throw new ValidationError(
        "Organization ID is required in membership",
        "membership.organizationId"
      );
    }

    if (!membership.status) {
      throw new ValidationError(
        "Membership status is required",
        "membership.status"
      );
    }

    const validStatuses = [
      "active",
      "inactive",
      "suspended",
      "expired",
      "frozen",
      "pending",
    ];
    if (!validStatuses.includes(membership.status)) {
      throw new ValidationError(
        `Invalid membership status. Must be one of: ${validStatuses.join(
          ", "
        )}`,
        "membership.status"
      );
    }

    if (
      typeof membership.monthlyPrice !== "number" ||
      membership.monthlyPrice < 0
    ) {
      throw new ValidationError(
        "Monthly price must be a non-negative number",
        "membership.monthlyPrice"
      );
    }
  }

  // User-specific utility methods

  // Get active users
  async getActiveUsers(): Promise<FitCenterUserProfile[]> {
    return this.findByMembershipStatus("active");
  }

  // Get pending users (for admin approval)
  async getPendingUsers(): Promise<FitCenterUserProfile[]> {
    return this.findByMembershipStatus("pending");
  }

  // Get expired users
  async getExpiredUsers(): Promise<FitCenterUserProfile[]> {
    return this.findByMembershipStatus("expired");
  }

  // Get users with expiring memberships (within days)
  async getUsersWithExpiringMemberships(
    days: number = 7
  ): Promise<FitCenterUserProfile[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);
    const cutoffString = cutoffDate.toISOString().split("T")[0];

    return this.data.filter((user) => {
      if (!user.membership || user.membership.status !== "active") {
        return false;
      }
      return user.membership.currentPeriodEnd <= cutoffString;
    });
  }

  // Search users by name or email
  async searchUsers(query: string): Promise<FitCenterUserProfile[]> {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) {
      return [];
    }

    return this.data.filter(
      (user) =>
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
  }

  // Update user membership status
  async updateMembershipStatus(
    userId: string,
    status: string
  ): Promise<FitCenterUserProfile> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    if (!user.membership) {
      throw new ValidationError("User has no membership to update");
    }

    const updatedUser = await this.update(userId, {
      membership: {
        ...user.membership,
        status: status as any,
        updatedAt: new Date().toISOString(),
      },
    });

    return updatedUser;
  }

  // Approve pending user
  async approveUser(userId: string): Promise<FitCenterUserProfile> {
    return this.updateMembershipStatus(userId, "active");
  }

  // Reject pending user
  async rejectUser(
    userId: string,
    reason: string,
    rejectedBy: string
  ): Promise<FitCenterUserProfile> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundError("User", userId);
    }

    const updatedUser = await this.update(userId, {
      membership: user.membership
        ? {
            ...user.membership,
            status: "inactive" as any,
          }
        : undefined,
      rejectionInfo: {
        rejectedAt: new Date().toISOString(),
        reason,
        rejectedBy,
      },
    });

    return updatedUser;
  }

  // Get user statistics
  async getUserStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    expired: number;
    inactive: number;
  }> {
    const total = this.data.length;
    const active = this.data.filter(
      (u) => u.membership?.status === "active"
    ).length;
    const pending = this.data.filter(
      (u) => u.membership?.status === "pending"
    ).length;
    const expired = this.data.filter(
      (u) => u.membership?.status === "expired"
    ).length;
    const inactive = this.data.filter(
      (u) => u.membership?.status === "inactive"
    ).length;

    return { total, active, pending, expired, inactive };
  }
}

// Prisma implementation skeleton (for future use)
export class PrismaUserRepository implements IUserRepository {
  async findMany(params?: any): Promise<any> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async findUnique(params: any): Promise<FitCenterUserProfile | null> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async create(data: any): Promise<FitCenterUserProfile> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async update(id: string, data: any): Promise<FitCenterUserProfile> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async delete(id: string): Promise<FitCenterUserProfile> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async count(params?: any): Promise<number> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async findByEmail(email: string): Promise<FitCenterUserProfile | null> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async findByRole(role: string): Promise<FitCenterUserProfile[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }

  async findByMembershipStatus(
    status: string
  ): Promise<FitCenterUserProfile[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaUserRepository not implemented yet");
  }
}
