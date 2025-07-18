import { z } from "zod";

// User schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
  membership: z
    .object({
      id: z.string(),
      organizationId: z.string(),
      organizationName: z.string(),
      status: z.enum(["active", "inactive", "expired", "pending"]),
      membershipType: z.string(),
      planId: z.string(),
      monthlyPrice: z.number(),
      currentPeriodStart: z.string(),
      currentPeriodEnd: z.string(),
      planConfiguration: z.object({
        maxClassesPerMonth: z.number(),
        maxBookingsPerDay: z.number(),
        cancellationHours: z.number(),
      }),
      centerStats: z.object({
        currentMonth: z.object({
          classesContracted: z.number(),
          classesAttended: z.number(),
          classesCancelled: z.number(),
        }),
        totalClasses: z.number(),
        totalHours: z.number(),
      }),
      centerConfig: z.object({
        timezone: z.string(),
        currency: z.string(),
        language: z.string(),
      }),
    })
    .optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })
    .optional(),
});

export const updateUserSchema = createUserSchema.partial();

// Class schemas
export const classSessionSchema = z.object({
  id: z.string(),
  name: z.string(),
  disciplineId: z.string(),
  instructorId: z.string().optional(),
  dateTime: z.string(),
  durationMinutes: z.number(),
  maxParticipants: z.number(),
  registeredParticipantsIds: z.array(z.string()),
  waitlistParticipantsIds: z.array(z.string()),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createClassSessionSchema = z.object({
  name: z.string().min(1),
  disciplineId: z.string(),
  instructorId: z.string().optional(),
  dateTime: z.string(),
  durationMinutes: z.number().min(1),
  maxParticipants: z.number().min(1),
  notes: z.string().optional(),
});

export const updateClassSessionSchema = createClassSessionSchema.partial();

// Discipline schemas
export const disciplineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createDisciplineSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
});

export const updateDisciplineSchema = createDisciplineSchema.partial();

// Instructor schemas
export const instructorSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  specialties: z.array(z.string()),
  isActive: z.boolean(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createInstructorSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  specialties: z.array(z.string()),
  bio: z.string().optional(),
  avatar: z.string().optional(),
});

export const updateInstructorSchema = createInstructorSchema.partial();

// Plan schemas
export const planSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  monthlyPrice: z.number(),
  maxClassesPerMonth: z.number(),
  maxBookingsPerDay: z.number(),
  cancellationHours: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0),
  maxClassesPerMonth: z.number().min(1),
  maxBookingsPerDay: z.number().min(1),
  cancellationHours: z.number().min(0),
});

export const updatePlanSchema = createPlanSchema.partial();

// Organization schemas
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  settings: z.object({
    timezone: z.string(),
    currency: z.string(),
    language: z.string(),
    defaultCancellationHours: z.number(),
    maxBookingsPerDay: z.number(),
    waitlistEnabled: z.boolean(),
    operatingHours: z.array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      })
    ),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createOrganizationSchema = z.object({
  name: z.string().min(1),
  settings: z.object({
    timezone: z.string(),
    currency: z.string(),
    language: z.string(),
    defaultCancellationHours: z.number().min(0),
    maxBookingsPerDay: z.number().min(1),
    waitlistEnabled: z.boolean(),
    operatingHours: z.array(
      z.object({
        day: z.string(),
        open: z.string(),
        close: z.string(),
        closed: z.boolean(),
      })
    ),
  }),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

// Registration schemas
export const classRegistrationSchema = z.object({
  userId: z.string(),
  classSessionId: z.string(),
  status: z.enum(["registered", "waitlisted", "cancelled"]),
  registeredAt: z.string(),
  cancelledAt: z.string().optional(),
});

export const createClassRegistrationSchema = z.object({
  userId: z.string(),
  classSessionId: z.string(),
});

// Renewal schemas
export const membershipRenewalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  requestedPaymentMethod: z.string(),
  status: z.enum(["pending", "approved", "rejected"]),
  requestedAt: z.string(),
  processedAt: z.string().optional(),
  processedBy: z.string().optional(),
  notes: z.string().optional(),
});

export const createMembershipRenewalSchema = z.object({
  userId: z.string(),
  planId: z.string(),
  requestedPaymentMethod: z.string(),
  notes: z.string().optional(),
});

export const CancellationRuleSchema = z.object({
  id: z.string(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  hoursBefore: z.number().min(0),
  priority: z.number().min(0),
  description: z.string().optional(),
});

export const DisciplineSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean(),
  schedule: z.array(
    z.object({
      day: z.enum(["lun", "mar", "mie", "jue", "vie", "sab", "dom"]),
      times: z.array(z.string().regex(/^\d{2}:\d{2}$/)),
    })
  ),
  cancellationRules: z.array(CancellationRuleSchema),
});

// Export types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type ClassSession = z.infer<typeof classSessionSchema>;
export type CreateClassSession = z.infer<typeof createClassSessionSchema>;
export type UpdateClassSession = z.infer<typeof updateClassSessionSchema>;

export type Discipline = z.infer<typeof disciplineSchema>;
export type CreateDiscipline = z.infer<typeof createDisciplineSchema>;
export type UpdateDiscipline = z.infer<typeof updateDisciplineSchema>;

export type Instructor = z.infer<typeof instructorSchema>;
export type CreateInstructor = z.infer<typeof createInstructorSchema>;
export type UpdateInstructor = z.infer<typeof updateInstructorSchema>;

export type Plan = z.infer<typeof planSchema>;
export type CreatePlan = z.infer<typeof createPlanSchema>;
export type UpdatePlan = z.infer<typeof updatePlanSchema>;

export type Organization = z.infer<typeof organizationSchema>;
export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>;

export type ClassRegistration = z.infer<typeof classRegistrationSchema>;
export type CreateClassRegistration = z.infer<
  typeof createClassRegistrationSchema
>;

export type MembershipRenewal = z.infer<typeof membershipRenewalSchema>;
export type CreateMembershipRenewal = z.infer<
  typeof createMembershipRenewalSchema
>;

// Banner schemas
export const bannerSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(50),
  subtitle: z.string().max(100).optional(),
  icon: z.string().optional(),
  buttonTitle: z.string().max(30).optional(),
  buttonUrl: z
    .string()
    .refine((url) => {
      if (!url) return true; // Optional field
      // Allow internal routes (starting with /) or external URLs
      return url.startsWith("/") || /^https?:\/\//.test(url);
    }, "Debe ser una URL válida (ej: /app/calendar o https://ejemplo.com)")
    .optional(),
  badge: z.boolean().default(false),
  badgeText: z.string().max(20).optional(),
  backgroundColor: z.string(),
  textColor: z.string(),
  subtitleColor: z.string().optional(),
  buttonColor: z.string().optional(),
  textButtonColor: z.string().optional(),
  isActive: z.boolean().default(true),
  order: z.number().min(0).max(6),
  createdAt: z.string(),
});

export const createBannerSchema = z
  .object({
    title: z
      .string()
      .min(1, "El título es requerido")
      .max(50, "El título no puede exceder 50 caracteres"),
    subtitle: z
      .string()
      .max(100, "El subtítulo no puede exceder 100 caracteres")
      .optional(),
    icon: z.string().optional(),
    buttonTitle: z
      .string()
      .max(30, "El texto del botón no puede exceder 30 caracteres")
      .optional(),
    buttonUrl: z
      .string()
      .refine((url) => {
        if (!url) return true; // Optional field
        // Allow internal routes (starting with /) or external URLs
        return url.startsWith("/") || /^https?:\/\//.test(url);
      }, "Debe ser una URL válida (ej: /app/calendar o https://ejemplo.com)")
      .optional(),
    badge: z.boolean().default(false),
    badgeText: z
      .string()
      .max(20, "El texto del badge no puede exceder 20 caracteres")
      .optional(),
    backgroundColor: z.string().min(1, "El color de fondo es requerido"),
    textColor: z.string().min(1, "El color del texto es requerido"),
    subtitleColor: z.string().optional(),
    buttonColor: z.string().optional(),
    textButtonColor: z.string().optional(),
  })
  .refine(
    (data) => {
      // Si hay buttonTitle, debe haber buttonUrl y viceversa
      const hasButtonTitle = data.buttonTitle && data.buttonTitle.trim();
      const hasButtonUrl = data.buttonUrl && data.buttonUrl.trim();

      if (hasButtonTitle && !hasButtonUrl) {
        return false;
      }
      if (hasButtonUrl && !hasButtonTitle) {
        return false;
      }
      return true;
    },
    {
      message:
        "Si especificas un botón, debes incluir tanto el texto como la URL",
      path: ["buttonTitle"],
    }
  )
  .refine(
    (data) => {
      // Si badge es true, debe haber badgeText
      if (data.badge && (!data.badgeText || !data.badgeText.trim())) {
        return false;
      }
      return true;
    },
    {
      message: "Si activas el badge, debes especificar el texto",
      path: ["badgeText"],
    }
  );

export const updateBannerSchema = z.object({
  title: z
    .string()
    .min(1, "El título es requerido")
    .max(50, "El título no puede exceder 50 caracteres")
    .optional(),
  subtitle: z
    .string()
    .max(100, "El subtítulo no puede exceder 100 caracteres")
    .optional(),
  icon: z.string().optional(),
  buttonTitle: z
    .string()
    .max(30, "El texto del botón no puede exceder 30 caracteres")
    .optional(),
  buttonUrl: z
    .string()
    .refine((url) => {
      if (!url) return true; // Optional field
      // Allow internal routes (starting with /) or external URLs
      return url.startsWith("/") || /^https?:\/\//.test(url);
    }, "Debe ser una URL válida (ej: /app/calendar o https://ejemplo.com)")
    .optional(),
  badge: z.boolean().optional(),
  badgeText: z
    .string()
    .max(20, "El texto del badge no puede exceder 20 caracteres")
    .optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  subtitleColor: z.string().optional(),
  buttonColor: z.string().optional(),
  textButtonColor: z.string().optional(),
});

// Export banner types
export type Banner = z.infer<typeof bannerSchema>;
export type CreateBanner = z.infer<typeof createBannerSchema>;
export type UpdateBanner = z.infer<typeof updateBannerSchema>;
