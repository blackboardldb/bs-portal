// Classes API Compatibility Tests
// Tests to verify class API responses match expected schemas

import { NextRequest } from "next/server";
import { GET, POST } from "../../app/api/classes/route";

// Mock the services
jest.mock("../../lib/services/class-service");
jest.mock("../../lib/errors/handler");

import { ClassService } from "../../lib/services/class-service";
import { ErrorHandler } from "../../lib/errors/handler";

const mockClassService = ClassService as jest.MockedClass<typeof ClassService>;
const mockErrorHandler = ErrorHandler as jest.Mocked<typeof ErrorHandler>;

describe("Classes API Compatibility", () => {
  let mockClassServiceInstance: jest.Mocked<ClassService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClassServiceInstance = {
      getClasses: jest.fn(),
      getClassById: jest.fn(),
      createClass: jest.fn(),
      updateClass: jest.fn(),
      deleteClass: jest.fn(),
      getClassesByDateRange: jest.fn(),
      registerUserToClass: jest.fn(),
      cancelUserRegistration: jest.fn(),
    } as any;

    mockClassService.mockImplementation(() => mockClassServiceInstance);
  });

  describe("GET /api/classes", () => {
    it("should return paginated classes with correct schema", async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: "class1",
            organizationId: "org1",
            disciplineId: "disc1",
            name: "Morning CrossFit",
            dateTime: "2024-01-15T09:00:00Z",
            durationMinutes: 60,
            instructorId: "inst1",
            capacity: 15,
            registeredParticipantsIds: ["user1", "user2"],
            waitlistParticipantsIds: [],
            status: "scheduled",
            notes: "High intensity workout",
            isGenerated: false,
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      };

      mockClassServiceInstance.getClasses.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/classes?page=1&limit=50"
      );
      const response = await GET(request);
      const data = await response.json();

      // Verify response structure
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data).toHaveProperty("pagination");

      // Verify class data structure
      const classSession = data.data[0];
      expect(classSession).toHaveProperty("id");
      expect(classSession).toHaveProperty("organizationId");
      expect(classSession).toHaveProperty("disciplineId");
      expect(classSession).toHaveProperty("name");
      expect(classSession).toHaveProperty("dateTime");
      expect(classSession).toHaveProperty("durationMinutes");
      expect(classSession).toHaveProperty("instructorId");
      expect(classSession).toHaveProperty("capacity");
      expect(classSession).toHaveProperty("registeredParticipantsIds");
      expect(classSession).toHaveProperty("waitlistParticipantsIds");
      expect(classSession).toHaveProperty("status");
      expect(classSession).toHaveProperty("notes");
      expect(classSession).toHaveProperty("isGenerated");

      // Verify data types
      expect(typeof classSession.capacity).toBe("number");
      expect(typeof classSession.durationMinutes).toBe("number");
      expect(Array.isArray(classSession.registeredParticipantsIds)).toBe(true);
      expect(Array.isArray(classSession.waitlistParticipantsIds)).toBe(true);
    });

    it("should handle date range filtering", async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };

      mockClassServiceInstance.getClasses.mockResolvedValue(mockResponse);

      const request = new NextRequest(
        "http://localhost:3000/api/classes?startDate=2024-01-15&endDate=2024-01-16&disciplineId=disc1&instructorId=inst1&status=scheduled"
      );
      await GET(request);

      expect(mockClassServiceInstance.getClasses).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        startDate: "2024-01-15",
        endDate: "2024-01-16",
        disciplineId: "disc1",
        instructorId: "inst1",
        status: "scheduled",
      });
    });

    it("should handle service errors gracefully", async () => {
      const mockError = new Error("Service error");
      mockClassServiceInstance.getClasses.mockRejectedValue(mockError);

      mockErrorHandler.createResponse.mockReturnValue(
        new Response(
          JSON.stringify({
            success: false,
            error: { code: "INTERNAL_ERROR", message: "Service error" },
          }),
          { status: 500 }
        )
      );

      const request = new NextRequest("http://localhost:3000/api/classes");
      const response = await GET(request);

      expect(response.status).toBe(500);
      expect(mockErrorHandler.createResponse).toHaveBeenCalledWith(mockError, {
        operation: "getClasses",
        resource: "classes",
      });
    });
  });

  describe("POST /api/classes", () => {
    it("should create class and return correct schema", async () => {
      const mockClass = {
        id: "class2",
        organizationId: "org1",
        disciplineId: "disc2",
        name: "Evening Yoga",
        dateTime: "2024-01-15T18:00:00Z",
        durationMinutes: 90,
        instructorId: "inst2",
        capacity: 20,
        registeredParticipantsIds: [],
        waitlistParticipantsIds: [],
        status: "scheduled",
        notes: "Relaxing session",
        isGenerated: false,
      };

      const mockResponse = {
        success: true,
        data: mockClass,
      };

      mockClassServiceInstance.createClass.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/classes", {
        method: "POST",
        body: JSON.stringify({
          organizationId: "org1",
          disciplineId: "disc2",
          name: "Evening Yoga",
          dateTime: "2024-01-15T18:00:00Z",
          durationMinutes: 90,
          instructorId: "inst2",
          capacity: 20,
          status: "scheduled",
          notes: "Relaxing session",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("id");
      expect(data.data).toHaveProperty("name", "Evening Yoga");
      expect(data.data).toHaveProperty("capacity", 20);
    });

    it("should handle validation errors", async () => {
      const mockResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Discipline ID is required",
        },
      };

      mockClassServiceInstance.createClass.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/classes", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Class",
          // Missing required fields
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

  describe("Frontend Compatibility", () => {
    it("should maintain backward compatibility with existing class components", async () => {
      // Test that the API response structure matches what the frontend expects
      const mockResponse = {
        success: true,
        data: [
          {
            id: "class1",
            organizationId: "org1",
            disciplineId: "disc1",
            name: "Morning CrossFit",
            dateTime: "2024-01-15T09:00:00Z",
            durationMinutes: 60,
            instructorId: "inst1",
            capacity: 15,
            registeredParticipantsIds: ["user1", "user2"],
            waitlistParticipantsIds: ["user3"],
            status: "scheduled",
            notes: "High intensity workout",
            isGenerated: false,
            // Additional fields that frontend might expect
            discipline: {
              id: "disc1",
              name: "CrossFit",
              color: "#ff6b6b",
            },
            instructor: {
              id: "inst1",
              firstName: "John",
              lastName: "Trainer",
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      };

      mockClassServiceInstance.getClasses.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/classes");
      const response = await GET(request);
      const data = await response.json();

      const classSession = data.data[0];

      // Verify all expected fields are present for frontend compatibility
      expect(classSession).toHaveProperty("id");
      expect(classSession).toHaveProperty("name");
      expect(classSession).toHaveProperty("dateTime");
      expect(classSession).toHaveProperty("capacity");
      expect(classSession).toHaveProperty("registeredParticipantsIds");
      expect(classSession).toHaveProperty("waitlistParticipantsIds");
      expect(classSession).toHaveProperty("status");

      // Verify arrays are properly formatted
      expect(Array.isArray(classSession.registeredParticipantsIds)).toBe(true);
      expect(Array.isArray(classSession.waitlistParticipantsIds)).toBe(true);

      // Verify date format is ISO string
      expect(typeof classSession.dateTime).toBe("string");
      expect(new Date(classSession.dateTime).toISOString()).toBe(
        classSession.dateTime
      );

      // Verify numeric fields
      expect(typeof classSession.capacity).toBe("number");
      expect(typeof classSession.durationMinutes).toBe("number");
    });

    it("should support legacy class filtering parameters", async () => {
      // Test that old query parameters still work
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };

      mockClassServiceInstance.getClasses.mockResolvedValue(mockResponse);

      // Test with legacy parameter names that frontend might still use
      const request = new NextRequest(
        "http://localhost:3000/api/classes?startDate=2024-01-15&endDate=2024-01-16"
      );
      await GET(request);

      expect(mockClassServiceInstance.getClasses).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        startDate: "2024-01-15",
        endDate: "2024-01-16",
        disciplineId: undefined,
        instructorId: undefined,
        status: undefined,
      });
    });
  });

  describe("Error Response Schema", () => {
    it("should return standardized error responses", async () => {
      const mockError = new Error("Test error");
      mockClassServiceInstance.getClasses.mockRejectedValue(mockError);

      const mockErrorResponse = {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Test error",
          timestamp: "2024-01-15T10:00:00Z",
          operation: "getClasses",
          resource: "classes",
        },
      };

      mockErrorHandler.createResponse.mockReturnValue(
        new Response(JSON.stringify(mockErrorResponse), { status: 500 })
      );

      const request = new NextRequest("http://localhost:3000/api/classes");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("error");
      expect(data.error).toHaveProperty("code");
      expect(data.error).toHaveProperty("message");
      expect(data.error).toHaveProperty("operation");
      expect(data.error).toHaveProperty("resource");
    });
  });

  describe("Response Headers", () => {
    it("should include appropriate headers", async () => {
      const mockResponse = {
        success: true,
        data: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
      };

      mockClassServiceInstance.getClasses.mockResolvedValue(mockResponse);

      const request = new NextRequest("http://localhost:3000/api/classes");
      const response = await GET(request);

      // Verify content type
      expect(response.headers.get("content-type")).toContain(
        "application/json"
      );
    });
  });
});
