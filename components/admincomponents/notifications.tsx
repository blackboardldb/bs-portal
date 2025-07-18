"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Bell,
  RefreshCw,
  Filter,
} from "lucide-react";
import type { FitCenterUserProfile } from "@/lib/types";

interface Notification {
  id: string;
  type: "pending_user" | "pending_renewal" | "cancelled_class";
  title: string;
  description: string;
  timestamp: Date;
  data?: unknown;
  resolved: boolean;
}

export function Notifications() {
  const { users, classSessions, updateUser, updateUserById } =
    useBlackSheepStore();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<FitCenterUserProfile | null>(
    null
  );
  const [showUserModal, setShowUserModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRenewal, setSelectedRenewal] = useState<any>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  // Estados para filtros
  const [notificationFilter, setNotificationFilter] = useState("todos");

  useEffect(() => {
    generateNotifications();
  }, [users, classSessions]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    // Usuarios pendientes de aprobación (nuevos registros)
    const pendingUsers =
      users?.filter((user) => user.membership?.status === "pending") || [];

    pendingUsers.forEach((user) => {
      // Determinar si es alumno nuevo o antiguo
      const totalClasses =
        user.membership?.centerStats?.lifetimeStats?.totalClasses;

      const isNewStudent = totalClasses === 0;
      const isReturningStudent = (totalClasses || 0) > 0;

      let title = "Alumno Pendiente";
      let description = `${user.firstName} ${user.lastName} - ${user.email}`;

      if (isNewStudent) {
        title = "Nuevo Alumno Pendiente";
        description += " (Primera vez)";
      } else if (isReturningStudent) {
        title = "Alumno Antiguo Pendiente";
        description += ` (${user.membership?.centerStats?.lifetimeStats?.totalClasses} clases previas)`;
      }

      newNotifications.push({
        id: `pending-user-${user.id}`,
        type: "pending_user",
        title,
        description,
        timestamp: new Date(),
        data: { ...user, isNewStudent, isReturningStudent },
        resolved: false,
      });
    });

    // Usuarios con renovaciones pendientes
    const renewalUsers =
      users?.filter(
        (user) =>
          user.membership?.pendingRenewal &&
          user.membership.pendingRenewal.status === "pending"
      ) || [];

    renewalUsers.forEach((user) => {
      const renewal = user.membership!.pendingRenewal!;
      const requestDate = renewal.requestDate
        ? new Date(renewal.requestDate)
        : new Date();

      // Calculate days until expiration for urgency
      const expirationDate = new Date(user.membership!.currentPeriodEnd);
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Detectar si es cambio de plan o renovación del mismo plan
      const currentPlanId = user.membership!.planId;
      const requestedPlanId = renewal.requestedPlanId;
      const isPlanChange = currentPlanId !== requestedPlanId;

      newNotifications.push({
        id: `pending-renewal-${user.id}`,
        type: "pending_renewal",
        title: "Renovación Pendiente",
        description: `${user.firstName} ${user.lastName} - ${
          isPlanChange ? "Cambio de plan" : "Renovar plan"
        }${daysUntilExpiration <= 7 ? " (Expira pronto)" : ""}`,
        timestamp: requestDate,
        data: { user, renewal, daysUntilExpiration },
        resolved: false,
      });
    });

    // Últimas 3 clases canceladas (solo visual)
    const cancelledClasses = classSessions
      .filter((cls) => cls.status === "cancelled")
      .slice(0, 3);
    if (cancelledClasses.length > 0) {
      newNotifications.push({
        id: "cancelled-classes",
        type: "cancelled_class",
        title: "Últimas clases canceladas",
        description: cancelledClasses
          .map((cls) => {
            const date = new Date(cls.dateTime);
            const day = date
              .toLocaleDateString("es-ES", {
                weekday: "short",
                day: "2-digit",
                month: "short",
              })
              .toUpperCase();
            const time = date.toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
            });
            return `${day} ${date.getDate()} ${date
              .toLocaleDateString("es-ES", { month: "short" })
              .toUpperCase()} ${date.getFullYear()} - ${time}`;
          })
          .join("\n"),
        timestamp: new Date(),
        data: cancelledClasses,
        resolved: false,
      });
    }

    // NOTA: Eliminamos la alerta de clases sin instructor por ser poco útil
    // Muchas clases se crean sin instructor inicialmente y se asignan después
    // Esto generaba demasiados falsos positivos

    setNotifications(newNotifications);
    setIsLoading(false);
  };

  const handleApproveUser = async (user: FitCenterUserProfile) => {
    const startDate = new Date().toISOString().split("T")[0];

    // Calcular fecha de fin basada en el plan del usuario (por defecto 1 mes)
    const planDuration = 1; // Por defecto, los planes son mensuales
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + planDuration);

    const updatedUserData = {
      membership: {
        ...user.membership!,
        status: "active" as const,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate.toISOString().split("T")[0],
      },
      notes:
        (user.notes || "") +
        " - Approved on " +
        new Date().toLocaleDateString(),
    };

    const result = await updateUserById(user.id, updatedUserData);
    if (result) {
      markNotificationAsResolved(`pending-user-${user.id}`);
      toast({
        title: "Alumno aprobado",
        description: `${user.firstName} ${user.lastName} puede inscribir clases`,
      });
      setShowUserModal(false);
    } else {
      toast({
        title: "Error",
        description: "Error al aprobar el alumno",
        variant: "destructive",
      });
    }
  };

  const handleRejectUser = async (user: FitCenterUserProfile) => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para el rechazo",
        variant: "destructive",
      });
      return;
    }

    const updatedUserData = {
      membership: {
        ...user.membership!,
        status: "inactive" as const,
      },
      notes:
        (user.notes || "") +
        " - Rejected on " +
        new Date().toLocaleDateString() +
        ": " +
        rejectReason,
      rejectionInfo: {
        rejectedAt: new Date().toISOString(),
        reason: rejectReason,
        rejectedBy: "admin",
      },
    };

    const result = await updateUserById(user.id, updatedUserData);
    if (result) {
      markNotificationAsResolved(`pending-user-${user.id}`);
      toast({
        title: "Alumno rechazado",
        description: `${user.firstName} ${user.lastName} no fue aprobado`,
        variant: "destructive",
      });
      setShowRejectModal(false);
      setRejectReason("");
      setShowUserModal(false);
    } else {
      toast({
        title: "Error",
        description: "Error al rechazar el alumno",
        variant: "destructive",
      });
    }
  };

  const handleApproveRenewal = async (
    user: FitCenterUserProfile,
    renewal: any
  ) => {
    try {
      const startDate = new Date().toISOString().split("T")[0];

      // Calculate new end date based on current plan or requested plan
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Default to 1 month, adjust based on plan

      const updatedUserData = {
        membership: {
          ...user.membership!,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate.toISOString().split("T")[0],
          // Update plan if it's a plan change
          ...(renewal.requestedPlanId && {
            planId: renewal.requestedPlanId,
            membershipType: renewal.requestedPlanId, // This should be mapped to plan name
          }),
          // Remove pending renewal
          pendingRenewal: undefined,
        },
        // Update payment method if provided
        ...(renewal.requestedPaymentMethod && {
          formaDePago: renewal.requestedPaymentMethod,
        }),
        notes:
          (user.notes || "") +
          ` - Renewal approved on ${new Date().toLocaleDateString()}`,
      };

      const result = await updateUserById(user.id, updatedUserData);
      if (result) {
        markNotificationAsResolved(`pending-renewal-${user.id}`);
        toast({
          title: "Renovación aprobada",
          description: `${user.firstName} ${user.lastName} - Plan renovado exitosamente`,
        });
        setShowRenewalModal(false);
      } else {
        toast({
          title: "Error",
          description: "Error al aprobar la renovación",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al procesar la renovación",
        variant: "destructive",
      });
    }
  };

  const handleRejectRenewal = async (
    user: FitCenterUserProfile,
    renewal: any
  ) => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para el rechazo",
        variant: "destructive",
      });
      return;
    }

    try {
      const updatedUserData = {
        membership: {
          ...user.membership!,
          pendingRenewal: {
            ...renewal,
            status: "rejected" as const,
            processedBy: "admin",
            processedDate: new Date().toISOString(),
            notes: rejectReason,
          },
        },
        notes:
          (user.notes || "") +
          ` - Renewal rejected on ${new Date().toLocaleDateString()}: ${rejectReason}`,
      };

      const result = await updateUserById(user.id, updatedUserData);
      if (result) {
        markNotificationAsResolved(`pending-renewal-${user.id}`);
        toast({
          title: "Renovación rechazada",
          description: `${user.firstName} ${user.lastName} - Renovación no aprobada`,
          variant: "destructive",
        });
        setShowRejectModal(false);
        setRejectReason("");
        setShowRenewalModal(false);
      } else {
        toast({
          title: "Error",
          description: "Error al rechazar la renovación",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al procesar el rechazo",
        variant: "destructive",
      });
    }
  };

  const markNotificationAsResolved = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, resolved: true }
          : notification
      )
    );
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "pending_user":
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case "pending_renewal":
        return <RefreshCw className="h-5 w-5 text-orange-500" />;
      case "cancelled_class":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getNotificationBadgeColor = (type: Notification["type"]) => {
    switch (type) {
      case "pending_user":
        return "default";
      case "pending_renewal":
        return "secondary";
      case "cancelled_class":
        return "destructive";
    }
  };

  const getNotificationBadgeText = (type: Notification["type"]) => {
    switch (type) {
      case "pending_user":
        return "NUEVO";
      case "pending_renewal":
        return "RENOVACIÓN";
      case "cancelled_class":
        return "CANCELADA";
    }
  };

  const pendingUsers = notifications.filter(
    (n) => n.type === "pending_user" && !n.resolved
  );
  const pendingRenewals = notifications.filter(
    (n) => n.type === "pending_renewal" && !n.resolved
  );
  const otherNotifications = notifications.filter(
    (n) =>
      n.type !== "pending_user" && n.type !== "pending_renewal" && !n.resolved
  );

  // Aplicar filtros
  const getFilteredNotifications = () => {
    let filtered = notifications.filter((n) => !n.resolved);

    if (notificationFilter === "usuarios") {
      filtered = filtered.filter((n) => n.type === "pending_user");
    } else if (notificationFilter === "renovaciones") {
      filtered = filtered.filter((n) => n.type === "pending_renewal");
    } else if (notificationFilter === "cancelaciones") {
      filtered = filtered.filter((n) => n.type === "cancelled_class");
    }

    return filtered;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header con estadísticas - Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usuarios Pendientes - Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Skeleton className="h-8 w-full rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Clases Canceladas - Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Skeleton className="h-5 w-5 rounded mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-32 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <CardTitle className="text-sm font-medium">
              Total Notificaciones
            </CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n) => !n.resolved).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Pendientes
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {pendingUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Renovaciones Pendientes
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {pendingRenewals.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {
                pendingRenewals.filter(
                  (n) => (n.data as any)?.daysUntilExpiration <= 7
                ).length
              }{" "}
              expiran pronto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clases Canceladas
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {otherNotifications.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 3 cancelaciones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de notificaciones */}
      <div className="flex items-center justify-end gap-4 p-4 bg-muted/50 rounded-lg w-full">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Filtrar por:</Label>
        </div>
        <Select
          value={notificationFilter}
          onValueChange={setNotificationFilter}
        >
          <SelectTrigger className="w-48 text-left">
            <SelectValue placeholder="Seleccionar filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las notificaciones</SelectItem>
            <SelectItem value="usuarios">Solo usuarios nuevos</SelectItem>
            <SelectItem value="renovaciones">Solo renovaciones</SelectItem>
            <SelectItem value="cancelaciones">Solo cancelaciones</SelectItem>
          </SelectContent>
        </Select>
        {notificationFilter !== "todos" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationFilter("todos")}
          >
            Limpiar filtro
          </Button>
        )}
      </div>

      {/* Usuarios Pendientes */}
      {pendingUsers.length > 0 &&
        (notificationFilter === "todos" ||
          notificationFilter === "usuarios") && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-500" />
              Nuevos Alumnos por Aprobar
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map((notification) => {
                const user = notification.data as FitCenterUserProfile;
                return (
                  <Card
                    key={notification.id}
                    className="border-l-4 border-l-blue-500"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <Badge
                            variant={getNotificationBadgeColor(
                              notification.type
                            )}
                          >
                            {getNotificationBadgeText(notification.type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.phone}
                        </p>
                        {user.notes && (
                          <p className="text-xs text-muted-foreground">
                            {user.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowUserModal(true);
                          }}
                          className="flex-1"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Revisar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      {/* Renovaciones Pendientes */}
      {pendingRenewals.length > 0 &&
        (notificationFilter === "todos" ||
          notificationFilter === "renovaciones") && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-orange-500" />
              Renovaciones Pendientes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingRenewals.map((notification) => {
                const { user, renewal, daysUntilExpiration } =
                  notification.data as any;
                return (
                  <Card
                    key={notification.id}
                    className="border-l-4 border-l-orange-500"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <Badge
                            variant={getNotificationBadgeColor(
                              notification.type
                            )}
                          >
                            {getNotificationBadgeText(notification.type)}
                          </Badge>
                          {daysUntilExpiration <= 7 && (
                            <Badge variant="destructive" className="text-xs">
                              URGENTE
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-semibold">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Plan actual:
                          </span>
                          <span className="font-medium">
                            {user.membership.membershipType}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Expira en:
                          </span>
                          <span
                            className={`font-medium ${
                              daysUntilExpiration <= 7
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {daysUntilExpiration} días
                          </span>
                        </div>
                        {renewal.requestedPlanId && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Nuevo plan:
                            </span>
                            <span className="font-medium text-orange-600">
                              {renewal.requestedPlanId}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Pago:</span>
                          <span className="font-medium">
                            {renewal.requestedPaymentMethod}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRenewal({
                              user,
                              renewal,
                              daysUntilExpiration,
                            });
                            setShowRenewalModal(true);
                          }}
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Revisar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

      {/* Clases Canceladas */}
      {otherNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Últimas clases canceladas
          </h2>
          <div className="space-y-4">
            {otherNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="border-l-4 border-l-red-500"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-semibold">
                            {notification.title}
                          </h3>
                          <Badge
                            variant={getNotificationBadgeColor(
                              notification.type
                            )}
                          >
                            {getNotificationBadgeText(notification.type)}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-2">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        markNotificationAsResolved(notification.id)
                      }
                    >
                      Marcar como resuelta
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {notifications.filter((n) => !n.resolved).length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay nuevos alumnos ni clases canceladas
              </p>
              <p className="text-sm text-muted-foreground">Todo tranquilo</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para revisar usuario */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Nuevo Alumno</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <p className="text-sm font-medium">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm font-medium">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label>Plan Solicitado</Label>
                  <p className="text-sm font-medium">
                    {selectedUser.membership?.membershipType}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApproveUser(selectedUser)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Aprobar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  No Aprobar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para rechazar usuario */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar Alumno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">¿Por qué no lo apruebas?</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: No pagó el plan, datos incorrectos..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => selectedUser && handleRejectUser(selectedUser)}
                variant="destructive"
                className="flex-1"
              >
                No Aprobar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para revisar renovación */}
      <Dialog open={showRenewalModal} onOpenChange={setShowRenewalModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Revisar Solicitud de Renovación</DialogTitle>
          </DialogHeader>
          {selectedRenewal && (
            <div className="space-y-6">
              {/* Información del usuario */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Usuario</Label>
                  <p className="text-sm font-medium">
                    {selectedRenewal.user.firstName}{" "}
                    {selectedRenewal.user.lastName}
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm font-medium">
                    {selectedRenewal.user.email}
                  </p>
                </div>
                <div>
                  <Label>Fecha de Solicitud</Label>
                  <p className="text-sm font-medium">
                    {new Date(
                      selectedRenewal.renewal.requestDate
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label>Días hasta Expiración</Label>
                  <p
                    className={`text-sm font-medium ${
                      selectedRenewal.daysUntilExpiration <= 7
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {selectedRenewal.daysUntilExpiration} días
                  </p>
                </div>
              </div>

              {/* Comparación de planes */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <Label className="text-sm font-semibold text-muted-foreground">
                    Plan Actual
                  </Label>
                  <div className="mt-2 space-y-2">
                    <p className="font-medium">
                      {selectedRenewal.user.membership.membershipType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expira:{" "}
                      {new Date(
                        selectedRenewal.user.membership.currentPeriodEnd
                      ).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Precio: $
                      {selectedRenewal.user.membership.monthlyPrice?.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="border rounded-lg p-4 border-orange-200 bg-orange-50">
                  <Label className="text-sm font-semibold text-orange-700">
                    Plan Solicitado
                  </Label>
                  <div className="mt-2 space-y-2">
                    <p className="font-medium">
                      {selectedRenewal.renewal.requestedPlanId ||
                        selectedRenewal.user.membership.membershipType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Método de pago:{" "}
                      {selectedRenewal.renewal.requestedPaymentMethod}
                    </p>
                    {selectedRenewal.renewal.requestedPlanId && (
                      <p className="text-sm text-orange-600 font-medium">
                        ⚠️ Cambio de plan solicitado
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notas adicionales */}
              {selectedRenewal.renewal.notes && (
                <div>
                  <Label>Notas del Usuario</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedRenewal.renewal.notes}
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() =>
                    handleApproveRenewal(
                      selectedRenewal.user,
                      selectedRenewal.renewal
                    )
                  }
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar Renovación
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar Renovación
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
