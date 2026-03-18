"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AdminWeeklyDatePicker from "@/components/admincomponents/admin-weekly-date-picker";
import AdminClassList from "@/components/admincomponents/admin-class-list";
import AdminClassDetailDrawer from "@/components/admincomponents/admin-class-detail-drawer";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { startOfDay, format, isPast } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassSession, ClassListItem, Discipline } from "@/lib/types";
import { toDateString, toTimeString, createLocalDate } from "@/lib/utils";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  getYear,
  getMonth,
} from "date-fns";
import type { DayOfWeek } from "@/lib/types";

// Utilidad para saber si una clase es pasada
const isClassPast = (dateTime: string | Date): boolean =>
  isPast(new Date(dateTime));

// Función simple para convertir fecha local a UTC ISO string
function localToUTC(date: Date): string {
  return new Date(date).toISOString();
}

// CONTEXTO: Este tipo se ha enriquecido para ser 100% compatible con AdminClassDetailDrawer.
// Ahora contiene toda la información necesaria para que el drawer muestre
// los detalles completos de la clase, sin necesidad de hacer otra llamada a la API.

export default function AdminClasesPage() {
  const {
    classSessions,
    disciplines,
    users,
    fetchClassSessions,
    fetchUsers,
    fetchDisciplines,
  } = useBlackSheepStore();

  const { toast } = useToast();

  // Estado de paginación
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  const today = startOfDay(new Date());

  // Inicializar la fecha seleccionada: usar hoy por defecto
  const [selectedDate, setSelectedDate] = useState<Date>(() => today);
  const [selectedClass, setSelectedClass] = useState<ClassListItem | null>(
    null
  );
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // CONTEXTO: Función de conversión enriquecida. Ahora busca también el instructor
  // y formatea más datos para que el ClassListItem sea completo y funcional con el drawer.
  const convertClassSessionToClassItem = useCallback(
    (session: ClassSession): ClassListItem => {
      const discipline = disciplines?.find(
        (d) => d.id === session.disciplineId
      );
      const instructor = users.find((u) => u.id === session.instructorId);
      const enrolled = session.registeredParticipantsIds.length;

      return {
        id: session.id,
        dateTime: session.dateTime,
        name: discipline?.name || session.name,
        instructor: instructor
          ? `${instructor.firstName} ${instructor.lastName}`
          : "Por asignar",
        duration: `${session.durationMinutes || 60} min`,
        alumnRegistred: `${enrolled}/${session.capacity || 15}`,
        isRegistered: false, // Relevante para la vista de alumno, no de admin.
        status: session.status,
        discipline: discipline?.name || session.name,
        disciplineId: session.disciplineId,
        date: toDateString(session.dateTime),
        time: toTimeString(session.dateTime),
        color: discipline?.color || "#666",
        capacity: session.capacity,
        enrolled: enrolled,
        registeredParticipantsIds: session.registeredParticipantsIds,
        waitlistParticipantsIds: session.waitlistParticipantsIds,
        notes: session.notes,
      };
    },
    [disciplines, users]
  );


  // Función para cargar clases con filtrado por fecha
  const loadClassesForDate = useCallback(async () => {
    setIsLoading(true);
    try {
      // Cargar datos básicos
      await fetchClassSessions();
      await fetchUsers();
      if (!disciplines || disciplines.length === 0) {
        await fetchDisciplines();
      }
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
    fetchClassSessions,
    fetchUsers,
    fetchDisciplines,
    disciplines?.length,
    toast,
  ]);

  // Cargar clases al montar el componente
  useEffect(() => {
    loadClassesForDate();
  }, [loadClassesForDate]);


  // Manejar cambio de fecha
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setPage(1); // Resetear a la primera página al cambiar fecha
  }, []);

  // CONTEXTO: Filtrado inteligente para optimizar performance y UX
  const activeClasses = useMemo(() => {
    return classSessions
      .filter((session: ClassSession) => {
        // Filtrar por fecha seleccionada
        const sessionDate = new Date(session.dateTime);
        const isSameDate =
          format(sessionDate, "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd");

        if (!isSameDate) return false;

        // Filtrar clases canceladas
        if (session.status === "cancelled") return false;

        return true;
      })
      .map(convertClassSessionToClassItem);
  }, [classSessions, selectedDate, convertClassSessionToClassItem]);

  // Implementar paginación correctamente
  const paginatedClasses = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return activeClasses.slice(startIndex, endIndex);
  }, [activeClasses, page, limit]);

  const totalPages = Math.ceil(activeClasses.length / limit);

  const handleViewClass = (classItem: ClassListItem) => {
    setSelectedClass(classItem);
    setIsDetailDrawerOpen(true);
  };

  const handleCancelClass = async (classId: string) => {
    try {
      // Para clases reales, usar la API
      const response = await fetch(`/api/classes/${classId}/admin/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Error al cancelar la clase");
      }

      toast({
        title: "Clase cancelada",
        description: "La clase ha sido cancelada exitosamente",
      });
    } catch (error) {
      console.error("Error canceling class:", error);
      toast({
        title: "Error",
        description: "Error al cancelar la clase",
        variant: "destructive",
      });
    }
  };

  const handleCloseDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedClass(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gestión de Clases</h1>
        <div className="text-sm text-muted-foreground flex items-center gap-4">
          <span>Herramienta operativa para instructores</span>
        </div>
      </div>

      {/* Selector de fecha semanal */}
      <AdminWeeklyDatePicker
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* Información de resultados */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {isLoading
            ? "Cargando clases..."
            : `Mostrando ${paginatedClasses.length} de ${
                activeClasses.length
              } clases para ${format(selectedDate, "dd/MM/yyyy")}`}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Lista de clases */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <AdminClassList
          classes={paginatedClasses}
          onViewClass={handleViewClass}
          onCancelClass={handleCancelClass}
        />
      )}

      {/* Drawer de detalles de clase */}
      <AdminClassDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={handleCloseDrawer}
        classItem={selectedClass}
        onCancelClass={handleCancelClass}
      />
    </div>
  );
}
