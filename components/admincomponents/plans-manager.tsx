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
import { useBlackSheepStore } from "@/lib/blacksheep-store";
import { useToast } from "@/components/ui/use-toast";
import type { MembershipPlan } from "@/lib/types";
import {
  Plus,
  Edit,
  Trash2,
  CreditCard,
  Calendar,
  Users,
  Snowflake,
  Settings,
} from "lucide-react";

const emptyPlan: Omit<MembershipPlan, "id" | "organizationId"> = {
  name: "",
  description: "",
  price: 0,
  durationInMonths: 1,
  classLimit: 8,
  disciplineAccess: "all",
  allowedDisciplines: [],
  canFreeze: false,
  freezeDurationDays: 0,
  autoRenews: true,
  isActive: true,
};

export default function PlansManager() {
  const { plans, addPlan, updatePlan, deletePlan, fetchPlans } =
    useBlackSheepStore();
  const { toast } = useToast();

  // Estados para gestión de planes
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planForm, setPlanForm] =
    useState<Omit<MembershipPlan, "id" | "organizationId">>(emptyPlan);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

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
      canFreeze: plan.canFreeze,
      freezeDurationDays: plan.freezeDurationDays,
      autoRenews: plan.autoRenews,
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

  const handleSavePlan = () => {
    if (!planForm.name || !planForm.price) {
      toast({
        title: "Error",
        description: "Nombre y precio son requeridos",
        variant: "destructive",
      });
      return;
    }

    if (editingPlan) {
      updatePlan({
        ...planForm,
        id: editingPlan,
        organizationId: "org_default",
      });
      toast({
        title: "Plan actualizado",
        description: "El plan se ha actualizado correctamente",
      });
    } else {
      addPlan({
        ...planForm,
        id: `plan_${Date.now()}`,
        organizationId: "org_default",
      });
      toast({
        title: "Plan agregado",
        description: "El plan se ha agregado correctamente",
      });
    }

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

      {/* Lista de planes */}
      <div className="grid grid-cols-1 gap-4">
        {plans.length === 0 ? (
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
          plans.map((plan) => (
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Duración</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.durationInMonths} mes
                      {plan.durationInMonths !== 1 ? "es" : ""}
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
                        : `${plan.classLimit} al mes`}
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

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Congelación</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {plan.canFreeze
                        ? `${plan.freezeDurationDays} días`
                        : "No disponible"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {plan.disciplineAccess === "all"
                        ? "Todas las disciplinas"
                        : "Disciplinas limitadas"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {plan.autoRenews
                        ? "Renovación automática"
                        : "Renovación manual"}
                    </Badge>
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
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="md:col-span-2">
                <Label>Descripción</Label>
                <Input
                  name="description"
                  value={planForm.description}
                  onChange={handlePlanChange}
                  placeholder="Descripción del plan"
                />
              </div>
            </div>

            {/* Configuración de duración y clases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Duración (meses)</Label>
                <Input
                  name="durationInMonths"
                  type="number"
                  value={planForm.durationInMonths}
                  onChange={handlePlanChange}
                  min="1"
                  max="12"
                />
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
              </div>
            </div>

            {/* Configuración de acceso y congelación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Acceso a Disciplinas</Label>
                <Select
                  value={planForm.disciplineAccess}
                  onValueChange={(value) =>
                    handleSelectChange("disciplineAccess", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las disciplinas</SelectItem>
                    <SelectItem value="limited">
                      Disciplinas limitadas
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Días de Congelación</Label>
                <Input
                  name="freezeDurationDays"
                  type="number"
                  value={planForm.freezeDurationDays}
                  onChange={handlePlanChange}
                  min="0"
                  placeholder="0 = no disponible"
                />
              </div>
            </div>

            {/* Configuraciones adicionales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="canFreeze"
                  name="canFreeze"
                  checked={planForm.canFreeze}
                  onChange={handlePlanChange}
                  className="rounded"
                />
                <Label htmlFor="canFreeze">Permitir congelación</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRenews"
                  name="autoRenews"
                  checked={planForm.autoRenews}
                  onChange={handlePlanChange}
                  className="rounded"
                />
                <Label htmlFor="autoRenews">Renovación automática</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={planForm.isActive}
                  onChange={handlePlanChange}
                  className="rounded"
                />
                <Label htmlFor="isActive">Plan activo</Label>
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
