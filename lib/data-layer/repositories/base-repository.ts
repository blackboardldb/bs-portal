// Base repository implementation with common CRUD operations
// This provides a foundation for all specific repository implementations

import {
  Repository,
  BaseEntity,
  FindManyParams,
  FindUniqueParams,
  CountParams,
  PaginatedResult,
  CreateData,
  UpdateData,
  PaginationMeta,
} from "../types";
import {
  NotFoundError,
  ValidationError,
  InternalError,
} from "../../errors/types";

// Abstract base repository class
export abstract class BaseRepository<T extends BaseEntity>
  implements Repository<T>
{
  protected abstract entityName: string;
  protected abstract data: T[];

  // Find many records with pagination and filtering
  async findMany(params: FindManyParams = {}): Promise<PaginatedResult<T>> {
    try {
      let results = [...this.data];

      // Apply filtering
      if (params.where) {
        results = this.applyFilters(results, params.where);
      }

      // Apply sorting
      if (params.orderBy) {
        results = this.applySorting(results, params.orderBy);
      }

      // Calculate pagination
      const page = params.page || 1;
      const limit = params.limit || params.take || 10;
      const skip = params.skip || (page - 1) * limit;

      const total = results.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedResults = results.slice(skip, skip + limit);

      const pagination: PaginationMeta = {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return {
        items: paginatedResults,
        pagination,
      };
    } catch (error) {
      throw new InternalError(
        `Failed to find ${this.entityName} records`,
        error as Error
      );
    }
  }

  // Find a single record by criteria
  async findUnique(params: FindUniqueParams): Promise<T | null> {
    try {
      const record = this.data.find((item) =>
        this.matchesCriteria(item, params.where)
      );
      return record || null;
    } catch (error) {
      throw new InternalError(
        `Failed to find ${this.entityName}`,
        error as Error
      );
    }
  }

  // Create a new record
  async create(data: CreateData<T>): Promise<T> {
    try {
      const id = this.generateId();
      const timestamp = new Date().toISOString();

      const newRecord = {
        ...data,
        id,
        createdAt: timestamp,
        updatedAt: timestamp,
      } as T;

      // Validate the new record
      this.validateRecord(newRecord);

      // Add to data store
      this.data.push(newRecord);

      return newRecord;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new InternalError(
        `Failed to create ${this.entityName}`,
        error as Error
      );
    }
  }

  // Update an existing record
  async update(id: string, data: UpdateData<T>): Promise<T> {
    try {
      const index = this.data.findIndex((item) => item.id === id);

      if (index === -1) {
        throw new NotFoundError(this.entityName, id);
      }

      const existingRecord = this.data[index];
      const updatedRecord = {
        ...existingRecord,
        ...data,
        id, // Ensure ID doesn't change
        createdAt: existingRecord.createdAt, // Preserve creation date
        updatedAt: new Date().toISOString(),
      } as T;

      // Validate the updated record
      this.validateRecord(updatedRecord);

      // Update in data store
      this.data[index] = updatedRecord;

      return updatedRecord;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new InternalError(
        `Failed to update ${this.entityName}`,
        error as Error
      );
    }
  }

  // Delete a record
  async delete(id: string): Promise<T> {
    try {
      const index = this.data.findIndex((item) => item.id === id);

      if (index === -1) {
        throw new NotFoundError(this.entityName, id);
      }

      const deletedRecord = this.data[index];
      this.data.splice(index, 1);

      return deletedRecord;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalError(
        `Failed to delete ${this.entityName}`,
        error as Error
      );
    }
  }

  // Count records matching criteria
  async count(params: CountParams = {}): Promise<number> {
    try {
      let results = [...this.data];

      if (params.where) {
        results = this.applyFilters(results, params.where);
      }

      return results.length;
    } catch (error) {
      throw new InternalError(
        `Failed to count ${this.entityName} records`,
        error as Error
      );
    }
  }

  // Protected helper methods for subclasses to override

  // Apply filters to results
  protected applyFilters(results: T[], where: Record<string, any>): T[] {
    return results.filter((item) => this.matchesCriteria(item, where));
  }

  // Apply sorting to results
  protected applySorting(
    results: T[],
    orderBy: Record<string, "asc" | "desc">
  ): T[] {
    return results.sort((a, b) => {
      for (const [field, direction] of Object.entries(orderBy)) {
        const aVal = this.getNestedValue(a, field);
        const bVal = this.getNestedValue(b, field);

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;

        if (comparison !== 0) {
          return direction === "asc" ? comparison : -comparison;
        }
      }
      return 0;
    });
  }

  // Check if an item matches the given criteria
  protected matchesCriteria(item: T, criteria: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(criteria)) {
      const itemValue = this.getNestedValue(item, key);

      if (typeof value === "object" && value !== null) {
        // Handle complex queries (contains, in, etc.)
        if (!this.matchesComplexCriteria(itemValue, value)) {
          return false;
        }
      } else {
        // Simple equality check
        if (itemValue !== value) {
          return false;
        }
      }
    }
    return true;
  }

  // Handle complex query criteria
  protected matchesComplexCriteria(itemValue: any, criteria: any): boolean {
    if (criteria.contains && typeof itemValue === "string") {
      const searchTerm =
        criteria.mode === "insensitive"
          ? criteria.contains.toLowerCase()
          : criteria.contains;
      const targetValue =
        criteria.mode === "insensitive" ? itemValue.toLowerCase() : itemValue;
      return targetValue.includes(searchTerm);
    }

    if (criteria.in && Array.isArray(criteria.in)) {
      return criteria.in.includes(itemValue);
    }

    if (criteria.not !== undefined) {
      return itemValue !== criteria.not;
    }

    if (criteria.gte !== undefined) {
      return itemValue >= criteria.gte;
    }

    if (criteria.lte !== undefined) {
      return itemValue <= criteria.lte;
    }

    if (criteria.gt !== undefined) {
      return itemValue > criteria.gt;
    }

    if (criteria.lt !== undefined) {
      return itemValue < criteria.lt;
    }

    return true;
  }

  // Get nested value from object using dot notation
  protected getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Generate unique ID for new records
  protected generateId(): string {
    return `${this.entityName.toLowerCase()}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // Validate record (to be overridden by subclasses)
  protected validateRecord(record: T): void {
    if (!record.id) {
      throw new ValidationError("Record must have an ID");
    }
  }

  // Utility methods for common operations

  // Find by ID (convenience method)
  async findById(id: string): Promise<T | null> {
    return this.findUnique({ where: { id } });
  }

  // Find by field value (convenience method)
  async findByField(field: string, value: any): Promise<T[]> {
    const result = await this.findMany({
      where: { [field]: value },
    });
    return result.items;
  }

  // Check if record exists
  async exists(id: string): Promise<boolean> {
    const record = await this.findById(id);
    return record !== null;
  }

  // Bulk operations

  // Create multiple records
  async createMany(dataArray: CreateData<T>[]): Promise<T[]> {
    const results: T[] = [];

    for (const data of dataArray) {
      const created = await this.create(data);
      results.push(created);
    }

    return results;
  }

  // Update multiple records
  async updateMany(
    criteria: Record<string, any>,
    data: UpdateData<T>
  ): Promise<T[]> {
    const matchingRecords = this.data.filter((item) =>
      this.matchesCriteria(item, criteria)
    );
    const results: T[] = [];

    for (const record of matchingRecords) {
      const updated = await this.update(record.id, data);
      results.push(updated);
    }

    return results;
  }

  // Delete multiple records
  async deleteMany(criteria: Record<string, any>): Promise<T[]> {
    const matchingRecords = this.data.filter((item) =>
      this.matchesCriteria(item, criteria)
    );
    const results: T[] = [];

    for (const record of matchingRecords) {
      const deleted = await this.delete(record.id);
      results.push(deleted);
    }

    return results;
  }

  // Get all data (for testing/debugging)
  protected getAllData(): T[] {
    return [...this.data];
  }

  // Clear all data (for testing)
  protected clearAllData(): void {
    this.data.length = 0;
  }

  // Get data length
  protected getDataLength(): number {
    return this.data.length;
  }
}
