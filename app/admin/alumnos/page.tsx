"use client";

import { useState, useEffect } from "react";
import { Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddStudentModal } from "../../../components/admincomponents/add-student-modal";
import { StudentEditModal } from "../../../components/admincomponents/student-edit-modal";
import {
  useBlackSheepStore,
  STUDENT_STATES,
  STATE_COLORS,
} from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import { initialMembershipPlans } from "@/lib/mock-data";
import type { FitCenterUserProfile } from "@/lib/types";
import { usePagination, usePaginationControls } from "@/lib/use-pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateShort } from "@/lib/utils";

// Función helper para formatear fechas
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";
  return formatDateShort(dateString);
};

export default function AlumnosPage() {
  const {
    users = [],
    fetchUsers,
    pagination,
    updateUser,
    addUser,
    createUser,
    updateUserById,
  } = useBlackSheepStore();

  // Filtrar usuarios para excluir staff (admin/coach) - solo mostrar alumnos
  const studentsOnly = users.filter(
    (user) => !user.role || user.role === "user" // Solo usuarios sin rol o con rol "user"
  );

  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  // Estado de paginación y filtros
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editingStudent, setEditingStudent] =
    useState<FitCenterUserProfile | null>(null);
  const limit = 10;

  // Cargar usuarios al montar el componente y cuando cambian filtros/página
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchUsers(
          page,
          limit,
          searchTerm,
          undefined, // No filtrar por rol específico (incluye usuarios sin rol = alumnos)
          statusFilter !== "todos" ? statusFilter : undefined
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [page, searchTerm, statusFilter, fetchUsers]);

  // Resetear página si cambia el filtro de búsqueda o estado
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const color =
      STATE_COLORS[status as keyof typeof STATE_COLORS] || "#6b7280";
    return (
      <Badge className="text-white border-0" style={{ backgroundColor: color }}>
        {status}
      </Badge>
    );
  };

  const handleEditStudent = (student: FitCenterUserProfile) => {
    setEditingStudent(student);
  };

  const handleCloseEditModal = () => {
    setEditingStudent(null);
  };

  // Paginación real desde el store
  const totalItems = pagination?.total || 0;
  const totalPages = pagination?.totalPages || 1;
  const currentPage = pagination?.page || 1;
  const startIndex = (currentPage - 1) * limit;
  const endIndex = Math.min(startIndex + (users?.length || 0), totalItems);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gestión de Alumnos</h1>
        <AddStudentModal
          onAddStudent={async (studentData) => {
            const result = await createUser(studentData);
            if (result) {
              toast({
                title: "Alumno agregado",
                description: "El alumno se ha agregado correctamente",
              });
            } else {
              toast({
                title: "Error",
                description: "Error al agregar el alumno",
                variant: "destructive",
              });
            }
          }}
          plans={initialMembershipPlans}
          onSuccess={() => {
            // Refrescar la lista después de agregar/editar
            fetchUsers(
              page,
              limit,
              searchTerm,
              undefined, // No filtrar por rol específico (incluye usuarios sin rol = alumnos)
              statusFilter !== "todos" ? statusFilter : undefined
            );
          }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value={STUDENT_STATES.ACTIVE}>Activo</SelectItem>
            <SelectItem value={STUDENT_STATES.INACTIVE}>Inactivo</SelectItem>
            <SelectItem value={STUDENT_STATES.EXPIRED}>Expirado</SelectItem>
            <SelectItem value={STUDENT_STATES.PENDING}>
              Nuevo - Pendiente
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Información de resultados */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Mostrando {startIndex + 1}-{endIndex} de {totalItems} alumnos
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Validez</TableHead>
                <TableHead>Editar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton para tabla
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : studentsOnly.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {totalItems === 0
                      ? "No se encontraron alumnos"
                      : "No hay alumnos en esta página"}
                  </TableCell>
                </TableRow>
              ) : (
                studentsOnly.map((student: FitCenterUserProfile) => (
                  <TableRow
                    key={student.id}
                    className={
                      student.membership?.status === "pending"
                        ? "bg-yellow-50 border-l-4 border-yellow-400"
                        : student.membership?.status === "expired"
                        ? "bg-red-50 border-l-4 border-red-400"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                      {student.membership?.status === "expired" && (
                        <Badge className="ml-2 bg-red-500 text-white">
                          Renovar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {student.membership?.membershipType || "Sin plan"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(student.membership?.status || "inactive")}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {formatDate(student.membership?.currentPeriodStart)} -{" "}
                          {formatDate(student.membership?.currentPeriodEnd)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Forma de pago:{" "}
                          {student.formaDePago || "Sin especificar"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <StudentEditModal
        student={editingStudent}
        onEdit={async (updatedStudent) => {
          const result = await updateUserById(
            updatedStudent.id,
            updatedStudent
          );
          if (result) {
            toast({
              title: "Alumno actualizado",
              description: "El alumno se ha actualizado correctamente",
            });
          } else {
            toast({
              title: "Error",
              description: "Error al actualizar el alumno",
              variant: "destructive",
            });
          }
        }}
        onClose={handleCloseEditModal}
        onSuccess={() => {
          // Refreshar la lista después de editar
          fetchUsers(
            page,
            limit,
            searchTerm,
            undefined, // No filtrar por rol específico (incluye usuarios sin rol = alumnos)
            statusFilter !== "todos" ? statusFilter : undefined
          );
        }}
      />
    </div>
  );
}
