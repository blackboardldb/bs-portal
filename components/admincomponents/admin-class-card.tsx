"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, parseISO, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { ClassItem } from "@/lib/mock-data";
import { ClassStatusBadge } from "@/components/class-status-badge";
import { Clock, Clock3, Users, CircleUser, X } from "lucide-react";

export interface AdminClassCardProps {
  classItem: ClassItem;
  onViewClass: (classItem: ClassItem) => void;
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
  const formattedTime = format(classDateTime, "p", { locale: es });
  const isClassToday = isToday(classDateTime);

  const handleCancelClass = () => {
    if (onCancelClass && !isFinished) {
      onCancelClass(classItem.id);
    }
    setShowCancelDialog(false);
  };

  return (
    <div
      className={`
        border rounded-lg p-3 transition-all duration-200 relative
        ${
          expired
            ? "opacity-20 bg-white"
            : "border-gray-100 hover:shadow-md hover:border-gray-300 bg-white"
        }
      `}
      key={classItem.id}
    >
      <div className="flex flex-row items-center justify-between gap-4">
        {/* Hora */}
        <div className="flex-1">
          {/* Time and badge */}
          <div
            className={`
              flex items-center gap-1
              ${expired ? "text-gray-600" : "text-blue-600"}
            `}
          >
            <Clock className="w-4 h-4" />
            <span className="text-xl font-bold">{formattedTime}</span>

            {/* Badge de estado: Hoy */}
            {isClassToday && !expired && (
              <div className="text-xs font-bold p-1 px-1.5 text-center rounded-full bg-green-500 text-white">
                Hoy
              </div>
            )}

            {/* Badge de estado dinámico */}
            <ClassStatusBadge classItem={classItem} />
          </div>

          {/* Título de la clase */}
          <h4
            className={`
              text-lg md:text-xl font-semibold
              ${expired ? "text-gray-600" : "text-gray-900"}
            `}
          >
            {classItem.name}
          </h4>

          {/* Información adicional: duración, alumnos, instructor */}
          <div
            className={`flex flex-wrap items-center gap-x-4 mt-1 text-xs md:text-sm ${
              expired ? "text-zinc-500" : "text-zinc-500"
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
            <>
              <Button
                variant="default"
                className="w-auto bg-lime-500 text-black hover:bg-lime-600"
                size="sm"
                onClick={() => onViewClass(classItem)}
              >
                Ver clase
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowCancelDialog(true)}
                className="w-auto"
                disabled={isFinished}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Dialog de confirmación para cancelar clase */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Clase</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que quieres cancelar la clase &quot;
              {classItem.name}&quot; del{" "}
              {format(classDateTime, "EEEE dd 'de' MMMM", { locale: es })} a las{" "}
              {formattedTime}?
              <br />
              <br />
              Esta acción no se puede deshacer y se devolverán las clases a
              todos los alumnos inscritos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCancelClass}>
              Sí, cancelar clase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
