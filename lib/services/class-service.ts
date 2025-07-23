// Enhanced ClassService using new data layer architecture
// Maintains existing API while using new provider-based architecture

import { BaseService } from "./base-service";
import { ClassSession } from "../types";
import { ClassRepository } from "../data-layer/types";
import { ApiResponse, PaginatedApiResponse } from "../api/types";
import { generatedSchemas, validateWithSchema } from "../types/generator";
import { ValidationError } from "../errors/types";

export class ClassService extends BaseService<ClassSession> {
  protected repositoryName = "classes" as const;

  // Get the typed class repository
  private get classRepository(): ClassRepository {
    return this.repository as ClassRepository;
  }

  // Enhanced methods using new architecture

  // Get classes with pagination and filtering
  async getClasses(params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    disciplineId?: string;
    instructorId?: string;
    status?: string;
  }): Promise<PaginatedApiResponse<ClassSession>> {
    const findParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 50,
    };

    // Build where clause
    const where: any = {};

    if (params?.disciplineId) {
      where.disciplineId = params.disciplineId;
    }

    if (params?.instructorId) {
      where.instructorId = params.instructorId;
    }

    if (params?.status) {
      where.status = params.status;
    }

    // Date range filtering
    if (params?.startDate || params?.endDate) {
      where.dateTime = {};
      if (params.startDate) {
        where.dateTime.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.dateTime.lte = new Date(params.endDate);
      }
    }

    if (Object.keys(where).length > 0) {
      findParams.where = where;
    }

    // Default ordering by date
    findParams.orderBy = { dateTime: "asc" };

    return await this.findMany(findParams);
  }

  // Create a new class
  async createClass(
    data: Partial<ClassSession>
  ): Promise<ApiResponse<ClassSession>> {
    return await this.create(data);
  }

  // Update an existing class
  async updateClass(
    id: string,
    data: Partial<ClassSession>
  ): Promise<ApiResponse<ClassSession>> {
    return await this.update(id, data);
  }

  // Delete a class
  async deleteClass(id: string): Promise<ApiResponse<ClassSession>> {
    return await this.delete(id);
  }

  // Get classes by date range (common use case)
  async getClassesByDateRange(
    startDate: string,
    endDate: string,
    filters?: {
      disciplineId?: string;
      instructorId?: string;
      status?: string;
    }
  ): Promise<PaginatedApiResponse<ClassSession>> {
    return await this.getClasses({
      startDate,
      endDate,
      ...filters,
      limit: 1000, // Get all classes in range
    });
  }

  // Get classes for a specific instructor
  async getClassesByInstructor(
    instructorId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<PaginatedApiResponse<ClassSession>> {
    return await this.getClasses({
      instructorId,
      ...params,
    });
  }

  // Get classes for a specific discipline
  async getClassesByDiscipline(
    disciplineId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      status?: string;
    }
  ): Promise<PaginatedApiResponse<ClassSession>> {
    return await this.getClasses({
      disciplineId,
      ...params,
    });
  }

  // Validation hooks (override from BaseService)

  protected async validateCreateData(data: any): Promise<void> {
    // Validate required fields
    if (!data.disciplineId || !data.instructorId || !data.dateTime) {
      throw new ValidationError(
        "Faltan campos requeridos: disciplineId, instructorId, dateTime"
      );
    }

    // Validate date format
    if (data.dateTime && isNaN(Date.parse(data.dateTime))) {
      throw new ValidationError("Formato de fecha inválido en dateTime");
    }

    // Validate capacity
    if (
      data.capacity &&
      (typeof data.capacity !== "number" || data.capacity <= 0)
    ) {
      throw new ValidationError("La capacidad debe ser un número positivo");
    }

    // Validate duration
    if (
      data.durationMinutes &&
      (typeof data.durationMinutes !== "number" || data.durationMinutes <= 0)
    ) {
      throw new ValidationError("La duración debe ser un número positivo");
    }
  }

  protected async validateUpdateData(
    id: string,
    data: any,
    existingRecord: ClassSession
  ): Promise<void> {
    // Same validations as create, but only for provided fields
    if (data.dateTime && isNaN(Date.parse(data.dateTime))) {
      throw new ValidationError("Formato de fecha inválido en dateTime");
    }

    if (
      data.capacity &&
      (typeof data.capacity !== "number" || data.capacity <= 0)
    ) {
      throw new ValidationError("La capacidad debe ser un número positivo");
    }

    if (
      data.durationMinutes &&
      (typeof data.durationMinutes !== "number" || data.durationMinutes <= 0)
    ) {
      throw new ValidationError("La duración debe ser un número positivo");
    }
  }
}
