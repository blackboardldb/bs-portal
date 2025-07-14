// src/components/class-list.tsx
"use client";

import { ClassCard } from "./ClassCard";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

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
}

interface ClassListProps {
  selectedDate: Date;
  classes: FormattedClassItem[];
  onRegister: (classItem: FormattedClassItem) => void;
  onCancel: (classItem: FormattedClassItem) => void;
  className?: string;
  isLoading?: boolean;
}

export default function ClassList({
  selectedDate,
  classes,
  onRegister,
  onCancel,
  className = "",
  isLoading = false,
}: ClassListProps) {
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
            Cargando clases...
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
    console.error("ClassList: Datos de clases inválidos", classes);
    return (
      <div className={`${className}`}>
        <div className="text-center py-16">
          <p className="text-gray-500">Error: Datos de clases inválidos</p>
        </div>
      </div>
    );
  }

  // Sort classes by time
  const sortedClasses = classes.sort((a, b) => {
    const timeA = parseISO(a.dateTime);
    const timeB = parseISO(b.dateTime);
    return timeA.getTime() - timeB.getTime();
  });

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="mb-3 text-gray-300">
        <span className="text-xs uppercase">{formatDate(selectedDate)}</span>
        <p className="text-base uppercase font-semibold">
          {sortedClasses.length} Clases disponibles
        </p>
      </div>

      {/* Class list */}
      <div className="space-y-4">
        {sortedClasses.length > 0 ? (
          sortedClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={classItem}
              onRegister={() => onRegister(classItem)}
              onCancel={() => onCancel(classItem)}
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
