"use client";

import AdminClassCard from "@/components/admincomponents/admin-class-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import type { ClassListItem } from "@/lib/types";

interface AdminClassListProps {
  classes: ClassListItem[];
  onViewClass: (classItem: ClassListItem) => void;
  onCancelClass?: (classId: string) => void;
  className?: string;
  isLoading?: boolean;
}

export default function AdminClassList({
  classes,
  onViewClass,
  onCancelClass,
  className = "",
  isLoading = false,
}: AdminClassListProps) {
  // Mostrar skeleton loader mientras carga
  if (isLoading) {
    return (
      <div className={`${className}`}>
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
      {/* Class list */}
      <div className="space-y-4">
        {activeClasses.length > 0 ? (
          activeClasses.map((classItem) => (
            <AdminClassCard
              key={classItem.id}
              classItem={classItem}
              onViewClass={onViewClass}
              onCancelClass={onCancelClass}
            />
          ))
        ) : (
          <div className="text-center py-16 border border-zinc-800 rounded-lg bg-black">
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
