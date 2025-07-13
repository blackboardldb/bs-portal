// src/types.ts

// === INTERFACES PRINCIPALES ===

// Unificación de la información del usuario global (similar a global_users en DB)
// y enriquecida con detalles para admin
export interface FitCenterUserProfile {
  id: string; // "usr_ana_garcia_001" - Consistente con DB (VARCHAR)
  firstName: string; // "Ana"
  lastName: string; // "García"
  email: string; // "ana@email.com"
  phone: string; // "+56 9 1234 5678"
  dateOfBirth?: string; // "1990-05-15" (ISO 8601)
  gender?: string; // "Femenino"
  avatarId?: string; // "avatar_1"

  // NUEVO: Rol del usuario (admin, coach, user/alumno)
  /**
   * Role del usuario para control de acceso.
   * 'admin': acceso total
   * 'coach': acceso a clases, horarios, alumnos, aprobación de planes
   * 'user': acceso solo a su perfil y reservas
   */
  role?: "admin" | "coach" | "user";

  // Información adicional de contacto (útil para admin y perfil completo)
  address?: string;
  emergencyContact?: string;
  notes?: string; // Notas del admin sobre el usuario
  formaDePago?: "contado" | "transferencia" | "debito" | "credito"; // Nueva forma de pago

  // Información de Membresía del FitCenter (puede haber múltiples en BS Board)
  // Para BlackSheep, solo habrá una, pero la estructura soporta el futuro multi-tenant.
  membership: FitCenterMembership; // Anidado para consistencia

  // Preferencias globales y estadísticas globales (campos JSONB de global_users)
  globalPreferences?: Record<string, unknown>;
  globalStats?: Record<string, unknown>;
  gamification?: Record<string, unknown>;

  // NUEVO: Información específica de rechazo (solo para usuarios rechazados)
  rejectionInfo?: {
    rejectedAt: string; // ISO 8601
    reason: string;
    rejectedBy: string; // ID del admin que rechazó
  };
}

// Estructura detallada de la membresía para FitCenterUserProfile
export interface FitCenterMembership {
  id: string; // "mem_fitcenter_ana" - Consistente con DB (VARCHAR)
  organizationId: string; // "org_fitcenter_001"
  organizationName: string; // "FitCenter Admin"
  status: MembershipStatus; // "active" | "inactive" | "suspended" | "expired" | "frozen" | "pending"
  membershipType: string; // "Básico" | "Premium" | "VIP"
  planId?: string; // id real del plan de membresía
  monthlyPrice: number; // 35000
  startDate: string; // "2024-10-01" (ISO 8601)
  currentPeriodStart: string; // "2024-12-01" (ISO 8601)
  currentPeriodEnd: string; // "2024-12-31" (ISO 8601)

  // Configuración específica del plan de esta membresía
  planConfig: {
    classLimit: number; // 8 clases por mes (0 = ilimitado)
    disciplineAccess: "all" | "limited";
    allowedDisciplines: string[]; // IDs de disciplinas permitidas (cambiado a string[])
    canFreeze: boolean;
    freezeDurationDays: number;
    autoRenews: boolean;
  };

  // Estadísticas del centro relacionadas con esta membresía
  centerStats: {
    currentMonth: {
      classesAttended: number;
      classesContracted: number;
      remainingClasses: number;
      noShows: number;
      lastMinuteCancellations: number;
    };
    totalMonthsActive: number;
    memberSince: string; // Formato ISO 8601:YYYY-MM-DD
    lifetimeStats: {
      totalClasses: number;
      totalNoShows: number;
      averageMonthlyAttendance: number;
      bestMonth: {
        month: string;
        year: number;
        count: number;
      };
    };
  };

  // Configuración del centro aplicada a esta membresía (generalmente solo de lectura para el cliente)
  centerConfig: {
    allowCancellation: boolean;
    cancellationHours: number;
    maxBookingsPerDay: number;
    autoWaitlist: boolean;
  };
  // NUEVO: Solicitud de renovación pendiente
  pendingRenewal?: PendingRenewalRequest;
}

// === NUEVAS INTERFACES PARA MÉTRICAS HISTÓRICAS ===

// Participante detallado de una clase
export interface ClassParticipant {
  userId: string;
  firstName: string;
  lastName: string;
  membershipType: string;
  bookedAt: string; // ISO 8601
  isRegular?: boolean; // ¿Asiste regularmente a esta hora?
  waitlistPosition?: number; // Solo si está en waitlist
  noShowCount?: number; // No-shows este mes
}

// Métricas históricas de una clase
export interface ClassHistoricalData {
  averageAttendance: number; // Promedio de asistencia para esta hora/día
  noShowRate: number; // Tasa histórica de no-shows (0-1)
  waitlistFrequency: number; // Qué tan seguido se llena (0-1)
  popularityTrend: "up" | "down" | "stable";
}

// Clase extendida con métricas históricas y participantes detallados
export interface ClassSessionExtended extends ClassSession {
  // Participantes detallados
  participants: {
    confirmed: ClassParticipant[];
    waitlist: ClassParticipant[];
    noShows: ClassParticipant[];
  };

  // Métricas históricas
  historicalData: ClassHistoricalData;

  // Notas del admin
  notes?: string;
  specialInstructions?: string;

  // Configuración flexible por clase
  cancellationHours: number; // Específico para esta clase
  occupancyRate: number; // enrolled / capacity
}

// Interfaz para la organización/centro (fundamental para multi-tenant)
export interface Organization {
  id: string; // "org_fitcenter_001"
  name: string; // "FitCenter Admin"
  description: string; // "Centro de Entrenamientos"
  type: string; // "gym", "crossfit", "yoga_studio"

  // Configuración visual
  branding: {
    primaryColor: string; // "#3b82f6"
    secondaryColor: string; // "#10b981"
    logoSvg?: string;
  };

  // Configuración operacional del centro (similar a center_config JSONB en la tabla organizations)
  settings: {
    timezone: string; // "America/Santiago"
    currency: string; // "CLP"
    language: string; // "es"

    defaultCancellationHours: number; // 6
    maxBookingsPerDay: number; // 3
    waitlistEnabled: boolean; // true

    operatingHours: Array<{
      day: DayOfWeek;
      open: string; // "06:00" (HH:mm)
      close: string; // "22:00" (HH:mm)
      closed: boolean;
    }>;
  };
}

// Plan de Membresía (definiciones del plan, no la suscripción de un usuario)
export interface MembershipPlan {
  id: string; // "plan_basic_001" - Cambiado a string
  organizationId: string; // A qué organización pertenece este plan
  name: string; // "Básico"
  description: string; // "Acceso limitado a clases"
  price: number; // 35000
  durationInMonths: number; // 1 (para planes mensuales)
  classLimit: number; // 8 (0 para ilimitado)
  disciplineAccess: "all" | "limited";
  allowedDisciplines: string[]; // IDs de disciplinas permitidas (cambiado a string[])
  canFreeze: boolean;
  freezeDurationDays: number;
  autoRenews: boolean;
  isActive: boolean; // Para activar/desactivar planes
}

export interface Discipline {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive: boolean;
  schedule: { day: DayOfWeek; times: string[] }[];
  cancellationRules: CancellationRule[];
}

export interface CancellationRule {
  id: string;
  time: string; // "08:00"
  hoursBefore: number;
  priority: number;
  description?: string;
}

// NUEVA: Resultado de validación de cancelación
export interface CancellationValidation {
  canCancel: boolean;
  reason: string;
  timeUntilDeadline?: string; // "2h 30m" o "Ya pasó el plazo"
  deadline?: Date; // Fecha límite exacta
  hoursBefore: number; // Horas configuradas para esta clase
}

// Sesión de Clase (evento de clase específico)
export interface ClassSession {
  id: string; // "cls_20250706_0700_cf" - Cambiado a string
  organizationId: string; // A qué organización pertenece esta clase
  disciplineId: string; // ID de la disciplina (CrossFit, Weightlifting) - Cambiado a string
  name: string; // "CrossFit Fundamentos" (puede ser más específico que la disciplina)
  dateTime: string; // "2025-07-06T07:00:00-04:00" (ISO 8601 completo)
  durationMinutes: number; // 60
  instructorId: string; // ID del instructor - Cambiado a string
  capacity: number; // 15
  registeredParticipantsIds: string[]; // IDs de usuarios registrados - Cambiado a string[]
  waitlistParticipantsIds: string[]; // IDs de usuarios en lista de espera - Cambiado a string[]
  status: ClassStatus; // "scheduled" | "cancelled" | "completed" | "in_progress"
  notes?: string; // Notas para la clase (ej. WOD)
  isGenerated?: boolean; // Flag para identificar clases generadas dinámicamente
}

// Interface para el Instructor (nueva entidad para una gestión más robusta)
export interface Instructor {
  id: string; // "inst_vito_001"
  organizationId: string; // A qué organización pertenece este instructor
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialties: string[]; // IDs de disciplinas que imparte
  isActive: boolean;
  /**
   * userId: Si en el futuro el instructor es un usuario con rol 'coach',
   * este campo permitirá vincularlo directamente.
   */
  userId?: string;
  /**
   * role: Rol del instructor para control de acceso.
   * 'coach': acceso a clases, horarios, alumnos, aprobación de planes
   * 'admin': acceso total
   */
  role?: "admin" | "coach";
}

// === TIPOS AUXILIARES ===

export type MembershipStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "expired"
  | "frozen"
  | "pending";
export type DayOfWeek = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";
export type ClassStatus =
  | "scheduled"
  | "cancelled"
  | "completed"
  | "in_progress";
export type ParticipantStatus =
  | "confirmed"
  | "waitlist"
  | "no_show"
  | "cancelled";

// === CONSTANTES DE ESTADO DE MEMBRESÍA ===

export const MEMBERSHIP_STATUS_VALUES: MembershipStatus[] = [
  "active",
  "inactive",
  "suspended",
  "expired",
  "frozen",
  "pending",
];

export const MEMBERSHIP_STATUS_LABELS: Record<MembershipStatus, string> = {
  active: "Activo",
  inactive: "Inactivo",
  suspended: "Suspendido",
  expired: "Expirado",
  frozen: "Congelado",
  pending: "Pendiente",
};

export const MEMBERSHIP_STATUS_COLORS: Record<MembershipStatus, string> = {
  active: "#297C3B", // green-900
  inactive: "#666666", // gray-900
  suspended: "#A35200", // amber-900
  expired: "#CA2A30", // red-900
  frozen: "#0067D6", // blue-900
  pending: "#666666", // gray-900
};

// === INTERFACES DE RESPUESTA (para APIs) ===
// (Estas podrían ser útiles para tipar las respuestas directas del backend)

export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  monthlyRevenue: number;
  classesToday: number;
  membershipBreakdown: Record<string, number>;
  disciplinePopularity: Record<string, number>;
  attendanceTrends: Record<string, number>;
}

export interface PendingRenewalRequest {
  requestedPlanId: string;
  requestedPaymentMethod: "contado" | "transferencia" | "debito" | "credito";
  requestDate: string; // ISO 8601
}

// Tipo enriquecido para la vista de clases del admin
export interface ClassListItem {
  id: string;
  dateTime: string;
  name: string;
  instructor: string;
  duration: string;
  alumnRegistred: string;
  isRegistered: boolean;
  status: string;
  discipline: string;
  disciplineId: string;
  date: string;
  time: string;
  color: string;
  capacity: number;
  enrolled: number;
  registeredParticipantsIds: string[];
  waitlistParticipantsIds?: string[];
  notes?: string;
}
