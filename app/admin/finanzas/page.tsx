"use client";

import React, { useState } from "react";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpensesManager } from "@/components/admincomponents/expenses-manager";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function FinanzasPage() {
  const users = useBlackSheepStore((s) => s.users);
  const egresos = useBlackSheepStore((s) => s.egresos);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  // Parsear mes seleccionado
  const [selectedYear, selectedMonthNum] = selectedMonth.split("-").map(Number);
  const selectedMonthIndex = selectedMonthNum - 1; // JavaScript months are 0-indexed

  // Filtrar ingresos del mes seleccionado
  const ingresosMes = users
    .filter(
      (u) =>
        u.membership &&
        u.membership.status === "active" &&
        u.membership.currentPeriodStart &&
        new Date(u.membership.currentPeriodStart).getFullYear() ===
          selectedYear &&
        new Date(u.membership.currentPeriodStart).getMonth() ===
          selectedMonthIndex
    )
    .map((u) => ({
      nombre: `${u.firstName} ${u.lastName}`,
      plan: u.membership?.membershipType,
      fecha: u.membership?.currentPeriodStart,
      precio: u.membership?.monthlyPrice,
    }));

  // Filtrar egresos del mes seleccionado
  const egresosMes = egresos.filter((e) => {
    const d = new Date(e.fecha);
    return (
      d.getFullYear() === selectedYear && d.getMonth() === selectedMonthIndex
    );
  });

  // Calcular totales
  const totalIngresos = ingresosMes.reduce(
    (sum, i) => sum + (i.precio || 0),
    0
  );
  const totalEgresos = egresosMes.reduce((sum, e) => sum + e.monto, 0);
  const balance = totalIngresos - totalEgresos;

  // Generar opciones de meses (últimos 12 meses)
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const value = `${year}-${String(month).padStart(2, "0")}`;
    const label = date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    });
    monthOptions.push({ value, label });
  }

  // Obtener el nombre del mes seleccionado
  const selectedMonthName = new Date(
    selectedYear,
    selectedMonthIndex
  ).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Seleccionar mes" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos de {selectedMonthName}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIngresos.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {ingresosMes.length} membresías activas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Egresos de {selectedMonthName}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${totalEgresos.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {egresosMes.length} gastos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign
              className={`h-4 w-4 ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                balance >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${balance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance >= 0 ? "Ganancia" : "Pérdida"} del mes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detalle de ingresos y egresos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingresos */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Ingresos de {selectedMonthName}</CardTitle>
          </CardHeader>
          <CardContent>
            {ingresosMes.length === 0 ? (
              <div className="text-muted-foreground">
                No hay ingresos registrados en {selectedMonthName.toLowerCase()}
                .
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {ingresosMes.map((i, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <div className="font-medium">{i.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.plan} |{" "}
                        {i.fecha && new Date(i.fecha).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="font-semibold">
                      ${i.precio?.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {/* Egresos */}
        <ExpensesManager
          selectedYear={selectedYear}
          selectedMonth={selectedMonthIndex}
          selectedMonthName={selectedMonthName}
        />
      </div>
    </div>
  );
}
