"use client";

import { useState } from "react";
import { parseISO, isToday } from "date-fns";
import { ClassStatusBadge } from "@/components/class-status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Users } from "lucide-react";
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
  const isFinished = classItem.status === "completed"; // Verificar si está completada
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
        {/* Badge de estado - oculto para clases finalizadas */}
        {!isFinished && (
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
        )}

        {/* Layout principal con flex */}
        <div className="flex items-center gap-4">
          {/* Contenido a la izquierda */}
          <div className="flex-1">
            {/* Hora como badge CSS - con estado finalizado integrado */}
            <div
              className={`inline-block text-xs px-2 py-1 rounded-full mb-2 ${
                isFinished
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {formattedTime} {isFinished && "FINALIZADA"}
            </div>

            {/* Título principal - disciplina */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {classItem.name}
            </h3>

            {/* Información con iconos */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {/* Instructor - solo si tiene valor */}
              {classItem.instructor &&
                classItem.instructor !== "Por asignar" && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{classItem.instructor}</span>
                  </div>
                )}

              {/* Duración */}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{classItem.duration}</span>
              </div>

              {/* Capacidad */}
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{classItem.alumnRegistred}</span>
              </div>
            </div>

            {/* Indicador de clase de hoy */}
            {isClassToday && (
              <Badge variant="secondary" className="text-xs mt-2">
                Hoy
              </Badge>
            )}
          </div>

          {/* Botones a la derecha */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewClass(classItem)}
              className="opacity-100" // Mantener opacidad 100% siempre
            >
              Ver Clase
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
