"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useBlackSheepStore,
  usePendingUsers,
  useUserStats,
} from "@/lib/blacksheep-store";
import { usePagination } from "@/lib/use-pagination";
import { useToast } from "@/components/ui/use-toast";
import type { FitCenterUserProfile } from "@/lib/types";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Check,
  X,
  User,
  Eye,
  EyeOff,
  RotateCcw,
  Trash2,
  AlertTriangle,
} from "lucide-react";

// Tipo para usuarios pendientes con información adicional
interface PendingUser extends FitCenterUserProfile {
  daysPending?: number;
}

export function UserApproval() {
  const { updateUser } = useBlackSheepStore();
  const pendingUsers = usePendingUsers();
  const userStats = useUserStats();
  const { toast } = useToast();

  // Estados locales
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRejectedUsers, setShowRejectedUsers] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<PendingUser | null>(null);

  // Configuración de paginación
  const limit = 5;
  const totalPendingUsers = pendingUsers?.length || 0;

  // Memoizar usuarios filtrados y procesados
  const processedPendingUsers = useMemo(() => {
    if (!pendingUsers || !Array.isArray(pendingUsers)) return [];

    const today = new Date();
    return pendingUsers
      .filter((user) => {
        if (!user || !user.firstName || !user.lastName) return false;
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      })
      .map((user) => {
        const requestDate = user.membership?.currentPeriodStart
          ? new Date(user.membership.currentPeriodStart)
          : today;
        const daysPending = Math.ceil(
          (today.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return { ...user, requestDate, daysPending };
      })
      .sort((a, b) => (b.daysPending || 0) - (a.daysPending || 0));
  }, [pendingUsers, searchTerm]);

  // Obtener usuarios rechazados (con rejectionInfo)
  const rejectedUsers = useMemo(() => {
    if (!pendingUsers || !Array.isArray(pendingUsers)) return [];
    return pendingUsers.filter(
      (user) => (user as unknown as any)?.rejectionInfo
    );
  }, [pendingUsers]);

  // Configurar paginación
  const { currentPageItems: currentPageUsers, paginationData } = usePagination({
    items: processedPendingUsers,
    page,
    pageSize: limit,
  });
  const { totalPages, startIndex, endIndex } = paginationData;

  // Resetear página cuando cambia el total de usuarios
  useEffect(() => {
    setPage(1);
  }, [totalPendingUsers]);

  // Función helper para calcular fecha de término (mover a utils)
  const calcularFechaTerminoMembresia = (
    startDate: string,
    months: number
  ): string => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split("T")[0];
  };

  // Función para aprobar usuario
  const handleApproveUser = (user: PendingUser) => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "Usuario inválido",
        variant: "destructive",
      });
      return;
    }

    const existingUser = pendingUsers?.find((u) => u.id === user.id);
    if (existingUser) {
      const updatedUser = {
        ...existingUser,
        membership: {
          ...existingUser.membership,
          status: "active" as const,
          currentPeriodStart: new Date().toISOString().split("T")[0],
          currentPeriodEnd: calcularFechaTerminoMembresia(
            new Date().toISOString().split("T")[0],
            1 // Default to monthly plans
          ),
        },
        notes:
          ((existingUser as unknown as any)?.notes ?? "") +
          " - Approved on " +
          new Date().toLocaleDateString(),
      };
      updateUser(updatedUser);

      toast({
        title: "User approved",
        description: `${user.firstName} ${user.lastName} has been successfully approved.`,
      });
    }

    setShowDetails(false);
  };

  // Función para rechazar usuario
  const handleRejectUser = (user: PendingUser) => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "Usuario inválido",
        variant: "destructive",
      });
      return;
    }

    const existingUser = pendingUsers?.find((u) => u.id === user.id);
    if (existingUser) {
      const updatedUser = {
        ...existingUser,
        membership: {
          ...existingUser.membership,
          status: "inactive" as const,
        },
        notes:
          (existingUser as unknown as any)?.notes ??
          "" + " - Rechazado: " + rejectReason,
        rejectionInfo: {
          rejectedAt: new Date().toISOString(),
          reason: rejectReason,
          rejectedBy: "admin", // En el futuro podría ser el ID del admin
        },
      };
      updateUser(updatedUser);

      toast({
        title: "Usuario rechazado",
        description: `${user.firstName} ${user.lastName} ha sido rechazado.`,
        variant: "destructive",
      });
    }

    setShowRejectDialog(false);
    setRejectReason("");
  };

  // Función para reactivar usuario rechazado
  const handleReactivateUser = (user: PendingUser) => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "Usuario inválido",
        variant: "destructive",
      });
      return;
    }

    const updatedUser = {
      ...user,
      membership: {
        ...user.membership,
        status: "pending" as const,
      },
      notes:
        (user as unknown as any)?.notes ??
        "" + " - Reactivado el " + new Date().toLocaleDateString(),
      rejectionInfo: undefined, // Limpiar información de rechazo
    };
    updateUser(updatedUser);

    toast({
      title: "Usuario reactivado",
      description: `${user.firstName} ${user.lastName} ha sido reactivado y vuelve a estar pendiente.`,
    });
  };

  // Función para eliminar usuario permanentemente
  const handleDeleteUser = (user: PendingUser) => {
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "Usuario inválido",
        variant: "destructive",
      });
      return;
    }

    // Aquí implementarías la lógica para eliminar del store
    // Por ahora solo mostramos el toast
    toast({
      title: "Usuario eliminado",
      description: `${user.firstName} ${user.lastName} ha sido eliminado permanentemente.`,
      variant: "destructive",
    });

    setShowDeleteDialog(false);
    setUserToDelete(null);
  };

  // Helper para type guard
  function isPendingUser(user: unknown): user is PendingUser {
    return (
      user &&
      typeof (user as any).id === "string" &&
      typeof (user as any).firstName === "string" &&
      typeof (user as any).lastName === "string" &&
      (user as any).membership &&
      typeof (user as any).membership === "object" &&
      ((user as any).membership.status === "pending" ||
        (user as any).membership.status === "inactive" ||
        (user as any).membership.status === "active" ||
        (user as any).membership.status === "expired")
    );
  }

  // Verificar si los datos están listos
  if (!pendingUsers || !Array.isArray(pendingUsers)) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Pendientes
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.pending || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobados</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {userStats?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {rejectedUsers.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {userStats?.total || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de filtro y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="rejected">Rechazados</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowRejectedUsers(!showRejectedUsers)}
            className="flex items-center gap-2"
          >
            {showRejectedUsers ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showRejectedUsers ? "Ocultar" : "Ver"} Rechazados
          </Button>
        </div>
      </div>

      {/* Lista de usuarios pendientes */}
      {!showRejectedUsers && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Usuarios Pendientes de Aprobación
          </h3>

          {currentPageUsers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm
                      ? "No se encontraron usuarios con ese nombre."
                      : "No hay usuarios pendientes de aprobación."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {currentPageUsers.map((user) => (
                <Card
                  key={user.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-semibold">
                            {user.firstName} {user.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {user.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.phone ?? ""}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="text-orange-600 border-orange-200"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {user.daysPending || 0} días pendiente
                            </Badge>

                            {user.membership?.membershipType && (
                              <Badge variant="secondary">
                                {user.membership.membershipType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDetails(true);
                          }}
                        >
                          Ver Detalles
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRejectDialog(true);
                          }}
                        >
                          Rechazar
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleApproveUser(user)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Aprobar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1}-
                    {Math.min(endIndex, totalPendingUsers)} de{" "}
                    {totalPendingUsers} usuarios
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Anterior
                    </Button>

                    <span className="text-sm text-muted-foreground">
                      Página {page} de {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lista de usuarios rechazados */}
      {showRejectedUsers && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Usuarios Rechazados</h3>

          {rejectedUsers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No hay usuarios rechazados.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {rejectedUsers.map(
                (user) =>
                  isPendingUser(user) && (
                    <Card
                      key={user.id}
                      className="hover:shadow-md transition-shadow border-red-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <X className="h-6 w-6 text-red-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">
                                {user.firstName} {user.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                              {user.rejectionInfo && (
                                <div className="mt-2 space-y-1">
                                  <p className="text-sm text-red-600">
                                    <strong>Motivo:</strong>{" "}
                                    {user.rejectionInfo.reason}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Rechazado el{" "}
                                    {user.rejectionInfo.rejectedAt
                                      ? new Date(
                                          user.rejectionInfo.rejectedAt
                                        ).toLocaleDateString()
                                      : ""}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReactivateUser(user)}
                              className="flex items-center gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reactivar
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteDialog(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal de detalles del usuario */}
      <Dialog open={showDetails} onOpenChange={(open) => setShowDetails(open)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Usuario</DialogTitle>
          </DialogHeader>

          {selectedUser && isPendingUser(selectedUser) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre</Label>
                  <p className="text-sm">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p className="text-sm">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <p className="text-sm">{selectedUser.phone ?? ""}</p>
                </div>
                <div>
                  <Label>Plan</Label>
                  <p className="text-sm">
                    {selectedUser.membership?.membershipType ||
                      "No especificado"}
                  </p>
                </div>
              </div>
              {selectedUser.notes ?? ""}

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => handleApproveUser(selectedUser)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Aprobar Usuario
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de rechazo */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => setShowRejectDialog(open)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Usuario</DialogTitle>
            <DialogDescription>
              Proporciona una razón para el rechazo. Esta información será
              visible para el usuario.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Motivo del rechazo</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ej: Documentación incompleta, información incorrecta..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedUser && handleRejectUser(selectedUser)}
                disabled={!rejectReason.trim()}
              >
                Rechazar Usuario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de eliminación */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => setShowDeleteDialog(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar usuario permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será eliminado
              permanentemente del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
