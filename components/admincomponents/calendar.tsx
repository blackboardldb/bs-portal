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
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
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
  // CONTEXTO: Este estado local contendrá las clases generadas para el mes visible.
  // Es más eficiente que usar el store global para esto.
  const [monthlyClasses, setMonthlyClasses] = useState<ClassSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [showCancelAllDialog, setShowCancelAllDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TransformedClass | null>(
    null
  );
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingClasses, setIsGeneratingClasses] = useState(false);

  // Estados para el formulario de clase extra
  const [extraClassForm, setExtraClassForm] = useState<ExtraClassFormData>({
    disciplineId: "",
    instructor: "",
    date: "",
    time: "",
    capacity: 15,
  });

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

  // CONTEXTO: Esta es la función clave. Genera las clases para un mes basándose en los
  // horarios de las disciplinas. Es rápida porque opera sobre datos en memoria.
  const generateClassesForMonth = useCallback(
    (date: Date, disciplines: any[]) => {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const daysInMonth = eachDayOfInterval({ start, end });
      const dayMapping: DayOfWeek[] = [
        "dom",
        "lun",
        "mar",
        "mie",
        "jue",
        "vie",
        "sab",
      ];

      const generatedClasses: ClassSession[] = [];

      daysInMonth.forEach((day) => {
        const dayOfWeek = dayMapping[getDay(day)];

        disciplines.forEach((discipline) => {
          const scheduleForDay = discipline.schedule?.find(
            (s: any) => s.day === dayOfWeek
          );
          if (scheduleForDay) {
            scheduleForDay.times.forEach((time: string) => {
              const [hour, minute] = time.split(":");

              // Usar las nuevas funciones de zona horaria
              const localDate = createLocalDate(
                day.getFullYear(),
                day.getMonth() + 1,
                day.getDate(),
                parseInt(hour, 10),
                parseInt(minute, 10)
              );
              const classDateTime = localToUTC(localDate, time);

              generatedClasses.push({
                id: `gen_${discipline.id}_${format(
                  localDate,
                  "yyyy-MM-dd_HH-mm"
                )}`,
                organizationId: "org_blacksheep_001",
                disciplineId: discipline.id,
                name: discipline.name,
                dateTime: classDateTime,
                durationMinutes: 60, // Se puede hacer configurable en la disciplina
                instructorId: "inst_default", // Lógica de asignación puede ir aquí
                capacity: 15, // Se puede hacer configurable
                registeredParticipantsIds: [],
                waitlistParticipantsIds: [],
                status: "scheduled",
                notes:
                  "Clase generada dinámicamente desde horarios de disciplina",
              });
            });
          }
        });
      });

      setMonthlyClasses(generatedClasses);
    },
    []
  );

  useEffect(() => {
    setIsLoading(true);
    fetchClassSessions();
    fetchUsers();
    // CONTEXTO: Asegurarse de que las disciplinas están cargadas.
    if (disciplines.length === 0) {
      fetchDisciplines();
    }
    setIsLoading(false);
  }, [fetchClassSessions, fetchUsers, fetchDisciplines, disciplines.length]);

  // CONTEXTO: Este efecto se encarga de (re)generar las clases cada vez que
  // el usuario cambia de mes o cuando las disciplinas (nuestra fuente de verdad) se cargan.
  useEffect(() => {
    const now = new Date();
    setIsGeneratingClasses(true);

    // Si el mes que se ve es anterior al actual
    if (
      getYear(currentDate) < getYear(now) ||
      (getYear(currentDate) === getYear(now) &&
        getMonth(currentDate) < getMonth(now))
    ) {
      // Cargar datos históricos desde la API
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      fetchClassSessions(start, end).then((data) => {
        setMonthlyClasses(data.classes);
        setIsGeneratingClasses(false);
      });
    } else {
      // Generar clases para el mes actual o futuro
      if (disciplines.length > 0) {
        generateClassesForMonth(currentDate, disciplines);
        setIsGeneratingClasses(false);
      }
    }
  }, [currentDate, disciplines, generateClassesForMonth, fetchClassSessions]);

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

  // Función helper para formatear fechas sin problemas de zona horaria
  const formatDateForDisplay = (dateString: string) => {
    return formatDateLocal(dateString, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Función helper para obtener fecha en formato YYYY-MM-DD sin zona horaria
  const getDateString = (date: Date) => {
    return toDateString(date);
  };

  // CONTEXTO: Este `useMemo` ahora transforma las clases generadas localmente (`monthlyClasses`)
  // en lugar de las clases globales del store. Esto hace que el calendario sea dinámico.
  const transformedClasses = useMemo(
    () =>
      monthlyClasses.map((cls: ClassSession): TransformedClass => {
        const discipline = disciplines.find((d) => d.id === cls.disciplineId);
        const instructor = users.find((u) => u.id === cls.instructorId);

        // Determinar si es clase generada o extra
        const isGenerated = cls.id.startsWith("gen_");
        const isExtra = cls.notes?.includes("Clase extra") || false;

        return {
          id: cls.id,
          dateTime: cls.dateTime,
          name: discipline?.name || cls.name,
          instructor: instructor
            ? `${instructor.firstName} ${instructor.lastName}`
            : "Por asignar",
          duration: `${cls.durationMinutes || 60} min`,
          alumnRegistred: `${cls.registeredParticipantsIds.length}/${
            cls.capacity || 15
          }`,
          isRegistered: cls.registeredParticipantsIds.length > 0, // Agregado para compatibilidad
          status: cls.status,
          discipline: discipline?.name || cls.name,
          disciplineId: cls.disciplineId,
          date: toDateString(cls.dateTime),
          time: toTimeString(cls.dateTime),
          color: discipline?.color || "#666",
          capacity: cls.capacity,
          enrolled: cls.registeredParticipantsIds.length,
          type: isExtra ? "extra" : "regular",
          cancelled: cls.status === "cancelled",
          registeredParticipantsIds: cls.registeredParticipantsIds,
          waitlistParticipantsIds: cls.waitlistParticipantsIds, // Agregado para compatibilidad
          isGenerated,
          isExtra,
          historicalData: {
            // TODO: Reemplazar con datos reales de la API cuando esté disponible
            averageAttendance: Math.floor(Math.random() * 10) + 5,
            noShowRate: Math.random() * 0.3,
            waitlistFrequency: Math.random() * 0.2,
            popularityTrend: ["up", "down", "stable"][
              Math.floor(Math.random() * 3)
            ] as "up" | "down" | "stable",
          },
          notes: cls.notes || "",
        };
      }),
    [monthlyClasses, disciplines, users]
  );

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        dateString: getDateString(prevDate),
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        dateString: getDateString(date),
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        dateString: getDateString(nextDate),
      });
    }

    return days;
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const getClassesForDate = (dateString: string) => {
    return transformedClasses.filter(
      (cls) => cls.date === dateString && !cls.cancelled
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Navegación por teclado
  // Permite usar las flechas izquierda/derecha para navegar entre meses
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      navigateMonth("prev");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      navigateMonth("next");
    }
  };

  const handleAddExtraClass = async (classData: ExtraClassFormData) => {
    console.log("=== INICIO: handleAddExtraClass ===");
    console.log("Datos del formulario:", classData);

    const discipline = disciplines.find((d) => d.id === classData.disciplineId);
    console.log("Disciplina encontrada:", discipline);

    if (!discipline) {
      console.error("❌ No se encontró la disciplina");
      toast({
        title: "Error al Agregar Clase Extra",
        description: "Disciplina no encontrada.",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        startDate: classData.date,
        endDate: classData.date,
        disciplineId: classData.disciplineId,
        instructorId: "inst_default",
        time: classData.time,
        maxCapacity: classData.capacity || 15,
        notes: "Clase extra", // Marcar como clase extra
      };

      console.log("Payload a enviar:", payload);

      const response = await fetch("/api/classes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(
        "Respuesta del servidor:",
        response.status,
        response.statusText
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log("Datos de respuesta:", responseData);

        // Agregar la nueva clase al estado local inmediatamente
        if (responseData.classes && responseData.classes.length > 0) {
          const newClass = responseData.classes[0]; // Tomamos la primera clase creada
          setMonthlyClasses((prev) => [...prev, newClass]);
          console.log("✅ Clase agregada al estado local:", newClass);
        }

        await fetchClassSessions();
        setIsAddingClass(false);
        // Resetear el formulario
        setExtraClassForm({
          disciplineId: "",
          instructor: "",
          date: "",
          time: "",
          capacity: 15,
        });
        toast({
          title: "Clase Extra Agregada",
          description: `Clase extra para ${
            discipline.name
          } el ${formatDateForDisplay(classData.date)} a las ${
            classData.time
          } agregada.`,
        });
        console.log("✅ Clase extra agregada exitosamente");
      } else {
        const error = await response.json();
        console.error("❌ Error del servidor:", error);
        toast({
          title: "Error al Agregar Clase Extra",
          description: error.message || "Error al agregar la clase extra.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Error inesperado:", error);
      toast({
        title: "Error al Agregar Clase Extra",
        description: "Error inesperado al agregar la clase extra.",
        variant: "destructive",
      });
    }
  };

  const handleCancelClass = async (classId: string) => {
    try {
      // Buscar la clase en el estado local para verificar si es generada
      const classToCancel = monthlyClasses.find((cls) => cls.id === classId);
      const isGenerated = classToCancel?.id.startsWith("gen_") || false;

      // Si es una clase generada dinámicamente, solo actualizar el estado local
      if (isGenerated) {
        setMonthlyClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId ? { ...cls, status: "cancelled" } : cls
          )
        );

        toast({
          title: "Clase Cancelada",
          description: `Clase generada cancelada localmente.`,
        });
        return;
      }

      // Para clases reales, usar la API
      const response = await fetch(`/api/classes/${classId}/admin/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        // Actualizar el estado local inmediatamente
        setMonthlyClasses((prev) =>
          prev.map((cls) =>
            cls.id === classId ? { ...cls, status: "cancelled" } : cls
          )
        );

        // También actualizar desde el servidor
        await fetchClassSessions();

        toast({
          title: "Clase Cancelada",
          description: `Clase cancelada exitosamente.`,
        });
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

  const handleCancelAllClasses = async () => {
    console.log("🚀 handleCancelAllClasses iniciado con fecha:", selectedDate);
    if (selectedDate) {
      try {
        console.log("📡 Enviando request a /api/classes/admin/cancel-bulk");
        console.log("📦 Payload:", { date: selectedDate });

        // Asegurar que la fecha esté en el formato correcto YYYY-MM-DD
        const formattedDate = selectedDate.split("T")[0]; // Tomar solo la parte de la fecha
        console.log("📅 Fecha formateada:", formattedDate);

        // Debug adicional para verificar fechas
        console.log("🔍 Debug de fechas:", {
          selectedDate,
          formattedDate,
          classesForSelectedDate: classesForSelectedDate.map((cls) => ({
            id: cls.id,
            date: cls.date,
            dateTime: cls.dateTime,
            matchesSelectedDate: cls.date === selectedDate,
          })),
        });

        const response = await fetch("/api/classes/admin/cancel-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: formattedDate }),
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response ok:", response.ok);

        if (response.ok) {
          const responseData = await response.json();
          console.log("✅ Response data:", responseData);

          // Actualizar el estado local inmediatamente usando la fecha formateada
          setMonthlyClasses((prev) =>
            prev.map((cls) => {
              // Usar la misma lógica que en transformedClasses para obtener la fecha
              const classDate = toDateString(cls.dateTime);
              return classDate === formattedDate
                ? { ...cls, status: "cancelled" }
                : cls;
            })
          );

          // No regenerar las clases, solo sincronizar con el servidor
          await fetchClassSessions();

          setShowCancelAllDialog(false);
          setSelectedDate(null); // Cerrar el dialog

          toast({
            title: "Todas las Clases Canceladas",
            description: `Todas las clases programadas para el ${formatDateForDisplay(
              selectedDate
            )} han sido canceladas.`,
          });
        } else {
          const error = await response.json();
          console.error("❌ API Error:", error);
          toast({
            title: "Error al Cancelar Todas las Clases",
            description: error.message || "Error al cancelar todas las clases.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("❌ Error en handleCancelAllClasses:", error);
        toast({
          title: "Error al Cancelar Todas las Clases",
          description: "Error inesperado al cancelar todas las clases.",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewClassDetails = (cls: TransformedClass) => {
    // CONTEXTO: Ahora recibimos una clase ya transformada, no necesitamos transformarla de nuevo
    setSelectedClass(cls);
    setShowClassDetails(true);
  };

  const classesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const filtered = transformedClasses.filter(
      (cls) => cls.date === selectedDate && !cls.cancelled
    );
    console.log("🔍 Debug classesForSelectedDate:", {
      selectedDate,
      totalClasses: transformedClasses.length,
      filteredClasses: filtered.length,
      allClassesForDate: transformedClasses.filter(
        (cls) => cls.date === selectedDate
      ),
      // Debug de fechas para ver si hay problemas de zona horaria
      sampleClasses: transformedClasses.slice(0, 3).map((cls) => ({
        id: cls.id,
        originalDateTime: cls.dateTime,
        convertedDate: cls.date,
        selectedDate: selectedDate,
        matches: cls.date === selectedDate,
      })),
    });
    return filtered;
  }, [selectedDate, transformedClasses]);

  return (
    // Contenedor principal con navegación por teclado y focus management
    <div className="space-y-6" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendario de Clases</h2>
        <div className="flex items-center gap-4">
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
            <h3 className="text-lg font-medium min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
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

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-2 text-center font-medium text-sm text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dayClasses = getClassesForDate(day.dateString);
              const isToday = day.dateString === getDateString(new Date());

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg text-left hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1 cursor-pointer ${
                    !day.isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                  } ${isToday ? "bg-blue-50 border-blue-200" : ""}`}
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
                    {/* Skeleton loaders mientras se cargan/generan las clases */}
                    {(isLoading || isGeneratingClasses) &&
                    day.isCurrentMonth ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full rounded" />
                      ))
                    ) : (
                      <>
                        {dayClasses.slice(0, 3).map((cls) => (
                          <div
                            key={cls.id}
                            className="text-xs p-1 rounded text-white truncate relative group"
                            style={{ backgroundColor: cls.color }}
                          >
                            <div className="flex justify-between items-center">
                              <span>
                                {cls.time} {cls.discipline}
                              </span>
                              <div className="flex items-center gap-1">
                                {cls.isExtra && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Extra
                                  </Badge>
                                )}
                                {/* Indicador de clase generada vs real */}
                                {cls.isGenerated && !cls.isExtra && (
                                  <span
                                    className="text-xs opacity-75"
                                    title="Clase generada dinámicamente"
                                  >
                                    🔄
                                  </span>
                                )}
                                {!cls.isGenerated &&
                                  cls.registeredParticipantsIds.length > 0 && (
                                    <span
                                      className="text-xs opacity-75"
                                      title="Clase con actividad real"
                                    >
                                      ✅
                                    </span>
                                  )}
                              </div>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelClass(cls.id);
                              }}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={`Cancelar clase ${cls.discipline}`}
                            >
                              <X className="w-2 h-2 text-white" />
                            </button>
                          </div>
                        ))}

                        {dayClasses.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayClasses.length - 3} más
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {isAddingClass && (
        <Dialog open={isAddingClass} onOpenChange={setIsAddingClass}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Clase Extra</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                console.log("=== FORMULARIO ENVIADO ===");
                console.log("Estado del formulario:", extraClassForm);
                console.log("Disciplinas disponibles:", disciplines);

                // Validación explícita
                if (!extraClassForm.disciplineId) {
                  console.error("❌ Falta disciplina");
                  toast({
                    title: "Error de Validación",
                    description: "Por favor selecciona una disciplina.",
                    variant: "destructive",
                  });
                  return;
                }

                if (!extraClassForm.date) {
                  console.error("❌ Falta fecha");
                  toast({
                    title: "Error de Validación",
                    description: "Por favor selecciona una fecha.",
                    variant: "destructive",
                  });
                  return;
                }

                if (!extraClassForm.time) {
                  console.error("❌ Falta hora");
                  toast({
                    title: "Error de Validación",
                    description: "Por favor selecciona una hora.",
                    variant: "destructive",
                  });
                  return;
                }

                console.log("✅ Validación pasada, enviando datos...");
                handleAddExtraClass(extraClassForm);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="discipline-select">Disciplina *</Label>
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
                  <SelectTrigger
                    id="discipline-select"
                    aria-describedby="discipline-help"
                  >
                    <SelectValue placeholder="Seleccionar disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {disciplines.map((d) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p
                  id="discipline-help"
                  className="text-xs text-muted-foreground mt-1"
                >
                  Selecciona la disciplina para la clase extra
                </p>
              </div>

              <div>
                <Label htmlFor="instructor-input">Instructor (opcional)</Label>
                <Input
                  id="instructor-input"
                  name="instructor"
                  placeholder="Nombre del instructor"
                  value={extraClassForm.instructor}
                  onChange={(e) =>
                    setExtraClassForm((prev) => ({
                      ...prev,
                      instructor: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-input">Fecha *</Label>
                  <Input
                    id="date-input"
                    name="date"
                    type="date"
                    required
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
                  <Label htmlFor="time-select">Hora *</Label>
                  <Select
                    value={extraClassForm.time}
                    onValueChange={(value) =>
                      setExtraClassForm((prev) => ({ ...prev, time: value }))
                    }
                    required
                  >
                    <SelectTrigger
                      id="time-select"
                      aria-describedby="time-help"
                    >
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
                  <p
                    id="time-help"
                    className="text-xs text-muted-foreground mt-1"
                  >
                    Selecciona la hora para la clase extra
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="capacity-input">Capacidad (opcional)</Label>
                <Input
                  id="capacity-input"
                  name="capacity"
                  type="number"
                  placeholder="Máximo de alumnos"
                  min="1"
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
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingClass(false);
                    // Resetear el formulario
                    setExtraClassForm({
                      disciplineId: "",
                      instructor: "",
                      date: "",
                      time: "",
                      capacity: 15,
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Agregar Clase</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {selectedDate && (
        <Dialog
          open={!!selectedDate}
          onOpenChange={() => setSelectedDate(null)}
        >
          <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>
                Clases del {formatDateForDisplay(selectedDate)}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
                <h4 className="font-medium">Clases programadas</h4>
                <div className="flex gap-2">
                  {classesForSelectedDate.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("🔘 Botón Cancelar Todas clickeado");
                        console.log("📊 Estado actual:", {
                          selectedDate,
                          classesCount: classesForSelectedDate.length,
                          showCancelAllDialog,
                        });
                        setShowCancelAllDialog(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                      aria-label={`Cancelar todas las clases del ${formatDateForDisplay(
                        selectedDate
                      )}`}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Cancelar Todas ({classesForSelectedDate.length})
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      setExtraClassForm({
                        disciplineId: "",
                        instructor: "",
                        date: selectedDate,
                        time: "",
                        capacity: 15,
                      });
                      setIsAddingClass(true);
                    }}
                    aria-label={`Agregar clase extra para el ${formatDateForDisplay(
                      selectedDate
                    )}`}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Clase Extra
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {classesForSelectedDate.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cls.color }}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {cls.time} - {cls.discipline}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {cls.instructor && `Instructor: ${cls.instructor} | `}
                          {cls.enrolled}/{cls.capacity || "∞"} inscritos
                          {/* Indicador de clase generada vs real */}
                          {cls.isGenerated && !cls.isExtra && (
                            <span
                              className="ml-2 text-blue-600"
                              title="Clase generada dinámicamente"
                            >
                              🔄 Generada
                            </span>
                          )}
                          {cls.isExtra && (
                            <span
                              className="ml-2 text-orange-600"
                              title="Clase extra"
                            >
                              ⭐ Extra
                            </span>
                          )}
                          {!cls.isGenerated &&
                            cls.registeredParticipantsIds.length > 0 && (
                              <span
                                className="ml-2 text-green-600"
                                title="Clase con actividad real"
                              >
                                ✅ Con actividad
                              </span>
                            )}
                        </div>

                        {cls.notes && (
                          <div className="mt-1 text-xs text-blue-600 bg-blue-50 p-1 rounded">
                            💡 {cls.notes}
                          </div>
                        )}
                      </div>
                      {cls.type === "extra" && (
                        <Badge variant="secondary">Extra</Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelClass(cls.id)}
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                        aria-label={`Cancelar clase ${cls.discipline} del ${cls.time}`}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleViewClassDetails(cls)}
                        aria-label={`Ver detalles de la clase ${cls.discipline} del ${cls.time}`}
                      >
                        Ver detalles
                      </Button>
                    </div>
                  </div>
                ))}

                {classesForSelectedDate.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No hay clases disponibles para este día
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AdminClassDetailDrawer
        isOpen={showClassDetails}
        onClose={() => setShowClassDetails(false)}
        classItem={selectedClass}
        onCancelClass={async (classId: string) => {
          await handleCancelClass(classId);
          // Cerrar el drawer después de cancelar
          setShowClassDetails(false);
        }}
      />

      <AlertDialog
        open={showCancelAllDialog}
        onOpenChange={setShowCancelAllDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar todas las clases?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará todas las clases programadas para el{" "}
              {selectedDate && formatDateForDisplay(selectedDate)}. Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel aria-label="Mantener las clases">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAllClasses}
              className="bg-red-600 hover:bg-red-700"
              aria-label={`Confirmar cancelación de todas las clases del ${
                selectedDate && formatDateForDisplay(selectedDate)
              }`}
            >
              Sí, cancelar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
