import {
  parseISO,
  addMinutes,
  isAfter,
  addHours,
  formatDistanceToNow,
  differenceInHours,
  differenceInMinutes,
} from "date-fns";
import type {
  FitCenterUserProfile,
  ClassSession,
  Discipline,
  CancellationValidation,
} from "./types";
import { getDataProvider } from "./data-layer/provider-factory";
import { DataProvider } from "./data-layer/types";

// Helper function to get cancellation rule for a specific time
function getCancellationRule(
  classTime: string,
  discipline: Discipline
): { hoursBefore: number; reason: string } {
  // Default rule: 2 hours before class
  const defaultRule = {
    hoursBefore: 2,
    reason: "Política estándar de cancelación",
  };

  // Check if discipline has specific rules
  if (
    discipline.cancellationRules &&
    Array.isArray(discipline.cancellationRules)
  ) {
    const specificRule = discipline.cancellationRules.find(
      (rule) => rule.time === classTime
    );
    if (specificRule) {
      return {
        hoursBefore: specificRule.hoursBefore,
        reason: `Regla específica: ${specificRule.hoursBefore}h antes para clase de ${specificRule.time}`,
      };
    }
  }

  // Return default rule
  return defaultRule;
}

/**
 * Servicio centralizado de validaciones para el backend
 * Todas las validaciones de negocio se manejan aquí
 * Ahora integrado con la nueva capa de datos
 */
export class ValidationService {
  private static dataProvider: DataProvider;

  // Initialize the validation service with data provider
  static initialize(provider?: DataProvider): void {
    this.dataProvider = provider || getDataProvider();
  }

  // Get data provider (lazy initialization)
  private static getProvider(): DataProvider {
    if (!this.dataProvider) {
      this.dataProvider = getDataProvider();
    }
    return this.dataProvider;
  }

  /**
   * Valida si un usuario puede inscribirse a una clase
   * Ahora usa el data provider para obtener datos relacionados
   */
  static async canUserRegisterToClass(
    user: FitCenterUserProfile,
    classSession: ClassSession,
    allClassSessions?: ClassSession[]
  ): Promise<{ canRegister: boolean; reason?: string }> {
    const now = new Date();
    const classStart = parseISO(classSession.dateTime);
    const classEnd = addMinutes(classStart, classSession.durationMinutes || 60);

    // 1. Verificar si la clase está cancelada
    if (classSession.status === "cancelled") {
      return { canRegister: false, reason: "La clase ha sido cancelada" };
    }

    // 2. Verificar si la clase ya pasó
    if (isAfter(now, classEnd)) {
      return { canRegister: false, reason: "La clase ya finalizó" };
    }

    // 3. Verificar si el usuario ya está inscrito
    if (classSession.registeredParticipantsIds.includes(user.id)) {
      return { canRegister: false, reason: "Ya estás inscrito a esta clase" };
    }

    // 4. Verificar cupos disponibles
    if (
      classSession.registeredParticipantsIds.length >= classSession.capacity
    ) {
      return { canRegister: false, reason: "No hay cupos disponibles" };
    }

    // 5. Verificar si el usuario tiene un plan activo
    if (!user.membership || user.membership.status !== "active") {
      return { canRegister: false, reason: "Tu plan no está activo" };
    }

    // 6. Verificar si el usuario tiene clases disponibles en su plan
    if (user.membership.planConfig.classLimit > 0) {
      const remainingClasses =
        user.membership.centerStats.currentMonth.remainingClasses;
      if (remainingClasses <= 0) {
        return {
          canRegister: false,
          reason: "No tienes clases disponibles en tu plan",
        };
      }
    }

    // 7. Verificar si la disciplina está permitida en el plan
    if (user.membership.planConfig.disciplineAccess === "limited") {
      const allowedDisciplines = user.membership.planConfig.allowedDisciplines;
      if (!allowedDisciplines.includes(classSession.disciplineId)) {
        return {
          canRegister: false,
          reason: "Tu plan no incluye esta disciplina",
        };
      }
    }

    // 8. Verificar límite de inscripciones por día
    let todayClasses: ClassSession[] = [];

    if (allClassSessions) {
      // Use provided sessions if available
      const today = new Date().toISOString().split("T")[0];
      todayClasses = allClassSessions.filter((session) => {
        const sessionDate = session.dateTime.split("T")[0];
        return (
          sessionDate === today &&
          session.registeredParticipantsIds.includes(user.id)
        );
      });
    } else {
      // Fetch today's classes from data provider
      try {
        const provider = this.getProvider();
        const today = new Date().toISOString().split("T")[0];
        const todayClassesResult = await provider.classes.findByDateRange(
          today,
          today
        );
        todayClasses = todayClassesResult.filter((session) =>
          session.registeredParticipantsIds.includes(user.id)
        );
      } catch (error) {
        console.warn(
          "[ValidationService] Could not fetch today's classes for validation:",
          error
        );
        // Continue without this validation if data fetch fails
      }
    }

    const maxBookingsPerDay =
      user.membership.centerConfig.maxBookingsPerDay || 2;

    if (todayClasses.length >= maxBookingsPerDay) {
      return {
        canRegister: false,
        reason: `Ya tienes ${maxBookingsPerDay} clases inscritas para hoy`,
      };
    }

    return { canRegister: true };
  }

  /**
   * Valida si un usuario puede cancelar una clase usando las reglas específicas de la disciplina
   */
  static canUserCancelClassWithRules(
    user: FitCenterUserProfile,
    classSession: ClassSession,
    discipline: Discipline
  ): CancellationValidation {
    const now = new Date();
    const classStart = parseISO(classSession.dateTime);
    const classTime = classSession.dateTime.split("T")[1].substring(0, 5); // "08:00"

    // 1. Verificar si el usuario está inscrito
    if (!classSession.registeredParticipantsIds.includes(user.id)) {
      return {
        canCancel: false,
        reason: "No estás inscrito a esta clase",
        hoursBefore: 0,
      };
    }

    // 2. Verificar si la clase ya pasó
    if (isAfter(now, classStart)) {
      return {
        canCancel: false,
        reason: "No puedes cancelar una clase que ya comenzó",
        hoursBefore: 0,
      };
    }

    // 3. Obtener regla de cancelación aplicable
    const { hoursBefore, reason } = getCancellationRule(classTime, discipline);
    const cancellationDeadline = addHours(classStart, -hoursBefore);

    // 4. Verificar si ya pasó el plazo de cancelación
    if (isAfter(now, cancellationDeadline)) {
      const timeUntilDeadline = formatDistanceToNow(cancellationDeadline, {
        addSuffix: true,
        includeSeconds: false,
      });

      return {
        canCancel: false,
        reason: `Ya pasó el plazo de cancelación (${timeUntilDeadline})`,
        timeUntilDeadline: "Ya pasó el plazo",
        deadline: cancellationDeadline,
        hoursBefore,
      };
    }

    // 5. Calcular tiempo restante para cancelar
    const hoursRemaining = differenceInHours(cancellationDeadline, now);
    const minutesRemaining =
      differenceInMinutes(cancellationDeadline, now) % 60;

    let timeUntilDeadline = "";
    if (hoursRemaining > 0) {
      timeUntilDeadline = `${hoursRemaining}h ${
        minutesRemaining > 0 ? `${minutesRemaining}m` : ""
      }`.trim();
    } else {
      timeUntilDeadline = `${minutesRemaining}m`;
    }

    return {
      canCancel: true,
      reason,
      timeUntilDeadline,
      deadline: cancellationDeadline,
      hoursBefore,
    };
  }

  /**
   * Valida si un usuario puede cancelar una clase (versión simple)
   */
  static canUserCancelClass(
    user: FitCenterUserProfile,
    classSession: ClassSession
  ): { canCancel: boolean; reason?: string } {
    const now = new Date();
    const classStart = parseISO(classSession.dateTime);

    // 1. Verificar si el usuario está inscrito
    if (!classSession.registeredParticipantsIds.includes(user.id)) {
      return { canCancel: false, reason: "No estás inscrito a esta clase" };
    }

    // 2. Verificar si la clase ya pasó
    if (isAfter(now, classStart)) {
      return {
        canCancel: false,
        reason: "No puedes cancelar una clase que ya comenzó",
      };
    }

    // 3. Verificar política de cancelación
    const cancellationHours =
      user.membership.centerConfig.cancellationHours || 2;
    const cancellationDeadline = addHours(classStart, -cancellationHours);

    if (isAfter(now, cancellationDeadline)) {
      return {
        canCancel: false,
        reason: `Solo puedes cancelar hasta ${cancellationHours} horas antes de la clase`,
      };
    }

    return { canCancel: true };
  }
}
