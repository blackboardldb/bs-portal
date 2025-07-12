"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertTriangle,
  Clock,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Alert {
  id: string;
  type: "warning" | "error" | "info" | "success";
  title: string;
  description: string;
  timestamp: Date;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Alerts() {
  const { users, classSessions, disciplines } = useBlackSheepStore();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateAlerts();
  }, [users, classSessions]);

  const generateAlerts = () => {
    const newAlerts: Alert[] = [];
    const now = new Date();

    // Alertas de clases canceladas
    const cancelledClasses = classSessions.filter(
      (cls) => cls.status === "cancelled"
    );
    if (cancelledClasses.length > 0) {
      newAlerts.push({
        id: "cancelled-classes",
        type: "warning",
        title: "Clases Canceladas",
        description: `${cancelledClasses.length} clase(s) han sido canceladas recientemente`,
        timestamp: new Date(),
        action: {
          label: "Ver Detalles",
          onClick: () => {
            toast({
              title: "Clases Canceladas",
              description: `Hay ${cancelledClasses.length} clases canceladas en el sistema`,
            });
          },
        },
      });
    }

    // Alertas de clases con alta demanda
    const highDemandClasses = classSessions.filter(
      (cls) =>
        cls.status === "scheduled" &&
        cls.registeredParticipantsIds.length >= cls.capacity * 0.9
    );
    if (highDemandClasses.length > 0) {
      newAlerts.push({
        id: "high-demand",
        type: "info",
        title: "Clases con Alta Demanda",
        description: `${highDemandClasses.length} clase(s) están casi llenas`,
        timestamp: new Date(),
        action: {
          label: "Ver Clases",
          onClick: () => {
            toast({
              title: "Clases con Alta Demanda",
              description: `Hay ${highDemandClasses.length} clases que están casi al 90% de capacidad`,
            });
          },
        },
      });
    }

    // Alertas de usuarios con membresías próximas a vencer
    const expiringUsers = users.filter((user) => {
      if (!user.membership?.currentPeriodEnd) return false;
      const endDate = new Date(user.membership.currentPeriodEnd);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });

    if (expiringUsers.length > 0) {
      newAlerts.push({
        id: "expiring-memberships",
        type: "error",
        title: "Membresías por Vencer",
        description: `${expiringUsers.length} usuario(s) tienen membresías que vencen en los próximos 7 días`,
        timestamp: new Date(),
        action: {
          label: "Ver Usuarios",
          onClick: () => {
            toast({
              title: "Membresías por Vencer",
              description: `Hay ${expiringUsers.length} usuarios con membresías próximas a vencer`,
            });
          },
        },
      });
    }

    // Alertas de clases sin instructor
    const classesWithoutInstructor = classSessions.filter(
      (cls) =>
        cls.status === "scheduled" &&
        (!cls.instructorId || cls.instructorId === "")
    );
    if (classesWithoutInstructor.length > 0) {
      newAlerts.push({
        id: "no-instructor",
        type: "error",
        title: "Clases sin Instructor",
        description: `${classesWithoutInstructor.length} clase(s) no tienen instructor asignado`,
        timestamp: new Date(),
        action: {
          label: "Asignar Instructor",
          onClick: () => {
            toast({
              title: "Clases sin Instructor",
              description: `Hay ${classesWithoutInstructor.length} clases que necesitan instructor`,
            });
          },
        },
      });
    }

    // Alertas de usuarios pendientes de aprobación
    const pendingUsers = users.filter(
      (user) => user.membership?.status === "pending"
    );
    if (pendingUsers.length > 0) {
      newAlerts.push({
        id: "pending-users",
        type: "warning",
        title: "Usuarios Pendientes",
        description: `${pendingUsers.length} usuario(s) esperan aprobación`,
        timestamp: new Date(),
        action: {
          label: "Revisar",
          onClick: () => {
            toast({
              title: "Usuarios Pendientes",
              description: `Hay ${pendingUsers.length} usuarios esperando aprobación`,
            });
          },
        },
      });
    }

    setAlerts(newAlerts);
    setIsLoading(false);
  };

  const getAlertIcon = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getAlertBadgeColor = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "default";
      case "success":
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Cargando alertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {alerts.filter((a) => a.type === "error").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertencias</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {alerts.filter((a) => a.type === "warning").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Informativas</CardTitle>
            <AlertCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {alerts.filter((a) => a.type === "info").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Alertas del Sistema</h2>

        {alerts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay alertas activas en este momento
                </p>
                <p className="text-sm text-muted-foreground">
                  El sistema está funcionando correctamente
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          <Badge variant={getAlertBadgeColor(alert.type)}>
                            {alert.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {alert.action && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={alert.action.onClick}
                      >
                        {alert.action.label}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
