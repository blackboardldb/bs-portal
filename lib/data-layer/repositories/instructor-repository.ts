// Instructor repository implementation
// Extracted from mock-database.ts and enhanced with proper typing and error handling

import { BaseRepository } from "./base-repository";
import { InstructorRepository as IInstructorRepository } from "../types";
import { Instructor } from "../../types";
import { initialInstructors } from "../../mock-data";
import { ValidationError } from "../../errors/types";

// Mock implementation of InstructorRepository
export class MockInstructorRepository
  extends BaseRepository<Instructor>
  implements IInstructorRepository
{
  protected entityName = "Instructor";
  protected data: Instructor[];

  constructor() {
    super();
    // Initialize with mock data
    this.data = [...initialInstructors];
  }

  // Find active instructors
  async findActive(): Promise<Instructor[]> {
    try {
      return this.data.filter((instructor) => instructor.isActive);
    } catch (error) {
      throw new Error(`Failed to find active instructors: ${error}`);
    }
  }

  // Find instructors by specialty (discipline)
  async findBySpecialty(disciplineId: string): Promise<Instructor[]> {
    try {
      return this.data.filter(
        (instructor) =>
          instructor.specialties.includes(disciplineId) && instructor.isActive
      );
    } catch (error) {
      throw new Error(`Failed to find instructors by specialty: ${error}`);
    }
  }

  // Enhanced filtering for instructor queries
  protected applyFilters(
    results: Instructor[],
    where: Record<string, any>
  ): Instructor[] {
    return results.filter((instructor) => {
      // Active status filter
      if (
        where.isActive !== undefined &&
        instructor.isActive !== where.isActive
      ) {
        return false;
      }

      // Role filter
      if (where.role && instructor.role !== where.role) {
        return false;
      }

      // Search filter (OR conditions)
      if (where.OR && Array.isArray(where.OR)) {
        const matchesSearch = where.OR.some((condition: any) => {
          const searchTerm =
            condition.firstName?.contains?.toLowerCase() ||
            condition.lastName?.contains?.toLowerCase() ||
            condition.email?.contains?.toLowerCase() ||
            "";

          return (
            instructor.firstName.toLowerCase().includes(searchTerm) ||
            instructor.lastName.toLowerCase().includes(searchTerm) ||
            instructor.email.toLowerCase().includes(searchTerm)
          );
        });

        if (!matchesSearch) {
          return false;
        }
      }

      // Apply base filtering for other criteria
      return this.matchesCriteria(instructor, where);
    });
  }

  // Validate instructor record
  protected validateRecord(record: Instructor): void {
    super.validateRecord(record);

    if (!record.firstName?.trim()) {
      throw new ValidationError("First name is required", "firstName");
    }

    if (!record.lastName?.trim()) {
      throw new ValidationError("Last name is required", "lastName");
    }

    if (!record.email?.trim()) {
      throw new ValidationError("Email is required", "email");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(record.email)) {
      throw new ValidationError("Invalid email format", "email");
    }

    // Check for duplicate email (excluding current record for updates)
    const existingInstructor = this.data.find(
      (i) =>
        i.email.toLowerCase() === record.email.toLowerCase() &&
        i.id !== record.id
    );
    if (existingInstructor) {
      throw new ValidationError("Email already exists", "email", {
        existingInstructorId: existingInstructor.id,
      });
    }

    if (!record.organizationId) {
      throw new ValidationError(
        "Organization ID is required",
        "organizationId"
      );
    }

    // Validate specialties
    if (!Array.isArray(record.specialties)) {
      throw new ValidationError("Specialties must be an array", "specialties");
    }

    if (record.specialties.length === 0) {
      throw new ValidationError(
        "At least one specialty is required",
        "specialties"
      );
    }

    // Validate role if present
    if (record.role && !["admin", "coach"].includes(record.role)) {
      throw new ValidationError("Invalid role. Must be admin or coach", "role");
    }

    // Validate phone format if present
    if (record.phone) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (
        !phoneRegex.test(record.phone) ||
        record.phone.replace(/\D/g, "").length < 8
      ) {
        throw new ValidationError("Invalid phone format", "phone");
      }
    }
  }

  // Instructor-specific utility methods

  // Find instructor by email
  async findByEmail(email: string): Promise<Instructor | null> {
    try {
      const instructor = this.data.find(
        (i) => i.email.toLowerCase() === email.toLowerCase()
      );
      return instructor || null;
    } catch (error) {
      throw new Error(`Failed to find instructor by email: ${error}`);
    }
  }

  // Find instructors by role
  async findByRole(role: string): Promise<Instructor[]> {
    try {
      return this.data.filter((instructor) => instructor.role === role);
    } catch (error) {
      throw new Error(`Failed to find instructors by role: ${error}`);
    }
  }

  // Search instructors by name or email
  async searchInstructors(query: string): Promise<Instructor[]> {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) {
      return [];
    }

    return this.data.filter(
      (instructor) =>
        instructor.firstName.toLowerCase().includes(searchTerm) ||
        instructor.lastName.toLowerCase().includes(searchTerm) ||
        instructor.email.toLowerCase().includes(searchTerm)
    );
  }

  // Add specialty to instructor
  async addSpecialty(
    instructorId: string,
    disciplineId: string
  ): Promise<Instructor> {
    const instructor = await this.findById(instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    if (instructor.specialties.includes(disciplineId)) {
      throw new ValidationError("Instructor already has this specialty");
    }

    const updatedInstructor = await this.update(instructorId, {
      specialties: [...instructor.specialties, disciplineId],
    });

    return updatedInstructor;
  }

  // Remove specialty from instructor
  async removeSpecialty(
    instructorId: string,
    disciplineId: string
  ): Promise<Instructor> {
    const instructor = await this.findById(instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    if (!instructor.specialties.includes(disciplineId)) {
      throw new ValidationError("Instructor does not have this specialty");
    }

    if (instructor.specialties.length === 1) {
      throw new ValidationError(
        "Cannot remove last specialty. Instructor must have at least one specialty"
      );
    }

    const updatedSpecialties = instructor.specialties.filter(
      (s) => s !== disciplineId
    );
    const updatedInstructor = await this.update(instructorId, {
      specialties: updatedSpecialties,
    });

    return updatedInstructor;
  }

  // Toggle instructor active status
  async toggleActiveStatus(instructorId: string): Promise<Instructor> {
    const instructor = await this.findById(instructorId);
    if (!instructor) {
      throw new Error("Instructor not found");
    }

    const updatedInstructor = await this.update(instructorId, {
      isActive: !instructor.isActive,
    });

    return updatedInstructor;
  }

  // Get instructors available for a specific discipline
  async getAvailableInstructors(disciplineId: string): Promise<Instructor[]> {
    return this.data.filter(
      (instructor) =>
        instructor.isActive && instructor.specialties.includes(disciplineId)
    );
  }

  // Get instructor statistics
  async getInstructorStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    admins: number;
    coaches: number;
  }> {
    const total = this.data.length;
    const active = this.data.filter((i) => i.isActive).length;
    const inactive = this.data.filter((i) => !i.isActive).length;
    const admins = this.data.filter((i) => i.role === "admin").length;
    const coaches = this.data.filter((i) => i.role === "coach").length;

    return { total, active, inactive, admins, coaches };
  }

  // Get instructor workload (number of specialties)
  async getInstructorWorkload(): Promise<
    Array<{
      instructorId: string;
      name: string;
      specialtyCount: number;
      specialties: string[];
    }>
  > {
    return this.data.map((instructor) => ({
      instructorId: instructor.id,
      name: `${instructor.firstName} ${instructor.lastName}`,
      specialtyCount: instructor.specialties.length,
      specialties: instructor.specialties,
    }));
  }
}

// Prisma implementation skeleton (for future use)
export class PrismaInstructorRepository implements IInstructorRepository {
  async findMany(params?: any): Promise<any> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }

  async findUnique(params: any): Promise<Instructor | null> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }

  async create(data: any): Promise<Instructor> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }

  async update(id: string, data: any): Promise<Instructor> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }

  async delete(id: string): Promise<Instructor> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }

  async count(params?: any): Promise<number> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }

  async findActive(): Promise<Instructor[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }

  async findBySpecialty(disciplineId: string): Promise<Instructor[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaInstructorRepository not implemented yet");
  }
}
