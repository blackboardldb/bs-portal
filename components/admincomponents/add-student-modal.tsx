"use client";

import type React from "react";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FitCenterUserProfile, MembershipPlan } from "@/lib/types";
import {
  calcularFechaTerminoMembresia,
  calcularClasesSegunDuracion,
} from "@/lib/utils";
import { MembershipDatePicker } from "./membership-date-picker";

interface AddStudentModalProps {
  onAddStudent: (student: Omit<FitCenterUserProfile, "id">) => void;
  onEditStudent?: (
    id: string,
    updates: Omit<FitCenterUserProfile, "id">
  ) => void;
  plans: MembershipPlan[];
  onClose?: () => void;
  initialStudent?: FitCenterUserProfile;
}

// Función helper para crear el objeto studentData
const createStudentData = (
  formData: {
    name: string;
    email: string;
    phone: string;
    emergencyContact?: string;
    notes?: string;
    formaDePago?: "contado" | "transferencia" | "debito" | "credito";
    joinDate: string;
    nextPayment: string;
  },
  selectedPlan: MembershipPlan,
  initialStudent?: FitCenterUserProfile
): Omit<FitCenterUserProfile, "id"> => {
  return {
    firstName: formData.name.split(" ")[0] || "",
    lastName: formData.name.split(" ").slice(1).join(" ") || "",
    email: formData.email,
    phone: formData.phone,
    dateOfBirth: undefined,
    gender: undefined,
    avatarId: "avatar_default",
    address: undefined,
    emergencyContact: formData.emergencyContact,
    notes: formData.notes,
    formaDePago: formData.formaDePago,
    membership: {
      id: initialStudent?.membership?.id || `mem_${Date.now()}`,
      organizationId: "org_blacksheep_001",
      organizationName: "BlackSheep CrossFit",
      status: "active",
      membershipType: selectedPlan.name,
      monthlyPrice: selectedPlan.price,
      startDate: formData.joinDate,
      currentPeriodStart: formData.joinDate,
      currentPeriodEnd: formData.nextPayment,
      planConfig: {
        classLimit: selectedPlan.classLimit,
        disciplineAccess: selectedPlan.disciplineAccess,
        allowedDisciplines: selectedPlan.allowedDisciplines,
        canFreeze: selectedPlan.canFreeze,
        freezeDurationDays: selectedPlan.freezeDurationDays,
        autoRenews: selectedPlan.autoRenews,
      },
      centerConfig: {
        allowCancellation: true,
        cancellationHours: 2,
        maxBookingsPerDay: 2,
        autoWaitlist: false,
      },
      centerStats: {
        currentMonth: {
          classesAttended: 0,
          classesContracted: calcularClasesSegunDuracion(
            selectedPlan.classLimit,
            selectedPlan.durationInMonths
          ),
          remainingClasses: calcularClasesSegunDuracion(
            selectedPlan.classLimit,
            selectedPlan.durationInMonths
          ),
          noShows: 0,
          lastMinuteCancellations: 0,
        },
        totalMonthsActive: 0,
        memberSince: formData.joinDate,
        lifetimeStats: {
          totalClasses: 0,
          totalNoShows: 0,
          averageMonthlyAttendance: 0,
          bestMonth: { month: "N/A", year: 0, count: 0 },
        },
      },
    },
    globalPreferences: {},
    globalStats: {},
  };
};

export function AddStudentModal({
  onAddStudent,
  onEditStudent,
  plans = [],
  onClose,
  initialStudent,
}: AddStudentModalProps) {
  // El modal se abre cuando el usuario hace clic en el trigger o cuando se pasa initialStudent
  const [open, setOpen] = useState(false);

  const createInitialFormData = (student?: FitCenterUserProfile) => ({
    name: student ? `${student.firstName} ${student.lastName}` : "",
    email: student?.email || "",
    phone: student?.phone || "",
    status: student?.membership?.status || "active",
    joinDate:
      student?.membership?.currentPeriodStart ||
      new Date().toISOString().split("T")[0],
    lastPayment:
      student?.membership?.currentPeriodStart ||
      new Date().toISOString().split("T")[0],
    nextPayment: student?.membership?.currentPeriodEnd || "",
    emergencyContact: student?.emergencyContact || "",
    notes: student?.notes || "",
    planId: student?.membership?.planId || "",
    formaDePago: student?.formaDePago || "contado",
    role: student?.role || "user",
  });

  const [formData, setFormData] = useState(
    createInitialFormData(initialStudent)
  );

  // Flag para saber si el usuario editó manualmente el campo de último pago
  const [lastPaymentTouched, setLastPaymentTouched] = useState(false);

  // Ref para guardar el valor anterior de joinDate
  const prevJoinDateRef = useRef(formData.joinDate);

  // Buscar el objeto plan real (MembershipPlan)
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === formData.planId),
    [plans, formData.planId]
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setFormData(createInitialFormData(initialStudent));
      setLastPaymentTouched(false);
    }
  }, [open, initialStudent]);

  // Open modal when initialStudent is provided (for editing)
  useEffect(() => {
    if (initialStudent) {
      setOpen(true);
    }
  }, [initialStudent]);

  // Función explícita para manejar cambios de fecha de inicio
  const handleJoinDateChange = useCallback(
    (newDate: string) => {
      if (!selectedPlan) return;

      // const newEndDate = calcularFechaTerminoMembresia(
      const newEndDate = calcularFechaTerminoMembresia(
        newDate,
        selectedPlan.durationInMonths
      );

      setFormData((prev) => {
        const updatedData = {
          ...prev,
          joinDate: newDate,
          nextPayment: newEndDate,
        };

        // Si el último pago no ha sido tocado manualmente, se sincroniza con la fecha de inicio
        if (!lastPaymentTouched) {
          updatedData.lastPayment = newDate;
        }

        return updatedData;
      });

      // Actualizar la ref del joinDate anterior
      prevJoinDateRef.current = newDate;
    },
    [selectedPlan, lastPaymentTouched]
  );

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      // Si estamos en modo edición, llamar a onClose
      if (initialStudent) {
        onClose?.();
      }
      // Resetear el formulario si no hay initialStudent
      if (!initialStudent) {
        setFormData(createInitialFormData());
        setLastPaymentTouched(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !selectedPlan) {
      return;
    }

    // const studentData = createStudentData(
    const studentData = createStudentData(
      formData,
      selectedPlan,
      initialStudent
    );

    if (initialStudent && onEditStudent) {
      onEditStudent(initialStudent.id, studentData);
    } else {
      onAddStudent(studentData);
    }

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!initialStudent && (
        <DialogTrigger asChild>
          <Button variant="default" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Alumno
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {initialStudent ? "Editar Alumno" : "Agregar Alumno"}
          </DialogTitle>
          <DialogDescription>
            {initialStudent
              ? "Edita la información del alumno."
              : "Completa la información para agregar un nuevo alumno."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1234567890"
                  required
                />
              </div>
              {plans.length > 0 && (
                <div>
                  <Label htmlFor="plan">Plan *</Label>
                  <Select
                    value={formData.planId}
                    onValueChange={(value) => {
                      setFormData((prev) => ({ ...prev, planId: value }));
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price} /{" "}
                          {plan.durationInMonths === 0.5
                            ? "quincena"
                            : plan.durationInMonths === 1
                            ? "mes"
                            : plan.durationInMonths + " meses"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="formaDePago">Forma de Pago</Label>
                <Select
                  value={formData.formaDePago}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      formaDePago: value as
                        | "contado"
                        | "transferencia"
                        | "debito"
                        | "credito",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contado">Contado</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Componente de fechas de membresía */}
            <MembershipDatePicker
              selectedPlan={selectedPlan}
              value={formData.joinDate}
              onValueChange={handleJoinDateChange}
            />

            <div>
              <Label htmlFor="lastPayment">Último Pago</Label>
              <Input
                id="lastPayment"
                type="date"
                value={formData.lastPayment}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    lastPayment: e.target.value,
                  }));
                  setLastPaymentTouched(true);
                }}
              />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Se actualiza automáticamente con la fecha de inicio, pero
                puedes editarlo manualmente
              </p>
            </div>

            <div>
              <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
              <Input
                id="emergencyContact"
                value={formData.emergencyContact}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    emergencyContact: e.target.value,
                  }))
                }
                placeholder="Nombre - Teléfono"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notas adicionales sobre el alumno..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: value as "admin" | "coach" | "user",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Alumno</SelectItem>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t mt-4 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {initialStudent ? "Guardar Cambios" : "Agregar Alumno"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
