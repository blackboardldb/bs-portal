"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  getMonth,
  getYear,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
} from "date-fns";

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  // CONTEXTO: Este estado local contendrá las clases generadas para el mes visible.
  // Es más eficiente que usar el store global para esto.
  const [monthlyClasses, setMonthlyClasses] = useState<ClassSession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [showCancelAllDialog, setShowCancelAllDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [extraClassDate, setExtraClassDate] = useState<string>("");

  // CONTEXTO: `classSessions` del store ahora se usará para obtener datos históricos
  // o para sobreescribir las clases generadas si ya existen en la "base de datos".
  const {
    users,
    classSessions,
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
              const classDateTime = new Date(day);
              classDateTime.setHours(
                parseInt(hour, 10),
                parseInt(minute, 10),
                0,
                0
              );

              generatedClasses.push({
                id: `gen_${discipline.id}_${format(
                  classDateTime,
                  "yyyy-MM-dd_HH-mm"
                )}`,
                organizationId: "org_blacksheep_001",
                disciplineId: discipline.id,
                name: discipline.name,
                dateTime: classDateTime.toISOString(),
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
    fetchClassSessions();
    fetchUsers();
    // CONTEXTO: Asegurarse de que las disciplinas están cargadas.
    if (disciplines.length === 0) {
      fetchDisciplines();
    }
  }, [fetchClassSessions, fetchUsers, fetchDisciplines, disciplines.length]);

  // CONTEXTO: Este efecto se encarga de (re)generar las clases cada vez que
  // el usuario cambia de mes o cuando las disciplinas (nuestra fuente de verdad) se cargan.
  useEffect(() => {
    const now = new Date();
    // Si el mes que se ve es anterior al actual
    if (
      getYear(currentDate) < getYear(now) ||
      (getYear(currentDate) === getYear(now) &&
        getMonth(currentDate) < getMonth(now))
    ) {
      // Cargar datos históricos desde la API
      const start = format(startOfMonth(currentDate), "yyyy-MM-dd");
      const end = format(endOfMonth(currentDate), "yyyy-MM-dd");
      fetchClassSessions(start, end).then((data) =>
        setMonthlyClasses(data.classes)
      );
    } else {
      // Generar clases para el mes actual o futuro
      if (disciplines.length > 0) {
        generateClassesForMonth(currentDate, disciplines);
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

  // CONTEXTO: Este `useMemo` ahora transforma las clases generadas localmente (`monthlyClasses`)
  // en lugar de las clases globales del store. Esto hace que el calendario sea dinámico.
  const transformedClasses = useMemo(
    () =>
      monthlyClasses.map((cls: any) => {
        const discipline = disciplines.find((d) => d.id === cls.disciplineId);
        const instructor = users.find((u) => u.id === cls.instructorId);
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
          status: cls.status,
          discipline: discipline?.name || cls.name,
          disciplineId: cls.disciplineId,
          date: cls.dateTime.split("T")[0],
          time: cls.dateTime.split("T")[1].substring(0, 5),
          color: discipline?.color || "#666",
          capacity: cls.capacity,
          enrolled: cls.registeredParticipantsIds.length,
          type: cls.notes?.includes("Clase extra") ? "extra" : "regular",
          cancelled: cls.status === "cancelled",
          registeredParticipantsIds: cls.registeredParticipantsIds,
          historicalData: {
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
        dateString: prevDate.toISOString().split("T")[0],
      });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        dateString: date.toISOString().split("T")[0],
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const nextDate = new Date(year, month + 1, day);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        dateString: nextDate.toISOString().split("T")[0],
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

  const handleAddExtraClass = async (classData: any) => {
    const discipline = disciplines.find((d) => d.id === classData.disciplineId);
    if (!discipline) return;

    try {
      const response = await fetch("/api/classes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: classData.date,
          endDate: classData.date,
          disciplineId: classData.disciplineId,
          instructorId: "inst_default",
          time: classData.time,
          maxCapacity: classData.capacity || 15,
        }),
      });
      if (response.ok) {
        await fetchClassSessions();
        setIsAddingClass(false);
        setExtraClassDate("");
        toast({
          title: "Clase Extra Agregada",
          description: `Clase extra para ${discipline.name} el ${new Date(
            classData.date
          ).toLocaleDateString()} a las ${classData.time} agregada.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error al Agregar Clase Extra",
          description: error.message || "Error al agregar la clase extra.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error al Agregar Clase Extra",
        description: "Error inesperado al agregar la clase extra.",
        variant: "destructive",
      });
    }
  };

  const handleCancelClass = async (classId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/admin/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        await fetchClassSessions();
        toast({
          title: "Clase Cancelada",
          description: `Clase con ID ${classId} cancelada.`,
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
    if (selectedDate) {
      try {
        const response = await fetch("/api/classes/admin/cancel-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate }),
        });
        if (response.ok) {
          await fetchClassSessions();
          setShowCancelAllDialog(false);
          toast({
            title: "Todas las Clases Canceladas",
            description: `Todas las clases programadas para el ${new Date(
              selectedDate + "T00:00:00"
            ).toLocaleDateString()} han sido canceladas.`,
          });
        } else {
          const error = await response.json();
          toast({
            title: "Error al Cancelar Todas las Clases",
            description: error.message || "Error al cancelar todas las clases.",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error al Cancelar Todas las Clases",
          description: "Error inesperado al cancelar todas las clases.",
          variant: "destructive",
        });
      }
    }
  };

  const handleViewClassDetails = (cls: any) => {
    // CONTEXTO: Ahora recibimos una clase ya transformada, no necesitamos transformarla de nuevo
    setSelectedClass(cls);
    setShowClassDetails(true);
  };

  const classesForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    return transformedClasses.filter(
      (cls) => cls.date === selectedDate && !cls.cancelled
    );
  }, [selectedDate, transformedClasses]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendario de Clases</h2>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => {
              setExtraClassDate(new Date().toISOString().split("T")[0]);
              setIsAddingClass(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Clase Extra
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
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
              const isToday =
                day.dateString === new Date().toISOString().split("T")[0];

              return (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    !day.isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
                  } ${isToday ? "bg-blue-50 border-blue-200" : ""}`}
                  onClick={() => setSelectedDate(day.dateString)}
                >
                  <div className="font-medium text-sm mb-1">
                    {day.date.getDate()}
                  </div>

                  <div className="space-y-1">
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
                          {cls.type === "extra" && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              Extra
                            </Badge>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelClass(cls.id);
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                const formData = new FormData(e.currentTarget);
                const classData = {
                  disciplineId: formData.get("disciplineId") as string,
                  instructor: formData.get("instructor") as string,
                  date: formData.get("date") as string,
                  time: formData.get("time") as string,
                  capacity: formData.get("capacity")
                    ? parseInt(formData.get("capacity") as string)
                    : 15,
                };
                handleAddExtraClass(classData);
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="discipline">Disciplina *</Label>
                <Select name="disciplineId" required>
                  <SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor="instructor">Instructor (opcional)</Label>
                <Input name="instructor" placeholder="Nombre del instructor" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Fecha *</Label>
                  <Input
                    name="date"
                    type="date"
                    required
                    defaultValue={extraClassDate}
                  />
                </div>

                <div>
                  <Label htmlFor="time">Hora *</Label>
                  <Select name="time" required>
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
              </div>

              <div>
                <Label htmlFor="capacity">Capacidad (opcional)</Label>
                <Input
                  name="capacity"
                  type="number"
                  placeholder="Máximo de alumnos"
                  min="1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddingClass(false);
                    setExtraClassDate("");
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
          <DialogContent className="max-w-2xl max-h-[70vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Clases del{" "}
                {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 flex-1">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Clases programadas</h4>
                <div className="flex gap-2">
                  {classesForSelectedDate.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCancelAllDialog(true)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Cancelar Todas
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => {
                      setExtraClassDate(selectedDate);
                      setIsAddingClass(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Clase Extra
                  </Button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
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
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handleViewClassDetails(cls)}
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
        onCancelClass={handleCancelClass}
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
              {selectedDate &&
                new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "es-ES",
                  {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  }
                )}
              . Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAllClasses}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, cancelar todas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
