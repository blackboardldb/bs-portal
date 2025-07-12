// src/components/stats-drawer.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  BarChart3,
  Target,
  Flame,
  Zap,
  TrendingUp,
  Sunrise,
  Moon,
  CalendarDays,
  Trophy,
  Crown,
  Star,
  Heart,
} from "lucide-react";
import type { FitCenterUserProfile } from "@/lib/types";

interface StatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userData: FitCenterUserProfile;
}

export function StatsDrawer({ isOpen, onClose, userData }: StatsDrawerProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Pause className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activo";
      case "expired":
        return "Expirado";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  // Calcular estadísticas adicionales
  const currentStats = userData.membership.centerStats.currentMonth;
  const lifetimeStats = userData.membership.centerStats.lifetimeStats;
  const estimatedTotalHours = lifetimeStats.totalClasses;

  // Métricas semanales (simuladas basadas en datos mensuales)
  const weeklyStats = {
    classesThisWeek: Math.floor(currentStats.classesAttended / 4), // Aproximación
    targetThisWeek: Math.floor(currentStats.classesContracted / 4),
    streak: Math.min(currentStats.classesAttended, 7), // Máximo 7 días
    consistency:
      (currentStats.classesAttended / currentStats.classesContracted) * 100,
  };

  // Logros y métricas con iconos
  const achievements = [
    {
      id: "weekly_goal",
      title: "Meta Semanal",
      description: "Asistir a 3+ clases esta semana",
      icon: Target,
      achieved: weeklyStats.classesThisWeek >= 3,
      value: `${weeklyStats.classesThisWeek}/${weeklyStats.targetThisWeek}`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "streak_3",
      title: "Racha de 3 Días",
      description: "3 días consecutivos de entrenamiento",
      icon: Flame,
      achieved: weeklyStats.streak >= 3,
      value: `${weeklyStats.streak} días`,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      id: "streak_7",
      title: "Racha de 1 Semana",
      description: "7 días consecutivos de entrenamiento",
      icon: Zap,
      achieved: weeklyStats.streak >= 7,
      value: `${weeklyStats.streak} días`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      id: "consistency_80",
      title: "Consistencia 80%+",
      description: "Mantener 80% de asistencia",
      icon: TrendingUp,
      achieved: weeklyStats.consistency >= 80,
      value: `${Math.round(weeklyStats.consistency)}%`,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      id: "remaining_classes",
      title: "Clases Restantes",
      description: "Aprovechar todas las clases del plan",
      icon: Target,
      achieved: currentStats.remainingClasses === 0,
      value: `${currentStats.remainingClasses} restantes`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      id: "early_bird",
      title: "Madrugador",
      description: "Asistir a 2+ clases antes de las 8 AM",
      icon: Sunrise,
      achieved: Math.random() > 0.5, // Simulado
      value: "2 clases",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      id: "night_owl",
      title: "Nocturno",
      description: "Asistir a 2+ clases después de las 8 PM",
      icon: Moon,
      achieved: Math.random() > 0.5, // Simulado
      value: "1 clase",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
    },
    {
      id: "weekend_warrior",
      title: "Guerrero de Fin de Semana",
      description: "Asistir a clases los sábados y domingos",
      icon: CalendarDays,
      achieved: Math.random() > 0.3, // Simulado
      value: "2/2 días",
      color: "text-pink-600",
      bgColor: "bg-pink-100",
    },
    {
      id: "lifetime_50",
      title: "50 Clases Totales",
      description: "Completar 50 clases en total",
      icon: Trophy,
      achieved: lifetimeStats.totalClasses >= 50,
      value: `${lifetimeStats.totalClasses} clases`,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      id: "lifetime_100",
      title: "Centenario",
      description: "Completar 100 clases en total",
      icon: Crown,
      achieved: lifetimeStats.totalClasses >= 100,
      value: `${lifetimeStats.totalClasses} clases`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      id: "perfect_month",
      title: "Mes Perfecto",
      description: "100% de asistencia en un mes",
      icon: Star,
      achieved: currentStats.classesAttended === currentStats.classesContracted,
      value: `${currentStats.classesAttended}/${currentStats.classesContracted}`,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      id: "loyal_member",
      title: "Miembro Leal",
      description: "6+ meses como miembro activo",
      icon: Heart,
      achieved: userData.membership.centerStats.totalMonthsActive >= 6,
      value: `${userData.membership.centerStats.totalMonthsActive} meses`,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Mis Estadísticas Detalladas
          </DrawerTitle>
          <DrawerDescription>
            Resumen completo de tu actividad, progreso y logros
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto space-y-6">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Target className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {lifetimeStats.totalClasses}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Clases totales
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Flame className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {weeklyStats.streak}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Racha actual
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Logros */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Logros</h3>
            <div className="grid grid-cols-1 gap-3">
              {achievements.map((achievement) => {
                const IconComponent = achievement.icon;
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg border ${
                      achievement.achieved
                        ? `${achievement.bgColor} border-green-200`
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-full ${
                          achievement.achieved
                            ? achievement.bgColor
                            : "bg-gray-100"
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 ${
                            achievement.achieved
                              ? achievement.color
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <Badge
                            variant={
                              achievement.achieved ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {achievement.value}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
