"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import AdminWeeklyDatePicker from "@/components/admincomponents/admin-weekly-date-picker";
import AdminClassList from "@/components/admincomponents/admin-class-list";
import AdminClassDetailDrawer from "@/components/admincomponents/admin-class-detail-drawer";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { startOfDay, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { ClassSession } from "@/lib/types";

// Definir el tipo para los elementos de la lista
interface ClassListItem {
  id: string;
  dateTime: string;
  name: string;
  instructor: string;
  duration: string;
  alumnRegistred: string;
  isRegistered: boolean;
}

export default function AdminClasesPage() {
  const { classSessions, disciplines, fetchClassSessions } =
    useBlackSheepStore();

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

  // Local conversion function con tipo específico
  const convertClassSessionToClassItem = (
    session: ClassSession
  ): ClassListItem => {
    const discipline = disciplines.find((d) => d.id === session.disciplineId);
    return {
      id: session.id,
      dateTime: session.dateTime,
      name: discipline?.name || session.name,
      instructor: "Por asignar",
      duration: "60 min",
      alumnRegistred: session.registeredParticipantsIds.length.toString(),
      isRegistered: false,
    };
  };

  // Función para cargar clases con filtrado por fecha
  const loadClassesForDate = useCallback(async () => {
    setIsLoading(true);
    try {
      // Formatear fecha para la API (YYYY-MM-DD)
      const startDate = format(selectedDate, "yyyy-MM-dd");
      const endDate = format(selectedDate, "yyyy-MM-dd");

      // Usar la nueva API con filtrado por fecha
      await fetchClassSessions(startDate, endDate, page, limit);
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
  }, [fetchClassSessions, selectedDate, page, limit, toast]);

  // Cargar clases al montar el componente
  useEffect(() => {
    loadClassesForDate();
  }, [loadClassesForDate]);

  // Manejar cambio de fecha
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setPage(1); // Resetear a la primera página al cambiar fecha
  }, []);

  // Manejar cambio de página
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Filtrar solo clases no canceladas y usar la función centralizada de conversión
  // Usar useMemo para mejorar rendimiento
  const activeClasses = useMemo(
    () =>
      classSessions
        .filter((session) => session.status !== "cancelled")
        .map((session) => convertClassSessionToClassItem(session)),
    [classSessions, disciplines, convertClassSessionToClassItem] // Se recalcula solo si cambian las sesiones, disciplinas o la función de conversión
  );

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
    // Buscar la sesión de clase real en el store
    const session = classSessions.find((s) => s.id === classId);
    if (!session) {
      console.error("No se encontró la sesión de clase:", classId);
      toast({
        title: "Error",
        description: "No se encontró la sesión de clase",
        variant: "destructive",
      });
      return;
    }

    try {
      // Usar la API para cancelar la clase
      const response = await fetch(`/api/classes/${classId}/admin/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        toast({
          title: "Clase cancelada",
          description: "La clase ha sido cancelada exitosamente",
        });

        // Cerrar drawer si está abierto
        if (selectedClass && selectedClass.id === classId) {
          setIsDetailDrawerOpen(false);
          setSelectedClass(null);
        }

        // Refrescar las clases para la fecha actual
        await loadClassesForDate();
      } else {
        const error = await response.json();
        console.error("Error al cancelar clase:", error.error);
        toast({
          title: "Error al cancelar la clase",
          description: error.error || "Error al cancelar la clase",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error inesperado al cancelar clase:", error);
      toast({
        title: "Error inesperado",
        description: "Error inesperado al cancelar la clase",
        variant: "destructive",
      });
    }
  };

  const closeDetailDrawer = () => {
    setIsDetailDrawerOpen(false);
    setSelectedClass(null);
  };

  // Mostrar skeleton loader mientras carga
  if (isLoading && classSessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-3 sm:pt-12">
        <h1 className="text-4xl font-bold text-gray-900 pb-6 hidden sm:block">
          Gestión de Clases
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
          Gestión de Clases
        </h1>
        <AdminWeeklyDatePicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          className=""
        />

        {/* Información de resultados */}
        <div className="flex items-center justify-between mt-4 mb-2">
          <div className="text-sm text-gray-600">
            {isLoading
              ? "Cargando clases..."
              : `Mostrando ${paginatedClasses.length} de ${
                  activeClasses.length
                } clases para ${format(selectedDate, "dd/MM/yyyy")}`}
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1 || isLoading}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || isLoading}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-black">
        <AdminClassList
          selectedDate={selectedDate}
          classes={paginatedClasses}
          onViewClass={handleViewClass}
          onCancelClass={handleCancelClass}
          className="max-w-4xl mx-auto min-h-svh pb-20 px-4 py-6 md:px-6 md:py-8"
          isLoading={isLoading}
        />
      </div>

      <AdminClassDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={closeDetailDrawer}
        classItem={selectedClass}
        onCancelClass={handleCancelClass}
      />
    </>
  );
}
