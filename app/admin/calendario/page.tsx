"use client";

import { Calendar } from "@/components/admincomponents/calendar";

export default function CalendarioPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Calendario de Clases</h1>
        <p className="text-muted-foreground">
          Gestiona las clases programadas y visualiza métricas históricas
        </p>
      </div>
      <Calendar />
    </div>
  );
}
