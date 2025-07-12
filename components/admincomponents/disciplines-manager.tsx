"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import type { Discipline, DayOfWeek, CancellationRule } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Clock,
  AlertTriangle,
  Calendar,
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

export default function DisciplinesManager() {
  const { disciplines, addDiscipline, updateDiscipline, deleteDiscipline } =
    useBlackSheepStore();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Discipline>(emptyDiscipline);
  const [showModal, setShowModal] = useState(false);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);

  // --- Handlers generales ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      val = e.target.checked;
    }
    setForm((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  // --- Gestión de días seleccionados ---
  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) => {
      if (prev.includes(day)) {
        return prev.filter((d) => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // --- Horarios ---
  const handleAddTime = (day: DayOfWeek, time: string) => {
    if (!time.match(/^\d{2}:\d{2}$/)) return;
    setForm((prev) => {
      const schedule = [...prev.schedule];
      const idx = schedule.findIndex((d) => d.day === day);
      if (idx >= 0) {
        schedule[idx] = {
          ...schedule[idx],
          times: [...schedule[idx].times, time],
        };
      } else {
        schedule.push({ day, times: [time] });
      }
      return { ...prev, schedule };
    });
  };

  const handleRemoveTime = (day: DayOfWeek, time: string) => {
    setForm((prev) => {
      const schedule = prev.schedule
        .map((d) =>
          d.day === day ? { ...d, times: d.times.filter((t) => t !== time) } : d
        )
        .filter((d) => d.times.length > 0);
      return { ...prev, schedule };
    });
  };

  // --- Reglas de cancelación ---
  const handleAddRule = (rule: Omit<CancellationRule, "id">) => {
    setForm((prev) => ({
      ...prev,
      cancellationRules: [
        ...prev.cancellationRules,
        { ...rule, id: `rule_${Date.now()}` },
      ],
    }));
  };

  const handleRemoveRule = (id: string) => {
    setForm((prev) => ({
      ...prev,
      cancellationRules: prev.cancellationRules.filter((r) => r.id !== id),
    }));
  };

  // --- Guardar/Editar/Eliminar ---
  const handleSave = () => {
    if (!form.name) return;

    // Filtrar horarios solo para días seleccionados
    const filteredSchedule = form.schedule.filter((s) =>
      selectedDays.includes(s.day)
    );

    const disciplineData = {
      ...form,
      schedule: filteredSchedule,
    };

    if (editing) {
      updateDiscipline({ ...disciplineData, id: editing });
    } else {
      addDiscipline({ ...disciplineData, id: `disc_${Date.now()}` });
    }

    handleCloseModal();
  };

  const handleEdit = (d: Discipline) => {
    setForm(d);
    setEditing(d.id);
    setSelectedDays(d.schedule.map((s) => s.day));
    setShowModal(true);
  };

  const handleNew = () => {
    setForm(emptyDiscipline);
    setEditing(null);
    setSelectedDays([]);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Eliminar disciplina?")) deleteDiscipline(id);
  };

  const handleCloseModal = () => {
    setForm(emptyDiscipline);
    setEditing(null);
    setSelectedDays([]);
    setShowModal(false);
  };

  // --- Render ---
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Disciplinas</h2>
        <Button onClick={handleNew}>
          <Plus className="w-4 h-4 mr-2" /> Nueva Disciplina
        </Button>
      </div>

      {/* Modal de edición */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Disciplina" : "Nueva Disciplina"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Ej: CrossFit, Yoga, Spinning"
                />
              </div>
              <div>
                <Label>Color</Label>
                <Input
                  name="color"
                  type="color"
                  value={form.color}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
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
                <div className="space-y-3">
                  {selectedDays.map((day) => (
                    <div key={day} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{dayLabels[day]}</span>
                      </div>

                      {/* Horarios existentes */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(
                          form.schedule.find((d) => d.day === day) || {
                            times: [],
                          }
                        ).times.map((time) => (
                          <Badge
                            key={time}
                            className="bg-blue-100 text-blue-800"
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {time}
                            <button
                              className="ml-1 text-xs text-red-500 hover:text-red-700"
                              onClick={() => handleRemoveTime(day, time)}
                              title="Eliminar hora"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      {/* Agregar nuevo horario */}
                      <div className="flex gap-2">
                        <Input
                          className="w-24"
                          placeholder="hh:mm"
                          maxLength={5}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleAddTime(
                                day,
                                (e.target as HTMLInputElement).value
                              );
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            const input = e.currentTarget
                              .previousElementSibling as HTMLInputElement;
                            if (input.value) {
                              handleAddTime(day, input.value);
                              input.value = "";
                            }
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reglas de cancelación */}
            <div className="space-y-3">
              <Label>Reglas de Cancelación</Label>
              <div className="space-y-2">
                {form.cancellationRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2 p-2 bg-yellow-50 rounded"
                  >
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {rule.time} - {rule.hoursBefore}h antes
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {rule.description}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveRule(rule.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input className="w-20" placeholder="hh:mm" id="rule-time" />
                <Input
                  className="w-20"
                  placeholder="Horas"
                  type="number"
                  id="rule-hours"
                />
                <Input
                  className="flex-1"
                  placeholder="Descripción"
                  id="rule-desc"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    const time = (
                      document.getElementById("rule-time") as HTMLInputElement
                    )?.value;
                    const hours = Number(
                      (
                        document.getElementById(
                          "rule-hours"
                        ) as HTMLInputElement
                      )?.value
                    );
                    const desc = (
                      document.getElementById("rule-desc") as HTMLInputElement
                    )?.value;
                    if (time && hours >= 0) {
                      handleAddRule({
                        time,
                        hoursBefore: hours,
                        priority: 1,
                        description: desc,
                      });
                      (
                        document.getElementById("rule-time") as HTMLInputElement
                      ).value = "";
                      (
                        document.getElementById(
                          "rule-hours"
                        ) as HTMLInputElement
                      ).value = "";
                      (
                        document.getElementById("rule-desc") as HTMLInputElement
                      ).value = "";
                    }
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="w-4 h-4 mr-2" /> Guardar
              </Button>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Listado de disciplinas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {disciplines.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No hay disciplinas registradas.
                </p>
                <Button onClick={handleNew} className="mt-4">
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
                      onClick={() => handleEdit(d)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(d.id)}
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
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Horarios:</span>
                  </div>

                  {d.schedule.length === 0 ? (
                    <span className="text-xs text-muted-foreground ml-6">
                      Sin horarios configurados
                    </span>
                  ) : (
                    <div className="ml-6 space-y-1">
                      {d.schedule.map((s) => (
                        <div key={s.day} className="flex items-center gap-2">
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
                </div>

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
                        <Badge key={r.id} variant="outline" className="text-xs">
                          {r.time} - {r.hoursBefore}h
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
