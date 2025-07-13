"use client";

import { useState } from "react";
import { parseISO, isToday } from "date-fns";
import { ClassStatusBadge } from "@/components/class-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  formatTimeLocal,
  formatWeekday,
  formatDayMonth,
  isClassPast,
} from "@/lib/utils";
import type { ClassListItem } from "@/lib/types";

export interface AdminClassCardProps {
  classItem: ClassListItem;
  onViewClass: (classItem: ClassListItem) => void;
  onCancelClass?: (classId: string) => void;
}

export default function AdminClassCard({
  classItem,
  onViewClass,
  onCancelClass,
}: AdminClassCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Validación de datos de entrada
  if (!classItem || !classItem.dateTime) {
    console.error("AdminClassCard: Datos de clase inválidos", classItem);
    return null;
  }

  const expired = classItem.status === "cancelled";
  const isCancelled = classItem.status === "cancelled";
  const isFinished = false; // Se maneja dinámicamente en el componente ClassStatusBadge
  const classDateTime = parseISO(classItem.dateTime);
  const formattedTime = formatTimeLocal(classItem.dateTime);
  const isClassToday = isToday(classDateTime);
  const isPastClass = isClassPast(classItem.dateTime); // Clase pasada usando la nueva función

  const handleCancelClass = () => {
    if (onCancelClass && !isFinished) {
      onCancelClass(classItem.id);
    }
    setShowCancelDialog(false);
  };

  return (
    <>
      <div
        className={`
          border rounded-lg p-3 transition-all duration-200 relative
          ${
            isCancelled
              ? "opacity-20 bg-white"
              : isPastClass
              ? "opacity-50 border-gray-100 bg-white"
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

        {/* Layout principal con flex */}
        <div className="flex items-center gap-4">
          {/* Contenido a la izquierda */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
              <span className="text-sm text-gray-500">
                {classItem.duration}
              </span>
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

          {/* Botones a la derecha */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewClass(classItem)}
            >
              Ver Detalles
            </Button>
            {!isCancelled && !isFinished && !isPastClass && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de confirmación de cancelación */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar clase?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cancelar la clase de{" "}
              <strong>{classItem.name}</strong> el{" "}
              {formatWeekday(classItem.dateTime)}{" "}
              {formatDayMonth(classItem.dateTime)} a las {formattedTime}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelClass}>
              Sí, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
