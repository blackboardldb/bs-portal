"use client";

import { Alerts } from "../../../components/admincomponents/alerts";

export default function AlertsPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Alertas del Sistema</h1>
        <p className="text-muted-foreground">
          Monitorea el estado del sistema y recibe notificaciones sobre eventos
          importantes
        </p>
      </div>
      <Alerts />
    </div>
  );
}
