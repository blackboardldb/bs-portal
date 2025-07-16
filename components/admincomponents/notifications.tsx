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
  Clock,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  Bell,
} from "lucide-react";
import type { FitCenterUserProfile } from "@/lib/types";

interface Notification {
  id: string;
  type: "pending_user" | "cancelled_class";
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

  useEffect(() => {
    generateNotifications();
  }, [users, classSessions]);

  const generateNotifications = () => {
    const newNotifications: Notification[] = [];
    const now = new Date();

    // Usuarios pendientes de aprobación (revisión manual)
    const pendingUsers =
      users?.filter((user) => user.membership?.status === "pending") || [];
    pendingUsers.forEach((user) => {
      newNotifications.push({
        id: `pending-user-${user.id}`,
        type: "pending_user",
        title: "Nuevo Alumno Pendiente",
        description: `${user.firstName} ${user.lastName} - ${user.email}`,
        timestamp: new Date(),
        data: user,
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
    const updatedUserData = {
      membership: {
        ...user.membership!,
        status: "active" as const,
        currentPeriodStart: new Date().toISOString().split("T")[0],
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
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
      case "cancelled_class":
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getNotificationBadgeColor = (type: Notification["type"]) => {
    switch (type) {
      case "pending_user":
        return "default";
      case "cancelled_class":
        return "destructive";
    }
  };

  const getNotificationBadgeText = (type: Notification["type"]) => {
    switch (type) {
      case "pending_user":
        return "PENDIENTE";
      case "cancelled_class":
        return "CANCELADA";
    }
  };

  const pendingUsers = notifications.filter(
    (n) => n.type === "pending_user" && !n.resolved
  );
  const otherNotifications = notifications.filter(
    (n) => n.type !== "pending_user" && !n.resolved
  );

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

      {/* Usuarios Pendientes */}
      {pendingUsers.length > 0 && (
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
                          variant={getNotificationBadgeColor(notification.type)}
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
    </div>
  );
}
