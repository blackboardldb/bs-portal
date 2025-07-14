"use client";

import type { ClassItem } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { parseISO, addMinutes, isAfter } from "date-fns";

interface ClassStatusBadgeProps {
  classItem: ClassItem;
}

export function ClassStatusBadge({ classItem }: ClassStatusBadgeProps) {
  const now = new Date();

  // Estados específicos
  if (classItem.status === "cancelled") {
    return <Badge variant="destructive">Cancelada</Badge>;
  }

  if (classItem.status === "completed") {
    return <Badge variant="outline">Finalizada</Badge>;
  }

  if (classItem.status === "in_progress") {
    return (
      <Badge variant="default" className="bg-green-600 text-white">
        En curso
      </Badge>
    );
  }

  // Verificar si la clase ya finalizó (para clases scheduled)
  if (classItem.status === "scheduled") {
    const start = parseISO(classItem.dateTime);
    // Try to extract a number from duration, fallback to 60 if not present
    let duration = 60;
    if (typeof classItem.duration === "string") {
      const match = classItem.duration.match(/\d+/);
      if (match) {
        duration = parseInt(match[0], 10);
      }
    }
    const end = addMinutes(start, duration);

    if (isAfter(now, end)) {
      return <Badge variant="outline">Finalizada</Badge>;
    }
  }

  // No mostrar badge para clases normales (scheduled) que aún no han finalizado
  return null;
}
