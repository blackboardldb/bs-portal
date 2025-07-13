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
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("inscritos");
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  // Inicializar notas cuando se abre el drawer
  useEffect(() => {
    if (classItem && classItem.notes) {
      setNotes(classItem.notes);
    } else {
      setNotes("");
    }
    setNotesSaved(false);
  }, [classItem]);

  if (!classItem) return null;

  const classDateTime = parseISO(classItem.dateTime);
  const formattedDate = format(classDateTime, "EEEE dd 'de' MMMM", {
    locale: es,
  });
  const formattedTime = format(classDateTime, "p", { locale: es });

  // CONTEXTO: Buscar la disciplina y su regla de cancelación aplicable
  const discipline = disciplines.find((d) => d.id === classItem.disciplineId);
  const applicableCancellationRule = discipline?.cancellationRules?.find(
    (rule) => {
      const ruleTime = rule.time;
      const classTime = format(classDateTime, "HH:mm");
      return ruleTime === classTime;
    }
  );

  const enrolledStudents = users.filter((user: FitCenterUserProfile) =>
    classItem.registeredParticipantsIds?.includes(user.id)
  );

  const waitlistStudents = users.filter((user: FitCenterUserProfile) =>
    classItem.waitlistParticipantsIds?.includes(user.id)
  );

  // Filtrar usuarios para agregar (excluir los ya inscritos)
  const availableUsers = users.filter((user: FitCenterUserProfile) => {
    const isEnrolled = classItem.registeredParticipantsIds?.includes(user.id);
    const isInWaitlist = classItem.waitlistParticipantsIds?.includes(user.id);
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return !isEnrolled && !isInWaitlist && matchesSearch;
  });

  const handleCancelClass = async () => {
    if (!onCancelClass) return;

    setIsLoading(true);
    try {
      await onCancelClass(classItem.id);
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
      const response = await fetch(`/api/classes/${classItem.id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        // Actualizar el store localmente
        const updatedClassItem = {
          ...classItem,
          notes: notes,
        };

        // Aquí normalmente actualizarías el store global
        console.log("Notas guardadas para la clase:", classItem.id);

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
    try {
      console.log(
        "Intentando agregar estudiante:",
        userId,
        "a la clase:",
        classItem.id
      );

      // Si es una clase generada dinámicamente, primero crearla en la base de datos
      let classId = classItem.id;
      if (classItem.id.startsWith("gen_")) {
        console.log("Clase generada detectada, creando clase real...");

        const createResponse = await fetch("/api/classes/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: classItem.dateTime.split("T")[0],
            endDate: classItem.dateTime.split("T")[0],
            disciplineId: classItem.disciplineId,
            instructorId: "inst_default", // Usar instructor por defecto
            time: classItem.dateTime.split("T")[1].substring(0, 5),
            maxCapacity: classItem.capacity || 15,
          }),
        });

        if (createResponse.ok) {
          const createResult = await createResponse.json();
          classId = createResult.classes[0].id; // Usar el ID de la clase creada
          console.log("Clase creada con ID:", classId);
        } else {
          console.error("Error al crear clase:", await createResponse.json());
          return;
        }
      }

      // Llamada a la API para agregar estudiante
      const response = await fetch(`/api/classes/${classId}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      console.log("Respuesta de la API:", response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log("Resultado exitoso:", result);

        // Actualizar el store localmente para reflejar el cambio inmediatamente
        const updatedClassItem = {
          ...classItem,
          id: classId, // Actualizar el ID si se creó una nueva clase
          registeredParticipantsIds: [
            ...(classItem.registeredParticipantsIds || []),
            userId,
          ],
        };

        // Actualizar el store global
        // Aquí deberías actualizar el store de clases
        console.log("Estudiante agregado:", userId, "a la clase:", classId);

        // Limpiar el término de búsqueda para mostrar el cambio
        setSearchTerm("");

        // Recargar los datos de la clase para reflejar los cambios
        // En producción, esto actualizaría el store global
      } else {
        const errorData = await response.json();
        console.error("Error al agregar estudiante:", errorData);
      }
    } catch (error) {
      console.error("Error al agregar estudiante:", error);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle className="text-3xl">
              {classItem.name} {formattedTime}
            </DrawerTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <span>{formattedDate}</span>
              <span>•</span>
              <span>{classItem.instructor}</span>
              <span>•</span>
              <Users className="w-4 h-4" />
              <span>
                {enrolledStudents.length}/{classItem.capacity || "∞"} inscritos
              </span>
            </div>
          </DrawerHeader>

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
                  {availableUsers.slice(0, 15).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddStudent(user.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

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
                      <span className="text-sm text-green-600">✓ Guardado</span>
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
                <h3 className="font-medium mb-2">Política de Cancelación</h3>
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
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              {classItem.status !== "cancelled" && (
                <Button
                  variant="destructive"
                  onClick={handleCancelClass}
                  disabled={isLoading}
                >
                  {isLoading ? "Cancelando..." : "Cancelar Clase"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
