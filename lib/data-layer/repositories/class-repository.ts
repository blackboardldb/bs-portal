// Class repository implementation
// Extracted from mock-database.ts and enhanced with proper typing and error handling

import { BaseRepository } from "./base-repository";
import { ClassRepository as IClassRepository } from "../types";
import { ClassSession } from "../../types";
import { initialDisciplines, initialInstructors } from "../../mock-data";
import { NotFoundError, ValidationError } from "../../errors/types";

// Helper to create local datetime without timezone issues
function createLocalDateTime(
  date: Date,
  hours: number,
  minutes: number
): string {
  const localDate = new Date(date);
  localDate.setHours(hours, minutes, 0, 0);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  const hour = String(localDate.getHours()).padStart(2, "0");
  const minute = String(localDate.getMinutes()).padStart(2, "0");
  const second = String(localDate.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

// Day mapping for schedule generation
const dayMap: { [key: string]: number } = {
  lun: 1,
  mar: 2,
  mie: 3,
  jue: 4,
  vie: 5,
  sab: 6,
  dom: 0,
};

// Mock implementation of ClassRepository
export class MockClassRepository
  extends BaseRepository<ClassSession>
  implements IClassRepository
{
  protected entityName = "ClassSession";
  protected data: ClassSession[];

  constructor() {
    super();
    // Generate classes dynamically from disciplines and instructors
    this.data = this.generateClassesFromDisciplines();
  }

  // Generate classes from discipline schedules
  private generateClassesFromDisciplines(): ClassSession[] {
    const generated: ClassSession[] = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    for (const discipline of initialDisciplines) {
      if (!discipline.isActive || !discipline.schedule) continue;

      const instructor = initialInstructors.find(
        (inst) => inst.specialties?.includes(discipline.id) && inst.isActive
      );
      if (!instructor) continue;

      for (const scheduleDay of discipline.schedule) {
        const dayNumber = dayMap[scheduleDay.day];
        if (dayNumber === undefined) continue;

        for (const time of scheduleDay.times) {
          const [hours, minutes] = time.split(":").map(Number);

          for (
            let date = new Date(start);
            date <= end;
            date.setDate(date.getDate() + 1)
          ) {
            if (date.getDay() === dayNumber) {
              const classDateTime = createLocalDateTime(date, hours, minutes);
              const dateStr = date.toISOString().split("T")[0];
              const timeStr = time.replace(":", "");
              const classId = `cls_${dateStr}_${timeStr}_${discipline.id}`;

              generated.push({
                id: classId,
                organizationId: "org_blacksheep_001",
                disciplineId: discipline.id,
                name: discipline.name,
                dateTime: classDateTime,
                durationMinutes: 60,
                instructorId: instructor.id,
                capacity: 15,
                registeredParticipantsIds: [],
                waitlistParticipantsIds: [],
                status: "scheduled",
                notes: undefined,
                isGenerated: true,
              });
            }
          }
        }
      }
    }

    return generated;
  }

  // Find classes by date range
  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ClassSession[]> {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      return this.data.filter((session) => {
        const sessionDate = new Date(session.dateTime);
        return sessionDate >= start && sessionDate <= end;
      });
    } catch (error) {
      throw new Error(`Failed to find classes by date range: ${error}`);
    }
  }

  // Find classes by discipline
  async findByDiscipline(disciplineId: string): Promise<ClassSession[]> {
    try {
      return this.data.filter(
        (session) => session.disciplineId === disciplineId
      );
    } catch (error) {
      throw new Error(`Failed to find classes by discipline: ${error}`);
    }
  }

  // Find classes by instructor
  async findByInstructor(instructorId: string): Promise<ClassSession[]> {
    try {
      return this.data.filter(
        (session) => session.instructorId === instructorId
      );
    } catch (error) {
      throw new Error(`Failed to find classes by instructor: ${error}`);
    }
  }

  // Find classes by status
  async findByStatus(status: string): Promise<ClassSession[]> {
    try {
      return this.data.filter((session) => session.status === status);
    } catch (error) {
      throw new Error(`Failed to find classes by status: ${error}`);
    }
  }

  // Enhanced filtering for complex class queries
  protected applyFilters(
    results: ClassSession[],
    where: Record<string, any>
  ): ClassSession[] {
    return results.filter((session) => {
      // Date/time filtering
      if (where.dateTime) {
        const { gte, lte, contains } = where.dateTime;

        if (contains && !session.dateTime.includes(contains)) {
          return false;
        }

        if (gte || lte) {
          const sessionDate = new Date(session.dateTime);
          const gteDate = gte ? new Date(gte) : null;
          const lteDate = lte ? new Date(lte) : null;

          if (gteDate && sessionDate < gteDate) return false;
          if (lteDate && sessionDate > lteDate) return false;
        }
      }

      // Status filtering
      if (where.status) {
        if (where.status.in && !where.status.in.includes(session.status)) {
          return false;
        }
        if (where.status.not && session.status === where.status.not) {
          return false;
        }
        if (
          typeof where.status === "string" &&
          session.status !== where.status
        ) {
          return false;
        }
      }

      // Discipline filtering
      if (where.disciplineId && session.disciplineId !== where.disciplineId) {
        return false;
      }

      // Instructor filtering
      if (where.instructorId && session.instructorId !== where.instructorId) {
        return false;
      }

      // Apply base filtering for other criteria
      return this.matchesCriteria(session, where);
    });
  }

  // Validate class session record
  protected validateRecord(record: ClassSession): void {
    super.validateRecord(record);

    if (!record.name?.trim()) {
      throw new ValidationError("Class name is required", "name");
    }

    if (!record.disciplineId) {
      throw new ValidationError("Discipline ID is required", "disciplineId");
    }

    if (!record.dateTime) {
      throw new ValidationError("Date and time are required", "dateTime");
    }

    // Validate date format and future date
    const classDate = new Date(record.dateTime);
    if (isNaN(classDate.getTime())) {
      throw new ValidationError("Invalid date format", "dateTime");
    }

    // For new classes, ensure they're in the future
    if (!record.id || record.id.startsWith("cls_new_")) {
      const now = new Date();
      if (classDate <= now) {
        throw new ValidationError(
          "Class must be scheduled for a future date",
          "dateTime"
        );
      }
    }

    if (
      !record.durationMinutes ||
      record.durationMinutes < 15 ||
      record.durationMinutes > 180
    ) {
      throw new ValidationError(
        "Duration must be between 15 and 180 minutes",
        "durationMinutes"
      );
    }

    if (!record.capacity || record.capacity < 1 || record.capacity > 100) {
      throw new ValidationError(
        "Capacity must be between 1 and 100",
        "capacity"
      );
    }

    // Validate status
    const validStatuses = [
      "scheduled",
      "cancelled",
      "completed",
      "in_progress",
    ];
    if (!validStatuses.includes(record.status)) {
      throw new ValidationError(
        `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        "status"
      );
    }

    // Validate participant arrays
    if (!Array.isArray(record.registeredParticipantsIds)) {
      throw new ValidationError(
        "Registered participants must be an array",
        "registeredParticipantsIds"
      );
    }

    if (!Array.isArray(record.waitlistParticipantsIds)) {
      throw new ValidationError(
        "Waitlist participants must be an array",
        "waitlistParticipantsIds"
      );
    }

    // Check capacity constraints
    if (record.registeredParticipantsIds.length > record.capacity) {
      throw new ValidationError(
        "Registered participants exceed capacity",
        "registeredParticipantsIds"
      );
    }
  }

  // Class-specific utility methods

  // Get today's classes
  async getTodaysClasses(): Promise<ClassSession[]> {
    const today = new Date().toISOString().split("T")[0];
    return this.findByDateRange(today, today);
  }

  // Get upcoming classes (next 7 days)
  async getUpcomingClasses(days: number = 7): Promise<ClassSession[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return this.findByDateRange(
      today.toISOString().split("T")[0],
      futureDate.toISOString().split("T")[0]
    );
  }

  // Register user to class
  async registerUserToClass(
    classId: string,
    userId: string
  ): Promise<ClassSession> {
    const classSession = await this.findById(classId);
    if (!classSession) {
      throw new NotFoundError("ClassSession", classId);
    }

    // Check if user is already registered
    if (classSession.registeredParticipantsIds.includes(userId)) {
      throw new ValidationError("User is already registered for this class");
    }

    // Check if user is on waitlist
    if (classSession.waitlistParticipantsIds.includes(userId)) {
      throw new ValidationError(
        "User is already on the waitlist for this class"
      );
    }

    // Check capacity
    if (
      classSession.registeredParticipantsIds.length >= classSession.capacity
    ) {
      // Add to waitlist
      const updatedClass = await this.update(classId, {
        waitlistParticipantsIds: [
          ...classSession.waitlistParticipantsIds,
          userId,
        ],
      });
      return updatedClass;
    } else {
      // Add to registered participants
      const updatedClass = await this.update(classId, {
        registeredParticipantsIds: [
          ...classSession.registeredParticipantsIds,
          userId,
        ],
      });
      return updatedClass;
    }
  }

  // Cancel user registration
  async cancelUserRegistration(
    classId: string,
    userId: string
  ): Promise<ClassSession> {
    const classSession = await this.findById(classId);
    if (!classSession) {
      throw new NotFoundError("ClassSession", classId);
    }

    let updatedRegistered = [...classSession.registeredParticipantsIds];
    let updatedWaitlist = [...classSession.waitlistParticipantsIds];

    // Remove from registered participants
    const registeredIndex = updatedRegistered.indexOf(userId);
    if (registeredIndex > -1) {
      updatedRegistered.splice(registeredIndex, 1);

      // Move first person from waitlist to registered if there's space
      if (updatedWaitlist.length > 0) {
        const nextUser = updatedWaitlist.shift()!;
        updatedRegistered.push(nextUser);
      }
    } else {
      // Remove from waitlist
      const waitlistIndex = updatedWaitlist.indexOf(userId);
      if (waitlistIndex > -1) {
        updatedWaitlist.splice(waitlistIndex, 1);
      } else {
        throw new ValidationError("User is not registered for this class");
      }
    }

    const updatedClass = await this.update(classId, {
      registeredParticipantsIds: updatedRegistered,
      waitlistParticipantsIds: updatedWaitlist,
    });

    return updatedClass;
  }

  // Cancel class
  async cancelClass(classId: string, reason?: string): Promise<ClassSession> {
    const classSession = await this.findById(classId);
    if (!classSession) {
      throw new NotFoundError("ClassSession", classId);
    }

    if (classSession.status === "cancelled") {
      throw new ValidationError("Class is already cancelled");
    }

    if (classSession.status === "completed") {
      throw new ValidationError("Cannot cancel a completed class");
    }

    const updatedClass = await this.update(classId, {
      status: "cancelled",
      notes: reason ? `Cancelled: ${reason}` : "Cancelled",
    });

    return updatedClass;
  }

  // Complete class
  async completeClass(classId: string): Promise<ClassSession> {
    const classSession = await this.findById(classId);
    if (!classSession) {
      throw new NotFoundError("ClassSession", classId);
    }

    if (classSession.status === "completed") {
      throw new ValidationError("Class is already completed");
    }

    if (classSession.status === "cancelled") {
      throw new ValidationError("Cannot complete a cancelled class");
    }

    const updatedClass = await this.update(classId, {
      status: "completed",
    });

    return updatedClass;
  }

  // Get class statistics
  async getClassStats(): Promise<{
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    inProgress: number;
  }> {
    const total = this.data.length;
    const scheduled = this.data.filter((c) => c.status === "scheduled").length;
    const completed = this.data.filter((c) => c.status === "completed").length;
    const cancelled = this.data.filter((c) => c.status === "cancelled").length;
    const inProgress = this.data.filter(
      (c) => c.status === "in_progress"
    ).length;

    return { total, scheduled, completed, cancelled, inProgress };
  }

  // Get classes with low attendance (less than 50% capacity)
  async getClassesWithLowAttendance(): Promise<ClassSession[]> {
    return this.data.filter((session) => {
      const attendanceRate =
        session.registeredParticipantsIds.length / session.capacity;
      return attendanceRate < 0.5 && session.status === "scheduled";
    });
  }

  // Get fully booked classes
  async getFullyBookedClasses(): Promise<ClassSession[]> {
    return this.data.filter(
      (session) =>
        session.registeredParticipantsIds.length >= session.capacity &&
        session.status === "scheduled"
    );
  }
}

// Prisma implementation skeleton (for future use)
export class PrismaClassRepository implements IClassRepository {
  async findMany(params?: any): Promise<any> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async findUnique(params: any): Promise<ClassSession | null> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async create(data: any): Promise<ClassSession> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async update(id: string, data: any): Promise<ClassSession> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async delete(id: string): Promise<ClassSession> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async count(params?: any): Promise<number> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<ClassSession[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async findByDiscipline(disciplineId: string): Promise<ClassSession[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async findByInstructor(instructorId: string): Promise<ClassSession[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }

  async findByStatus(status: string): Promise<ClassSession[]> {
    // TODO: Implement with Prisma
    throw new Error("PrismaClassRepository not implemented yet");
  }
}
