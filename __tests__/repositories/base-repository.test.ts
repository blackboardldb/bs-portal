// Base Repository Tests
// Tests for the base repository functionality that all repositories inherit

import { BaseRepository } from "../../lib/data-layer/repositories/base-repository";
import { MockDataProvider } from "../../lib/data-layer/providers/mock-provider";
import { DataProviderFactoryConfig } from "../../lib/data-layer/provider-factory";

// Mock entity for testing
interface TestEntity {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Test repository implementation
class TestRepository extends BaseRepository<TestEntity> {
  protected entityName = "testEntity" as const;

  // Mock data for testing
  private mockData: TestEntity[] = [
    {
      id: "test1",
      name: "Test Entity 1",
      isActive: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    },
    {
      id: "test2",
      name: "Test Entity 2",
      isActive: false,
      createdAt: "2024-01-02T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    },
  ];

  // Override methods for testing
  async findMany(
    params?: any
  ): Promise<{ items: TestEntity[]; total: number }> {
    let items = [...this.mockData];

    // Apply filters
    if (params?.where) {
      if (params.where.isActive !== undefined) {
        items = items.filter((item) => item.isActive === params.where.isActive);
      }
      if (params.where.name?.contains) {
        items = items.filter((item) =>
          item.name
            .toLowerCase()
            .includes(params.where.name.contains.toLowerCase())
        );
      }
    }

    // Apply pagination
    const total = items.length;
    if (params?.skip) {
      items = items.slice(params.skip);
    }
    if (params?.take) {
      items = items.slice(0, params.take);
    }

    return { items, total };
  }

  async findUnique(params: {
    where: { id: string };
  }): Promise<TestEntity | null> {
    return this.mockData.find((item) => item.id === params.where.id) || null;
  }

  async create(data: Partial<TestEntity>): Promise<TestEntity> {
    const newEntity: TestEntity = {
      id: `test${Date.now()}`,
      name: data.name || "New Entity",
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockData.push(newEntity);
    return newEntity;
  }

  async update(params: {
    where: { id: string };
    data: Partial<TestEntity>;
  }): Promise<TestEntity> {
    const index = this.mockData.findIndex(
      (item) => item.id === params.where.id
    );
    if (index === -1) {
      throw new Error("Entity not found");
    }

    this.mockData[index] = {
      ...this.mockData[index],
      ...params.data,
      updatedAt: new Date().toISOString(),
    };

    return this.mockData[index];
  }

  async delete(params: { where: { id: string } }): Promise<TestEntity> {
    const index = this.mockData.findIndex(
      (item) => item.id === params.where.id
    );
    if (index === -1) {
      throw new Error("Entity not found");
    }

    const deleted = this.mockData[index];
    this.mockData.splice(index, 1);
    return deleted;
  }

  async count(params?: any): Promise<number> {
    let items = [...this.mockData];

    if (params?.where) {
      if (params.where.isActive !== undefined) {
        items = items.filter((item) => item.isActive === params.where.isActive);
      }
    }

    return items.length;
  }
}

describe("BaseRepository", () => {
  let repository: TestRepository;
  let mockProvider: MockDataProvider;

  beforeEach(() => {
    const config: DataProviderFactoryConfig = {
      type: "mock",
      enableLogging: false,
      enableTransactions: false,
    };

    mockProvider = new MockDataProvider(config);
    repository = new TestRepository();
  });

  describe("findMany", () => {
    it("should return all entities when no filters applied", async () => {
      const result = await repository.findMany();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.items[0].name).toBe("Test Entity 1");
    });

    it("should filter entities by isActive", async () => {
      const result = await repository.findMany({
        where: { isActive: true },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].isActive).toBe(true);
    });

    it("should apply pagination correctly", async () => {
      const result = await repository.findMany({
        skip: 1,
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Test Entity 2");
    });

    it("should filter by name contains", async () => {
      const result = await repository.findMany({
        where: {
          name: { contains: "Entity 1" },
        },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe("Test Entity 1");
    });
  });

  describe("findUnique", () => {
    it("should return entity when found", async () => {
      const result = await repository.findUnique({
        where: { id: "test1" },
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe("Test Entity 1");
    });

    it("should return null when entity not found", async () => {
      const result = await repository.findUnique({
        where: { id: "nonexistent" },
      });

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create new entity with provided data", async () => {
      const newEntity = await repository.create({
        name: "New Test Entity",
        isActive: false,
      });

      expect(newEntity.name).toBe("New Test Entity");
      expect(newEntity.isActive).toBe(false);
      expect(newEntity.id).toBeDefined();
      expect(newEntity.createdAt).toBeDefined();
      expect(newEntity.updatedAt).toBeDefined();
    });

    it("should use default values when data not provided", async () => {
      const newEntity = await repository.create({});

      expect(newEntity.name).toBe("New Entity");
      expect(newEntity.isActive).toBe(true);
    });
  });

  describe("update", () => {
    it("should update existing entity", async () => {
      const updated = await repository.update({
        where: { id: "test1" },
        data: { name: "Updated Entity" },
      });

      expect(updated.name).toBe("Updated Entity");
      expect(updated.id).toBe("test1");
      expect(updated.updatedAt).not.toBe("2024-01-01T00:00:00Z");
    });

    it("should throw error when entity not found", async () => {
      await expect(
        repository.update({
          where: { id: "nonexistent" },
          data: { name: "Updated" },
        })
      ).rejects.toThrow("Entity not found");
    });
  });

  describe("delete", () => {
    it("should delete existing entity", async () => {
      const deleted = await repository.delete({
        where: { id: "test1" },
      });

      expect(deleted.name).toBe("Test Entity 1");

      // Verify entity is deleted
      const result = await repository.findUnique({
        where: { id: "test1" },
      });
      expect(result).toBeNull();
    });

    it("should throw error when entity not found", async () => {
      await expect(
        repository.delete({
          where: { id: "nonexistent" },
        })
      ).rejects.toThrow("Entity not found");
    });
  });

  describe("count", () => {
    it("should return total count of entities", async () => {
      const count = await repository.count();
      expect(count).toBe(2);
    });

    it("should return filtered count", async () => {
      const count = await repository.count({
        where: { isActive: true },
      });
      expect(count).toBe(1);
    });
  });
});
