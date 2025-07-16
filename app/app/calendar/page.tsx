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
import { formatTimeLocal, formatWeekday } from "@/lib/utils";

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

  // Lógica para generar y fusionar clases - OPTIMIZADA para solo 3 semanas
  const unifiedClasses = useMemo(() => {
    if (!disciplines || disciplines.length === 0) return classSessions;

    const generatedClasses: ClassSession[] = [];

    // OPTIMIZACIÓN: Generar solo para 3 semanas (semana actual + 2 próximas)
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Lunes
    const threeWeeksEnd = addWeeks(currentWeekStart, 3); // 3 semanas desde hoy

    const daysInRange = eachDayOfInterval({
      start: currentWeekStart,
      end: threeWeeksEnd,
    });

    const dayMapping: DayOfWeek[] = [
      "dom",
      "lun",
      "mar",
      "mie",
      "jue",
      "vie",
      "sab",
    ];

    daysInRange.forEach((day) => {
      const dayOfWeek = dayMapping[getDay(day)];
      disciplines.forEach((discipline) => {
        const scheduleForDay = discipline.schedule?.find(
          (s) => s.day === dayOfWeek
        );
        if (scheduleForDay) {
          scheduleForDay.times.forEach((time: string) => {
            const [hour, minute] = time.split(":").map(Number);
            const classDateTime = new Date(
              day.getFullYear(),
              day.getMonth(),
              day.getDate(),
              hour,
              minute
            );

            generatedClasses.push({
              id: `gen_${discipline.id}_${format(
                classDateTime,
                "yyyy-MM-dd_HH-mm"
              )}`,
              organizationId: "org_blacksheep_001",
              disciplineId: discipline.id,
              name: discipline.name,
              dateTime: classDateTime.toISOString(),
              durationMinutes: 60,
              instructorId: "inst_vito_001", // Default instructor
              capacity: 15,
              registeredParticipantsIds: [],
              waitlistParticipantsIds: [],
              status: "scheduled",
              isGenerated: true,
            });
          });
        }
      });
    });

    // OPTIMIZACIÓN: Fusión eficiente de clases generadas y reales
    const classMap = new Map<string, ClassSession>();
    const realClassKeys = new Set<string>();

    // 1. Agregar todas las clases reales y guardar una clave única (disciplina + fecha/hora)
    classSessions.forEach((realClass) => {
      const realDateTime = new Date(realClass.dateTime);
      const key = `${realClass.disciplineId}_${format(
        realDateTime,
        "yyyy-MM-dd_HH-mm"
      )}`;
      realClassKeys.add(key);
      classMap.set(realClass.id, { ...realClass, isGenerated: false });
    });

    // 2. Agregar clases generadas solo si no existe una clase real para ese mismo horario
    generatedClasses.forEach((generatedClass) => {
      const classDateTime = new Date(generatedClass.dateTime);
      const classKey = `${generatedClass.disciplineId}_${format(
        classDateTime,
        "yyyy-MM-dd_HH-mm"
      )}`;

      if (!realClassKeys.has(classKey)) {
        classMap.set(generatedClass.id, generatedClass);
      }
    });

    return Array.from(classMap.values());
  }, [disciplines, classSessions, today, refreshTrigger]);

  // NOTA: Los estados se manejan dinámicamente en convertClassSessionToFormattedItem
  // para evitar bucles infinitos de actualización

  // Manejar cambio de fecha
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Transformar clases para la fecha seleccionada - MEJORADA con lógica de estados
  const getClassesForDate = useCallback(
    (date: Date): FormattedClassItem[] => {
      if (!currentUser) return [];
      const isPastDate = isBefore(date, today);
      const isToday = isSameDay(date, today);

      return unifiedClasses
        .filter((session) => {
          const sessionDate = new Date(session.dateTime);
          if (!isSameDay(sessionDate, date)) return false;

          // Lógica mejorada para días pasados: solo mostrar clases a las que se inscribió
          if (isPastDate) {
            return session.registeredParticipantsIds.includes(currentUser.id);
          }

          // Para hoy: mostrar todas las clases (scheduled, in_progress, completed)
          if (isToday) {
            return session.status !== "cancelled";
          }

          // Para futuro: mostrar solo clases programadas
          return session.status === "scheduled";
        })
        .sort((a, b) => {
          const timeA = parseISO(a.dateTime);
          const timeB = parseISO(b.dateTime);
          return timeA.getTime() - timeB.getTime();
        })
        .map(convertClassSessionToFormattedItem);
    },
    [unifiedClasses, convertClassSessionToFormattedItem, currentUser, today]
  );

  const currentClasses = getClassesForDate(selectedDate);

  const handleRegister = (classItem: FormattedClassItem) => {
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
      // Si es una clase generada, primero crearla en la base de datos
      let classId = selectedClass.id;
      if (selectedClass.id.startsWith("gen_")) {
        const createPayload = {
          startDate: selectedClass.dateTime.split("T")[0],
          endDate: selectedClass.dateTime.split("T")[0],
          disciplineId: selectedClass.id.split("_")[1], // Extraer disciplineId del ID generado
          instructorId: "inst_default",
          time: selectedClass.dateTime.split("T")[1].substring(0, 5),
          maxCapacity: 15,
        };

        const createResponse = await fetch("/api/classes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });

        if (createResponse.ok) {
          const createResult = await createResponse.json();
          classId = createResult.classes[0].id;
        } else {
          throw new Error("Error al crear la clase");
        }
      }

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
      // Verificar que la clase existe y no es generada
      if (selectedClass.id.startsWith("gen_")) {
        toast({
          title: "Error",
          description: "No se puede cancelar una clase no registrada.",
          variant: "destructive",
        });
        return;
      }

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
        <ClassList
          selectedDate={selectedDate}
          classes={getClassesForDate(selectedDate)}
          onRegister={handleRegister}
          onCancel={handleCancel}
          className="max-w-4xl mx-auto min-h-svh pb-20 px-4 py-6 md:px-6 md:py-8"
          isLoading={isLoading}
        />
      </div>

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
  );
}
