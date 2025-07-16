// Class Repository Tests
// Tests for class repository functionality including date filtering and registration management

import { MockClassRepository } from "../../lib/data-layer/repositories/class-repository";
import { ClassSession } from "../../lib/types";
import { DataProviderFactoryConfig } from "../../lib/data-layer/provider-factory";

describe("ClassRepository", () => {
  let repository: MockClassRepository;
  let mockClasses: ClassSession[];

  beforeEach(() => {
    const config: DataProviderFactoryConfig = {
      type: "mock",
      enableLogging: false,
      enableTransactions: false,
    };

    // Create mock classes for testing
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    mockClasses = [
      {
        id: "class1",
        organizationId: "org1",
        disciplineId: "disc1",
        name: "Morning CrossFit",
        dateTime: today.toISOString(),
        durationMinutes: 60,
        instructorId: "inst1",
        capacity: 15,
        registeredParticipantsIds: ["user1", "user2"],
        waitlistParticipantsIds: [],
        status: "scheduled",
        notes: "High intensity workout",
        isGenerated: false,
      },
      {
        id: "class2",
        organizationId: "org1",
        disciplineId: "disc2",
        name: "Evening Yoga",
        dateTime: tomorrow.toISOString(),
        durationMinutes: 90,
        instructorId: "inst2",
        capacity: 20,
        registeredParticipantsIds: ["user3"],
        waitlistParticipantsIds: ["user4"],
        status: "scheduled",
        notes: "Relaxing session",
        isGenerated: false,
      },
      {
        id: "class3",
        organizationId: "org1",
        disciplineId: "disc1",
        name: "Past CrossFit",
        dateTime: yesterday.toISOString(),
        durationMinutes: 60,
        instructorId: "inst1",
        capacity: 15,
        registeredParticipantsIds: ["user1"],
        waitlistParticipantsIds: [],
        status: "completed",
        notes: "Completed session",
        isGenerated: false,
      },
    ];

    repository = new MockClassRepository(config);
    // Initialize repository with mock data
    (repository as any).classes = [...mockClasses];
  });

  describe("findMany", () => {
    it("should return all classes when no filters applied", async () => {
      const result = await repository.findMany();

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it("should filter classes by discipline", async () => {
      const result = await repository.findByDiscipline("disc1");

      expect(result).toHaveLength(2);
      expect(result.every((cls) => cls.disciplineId === "disc1")).toBe(true);
    });

    it("should filter classes by instructor", async () => {
      const result = await repository.findByInstructor("inst2");

      expect(result).toHaveLength(1);
      expect(result[0].instructorId).toBe("inst2");
      expect(result[0].name).toBe("Evening Yoga");
    });

    it("should filter classes by status", async () => {
      const result = await repository.findByStatus("scheduled");

      expect(result).toHaveLength(2);
      expect(result.every((cls) => cls.status === "scheduled")).toBe(true);
    });

    it("should apply pagination correctly", async () => {
      const result = await repository.findMany({
        skip: 1,
        take: 1,
      });

      expect(result.items).toHaveLength(1);
    });
  });

  describe("date filtering", () => {
    it("should find classes by date range", async () => {
      const today = new Date();
      const startDate = today.toISOString().split("T")[0];
      const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const result = await repository.findByDateRange(startDate, endDate);

      expect(result).toHaveLength(2); // Today and tomorrow
      expect(result.some((cls) => cls.name === "Morning CrossFit")).toBe(true);
      expect(result.some((cls) => cls.name === "Evening Yoga")).toBe(true);
    });

    it("should find classes for specific date", async () => {
      const today = new Date().toISOString().split("T")[0];

      const result = await repository.findByDateRange(today, today);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Morning CrossFit");
    });

    it("should return empty array for date with no classes", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split("T")[0];

      const result = await repository.findByDateRange(
        futureDateStr,
        futureDateStr
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("findUnique", () => {
    it("should find class by id", async () => {
      const cls = await repository.findUnique({
        where: { id: "class1" },
      });

      expect(cls).not.toBeNull();
      expect(cls?.name).toBe("Morning CrossFit");
    });

    it("should return null for non-existent class", async () => {
      const cls = await repository.findUnique({
        where: { id: "nonexistent" },
      });

      expect(cls).toBeNull();
    });
  });

  describe("create", () => {
    it("should create new class with valid data", async () => {
      const classData = {
        organizationId: "org1",
        disciplineId: "disc3",
        name: "New Pilates Class",
        dateTime: new Date().toISOString(),
        durationMinutes: 45,
        instructorId: "inst3",
        capacity: 12,
        registeredParticipantsIds: [],
        waitlistParticipantsIds: [],
        status: "scheduled" as const,
        notes: "Beginner friendly",
        isGenerated: false,
      };

      const newClass = await repository.create({
        data: classData,
      });

      expect(newClass.name).toBe("New Pilates Class");
      expect(newClass.disciplineId).toBe("disc3");
      expect(newClass.capacity).toBe(12);
      expect(newClass.id).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update class data", async () => {
      const updated = await repository.update({
        where: { id: "class1" },
        data: {
          name: "Updated CrossFit",
          capacity: 20,
        },
      });

      expect(updated.name).toBe("Updated CrossFit");
      expect(updated.capacity).toBe(20);
      expect(updated.disciplineId).toBe("disc1"); // Unchanged
    });

    it("should throw error for non-existent class", async () => {
      await expect(
        repository.update({
          where: { id: "nonexistent" },
          data: { name: "Updated" },
        })
      ).rejects.toThrow();
    });
  });

  describe("registration management", () => {
    it("should register user to class", async () => {
      const updated = await repository.registerUserToClass("class2", "user5");

      expect(updated.registeredParticipantsIds).toContain("user5");
      expect(updated.registeredParticipantsIds).toHaveLength(2); // user3 + user5
    });

    it("should add user to waitlist when class is full", async () => {
      // Fill up the class first
      const classData = mockClasses[0];
      classData.registeredParticipantsIds = Array.from(
        { length: 15 },
        (_, i) => `user${i + 10}`
      );

      const updated = await repository.registerUserToClass("class1", "user99");

      expect(updated.waitlistParticipantsIds).toContain("user99");
      expect(updated.registeredParticipantsIds).not.toContain("user99");
    });

    it("should cancel user registration", async () => {
      const updated = await repository.cancelUserRegistration(
        "class1",
        "user1"
      );

      expect(updated.registeredParticipantsIds).not.toContain("user1");
      expect(updated.registeredParticipantsIds).toHaveLength(1); // Only user2 remains
    });

    it("should remove user from waitlist", async () => {
      const updated = await repository.cancelUserRegistration(
        "class2",
        "user4"
      );

      expect(updated.waitlistParticipantsIds).not.toContain("user4");
      expect(updated.waitlistParticipantsIds).toHaveLength(0);
    });

    it("should promote waitlist user when spot becomes available", async () => {
      // First, cancel a registration to create a spot
      await repository.cancelUserRegistration("class2", "user3");

      // The waitlist user should be automatically promoted
      const cls = await repository.findUnique({ where: { id: "class2" } });

      expect(cls?.registeredParticipantsIds).toContain("user4");
      expect(cls?.waitlistParticipantsIds).not.toContain("user4");
    });
  });

  describe("class status management", () => {
    it("should cancel class", async () => {
      const updated = await repository.cancelClass(
        "class1",
        "Instructor unavailable"
      );

      expect(updated.status).toBe("cancelled");
      expect(updated.notes).toContain("Instructor unavailable");
    });

    it("should complete class", async () => {
      const updated = await repository.completeClass("class1");

      expect(updated.status).toBe("completed");
    });
  });

  describe("getClassStats", () => {
    it("should return correct class statistics", async () => {
      const stats = await repository.getClassStats();

      expect(stats.total).toBe(3);
      expect(stats.scheduled).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.cancelled).toBe(0);
      expect(stats.inProgress).toBe(0);
    });
  });

  describe("count", () => {
    it("should return total class count", async () => {
      const count = await repository.count();
      expect(count).toBe(3);
    });

    it("should return filtered count", async () => {
      const count = await repository.count({
        where: { status: "scheduled" },
      });
      expect(count).toBe(2);
    });
  });

  describe("business logic", () => {
    it("should check if user can register for class", async () => {
      // User not already registered
      const canRegister1 = await repository.canUserRegister("class1", "user5");
      expect(canRegister1).toBe(true);

      // User already registered
      const canRegister2 = await repository.canUserRegister("class1", "user1");
      expect(canRegister2).toBe(false);
    });

    it("should get available spots in class", async () => {
      const availableSpots = await repository.getAvailableSpots("class1");
      expect(availableSpots).toBe(13); // 15 capacity - 2 registered
    });

    it("should check if class is full", async () => {
      const isFull1 = await repository.isClassFull("class1");
      expect(isFull1).toBe(false);

      // Fill up the class
      const classData = mockClasses[0];
      classData.registeredParticipantsIds = Array.from(
        { length: 15 },
        (_, i) => `user${i + 10}`
      );

      const isFull2 = await repository.isClassFull("class1");
      expect(isFull2).toBe(true);
    });
  });
});
