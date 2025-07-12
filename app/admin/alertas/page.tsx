"use client";

import { Notifications } from "../../../components/admincomponents/notifications";

export default function AlertsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Notificaciones</h1>
        <p className="text-muted-foreground">
          Gestiona usuarios pendientes y monitorea alertas del sistema
        </p>
      </div>
      <Notifications />
    </div>
  );
}
