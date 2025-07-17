"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBlackSheepStore } from "../../../lib/blacksheep-store";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import type { PendingRenewalRequest } from "../../../lib/types";
import { useToast } from "../../../components/ui/use-toast";
import { useErrorHandler } from "../../../lib/hooks/useErrorHandler";
import { Banknote, CreditCard, ArrowLeft } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "contado", name: "Contado", icon: Banknote },
  { id: "transferencia", name: "Transferencia", icon: Banknote },
  { id: "debito", name: "Débito", icon: CreditCard },
  { id: "credito", name: "Crédito", icon: CreditCard },
];

export default function RenewPlanPage() {
  const router = useRouter();
  const { users, membershipPlans, requestPlanRenewal, fetchUsers, fetchPlans } =
    useBlackSheepStore();
  const { toast } = useToast();
  const { handleAsyncError } = useErrorHandler();

  // Demo: usar el primer usuario (Antonia)
  const currentUser =
    users.find((u) => u.id === "usr_antonia_abc123") || users[0];

  // Debug logs
  console.log("RenewPlanPage - Debug Info:", {
    usersCount: users?.length || 0,
    membershipPlansCount: membershipPlans?.length || 0,
    currentUser: currentUser?.id,
    requestPlanRenewalExists: typeof requestPlanRenewal === "function",
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!users || users.length === 0) {
          await fetchUsers();
        }
        if (!membershipPlans || membershipPlans.length === 0) {
          await fetchPlans();
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Error al cargar los datos necesarios",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [users, membershipPlans, fetchUsers, fetchPlans, toast]);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    currentUser?.membership.planId || ""
  );
  const [selectedPayment, setSelectedPayment] = useState<
    PendingRenewalRequest["requestedPaymentMethod"] | null
  >(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [renewalStep, setRenewalStep] = useState<
    "idle" | "processing" | "completing"
  >("idle");

  const selectedPlan = membershipPlans?.find((p) => p.id === selectedPlanId);

  // Show skeleton loading state if data is not ready
  if (!currentUser || !membershipPlans || membershipPlans.length === 0) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <header className="p-4 border-b border-zinc-700 bg-black">
          <div className="w-10 h-10 bg-zinc-800 rounded-full animate-pulse"></div>
        </header>
        <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
          <div className="space-y-6">
            {/* Title skeleton */}
            <div className="h-9 bg-zinc-800 rounded animate-pulse w-64"></div>

            {/* Plan selection skeleton */}
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="h-8 bg-zinc-800 rounded animate-pulse w-40 mb-4"></div>
              <div className="p-4 border rounded-lg bg-zinc-800 animate-pulse">
                <div className="h-6 bg-zinc-700 rounded w-32 mb-2"></div>
                <div className="h-4 bg-zinc-700 rounded w-24"></div>
              </div>
            </div>

            {/* Payment method skeleton */}
            <div className="bg-zinc-900 p-4 rounded-lg">
              <div className="h-8 bg-zinc-800 rounded animate-pulse w-48 mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 border rounded-lg bg-zinc-800 animate-pulse"
                  >
                    <div className="h-5 bg-zinc-700 rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Button skeleton */}
            <div className="pt-4">
              <div className="h-11 bg-zinc-800 rounded animate-pulse w-full"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleConfirmRenewal = async () => {
    // Validación de datos requeridos
    if (!currentUser) {
      toast({
        title: "Error de usuario",
        description: "No se pudo identificar el usuario actual.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPlanId) {
      toast({
        title: "Selecciona un plan",
        description: "Debes seleccionar un plan antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPayment) {
      toast({
        title: "Selecciona método de pago",
        description: "Debes seleccionar un método de pago antes de continuar.",
        variant: "destructive",
      });
      return;
    }

    // Validar que el plan seleccionado existe y está activo
    const selectedPlanDetails = membershipPlans?.find(
      (p) => p.id === selectedPlanId
    );
    if (!selectedPlanDetails || !selectedPlanDetails.isActive) {
      toast({
        title: "Plan no disponible",
        description: "El plan seleccionado no está disponible.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRenewalStep("processing");

    try {
      console.log("Requesting renewal:", {
        userId: currentUser.id,
        planId: selectedPlanId,
        paymentMethod: selectedPayment,
      });

      await requestPlanRenewal(currentUser.id, selectedPlanId, selectedPayment);

      // Cambiar a estado de completando
      setRenewalStep("completing");

      // Obtener detalles del método de pago para el toast
      const paymentMethod = PAYMENT_METHODS.find(
        (m) => m.id === selectedPayment
      );

      toast({
        title: "¡Solicitud enviada exitosamente!",
        description: `Plan: ${selectedPlanDetails.name} - ${formatPrice(
          selectedPlanDetails.price
        )} | Pago: ${paymentMethod?.name || selectedPayment}`,
        variant: "default",
      });

      // Redirigir después de un breve delay
      setTimeout(() => {
        router.push("/app");
      }, 1500);
    } catch (error) {
      console.error("Error requesting renewal:", error);

      // Manejo de errores más específico
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud de renovación";

      toast({
        title: "Error al procesar solicitud",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <header className="p-4 border-b border-zinc-700 bg-black">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full bg-white/10 "
        >
          <ArrowLeft className="w-5 h-5 text-white hover:text-black" />
        </Button>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Renovar Membresía</h1>
          {/* Selección de Plan */}
          <div className="bg-zinc-900 p-4 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">
              1. Elige tu Plan
            </h2>

            {!isChangingPlan && selectedPlan ? (
              <div className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                <div>
                  <p className="font-bold">{selectedPlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(selectedPlan.price)} / mes
                  </p>
                </div>
                <Button
                  variant="link"
                  onClick={() => setIsChangingPlan(true)}
                  className="underline"
                >
                  Cambiar plan
                </Button>
              </div>
            ) : (
              <RadioGroup
                value={selectedPlanId}
                onValueChange={(id) => {
                  setSelectedPlanId(id);
                  setIsChangingPlan(false);
                }}
                className="space-y-2"
              >
                {(membershipPlans || [])
                  .filter((p) => p.isActive)
                  .map((plan) => (
                    <Label
                      key={plan.id}
                      htmlFor={plan.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 has-[:checked]:bg-lime-100 has-[:checked]:border-lime-500 has-[:checked]:shadow-md transition-all duration-200"
                    >
                      <div>
                        <p className="font-bold">{plan.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">
                          {formatPrice(plan.price)}
                        </span>
                        <RadioGroupItem value={plan.id} id={plan.id} />
                      </div>
                    </Label>
                  ))}
              </RadioGroup>
            )}
          </div>
          {/* Selección de Método de Pago */}
          <div className="bg-zinc-900 p-4 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">
              2. Elige tu Forma de Pago
            </h2>

            <div>
              <RadioGroup
                value={selectedPayment || ""}
                onValueChange={(value) =>
                  setSelectedPayment(
                    value as PendingRenewalRequest["requestedPaymentMethod"]
                  )
                }
                className="grid grid-cols-2 gap-4"
              >
                {PAYMENT_METHODS.map((method) => (
                  <Label
                    key={method.id}
                    htmlFor={`payment-${method.id}`}
                    className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-100 has-[:checked]:bg-lime-100 has-[:checked]:border-lime-500 has-[:checked]:shadow-md transition-all duration-200"
                  >
                    <RadioGroupItem
                      value={method.id}
                      id={`payment-${method.id}`}
                    />
                    <method.icon className="w-5 h-5 text-muted-foreground " />
                    <span className="font-medium">{method.name}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>
          </div>
          {/* Botón de Confirmación */}
          <div className="pt-4">
            <Button
              size="lg"
              className="w-full bg-lime-500 hover:bg-lime-600 text-black disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedPlanId || !selectedPayment || isLoading}
              onClick={handleConfirmRenewal}
            >
              {renewalStep === "processing" ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Renovando plan...
                </div>
              ) : renewalStep === "completing" ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Renovación en curso
                </div>
              ) : (
                "Solicitar Renovación"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Tu solicitud será enviada al administrador para su aprobación.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
