"use client";

import { InstructorsManager } from "../../../components/admincomponents/instructors-manager";

export default function InstructoresPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gestión de Instructores</h1>
        <p className="text-muted-foreground">
          Administra los instructores del centro
        </p>
      </div>
      <InstructorsManager />
    </div>
  );
}
