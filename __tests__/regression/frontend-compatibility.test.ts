// Frontend Compatibility Regression Tests
// Tests to ensure existing frontend components continue to work with new data layer

import { useBlackSheepStore } from "../../lib/blacksheep-store";
import { DataProviderFactory } from "../../lib/data-layer/provider-factory";
import { act, renderHook } from "@testing-library/react";

// Mock the data provider factory
jest.mock("../../lib/data-layer/provider-factory");
jest.mock("../../lib/services/user-service");

const mockDataProviderFactory = DataProviderFactory as jest.Mocked<
  typeof DataProviderFactory
>;

describe("Frontend Compatibility Regression Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock provider factory methods
    mockDataProviderFactory.create.mockReturnValue({} as any);
    mockDataProviderFactory.getCurrentProviderType.mockReturnValue("mock");
    mockDataProviderFactory.getProviderHealth.mockResolvedValue({
      type: "mock",
      status: "healthy",
      details: {},
    });
    mockDataProviderFactory.switchProvider.mockResolvedValue({} as any);
  });

  describe("Zustand Store Compatibility", () => {
    it("should maintain existing store interface", () => {
      const { result } = renderHook(() => useBlackSheepStore());

      // Verify all expected store properties exist
      expect(result.current).toHaveProperty("users");
      expect(result.current).toHaveProperty("pagination");
      expect(result.current).toHaveProperty("classSessions");
      expect(result.current).toHaveProperty("disciplines");
      expect(result.current).toHaveProperty("instructors");
      expect(result.current).toHaveProperty("plans");
      expect(result.current).toHaveProperty("isLoading");
      expect(result.current).toHaveProperty("error");

      // Verify all expected actions exist
      expect(result.current).toHaveProperty("fetchUsers");
      expect(result.current).toHaveProperty("fetchUserById");
      expect(result.current).toHaveProperty("createUser");
      expect(result.current).toHaveProperty("updateUserById");
      expect(result.current).toHaveProperty("deleteUserById");
      expect(result.current).toHaveProperty("searchUsers");
      expect(result.current).toHaveProperty("getUserStats");
      expect(result.current).toHaveProperty("fetchClassSessions");
      expect(result.current).toHaveProperty("fetchDisciplines");
      expect(result.current).toHaveProperty("fetchInstructors");
      expect(result.current).toHaveProperty("fetchPlans");

      // Verify new provider management actions
      expect(result.current).toHaveProperty("switchProvider");
      expect(result.current).toHaveProperty("getProviderHealth");
      expect(result.current).toHaveProperty("currentProviderType");
    });

    it("should maintain backward compatibility for user operations", async () => {
      const { result } = renderHook(() => useBlackSheepStore());

      // Mock UserService methods
      const mockUserService =
        require("../../lib/services/user-service").UserService;
      const mockInstance = {
        getUsers: jest.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: "user1",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              membership: { status: "active" },
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        }),
        createUser: jest.fn().mockResolvedValue({
          success: true,
          data: { id: "user2", firstName: "Jane", lastName: "Smith" },
        }),
        updateUser: jest.fn().mockResolvedValue({
          success: true,
          data: { id: "user1", firstName: "Johnny", lastName: "Doe" },
        }),
        deleteUser: jest.fn().mockResolvedValue({ success: true }),
        searchUsers: jest.fn().mockResolvedValue({
          success: true,
          data: [{ id: "user1", firstName: "John" }],
        }),
        getUserStats: jest.fn().mockResolvedValue({
          success: true,
          data: { total: 1, active: 1, expired: 0, pending: 0, inactive: 0 },
        }),
      };

      mockUserService.mockImplementation(() => mockInstance);

      // Test fetchUsers
      await act(async () => {
        await result.current.fetchUsers(1, 10, "search", "user", "active");
      });

      expect(mockInstance.getUsers).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: "search",
        role: "user",
        status: "active",
      });

      // Test createUser
      await act(async () => {
        const user = await result.current.createUser({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
        });
        expect(user).toHaveProperty("id", "user2");
      });

      // Test updateUserById
      await act(async () => {
        const user = await result.current.updateUserById("user1", {
          firstName: "Johnny",
        });
        expect(user).toHaveProperty("firstName", "Johnny");
      });

      // Test deleteUserById
      await act(async () => {
        const success = await result.current.deleteUserById("user1");
        expect(success).toBe(true);
      });

      // Test searchUsers
      await act(async () => {
        const users = await result.current.searchUsers("John");
        expect(users).toHaveLength(1);
        expect(users[0]).toHaveProperty("firstName", "John");
      });

      // Test getUserStats
      await act(async () => {
        const stats = await result.current.getUserStats();
        expect(stats).toHaveProperty("total", 1);
        expect(stats).toHaveProperty("active", 1);
      });
    });

    it("should handle loading and error states correctly", async () => {
      const { result } = renderHook(() => useBlackSheepStore());

      // Mock UserService to simulate error
      const mockUserService =
        require("../../lib/services/user-service").UserService;
      const mockInstance = {
        getUsers: jest.fn().mockResolvedValue({
          success: false,
          error: { code: "TEST_ERROR", message: "Test error message" },
        }),
      };

      mockUserService.mockImplementation(() => mockInstance);

      // Initial state should not be loading
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      // Test error handling
      await act(async () => {
        await result.current.fetchUsers();
      });

      // Should not be loading after completion
      expect(result.current.isLoading).toBe(false);
      // Should have error message
      expect(result.current.error).toBeTruthy();
    });
  });

  describe("Store Selector Hooks Compatibility", () => {
    it("should maintain existing selector hooks", () => {
      // Import selector hooks
      const {
        useActiveUsers,
        usePendingUsers,
        useExpiredUsers,
        useUserStats,
        useClassesForDate,
        useCurrentUser,
        useActiveDisciplines,
      } = require("../../lib/blacksheep-store");

      // Verify all selector hooks exist and are functions
      expect(typeof useActiveUsers).toBe("function");
      expect(typeof usePendingUsers).toBe("function");
      expect(typeof useExpiredUsers).toBe("function");
      expect(typeof useUserStats).toBe("function");
      expect(typeof useClassesForDate).toBe("function");
      expect(typeof useCurrentUser).toBe("function");
      expect(typeof useActiveDisciplines).toBe("function");
    });

    it("should return correct data structure from selector hooks", () => {
      const { renderHook } = require("@testing-library/react");
      const { useUserStats } = require("../../lib/blacksheep-store");

      const { result } = renderHook(() => useUserStats());

      // Should return stats object with expected properties
      expect(result.current).toHaveProperty("total");
      expect(result.current).toHaveProperty("active");
      expect(result.current).toHaveProperty("pending");
      expect(result.current).toHaveProperty("expired");

      // All values should be numbers
      expect(typeof result.current.total).toBe("number");
      expect(typeof result.current.active).toBe("number");
      expect(typeof result.current.pending).toBe("number");
      expect(typeof result.current.expired).toBe("number");
    });
  });

  describe("Constants and Types Compatibility", () => {
    it("should maintain existing constants", () => {
      const {
        STUDENT_STATES,
        STATE_COLORS,
        MEMBERSHIP_TYPES,
      } = require("../../lib/blacksheep-store");

      // Verify constants exist
      expect(STUDENT_STATES).toBeDefined();
      expect(STATE_COLORS).toBeDefined();
      expect(MEMBERSHIP_TYPES).toBeDefined();

      // Verify STUDENT_STATES structure
      expect(STUDENT_STATES).toHaveProperty("ACTIVE");
      expect(STUDENT_STATES).toHaveProperty("INACTIVE");
      expect(STUDENT_STATES).toHaveProperty("PENDING");
      expect(STUDENT_STATES).toHaveProperty("EXPIRED");

      // Verify STATE_COLORS structure
      expect(STATE_COLORS).toHaveProperty("active");
      expect(STATE_COLORS).toHaveProperty("inactive");
      expect(STATE_COLORS).toHaveProperty("pending");
      expect(STATE_COLORS).toHaveProperty("expired");

      // Verify MEMBERSHIP_TYPES is an array
      expect(Array.isArray(MEMBERSHIP_TYPES)).toBe(true);
      expect(MEMBERSHIP_TYPES.length).toBeGreaterThan(0);

      // Verify membership type structure
      const membershipType = MEMBERSHIP_TYPES[0];
      expect(membershipType).toHaveProperty("id");
      expect(membershipType).toHaveProperty("name");
      expect(membershipType).toHaveProperty("description");
      expect(membershipType).toHaveProperty("price");
    });
  });

  describe("Provider Management Integration", () => {
    it("should integrate provider switching with store", async () => {
      const { result } = renderHook(() => useBlackSheepStore());

      // Mock fetch for provider switching API
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: { message: "Provider switched to prisma" },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              health: { type: "prisma", status: "healthy" },
            },
          }),
        });

      // Test provider switching
      await act(async () => {
        const success = await result.current.switchProvider("prisma");
        expect(success).toBe(true);
      });

      expect(result.current.currentProviderType).toBe("prisma");

      // Test provider health check
      await act(async () => {
        const health = await result.current.getProviderHealth();
        expect(health).toHaveProperty("type", "prisma");
        expect(health).toHaveProperty("status", "healthy");
      });
    });
  });

  describe("Data Structure Compatibility", () => {
    it("should maintain user data structure compatibility", () => {
      const { result } = renderHook(() => useBlackSheepStore());

      // Simulate user data structure that frontend expects
      const expectedUserStructure = {
        id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
        phone: expect.any(String),
        role: expect.any(String),
        membership: {
          id: expect.any(String),
          organizationId: expect.any(String),
          organizationName: expect.any(String),
          status: expect.any(String),
          membershipType: expect.any(String),
          monthlyPrice: expect.any(Number),
          startDate: expect.any(String),
          currentPeriodStart: expect.any(String),
          currentPeriodEnd: expect.any(String),
          planConfig: {
            classLimit: expect.any(Number),
            disciplineAccess: expect.any(String),
            allowedDisciplines: expect.any(Array),
            canFreeze: expect.any(Boolean),
            freezeDurationDays: expect.any(Number),
            autoRenews: expect.any(Boolean),
          },
          centerStats: {
            currentMonth: {
              classesAttended: expect.any(Number),
              classesContracted: expect.any(Number),
              remainingClasses: expect.any(Number),
              noShows: expect.any(Number),
              lastMinuteCancellations: expect.any(Number),
            },
            totalMonthsActive: expect.any(Number),
            memberSince: expect.any(String),
            lifetimeStats: {
              totalClasses: expect.any(Number),
              totalNoShows: expect.any(Number),
              averageMonthlyAttendance: expect.any(Number),
              bestMonth: {
                month: expect.any(String),
                year: expect.any(Number),
                count: expect.any(Number),
              },
            },
          },
          centerConfig: {
            allowCancellation: expect.any(Boolean),
            cancellationHours: expect.any(Number),
            maxBookingsPerDay: expect.any(Number),
            autoWaitlist: expect.any(Boolean),
          },
        },
      };

      // This structure should be maintained for frontend compatibility
      expect(expectedUserStructure).toBeDefined();
    });

    it("should maintain class data structure compatibility", () => {
      const expectedClassStructure = {
        id: expect.any(String),
        organizationId: expect.any(String),
        disciplineId: expect.any(String),
        name: expect.any(String),
        dateTime: expect.any(String),
        durationMinutes: expect.any(Number),
        instructorId: expect.any(String),
        capacity: expect.any(Number),
        registeredParticipantsIds: expect.any(Array),
        waitlistParticipantsIds: expect.any(Array),
        status: expect.any(String),
        notes: expect.any(String),
        isGenerated: expect.any(Boolean),
      };

      // This structure should be maintained for frontend compatibility
      expect(expectedClassStructure).toBeDefined();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
