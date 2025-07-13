"use client";

import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import type { FitCenterUserProfile } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Clock, MapPin, AlertTriangle } from "lucide-react";

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

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <span>{classItem.name}</span>
              <Badge
                variant={
                  classItem.status === "cancelled" ? "destructive" : "default"
                }
              >
                {classItem.status === "cancelled" ? "Cancelada" : "Programada"}
              </Badge>
            </DrawerTitle>
            <DrawerDescription>
              Detalles completos de la clase
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-6 space-y-6">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Información de la Clase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{formattedDate}</p>
                      <p className="text-sm text-muted-foreground">
                        {formattedTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {enrolledStudents.length}/{classItem.capacity || "∞"}
                      </p>
                      <p className="text-sm text-muted-foreground">Inscritos</p>
                    </div>
                  </div>
                </div>

                {classItem.instructor && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Instructor</p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.instructor}
                      </p>
                    </div>
                  </div>
                )}

                {classItem.notes && (
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Notas</p>
                      <p className="text-sm text-muted-foreground">
                        {classItem.notes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reglas de cancelación */}
                {applicableCancellationRule && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Política de Cancelación</p>
                      <p className="text-sm text-muted-foreground">
                        Se puede cancelar hasta{" "}
                        {applicableCancellationRule.hoursBefore} horas antes de
                        la clase
                        {applicableCancellationRule.description && (
                          <span className="block mt-1 text-xs text-blue-600">
                            💡 {applicableCancellationRule.description}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Regla de cancelación por defecto si no hay regla específica */}
                {!applicableCancellationRule && discipline && (
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Política de Cancelación</p>
                      <p className="text-sm text-muted-foreground">
                        Política general de la disciplina aplica
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alumnos inscritos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Alumnos Inscritos</CardTitle>
              </CardHeader>
              <CardContent>
                {enrolledStudents.length > 0 ? (
                  <div className="space-y-2">
                    {enrolledStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2 border rounded"
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
                  <p className="text-muted-foreground text-center py-4">
                    No hay alumnos inscritos
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Lista de espera */}
            {waitlistStudents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lista de Espera</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {waitlistStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <p className="font-medium">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {student.email}
                          </p>
                        </div>
                        <Badge variant="secondary">En espera</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
