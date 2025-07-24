"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
import ClassCard from "./class-card";
import { useClassSchedule } from "@/lib/hooks/useClassSchedule";
import { Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
import {
  formatDateLocal,
  toDateString,
  toTimeString,
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

  // State management for cancelled classes
  const [cancelledClasses, setCancelledClasses] = useState<Set<string>>(
    new Set()
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [, setCancellationError] = useState<string | null>(null);

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
    setClasses: setMonthlyClasses,
    isLoading: isLoadingClasses,
    error,
  } = useClassSchedule(currentDate);

  // CONTEXTO: `classSessions` del store ahora se usará para obtener datos históricos
  // o para sobreescribir las clases generadas si ya existen en la "base de datos".
  const {
    instructors,
    disciplines,
    fetchUsers,
    fetchInstructors,
    fetchDisciplines,
  } = useBlackSheepStore();

  const { toast } = useToast();

  // Helper function for retry mechanism (currently unused but kept for future use)
  // const retryOperation = useCallback(
  //   async (operation: () => Promise<void>, maxRetries = 2) => {
  //     let attempts = 0;
  //     while (attempts < maxRetries) {
  //       try {
  //         await operation();
  //         return;
  //       } catch (error) {
  //         attempts++;
  //         if (attempts >= maxRetries) {
  //           throw error;
  //         }
  //         // Wait before retry
  //         await new Promise((resolve) => setTimeout(resolve, 1000));
  //       }
  //     }
  //   },
  //   []
  // );

  // Helper functions for cancelled classes
  const isClassCancelled = useCallback(
    (classId: string) => {
      return cancelledClasses.has(classId);
    },
    [cancelledClasses]
  );

  const addCancelledClass = useCallback((classId: string) => {
    setCancelledClasses((prev) => new Set([...prev, classId]));
  }, []);

  const addCancelledClasses = useCallback((classIds: string[]) => {
    setCancelledClasses((prev) => {
      const newSet = new Set(prev);
      classIds.forEach((id) => newSet.add(id));
      return newSet;
    });
  }, []);

  // Cargar datos básicos al montar
  useEffect(() => {
    const loadData = async () => {
      console.log("Loading initial data...");
      await fetchUsers();
      await fetchInstructors();
      if (!disciplines || disciplines.length === 0) {
        await fetchDisciplines();
      }
      console.log("Data loaded:", {
        instructors: instructors.length,
        disciplines: disciplines?.length || 0,
      });
    };
    loadData();
  }, [
    fetchUsers,
    fetchInstructors,
    fetchDisciplines,
    disciplines,
    instructors.length,
  ]);

  // CONTEXTO: Función helper para formatear fechas sin problemas de zona horaria
  const formatDateForDisplay = (dateString: string) => {
    // Crear fecha local para evitar problemas de zona horaria
    const [year, month, day] = dateString.split("-").map(Number);
    const localDate = new Date(year, month - 1, day); // month-1 porque Date usa 0-11

    return formatDateLocal(localDate, {
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
        .map((cls: ClassSession): TransformedClass => {
          const discipline = disciplines?.find(
            (d) => d.id === cls.disciplineId
          );
          const instructor = instructors.find((i) => i.id === cls.instructorId);
          const instructorName = instructor
            ? `${instructor.firstName} ${instructor.lastName}`
            : "";

          // const classDate = new Date(cls.dateTime); // Currently unused
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
            date: toDateString(new Date(cls.dateTime)), // USAR FECHA LOCAL
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
    [monthlyClasses, disciplines, instructors, selectedDiscipline]
  );

  // CONTEXTO: Función para obtener los días del mes actual
  const getDaysInMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    // Para que el calendario se muestre correctamente, necesitamos los días que completan la primera y última semana.
    // Configuramos para que la semana empiece en lunes (weekStartsOn: 1)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

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

  // CONTEXTO: Función para obtener clases de una fecha específica con filtrado inteligente
  const getClassesForDate = (dateString: string) => {
    const filteredClasses = transformedClasses.filter((cls) => {
      // Filtrar por fecha y clases canceladas localmente
      if (cls.date !== dateString || isClassCancelled(cls.id)) {
        return false;
      }

      // OPTIMIZACIÓN: Ocultar clases pasadas sin usuarios inscritos
      const isPast = isClassPast(cls.dateTime);
      const hasUsers = cls.enrolled > 0;
      const isGenerated = cls.type === "regular"; // Las clases generadas son "regular"

      // Si es una clase pasada, generada y sin usuarios, no mostrarla
      if (isPast && isGenerated && !hasUsers) {
        return false;
      }

      return true;
    });

    return filteredClasses;
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
    console.log("Form data received:", classData);

    // Validate form data before sending
    if (
      !classData.disciplineId ||
      !classData.instructor ||
      !classData.date ||
      !classData.time
    ) {
      console.log("Validation failed:", {
        disciplineId: !!classData.disciplineId,
        instructor: !!classData.instructor,
        date: !!classData.date,
        time: !!classData.time,
      });
      toast({
        title: "Error de Validación",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);

    const requestData = {
      disciplineId: classData.disciplineId,
      instructorId: classData.instructor,
      startDate: classData.date,
      endDate: classData.date, // Same date for single class
      time: classData.time,
      maxCapacity: classData.capacity,
      notes: "Clase extra agregada manualmente",
    };

    console.log("Sending request data:", requestData);
    console.log("Form data:", classData);

    try {
      const response = await fetch("/api/classes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("API Response:", result);

        // Agregar la clase directamente al estado sin recargar
        if (result.classes && result.classes.length > 0) {
          const newClasses = result.classes.map((cls: ClassSession) => ({
            ...cls,
            // dateLocal: classData.date, // Removed as it's not part of ClassSession type
            // Asegurar que tenga todos los campos necesarios
            registeredParticipantsIds: cls.registeredParticipantsIds || [],
            waitlistParticipantsIds: cls.waitlistParticipantsIds || [],
            status: cls.status || "scheduled",
            isGenerated: false, // Es una clase extra, no generada
          }));

          setMonthlyClasses((prev) => [...prev, ...newClasses]);
          console.log("Added new classes to calendar:", newClasses);
        }

        toast({
          title: "Clase Extra Agregada",
          description: "La clase extra ha sido agregada exitosamente.",
        });
        setIsAddingClass(false);

        // Reset form
        setExtraClassForm({
          disciplineId: "",
          instructor: "",
          date: "",
          time: "",
          capacity: 15,
        });
      } else {
        const error = await response.json();
        console.error("API Error:", error);
        console.error("Response status:", response.status);
        toast({
          title: "Error al Agregar Clase",
          description:
            error.error || error.message || "Error al agregar la clase extra.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al Agregar Clase",
        description: "Error inesperado al agregar la clase extra.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // CONTEXTO: Función para cancelar clase individual
  const handleCancelClass = async (classId: string) => {
    setIsCancelling(true);
    setCancellationError(null);

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

      // Update local state immediately for reactive UI
      addCancelledClass(classId);

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
      } else {
        // If API fails, revert the local state
        setCancelledClasses((prev) => {
          const newSet = new Set(prev);
          newSet.delete(classId);
          return newSet;
        });

        const error = await response.json();
        toast({
          title: "Error al Cancelar Clase",
          description: error.message || "Error al cancelar la clase.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // If error occurs, revert the local state
      setCancelledClasses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(classId);
        return newSet;
      });

      toast({
        title: "Error al Cancelar Clase",
        description: "Error inesperado al cancelar la clase.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // CONTEXTO: Función para cancelar todas las clases de un día
  const handleCancelAllClasses = async () => {
    if (!selectedDate) return;

    setIsCancelling(true);
    setCancellationError(null);

    try {
      // Get all classes for the selected date
      const classesForDay = transformedClasses.filter(
        (cls) =>
          cls.date === selectedDate &&
          !cls.cancelled &&
          !isClassCancelled(cls.id)
      );
      const classIds = classesForDay.map((cls) => cls.id);

      if (classIds.length === 0) {
        toast({
          title: "Sin clases",
          description: "No hay clases para cancelar en esta fecha.",
        });
        setShowCancelAllDialog(false);
        return;
      }

      // Update local state immediately for reactive UI
      addCancelledClasses(classIds);

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
      } else {
        // If API fails, revert the local state
        setCancelledClasses((prev) => {
          const newSet = new Set(prev);
          classIds.forEach((id) => newSet.delete(id));
          return newSet;
        });

        const error = await response.json();
        toast({
          title: "Error al Cancelar Clases",
          description: error.message || "Error al cancelar las clases.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // If error occurs, revert the local state
      const classesForDay = transformedClasses.filter(
        (cls) => cls.date === selectedDate && !cls.cancelled
      );
      const classIds = classesForDay.map((cls) => cls.id);

      setCancelledClasses((prev) => {
        const newSet = new Set(prev);
        classIds.forEach((id) => newSet.delete(id));
        return newSet;
      });

      toast({
        title: "Error al Cancelar Clases",
        description: "Error inesperado al cancelar las clases.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // CONTEXTO: Función para ver detalles de la clase
  const handleViewClassDetails = (cls: TransformedClass) => {
    setSelectedClass(cls);
    setShowClassDetails(true);
  };

  // CONTEXTO: Obtener clases para la fecha seleccionada con filtrado inteligente
  const classesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return transformedClasses.filter((cls) => {
      // Filtrar por fecha, canceladas y canceladas localmente
      if (
        cls.date !== selectedDate ||
        cls.cancelled ||
        isClassCancelled(cls.id)
      ) {
        return false;
      }

      // OPTIMIZACIÓN: Ocultar clases pasadas sin usuarios inscritos
      const isPast = isClassPast(cls.dateTime);
      const hasUsers = cls.enrolled > 0;
      const isGenerated = cls.type === "regular";

      // Si es una clase pasada, generada y sin usuarios, no mostrarla
      if (isPast && isGenerated && !hasUsers) {
        return false;
      }

      return true;
    });
  }, [selectedDate, transformedClasses, isClassCancelled]);

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

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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
  if (isLoadingClasses) {
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
                  ?.filter((d) => d.isActive)
                  .map((discipline) => (
                    <SelectItem key={discipline.id} value={discipline.id}>
                      {discipline.name}
                    </SelectItem>
                  )) || []}
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

            // Get all classes for the day (including cancelled ones) to show cancelled indicator
            const allDayClasses = transformedClasses.filter(
              (cls) => cls.date === day.dateString
            );
            const cancelledDayClasses = allDayClasses.filter((cls) =>
              isClassCancelled(cls.id)
            );
            const hasCancelledClasses = cancelledDayClasses.length > 0;

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
                onClick={() => {
                  setSelectedDate(day.dateString);
                }}
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
                <div className="font-medium text-sm mb-1 flex justify-between items-center">
                  <span>{day.date.getDate()}</span>
                  {hasCancelledClasses && (
                    <span
                      className="text-xs text-red-500 font-medium"
                      title="Clases canceladas"
                    >
                      ✕
                    </span>
                  )}
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
                  <div className="text-sm text-gray-600">
                    <p>
                      {classesForSelectedDate.length} clase
                      {classesForSelectedDate.length !== 1 ? "s" : ""}{" "}
                      programada
                      {classesForSelectedDate.length !== 1 ? "s" : ""}
                    </p>
                    {selectedDate &&
                      (() => {
                        const allDayClasses = transformedClasses.filter(
                          (cls) => cls.date === selectedDate
                        );
                        const cancelledCount = allDayClasses.filter((cls) =>
                          isClassCancelled(cls.id)
                        ).length;
                        return cancelledCount > 0 ? (
                          <p className="text-red-600 text-xs">
                            {cancelledCount} clase
                            {cancelledCount !== 1 ? "s" : ""} cancelada
                            {cancelledCount !== 1 ? "s" : ""}
                          </p>
                        ) : null;
                      })()}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCancelAllDialog(true)}
                    disabled={
                      classesForSelectedDate.length === 0 || isCancelling
                    }
                  >
                    {isCancelling ? "Cancelando..." : "Cancelar Todas"}
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {classesForSelectedDate.map((cls) => (
                    <ClassCard
                      key={cls.id}
                      cls={cls}
                      onViewDetails={(cls) => {
                        handleViewClassDetails(cls);
                        setSelectedDate(null);
                      }}
                      onCancel={handleCancelClass}
                      isLoading={isCancelling}
                    />
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
            <AlertDialogCancel disabled={isCancelling}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAllClasses}
              disabled={isCancelling}
            >
              {isCancelling ? "Cancelando..." : "Confirmar"}
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
              <Label htmlFor="discipline">Disciplina *</Label>
              <Select
                value={extraClassForm.disciplineId}
                onValueChange={(value) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    disciplineId: value,
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar disciplina" />
                </SelectTrigger>
                <SelectContent>
                  {disciplines
                    ?.filter((d) => d.isActive)
                    .map((discipline) => (
                      <SelectItem key={discipline.id} value={discipline.id}>
                        {discipline.name}
                      </SelectItem>
                    )) || []}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="instructor">Instructor *</Label>
              <Select
                value={extraClassForm.instructor}
                onValueChange={(value) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    instructor: value,
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar instructor" />
                </SelectTrigger>
                <SelectContent>
                  {instructors
                    .filter((instructor) => instructor.isActive)
                    .map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.firstName} {instructor.lastName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Fecha *</Label>
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
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Hora *</Label>
              <Select
                value={extraClassForm.time}
                onValueChange={(value) =>
                  setExtraClassForm((prev) => ({
                    ...prev,
                    time: value,
                  }))
                }
                required
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
              <Button
                variant="outline"
                onClick={() => setIsAddingClass(false)}
                disabled={isCancelling}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  console.log("Button clicked, form data:", extraClassForm);
                  handleAddExtraClass(extraClassForm);
                }}
                disabled={isCancelling}
              >
                {isCancelling ? "Agregando..." : "Agregar Clase"}
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
