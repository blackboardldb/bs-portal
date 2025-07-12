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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  UserCheck,
  UserX,
  MessageSquare,
  Bell,
} from "lucide-react";
import type { FitCenterUserProfile } from "@/lib/types";

interface Notification {
  id: string;
  type:
    | "pending_user"
    | "expiring_membership"
    | "cancelled_class"
    | "high_demand"
    | "no_instructor";
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
  resolved: boolean;
}

export function Notifications() {
  const { users, classSessions, disciplines, updateUser } =
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

    // Usuarios pendientes de aprobación
    const pendingUsers = users.filter(
      (user) => user.membership?.status === "pending"
    );
    pendingUsers.forEach((user) => {
      newNotifications.push({
        id: `pending-user-${user.id}`,
        type: "pending_user",
        title: "Usuario Pendiente de Aprobación",
        description: `${user.firstName} ${user.lastName} (${user.email}) espera aprobación`,
        timestamp: new Date(),
        data: user,
        resolved: false,
      });
    });

    // Usuarios con membresías próximas a vencer
    const expiringUsers = users.filter((user) => {
      if (!user.membership?.currentPeriodEnd) return false;
      const endDate = new Date(user.membership.currentPeriodEnd);
      const daysUntilExpiry = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    });

    expiringUsers.forEach((user) => {
      newNotifications.push({
        id: `expiring-${user.id}`,
        type: "expiring_membership",
        title: "Membresía por Vencer",
        description: `${user.firstName} ${user.lastName} - Vence en ${Math.ceil(
          (new Date(user.membership!.currentPeriodEnd).getTime() -
            now.getTime()) /
            (1000 * 60 * 60 * 24)
        )} días`,
        timestamp: new Date(),
        data: user,
        resolved: false,
      });
    });

    // Clases canceladas
    const cancelledClasses = classSessions.filter(
      (cls) => cls.status === "cancelled"
    );
    if (cancelledClasses.length > 0) {
      newNotifications.push({
        id: "cancelled-classes",
        type: "cancelled_class",
        title: "Clases Canceladas",
        description: `${cancelledClasses.length} clase(s) han sido canceladas recientemente`,
        timestamp: new Date(),
        data: cancelledClasses,
        resolved: false,
      });
    }

    // Clases con alta demanda
    const highDemandClasses = classSessions.filter(
      (cls) =>
        cls.status === "scheduled" &&
        cls.registeredParticipantsIds.length >= cls.capacity * 0.9
    );
    if (highDemandClasses.length > 0) {
      newNotifications.push({
        id: "high-demand",
        type: "high_demand",
        title: "Clases con Alta Demanda",
        description: `${highDemandClasses.length} clase(s) están casi llenas`,
        timestamp: new Date(),
        data: highDemandClasses,
        resolved: false,
      });
    }

    // Clases sin instructor
    const classesWithoutInstructor = classSessions.filter(
      (cls) =>
        cls.status === "scheduled" &&
        (!cls.instructorId || cls.instructorId === "")
    );
    if (classesWithoutInstructor.length > 0) {
      newNotifications.push({
        id: "no-instructor",
        type: "no_instructor",
        title: "Clases sin Instructor",
        description: `${classesWithoutInstructor.length} clase(s) no tienen instructor asignado`,
        timestamp: new Date(),
        data: classesWithoutInstructor,
        resolved: false,
      });
    }

    setNotifications(newNotifications);
    setIsLoading(false);
  };

  const handleApproveUser = (user: FitCenterUserProfile) => {
    const updatedUser = {
      ...user,
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

    updateUser(updatedUser);
    markNotificationAsResolved(`pending-user-${user.id}`);

    toast({
      title: "Usuario aprobado",
      description: `${user.firstName} ${user.lastName} ha sido aprobado exitosamente`,
    });

    setShowUserModal(false);
  };

  const handleRejectUser = (user: FitCenterUserProfile) => {
    if (!rejectReason.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar una razón para el rechazo",
        variant: "destructive",
      });
      return;
    }

    const updatedUser = {
      ...user,
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

    updateUser(updatedUser);
    markNotificationAsResolved(`pending-user-${user.id}`);

    toast({
      title: "Usuario rechazado",
      description: `${user.firstName} ${user.lastName} ha sido rechazado`,
      variant: "destructive",
    });

    setShowRejectModal(false);
    setRejectReason("");
    setShowUserModal(false);
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
      case "expiring_membership":
        return <Clock className="h-5 w-5 text-orange-500" />;
      case "cancelled_class":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "high_demand":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case "no_instructor":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getNotificationBadgeColor = (type: Notification["type"]) => {
    switch (type) {
      case "pending_user":
        return "default";
      case "expiring_membership":
        return "secondary";
      case "cancelled_class":
        return "destructive";
      case "high_demand":
        return "default";
      case "no_instructor":
        return "secondary";
    }
  };

  const getNotificationBadgeText = (type: Notification["type"]) => {
    switch (type) {
      case "pending_user":
        return "PENDIENTE";
      case "expiring_membership":
        return "VENCE PRONTO";
      case "cancelled_class":
        return "CANCELADA";
      case "high_demand":
        return "ALTA DEMANDA";
      case "no_instructor":
        return "SIN INSTRUCTOR";
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
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Cargando notificaciones...</p>
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
              Membresías por Vencer
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {
                notifications.filter(
                  (n) => n.type === "expiring_membership" && !n.resolved
                ).length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas del Sistema
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {otherNotifications.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios Pendientes */}
      {pendingUsers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-blue-500" />
            Usuarios Pendientes de Aprobación
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

      {/* Otras Notificaciones */}
      {otherNotifications.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Alertas del Sistema
          </h2>
          <div className="space-y-4">
            {otherNotifications.map((notification) => (
              <Card
                key={notification.id}
                className="border-l-4 border-l-yellow-500"
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
                No hay notificaciones pendientes
              </p>
              <p className="text-sm text-muted-foreground">Todo está al día</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal para revisar usuario */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Usuario Pendiente</DialogTitle>
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

              {selectedUser.notes && (
                <div>
                  <Label>Notas</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApproveUser(selectedUser)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Aprobar Usuario
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Rechazar
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
            <DialogTitle>Rechazar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Razón del rechazo</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explica por qué se rechaza al usuario..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => selectedUser && handleRejectUser(selectedUser)}
                variant="destructive"
                className="flex-1"
              >
                Confirmar Rechazo
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
