"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import { calcularClasesSegunDuracion } from "@/lib/utils";
import type { MembershipPlan } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Calendar,
  Users,
  Settings,
  Search,
} from "lucide-react";

const emptyPlan: Omit<MembershipPlan, "id" | "organizationId"> = {
  name: "",
  description: "",
  price: 0,
  durationInMonths: 1,
  classLimit: 8,
  disciplineAccess: "all",
  allowedDisciplines: [],
  canFreeze: false, // Campo mantenido para compatibilidad pero no usado
  freezeDurationDays: 0, // Campo mantenido para compatibilidad pero no usado
  autoRenews: true, // Mantenemos el campo pero no lo mostramos en la UI
  isActive: true,
};

// Opciones de duración predefinidas
const durationOptions = [
  { value: 0.5, label: "Quincenal (15 días)" },
  { value: 1, label: "Mensual (1 mes)" },
  { value: 3, label: "Trimestral (3 meses)" },
  { value: 6, label: "Semestral (6 meses)" },
  { value: 12, label: "Anual (12 meses)" },
];

export default function PlansManager() {
  const {
    plans,
    addPlan,
    updatePlan,
    deletePlan,
    fetchPlans,
    disciplines,
    createPlan,
    updatePlanById,
  } = useBlackSheepStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);

  // Estados para gestión de planes
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planForm, setPlanForm] =
    useState<Omit<MembershipPlan, "id" | "organizationId">>(emptyPlan);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("todos");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await fetchPlans(
          1,
          50,
          searchTerm,
          activeFilter !== "todos" ? activeFilter : ""
        );
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchPlans, searchTerm, activeFilter]);

  // --- Gestión de planes ---
  const handleNewPlan = () => {
    setPlanForm(emptyPlan);
    setEditingPlan(null);
    setShowPlanModal(true);
  };

  const handleEditPlan = (plan: MembershipPlan) => {
    setPlanForm({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      durationInMonths: plan.durationInMonths,
      classLimit: plan.classLimit,
      disciplineAccess: plan.disciplineAccess,
      allowedDisciplines: plan.allowedDisciplines,
      canFreeze: plan.canFreeze, // Campo mantenido para compatibilidad pero no usado
      freezeDurationDays: plan.freezeDurationDays, // Campo mantenido para compatibilidad pero no usado
      autoRenews: plan.autoRenews, // Mantenemos el campo pero no lo mostramos en la UI
      isActive: plan.isActive,
    });
    setEditingPlan(plan.id);
    setShowPlanModal(true);
  };

  const handleDeletePlan = (id: string) => {
    setPlanToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePlan = () => {
    if (planToDelete) {
      deletePlan(planToDelete);

      // Refrescar la lista después de eliminar
      fetchPlans(
        1,
        50,
        searchTerm,
        activeFilter !== "todos" ? activeFilter : ""
      );

      setShowDeleteModal(false);
      setPlanToDelete(null);
      toast({
        title: "Plan eliminado",
        description: "El plan se ha eliminado correctamente",
      });
    }
  };

  const handlePlanChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let val: any = value;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      val = e.target.checked;
    } else if (type === "number") {
      val = Number(value);
    }
    setPlanForm((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setPlanForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDiscipline = (disciplineId: string) => {
    setPlanForm((prev) => {
      const isSelected = prev.allowedDisciplines.includes(disciplineId);
      const newAllowedDisciplines = isSelected
        ? prev.allowedDisciplines.filter((id) => id !== disciplineId)
        : [...prev.allowedDisciplines, disciplineId];

      return {
        ...prev,
        allowedDisciplines: newAllowedDisciplines,
        disciplineAccess:
          newAllowedDisciplines.length === 0 ? "all" : "limited",
      };
    });
  };

  // Calcular clases totales según duración
  const clasesTotales = calcularClasesSegunDuracion(
    planForm.classLimit,
    planForm.durationInMonths
  );

  const handleSavePlan = async () => {
    if (!planForm.name || !planForm.price) {
      toast({
        title: "Error",
        description: "Nombre y precio son requeridos",
        variant: "destructive",
      });
      return;
    }

    if (editingPlan) {
      // Actualizar plan existente
      const result = await updatePlanById(editingPlan, planForm);
      if (result) {
        toast({
          title: "Plan actualizado",
          description: "El plan se ha actualizado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "Error al actualizar el plan",
          variant: "destructive",
        });
      }
    } else {
      // Crear nuevo plan
      const result = await createPlan(planForm);
      if (result) {
        toast({
          title: "Plan agregado",
          description: "El plan se ha agregado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "Error al agregar el plan",
          variant: "destructive",
        });
      }
    }

    // Refrescar la lista después de agregar/editar
    fetchPlans(1, 50, searchTerm, activeFilter !== "todos" ? activeFilter : "");

    setShowPlanModal(false);
    setPlanForm(emptyPlan);
    setEditingPlan(null);
  };

  return (
    <div className="space-y-6">
      {/* Header con gestión de planes */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Planes de Membresía</h2>
          <p className="text-muted-foreground">
            Administra los planes de membresía disponibles para los usuarios
          </p>
        </div>
        <Button onClick={handleNewPlan}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Plan
        </Button>
      </div>

      {/* Filtros de búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="true">Activo</SelectItem>
            <SelectItem value="false">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de planes */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          // Skeleton simplificado para cards de planes
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <div className="flex gap-1">
                    <Skeleton className="w-8 h-8 rounded" />
                    <Skeleton className="w-8 h-8 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : !plans || plans.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  No hay planes configurados
                </p>
                <Button onClick={handleNewPlan}>
                  <Plus className="w-4 h-4 mr-2" /> Crear primer plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          plans?.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {!plan.isActive && (
                      <Badge variant="secondary" className="ml-2">
                        Inactivo
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.description}
                  </p>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Duración</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.durationInMonths === 0.5
                        ? "Quincenal"
                        : plan.durationInMonths === 1
                        ? "1 mes"
                        : `${plan.durationInMonths} meses`}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Clases</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.classLimit === 0
                        ? "Ilimitadas"
                        : `${calcularClasesSegunDuracion(
                            plan.classLimit,
                            plan.durationInMonths
                          )} clases totales`}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Precio</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${plan.price.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {plan.disciplineAccess === "all"
                          ? "Todas las disciplinas"
                          : "Disciplinas limitadas"}
                      </Badge>
                    </div>

                    {plan.disciplineAccess === "limited" &&
                      plan.allowedDisciplines &&
                      plan.allowedDisciplines.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">
                            Disciplinas incluidas:
                          </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {plan.allowedDisciplines.map((disciplineId) => {
                              const discipline = disciplines?.find(
                                (d) => d.id === disciplineId
                              );
                              if (!discipline) return null;

                              return (
                                <Badge
                                  key={disciplineId}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  <span
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{
                                      background: discipline.color || "#ccc",
                                    }}
                                  />
                                  {discipline.name}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal para crear/editar plan */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Editar Plan" : "Nuevo Plan"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Información básica - 3 campos en una columna */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Nombre del Plan</Label>
                <Input
                  name="name"
                  value={planForm.name}
                  onChange={handlePlanChange}
                  placeholder="Ej: Básico, Premium, VIP"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  name="description"
                  value={planForm.description}
                  onChange={handlePlanChange}
                  placeholder="Descripción del plan"
                />
              </div>
              <div>
                <Label>Precio</Label>
                <Input
                  name="price"
                  type="number"
                  value={planForm.price}
                  onChange={handlePlanChange}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            {/* Reglas - 2 columnas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Reglas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Duración</Label>
                  <Select
                    value={planForm.durationInMonths.toString()}
                    onValueChange={(value) => {
                      setPlanForm((prev) => ({
                        ...prev,
                        durationInMonths: Number(value),
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona la duración" />
                    </SelectTrigger>
                    <SelectContent>
                      {durationOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Límite de Clases por Mes</Label>
                  <Input
                    name="classLimit"
                    type="number"
                    value={planForm.classLimit}
                    onChange={handlePlanChange}
                    placeholder="0 = ilimitado"
                    min="0"
                  />
                  {planForm.classLimit > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total para{" "}
                      {planForm.durationInMonths === 0.5
                        ? "quincena"
                        : `${planForm.durationInMonths} mes${
                            planForm.durationInMonths !== 1 ? "es" : ""
                          }`}
                      : {clasesTotales} clases
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Acceso a disciplinas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">
                  Acceso a todas las disciplinas
                </Label>
                <Switch
                  checked={planForm.disciplineAccess === "all"}
                  onCheckedChange={(checked) => {
                    setPlanForm((prev) => ({
                      ...prev,
                      disciplineAccess: checked ? "all" : "limited",
                      allowedDisciplines: checked
                        ? []
                        : prev.allowedDisciplines,
                    }));
                  }}
                />
              </div>

              {planForm.disciplineAccess === "limited" && (
                <div className="space-y-3">
                  <Label className="text-sm text-muted-foreground">
                    Selecciona las disciplinas incluidas en este plan:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {disciplines
                      .filter((d) => d.isActive)
                      .map((discipline) => (
                        <Badge
                          key={discipline.id}
                          variant={
                            planForm.allowedDisciplines.includes(discipline.id)
                              ? "default"
                              : "outline"
                          }
                          className={`cursor-pointer ${
                            planForm.allowedDisciplines.includes(discipline.id)
                              ? "bg-blue-500 text-white"
                              : "hover:bg-blue-50"
                          }`}
                          onClick={() => toggleDiscipline(discipline.id)}
                        >
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{
                              background: discipline.color || "#ccc",
                            }}
                          />
                          {discipline.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Configuraciones adicionales */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Plan activo</Label>
                  <p className="text-sm text-muted-foreground">
                    Los usuarios pueden suscribirse a este plan
                  </p>
                </div>
                <Switch
                  checked={planForm.isActive}
                  onCheckedChange={(checked) => {
                    setPlanForm((prev) => ({
                      ...prev,
                      isActive: checked,
                    }));
                  }}
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSavePlan}
                className="bg-green-600 hover:bg-green-700"
              >
                Guardar
              </Button>
              <Button variant="outline" onClick={() => setShowPlanModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar plan */}
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
              ¿Estás seguro de que quieres eliminar este plan? Esta acción no se
              puede deshacer.
            </p>
            <p className="text-sm text-red-600 font-medium">
              Los usuarios con este plan activo no se verán afectados
              inmediatamente.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={confirmDeletePlan}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setPlanToDelete(null);
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
