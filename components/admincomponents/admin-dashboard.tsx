"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, AlertTriangle, Zap, Heart } from "lucide-react";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import type { FitCenterUserProfile } from "@/lib/types";
import { useMemo, useEffect, useState } from "react";

export function AdminDashboard() {
  const { users = [], fetchUsers } = useBlackSheepStore();

  // Cargar datos de usuarios al montar el componente
  useEffect(() => {
    fetchUsers(1, 1000); // Cargar todos los usuarios para el dashboard
  }, [fetchUsers]);

  // Memoizar estadísticas principales
  const stats = useMemo(() => {
    const totalMembers = users.length;
    const activeMembers = users.filter(
      (s: FitCenterUserProfile) => s.membership?.status === "active"
    ).length;
    const inactiveMembers = users.filter(
      (s: FitCenterUserProfile) => s.membership?.status === "inactive"
    ).length;
    const frozenMembers = users.filter(
      (s: FitCenterUserProfile) => s.membership?.status === "frozen"
    ).length;
    const expiredMembers = users.filter(
      (s: FitCenterUserProfile) => s.membership?.status === "expired"
    ).length;
    return {
      totalMembers,
      activeMembers,
      inactiveMembers,
      frozenMembers,
      expiredMembers,
    };
  }, [users]);

  const {
    totalMembers,
    activeMembers,
    inactiveMembers,
    frozenMembers,
    expiredMembers,
  } = stats;

  // Memoizar cálculos de ingresos
  const revenueMetrics = useMemo(() => {
    const monthlyRevenue = users
      .filter((s: FitCenterUserProfile) => s.membership?.status === "active")
      .reduce((sum: number, student: FitCenterUserProfile) => {
        return sum + (student.membership?.monthlyPrice || 0);
      }, 0);

    return {
      monthlyRevenue,
    };
  }, [users]);

  const { monthlyRevenue } = revenueMetrics;

  // Tasa de retención (miembros activos vs total)
  const retentionRate =
    totalMembers > 0 ? ((activeMembers / totalMembers) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-6 mb-16">
      {/* Estadísticas Principales */}
      <div className="grid gap-2 grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Miembros
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} activos ({retentionRate}% retención)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Mensuales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeMembers} miembros activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membresías</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiredMembers}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Engagement */}
      <div className="grid gap-2 grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Nuevos Miembros
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tasa de Retención
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retentionRate}%</div>
            <p className="text-xs text-muted-foreground">Miembros activos</p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown por Estados */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Estados de Membresía</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Activos</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{activeMembers}</span>
                <Badge variant="outline">
                  {totalMembers > 0
                    ? Math.round((activeMembers / totalMembers) * 100)
                    : 0}
                  %
                </Badge>
              </div>
            </div>
            <Progress
              value={
                totalMembers > 0 ? (activeMembers / totalMembers) * 100 : 0
              }
              className="h-2"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Inactivos</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{inactiveMembers}</span>
                <Badge variant="outline">
                  {totalMembers > 0
                    ? Math.round((inactiveMembers / totalMembers) * 100)
                    : 0}
                  %
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Congelados</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{frozenMembers}</span>
                <Badge variant="outline">
                  {totalMembers > 0
                    ? Math.round((frozenMembers / totalMembers) * 100)
                    : 0}
                  %
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Expirados</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold">{expiredMembers}</span>
                <Badge variant="outline">
                  {totalMembers > 0
                    ? Math.round((expiredMembers / totalMembers) * 100)
                    : 0}
                  %
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
