"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import type { Instructor } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export function InstructorsManager() {
  const {
    instructors = [],
    disciplines,
    addInstructor,
    updateInstructor,
    deleteInstructor,
    fetchDisciplines,
    fetchInstructors,
    instructorsPagination,
    createInstructor,
    updateInstructorById,
    deleteInstructorById,
    toggleInstructorStatus,
  } = useBlackSheepStore();

  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  // Estado de paginación y filtros
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [activeFilter, setActiveFilter] = useState("todos");
  const limit = 10;

  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null
  );
  const [isAddingInstructor, setIsAddingInstructor] = useState(false);
  const [deletingInstructor, setDeletingInstructor] =
    useState<Instructor | null>(null);

  // Cargar disciplinas al montar el componente
  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);

  // Cargar instructores al montar el componente y cuando cambian filtros/página
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchInstructors(
          page,
          limit,
          searchTerm,
          roleFilter !== "todos" ? roleFilter : "",
          activeFilter !== "todos" ? activeFilter : ""
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [page, searchTerm, roleFilter, activeFilter, fetchInstructors]);

  // Resetear página si cambia el filtro de búsqueda o estado
  useEffect(() => {
    setPage(1);
  }, [searchTerm, roleFilter, activeFilter]);

  const handleSaveInstructor = async (instructorData: Partial<Instructor>) => {
    if (editingInstructor) {
      // Actualizar instructor existente
      const result = await updateInstructorById(
        editingInstructor.id,
        instructorData
      );
      if (result) {
        toast({
          title: "Instructor actualizado",
          description: "El instructor se ha actualizado correctamente",
        });
        setEditingInstructor(null);
      } else {
        toast({
          title: "Error",
          description: "Error al actualizar el instructor",
          variant: "destructive",
        });
      }
    } else {
      // Crear nuevo instructor
      const result = await createInstructor(instructorData);
      if (result) {
        toast({
          title: "Instructor agregado",
          description: "El instructor se ha agregado correctamente",
        });
        setIsAddingInstructor(false);
      } else {
        toast({
          title: "Error",
          description: "Error al agregar el instructor",
          variant: "destructive",
        });
      }
    }

    // Refrescar la lista después de agregar/editar
    fetchInstructors(
      page,
      limit,
      searchTerm,
      roleFilter !== "todos" ? roleFilter : "",
      activeFilter !== "todos" ? activeFilter : ""
    );
  };

  const handleDeleteInstructor = async (instructorId: string) => {
    const result = await deleteInstructorById(instructorId);
    if (result) {
      toast({
        title: "Instructor eliminado",
        description: "El instructor se ha eliminado correctamente",
      });
      // Refrescar la lista después de eliminar
      fetchInstructors(
        page,
        limit,
        searchTerm,
        roleFilter !== "todos" ? roleFilter : "",
        activeFilter !== "todos" ? activeFilter : ""
      );
    } else {
      toast({
        title: "Error",
        description: "Error al eliminar el instructor",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (instructorId: string) => {
    const result = await toggleInstructorStatus(instructorId);
    if (result) {
      toast({
        title: "Estado actualizado",
        description: "El estado del instructor se ha actualizado correctamente",
      });
      // Refrescar la lista después del cambio de estado
      fetchInstructors(
        page,
        limit,
        searchTerm,
        roleFilter !== "todos" ? roleFilter : "",
        activeFilter !== "todos" ? activeFilter : ""
      );
    } else {
      toast({
        title: "Error",
        description: "Error al cambiar el estado del instructor",
        variant: "destructive",
      });
    }
  };

  const InstructorForm = ({
    instructor,
    onClose,
  }: {
    instructor?: Instructor | null;
    onClose: () => void;
  }) => {
    const [formData, setFormData] = useState({
      firstName: instructor?.firstName || "",
      lastName: instructor?.lastName || "",
      email: instructor?.email || "",
      phone: instructor?.phone || "",
      specialties: Array.isArray(instructor?.specialties)
        ? instructor.specialties
        : [],
      isActive: instructor?.isActive ?? true,
      role: instructor?.role || "coach",
    });

    // Actualizar el formulario cuando cambie el instructor
    useEffect(() => {
      setFormData({
        firstName: instructor?.firstName || "",
        lastName: instructor?.lastName || "",
        email: instructor?.email || "",
        phone: instructor?.phone || "",
        specialties: Array.isArray(instructor?.specialties)
          ? instructor.specialties
          : [],
        isActive: instructor?.isActive ?? true,
        role: instructor?.role || "coach",
      });
    }, [instructor]);

    const handleSubmit = () => {
      if (!formData.firstName || !formData.lastName || !formData.email) return;

      // Agregar campos requeridos que no están en el formulario
      const instructorData = {
        ...formData,
        organizationId: "org_blacksheep_001", // ID de la organización
      };

      handleSaveInstructor(instructorData);
      onClose();
    };

    const handleCancel = () => {
      // Reset form data to original values when canceling
      setFormData({
        firstName: instructor?.firstName || "",
        lastName: instructor?.lastName || "",
        email: instructor?.email || "",
        phone: instructor?.phone || "",
        specialties: Array.isArray(instructor?.specialties)
          ? instructor.specialties
          : [],
        isActive: instructor?.isActive ?? true,
        role: instructor?.role || "coach",
      });
      onClose();
    };

    const handleSpecialtyToggle = (disciplineId: string, checked: boolean) => {
      if (checked) {
        setFormData((prev) => ({
          ...prev,
          specialties: [...prev.specialties, disciplineId],
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          specialties: prev.specialties.filter((id) => id !== disciplineId),
        }));
      }
    };

    return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    firstName: e.target.value,
                  }))
                }
                placeholder="Nombre del instructor"
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                }
                placeholder="Apellido del instructor"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="instructor@blacksheep.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+56 9 1234 5678"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: checked as boolean,
                }))
              }
            />
            <Label htmlFor="isActive">Instructor activo</Label>
          </div>

          <div>
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  role: value as "admin" | "coach",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coach">Coach</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Coach: acceso a clases, horarios, alumnos. Admin: acceso total.
            </p>
          </div>
        </div>

        <div>
          <Label className="text-base font-medium">Especialidades</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Selecciona las disciplinas que puede impartir este instructor
          </p>
          <div className="space-y-2">
            {(disciplines || []).map((discipline) => (
              <div key={discipline.id} className="flex items-center space-x-2">
                <Checkbox
                  id={discipline.id}
                  checked={formData.specialties.includes(discipline.id)}
                  onCheckedChange={(checked) =>
                    handleSpecialtyToggle(discipline.id, checked as boolean)
                  }
                />
                <Label
                  htmlFor={discipline.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: discipline.color }}
                  />
                  {discipline.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleSubmit} className="flex-1">
            {instructor ? "Actualizar" : "Crear"} Instructor
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Gestión de Instructores</h2>
        <Dialog open={isAddingInstructor} onOpenChange={setIsAddingInstructor}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Instructor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Instructor</DialogTitle>
              <DialogDescription>
                Completa la información del nuevo instructor
              </DialogDescription>
            </DialogHeader>
            <InstructorForm
              instructor={null}
              onClose={() => setIsAddingInstructor(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros de búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            <SelectItem value="coach">Coach</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="true">Activo</SelectItem>
            <SelectItem value="false">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Información de resultados */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Mostrando {instructors.length} de {instructorsPagination?.total || 0}{" "}
          instructores
        </p>
        {instructorsPagination && instructorsPagination.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {instructorsPagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setPage((p) =>
                  Math.min(instructorsPagination.totalPages, p + 1)
                )
              }
              disabled={page === instructorsPagination.totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton para tabla
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-16 rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : instructors.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {instructorsPagination?.total === 0
                      ? "No se encontraron instructores"
                      : "No hay instructores en esta página"}
                  </TableCell>
                </TableRow>
              ) : (
                instructors?.map((instructor: Instructor) => (
                  <TableRow key={instructor.id}>
                    <TableCell className="font-medium">
                      {instructor.firstName} {instructor.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {instructor.specialties?.length > 0 ? (
                          instructor.specialties.map((specialtyId: string) => {
                            const discipline = disciplines?.find(
                              (d) => d.id === specialtyId
                            );
                            return discipline ? (
                              <div
                                key={specialtyId}
                                className="flex items-center gap-1"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: discipline.color }}
                                />
                                <span className="text-sm">
                                  {discipline.name}
                                </span>
                              </div>
                            ) : (
                              <Badge
                                key={specialtyId}
                                variant="secondary"
                                className="text-xs"
                              >
                                {specialtyId}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Sin especialidades
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={instructor.isActive ? "default" : "secondary"}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleToggleStatus(instructor.id)}
                      >
                        {instructor.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog
                          open={editingInstructor?.id === instructor.id}
                          onOpenChange={(open) => {
                            if (!open) {
                              setEditingInstructor(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingInstructor(instructor)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Editar Instructor</DialogTitle>
                              <DialogDescription>
                                Modifica la información del instructor
                              </DialogDescription>
                            </DialogHeader>
                            <InstructorForm
                              instructor={editingInstructor}
                              onClose={() => setEditingInstructor(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingInstructor(instructor)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deletingInstructor !== null}
        onOpenChange={(open) => !open && setDeletingInstructor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar instructor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              instructor{" "}
              <strong>
                {deletingInstructor?.firstName} {deletingInstructor?.lastName}
              </strong>{" "}
              y todos sus datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingInstructor) {
                  handleDeleteInstructor(deletingInstructor.id);
                  setDeletingInstructor(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
