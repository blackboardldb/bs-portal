// Type generation utilities for creating Zod schemas from TypeScript interfaces
// This ensures single source of truth between types and validation schemas

import { z } from "zod";

// Base schema generators
export function createBaseEntitySchema() {
  return z.object({
    id: z.string(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
  });
}

// User schema generation
export function createUserSchema() {
  return z.object({
    id: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    avatarId: z.string().optional(),
    role: z.enum(["admin", "coach", "user"]).optional(),
    address: z.string().optional(),
    emergencyContact: z.string().optional(),
    notes: z.string().optional(),
    formaDePago: z
      .enum(["contado", "transferencia", "debito", "credito"])
      .optional(),
    membership: createMembershipSchema(),
    globalPreferences: z.record(z.unknown()).optional(),
    globalStats: z.record(z.unknown()).optional(),
    gamification: z.record(z.unknown()).optional(),
    rejectionInfo: z
      .object({
        rejectedAt: z.string(),
        reason: z.string(),
        rejectedBy: z.string(),
      })
      .optional(),
  });
}

// Membership schema generation
export function createMembershipSchema() {
  return z.object({
    id: z.string(),
    organizationId: z.string(),
    organizationName: z.string(),
    status: z.enum([
      "active",
      "inactive",
      "suspended",
      "expired",
      "frozen",
      "pending",
    ]),
    membershipType: z.string(),
    planId: z.string().optional(),
    monthlyPrice: z.number().min(0),
    startDate: z.string(),
    currentPeriodStart: z.string(),
    currentPeriodEnd: z.string(),
    planConfig: z.object({
      classLimit: z.number().min(0),
      disciplineAccess: z.enum(["all", "limited"]),
      allowedDisciplines: z.array(z.string()),
      canFreeze: z.boolean(),
      freezeDurationDays: z.number().min(0),
      autoRenews: z.boolean(),
    }),
    centerStats: z.object({
      currentMonth: z.object({
        classesAttended: z.number().min(0),
        classesContracted: z.number().min(0),
        remainingClasses: z.number().min(0),
        noShows: z.number().min(0),
        lastMinuteCancellations: z.number().min(0),
      }),
      totalMonthsActive: z.number().min(0),
      memberSince: z.string(),
      lifetimeStats: z.object({
        totalClasses: z.number().min(0),
        totalNoShows: z.number().min(0),
        averageMonthlyAttendance: z.number().min(0),
        bestMonth: z.object({
          month: z.string(),
          year: z.number(),
          count: z.number().min(0),
        }),
      }),
    }),
    centerConfig: z.object({
      allowCancellation: z.boolean(),
      cancellationHours: z.number().min(0),
      maxBookingsPerDay: z.number().min(0),
      autoWaitlist: z.boolean(),
    }),
    pendingRenewal: z
      .object({
        requestedPlanId: z.string(),
        requestedPaymentMethod: z.enum([
          "contado",
          "transferencia",
          "debito",
          "credito",
        ]),
        requestDate: z.string(),
      })
      .optional(),
  });
}

// Class session schema generation
export function createClassSessionSchema() {
  return z.object({
    id: z.string(),
    organizationId: z.string(),
    disciplineId: z.string(),
    name: z.string().min(1, "Class name is required"),
    dateTime: z.string(),
    durationMinutes: z.number().min(15).max(180),
    instructorId: z.string(),
    capacity: z.number().min(1).max(100),
    registeredParticipantsIds: z.array(z.string()),
    waitlistParticipantsIds: z.array(z.string()),
    status: z.enum(["scheduled", "cancelled", "completed", "in_progress"]),
    notes: z.string().optional(),
    isGenerated: z.boolean().optional(),
  });
}

// Discipline schema generation
export function createDisciplineSchema() {
  return z.object({
    id: z.string(),
    name: z.string().min(1, "Discipline name is required"),
    description: z.string().optional(),
    color: z.string().optional(),
    isActive: z.boolean(),
    schedule: z.array(
      z.object({
        day: z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]),
        times: z.array(
          z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format")
        ),
      })
    ),
    cancellationRules: z.array(
      z.object({
        id: z.string(),
        time: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
        hoursBefore: z.number().min(0),
        priority: z.number().min(0),
        description: z.string().optional(),
      })
    ),
  });
}

// Instructor schema generation
export function createInstructorSchema() {
  return z.object({
    id: z.string(),
    organizationId: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email format"),
    phone: z.string().optional(),
    specialties: z.array(z.string()),
    isActive: z.boolean(),
    userId: z.string().optional(),
    role: z.enum(["admin", "coach"]).optional(),
  });
}

// Membership plan schema generation
export function createMembershipPlanSchema() {
  return z.object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string().min(1, "Plan name is required"),
    description: z.string(),
    price: z.number().min(0),
    durationInMonths: z.number().min(0.5),
    classLimit: z.number().min(0),
    disciplineAccess: z.enum(["all", "limited"]),
    allowedDisciplines: z.array(z.string()),
    canFreeze: z.boolean(),
    freezeDurationDays: z.number().min(0),
    autoRenews: z.boolean(),
    isActive: z.boolean(),
  });
}

// Organization schema generation
export function createOrganizationSchema() {
  return z.object({
    id: z.string(),
    name: z.string().min(1, "Organization name is required"),
    description: z.string(),
    type: z.string(),
    branding: z.object({
      primaryColor: z.string(),
      secondaryColor: z.string(),
      logoSvg: z.string().optional(),
    }),
    settings: z.object({
      timezone: z.string(),
      currency: z.string(),
      language: z.string(),
      defaultCancellationHours: z.number().min(0),
      maxBookingsPerDay: z.number().min(1),
      waitlistEnabled: z.boolean(),
      operatingHours: z.array(
        z.object({
          day: z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]),
          open: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
          close: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
          closed: z.boolean(),
        })
      ),
    }),
  });
}

// Create and Update schema generators
export function createCreateSchema<T extends z.ZodTypeAny>(baseSchema: T) {
  if (baseSchema instanceof z.ZodObject) {
    return baseSchema.omit({
      id: true,
      createdAt: true,
      updatedAt: true,
    });
  }
  return baseSchema;
}

export function createUpdateSchema<T extends z.ZodTypeAny>(baseSchema: T) {
  if (baseSchema instanceof z.ZodObject) {
    return baseSchema
      .omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      })
      .partial();
  }
  return baseSchema.partial();
}

// Query parameter schemas
export function createFindManyParamsSchema() {
  return z.object({
    where: z.record(z.unknown()).optional(),
    orderBy: z.record(z.enum(["asc", "desc"])).optional(),
    skip: z.number().min(0).optional(),
    take: z.number().min(1).max(100).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
  });
}

export function createFindUniqueParamsSchema() {
  return z.object({
    where: z
      .object({
        id: z.string().optional(),
        email: z.string().optional(),
      })
      .and(z.record(z.unknown())),
  });
}

// Validation helpers
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Validation failed: ${error.errors.map((e) => e.message).join(", ")}`
      );
    }
    throw error;
  }
}

export function safeValidateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result;
}

// Export all generated schemas for use throughout the application
export const generatedSchemas = {
  user: createUserSchema(),
  membership: createMembershipSchema(),
  classSession: createClassSessionSchema(),
  discipline: createDisciplineSchema(),
  instructor: createInstructorSchema(),
  membershipPlan: createMembershipPlanSchema(),
  organization: createOrganizationSchema(),
  findManyParams: createFindManyParamsSchema(),
  findUniqueParams: createFindUniqueParamsSchema(),
};

// Create schemas for API operations
export const createSchemas = {
  user: createCreateSchema(generatedSchemas.user),
  classSession: createCreateSchema(generatedSchemas.classSession),
  discipline: createCreateSchema(generatedSchemas.discipline),
  instructor: createCreateSchema(generatedSchemas.instructor),
  membershipPlan: createCreateSchema(generatedSchemas.membershipPlan),
  organization: createCreateSchema(generatedSchemas.organization),
};

export const updateSchemas = {
  user: createUpdateSchema(generatedSchemas.user),
  classSession: createUpdateSchema(generatedSchemas.classSession),
  discipline: createUpdateSchema(generatedSchemas.discipline),
  instructor: createUpdateSchema(generatedSchemas.instructor),
  membershipPlan: createUpdateSchema(generatedSchemas.membershipPlan),
  organization: createUpdateSchema(generatedSchemas.organization),
};

// Type inference helpers
export type GeneratedUser = z.infer<typeof generatedSchemas.user>;
export type GeneratedClassSession = z.infer<
  typeof generatedSchemas.classSession
>;
export type GeneratedDiscipline = z.infer<typeof generatedSchemas.discipline>;
export type GeneratedInstructor = z.infer<typeof generatedSchemas.instructor>;
export type GeneratedMembershipPlan = z.infer<
  typeof generatedSchemas.membershipPlan
>;
export type GeneratedOrganization = z.infer<
  typeof generatedSchemas.organization
>;

export type CreateUser = z.infer<typeof createSchemas.user>;
export type CreateClassSession = z.infer<typeof createSchemas.classSession>;
export type CreateDiscipline = z.infer<typeof createSchemas.discipline>;
export type CreateInstructor = z.infer<typeof createSchemas.instructor>;
export type CreateMembershipPlan = z.infer<typeof createSchemas.membershipPlan>;
export type CreateOrganization = z.infer<typeof createSchemas.organization>;

export type UpdateUser = z.infer<typeof updateSchemas.user>;
export type UpdateClassSession = z.infer<typeof updateSchemas.classSession>;
export type UpdateDiscipline = z.infer<typeof updateSchemas.discipline>;
export type UpdateInstructor = z.infer<typeof updateSchemas.instructor>;
export type UpdateMembershipPlan = z.infer<typeof updateSchemas.membershipPlan>;
export type UpdateOrganization = z.infer<typeof updateSchemas.organization>;
