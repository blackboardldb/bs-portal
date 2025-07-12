// src/components/ClassCard.tsx
"use client";

import { Button } from "@/components/ui/button";
import { format, parseISO, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, Clock3, Users, CircleUser } from "lucide-react";
import { ClassStatusBadge } from "./class-status-badge";

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
  const formattedTime = format(classDateTime, "p", { locale: es });
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
      <div className="flex flex-row items-center justify-between gap-4">
        {/* Hora */}
        <div className="flex-1">
          {/* Time and badge */}
          <div
            className={`
              flex items-center gap-1
              ${isCancelled ? "text-gray-600" : "text-blue-600"}
            `}
          >
            <Clock className="w-4 h-4" />
            <span className="text-xl font-bold">{formattedTime}</span>

            {/* Badge de estado: Hoy */}
            {isClassToday && !isCancelled && (
              <div className="text-xs font-bold p-1 px-1.5 text-center rounded-full bg-green-500 text-white">
                Hoy
              </div>
            )}

            {/* Badge de estado dinámico */}
            <ClassStatusBadge
              classItem={{
                id: classItem.id,
                dateTime: classItem.dateTime,
                name: classItem.name,
                instructor: classItem.instructor,
                duration: classItem.duration,
                alumnRegistred: classItem.alumnRegistred,
                isRegistered: classItem.isRegistered,
                status:
                  (classItem.status as
                    | "scheduled"
                    | "cancelled"
                    | "completed"
                    | "in_progress") || "scheduled",
              }}
            />
          </div>

          {/* Título de la clase */}
          <h4
            className={`
              text-lg md:text-xl font-semibold
              ${isCancelled ? "text-gray-600" : "text-gray-900"}
            `}
          >
            {classItem.name}
          </h4>

          {/* Información adicional: duración, alumnos, instructor */}
          <div
            className={`flex flex-wrap items-center gap-x-4 mt-1 text-xs md:text-sm ${
              isCancelled ? "text-zinc-500" : "text-zinc-500"
            }`}
          >
            <div className="flex items-center gap-1">
              <Clock3 className="w-3.5 h-3.5" />
              <span>{classItem.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{classItem.alumnRegistred} inscritos</span>
            </div>
            <div className="flex items-center gap-1">
              <CircleUser className="w-3.5 h-3.5" />
              <span>{classItem.instructor}</span>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex-shrink-0 flex gap-2">
          {isFinished ? (
            <span className="w-auto text-gray-500">Clase finalizada</span>
          ) : isCancelled ? (
            <span className="w-auto text-gray-500">Clase cancelada</span>
          ) : (
            <Button
              onClick={handleAction}
              variant={isRegistered ? "destructive" : "default"}
              size="sm"
              className="w-auto"
              disabled={isFinished}
            >
              {isRegistered ? "Cancelar" : "Registrarse"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
