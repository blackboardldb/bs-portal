"use client";

import { useState, useEffect, useMemo, useCallback, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { initialMembershipPlans } from "@/lib/mock-data";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembershipDatePicker } from "@/components/admincomponents/membership-date-picker";
import { ArrowLeft, Save, CalendarDays, History, Dumbbell } from "lucide-react";
import type { FitCenterUserProfile, MembershipPlan } from "@/lib/types";
import { calcularFechaTerminoMembresia, calcularClasesSegunDuracion } from "@/lib/utils";

// Helper function to create the student data object (adapted from AddStudentModal)
const createStudentData = (
  formData: any,
  selectedPlan: MembershipPlan,
  initialStudent?: FitCenterUserProfile
): Omit<FitCenterUserProfile, "id"> => {
  return {
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    ...(formData.emergencyContact && { emergencyContact: formData.emergencyContact }),
    ...(formData.notes && { notes: formData.notes }),
    ...(formData.formaDePago && { formaDePago: formData.formaDePago }),
    avatarId: initialStudent?.avatarId || "avatar_default",
    role: "user",
    membership: {
      id: initialStudent?.membership?.id || `mem_${Date.now()}`,
      organizationId: "org_blacksheep_001",
      organizationName: "BlackSheep CrossFit",
      status: formData.status as any,
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
          classesAttended: initialStudent?.membership?.centerStats?.currentMonth?.classesAttended || 0,
          classesContracted: calcularClasesSegunDuracion(selectedPlan.classLimit, selectedPlan.durationInMonths),
          remainingClasses: initialStudent?.membership?.centerStats?.currentMonth?.remainingClasses || calcularClasesSegunDuracion(selectedPlan.classLimit, selectedPlan.durationInMonths),
          noShows: initialStudent?.membership?.centerStats?.currentMonth?.noShows || 0,
          lastMinuteCancellations: initialStudent?.membership?.centerStats?.currentMonth?.lastMinuteCancellations || 0,
        },
        totalMonthsActive: initialStudent?.membership?.centerStats?.totalMonthsActive || 0,
        memberSince: initialStudent?.membership?.centerStats?.memberSince || formData.joinDate,
        lifetimeStats: {
          totalClasses: initialStudent?.membership?.centerStats?.lifetimeStats?.totalClasses || 0,
          totalNoShows: initialStudent?.membership?.centerStats?.lifetimeStats?.totalNoShows || 0,
          averageMonthlyAttendance: initialStudent?.membership?.centerStats?.lifetimeStats?.averageMonthlyAttendance || 0,
          bestMonth: initialStudent?.membership?.centerStats?.lifetimeStats?.bestMonth || { month: "N/A", year: 0, count: 0 },
        },
      },
    },
    globalPreferences: initialStudent?.globalPreferences || {},
    globalStats: initialStudent?.globalStats || {},
  };
};

export default function StudentEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { users, fetchUsers, updateUserById } = useBlackSheepStore();

  const [student, setStudent] = useState<FitCenterUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState<any>(null);
  const [lastPaymentTouched, setLastPaymentTouched] = useState(false);
  const prevJoinDateRef = useRef("");

  useEffect(() => {
    const loadStudent = async () => {
      let currentUsers = users;
      if (!currentUsers || currentUsers.length === 0) {
        await fetchUsers(1, 100);
        currentUsers = useBlackSheepStore.getState().users;
      }
      
      const found = currentUsers.find((u) => u.id === resolvedParams.id);
      if (found) {
        setStudent(found);
        setFormData({
          firstName: found.firstName || "",
          lastName: found.lastName || "",
          email: found.email || "",
          phone: found.phone || "",
          status: found.membership?.status || "active",
          joinDate: found.membership?.currentPeriodStart || new Date().toISOString().split("T")[0],
          lastPayment: found.membership?.currentPeriodStart || new Date().toISOString().split("T")[0],
          nextPayment: found.membership?.currentPeriodEnd || "",
          emergencyContact: found.emergencyContact || "",
          notes: found.notes || "",
          planId: found.membership?.planId || initialMembershipPlans[0].id,
          formaDePago: found.formaDePago || "contado",
          role: found.role || "user",
        });
        prevJoinDateRef.current = found.membership?.currentPeriodStart || new Date().toISOString().split("T")[0];
      }
      setIsLoading(false);
    };
    loadStudent();
  }, [resolvedParams.id, users, fetchUsers]);

  const selectedPlan = useMemo(
    () => initialMembershipPlans.find((p) => p.id === formData?.planId),
    [formData?.planId]
  );

  const handleJoinDateChange = useCallback(
    (newDate: string) => {
      if (!selectedPlan) return;
      const newEndDate = calcularFechaTerminoMembresia(newDate, selectedPlan.durationInMonths);

      setFormData((prev: any) => {
        const updatedData = { ...prev, joinDate: newDate, nextPayment: newEndDate };
        if (!lastPaymentTouched) {
          updatedData.lastPayment = newDate;
        }
        return updatedData;
      });
      prevJoinDateRef.current = newDate;
    },
    [selectedPlan, lastPaymentTouched]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !student || !selectedPlan) return;

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({ title: "Error", description: "Completa los campos obligatorios", variant: "destructive" });
      return;
    }

    const studentData = createStudentData(formData, selectedPlan, student);
    const result = await updateUserById(student.id, studentData);

    if (result) {
      toast({ title: "Alumno guardado", description: "Los cambios se aplicaron exitosamente" });
      router.push("/admin/alumnos");
    } else {
      toast({ title: "Error al guardar", description: "No se pudo modificar el perfil", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-8">Cargando perfil del alumno...</div>;
  if (!student || !formData) return <div className="p-8">Alumno no encontrado.</div>;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/admin/alumnos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">
          Perfil de {student.firstName} {student.lastName}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Lado Izquierdo: Formulario Principal de Edición */}
        <Card>
          <CardHeader>
            <CardTitle>Editar Información</CardTitle>
            <CardDescription>Datos personales y de facturación</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Apellido *</Label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Teléfono *</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">Membresía</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan *</Label>
                  <Select
                    value={formData.planId}
                    onValueChange={(value) => setFormData({ ...formData, planId: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {initialMembershipPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - ${plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pago</Label>
                  <Select
                    value={formData.formaDePago}
                    onValueChange={(value) => setFormData({ ...formData, formaDePago: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contado">Contado</SelectItem>
                      <SelectItem value="transferencia">Transferencia</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <MembershipDatePicker
                selectedPlan={selectedPlan!}
                value={formData.joinDate}
                onValueChange={handleJoinDateChange}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Último Pago</Label>
                  <Input
                    type="date"
                    value={formData.lastPayment}
                    onChange={(e) => {
                      setFormData({ ...formData, lastPayment: e.target.value });
                      setLastPaymentTouched(true);
                    }}
                  />
                </div>
                <div>
                  <Label>Estado de Membresía</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                      <SelectItem value="frozen">Congelado</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="expired">Expirado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Contacto de Emergencia</Label>
                <Input
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> Guardar Perfil
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lado Derecho: Pestañas de Historial, Próximas Clases y Clases Consumidas */}
        <div className="space-y-6">
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Resumen Operativo</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="proximas">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="proximas">Próximas</TabsTrigger>
                  <TabsTrigger value="consumidas">Asistidas</TabsTrigger>
                  <TabsTrigger value="historial">Planes</TabsTrigger>
                </TabsList>
                
                {/* Próximas Clases */}
                <TabsContent value="proximas" className="mt-4 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-blue-50/50 p-4 border rounded-md">
                    <CalendarDays className="h-4 w-4 text-blue-500" />
                    El alumno tiene reservadas clases futuras.
                  </div>
                  <div className="space-y-3">
                    {/* Data mockeada visualmente ya que la DB actual no trackea históricamente por usuario aisladamente de manera sencilla */}
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium text-sm">CrossFit - WOD</p>
                        <p className="text-xs text-muted-foreground">Próximo Lunes • 18:00 hrs</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-500">Cancelar</Button>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md">
                      <div>
                        <p className="font-medium text-sm">Weightlifting</p>
                        <p className="text-xs text-muted-foreground">Próximo Jueves • 19:30 hrs</p>
                      </div>
                      <Button variant="outline" size="sm" className="text-red-500">Cancelar</Button>
                    </div>
                  </div>
                </TabsContent>

                {/* Clases Consumidas */}
                <TabsContent value="consumidas" className="mt-4 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-green-50/50 p-4 border rounded-md">
                    <Dumbbell className="h-4 w-4 text-green-500" />
                    Este mes ha consumido {student.membership?.centerStats?.currentMonth?.classesAttended || 2} de sus {selectedPlan?.classLimit || 0} clases.
                  </div>
                  <div className="space-y-3 opacity-80">
                    <div className="flex justify-between items-center p-3 border rounded-md bg-zinc-50">
                      <div>
                        <p className="font-medium text-sm line-through">Funcional - AM</p>
                        <p className="text-xs text-muted-foreground">Hace 2 días • Asistió</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 border rounded-md bg-zinc-50">
                      <div>
                        <p className="font-medium text-sm line-through">CrossFit - WOD</p>
                        <p className="text-xs text-muted-foreground">La semana pasada • Asistió</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Historial de Planes contratados */}
                <TabsContent value="historial" className="mt-4 space-y-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground bg-zinc-50 p-4 border rounded-md">
                    <History className="h-4 w-4 text-zinc-500" />
                    Registro de anualidad y compras previas.
                  </div>
                  <div className="space-y-4">
                     <div className="relative pl-4 border-l-2 border-primary space-y-1">
                        <div className="absolute w-2 h-2 bg-primary rounded-full -left-[5px] top-1.5" />
                        <p className="text-sm font-medium">{selectedPlan?.name || "Plan Básico"}</p>
                        <p className="text-xs text-muted-foreground">Vigente desde: {student.membership?.currentPeriodStart}</p>
                     </div>
                     <div className="relative pl-4 border-l-2 border-zinc-200 space-y-1 opacity-60">
                        <div className="absolute w-2 h-2 bg-zinc-300 rounded-full -left-[5px] top-1.5" />
                        <p className="text-sm font-medium">Plan Suspendido</p>
                        <p className="text-xs text-muted-foreground">Período: Enero 2025 - Febrero 2025</p>
                     </div>
                  </div>
                </TabsContent>

              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
