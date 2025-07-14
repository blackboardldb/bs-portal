"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import { ClassSession, DayOfWeek } from "@/lib/types";
import AdminClassDetailDrawer from "./admin-class-detail-drawer";
import { useClassSchedule } from "@/lib/hooks/useClassSchedule";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  User,
  Clock,
  Users,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  getDay,
  getYear,
  getMonth,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  formatDateLocal,
  formatTimeLocal,
  formatWeekday,
  toDateString,
  toTimeString,
  createLocalDate,
  localToUTC,
  getDayOfWeekShort,
  isClassPast,
} from "@/lib/utils";

// Tipos específicos para el calendario
type TransformedClass = {
  id: string;
  dateTime: string;
  name: string;
  instructor: string;
  duration: string;
  alumnRegistred: string;
  isRegistered: boolean; // Agregado para compatibilidad con AdminClassDetailDrawer
  status: string;
  discipline: string;
  disciplineId: string;
  date: string;
  time: string;
  color: string;
  capacity: number;
  enrolled: number;
  type: "extra" | "regular";
  cancelled: boolean;
  registeredParticipantsIds: string[];
  waitlistParticipantsIds?: string[]; // Agregado para compatibilidad
  isGenerated: boolean;
  isExtra: boolean;
  historicalData: {
    averageAttendance: number;
    noShowRate: number;
    waitlistFrequency: number;
    popularityTrend: "up" | "down" | "stable";
  };
  notes: string;
};

type ExtraClassFormData = {
  disciplineId: string;
  instructor: string;
  date: string;
  time: string;
  capacity: number;
};

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [showCancelAllDialog, setShowCancelAllDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TransformedClass | null>(
    null
  );
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("all"); // Nuevo estado para filtro de disciplina

  // Estados para el formulario de clase extra
  const [extraClassForm, setExtraClassForm] = useState<ExtraClassFormData>({
    disciplineId: "",
    instructor: "",
    date: "",
    time: "",
    capacity: 15,
  });

  // CONTEXTO: Usar el nuevo hook para obtener clases del mes seleccionado
  const {
    classes: monthlyClasses,
    isLoading,
    error,
  } = useClassSchedule(currentDate);

  // CONTEXTO: `classSessions` del store ahora se usará para obtener datos históricos
  // o para sobreescribir las clases generadas si ya existen en la "base de datos".
  const {
    users,
    disciplines,
    fetchClassSessions,
    fetchUsers,
    fetchDisciplines,
  } = useBlackSheepStore();

  const { toast } = useToast();

  // Cargar datos básicos al montar
  useEffect(() => {
    fetchUsers();
    if (disciplines.length === 0) {
      fetchDisciplines();
    }
  }, [fetchUsers, fetchDisciplines, disciplines.length]);

  // CONTEXTO: Función helper para formatear fechas sin problemas de zona horaria
  const formatDateForDisplay = (dateString: string) => {
    return formatDateLocal(dateString, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // CONTEXTO: Función helper para obtener fecha en formato YYYY-MM-DD sin zona horaria
  const getDateString = (date: Date) => {
    return toDateString(date);
  };

  // CONTEXTO: Este `useMemo` ahora transforma las clases del hook en lugar de las clases globales del store.
  const transformedClasses = useMemo(
    () =>
      monthlyClasses
        .filter((cls: ClassSession) => {
          // Filtrar por disciplina si se ha seleccionado una
          if (selectedDiscipline !== "all") {
            return cls.disciplineId === selectedDiscipline;
          }
          return true;
        })
        .map((cls: any): TransformedClass => {
          const discipline = disciplines.find((d) => d.id === cls.disciplineId);
          const instructor = users.find((u) => u.id === cls.instructorId);
          const instructorName = instructor
            ? `${instructor.firstName} ${instructor.lastName}`
            : "Por asignar";

          const classDate = new Date(cls.dateTime);
          const isGenerated = cls.isGenerated || cls.id.startsWith("gen_");

          return {
            id: cls.id,
            dateTime: cls.dateTime,
            name: discipline?.name || cls.name,
            instructor: instructorName,
            duration: `${cls.durationMinutes} min`,
            alumnRegistred: `${cls.registeredParticipantsIds.length}/${cls.capacity}`,
            isRegistered: false, // TODO: Implementar lógica de registro
            status: cls.status,
            discipline: discipline?.name || "Desconocida",
            disciplineId: cls.disciplineId,
            date: cls.dateLocal || toDateString(cls.dateTime), // USAR FECHA LOCAL
            time: toTimeString(cls.dateTime),
            color: discipline?.color || "#3b82f6",
            capacity: cls.capacity,
            enrolled: cls.registeredParticipantsIds.length,
            type: isGenerated ? "regular" : "extra",
            cancelled: cls.status === "cancelled",
            registeredParticipantsIds: cls.registeredParticipantsIds,
            waitlistParticipantsIds: cls.waitlistParticipantsIds,
            isGenerated,
            isExtra: !isGenerated,
            historicalData: {
              averageAttendance: 12,
              noShowRate: 0.1,
              waitlistFrequency: 0.3,
              popularityTrend: "stable",
            },
            notes: cls.notes || "",
          };
        }),
    [monthlyClasses, disciplines, users, selectedDiscipline]
  );

  // CONTEXTO: Función para obtener los días del mes actual
  const getDaysInMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    // Para que el calendario se muestre correctamente, necesitamos los días que completan la primera y última semana.
    // El `startOfWeek` por defecto considera el Domingo como inicio de semana, lo que coincide con `dayNames`.
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const daysInGrid = eachDayOfInterval({
      start: calendarStart,
      end: calendarEnd,
    });

    return daysInGrid.map((day) => ({
      date: day,
      dateString: getDateString(day),
      isCurrentMonth: day.getMonth() === date.getMonth(),
    }));
  };

  // CONTEXTO: Función para obtener clases de una fecha específica
  const getClassesForDate = (dateString: string) => {
    return transformedClasses.filter((cls) => cls.date === dateString);
  };

  // CONTEXTO: Función para navegar entre meses
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // CONTEXTO: Función para manejar navegación por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigateMonth("prev");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      navigateMonth("next");
    }
  };

  // CONTEXTO: Función para agregar clase extra
  const handleAddExtraClass = async (classData: ExtraClassFormData) => {
    try {
      const response = await fetch("/api/classes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplineId: classData.disciplineId,
          instructorId: classData.instructor,
          date: classData.date,
          time: classData.time,
          capacity: classData.capacity,
        }),
      });

      if (response.ok) {
        toast({
          title: "Clase Extra Agregada",
          description: "La clase extra ha sido agregada exitosamente.",
        });
        setIsAddingClass(false);
        // Recargar clases del día
        // El hook se encargará de recargar automáticamente
      } else {
        const error = await response.json();
        toast({
          title: "Error al Agregar Clase",
          description: error.message || "Error al agregar la clase extra.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al Agregar Clase",
        description: "Error inesperado al agregar la clase extra.",
        variant: "destructive",
      });
    }
  };

  // CONTEXTO: Función para cancelar clase individual
  const handleCancelClass = async (classId: string) => {
    try {
      // Buscar la clase en el estado local
      const classToCancel = monthlyClasses.find((cls) => cls.id === classId);

      if (!classToCancel) {
        toast({
          title: "Error",
          description: "Clase no encontrada.",
          variant: "destructive",
        });
        return;
      }

      // Usar la nueva API unificada
      const response = await fetch("/api/classes/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          classData: classToCancel,
        }),
      });

      if (response.ok) {
        toast({
          title: "Clase Cancelada",
          description: "Clase cancelada exitosamente.",
        });
        // El hook se encargará de recargar automáticamente
      } else {
        const error = await response.json();
        toast({
          title: "Error al Cancelar Clase",
          description: error.message || "Error al cancelar la clase.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al Cancelar Clase",
        description: "Error inesperado al cancelar la clase.",
        variant: "destructive",
      });
    }
  };

  // CONTEXTO: Función para cancelar todas las clases de un día
  const handleCancelAllClasses = async () => {
    if (!selectedDate) return;

    try {
      const response = await fetch("/api/classes/admin/cancel-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (response.ok) {
        setShowCancelAllDialog(false);
        setSelectedDate(null);
        toast({
          title: "Clases Canceladas",
          description: `Todas las clases futuras para el ${formatDateForDisplay(
            selectedDate
          )} han sido canceladas.`,
        });
        // El hook se encargará de recargar automáticamente
      } else {
        const error = await response.json();
        toast({
          title: "Error al Cancelar Clases",
          description: error.message || "Error al cancelar las clases.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al Cancelar Clases",
        description: "Error inesperado al cancelar las clases.",
        variant: "destructive",
      });
    }
  };

  // CONTEXTO: Función para ver detalles de la clase
  const handleViewClassDetails = (cls: TransformedClass) => {
    setSelectedClass(cls);
    setShowClassDetails(true);
  };

  // CONTEXTO: Obtener clases para la fecha seleccionada
  const classesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return transformedClasses.filter(
      (cls) => cls.date === selectedDate && !cls.cancelled
    );
  }, [selectedDate, transformedClasses]);

  // CONTEXTO: Obtener días del mes actual
  const days = getDaysInMonth(currentDate);

  // CONTEXTO: Nombres de meses y días
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  // CONTEXTO: Opciones de tiempo para el formulario
  const timeOptions = [
    "06:00",
    "06:30",
    "07:00",
    "07:30",
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
  ];

  // CONTEXTO: Mostrar skeleton loader mientras carga
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // CONTEXTO: Mostrar error si hay problemas
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Calendario de Clases</h2>
        </div>
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">
            Error al cargar clases
          </h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    // Contenedor principal con navegación por teclado y focus management
    <div className="space-y-6" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendario de Clases</h2>
        <div className="flex items-center gap-4">
          {/* Filtro de disciplina */}
          <div className="flex items-center gap-2">
            <Label htmlFor="discipline-filter" className="text-sm font-medium">
              Disciplina:
            </Label>
            <Select
              value={selectedDiscipline}
              onValueChange={setSelectedDiscipline}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las disciplinas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las disciplinas</SelectItem>
                {disciplines
                  .filter((d) => d.isActive)
                  .map((discipline) => (
                    <SelectItem key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              setExtraClassForm({
                disciplineId: "",
                instructor: "",
                date: getDateString(new Date()),
                time: "",
                capacity: 15,
              });
              setIsAddingClass(true);
            }}
            aria-label="Agregar clase extra para hoy"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Clase Extra
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Calendario Grid */}
      <div className="space-y-2">
        {/* Header de días */}
        <div className="grid grid-cols-7 gap-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center font-medium text-sm text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayClasses = getClassesForDate(day.dateString);
            const isToday = day.dateString === getDateString(new Date());

            // Verificar si todas las clases del día ya pasaron
            const allClassesPast =
              dayClasses.length > 0 &&
              dayClasses.every((cls) => isClassPast(cls.dateTime));

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border rounded-lg text-left hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1 cursor-pointer ${
                  !day.isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                } ${isToday ? "bg-blue-50 border-blue-200" : ""} ${
                  allClassesPast ? "opacity-70" : ""
                }`}
                onClick={() => setSelectedDate(day.dateString)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedDate(day.dateString);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Ver clases para ${formatDateForDisplay(
                  day.dateString
                )}`}
              >
                <div className="font-medium text-sm mb-1">
                  {day.date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayClasses.slice(0, 3).map((cls) => (
                    <div
                      key={cls.id}
                      className={`text-xs p-1 rounded ${
                        cls.cancelled
                          ? "bg-red-100 text-red-700 line-through"
                          : cls.isGenerated
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewClassDetails(cls);
                      }}
                    >
                      <div className="font-medium truncate">{cls.name}</div>
                      <div className="text-xs opacity-75">
                        {cls.time} • {cls.instructor}
                      </div>
                      {cls.isGenerated && (
                        <div className="text-xs opacity-50">Generada</div>
                      )}
                    </div>
                  ))}
                  {dayClasses.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayClasses.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de clases del día seleccionado */}
      <Dialog
        open={!!selectedDate}
        onOpenChange={(open) => {
          if (!open) setSelectedDate(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Clases para{" "}
              {selectedDate ? formatDateForDisplay(selectedDate) : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {classesForSelectedDate.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay clases programadas para este día.</p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => {
                    setExtraClassForm({
                      disciplineId: "",
                      instructor: "",
                      date: selectedDate || "",
                      time: "",
                      capacity: 15,
                    });
                    setIsAddingClass(true);
                    setSelectedDate(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Clase
                </Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    {classesForSelectedDate.length} clase
                    {classesForSelectedDate.length !== 1 ? "s" : ""} programada
                    {classesForSelectedDate.length !== 1 ? "s" : ""}
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCancelAllDialog(true)}
                  >
                    Cancelar Todas
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {classesForSelectedDate.map((cls) => (
                    <Card key={cls.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">
                              {cls.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {cls.instructor}
                            </p>
                          </div>
                          <Badge
                            variant={
                              cls.isGenerated
                                ? "secondary"
                                : cls.isExtra
                                ? "default"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {cls.isGenerated
                              ? "Generada"
                              : cls.isExtra
                              ? "Extra"
                              : "Regular"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                          {cls.instructor !== "Por asignar" && (
                            <>
                              <User className="w-4 h-4" />
                              <span>{cls.instructor}</span>
                            </>
                          )}
                          <Clock className="w-4 h-4" />
                          <span>{cls.time}</span>
                          <Clock className="w-4 h-4" />
                          <span>{cls.duration}</span>
                          <Users className="w-4 h-4" />
                          <span>{cls.alumnRegistred}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              handleViewClassDetails(cls);
                              setSelectedDate(null);
                            }}
                          >
                            Ver Detalles
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelClass(cls.id)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para cancelar todas las clases */}
      <AlertDialog
        open={showCancelAllDialog}
        onOpenChange={setShowCancelAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Todas las Clases</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cancelar todas las clases futuras
              para el {selectedDate && formatDateForDisplay(selectedDate)}? Esta
              acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAllClasses}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para agregar clase extra */}
      <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Clase Extra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="discipline">Disciplina</Label>
              <Select
                value={extraClassForm.disciplineId}
                onValueChange={(value) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    disciplineId: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines
                    .filter((d) => d.isActive)
                    .map((discipline) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="instructor">Instructor</Label>
              <Select
                value={extraClassForm.instructor}
                onValueChange={(value) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    instructor: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar instructor" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === "coach" || u.role === "admin")
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={extraClassForm.date}
                onChange={(e) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="time">Hora</Label>
              <Select
                value={extraClassForm.time}
                onValueChange={(value) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    time: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar hora" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="capacity">Capacidad</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="50"
                value={extraClassForm.capacity}
                onChange={(e) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    capacity: parseInt(e.target.value) || 15,
                  }))
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingClass(false)}>
                Cancelar
              </Button>
              <Button onClick={() => handleAddExtraClass(extraClassForm)}>
                Agregar Clase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drawer de detalles de clase */}
      {selectedClass && (
        <AdminClassDetailDrawer
          classItem={selectedClass}
          isOpen={showClassDetails}
          onClose={() => {
            setShowClassDetails(false);
            setSelectedClass(null);
          }}
          onCancelClass={handleCancelClass}
        />
      )}
    </div>
  );
}
