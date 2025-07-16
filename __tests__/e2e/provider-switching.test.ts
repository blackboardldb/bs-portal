// End-to-End Provider Switching Tests
// Tests complete user workflows with both data providers

import { DataProviderFactory } from "../../lib/data-layer/provider-factory";
import { UserService } from "../../lib/services/user-service";
import { ClassService } from "../../lib/services/class-service";
import { DisciplineService } from "../../lib/services/discipline-service";

describe("End-to-End Provider Switching", () => {
  let userService: UserService;
  let classService: ClassService;
  let disciplineService: DisciplineService;

  beforeEach(() => {
    // Reset factory to ensure clean state
    DataProviderFactory.reset();

    userService = new UserService();
    classService = new ClassService();
    disciplineService = new DisciplineService();
  });

  describe("Complete User Workflow with Mock Provider", () => {
    beforeEach(async () => {
      // Initialize with mock provider
      DataProviderFactory.create({
        type: "mock",
        enableLogging: false,
        enableTransactions: false,
      });
    });

    it("should complete full user lifecycle", async () => {
      // 1. Create a new user
      const createResponse = await userService.createUser({
        firstName: "Test",
        lastName: "User",
        email: "test.user@example.com",
        role: "user",
      });

      expect(createResponse.success).toBe(true);
      expect(createResponse.data).toHaveProperty("id");
      const userId = createResponse.data.id;

      // 2. Fetch the created user
      const fetchResponse = await userService.getUserById(userId);
      expect(fetchResponse.success).toBe(true);
      expect(fetchResponse.data?.firstName).toBe("Test");

      // 3. Update the user
      const updateResponse = await userService.updateUser(userId, {
        firstName: "Updated Test",
      });
      expect(updateResponse.success).toBe(true);
      expect(updateResponse.data.firstName).toBe("Updated Test");

      // 4. Search for the user
      const searchResponse = await userService.searchUsers("Updated Test");
      expect(searchResponse.success).toBe(true);
      expect(searchResponse.data.some((user) => user.id === userId)).toBe(true);

      // 5. Get user statistics
      const statsResponse = await userService.getUserStats();
      expect(statsResponse.success).toBe(true);
      expect(statsResponse.data).toHaveProperty("total");
      expect(statsResponse.data.total).toBeGreaterThan(0);

      // 6. Delete the user
      const deleteResponse = await userService.deleteUser(userId);
      expect(deleteResponse.success).toBe(true);

      // 7. Verify user is deleted
      const verifyResponse = await userService.getUserById(userId);
      expect(verifyResponse.success).toBe(false);
      expect(verifyResponse.data).toBeNull();
    });
  });

  describe("Complete Class Workflow with Mock Provider", () => {
    beforeEach(async () => {
      DataProviderFactory.create({
        type: "mock",
        enableLogging: false,
        enableTransactions: false,
      });
    });

    it("should complete full class lifecycle", async () => {
      // 1. Create a discipline first
      const disciplineResponse = await disciplineService.createDiscipline({
        name: "Test Discipline",
        description: "Test discipline for E2E testing",
        isActive: true,
        color: "#ff0000",
      });

      expect(disciplineResponse.success).toBe(true);
      const disciplineId = disciplineResponse.data.id;

      // 2. Create a class
      const createClassResponse = await classService.createClass({
        organizationId: "org1",
        disciplineId: disciplineId,
        name: "Test Class",
        dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        durationMinutes: 60,
        instructorId: "inst1",
        capacity: 10,
        status: "scheduled",
      });

      expect(createClassResponse.success).toBe(true);
      const classId = createClassResponse.data.id;

      // 3. Fetch the created class
      const fetchClassResponse = await classService.getClassById(classId);
      expect(fetchClassResponse.success).toBe(true);
      expect(fetchClassResponse.data?.name).toBe("Test Class");

      // 4. Get classes by date range
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const dateRangeResponse = await classService.getClassesByDateRange(
        today,
        nextWeek
      );
      expect(dateRangeResponse.success).toBe(true);
      expect(dateRangeResponse.data.some((cls) => cls.id === classId)).toBe(
        true
      );

      // 5. Register a user to the class (create user first)
      const userResponse = await userService.createUser({
        firstName: "Class",
        lastName: "Participant",
        email: "participant@example.com",
        role: "user",
      });
      expect(userResponse.success).toBe(true);
      const userId = userResponse.data.id;

      const registerResponse = await classService.registerUserToClass(
        classId,
        userId
      );
      expect(registerResponse.success).toBe(true);
      expect(registerResponse.data.registeredParticipantsIds).toContain(userId);

      // 6. Cancel the registration
      const cancelResponse = await classService.cancelUserRegistration(
        classId,
        userId
      );
      expect(cancelResponse.success).toBe(true);
      expect(cancelResponse.data.registeredParticipantsIds).not.toContain(
        userId
      );

      // 7. Update the class
      const updateClassResponse = await classService.updateClass(classId, {
        name: "Updated Test Class",
        capacity: 15,
      });
      expect(updateClassResponse.success).toBe(true);
      expect(updateClassResponse.data.name).toBe("Updated Test Class");
      expect(updateClassResponse.data.capacity).toBe(15);

      // 8. Get class statistics
      const classStatsResponse = await classService.getClassStats();
      expect(classStatsResponse.success).toBe(true);
      expect(classStatsResponse.data).toHaveProperty("total");
      expect(classStatsResponse.data.total).toBeGreaterThan(0);

      // 9. Delete the class
      const deleteClassResponse = await classService.deleteClass(classId);
      expect(deleteClassResponse.success).toBe(true);

      // 10. Clean up user and discipline
      await userService.deleteUser(userId);
      await disciplineService.deleteDiscipline(disciplineId);
    });
  });

  describe("Provider Switching Workflow", () => {
    it("should maintain data consistency when switching providers", async () => {
      // Start with mock provider
      DataProviderFactory.create({
        type: "mock",
        enableLogging: false,
        enableTransactions: false,
      });

      // Create some data with mock provider
      const mockUserResponse = await userService.createUser({
        firstName: "Mock",
        lastName: "User",
        email: "mock.user@example.com",
        role: "user",
      });
      expect(mockUserResponse.success).toBe(true);

      const mockUsersResponse = await userService.getUsers({
        page: 1,
        limit: 10,
      });
      expect(mockUsersResponse.success).toBe(true);
      const mockUserCount = mockUsersResponse.data.length;

      // Switch to Prisma provider
      await DataProviderFactory.switchProvider("prisma");
      expect(DataProviderFactory.getCurrentProviderType()).toBe("prisma");

      // Verify provider switch worked
      const prismaUsersResponse = await userService.getUsers({
        page: 1,
        limit: 10,
      });
      expect(prismaUsersResponse.success).toBe(true);

      // Create data with Prisma provider
      const prismaUserResponse = await userService.createUser({
        firstName: "Prisma",
        lastName: "User",
        email: "prisma.user@example.com",
        role: "user",
      });
      expect(prismaUserResponse.success).toBe(true);

      // Switch back to mock provider
      await DataProviderFactory.switchProvider("mock");
      expect(DataProviderFactory.getCurrentProviderType()).toBe("mock");

      // Verify we're back to mock data
      const backToMockResponse = await userService.getUsers({
        page: 1,
        limit: 10,
      });
      expect(backToMockResponse.success).toBe(true);

      // Mock provider should have its own data set
      // (Note: In real implementation, data wouldn't persist between switches for mock provider)
    });

    it("should handle provider health checks", async () => {
      // Test mock provider health
      DataProviderFactory.create({ type: "mock" });
      const mockHealth = await DataProviderFactory.getProviderHealth();
      expect(mockHealth.type).toBe("mock");
      expect(["healthy", "unhealthy", "unknown"]).toContain(mockHealth.status);

      // Test Prisma provider health
      await DataProviderFactory.switchProvider("prisma");
      const prismaHealth = await DataProviderFactory.getProviderHealth();
      expect(prismaHealth.type).toBe("prisma");
      expect(["healthy", "unhealthy", "unknown"]).toContain(
        prismaHealth.status
      );
    });

    it("should maintain service functionality across provider switches", async () => {
      // Test with mock provider
      DataProviderFactory.create({ type: "mock" });

      const mockStatsResponse = await userService.getUserStats();
      expect(mockStatsResponse.success).toBe(true);
      expect(mockStatsResponse.data).toHaveProperty("total");

      // Switch to Prisma and test same functionality
      await DataProviderFactory.switchProvider("prisma");

      const prismaStatsResponse = await userService.getUserStats();
      expect(prismaStatsResponse.success).toBe(true);
      expect(prismaStatsResponse.data).toHaveProperty("total");

      // Both responses should have the same structure
      expect(Object.keys(mockStatsResponse.data)).toEqual(
        Object.keys(prismaStatsResponse.data)
      );
    });
  });

  describe("Error Handling Across Providers", () => {
    it("should handle errors consistently across providers", async () => {
      // Test error handling with mock provider
      DataProviderFactory.create({ type: "mock" });

      const mockErrorResponse = await userService.getUserById("nonexistent-id");
      expect(mockErrorResponse.success).toBe(false);
      expect(mockErrorResponse.error).toHaveProperty("code");
      expect(mockErrorResponse.error).toHaveProperty("message");

      // Switch to Prisma and test same error scenario
      await DataProviderFactory.switchProvider("prisma");

      const prismaErrorResponse = await userService.getUserById(
        "nonexistent-id"
      );
      expect(prismaErrorResponse.success).toBe(false);
      expect(prismaErrorResponse.error).toHaveProperty("code");
      expect(prismaErrorResponse.error).toHaveProperty("message");

      // Error structure should be consistent
      expect(typeof mockErrorResponse.error?.code).toBe("string");
      expect(typeof prismaErrorResponse.error?.code).toBe("string");
    });
  });

  describe("Performance Consistency", () => {
    it("should maintain reasonable performance across providers", async () => {
      const iterations = 10;

      // Test mock provider performance
      DataProviderFactory.create({ type: "mock" });
      const mockStart = Date.now();

      for (let i = 0; i < iterations; i++) {
        await userService.getUsers({ page: 1, limit: 5 });
      }

      const mockTime = Date.now() - mockStart;

      // Test Prisma provider performance
      await DataProviderFactory.switchProvider("prisma");
      const prismaStart = Date.now();

      for (let i = 0; i < iterations; i++) {
        await userService.getUsers({ page: 1, limit: 5 });
      }

      const prismaTime = Date.now() - prismaStart;

      // Both should complete within reasonable time
      expect(mockTime).toBeLessThan(2000); // 2 seconds
      expect(prismaTime).toBeLessThan(5000); // 5 seconds (allowing for potential DB overhead)

      console.log(
        `Performance comparison - Mock: ${mockTime}ms, Prisma: ${prismaTime}ms`
      );
    });
  });

  afterEach(() => {
    // Clean up
    DataProviderFactory.reset();
  });
});
