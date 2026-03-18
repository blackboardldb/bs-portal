// src/app/calendario/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import WeeklyDatePicker from "@/components/weekly-date-picker";
import ClassList from "@/components/class-list";
import RegistrationModal from "@/components/registration-modal";
import CancellationModal from "@/components/cancellation-modal";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import {
  startOfDay,
  isSameDay,
  parseISO,
  format,
  isBefore,
  startOfWeek,
  endOfWeek,
  addWeeks,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassSession, DayOfWeek, ClassStatus } from "@/lib/types";
import {
  formatTimeLocal,
  formatWeekday,
  getPlanStatus,
  canUserRegisterForClasses,
} from "@/lib/utils";

interface FormattedClassItem {
  id: string;
  dateTime: string;
  name: string;
  instructor: string;
  duration: string;
  alumnRegistred: string;
  isRegistered: boolean;
  formattedDayLabel: string;
  formattedTime: string;
  status?: string;
}

export default function CalendarPage() {
  const {
    users,
    classSessions,
    instructors,
    disciplines,
    fetchUsers,
    fetchInstructors,
    fetchDisciplines,
    fetchClassSessions,
    addClassSession,
    updateClassSession,
  } = useBlackSheepStore();

  const { toast } = useToast();

  // Estado de paginación y loading
  const [isLoading, setIsLoading] = useState(true);
  const today = startOfDay(new Date());

  // Inicializar la fecha seleccionada: usar hoy por defecto
  const [selectedDate, setSelectedDate] = useState<Date>(() => today);
  const [selectedClass, setSelectedClass] = useState<FormattedClassItem | null>(
    null
  );
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Obtener el usuario actual (emulando a Antonia)
  const currentUser = useMemo(
    () => users.find((user) => user.id === "usr_antonia_abc123"),
    [users]
  );

  // Verificar el estado del plan del usuario
  const planStatus = useMemo(() => {
    if (!currentUser) return "expired";
    return getPlanStatus(currentUser);
  }, [currentUser]);

  const canRegisterForClasses = useMemo(() => {
    if (!currentUser) return false;
    return canUserRegisterForClasses(currentUser);
  }, [currentUser]);

  // Función centralizada de conversión de datos - MEJORADA para manejar estados
  const convertClassSessionToFormattedItem = useCallback(
    (session: ClassSession): FormattedClassItem => {
      if (!currentUser) return {} as FormattedClassItem; // Fallback
      const instructor = instructors?.find(
        (inst) => inst.id === session.instructorId
      );
      const discipline = disciplines?.find(
        (d) => d.id === session.disciplineId
      );
      const instructorName = instructor
        ? `${instructor.firstName} ${instructor.lastName}`
        : "Por asignar";

      const isRegistered = session.registeredParticipantsIds.includes(
        currentUser.id
      );

      // Determinar el estado final considerando la hora actual
      let finalStatus = session.status || "scheduled";
      const now = new Date();
      const sessionDateTime = new Date(session.dateTime);
      const sessionEndTime = new Date(
        sessionDateTime.getTime() + (session.durationMinutes || 60) * 60000
      );

      // Lógica de estado en tiempo real
      if (session.status === "scheduled") {
        if (now > sessionEndTime) {
          finalStatus = "completed";
        } else if (now >= sessionDateTime && now <= sessionEndTime) {
          finalStatus = "in_progress";
        }
      }

      return {
        id: session.id,
        dateTime: session.dateTime,
        name: discipline?.name || session.name,
        instructor: instructorName,
        duration: "60 min",
        alumnRegistred: `${session.registeredParticipantsIds.length}/${
          session.capacity || 15
        }`,
        isRegistered,
        formattedDayLabel: formatWeekday(session.dateTime),
        formattedTime: formatTimeLocal(session.dateTime),
        status: finalStatus,
      };
    },
    [instructors, disciplines, currentUser]
  );

  // Función para cargar clases con filtrado por fecha
  const loadClassesForDate = useCallback(async () => {
    try {
      // Cargar todos los datos necesarios para la vista
      if (users.length === 0) await fetchUsers();
      if (!instructors || instructors.length === 0) await fetchInstructors();
      if (!disciplines || disciplines.length === 0) await fetchDisciplines();
      if (classSessions.length === 0) await fetchClassSessions();
    } catch (error) {
      console.error("Error loading classes:", error);
      toast({
        title: "Error",
        description: "Error al cargar las clases",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    users?.length,
    instructors?.length,
    disciplines?.length,
    classSessions?.length,
    fetchUsers,
    fetchInstructors,
    fetchDisciplines,
    fetchClassSessions,
    toast,
  ]);

  // Cargar clases al montar el componente
  useEffect(() => {
    loadClassesForDate();
  }, [loadClassesForDate]);

  // Manejar cambio de fecha
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Transformar clases para la fecha seleccionada
  const getClassesForDate = useCallback(
    (date: Date): FormattedClassItem[] => {
      if (!currentUser) return [];
      const isPastDate = isBefore(date, today);
      const isToday = isSameDay(date, today);

      // Determinar disciplinas permitidas
      const allowedDisciplines = (() => {
        if (!currentUser.membership) return null;
        const { disciplineAccess, allowedDisciplines: userAllowedDisciplines } =
          currentUser.membership.planConfig;
        
        if (disciplineAccess === "limited" && userAllowedDisciplines) {
          return userAllowedDisciplines;
        }
        return "all";
      })();

      return classSessions
        .filter((session) => {
          const sessionDate = new Date(session.dateTime);
          if (!isSameDay(sessionDate, date)) return false;

          // Filtrar por disciplinas permitidas
          if (allowedDisciplines !== "all" && allowedDisciplines !== null) {
            if (!allowedDisciplines.includes(session.disciplineId)) return false;
          }

          // Lógica para días pasados: mostrar solo clases inscritas
          if (isPastDate) {
            return session.registeredParticipantsIds.includes(currentUser.id);
          }

          // Para hoy: mostrar clases no canceladas
          if (isToday) {
            return session.status !== "cancelled";
          }

          // Para futuro: mostrar clases programadas
          return session.status === "scheduled";
        })
        .sort((a, b) => {
          const timeA = parseISO(a.dateTime);
          const timeB = parseISO(b.dateTime);
          return timeA.getTime() - timeB.getTime();
        })
        .map(convertClassSessionToFormattedItem);
    },
    [classSessions, convertClassSessionToFormattedItem, currentUser, today]
  );

  const currentClasses = getClassesForDate(selectedDate);

  const handleRegister = (classItem: FormattedClassItem) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario actual",
        variant: "destructive",
      });
      return;
    }

    // Verificar el estado del plan antes de permitir el registro
    const planStatus = getPlanStatus(currentUser);

    if (planStatus === "expired") {
      toast({
        title: "Plan expirado",
        description: "Debes renovar tu plan para poder inscribirte en clases",
        variant: "destructive",
      });
      return;
    }

    if (planStatus === "pending") {
      toast({
        title: "Plan pendiente de validación",
        description:
          "Tu plan está siendo validado. Pronto podrás reservar clases.",
        variant: "destructive",
      });
      return;
    }

    if (!canUserRegisterForClasses(currentUser)) {
      toast({
        title: "No puedes registrarte",
        description: "Tu plan actual no permite el registro en clases",
        variant: "destructive",
      });
      return;
    }

    setSelectedClass(classItem);
    setIsRegistrationModalOpen(true);
  };

  const handleCancel = (classItem: FormattedClassItem) => {
    setSelectedClass(classItem);
    setIsCancellationModalOpen(true);
  };

  const confirmRegistration = async () => {
    if (!selectedClass || !currentUser) return;

    try {
      const classId = selectedClass.id;

      // Registrar al usuario en la clase
      const response = await fetch(`/api/classes/${classId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (response.ok) {
        toast({
          title: "Registro exitoso",
          description: "Te has registrado exitosamente en la clase",
        });

        // Refrescar las clases para mostrar el cambio
        await fetchClassSessions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al registrarse en la clase");
      }
    } catch (error) {
      toast({
        title: "Error al registrarse",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const confirmCancellation = async () => {
    if (!selectedClass || !currentUser) return;

    try {
      // Verificar reglas de cancelación
      const discipline = disciplines?.find(
        (d) => selectedClass.name === d.name || selectedClass.id.includes(d.id)
      );

      if (discipline?.cancellationRules) {
        const classDateTime = new Date(selectedClass.dateTime);
        const now = new Date();
        const hoursUntilClass =
          (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Buscar regla aplicable para esta hora específica
        const applicableRule = discipline.cancellationRules.find((rule) =>
          selectedClass.formattedTime.startsWith(rule.time)
        );

        if (applicableRule && hoursUntilClass < applicableRule.hoursBefore) {
          toast({
            title: "No se puede cancelar",
            description: `Debes cancelar al menos ${applicableRule.hoursBefore} horas antes de la clase`,
            variant: "destructive",
          });
          return;
        }
      }

      // Cancelar la inscripción usando la API
      const response = await fetch(`/api/classes/${selectedClass.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });

      if (response.ok) {
        toast({
          title: "Cancelación exitosa",
          description: "Has cancelado tu registro exitosamente",
        });

        // Refrescar las clases para mostrar el cambio
        await fetchClassSessions();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al cancelar la inscripción");
      }
    } catch (error) {
      toast({
        title: "Error al cancelar",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    }
  };

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
    setSelectedClass(null);
  };

  const closeCancellationModal = () => {
    setIsCancellationModalOpen(false);
    setSelectedClass(null);
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-12">
        <h1 className="text-4xl font-bold text-gray-900 pb-6 hidden sm:block">
          Reserva de clases
        </h1>
        <WeeklyDatePicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          className=""
        />
      </div>

      <div className="bg-black">
        {/* Plan Status Banner */}
        {planStatus !== "active" && (
          <div className="max-w-4xl mx-auto px-4 py-3 md:px-6">
            {planStatus === "pending" ? (
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3 mb-4">
                <p className="text-yellow-200 text-sm font-medium mb-1">
                  Plan pendiente de validación
                </p>
                <p className="text-yellow-300 text-xs">
                  Pronto podrás reservar tus clases. Tu plan está siendo
                  validado por nuestro equipo.
                </p>
              </div>
            ) : (
              <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-3 mb-4">
                <p className="text-orange-200 text-sm font-medium mb-1">
                  Plan expirado
                </p>
                <p className="text-orange-300 text-xs">
                  Renueva tu plan para poder inscribirte en clases.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mostrar clases solo si el plan está activo */}
        {planStatus === "active" && (
          <ClassList
            selectedDate={selectedDate}
            classes={getClassesForDate(selectedDate)}
            onRegister={handleRegister}
            onCancel={handleCancel}
            className="max-w-4xl mx-auto min-h-svh pb-20 px-4 py-6 md:px-6 md:py-8"
            isLoading={isLoading}
            canRegister={canRegisterForClasses}
            planStatus={planStatus}
          />
        )}
      </div>

      {/* Modales solo si el plan está activo */}
      {planStatus === "active" && (
        <>
          <RegistrationModal
            isOpen={isRegistrationModalOpen}
            onClose={closeRegistrationModal}
            classItem={selectedClass}
            onConfirm={confirmRegistration}
          />
          <CancellationModal
            isOpen={isCancellationModalOpen}
            onClose={closeCancellationModal}
            classItem={selectedClass}
            onConfirm={confirmCancellation}
          />
        </>
      )}
    </>
  );
}
