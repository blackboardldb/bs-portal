// Data Layer Performance Tests
// Tests to ensure the new architecture doesn't degrade performance

import {
  DataProviderFactory,
  DataProviderFactoryConfig,
} from "../../lib/data-layer/provider-factory";
import { UserService } from "../../lib/services/user-service";
import { ClassService } from "../../lib/services/class-service";
import { DisciplineService } from "../../lib/services/discipline-service";

describe("Data Layer Performance", () => {
  let userService: UserService;
  let classService: ClassService;
  let disciplineService: DisciplineService;

  beforeAll(async () => {
    // Initialize with mock provider for consistent performance testing
    DataProviderFactory.reset();
    DataProviderFactory.create({
      type: "mock",
      enableLogging: false,
      enableTransactions: false,
      options: { generateClasses: true },
    });

    userService = new UserService();
    classService = new ClassService();
    disciplineService = new DisciplineService();
  });

  describe("Service Layer Performance", () => {
    it("should fetch users within acceptable time", async () => {
      const iterations = 50;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await userService.getUsers({ page: 1, limit: 10 });
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(50); // Average should be under 50ms per request
      console.log(`Average user fetch time: ${avgTime.toFixed(2)}ms`);
    });

    it("should create users within acceptable time", async () => {
      const iterations = 20;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        await userService.createUser({
          firstName: `Test${i}`,
          lastName: "User",
          email: `test${i}@example.com`,
          role: "user",
        });
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(100); // Average should be under 100ms per creation
      console.log(`Average user creation time: ${avgTime.toFixed(2)}ms`);
    });

    it("should search users efficiently", async () => {
      const iterations = 30;
      const searchTerms = ["test", "user", "example", "john", "jane"];
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        const term = searchTerms[i % searchTerms.length];
        await userService.searchUsers(term);
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(75); // Average should be under 75ms per search
      console.log(`Average user search time: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe("Repository Layer Performance", () => {
    it("should handle large result sets efficiently", async () => {
      const start = Date.now();

      // Fetch a large number of users
      const result = await userService.getUsers({ page: 1, limit: 100 });

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(200); // Should complete within 200ms
      expect(result.success).toBe(true);
      console.log(`Large result set fetch time: ${duration}ms`);
    });

    it("should handle concurrent requests efficiently", async () => {
      const concurrentRequests = 10;
      const start = Date.now();

      // Create multiple concurrent requests
      const promises = Array.from({ length: concurrentRequests }, (_, i) =>
        userService.getUsers({ page: i + 1, limit: 5 })
      );

      const results = await Promise.all(promises);

      const duration = Date.now() - start;
      const avgTime = duration / concurrentRequests;

      expect(duration).toBeLessThan(500); // All requests should complete within 500ms
      expect(results.every((r) => r.success)).toBe(true);
      console.log(`Concurrent requests average time: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe("Class Service Performance", () => {
    it("should fetch classes by date range efficiently", async () => {
      const iterations = 25;
      const start = Date.now();

      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      for (let i = 0; i < iterations; i++) {
        await classService.getClassesByDateRange(today, nextWeek);
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(60); // Average should be under 60ms per request
      console.log(
        `Average class date range fetch time: ${avgTime.toFixed(2)}ms`
      );
    });

    it("should handle class registration operations efficiently", async () => {
      const iterations = 15;
      const start = Date.now();

      // Create a test class first
      const testClass = await classService.createClass({
        organizationId: "org1",
        disciplineId: "disc1",
        name: "Performance Test Class",
        dateTime: new Date().toISOString(),
        durationMinutes: 60,
        instructorId: "inst1",
        capacity: 20,
        status: "scheduled",
      });

      if (testClass.success) {
        for (let i = 0; i < iterations; i++) {
          await classService.registerUserToClass(testClass.data.id, `user${i}`);
        }
      }

      const duration = Date.now() - start;
      const avgTime = duration / iterations;

      expect(avgTime).toBeLessThan(80); // Average should be under 80ms per registration
      console.log(`Average class registration time: ${avgTime.toFixed(2)}ms`);
    });
  });

  describe("Caching Performance", () => {
    it("should benefit from caching for repeated requests", async () => {
      // First request (cache miss)
      const start1 = Date.now();
      await disciplineService.getActiveDisciplines();
      const firstRequestTime = Date.now() - start1;

      // Second request (cache hit)
      const start2 = Date.now();
      await disciplineService.getActiveDisciplines();
      const secondRequestTime = Date.now() - start2;

      // Third request (cache hit)
      const start3 = Date.now();
      await disciplineService.getActiveDisciplines();
      const thirdRequestTime = Date.now() - start3;

      // Cached requests should be significantly faster
      expect(secondRequestTime).toBeLessThan(firstRequestTime);
      expect(thirdRequestTime).toBeLessThan(firstRequestTime);
      expect(secondRequestTime).toBeLessThan(20); // Cached request should be very fast

      console.log(
        `First request: ${firstRequestTime}ms, Cached requests: ${secondRequestTime}ms, ${thirdRequestTime}ms`
      );
    });
  });

  describe("Memory Usage", () => {
    it("should not have significant memory leaks", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        await userService.getUsers({ page: 1, limit: 10 });
        await classService.getClasses({ page: 1, limit: 10 });
        await disciplineService.getDisciplines({ page: 1, limit: 10 });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreaseMB = memoryIncrease / 1024 / 1024;

      // Memory increase should be reasonable (less than 50MB for 300 operations)
      expect(memoryIncreaseMB).toBeLessThan(50);
      console.log(`Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
    });
  });

  describe("Provider Switching Performance", () => {
    it("should switch providers quickly", async () => {
      const start = Date.now();

      // Switch to prisma provider
      await DataProviderFactory.switchProvider("prisma");
      const switchToPrismaTime = Date.now() - start;

      const start2 = Date.now();
      // Switch back to mock provider
      await DataProviderFactory.switchProvider("mock");
      const switchToMockTime = Date.now() - start2;

      // Provider switches should be fast
      expect(switchToPrismaTime).toBeLessThan(1000); // Under 1 second
      expect(switchToMockTime).toBeLessThan(1000); // Under 1 second

      console.log(
        `Provider switch times - To Prisma: ${switchToPrismaTime}ms, To Mock: ${switchToMockTime}ms`
      );
    });
  });

  describe("Stress Testing", () => {
    it("should handle high load without degradation", async () => {
      const highLoadIterations = 100;
      const concurrency = 5;
      const batchSize = highLoadIterations / concurrency;

      const start = Date.now();

      // Create concurrent batches of requests
      const batches = Array.from({ length: concurrency }, (_, batchIndex) =>
        Promise.all(
          Array.from({ length: batchSize }, (_, i) =>
            userService.getUsers({
              page: ((batchIndex * batchSize + i) % 10) + 1,
              limit: 5,
            })
          )
        )
      );

      const results = await Promise.all(batches);
      const duration = Date.now() - start;

      // All requests should succeed
      const allResults = results.flat();
      expect(allResults.every((r) => r.success)).toBe(true);
      expect(allResults).toHaveLength(highLoadIterations);

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // Under 5 seconds for 100 requests

      const avgTime = duration / highLoadIterations;
      console.log(
        `Stress test - Total: ${duration}ms, Average: ${avgTime.toFixed(
          2
        )}ms per request`
      );
    });
  });

  afterAll(async () => {
    // Cleanup
    DataProviderFactory.reset();
  });
});
