"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MembershipPlan } from "@/lib/types";
import { useMemo } from "react";

interface MembershipDatePickerProps {
  selectedPlan?: MembershipPlan;
  value: string; // La fecha de inicio en formato "YYYY-MM-DD"
  onValueChange: (newDate: string) => void; // Callback para notificar el cambio de fecha
  className?: string;
}

export function MembershipDatePicker({
  selectedPlan,
  value,
  onValueChange,
  className = "",
}: MembershipDatePickerProps) {
  // El componente ahora es controlado. La fecha se deriva directamente del prop `value`.
  // El .replace() es crucial para evitar problemas de zona horaria en Safari.
  const startDate = useMemo(
    () => (value ? new Date(value.replace(/-/g, "/")) : new Date()),
    [value]
  );

  // Calcular fecha de término automáticamente
  const endDateStr = useMemo(() => {
    if (!selectedPlan) return "";
    // Simple calculation for now
    const start = new Date(value);
    const end = new Date(start);
    end.setMonth(end.getMonth() + selectedPlan.durationInMonths);
    return end.toISOString().split("T")[0];
  }, [selectedPlan, value]);

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      // Notificar al padre con la nueva fecha en formato YYYY-MM-DD
      onValueChange(date.toISOString().split("T")[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate) {
      onValueChange(newDate);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Inicio del Período *</Label>
          <div className="flex gap-2">
            <Input
              id="startDate"
              type="date"
              value={value}
              onChange={handleInputChange}
              className="flex-1"
              required
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  className="shrink-0"
                >
                  <CalendarIcon className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {!selectedPlan && (
            <p className="text-xs text-amber-600 mt-1">
              💡 Selecciona un plan para ver la fecha de término calculada
            </p>
          )}
          {selectedPlan && (
            <p className="text-xs text-muted-foreground mt-1">
              ✅ Puedes elegir cualquier fecha pasada o futura como inicio del
              período
            </p>
          )}
        </div>

        <div>
          <Label>Fin del Período</Label>
          <Input
            value={
              endDateStr
                ? format(new Date(endDateStr.replace(/-/g, "/")), "PPP", {
                    locale: es,
                  })
                : "Selecciona un plan"
            }
            readOnly
            className="bg-gray-50"
          />
        </div>
      </div>

      {/* Vista previa detallada */}
      {selectedPlan && endDateStr && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-800">
              Detalles de la membresía:
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <span className="font-medium">Plan:</span> {selectedPlan.name}
              </div>
              <div>
                <span className="font-medium">Duración:</span>{" "}
                {selectedPlan.durationInMonths === 0.5
                  ? "Quincena (15 días)"
                  : selectedPlan.durationInMonths === 1
                  ? "1 mes"
                  : selectedPlan.durationInMonths + " meses"}
              </div>
              <div>
                <span className="font-medium">Precio:</span> $
                {selectedPlan.price.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Clases incluidas:</span>{" "}
                {selectedPlan.classLimit}
              </div>
            </div>
            <div className="pt-2 border-t border-blue-200">
              <div className="text-sm">
                <span className="font-medium">Período:</span>{" "}
                {format(startDate, "PPP", { locale: es })} -{" "}
                {format(new Date(endDateStr.replace(/-/g, "/")), "PPP", {
                  locale: es,
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional */}
      {selectedPlan && (
        <div className="text-xs text-gray-600 space-y-1">
          <p>
            • La fecha de término se calcula automáticamente según la duración
            del plan
          </p>
          <p>
            • Si el día de inicio no existe en el mes de término, se usa el
            último día del mes
          </p>
          <p>• Ejemplo: 31 de enero → 28/29 de febrero (según año bisiesto)</p>
        </div>
      )}
    </div>
  );
}
