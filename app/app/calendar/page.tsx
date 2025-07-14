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
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassSession } from "@/lib/types";
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
    createClassSession,
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

  // Obtener el usuario actual (emulando a Antonia)
  const currentUser = useMemo(
    () => users.find((user) => user.id === "usr_antonia_abc123"),
    [users]
  );

  // Función centralizada de conversión de datos
  const convertClassSessionToFormattedItem = useCallback(
    (session: ClassSession): FormattedClassItem => {
      if (!currentUser) return {} as FormattedClassItem; // Fallback
      const instructor = instructors.find(
        (inst) => inst.id === session.instructorId
      );
      const discipline = disciplines.find((d) => d.id === session.disciplineId);
      const instructorName = instructor
        ? `${instructor.firstName} ${instructor.lastName}`
        : "Por asignar";

      const isRegistered = session.registeredParticipantsIds.includes(
        currentUser.id
      );

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
        status: session.status || "scheduled",
      };
    },
    [instructors, disciplines, currentUser]
  );

  // Función para cargar clases con filtrado por fecha
  const loadClassesForDate = useCallback(async () => {
    try {
      // Cargar todos los datos necesarios para la vista
      if (users.length === 0) await fetchUsers();
      if (instructors.length === 0) await fetchInstructors();
      if (disciplines.length === 0) await fetchDisciplines();
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
    users.length,
    instructors.length,
    disciplines.length,
    classSessions.length,
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

  // Lógica para generar y fusionar clases
  const unifiedClasses = useMemo(() => {
    if (disciplines.length === 0) return classSessions;

    const generatedClasses: ClassSession[] = [];
    const startRange = startOfMonth(new Date());
    const endRange = new Date(startRange);
    endRange.setMonth(endRange.getMonth() + 2); // Generar para los próximos 2 meses

    const daysInRange = eachDayOfInterval({ start: startRange, end: endRange });
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

    // Fusionar clases generadas y reales
    const classMap = new Map<string, ClassSession>();
    generatedClasses.forEach((cls) => classMap.set(cls.id, cls));
    classSessions.forEach((cls) =>
      classMap.set(cls.id, { ...cls, isGenerated: false })
    );

    return Array.from(classMap.values());
  }, [disciplines, classSessions]);

  // Manejar cambio de fecha
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Transformar clases para la fecha seleccionada
  const getClassesForDate = useCallback(
    (date: Date): FormattedClassItem[] => {
      if (!currentUser) return [];
      const isPastDate = isBefore(date, today);

      return unifiedClasses
        .filter((session) => {
          const sessionDate = new Date(session.dateTime);
          if (!isSameDay(sessionDate, date)) return false;

          // Lógica para días pasados: solo mostrar clases a las que se inscribió
          if (isPastDate) {
            return session.registeredParticipantsIds.includes(currentUser.id);
          }
          // Para hoy y futuro, mostrar todas las clases no canceladas
          return session.status !== "cancelled";
        })
        .sort((a, b) => {
          const timeA = parseISO(a.dateTime);
          const timeB = parseISO(b.dateTime);
          return timeA.getTime() - timeB.getTime();
        });
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

    const classToUpdate = unifiedClasses.find(
      (cls) => cls.id === selectedClass.id
    );
    if (!classToUpdate) return;

    // Simulación de API
    if (classToUpdate.isGenerated) {
      // Si es generada, la creamos como "real" y añadimos al usuario
      const newRealClass: ClassSession = {
        ...classToUpdate,
        id: `cls_${Date.now()}`, // Nuevo ID real
        isGenerated: false,
        registeredParticipantsIds: [currentUser.id],
      };
      createClassSession(newRealClass);
    } else {
      // Si ya es real, solo actualizamos los participantes
      const updatedParticipants = [
        ...classToUpdate.registeredParticipantsIds,
        currentUser.id,
      ];
      updateClassSession(classToUpdate.id, {
        registeredParticipantsIds: updatedParticipants,
      });
    }

    toast({
      title: "Registro exitoso",
      description: "Te has registrado exitosamente en la clase",
    });

    closeRegistrationModal();
  };

  const confirmCancellation = async () => {
    if (!selectedClass || !currentUser) return;

    const classToUpdate = unifiedClasses.find(
      (cls) => cls.id === selectedClass.id
    );

    if (!classToUpdate || classToUpdate.isGenerated) {
      toast({
        title: "Error",
        description: "No se puede cancelar una clase no registrada.",
        variant: "destructive",
      });
      return;
    }

    // Simulación de API
    const updatedParticipants = classToUpdate.registeredParticipantsIds.filter(
      (id) => id !== currentUser.id
    );
    updateClassSession(classToUpdate.id, {
      registeredParticipantsIds: updatedParticipants,
    });

    toast({
      title: "Cancelación exitosa",
      description: "Has cancelado tu registro exitosamente",
    });

    closeCancellationModal();
  };

  const closeRegistrationModal = () => {
    setIsRegistrationModalOpen(false);
    setSelectedClass(null);
  };

  const closeCancellationModal = () => {
    setIsCancellationModalOpen(false);
    setSelectedClass(null);
  };

  // Mostrar skeleton loader mientras carga
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-12">
        <h1 className="text-4xl font-bold text-gray-900 pb-6 hidden sm:block">
          Reserva de clases
        </h1>
        <Skeleton className="h-40 w-full" />
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

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

        {/* Información de resultados */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <div className="text-sm text-gray-600">
            {isLoading
              ? "Cargando clases..."
              : `Mostrando ${
                  getClassesForDate(selectedDate).length
                } clases para ${format(selectedDate, "dd/MM/yyyy")}`}
          </div>
        </div>
      </div>

      <div className="bg-black">
        <ClassList
          selectedDate={selectedDate}
          classes={getClassesForDate(selectedDate).map(
            convertClassSessionToFormattedItem
          )}
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
