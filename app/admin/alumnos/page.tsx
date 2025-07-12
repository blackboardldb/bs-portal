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
import { initialMembershipPlans } from "@/lib/mock-data";
import type { FitCenterUserProfile } from "@/lib/types";
import { usePagination, usePaginationControls } from "@/lib/use-pagination";

// Función helper para formatear fechas
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function AlumnosPage() {
  const { users = [], fetchUsers, pagination } = useBlackSheepStore();

  // Estado de paginación y filtros
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editingStudent, setEditingStudent] =
    useState<FitCenterUserProfile | null>(null);
  const limit = 10;

  // Cargar usuarios al montar el componente y cuando cambian filtros/página
  useEffect(() => {
    fetchUsers(
      page,
      limit,
      searchTerm,
      undefined,
      statusFilter !== "todos" ? statusFilter : undefined
    );
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
  const endIndex = Math.min(startIndex + users.length, totalItems);

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gestión de Alumnos</h1>
        <AddStudentModal
          onAddStudent={(studentData) => {
            const newStudent = {
              ...studentData,
              id: `usr_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`,
            };
            // fetchUsers se encargará de refrescar la lista
          }}
          plans={initialMembershipPlans}
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
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Pago</TableHead>
                <TableHead>Próximo Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {totalItems === 0
                      ? "No se encontraron alumnos"
                      : "No hay alumnos en esta página"}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((student: FitCenterUserProfile) => (
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
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.membership?.membershipType}</TableCell>
                    <TableCell>
                      {getStatusBadge(student.membership?.status || "inactive")}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {formatDate(student.membership?.currentPeriodStart)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {student.formaDePago || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(student.membership?.currentPeriodEnd)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="w-4 h-4" />
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

      <StudentEditModal
        student={editingStudent}
        onEdit={(updatedStudent) => updateUser(updatedStudent)}
        onClose={handleCloseEditModal}
      />
    </div>
  );
}
