// src/components/ClassCard.tsx
"use client";

import { useState } from "react";
import { parseISO, isToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClassStatusBadge } from "@/components/class-status-badge";
import { formatTimeLocal, formatWeekday, formatDayMonth } from "@/lib/utils";

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

interface ClassCardProps {
  classItem: FormattedClassItem;
  onRegister: () => void;
  onCancel: () => void;
}

export function ClassCard({ classItem, onRegister, onCancel }: ClassCardProps) {
  // Validación de datos de entrada
  if (!classItem || !classItem.dateTime) {
    console.error("ClassCard: Datos de clase inválidos", classItem);
    return null;
  }

  const isRegistered = classItem.isRegistered;
  const isCancelled = classItem.status === "cancelled";
  const isFinished = false; // Se maneja dinámicamente en el componente ClassStatusBadge
  const classDateTime = parseISO(classItem.dateTime);
  const formattedTime = formatTimeLocal(classItem.dateTime);
  const isClassToday = isToday(classDateTime);

  const handleAction = () => {
    if (isRegistered) {
      onCancel();
    } else {
      onRegister();
    }
  };

  return (
    <div
      className={`
        border rounded-lg p-3 transition-all duration-200 relative
        ${
          isCancelled
            ? "opacity-20 bg-white"
            : "border-gray-100 hover:shadow-md hover:border-gray-300 bg-white"
        }
      `}
    >
      {/* Badge de estado */}
      <div className="absolute top-2 right-2">
        <ClassStatusBadge
          classItem={{
            ...classItem,
            status: classItem.status as
              | "scheduled"
              | "cancelled"
              | "completed"
              | "in_progress"
              | undefined,
          }}
        />
      </div>

      {/* Información principal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
          <span className="text-sm text-gray-500">{classItem.duration}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{classItem.instructor}</span>
          <span className="text-gray-500">{classItem.alumnRegistred}</span>
        </div>

        {/* Fecha y hora */}
        <div className="text-sm text-gray-600">
          <div className="font-medium">
            {formatWeekday(classItem.dateTime)}{" "}
            {formatDayMonth(classItem.dateTime)}
          </div>
          <div className="text-gray-500">a las {formattedTime}</div>
        </div>

        {/* Indicador de clase de hoy */}
        {isClassToday && (
          <Badge variant="secondary" className="text-xs">
            Hoy
          </Badge>
        )}
      </div>

      {/* Botones de acción */}
      <div className="mt-3 flex gap-2">
        <Button
          variant={isRegistered ? "destructive" : "default"}
          size="sm"
          onClick={handleAction}
          className="flex-1"
          disabled={isCancelled || isFinished}
        >
          {isRegistered ? "Cancelar" : "Inscribirse"}
        </Button>
      </div>
    </div>
  );
}
