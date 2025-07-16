// Users API Compatibility Tests
// Tests to verify API responses match expected schemas and maintain frontend compatibility

import { NextRequest } from "next/server";
import { GET, POST } from "../../app/api/users/route";
import {
  GET as getUserById,
  PUT as updateUser,
  DELETE as deleteUser,
} from "../../app/api/users/[id]/route";

// Mock the services to avoid actual data operations during testing
jest.mock("../../lib/services/user-service");
jest.mock("../../lib/errors/handler");

import { UserService } from "../../lib/services/user-service";
import { ErrorHandler } from "../../lib/errors/handler";

const mockUserService = UserService as jest.MockedClass<typeof UserService>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

describe("Users API Compatibility", () => {
  let mockUserServiceInstance: jest.Mocked<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserServiceInstance = {
      getUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      searchUsers: jest.fn(),
      getUserStats: jest.fn(),
      getUsersByMembershipStatus: jest.fn(),
    } as any;

    mockUserService.mockImplementation(() => mockUserServiceInstance);
  });

  describe("GET /api/users", () => {
    it("should return paginated users with correct schema", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: "user1",
            firstName: "John",
            lastName: "Doe",
            email: "john.doe@example.com",
            phone: "+1234567890",
            role: "user",
            membership: {
              id: "mem1",
              status: "active",
              membershipType: "Premium",
              monthlyPrice: 50,
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockUserServiceInstance.getUsers.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/users?page=1&limit=10"
      );
      const response = await GET(request);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");

      // Verify pagination structure
      expect(data.pagination).toHaveProperty("page");
      expect(data.pagination).toHaveProperty("limit");
      expect(data.pagination).toHaveProperty("total");
      expect(data.pagination).toHaveProperty("totalPages");

      // Verify user data structure
      const user = data.data[0];
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("firstName");
      expect(user).toHaveProperty("lastName");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("role");
      expect(user).toHaveProperty("membership");

      // Verify membership structure
      expect(user.membership).toHaveProperty("status");
      expect(user.membership).toHaveProperty("membershipType");
      expect(user.membership).toHaveProperty("monthlyPrice");
    });

    it("should handle query parameters correctly", async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 2, limit: 5, total: 0, totalPages: 0 },
      };

      mockUserServiceInstance.getUsers.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/users?page=2&limit=5&search=test&role=user&status=active"
      );
      await GET(request);

      expect(mockUserServiceInstance.getUsers).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        search: "test",
        role: "user",
        status: "active",
      });
    });

    it("should handle service errors gracefully", async () => {
      const mockError = new Error("Service error");
      mockUserServiceInstance.getUsers.mockRejectedValue(mockError);

      mockErrorHandler.createResponse.mockReturnValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Service error" },
          }),
          { status: 500 }
        )
      );

      const request = new NextRequest("http://localhost:3000/api/users");
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(mockErrorHandler.createResponse).toHaveBeenCalledWith(mockError, {
        operation: "getUsers",
        resource: "users",
      });
    });
  });

  describe("POST /api/users", () => {
    it("should create user and return correct schema", async () => {
      const mockUser = {
        id: "user2",
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        role: "user",
      };

      const mockResponse = {
        success: true,
        data: mockUser,
      };

      mockUserServiceInstance.createUser.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@example.com",
          role: "user",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("id");
      expect(data.data).toHaveProperty("firstName", "Jane");
      expect(data.data).toHaveProperty("email", "jane.smith@example.com");
    });

    it("should handle validation errors", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Email is required",
        },
      };

      mockUserServiceInstance.createUser.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          firstName: "Jane",
          lastName: "Smith",
          // Missing email
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
    });
  });

  describe("GET /api/users/[id]", () => {
    it("should return single user with correct schema", async () => {
      const mockUser = {
        id: "user1",
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        membership: {
          status: "active",
          membershipType: "Premium",
        },
      };

      const mockResponse = {
        success: true,
        data: mockUser,
      };

      mockUserServiceInstance.getUserById.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/users/user1");
      const response = await getUserById(request, { params: { id: "user1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("id", "user1");
      expect(data.data).toHaveProperty("firstName", "John");
    });

    it("should return 404 for non-existent user", async () => {
      const mockResponse = {
        success: false,
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "User not found",
        },
      };

      mockUserServiceInstance.getUserById.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/users/nonexistent"
      );
      const response = await getUserById(request, {
        params: { id: "nonexistent" },
      });

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/users/[id]", () => {
    it("should update user and return updated data", async () => {
      const mockUpdatedUser = {
        id: "user1",
        firstName: "Johnny",
        lastName: "Doe",
        email: "john.doe@example.com",
      };

      const mockResponse = {
        success: true,
        data: mockUpdatedUser,
      };

      mockUserServiceInstance.updateUser.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/users/user1", {
        method: "PUT",
        body: JSON.stringify({
          firstName: "Johnny",
        }),
      });

      const response = await updateUser(request, { params: { id: "user1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("firstName", "Johnny");
    });
  });

  describe("DELETE /api/users/[id]", () => {
    it("should delete user and return success", async () => {
      const mockResponse = {
        success: true,
        data: { id: "user1", firstName: "John" },
      };

      mockUserServiceInstance.deleteUser.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/users/user1", {
        method: "DELETE",
      });

      const response = await deleteUser(request, { params: { id: "user1" } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success", true);
    });
  });

  describe("Frontend Compatibility", () => {
    it("should maintain backward compatibility with existing frontend code", async () => {
      // Test that the API response structure matches what the frontend expects
      const mockResponse = {
        success: true,
        data: [
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
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };

      mockUserServiceInstance.getUsers.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/users");
      const response = await GET(request);
      const data = await response.json();

      // Verify all expected fields are present for frontend compatibility
      const user = data.data[0];

      // Basic user fields
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("firstName");
      expect(user).toHaveProperty("lastName");
      expect(user).toHaveProperty("email");
      expect(user).toHaveProperty("phone");
      expect(user).toHaveProperty("role");

      // Membership structure
      expect(user.membership).toHaveProperty("id");
      expect(user.membership).toHaveProperty("organizationId");
      expect(user.membership).toHaveProperty("status");
      expect(user.membership).toHaveProperty("membershipType");
      expect(user.membership).toHaveProperty("monthlyPrice");

      // Plan configuration
      expect(user.membership.planConfig).toHaveProperty("classLimit");
      expect(user.membership.planConfig).toHaveProperty("disciplineAccess");
      expect(user.membership.planConfig).toHaveProperty("canFreeze");

      // Center stats
      expect(user.membership.centerStats).toHaveProperty("currentMonth");
      expect(user.membership.centerStats).toHaveProperty("lifetimeStats");
      expect(user.membership.centerStats.currentMonth).toHaveProperty(
        "classesAttended"
      );
      expect(user.membership.centerStats.currentMonth).toHaveProperty(
        "remainingClasses"
      );

      // Pagination structure
      expect(data.pagination).toHaveProperty("page");
      expect(data.pagination).toHaveProperty("limit");
      expect(data.pagination).toHaveProperty("total");
      expect(data.pagination).toHaveProperty("totalPages");
    });
  });
});
