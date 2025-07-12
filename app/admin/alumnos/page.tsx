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

export default function AlumnosPage() {
  const {
    users = [],
    createUser,
    updateUser,
    fetchUsers,
  } = useBlackSheepStore();

  // Estado de paginación
  const limit = 10; // 10 alumnos por página
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editingStudent, setEditingStudent] =
    useState<FitCenterUserProfile | null>(null);

  // Cargar usuarios al montar el componente
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getStatusBadge = (status: string) => {
    const color =
      STATE_COLORS[status as keyof typeof STATE_COLORS] || "#6b7280";
    return (
      <Badge className="text-white border-0" style={{ backgroundColor: color }}>
        {status}
      </Badge>
    );
  };

  // Filtrar estudiantes (búsqueda y filtro de estado)
  const filteredStudents = users.filter((student: FitCenterUserProfile) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "todos" || student.membership?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Usar hook de paginación
  const { paginationData, currentPageItems: currentPageStudents } =
    usePagination({
      items: filteredStudents,
      page,
      pageSize: limit,
    });

  const { goToNextPage, goToPrevPage } = usePaginationControls(
    paginationData.currentPage,
    paginationData.totalPages,
    setPage
  );

  // Resetear página si cambia la cantidad de alumnos filtrados
  useEffect(() => {
    setPage(1);
  }, [paginationData.totalItems]);

  const handleEditStudent = (student: FitCenterUserProfile) => {
    setEditingStudent(student);
  };

  const handleCloseEditModal = () => {
    setEditingStudent(null);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Gestión de Alumnos</h1>
        <AddStudentModal
          onAddStudent={createUser}
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
            <SelectItem value={STUDENT_STATES.PENDING}>Pendiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Información de resultados */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Mostrando {paginationData.startIndex + 1}-
          {Math.min(paginationData.endIndex, paginationData.totalItems)} de{" "}
          {paginationData.totalItems} alumnos
        </p>
        {paginationData.totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={!paginationData.hasPrevPage}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {paginationData.currentPage} de {paginationData.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={!paginationData.hasNextPage}
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
                <TableHead>Método de Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPageStudents.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {filteredStudents.length === 0
                      ? "No se encontraron alumnos"
                      : "No hay alumnos en esta página"}
                  </TableCell>
                </TableRow>
              ) : (
                currentPageStudents.map((student: FitCenterUserProfile) => (
                  <TableRow
                    key={student.id}
                    className={
                      student.membership?.status === "pending"
                        ? "bg-yellow-50 border-l-4 border-yellow-400"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {student.firstName} {student.lastName}
                      {student.membership?.status === "pending" && (
                        <Badge className="ml-2 bg-yellow-400 text-black">
                          Renovación Pendiente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.membership?.membershipType}</TableCell>
                    <TableCell>
                      {getStatusBadge(student.membership?.status || "inactive")}
                    </TableCell>
                    <TableCell>
                      {student.membership?.currentPeriodStart}
                    </TableCell>
                    <TableCell>
                      {student.membership?.currentPeriodEnd}
                    </TableCell>
                    <TableCell>{student.formaDePago || "-"}</TableCell>
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
        onEdit={(updatedStudent) =>
          updateUser(updatedStudent.id, updatedStudent)
        }
        onClose={handleCloseEditModal}
      />
    </div>
  );
}
