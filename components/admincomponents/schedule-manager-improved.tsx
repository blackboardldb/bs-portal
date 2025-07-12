"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import type { DayOfWeek, Discipline, CancellationRule } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  X,
  Clock,
  Calendar,
  Save,
  Edit,
  Trash2,
  AlertTriangle,
  Settings,
} from "lucide-react";

const dayLabels: Record<DayOfWeek, string> = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

const emptyDiscipline: Discipline = {
  id: "",
  name: "",
  description: "",
  color: "#3b82f6",
  isActive: true,
  schedule: [],
  cancellationRules: [],
};

export default function ScheduleManagerImproved() {
  const {
    disciplines,
    addDiscipline,
    updateDiscipline,
    deleteDiscipline,
    fetchDisciplines,
  } = useBlackSheepStore();

  const [isLoading, setIsLoading] = useState(true);

  // Estados para gestión de disciplinas
  const [showDisciplineModal, setShowDisciplineModal] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<string | null>(
    null
  );
  const [disciplineForm, setDisciplineForm] =
    useState<Discipline>(emptyDiscipline);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [expandedDisciplines, setExpandedDisciplines] = useState<Set<string>>(
    new Set()
  );
  const [selectedDayForSchedule, setSelectedDayForSchedule] = useState<
    DayOfWeek | ""
  >("");
  const [selectedCancellationTime, setSelectedCancellationTime] =
    useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState<string | null>(
    null
  );

  // Cargar disciplinas al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchDisciplines();
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchDisciplines]);

  // --- Gestión de disciplinas ---
  const handleNewDiscipline = () => {
    setDisciplineForm(emptyDiscipline);
    setEditingDiscipline(null);
    setSelectedDays([]);
    setSelectedDayForSchedule("");
    setSelectedCancellationTime("");
    setShowDisciplineModal(true);
  };

  const handleEditDiscipline = (discipline: Discipline) => {
    setDisciplineForm(discipline);
    setEditingDiscipline(discipline.id);
    setSelectedDays(discipline.schedule.map((s) => s.day));
    setSelectedDayForSchedule("");
    setSelectedCancellationTime("");
    setShowDisciplineModal(true);
  };

  const handleDeleteDiscipline = (id: string) => {
    setDisciplineToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteDiscipline = () => {
    if (disciplineToDelete) {
      deleteDiscipline(disciplineToDelete);

      // Refrescar la lista después de eliminar
      fetchDisciplines();

      setShowDeleteModal(false);
      setDisciplineToDelete(null);
    }
  };

  const toggleDisciplineExpansion = (id: string) => {
    setExpandedDisciplines((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDisciplineChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      val = e.target.checked;
    }
    setDisciplineForm((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  const handleAddTimeToDiscipline = (day: DayOfWeek, time: string) => {
    if (!time.match(/^\d{2}:\d{2}$/)) return;
    setDisciplineForm((prev) => {
      const schedule = [...prev.schedule];
      const idx = schedule.findIndex((d) => d.day === day);
      if (idx >= 0) {
        schedule[idx] = {
          ...schedule[idx],
          times: [...schedule[idx].times, time].sort(),
        };
      } else {
        schedule.push({ day, times: [time] });
      }
      return { ...prev, schedule };
    });
  };

  const handleRemoveTimeFromDiscipline = (day: DayOfWeek, time: string) => {
    setDisciplineForm((prev) => {
      const schedule = prev.schedule
        .map((d) =>
          d.day === day ? { ...d, times: d.times.filter((t) => t !== time) } : d
        )
        .filter((d) => d.times.length > 0);
      return { ...prev, schedule };
    });
  };

  const handleAddCancellationRule = (rule: Omit<CancellationRule, "id">) => {
    setDisciplineForm((prev) => ({
      ...prev,
      cancellationRules: [
        ...prev.cancellationRules,
        { ...rule, id: `rule_${Date.now()}` },
      ],
    }));
  };

  const handleRemoveCancellationRule = (id: string) => {
    setDisciplineForm((prev) => ({
      ...prev,
      cancellationRules: prev.cancellationRules.filter((r) => r.id !== id),
    }));
  };

  const handleSaveDiscipline = () => {
    if (!disciplineForm.name) return;

    // Filtrar horarios solo para días seleccionados
    const filteredSchedule = disciplineForm.schedule.filter((s) =>
      selectedDays.includes(s.day)
    );

    const disciplineData = {
      ...disciplineForm,
      schedule: filteredSchedule,
    };

    if (editingDiscipline) {
      updateDiscipline({ ...disciplineData, id: editingDiscipline });
    } else {
      addDiscipline({ ...disciplineData, id: `disc_${Date.now()}` });
    }

    // Refrescar la lista después de agregar/editar
    fetchDisciplines();

    setShowDisciplineModal(false);
    setDisciplineForm(emptyDiscipline);
    setEditingDiscipline(null);
    setSelectedDays([]);
    setSelectedDayForSchedule("");
    setSelectedCancellationTime("");
  };

  // Calcular horarios disponibles para reglas de cancelación
  const availableTimes = disciplineForm.schedule
    .flatMap((daySchedule) => daySchedule.times)
    .filter((time, index, array) => array.indexOf(time) === index) // Remover duplicados
    .sort();

  return (
    <div className="space-y-6">
      {/* Header con gestión de disciplinas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Gestión de Disciplinas y Horarios
          </h2>
          <p className="text-muted-foreground">
            Administra las disciplinas y sus horarios para la generación de
            clases
          </p>
        </div>
        <Button onClick={handleNewDiscipline}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Disciplina
        </Button>
      </div>

      {/* Lista de disciplinas */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          // Skeleton simplificado para cards de disciplinas
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-4 h-4 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="w-8 h-8 rounded" />
                    <Skeleton className="w-8 h-8 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-2/3 mb-3" />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-4 h-4 rounded" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded" />
                  </div>
                  <div className="ml-6 space-y-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-12" />
                      <div className="flex gap-1">
                        <Skeleton className="h-5 w-12 rounded-full" />
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : disciplines.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hay disciplinas configuradas
                </p>
                <Button onClick={handleNewDiscipline}>
                  <Plus className="w-4 h-4 mr-2" /> Crear primera disciplina
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          disciplines.map((d) => (
            <Card key={d.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ background: d.color || "#ccc" }}
                    />
                    <CardTitle className="text-lg">{d.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEditDiscipline(d)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeleteDiscipline(d.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {!d.isActive && (
                  <Badge variant="secondary" className="w-fit">
                    Inactiva
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                {d.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {d.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Horarios:</span>
                      {d.schedule.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {d.schedule.length} día
                          {d.schedule.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleDisciplineExpansion(d.id)}
                      className="text-xs"
                    >
                      {expandedDisciplines.has(d.id)
                        ? "Ocultar"
                        : "Ver horarios"}
                    </Button>
                  </div>

                  {expandedDisciplines.has(d.id) && (
                    <>
                      {d.schedule.length === 0 ? (
                        <span className="text-xs text-muted-foreground ml-6">
                          Sin horarios configurados
                        </span>
                      ) : (
                        <div className="ml-6 space-y-1">
                          {d.schedule.map((s) => (
                            <div
                              key={s.day}
                              className="flex items-center gap-2"
                            >
                              <span className="text-xs font-medium w-12">
                                {dayLabels[s.day]}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {s.times.map((t) => (
                                  <Badge
                                    key={t}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {d.cancellationRules.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Reglas de cancelación:
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 ml-6">
                            {d.cancellationRules.map((r) => (
                              <Badge
                                key={r.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {r.time} - {r.hoursBefore}h
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal para crear/editar disciplina */}
      <Dialog open={showDisciplineModal} onOpenChange={setShowDisciplineModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDiscipline ? "Editar Disciplina" : "Nueva Disciplina"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  name="name"
                  value={disciplineForm.name}
                  onChange={handleDisciplineChange}
                  placeholder="Ej: CrossFit, Yoga, Spinning"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  name="color"
                  type="color"
                  value={disciplineForm.color}
                  onChange={handleDisciplineChange}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Input
                  name="description"
                  value={disciplineForm.description}
                  onChange={handleDisciplineChange}
                  placeholder="Descripción de la disciplina"
                />
              </div>
            </div>

            {/* Selección de días */}
            <div className="space-y-3">
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(dayLabels).map(([day, label]) => (
                  <Badge
                    key={day}
                    variant={
                      selectedDays.includes(day as DayOfWeek)
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer ${
                      selectedDays.includes(day as DayOfWeek)
                        ? "bg-blue-500 text-white"
                        : "hover:bg-blue-50"
                    }`}
                    onClick={() => toggleDay(day as DayOfWeek)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Horarios por día seleccionado */}
            {selectedDays.length > 0 && (
              <div className="space-y-3">
                <Label>Horarios por día</Label>

                {/* Inputs para agregar horarios */}
                <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-600" />
                    <span className="font-medium text-zinc-700">
                      Agregar nuevo horario
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Select
                      value={selectedDayForSchedule}
                      onValueChange={(value) =>
                        setSelectedDayForSchedule(value as DayOfWeek)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Seleccionar día" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDays.map((day) => (
                          <SelectItem key={day} value={day}>
                            {dayLabels[day]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-1">
                      <Input
                        className="w-16"
                        placeholder="HH"
                        maxLength={2}
                        type="number"
                        min="0"
                        max="23"
                        id="new-hour"
                      />
                      <span className="flex items-center text-lg font-medium text-zinc-600">
                        :
                      </span>
                      <Input
                        className="w-16"
                        placeholder="MM"
                        maxLength={2}
                        type="number"
                        min="0"
                        max="59"
                        id="new-minute"
                      />
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!selectedDayForSchedule}
                      onClick={() => {
                        const hourInput = document.getElementById(
                          "new-hour"
                        ) as HTMLInputElement;
                        const minuteInput = document.getElementById(
                          "new-minute"
                        ) as HTMLInputElement;
                        const hour = hourInput.value.padStart(2, "0");
                        const minute = minuteInput.value.padStart(2, "0");

                        if (
                          selectedDayForSchedule &&
                          hour &&
                          minute &&
                          parseInt(hour) >= 0 &&
                          parseInt(hour) <= 23 &&
                          parseInt(minute) >= 0 &&
                          parseInt(minute) <= 59
                        ) {
                          const time = `${hour}:${minute}`;
                          handleAddTimeToDiscipline(
                            selectedDayForSchedule,
                            time
                          );
                          hourInput.value = "";
                          minuteInput.value = "";
                        }
                      }}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Horarios existentes */}
                <div className="space-y-3">
                  {selectedDays.map((day) => {
                    const daySchedule = disciplineForm.schedule.find(
                      (d) => d.day === day
                    ) || { times: [] };
                    if (daySchedule.times.length === 0) return null;

                    return (
                      <div key={day} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span className="font-medium">{dayLabels[day]}</span>
                          <Badge variant="outline" className="ml-2">
                            {daySchedule.times.length} horario
                            {daySchedule.times.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {daySchedule.times.map((time) => (
                            <Badge
                              key={time}
                              className="bg-blue-100 text-blue-800"
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              {time}
                              <button
                                className="ml-1 text-xs text-red-500 hover:text-red-700"
                                onClick={() =>
                                  handleRemoveTimeFromDiscipline(day, time)
                                }
                                title="Eliminar hora"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reglas de cancelación */}
            <div className="space-y-3">
              <Label>Reglas de Cancelación</Label>

              {availableTimes.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Primero agrega horarios a la disciplina para poder crear
                      reglas de cancelación
                    </span>
                  </div>
                </div>
              )}

              {/* Inputs para agregar reglas */}
              {availableTimes.length > 0 && (
                <div className="bg-zinc-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-zinc-600" />
                    <span className="font-medium text-zinc-700">
                      Agregar nueva regla
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 flex gap-2">
                      <div>
                        <Label className="text-sm font-medium text-zinc-600">
                          Hora de la clase
                        </Label>
                        <Select
                          value={selectedCancellationTime}
                          onValueChange={(value) =>
                            setSelectedCancellationTime(value)
                          }
                        >
                          <SelectTrigger className="w-32 mt-1">
                            <SelectValue placeholder="Seleccionar hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimes.length > 0 ? (
                              availableTimes.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="" disabled>
                                No hay horarios disponibles
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium text-zinc-600">
                          Mínimo de horas para cancelar
                        </Label>
                        <div className="flex gap-1 mt-1">
                          <Input
                            className="w-16"
                            placeholder="HH"
                            maxLength={2}
                            type="number"
                            min="0"
                            max="23"
                            id="rule-cancel-hour"
                          />
                          <span className="flex items-center text-lg font-medium text-zinc-600">
                            :
                          </span>
                          <Input
                            className="w-16"
                            placeholder="MM"
                            maxLength={2}
                            type="number"
                            min="0"
                            max="59"
                            id="rule-cancel-minute"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      disabled={!selectedCancellationTime}
                      onClick={() => {
                        const cancelHourInput = document.getElementById(
                          "rule-cancel-hour"
                        ) as HTMLInputElement;
                        const cancelMinuteInput = document.getElementById(
                          "rule-cancel-minute"
                        ) as HTMLInputElement;

                        const cancelHour = cancelHourInput.value.padStart(
                          2,
                          "0"
                        );
                        const cancelMinute = cancelMinuteInput.value.padStart(
                          2,
                          "0"
                        );

                        // Validación adicional: verificar que la hora seleccionada existe en los horarios
                        if (
                          !availableTimes.includes(selectedCancellationTime)
                        ) {
                          alert(
                            "Error: La hora seleccionada no existe en los horarios de la disciplina."
                          );
                          return;
                        }

                        if (
                          selectedCancellationTime &&
                          cancelHour &&
                          cancelMinute &&
                          parseInt(cancelHour) >= 0 &&
                          parseInt(cancelHour) <= 23 &&
                          parseInt(cancelMinute) >= 0 &&
                          parseInt(cancelMinute) <= 59
                        ) {
                          const cancelHours =
                            parseInt(cancelHour) + parseInt(cancelMinute) / 60;

                          handleAddCancellationRule({
                            time: selectedCancellationTime,
                            hoursBefore: cancelHours,
                            priority: 1,
                          });

                          setSelectedCancellationTime("");
                          cancelHourInput.value = "";
                          cancelMinuteInput.value = "";
                        }
                      }}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar Regla
                    </Button>
                  </div>
                </div>
              )}

              {/* Reglas existentes */}
              <div className="space-y-2">
                {disciplineForm.cancellationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 p-3 border rounded-lg"
                  >
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Clase {rule.time} - Mínimo {rule.hoursBefore}h antes
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveCancellationRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveDiscipline}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" /> Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDisciplineModal(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar disciplina */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Confirmar eliminación
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              ¿Estás seguro de que quieres eliminar esta disciplina? Esta acción
              también eliminará todos sus horarios y reglas de cancelación
              asociadas.
            </p>
            <p className="text-sm text-red-600 font-medium">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={confirmDeleteDiscipline}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setDisciplineToDelete(null);
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
