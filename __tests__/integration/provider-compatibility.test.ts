// Provider Compatibility Tests
// Integration tests to verify both Mock and Prisma providers return compatible data

import {
  DataProviderFactory,
  DataProviderFactoryConfig,
} from "../../lib/data-layer/provider-factory";
import { MockDataProvider } from "../../lib/data-layer/providers/mock-provider";
import { PrismaDataProvider } from "../../lib/data-layer/providers/prisma-provider";
import {
  FitCenterUserProfile,
  ClassSession,
  Discipline,
  Instructor,
  MembershipPlan,
} from "../../lib/types";

describe("Provider Compatibility", () => {
  let mockProvider: MockDataProvider;
  let prismaProvider: PrismaDataProvider;

  beforeAll(async () => {
    // Initialize both providers
    const mockConfig: DataProviderFactoryConfig = {
      type: "mock",
      enableLogging: false,
      enableTransactions: false,
      options: { generateClasses: true },
    };

    const prismaConfig: DataProviderFactoryConfig = {
      type: "prisma",
      connectionString: process.env.DATABASE_URL || "mock://test",
      enableLogging: false,
      enableTransactions: true,
    };

    mockProvider = new MockDataProvider(mockConfig);

    // For testing, we'll use a mock Prisma provider that mimics the interface
    // In real tests, this would connect to a test database
    prismaProvider = new PrismaDataProvider(prismaConfig);
  });

  describe("User Repository Compatibility", () => {
    it("should return users with same structure from both providers", async () => {
      // Get users from both providers
      const mockUsers = await mockProvider.users.findMany({ take: 1 });
      const prismaUsers = await prismaProvider.users.findMany({ take: 1 });

      // Both should return the same structure
      expect(mockUsers.items).toHaveLength(1);
      expect(prismaUsers.items).toHaveLength(1);

      const mockUser = mockUsers.items[0];
      const prismaUser = prismaUsers.items[0];

      // Verify structure compatibility
      expect(mockUser).toHaveProperty("id");
      expect(mockUser).toHaveProperty("firstName");
      expect(mockUser).toHaveProperty("lastName");
      expect(mockUser).toHaveProperty("email");
      expect(mockUser).toHaveProperty("membership");

      expect(prismaUser).toHaveProperty("id");
      expect(prismaUser).toHaveProperty("firstName");
      expect(prismaUser).toHaveProperty("lastName");
      expect(prismaUser).toHaveProperty("email");
      expect(prismaUser).toHaveProperty("membership");

      // Verify membership structure
      if (mockUser.membership && prismaUser.membership) {
        expect(mockUser.membership).toHaveProperty("status");
        expect(mockUser.membership).toHaveProperty("membershipType");
        expect(mockUser.membership).toHaveProperty("monthlyPrice");

        expect(prismaUser.membership).toHaveProperty("status");
        expect(prismaUser.membership).toHaveProperty("membershipType");
        expect(prismaUser.membership).toHaveProperty("monthlyPrice");
      }
    });

    it("should support same query operations on both providers", async () => {
      // Test pagination
      const mockPaginated = await mockProvider.users.findMany({
        take: 2,
        skip: 0,
      });
      const prismaPaginated = await prismaProvider.users.findMany({
        take: 2,
        skip: 0,
      });

      expect(mockPaginated).toHaveProperty("items");
      expect(mockPaginated).toHaveProperty("total");
      expect(prismaPaginated).toHaveProperty("items");
      expect(prismaPaginated).toHaveProperty("total");

      // Test filtering by membership status
      const mockActiveUsers = await mockProvider.users.findByMembershipStatus(
        "active"
      );
      const prismaActiveUsers =
        await prismaProvider.users.findByMembershipStatus("active");

      expect(Array.isArray(mockActiveUsers)).toBe(true);
      expect(Array.isArray(prismaActiveUsers)).toBe(true);

      // Test search functionality
      const mockSearchResults = await mockProvider.users.searchUsers("test");
      const prismaSearchResults = await prismaProvider.users.searchUsers(
        "test"
      );

      expect(Array.isArray(mockSearchResults)).toBe(true);
      expect(Array.isArray(prismaSearchResults)).toBe(true);
    });

    it("should return same user statistics structure", async () => {
      const mockStats = await mockProvider.users.getUserStats();
      const prismaStats = await prismaProvider.users.getUserStats();

      // Both should have the same statistics structure
      expect(mockStats).toHaveProperty("total");
      expect(mockStats).toHaveProperty("active");
      expect(mockStats).toHaveProperty("expired");
      expect(mockStats).toHaveProperty("pending");
      expect(mockStats).toHaveProperty("inactive");

      expect(prismaStats).toHaveProperty("total");
      expect(prismaStats).toHaveProperty("active");
      expect(prismaStats).toHaveProperty("expired");
      expect(prismaStats).toHaveProperty("pending");
      expect(prismaStats).toHaveProperty("inactive");

      // Values should be numbers
      expect(typeof mockStats.total).toBe("number");
      expect(typeof prismaStats.total).toBe("number");
    });
  });

  describe("Class Repository Compatibility", () => {
    it("should return classes with same structure from both providers", async () => {
      const mockClasses = await mockProvider.classes.findMany({ take: 1 });
      const prismaClasses = await prismaProvider.classes.findMany({ take: 1 });

      expect(mockClasses.items).toHaveLength(1);
      expect(prismaClasses.items).toHaveLength(1);

      const mockClass = mockClasses.items[0];
      const prismaClass = prismaClasses.items[0];

      // Verify structure compatibility
      expect(mockClass).toHaveProperty("id");
      expect(mockClass).toHaveProperty("name");
      expect(mockClass).toHaveProperty("dateTime");
      expect(mockClass).toHaveProperty("disciplineId");
      expect(mockClass).toHaveProperty("instructorId");
      expect(mockClass).toHaveProperty("capacity");
      expect(mockClass).toHaveProperty("registeredParticipantsIds");
      expect(mockClass).toHaveProperty("status");

      expect(prismaClass).toHaveProperty("id");
      expect(prismaClass).toHaveProperty("name");
      expect(prismaClass).toHaveProperty("dateTime");
      expect(prismaClass).toHaveProperty("disciplineId");
      expect(prismaClass).toHaveProperty("instructorId");
      expect(prismaClass).toHaveProperty("capacity");
      expect(prismaClass).toHaveProperty("registeredParticipantsIds");
      expect(prismaClass).toHaveProperty("status");
    });

    it("should support same date filtering operations", async () => {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const mockDateFiltered = await mockProvider.classes.findByDateRange(
        today,
        tomorrow
      );
      const prismaDateFiltered = await prismaProvider.classes.findByDateRange(
        today,
        tomorrow
      );

      expect(Array.isArray(mockDateFiltered)).toBe(true);
      expect(Array.isArray(prismaDateFiltered)).toBe(true);

      // Both should filter by the same date range
      mockDateFiltered.forEach((cls) => {
        const classDate = new Date(cls.dateTime).toISOString().split("T")[0];
        expect(classDate >= today && classDate <= tomorrow).toBe(true);
      });

      prismaDateFiltered.forEach((cls) => {
        const classDate = new Date(cls.dateTime).toISOString().split("T")[0];
        expect(classDate >= today && classDate <= tomorrow).toBe(true);
      });
    });

    it("should return same class statistics structure", async () => {
      const mockStats = await mockProvider.classes.getClassStats();
      const prismaStats = await prismaProvider.classes.getClassStats();

      expect(mockStats).toHaveProperty("total");
      expect(mockStats).toHaveProperty("scheduled");
      expect(mockStats).toHaveProperty("completed");
      expect(mockStats).toHaveProperty("cancelled");
      expect(mockStats).toHaveProperty("inProgress");

      expect(prismaStats).toHaveProperty("total");
      expect(prismaStats).toHaveProperty("scheduled");
      expect(prismaStats).toHaveProperty("completed");
      expect(prismaStats).toHaveProperty("cancelled");
      expect(prismaStats).toHaveProperty("inProgress");
    });
  });

  describe("Discipline Repository Compatibility", () => {
    it("should return disciplines with same structure", async () => {
      const mockDisciplines = await mockProvider.disciplines.findMany({
        take: 1,
      });
      const prismaDisciplines = await prismaProvider.disciplines.findMany({
        take: 1,
      });

      if (
        mockDisciplines.items.length > 0 &&
        prismaDisciplines.items.length > 0
      ) {
        const mockDiscipline = mockDisciplines.items[0];
        const prismaDiscipline = prismaDisciplines.items[0];

        expect(mockDiscipline).toHaveProperty("id");
        expect(mockDiscipline).toHaveProperty("name");
        expect(mockDiscipline).toHaveProperty("description");
        expect(mockDiscipline).toHaveProperty("isActive");

        expect(prismaDiscipline).toHaveProperty("id");
        expect(prismaDiscipline).toHaveProperty("name");
        expect(prismaDiscipline).toHaveProperty("description");
        expect(prismaDiscipline).toHaveProperty("isActive");
      }
    });

    it("should support same filtering operations", async () => {
      const mockActive = await mockProvider.disciplines.findByStatus(true);
      const prismaActive = await prismaProvider.disciplines.findByStatus(true);

      expect(Array.isArray(mockActive)).toBe(true);
      expect(Array.isArray(prismaActive)).toBe(true);

      // All returned disciplines should be active
      mockActive.forEach((discipline) => {
        expect(discipline.isActive).toBe(true);
      });

      prismaActive.forEach((discipline) => {
        expect(discipline.isActive).toBe(true);
      });
    });
  });

  describe("Provider Factory Integration", () => {
    it("should create providers through factory with same interface", async () => {
      // Reset factory to ensure clean state
      DataProviderFactory.reset();

      // Create mock provider through factory
      const mockFactoryProvider = DataProviderFactory.create({
        type: "mock",
        enableLogging: false,
        enableTransactions: false,
      });

      // Create prisma provider through factory
      const prismaFactoryProvider = DataProviderFactory.create({
        type: "prisma",
        connectionString: "mock://test",
        enableLogging: false,
        enableTransactions: true,
      });

      // Both should have the same interface
      expect(mockFactoryProvider).toHaveProperty("users");
      expect(mockFactoryProvider).toHaveProperty("classes");
      expect(mockFactoryProvider).toHaveProperty("disciplines");
      expect(mockFactoryProvider).toHaveProperty("instructors");
      expect(mockFactoryProvider).toHaveProperty("plans");

      expect(prismaFactoryProvider).toHaveProperty("users");
      expect(prismaFactoryProvider).toHaveProperty("classes");
      expect(prismaFactoryProvider).toHaveProperty("disciplines");
      expect(prismaFactoryProvider).toHaveProperty("instructors");
      expect(prismaFactoryProvider).toHaveProperty("plans");
    });

    it("should switch between providers seamlessly", async () => {
      // Start with mock provider
      DataProviderFactory.reset();
      const provider1 = DataProviderFactory.create({ type: "mock" });
      expect(DataProviderFactory.getCurrentProviderType()).toBe("mock");

      // Switch to prisma provider
      const provider2 = await DataProviderFactory.switchProvider("prisma");
      expect(DataProviderFactory.getCurrentProviderType()).toBe("prisma");

      // Both providers should have the same interface
      expect(provider1.users.findMany).toBeDefined();
      expect(provider2.users.findMany).toBeDefined();
    });
  });

  describe("Performance Comparison", () => {
    it("should have reasonable performance for basic operations", async () => {
      const iterations = 10;

      // Test mock provider performance
      const mockStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        await mockProvider.users.findMany({ take: 10 });
      }
      const mockTime = Date.now() - mockStart;

      // Test prisma provider performance
      const prismaStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        await prismaProvider.users.findMany({ take: 10 });
      }
      const prismaTime = Date.now() - prismaStart;

      // Both should complete within reasonable time (adjust threshold as needed)
      expect(mockTime).toBeLessThan(5000); // 5 seconds
      expect(prismaTime).toBeLessThan(10000); // 10 seconds (allowing for potential DB overhead)

      console.log(
        `Mock provider: ${mockTime}ms, Prisma provider: ${prismaTime}ms`
      );
    });
  });

  afterAll(async () => {
    // Cleanup providers if they have cleanup methods
    if (
      "cleanup" in mockProvider &&
      typeof mockProvider.cleanup === "function"
    ) {
      await mockProvider.cleanup();
    }
    if (
      "cleanup" in prismaProvider &&
      typeof prismaProvider.cleanup === "function"
    ) {
      await prismaProvider.cleanup();
    }
  });
});
