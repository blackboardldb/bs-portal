"use client";

import React, { useEffect } from "react";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddExpenseModal } from "./add-expense-modal";
import { Trash2 } from "lucide-react";

interface ExpensesManagerProps {
  selectedYear: number;
  selectedMonth: number; // 0-indexed (0 = enero, 11 = diciembre)
  selectedMonthName: string;
}

export function ExpensesManager({
  selectedYear,
  selectedMonth,
  selectedMonthName,
}: ExpensesManagerProps) {
  const egresos = useBlackSheepStore((s) => s.egresos);
  const fetchEgresos = useBlackSheepStore((s) => s.fetchEgresos);
  const deleteEgreso = useBlackSheepStore((s) => s.deleteEgreso);

  useEffect(() => {
    fetchEgresos();
  }, [fetchEgresos]);

  // Filtrar egresos del mes seleccionado
  const egresosMes = egresos.filter((e) => {
    const d = new Date(e.fecha);
    return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
  });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Egresos de {selectedMonthName}</CardTitle>
        <AddExpenseModal onSuccess={fetchEgresos} />
      </CardHeader>
      <CardContent>
        {egresosMes.length === 0 ? (
          <div className="text-muted-foreground">
            No hay egresos registrados en {selectedMonthName.toLowerCase()}.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {egresosMes.map((e) => (
              <li key={e.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{e.motivo}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.fecha).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">
                    ${e.monto.toLocaleString()}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteEgreso(e.id)}
                    title="Eliminar egreso"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
