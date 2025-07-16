"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import type { FitCenterUserProfile, ClassListItem } from "@/lib/types";
import { parseISO, format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Plus, Search, Save, Loader2 } from "lucide-react";
import {
  formatTimeLocal,
  formatWeekday,
  formatDayMonth,
  isClassPast,
} from "@/lib/utils";

interface AdminClassDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: ClassListItem | null;
  onCancelClass: (classId: string) => void;
}

export default function AdminClassDetailDrawer({
  isOpen,
  onClose,
  classItem,
  onCancelClass,
}: AdminClassDetailDrawerProps) {
  const { users, disciplines } = useBlackSheepStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [activeTab, setActiveTab] = useState("inscritos");
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Estado local para la clase actualizada
  const [currentClassItem, setCurrentClassItem] = useState(classItem);

  // Optimizar búsqueda con useMemo para evitar re-cálculos innecesarios
  const availableUsers = useMemo(() => {
    if (!users || !currentClassItem) return [];

    return users.filter((user: FitCenterUserProfile) => {
      const isEnrolled = currentClassItem.registeredParticipantsIds?.includes(
        user.id
      );
      const isInWaitlist = currentClassItem.waitlistParticipantsIds?.includes(
        user.id
      );

      // Solo filtrar por búsqueda si hay término de búsqueda
      if (searchTerm.trim()) {
        const matchesSearch =
          user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return !isEnrolled && !isInWaitlist && matchesSearch;
      }

      return !isEnrolled && !isInWaitlist;
    });
  }, [users, currentClassItem, searchTerm]);

  // Inicializar notas cuando se abre el drawer
  useEffect(() => {
    if (classItem && classItem.notes) {
      setNotes(classItem.notes);
    } else {
      setNotes("");
    }
    setNotesSaved(false);
    setIsAddingStudent(false); // Reset del estado de agregar estudiante
    setCurrentClassItem(classItem); // Sincronizar con la prop
  }, [classItem]);

  if (!currentClassItem) return null;

  const classDateTime = parseISO(currentClassItem.dateTime);
  const formattedDate =
    formatWeekday(currentClassItem.dateTime) +
    " " +
    formatDayMonth(currentClassItem.dateTime);
  const formattedTime = formatTimeLocal(currentClassItem.dateTime);

  // CONTEXTO: Buscar la disciplina y su regla de cancelación aplicable
  const discipline = disciplines?.find(
    (d) => d.id === currentClassItem.disciplineId
  );
  const applicableCancellationRule = discipline?.cancellationRules?.find(
    (rule) => {
      const ruleTime = rule.time;
      const classTime = format(classDateTime, "HH:mm");
      return ruleTime === classTime;
    }
  );

  const enrolledStudents =
    users?.filter((user: FitCenterUserProfile) =>
      currentClassItem.registeredParticipantsIds?.includes(user.id)
    ) || [];

  const waitlistStudents =
    users?.filter((user: FitCenterUserProfile) =>
      currentClassItem.waitlistParticipantsIds?.includes(user.id)
    ) || [];

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      // Llamada a la API para guardar notas
      const response = await fetch(
        `/api/classes/${currentClassItem.id}/notes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }
      );

      if (response.ok) {
        // Actualizar el store localmente
        const updatedClassItem = {
          ...currentClassItem,
          notes: notes,
        };

        // Aquí normalmente actualizarías el store global
        console.log("Notas guardadas para la clase:", currentClassItem.id);

        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } else {
        console.error("Error al guardar notas");
      }
    } catch (error) {
      console.error("Error al guardar notas:", error);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddStudent = async (userId: string) => {
    if (isAddingStudent) return; // Evitar doble click

    setIsAddingStudent(true);
    try {
      // Si es una clase generada dinámicamente, primero crearla en la base de datos
      let classId = currentClassItem.id;
      if (currentClassItem.id.startsWith("gen_")) {
        const createPayload = {
          startDate: currentClassItem.dateTime.split("T")[0],
          endDate: currentClassItem.dateTime.split("T")[0],
          disciplineId: currentClassItem.disciplineId,
          instructorId: "inst_default",
          time: currentClassItem.dateTime.split("T")[1].substring(0, 5),
          maxCapacity: currentClassItem.capacity || 15,
        };

        const createResponse = await fetch("/api/classes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });

        if (createResponse.ok) {
          const createResult = await createResponse.json();
          classId = createResult.classes[0].id;
        } else {
          const errorData = await createResponse.json();
          toast({
            title: "Error al crear clase",
            description: errorData.error || "Error desconocido",
            variant: "destructive",
          });
          return;
        }
      }

      // Llamada a la API para agregar estudiante
      const response = await fetch(`/api/classes/${classId}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Actualizar el estado local para reflejar el cambio inmediatamente
        const updatedClassItem = {
          ...currentClassItem,
          id: classId,
          registeredParticipantsIds: [
            ...(currentClassItem.registeredParticipantsIds || []),
            userId,
          ],
          enrolled: (currentClassItem.enrolled || 0) + 1,
          alumnRegistred: `${(currentClassItem.enrolled || 0) + 1}/${
            currentClassItem.capacity || 15
          }`,
        };

        // Actualizar el estado local
        setCurrentClassItem(updatedClassItem);

        // Limpiar el término de búsqueda para mostrar el cambio
        setSearchTerm("");

        // Mostrar toast de éxito
        const addedUser = users?.find((u) => u.id === userId);
        toast({
          title: "Alumno agregado",
          description: `${addedUser?.firstName} ${addedUser?.lastName} ha sido agregado a la clase`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error al agregar alumno",
          description:
            errorData.error || errorData.message || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (userId: string) => {
    if (isAddingStudent) return; // Reutilizar el estado para evitar operaciones simultáneas

    setIsAddingStudent(true);
    try {
      // Llamada a la API para remover estudiante
      const response = await fetch(
        `/api/classes/${currentClassItem.id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        // Actualizar el estado local para reflejar el cambio inmediatamente
        const updatedRegisteredIds = (
          currentClassItem.registeredParticipantsIds || []
        ).filter((id) => id !== userId);

        const updatedClassItem = {
          ...currentClassItem,
          registeredParticipantsIds: updatedRegisteredIds,
          enrolled: Math.max(0, (currentClassItem.enrolled || 0) - 1),
          alumnRegistred: `${Math.max(
            0,
            (currentClassItem.enrolled || 0) - 1
          )}/${currentClassItem.capacity || 15}`,
        };

        // Actualizar el estado local
        setCurrentClassItem(updatedClassItem);

        // Mostrar toast de éxito
        const removedUser = users?.find((u) => u.id === userId);
        toast({
          title: "Alumno removido",
          description: `${removedUser?.firstName} ${removedUser?.lastName} ha sido removido de la clase`,
        });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error al remover alumno",
          description:
            errorData.error || errorData.message || "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error inesperado",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsAddingStudent(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[90vh]">
        <div className="mx-auto w-full max-w-2xl h-full flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle className="text-3xl">
              {currentClassItem.name} {formattedTime}
            </DrawerTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>{currentClassItem.instructor}</span>
              <span>•</span>
              <Users className="w-4 h-4" />
              <span>
                {enrolledStudents.length}/{currentClassItem.capacity || "∞"}{" "}
                inscritos
              </span>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="inscritos">
                    Inscritos ({enrolledStudents.length})
                  </TabsTrigger>
                  <TabsTrigger value="agregar">Agregar Alumnos</TabsTrigger>
                  <TabsTrigger value="notes">Notas</TabsTrigger>
                </TabsList>

                {/* Tab: Inscritos */}
                <TabsContent value="inscritos" className="space-y-4">
                  {enrolledStudents.length > 0 ? (
                    <div className="space-y-2">
                      {enrolledStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.email}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {student.membership?.status || "Sin estado"}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveStudent(student.id)}
                              disabled={isAddingStudent}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isAddingStudent ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "×"
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No hay alumnos inscritos
                    </p>
                  )}
                </TabsContent>

                {/* Tab: Agregar Alumnos */}
                <TabsContent value="agregar" className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar alumnos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableUsers.slice(0, 15).map((user) => {
                      const membershipStatus =
                        user.membership?.status || "Sin estado";
                      const isPending = membershipStatus === "pending";
                      const isExpired = membershipStatus === "expired";

                      return (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              {isPending && (
                                <Badge variant="secondary" className="text-xs">
                                  Pendiente
                                </Badge>
                              )}
                              {isExpired && (
                                <Badge
                                  variant="outline"
                                  className="text-xs text-orange-600"
                                >
                                  Expirado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                            {isPending && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Usuario pendiente de aprobación
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddStudent(user.id)}
                            className="h-8 w-8 p-0"
                            disabled={isPending || isAddingStudent}
                          >
                            {isAddingStudent ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      );
                    })}

                    {availableUsers.length === 0 && searchTerm && (
                      <p className="text-muted-foreground text-center py-4">
                        No se encontraron alumnos
                      </p>
                    )}

                    {availableUsers.length === 0 && !searchTerm && (
                      <p className="text-muted-foreground text-center py-4">
                        Todos los alumnos están inscritos
                      </p>
                    )}
                  </div>
                </TabsContent>

                {/* Tab: Notas */}
                <TabsContent value="notes" className="space-y-4">
                  <Textarea
                    placeholder="Agregar notas para esta clase..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[200px]"
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {isSavingNotes && (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Guardando...
                          </span>
                        </>
                      )}
                      {notesSaved && (
                        <span className="text-sm text-green-600">
                          ✓ Guardado
                        </span>
                      )}
                    </div>

                    <Button
                      onClick={handleSaveNotes}
                      disabled={isSavingNotes}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Guardar Notas
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Información de la disciplina */}
              {discipline && (
                <div className="border border-zinc-300 rounded-lg p-4">
                  <h3 className="font-medium mb-2">
                    Información de la Disciplina
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {discipline.description}
                  </p>
                  {applicableCancellationRule && (
                    <p className="text-xs text-blue-600 mt-2">
                      💡 Política de cancelación: Se puede cancelar hasta{" "}
                      {applicableCancellationRule.hoursBefore} horas antes
                    </p>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose} className="w-full">
                  Cerrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
