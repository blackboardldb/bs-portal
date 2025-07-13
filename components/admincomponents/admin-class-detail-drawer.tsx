"use client";

import { useState, useEffect } from "react";
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
import type { FitCenterUserProfile } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Plus, Search, Save, Loader2 } from "lucide-react";

interface AdminClassDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: {
    id: string;
    dateTime: string;
    name: string;
    instructor: string;
    duration: string;
    alumnRegistred: string;
    isRegistered: boolean;
    status?: string;
    disciplineId?: string;
    capacity?: number;
    notes?: string;
    registeredParticipantsIds?: string[];
    waitlistParticipantsIds?: string[];
  } | null;
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
  const formattedDate = format(classDateTime, "EEEE dd 'de' MMMM", {
    locale: es,
  });
  const formattedTime = format(classDateTime, "p", { locale: es });

  // CONTEXTO: Buscar la disciplina y su regla de cancelación aplicable
  const discipline = disciplines.find(
    (d) => d.id === currentClassItem.disciplineId
  );
  const applicableCancellationRule = discipline?.cancellationRules?.find(
    (rule) => {
      const ruleTime = rule.time;
      const classTime = format(classDateTime, "HH:mm");
      return ruleTime === classTime;
    }
  );

  const enrolledStudents = users.filter((user: FitCenterUserProfile) =>
    currentClassItem.registeredParticipantsIds?.includes(user.id)
  );

  const waitlistStudents = users.filter((user: FitCenterUserProfile) =>
    currentClassItem.waitlistParticipantsIds?.includes(user.id)
  );

  // Filtrar usuarios para agregar (excluir los ya inscritos)
  const availableUsers = users.filter((user: FitCenterUserProfile) => {
    const isEnrolled = currentClassItem.registeredParticipantsIds?.includes(
      user.id
    );
    const isInWaitlist = currentClassItem.waitlistParticipantsIds?.includes(
      user.id
    );
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return !isEnrolled && !isInWaitlist && matchesSearch;
  });

  console.log("🔍 Usuarios disponibles para agregar:", availableUsers.length);
  console.log(
    "📋 Lista de usuarios disponibles:",
    availableUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
    }))
  );

  const handleCancelClass = async () => {
    if (!onCancelClass) return;

    setIsLoading(true);
    try {
      await onCancelClass(currentClassItem.id);
      onClose();
    } catch (error) {
      console.error("Error canceling class:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      console.log("=== INICIO: Agregar Estudiante ===");
      console.log("Estudiante ID:", userId);
      console.log("Clase ID:", currentClassItem.id);
      console.log("Clase completa:", currentClassItem);

      // Si es una clase generada dinámicamente, primero crearla en la base de datos
      let classId = currentClassItem.id;
      if (currentClassItem.id.startsWith("gen_")) {
        console.log("🔄 Clase generada detectada, creando clase real...");

        const createPayload = {
          startDate: currentClassItem.dateTime.split("T")[0],
          endDate: currentClassItem.dateTime.split("T")[0],
          disciplineId: currentClassItem.disciplineId,
          instructorId: "inst_default",
          time: currentClassItem.dateTime.split("T")[1].substring(0, 5),
          maxCapacity: currentClassItem.capacity || 15,
        };

        console.log("📤 Payload para crear clase:", createPayload);
        console.log("📤 DisciplineId:", currentClassItem.disciplineId);
        console.log("📤 DateTime original:", currentClassItem.dateTime);

        const createResponse = await fetch("/api/classes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(createPayload),
        });

        console.log(
          "📥 Respuesta crear clase:",
          createResponse.status,
          createResponse.statusText
        );

        if (createResponse.ok) {
          const createResult = await createResponse.json();
          console.log("✅ Clase creada exitosamente:", createResult);
          classId = createResult.classes[0].id;
          console.log("🆔 Nuevo ID de clase:", classId);
        } else {
          const errorData = await createResponse.json();
          console.error("❌ Error al crear clase:", errorData);
          alert(
            `Error al crear clase: ${errorData.error || "Error desconocido"}`
          );
          return;
        }
      } else {
        console.log("✅ Clase ya es real, usando ID existente");
      }

      // Llamada a la API para agregar estudiante
      console.log("📤 Agregando estudiante a clase:", classId);
      console.log(
        "📤 URL de la API:",
        `/api/classes/${classId}/admin/register`
      );

      const response = await fetch(`/api/classes/${classId}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      console.log(
        "📥 Respuesta agregar estudiante:",
        response.status,
        response.statusText
      );
      console.log("📥 URL completa:", response.url);

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Estudiante agregado exitosamente:", result);

        // Actualizar el estado local para reflejar el cambio inmediatamente
        const updatedClassItem = {
          ...currentClassItem,
          id: classId,
          registeredParticipantsIds: [
            ...(currentClassItem.registeredParticipantsIds || []),
            userId,
          ],
        };

        console.log("🔄 Clase actualizada localmente:", updatedClassItem);

        // Actualizar el estado local
        setCurrentClassItem(updatedClassItem);

        // Limpiar el término de búsqueda para mostrar el cambio
        setSearchTerm("");

        // Mostrar toast de éxito
        const addedUser = users.find((u) => u.id === userId);
        toast({
          title: "Alumno agregado",
          description: `${addedUser?.firstName} ${addedUser?.lastName} ha sido agregado a la clase`,
        });

        console.log("=== FIN: Estudiante agregado exitosamente ===");
      } else {
        const errorData = await response.json();
        console.error("❌ Error al agregar estudiante:", errorData);
        console.error("❌ Status:", response.status);
        console.error("❌ StatusText:", response.statusText);
        console.error(
          "❌ Headers:",
          Object.fromEntries(response.headers.entries())
        );

        toast({
          title: "Error al agregar alumno",
          description:
            errorData.error ||
            errorData.message ||
            JSON.stringify(errorData) ||
            "Error desconocido",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("💥 Error inesperado:", error);
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
                          <div>
                            <p className="font-medium">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.email}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {student.membership?.status || "Sin estado"}
                          </Badge>
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

              {/* Política de cancelación */}
              {(applicableCancellationRule || discipline) && (
                <div className="border border-zinc-300 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Política de Cancelación</h3>
                    {currentClassItem.status !== "cancelled" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancelClass}
                        disabled={isLoading}
                      >
                        {isLoading ? "Cancelando..." : "Cancelar Clase"}
                      </Button>
                    )}
                  </div>
                  {applicableCancellationRule ? (
                    <p className="text-sm text-muted-foreground">
                      Se puede cancelar hasta{" "}
                      {applicableCancellationRule.hoursBefore} horas antes de la
                      clase
                      {applicableCancellationRule.description && (
                        <span className="block mt-1 text-xs text-blue-600">
                          💡 {applicableCancellationRule.description}
                        </span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Política general de la disciplina aplica
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
