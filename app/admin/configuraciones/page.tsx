"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useState } from "react";

export default function ConfiguracionesPage() {
  const { initialOrganization } = useBlackSheepStore();
  const [settings, setSettings] = useState({
    organizationName: initialOrganization?.name || "BlackSheep CrossFit",
    timezone: initialOrganization?.settings?.timezone || "America/Santiago",
    currency: initialOrganization?.settings?.currency || "CLP",
    language: initialOrganization?.settings?.language || "es",
    defaultCancellationHours:
      initialOrganization?.settings?.defaultCancellationHours || 2,
    maxBookingsPerDay: initialOrganization?.settings?.maxBookingsPerDay || 2,
    waitlistEnabled: initialOrganization?.settings?.waitlistEnabled || true,
  });

  const handleSave = () => {
    // Aquí implementarías la lógica para guardar en el store o API
    console.log("Configuración guardada:", settings);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Configuraciones</h1>
        <p className="text-muted-foreground">
          Configura los parámetros generales del sistema
        </p>
      </div>

      <div className="space-y-6">
        {/* Configuración General */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orgName">Nombre de la Organización</Label>
                <Input
                  id="orgName"
                  value={settings.organizationName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      organizationName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings({ ...settings, timezone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) =>
                    setSettings({ ...settings, currency: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="language">Idioma</Label>
                <Input
                  id="language"
                  value={settings.language}
                  onChange={(e) =>
                    setSettings({ ...settings, language: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Clases */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Clases</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cancellationHours">
                  Horas de Cancelación por Defecto
                </Label>
                <Input
                  id="cancellationHours"
                  type="number"
                  value={settings.defaultCancellationHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultCancellationHours: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxBookings">Máximo de Reservas por Día</Label>
                <Input
                  id="maxBookings"
                  type="number"
                  value={settings.maxBookingsPerDay}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxBookingsPerDay: parseInt(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="waitlist"
                checked={settings.waitlistEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, waitlistEnabled: checked })
                }
              />
              <Label htmlFor="waitlist">Habilitar Lista de Espera</Label>
            </div>
          </CardContent>
        </Card>

        {/* Horarios de Operación */}
        <Card>
          <CardHeader>
            <CardTitle>Horarios de Operación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialOrganization?.settings?.operatingHours?.map(
                (hour, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline">{hour.day}</Badge>
                      {hour.closed ? (
                        <span className="text-muted-foreground">Cerrado</span>
                      ) : (
                        <span>
                          {hour.open} - {hour.close}
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={!hour.closed}
                      onCheckedChange={(checked) => {
                        // Aquí implementarías la lógica para actualizar los horarios
                        console.log(`Actualizando ${hour.day}:`, checked);
                      }}
                    />
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="px-8">
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>
  );
}
