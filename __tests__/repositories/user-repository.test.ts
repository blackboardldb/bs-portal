// User Repository Tests
// Tests for user repository functionality including Mock and Prisma implementations

import { MockUserRepository } from "../../lib/data-layer/repositories/user-repository";
import { FitCenterUserProfile } from "../../lib/types";
import { DataProviderFactoryConfig } from "../../lib/data-layer/provider-factory";

describe("UserRepository", () => {
  let repository: MockUserRepository;
  let mockUsers: FitCenterUserProfile[];

  beforeEach(() => {
    const config: DataProviderFactoryConfig = {
      type: "mock",
      enableLogging: false,
      enableTransactions: false,
    };

    // Create mock users for testing
    mockUsers = [
      {
        id: "user1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        role: "user",
        membership: {
          id: "mem1",
          organizationId: "org1",
          organizationName: "Test Gym",
          status: "active",
          membershipType: "Premium",
          monthlyPrice: 50,
          startDate: "2024-01-01",
          currentPeriodStart: "2024-01-01",
          currentPeriodEnd: "2024-01-31",
          planConfig: {
            classLimit: 20,
            disciplineAccess: "full",
            allowedDisciplines: [],
            canFreeze: true,
            freezeDurationDays: 30,
            autoRenews: true,
          },
          centerStats: {
            currentMonth: {
              classesAttended: 5,
              classesContracted: 20,
              remainingClasses: 15,
              noShows: 0,
              lastMinuteCancellations: 1,
            },
            totalMonthsActive: 6,
            memberSince: "2023-07-01",
            lifetimeStats: {
              totalClasses: 45,
              totalNoShows: 2,
              averageMonthlyAttendance: 7.5,
              bestMonth: {
                month: "December",
                year: 2023,
                count: 12,
              },
            },
          },
          centerConfig: {
            allowCancellation: true,
            cancellationHours: 2,
            maxBookingsPerDay: 2,
            autoWaitlist: true,
          },
        },
      },
      {
        id: "user2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "+1234567891",
        role: "user",
        membership: {
          id: "mem2",
          organizationId: "org1",
          organizationName: "Test Gym",
          status: "expired",
          membershipType: "Basic",
          monthlyPrice: 30,
          startDate: "2023-12-01",
          currentPeriodStart: "2023-12-01",
          currentPeriodEnd: "2023-12-31",
          planConfig: {
            classLimit: 8,
            disciplineAccess: "limited",
            allowedDisciplines: ["crossfit"],
            canFreeze: false,
            freezeDurationDays: 0,
            autoRenews: false,
          },
          centerStats: {
            currentMonth: {
              classesAttended: 0,
              classesContracted: 8,
              remainingClasses: 8,
              noShows: 0,
              lastMinuteCancellations: 0,
            },
            totalMonthsActive: 1,
            memberSince: "2023-12-01",
            lifetimeStats: {
              totalClasses: 6,
              totalNoShows: 1,
              averageMonthlyAttendance: 6,
              bestMonth: {
                month: "December",
                year: 2023,
                count: 6,
              },
            },
          },
          centerConfig: {
            allowCancellation: true,
            cancellationHours: 4,
            maxBookingsPerDay: 1,
            autoWaitlist: false,
          },
        },
      },
    ];

    repository = new MockUserRepository(config);
    // Initialize repository with mock data
    (repository as any).users = [...mockUsers];
  });

  describe("findMany", () => {
    it("should return all users when no filters applied", async () => {
      const result = await repository.findMany();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should filter users by membership status", async () => {
      const result = await repository.findByMembershipStatus("active");

      expect(result).toHaveLength(1);
      expect(result[0].membership?.status).toBe("active");
      expect(result[0].firstName).toBe("John");
    });

    it("should filter users by role", async () => {
      const result = await repository.findMany({
        where: { role: "user" },
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((user) => user.role === "user")).toBe(true);
    });

    it("should search users by name", async () => {
      const result = await repository.searchUsers("John");

      expect(result).toHaveLength(1);
      expect(result[0].firstName).toBe("John");
    });

    it("should search users by email", async () => {
      const result = await repository.searchUsers("jane.smith");

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("jane.smith@example.com");
    });

    it("should apply pagination correctly", async () => {
      const result = await repository.findMany({
        skip: 1,
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].firstName).toBe("Jane");
    });
  });

  describe("findUnique", () => {
    it("should find user by id", async () => {
      const user = await repository.findUnique({
        where: { id: "user1" },
      });

      expect(user).not.toBeNull();
      expect(user?.firstName).toBe("John");
    });

    it("should find user by email", async () => {
      const user = await repository.findByEmail("jane.smith@example.com");

      expect(user).not.toBeNull();
      expect(user?.firstName).toBe("Jane");
    });

    it("should return null for non-existent user", async () => {
      const user = await repository.findUnique({
        where: { id: "nonexistent" },
      });

      expect(user).toBeNull();
    });
  });

  describe("create", () => {
    it("should create new user with valid data", async () => {
      const userData = {
        firstName: "Bob",
        lastName: "Johnson",
        email: "bob.johnson@example.com",
        phone: "+1234567892",
        role: "user" as const,
      };

      const newUser = await repository.create({
        data: userData,
      });

      expect(newUser.firstName).toBe("Bob");
      expect(newUser.lastName).toBe("Johnson");
      expect(newUser.email).toBe("bob.johnson@example.com");
      expect(newUser.id).toBeDefined();
    });

    it("should throw error for duplicate email", async () => {
      const userData = {
        firstName: "Duplicate",
        lastName: "User",
        email: "john.doe@example.com", // Existing email
        role: "user" as const,
      };

      await expect(
        repository.create({
          data: userData,
        })
      ).rejects.toThrow();
    });
  });

  describe("update", () => {
    it("should update user data", async () => {
      const updated = await repository.update({
        where: { id: "user1" },
        data: {
          firstName: "Johnny",
          phone: "+9876543210",
        },
      });

      expect(updated.firstName).toBe("Johnny");
      expect(updated.phone).toBe("+9876543210");
      expect(updated.lastName).toBe("Doe"); // Unchanged
    });

    it("should update membership status", async () => {
      const updated = await repository.updateMembershipStatus(
        "user2",
        "active"
      );

      expect(updated.membership?.status).toBe("active");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        repository.update({
          where: { id: "nonexistent" },
          data: { firstName: "Updated" },
        })
      ).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("should delete existing user", async () => {
      const deleted = await repository.delete({
        where: { id: "user1" },
      });

      expect(deleted.firstName).toBe("John");

      // Verify user is deleted
      const user = await repository.findUnique({
        where: { id: "user1" },
      });
      expect(user).toBeNull();
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        repository.delete({
          where: { id: "nonexistent" },
        })
      ).rejects.toThrow();
    });
  });

  describe("getUserStats", () => {
    it("should return correct user statistics", async () => {
      const stats = await repository.getUserStats();

      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.expired).toBe(1);
      expect(stats.pending).toBe(0);
      expect(stats.inactive).toBe(0);
    });
  });

  describe("count", () => {
    it("should return total user count", async () => {
      const count = await repository.count();
      expect(count).toBe(2);
    });

    it("should return filtered count", async () => {
      const count = await repository.count({
        where: { role: "user" },
      });
      expect(count).toBe(2);
    });
  });

  describe("business logic methods", () => {
    it("should find users with expiring memberships", async () => {
      // Mock a user with membership expiring soon
      const expiringUser = {
        ...mockUsers[0],
        id: "user3",
        membership: {
          ...mockUsers[0].membership!,
          currentPeriodEnd: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 5 days from now
        },
      };

      (repository as any).users.push(expiringUser);

      const expiringUsers = await repository.findUsersWithExpiringMemberships(
        7
      ); // Within 7 days

      expect(expiringUsers).toHaveLength(1);
      expect(expiringUsers[0].id).toBe("user3");
    });

    it("should find users by membership type", async () => {
      const premiumUsers = await repository.findByMembershipType("Premium");

      expect(premiumUsers).toHaveLength(1);
      expect(premiumUsers[0].membership?.membershipType).toBe("Premium");
    });
  });
});
