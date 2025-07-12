"use client";

import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { initialMembershipPlans } from "@/lib/mock-data";

interface ConfirmationStepProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    selectedPlan: string;
    paymentMethod: string;
  };
  onContinue: () => void;
  isLoading: boolean;
}

export function ConfirmationStep({
  formData,
  onContinue,
  isLoading,
}: ConfirmationStepProps) {
  const selectedPlan = initialMembershipPlans.find(
    (plan) => plan.id === formData.selectedPlan
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
      cash: "Contado",
      transfer: "Transferencia",
      credit: "Crédito",
      debit: "Débito",
    };
    return methods[method] || method;
  };

  const finalPrice = selectedPlan?.price || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">¡Registro completado!</h2>
        <p className="text-gray-400">
          Verifica el pago con tu coach para habilitar el plan.
        </p>
      </div>

      {/* Confirmation Summary */}
      <div className="bg-gray-800 p-6 rounded-lg border border-zinc-700 space-y-4">
        <h3 className="font-semibold text-white">Resumen de tu registro:</h3>
        <div className="space-y-2 text-sm">
          <p className="text-gray-300">
            <span className="text-gray-400">Nombre:</span> {formData.firstName}{" "}
            {formData.lastName}
          </p>
          <p className="text-gray-300">
            <span className="text-gray-400">Email:</span> {formData.email}
          </p>
          <p className="text-gray-300">
            <span className="text-gray-400">Plan:</span> {selectedPlan?.name} -{" "}
            {formatPrice(finalPrice)}
            <span className="text-gray-400"> (mensual)</span>
          </p>
          <p className="text-gray-300">
            <span className="text-gray-400">Pago:</span>{" "}
            {getPaymentMethodName(formData.paymentMethod)}
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs text-black font-bold">!</span>
          </div>
          <div>
            <h4 className="text-yellow-400 font-semibold text-sm">
              Validación pendiente
            </h4>
            <p className="text-yellow-200 text-sm mt-1">
              Una vez estes validado podrás agendar tus clases en la app.
            </p>
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <Button
        onClick={onContinue}
        disabled={isLoading}
        className="w-full h-14 text-lg bg-green-600 hover:bg-green-700"
      >
        {isLoading ? "Finalizando..." : "Ir a la app"}
      </Button>
    </div>
  );
}
