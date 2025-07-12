"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBlackSheepStore } from "../../../lib/blacksheep-store";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../../../components/ui/radio-group";
import type { PendingRenewalRequest } from "../../../lib/types";
import { useToast } from "../../../components/ui/use-toast";
import { Banknote, CreditCard, ArrowLeft } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "contado", name: "Contado", icon: Banknote },
  { id: "transferencia", name: "Transferencia", icon: Banknote },
  { id: "debito", name: "Débito", icon: CreditCard },
  { id: "credito", name: "Crédito", icon: CreditCard },
];

export default function RenewPlanPage() {
  const router = useRouter();
  const { users, membershipPlans, requestPlanRenewal } = useBlackSheepStore();
  const { toast } = useToast();

  // Demo: usar el primer usuario (Antonia)
  const currentUser =
    users.find((u) => u.id === "usr_antonia_abc123") || users[0];

  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    currentUser?.membership.planId || ""
  );
  const [selectedPayment, setSelectedPayment] = useState<
    PendingRenewalRequest["requestedPaymentMethod"] | null
  >(null);
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const selectedPlan = membershipPlans.find((p) => p.id === selectedPlanId);

  const handleConfirmRenewal = async () => {
    if (!currentUser || !selectedPlanId || !selectedPayment) {
      toast({
        title: "Selecciona un plan y método de pago",
        description: "Debes seleccionar ambos antes de continuar.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);

    try {
      await requestPlanRenewal(currentUser.id, selectedPlanId, selectedPayment);

      // Obtener detalles del plan y método de pago para el toast
      const planDetails = membershipPlans.find((p) => p.id === selectedPlanId);
      const paymentMethod = PAYMENT_METHODS.find(
        (m) => m.id === selectedPayment
      );

      toast({
        title: "Solicitud enviada",
        description: `Plan: ${planDetails?.name} - ${formatPrice(
          planDetails?.price || 0
        )} | Pago: ${paymentMethod?.name}`,
        variant: "default",
      });
      setTimeout(() => {
        router.push("/app");
      }, 1000);
    } catch (error) {
      console.error("Error requesting renewal:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar la solicitud de renovación",
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
                {membershipPlans
                  .filter((p) => p.isActive)
                  .map((plan) => (
                    <Label
                      key={plan.id}
                      htmlFor={plan.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 has-[:checked]:bg-blue-200 has-[:checked]:border-blue-500"
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
                    className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer bg-white hover:bg-gray-100 has-[:checked]:bg-blue-300 has-[:checked]:border-blue-500"
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
              className="w-full bg-lime-500 hover:bg-lime-600 text-black"
              disabled={!selectedPlanId || !selectedPayment || isLoading}
              onClick={handleConfirmRenewal}
            >
              {isLoading ? "Procesando..." : "Solicitar Renovación"}
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
