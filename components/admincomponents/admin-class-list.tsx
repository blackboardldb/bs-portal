"use client";

import { ClassItem } from "@/lib/mock-data";
import AdminClassCard from "@/components/admincomponents/admin-class-card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

interface AdminClassListProps {
  selectedDate: Date;
  classes: ClassItem[];
  onViewClass: (classItem: ClassItem) => void;
  onCancelClass?: (classId: string) => void;
  className?: string;
  isLoading?: boolean;
}

export default function AdminClassList({
  selectedDate,
  classes,
  onViewClass,
  onCancelClass,
  className = "",
  isLoading = false,
}: AdminClassListProps) {
  // Función para formatear la fecha a un string legible
  const formatDate = (date: Date) => {
    return format(date, "EEEE dd 'de' MMMM", { locale: es });
  };

  // Mostrar skeleton loader mientras carga
  if (isLoading) {
    return (
      <div className={`${className}`}>
        {/* Header */}
        <div className="mb-3 text-gray-300">
          <span className="text-xs uppercase">{formatDate(selectedDate)}</span>
          <p className="text-base uppercase font-semibold">
            Clases programadas
          </p>
        </div>

        {/* Skeleton loaders */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Validación de datos de entrada
  if (!classes || !Array.isArray(classes)) {
    console.error("AdminClassList: Datos de clases inválidos", classes);
    return (
      <div className={`${className}`}>
        <div className="text-center py-16">
          <p className="text-gray-500">Error: Datos de clases inválidos</p>
        </div>
      </div>
    );
  }

  // Filtrar solo clases activas (no canceladas)
  const activeClasses = classes.filter((cls) => {
    if (!cls || !cls.dateTime) {
      console.warn("Clase inválida encontrada:", cls);
      return false;
    }
    return cls.status !== "cancelled";
  });

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-3 text-gray-300">
        <span className="text-xs uppercase">{formatDate(selectedDate)}</span>
        <p className="text-base uppercase font-semibold">Clases programadas</p>
      </div>

      {/* Class list */}
      <div className="space-y-4">
        {activeClasses.length > 0 ? (
          activeClasses.map((classItem) => (
            <AdminClassCard
              key={classItem.id}
              classItem={classItem}
              selectedDate={selectedDate}
              onViewClass={onViewClass}
              onCancelClass={onCancelClass}
            />
          ))
        ) : (
          <div className="text-center py-16 border border-zinc-800 rounded-lg">
            <Calendar className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <p className="text-gray-400 text-base">
              No hay clases disponibles para este día
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Selecciona otro día para ver las clases disponibles
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
