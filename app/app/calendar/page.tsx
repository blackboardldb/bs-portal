// src/app/calendario/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import WeeklyDatePicker from "@/components/weekly-date-picker";
import ClassList from "@/components/class-list";
import RegistrationModal from "@/components/registration-modal";
import CancellationModal from "@/components/cancellation-modal";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { startOfDay, isSameDay, parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassSession } from "@/lib/types";

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
  const { classSessions, instructors, disciplines, fetchClassSessions } =
    useBlackSheepStore();
  const { toast } = useToast();

  // Estado de paginación y loading
  const [isLoading, setIsLoading] = useState(false);
  const today = startOfDay(new Date());

  // Inicializar la fecha seleccionada: usar hoy por defecto
  const [selectedDate, setSelectedDate] = useState<Date>(() => today);
  const [selectedClass, setSelectedClass] = useState<FormattedClassItem | null>(
    null
  );
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);

  // Función centralizada de conversión de datos
  const convertClassSessionToFormattedItem = useCallback(
    (session: ClassSession): FormattedClassItem => {
      const instructor = instructors.find(
        (inst) => inst.id === session.instructorId
      );
      const discipline = disciplines.find((d) => d.id === session.disciplineId);
      const instructorName = instructor
        ? `${instructor.firstName} ${instructor.lastName}`
        : "Por asignar";

      const sessionDate = new Date(session.dateTime);
      const isRegistered =
        session.registeredParticipantsIds.includes("usr_antonia_abc123"); // TODO: Get current user

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
        formattedDayLabel: format(sessionDate, "EEEE", { locale: es }),
        formattedTime: format(sessionDate, "HH:mm", { locale: es }),
        status: session.status || "scheduled",
      };
    },
    [instructors, disciplines]
  );

  // Función para cargar clases con filtrado por fecha
  const loadClassesForDate = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchClassSessions();
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
  }, [fetchClassSessions, toast]);

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
      return (classSessions as ClassSession[])
        .filter((session) => {
          const sessionDate = new Date(session.dateTime);
          const now = new Date();
          return sessionDate >= now && isSameDay(sessionDate, date);
        })
        .map(convertClassSessionToFormattedItem)
        .sort((a, b) => {
          const timeA = parseISO(a.dateTime);
          const timeB = parseISO(b.dateTime);
          return timeA.getTime() - timeB.getTime();
        });
    },
    [classSessions, convertClassSessionToFormattedItem]
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
    if (!selectedClass) return;

    try {
      // Usar la API para registrar en la clase
      const response = await fetch(
        `/api/classes/${selectedClass.id}/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        toast({
          title: "Registro exitoso",
          description: "Te has registrado exitosamente en la clase",
        });

        // Refrescar las clases
        await loadClassesForDate();
      } else {
        const error = await response.json();
        toast({
          title: "Error al registrarse",
          description: error.error || "Error al registrarse en la clase",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error inesperado al registrarse:", error);
      toast({
        title: "Error inesperado",
        description: "Error inesperado al registrarse en la clase",
        variant: "destructive",
      });
    }

    closeRegistrationModal();
  };

  const confirmCancellation = async () => {
    if (!selectedClass) return;

    try {
      // Usar la API para cancelar registro
      const response = await fetch(`/api/classes/${selectedClass.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast({
          title: "Cancelación exitosa",
          description: "Has cancelado tu registro exitosamente",
        });

        // Refrescar las clases
        await loadClassesForDate();
      } else {
        const error = await response.json();
        toast({
          title: "Error al cancelar",
          description: error.error || "Error al cancelar el registro",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error inesperado al cancelar:", error);
      toast({
        title: "Error inesperado",
        description: "Error inesperado al cancelar el registro",
        variant: "destructive",
      });
    }

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
  if (isLoading && classSessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-12">
        <h1 className="text-4xl font-bold text-gray-900 pb-6 hidden sm:block">
          Reserva de clases
        </h1>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
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
              : `Mostrando ${currentClasses.length} clases para ${format(
                  selectedDate,
                  "dd/MM/yyyy"
                )}`}
          </div>
        </div>
      </div>

      <div className="bg-black">
        <ClassList
          selectedDate={selectedDate}
          classes={currentClasses}
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
