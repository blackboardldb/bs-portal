// Enhanced InstructorService using new data layer architecture
// Maintains existing API while using new provider-based architecture

import { BaseService } from "./base-service";
import { Instructor } from "../types";
import { InstructorRepository } from "../data-layer/types";
import { ApiResponse, PaginatedApiResponse } from "../api/types";
import { generatedSchemas, validateWithSchema } from "../types/generator";
import { ValidationError } from "../errors/types";

export class InstructorService extends BaseService<Instructor> {
  protected repositoryName = "instructors" as const;

  // Get the typed instructor repository
  private get instructorRepository(): InstructorRepository {
    return this.repository as InstructorRepository;
  }

  // Enhanced methods using new architecture

  // Get instructors with pagination and filtering
  async getInstructors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<PaginatedApiResponse<Instructor>> {
    const findParams: any = {
      page: params?.page || 1,
      limit: params?.limit || 10,
    };

    // Build where clause
    const where: any = {};

    if (params?.role && params.role !== "todos") {
      where.role = params.role;
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    if (params?.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: "insensitive" } },
        { lastName: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (Object.keys(where).length > 0) {
      findParams.where = where;
    }

    return this.findMany(findParams);
  }

  // Get instructor by ID
  async getInstructorById(id: string): Promise<ApiResponse<Instructor | null>> {
    return this.findById(id);
  }

  // Get active instructors
  async getActiveInstructors(): Promise<ApiResponse<Instructor[]>> {
    return this.withCache(
      "active_instructors",
      async () => {
        const instructors = await this.instructorRepository.findByStatus(true);
        return this.createSuccessResponse(instructors);
      },
      10 * 60 * 1000 // Cache for 10 minutes
    );
  }

  // Get instructors by discipline
  async getInstructorsByDiscipline(
    disciplineId: string
  ): Promise<ApiResponse<Instructor[]>> {
    return this.withErrorHandling(async () => {
      const instructors = await this.instructorRepository.findByDiscipline(
        disciplineId
      );
      return this.createSuccessResponse(instructors);
    });
  }

  // Create instructor
  async createInstructor(
    instructorData: any
  ): Promise<ApiResponse<Instructor>> {
    return this.create(instructorData);
  }

  // Update instructor
  async updateInstructor(
    id: string,
    instructorData: any
  ): Promise<ApiResponse<Instructor>> {
    return this.update(id, instructorData);
  }

  // Delete instructor
  async deleteInstructor(id: string): Promise<ApiResponse<Instructor>> {
    return this.delete(id);
  }

  // Get instructor statistics
  async getInstructorStats(): Promise<
    ApiResponse<{
      total: number;
      active: number;
      inactive: number;
      byRole: Record<string, number>;
    }>
  > {
    return this.withCache(
      "instructor_stats",
      async () => {
        const stats = await this.instructorRepository.getInstructorStats();
        return this.createSuccessResponse(stats);
      },
      5 * 60 * 1000 // Cache for 5 minutes
    );
  }

  // Validation hooks

  protected async validateCreateData(data: any): Promise<void> {
    // Validate using generated schema
    validateWithSchema(generatedSchemas.instructor, data);

    // Additional business validation
    if (!data.firstName || data.firstName.trim().length === 0) {
      throw new ValidationError("First name is required", "firstName");
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      throw new ValidationError("Last name is required", "lastName");
    }

    if (!data.email || data.email.trim().length === 0) {
      throw new ValidationError("Email is required", "email");
    }

    // Check for duplicate email
    const existingInstructors = await this.instructorRepository.findMany();
    const duplicateEmail = existingInstructors.items.find(
      (i) => i.email.toLowerCase() === data.email.toLowerCase()
    );

    if (duplicateEmail) {
      throw new ValidationError(
        "An instructor with this email already exists",
        "email"
      );
    }
  }

  protected async validateUpdateData(
    id: string,
    data: any,
    existingRecord: Instructor
  ): Promise<void> {
    // Validate using generated schema (partial)
    const updateSchema = generatedSchemas.instructor.partial();
    validateWithSchema(updateSchema, data);

    // Check for duplicate email if email is being changed
    if (data.email && data.email !== existingRecord.email) {
      const existingInstructors = await this.instructorRepository.findMany();
      const duplicateEmail = existingInstructors.items.find(
        (i) => i.id !== id && i.email.toLowerCase() === data.email.toLowerCase()
      );

      if (duplicateEmail) {
        throw new ValidationError(
          "An instructor with this email already exists",
          "email"
        );
      }
    }
  }

  protected async validateDelete(
    id: string,
    existingRecord: Instructor
  ): Promise<void> {
    // Check if instructor is assigned to any classes
    const classesWithInstructor = await this.dataProvider.classes.findMany({
      where: { instructorId: id },
    });

    if (classesWithInstructor.items.length > 0) {
      throw new ValidationError(
        "Cannot delete instructor that is assigned to classes. Deactivate them instead."
      );
    }
  }

  // Lifecycle hooks

  protected async afterCreate(record: Instructor): Promise<void> {
    // Clear cache
    this.clearCache();

    console.log(
      `[InstructorService] Instructor created: ${record.id} (${record.firstName} ${record.lastName})`
    );
  }

  protected async afterUpdate(
    updatedRecord: Instructor,
    previousRecord: Instructor
  ): Promise<void> {
    // Clear cache
    this.clearCache();

    // Log significant changes
    if (previousRecord.isActive !== updatedRecord.isActive) {
      console.log(
        `[InstructorService] Instructor status changed: ${updatedRecord.id} (${
          previousRecord.isActive ? "active" : "inactive"
        } -> ${updatedRecord.isActive ? "active" : "inactive"})`
      );
    }
  }

  protected async afterDelete(deletedRecord: Instructor): Promise<void> {
    // Clear cache
    this.clearCache();

    console.log(
      `[InstructorService] Instructor deleted: ${deletedRecord.id} (${deletedRecord.firstName} ${deletedRecord.lastName})`
    );
  }

  // Helper methods

  private async withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error("[InstructorService] Operation failed:", error);
      throw error;
    }
  }

  private createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      data,
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        processingTime: this.getProcessingTime(),
      },
    };
  }
}
